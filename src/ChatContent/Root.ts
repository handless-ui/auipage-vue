import { defineComponent, h } from "vue";

export default defineComponent({
    name: "ChatContent.Root",
    setup(_props, { slots, attrs }) {
        return () => {
            return h(
                "div",
                {
                    ...attrs,
                    class: ["aui-chat-content-root", attrs.class].filter(Boolean).join(" "),
                },
                slots.default?.()
            );
        };
    },
});
