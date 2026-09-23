import { defineComponent, h, watch, nextTick, ref as vueRef, computed } from "vue";
import { useAuiContext } from "../Context";

export default defineComponent({
    name: "ChatContent.Viewport",
    setup(_props, { slots, attrs }) {
        const { store } = useAuiContext();
        const elRef = vueRef<HTMLElement | null>(null);

        // 消息数量变化 → 新消息追加
        const messageCount = computed(() => store.messages.length);
        // 所有 parts 文本总长度 → 流式对话中 text 增量
        const textLength = computed(() =>
            store.messages.reduce(
                (acc, m) =>
                    acc +
                    m.parts.reduce((a, p) => a + ("text" in p ? p.text.length : 0), 0),
                0
            )
        );

        const scrollToBottom = () => {
            nextTick(() => {
                const el = elRef.value;
                if (!el) return;
                // 只有滚动条出现时才滚到底
                if (el.scrollHeight > el.clientHeight) {
                    el.scrollTop = el.scrollHeight;
                }
            });
        };

        watch(messageCount, scrollToBottom);
        watch(textLength, scrollToBottom);

        return () => {
            return h(
                "div",
                {
                    ...attrs,
                    ref: elRef,
                    class: ["aui-chat-content-viewport", attrs.class].filter(Boolean).join(" "),
                },
                slots.default?.()
            );
        };
    },
});
