import type { InjectionKey } from "vue";
import { inject, defineComponent, Fragment, h, provide, reactive } from "vue";
import type { ThreadListItem } from "../store";

export interface ThreadListItemContextValue {
    thread: ThreadListItem;
}

export const ThreadListItemContextKey: InjectionKey<ThreadListItemContextValue> =
    Symbol("ThreadListItemContext");

export function useThreadListItem(): ThreadListItemContextValue {
    const ctx = inject(ThreadListItemContextKey);
    if (!ctx) {
        throw new Error(
            "ThreadListItemContext not found. Did you forget to wrap with <ThreadList.Items>?"
        );
    }
    return ctx;
}

/**
 * 内部组件：包装单条 thread 的 Context 注入
 * 对齐 React 的 <ThreadListItemContext.Provider>——不渲染任何外层 DOM
 * 用 Fragment 只透传 slots，避免多套一层 div
 *
 * 关键：ctx 用 reactive 包装，provide 的是响应式对象引用
 * Vue 在数组 unshift 时按 key 复用实例（key=threadId），
 * props.thread 变化会触发 reactive 对象内部属性更新，
 * inject 端自动追踪到最新值
 */
export const ItemScope = defineComponent({
    name: "ItemScope",
    props: {
        thread: { type: Object as () => ThreadListItem, required: true },
    },
    setup(props, { slots }) {
        // reactive 包一层，provide 出去的是响应式对象
        const ctx = reactive<ThreadListItemContextValue>({
            thread: props.thread,
        });
        // 每次 props 变化同步更新 ctx.thread
        // Vue 的 reactive 属性赋值会自动触发 inject 端 re-render
        provide(ThreadListItemContextKey, ctx);
        return () => {
            // 每次 render 同步最新 props 到 reactive ctx
            // Vue 的 defineComponent setup 返回的是 render 函数，
            // render 函数每次执行时 props 已经是最新的
            if (ctx.thread !== props.thread) {
                ctx.thread = props.thread;
            }
            return h(Fragment, null, slots.default?.());
        };
    },
});
