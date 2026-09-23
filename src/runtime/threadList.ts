import { ThreadListRuntime } from "@auipage/core";
import type { AuiStore } from "../store";

/**
 * 生成 core ThreadListRuntime 的 Vue 版实现
 * 所有回调直接操作 reactive store，Vue 自动触发组件响应式更新
 */
export function makeThreadListRuntime(store: AuiStore) {
    return new ThreadListRuntime({
        init(threads: any[]) {
            store.threads = (threads || []).map((t) => ({
                threadId: t.threadId,
                title: t.title,
                status: t.status || "regular",
            }));
        },

        append(thread: any) {
            // 对齐 React 版：头部添加（最新的在最上面）
            store.threads.unshift({
                threadId: thread.threadId,
                title: thread.title,
                status: thread.status || "regular",
            });
        },

        active(threadId: string | undefined) {
            store.activeThreadId = threadId;
        },

        delete(threadId: string) {
            const idx = store.threads.findIndex((t) => t.threadId === threadId);
            if (idx >= 0) store.threads.splice(idx, 1);
            if (store.activeThreadId === threadId) store.activeThreadId = undefined;
        },

        archive(threadId: string) {
            const t = store.threads.find((x) => x.threadId === threadId);
            if (t) t.status = "archived";
        },

        unarchive(threadId: string) {
            const t = store.threads.find((x) => x.threadId === threadId);
            if (t) t.status = "regular";
        },
    });
}
