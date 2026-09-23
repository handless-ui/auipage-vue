import { defineComponent, h } from "vue";

export default defineComponent({
    name: "ThreadList.Root",
    setup(_props, { slots, attrs }) {
        return () => {
            return h(
                "div",
                {
                    ...attrs,
                    class: ["aui-thread-list-root", attrs.class].filter(Boolean).join(" "),
                },
                slots.default?.()
            );
        };
    },
});
