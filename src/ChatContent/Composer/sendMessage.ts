import type { AuiStore } from "../../store";
import type { AuiPage } from "@auipage/core";

/**
 * 发送消息共享逻辑
 * 和 React 版一致：清空输入 → 调 aui.sendMessage → 维护 isExecuting
 */
export async function sendMessage(aui: AuiPage, store: AuiStore) {
    const text = store.composerValue.trim();
    if (!text || store.isExecuting) return;

    store.composerValue = "";

    // 构造 user message
    const message = {
        role: "user" as const,
        content: [{ type: "text", text }],
    };

    store.isExecuting = true;
    try {
        await aui.sendMessage(message);
    } catch (e) {
        // core 内部已经打印，这里不再处理
    } finally {
        store.isExecuting = false;
    }
}
