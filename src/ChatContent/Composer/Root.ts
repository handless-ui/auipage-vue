import { defineComponent, h } from "vue";

export default defineComponent({
    name: "ChatContent.Composer.Root",
    setup(_props, { slots, attrs }) {
        return () => {
            return h(
                "form",
                {
                    ...attrs,
                    class: ["aui-composer-root", attrs.class].filter(Boolean).join(" "),
                    onSubmit: (e: Event) => e.preventDefault(),
                },
                slots.default?.()
            );
        };
    },
});
