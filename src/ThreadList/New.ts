import { defineComponent, h } from "vue";
import { useAuiContext } from "../Context";

export default defineComponent({
    name: "ThreadList.New",
    setup(_props, { slots, attrs }) {
        const { aui } = useAuiContext();

        return () => {
            return h(
                "button",
                {
                    ...attrs,
                    type: "button",
                    class: ["aui-thread-list-new", attrs.class].filter(Boolean).join(" "),
                    onClick: (e: MouseEvent) => {
                        e.preventDefault();
                        aui.newThread();
                    },
                },
                slots.default?.()
            );
        };
    },
});
