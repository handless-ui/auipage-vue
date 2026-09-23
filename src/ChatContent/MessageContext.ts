import type { InjectionKey } from "vue";
import { inject, defineComponent, Fragment, h, provide, reactive } from "vue";
import type { ChatMessage } from "../store";

export interface MessageContextValue {
    message: ChatMessage;
}

export const MessageContextKey: InjectionKey<MessageContextValue> =
    Symbol("MessageContext");

export function useMessageContext(): MessageContextValue {
    const ctx = inject(MessageContextKey);
    if (!ctx) {
        throw new Error(
            "MessageContext not found. Did you forget to wrap with <ChatContent.Messages>?"
        );
    }
    return ctx;
}

/**
 * 内部组件：包装单条 message 的 Context 注入
 * 对齐 React 的 <MessageContext.Provider>——不渲染任何外层 DOM
 * 用 Fragment 只透传 slots，避免多套一层 span
 */
export const MessageScope = defineComponent({
    name: "MessageScope",
    props: {
        message: { type: Object as () => ChatMessage, required: true },
    },
    setup(props, { slots }) {
        const ctx = reactive<MessageContextValue>({
            message: props.message,
        });
        provide(MessageContextKey, ctx);
        return () => {
            ctx.message = props.message;
            return h(Fragment, null, slots.default?.());
        };
    },
});
