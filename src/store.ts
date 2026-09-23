import { reactive, type UnwrapNestedRefs } from "vue";
import type { Component } from "vue";
import type { ToolRenderProps } from "./defineTool";

/**
 * ChatContentPart 联合类型
 * 和 React 版保持完全一致，历史加载和实时对话统一走 toChatContentPart 转换
 */
export type ChatContentPart =
    | { type: "text"; text: string }
    | { type: "loading"; text: string }
    | { type: "thinking"; text: string }
    | ToolCallPart;

/**
 * 工具调用片段
 *
 * phase 语义：
 * - pending：工具已开始、尚未拿到 execute/后端结果（头部显示名称+入参，主体"运行中…"）
 * - executing：仅前端有 render 的工具；execute 已完成，挂载 render 组件
 * - result：后端工具 / 无 render 前端工具已结束，主体展示 result
 *
 * render/call 是非序列化的运行时引用：
 * - render：defineTool 提供、已 markRaw 的 Vue 组件
 * - call：仅实时 executing 时有值，调用后把结果交还 core（resolve 挂起的 Promise）
 *
 * uiResult/uiStatus 仅在历史回读时出现：持久化结构里 render 工具的最终结果
 * 存放在 ui 字段中，回读时用它驱动只读态的 render 组件。
 */
export interface ToolCallPart {
    type: "tool-call";
    /** tool-call 自身 id，作为 part 稳定 key */
    id: string;
    name: string;
    args: any;
    phase: "pending" | "executing" | "result";
    status: "pending" | "success" | "error";
    /** execute 的结果（前端工具）或后端返回的结果 */
    result?: any;
    /** 前端工具的渲染组件（已 markRaw） */
    render?: Component<ToolRenderProps>;
    /** 实时态：render 组件调用它交还结果 */
    call?: (result: unknown) => void;
    /** 历史回读：render 组件当时交还的结果 */
    uiResult?: unknown;
    /** 历史回读：render 交互的状态 */
    uiStatus?: "success" | "error";
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    parts: ChatContentPart[];
}

export interface ThreadListItem {
    threadId: string;
    title: string;
    status: "regular" | "archived";
}

export interface ComposerState {
    composerValue: string;
    isExecuting: boolean;
}

export interface AuiStoreState {
    messages: ChatMessage[];
    threads: ThreadListItem[];
    activeThreadId?: string;
    composerValue: string;
    isExecuting: boolean;
}

export type AuiStore = UnwrapNestedRefs<AuiStoreState>;

/**
 * 创建 Vue 版 reactive store
 * Vue 3 的 reactive 自动做深响应式，组件直接 store.messages / store.threads 访问即可自动追踪
 */
export function createAuiStore(): AuiStore {
    return reactive<AuiStoreState>({
        messages: [],
        threads: [],
        activeThreadId: undefined,
        composerValue: "",
        isExecuting: false,
    });
}
