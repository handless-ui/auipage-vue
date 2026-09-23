import { ChatContentRuntime } from "@auipage/core";
import type {
    AuiStore,
    ChatContentPart,
    ChatMessage,
    ToolCallPart,
} from "../store";
import type { VueTool } from "../defineTool";

/**
 * 把 core 的 ContentPart（历史消息里的原始片段）转成 Vue 层统一的 ChatContentPart
 * 逻辑和 React 版一致，差异仅在 tool-call 按 ui / 查表还原
 *
 * @param toolsByName 前端工具注册表（name → tool），历史回读时用它找回 render 组件
 */
function toChatContentPart(
    raw: any,
    toolsByName: Record<string, VueTool>
): ChatContentPart {
    switch (raw.type) {
        case "text":
        case "loading":
        case "thinking":
            return { type: raw.type, text: raw.text || "" };

        case "tool-call": {
            // 持久化结构里，有 render 的工具额外带 ui: { status, result }
            const hasUi =
                raw.ui &&
                (raw.ui.status === "success" || raw.ui.status === "error");
            const render = toolsByName[raw.name]?.render;

            // render 组件仍可用 → 还原为只读 executing 形态：无 call，用 uiResult 展示
            if (hasUi && render) {
                return {
                    type: "tool-call",
                    id: raw.id ?? raw.name,
                    name: raw.name,
                    args: raw.args,
                    phase: "executing",
                    status: raw.status,
                    result: raw.result,
                    render,
                    uiResult: raw.ui.result,
                    uiStatus: raw.ui.status,
                };
            }

            // 工具已下线（查不到组件）或本来就是无 render 工具 → 统一结果卡片
            return {
                type: "tool-call",
                id: raw.id ?? raw.name,
                name: raw.name,
                args: raw.args,
                phase: "result",
                status: hasUi ? raw.ui.status : raw.status,
                result: hasUi ? raw.ui.result : raw.result,
            };
        }

        default:
            // 兜底：未知 type，原样塞进 parts（type 字段保留）
            return raw as ChatContentPart;
    }
}

/** 生成消息 id */
function genMessageId() {
    return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 把一个 part 追加到消息列表：
 * 最后一条同 role 消息则并入其 parts，否则新建 message。
 * 深 reactive 直接 push 即可触发更新。
 */
function pushMessagePart(
    store: AuiStore,
    role: "user" | "assistant",
    part: ChatContentPart
): string {
    const last = store.messages[store.messages.length - 1];
    if (last && last.role === role) {
        last.parts.push(part);
        return last.id;
    }
    const id = genMessageId();
    store.messages.push({ id, role, parts: [part] });
    return id;
}

/** 按 tool-call id 找到对应 part */
function locateToolCall(
    store: AuiStore,
    id: string
): ToolCallPart | null {
    for (const message of store.messages) {
        for (const part of message.parts) {
            if (part.type === "tool-call" && part.id === id) {
                return part;
            }
        }
    }
    return null;
}

/**
 * 生成 core ChatContentRuntime 的 Vue 版实现
 * 把 core 的命令式回调（init/append + stream）翻译成 reactive store 的变更
 *
 * tool-call 设计：一个 id 对应一个 part，phase 在同一 part 上原地切换
 * （深 reactive，直接 mutate 属性即可）
 * - pending：运行中
 * - executing：挂载 render 组件，stream 返回 Promise 挂起 core 的 await，
 *   组件调用 call(result) 后 resolve；随后 core 第二次回调写入 uiResult
 * - result：后端工具 / 无 render 前端工具结束，展示 result
 */
export function makeChatContentRuntime(store: AuiStore, tools: VueTool[] = []) {
    const toolsByName: Record<string, VueTool> = {};
    for (const tool of tools) {
        toolsByName[tool.description.function.name] = tool;
    }

    return new ChatContentRuntime({
        // 初始化历史消息
        init(messages: any[]) {
            const mapped: ChatMessage[] = [];
            (messages || []).forEach((m, i) => {
                // 硬约束：loading 片段不进入历史渲染
                const parts = (m.content || [])
                    .filter((c: any) => c.type !== "loading")
                    .map((c: any) => toChatContentPart(c, toolsByName));
                // 过滤后为空的消息直接丢弃，避免空气泡
                if (parts.length) {
                    mapped.push({
                        id: `init-${i}`,
                        role: m.role as "user" | "assistant",
                        parts,
                    });
                }
            });
            store.messages = mapped;
        },

        // 追加消息
        append(role: string, content: any): any {
            const narrowedRole: "user" | "assistant" =
                role === "assistant" ? "assistant" : "user";

            // text / loading / thinking：并入最后一条同 role 消息，返回文本累积 stream
            if (
                content.type === "text" ||
                content.type === "loading" ||
                content.type === "thinking"
            ) {
                const part = toChatContentPart(content, toolsByName);
                const targetId = pushMessagePart(store, narrowedRole, part);

                return (delta: string) => {
                    const msg = store.messages.find((m) => m.id === targetId);
                    if (!msg) return;
                    const lastPart = msg.parts[msg.parts.length - 1] as {
                        text: string;
                    };
                    lastPart.text = (lastPart.text || "") + delta;
                };
            }

            // tool-call：初始必然是 pending，先建 part，后续靠 stream 原地改
            if (content.type === "tool-call") {
                const initialPart: ToolCallPart = {
                    type: "tool-call",
                    id: content.id,
                    name: content.name,
                    args: content.args,
                    phase: "pending",
                    status: "pending",
                };
                pushMessagePart(store, narrowedRole, initialPart);

                // stream：按工具走向原地 mutate 这一个 part
                return (data: any) => {
                    const callId: string = data.id ?? content.id;
                    const target = locateToolCall(store, callId);
                    if (!target) return undefined;

                    const terminal =
                        data.status === "success" || data.status === "error";

                    // 1) 进入 executing：data 同时带 render + execute 的 status/result
                    //    返回 Promise 挂起 core，等组件 call(result)
                    if (data.render) {
                        let resolveFn!: (r: unknown) => void;
                        const waiting = new Promise<unknown>((res) => {
                            resolveFn = res;
                        });
                        target.phase = "executing";
                        target.status = data.status;
                        target.result = data.result;
                        target.render = data.render;
                        target.call = (r: unknown) => resolveFn(r);
                        return waiting;
                    }

                    // 2) render 工具的交互结果回调（无 render 字段、终态）：
                    //    记录 uiResult 后保持 executing，render 组件继续保留在页面
                    if (terminal && target.phase === "executing") {
                        target.uiResult = data.result;
                        target.uiStatus = data.status;
                        target.call = undefined;
                        return undefined;
                    }

                    // 3) 后端工具 / 无 render 前端工具结束：pending → result
                    if (terminal) {
                        target.phase = "result";
                        target.status = data.status;
                        target.result = data.result;
                        return undefined;
                    }

                    return undefined;
                };
            }

            // 兜底
            const part = toChatContentPart(content, toolsByName);
            pushMessagePart(store, narrowedRole, part);
            return undefined;
        },
    });
}
