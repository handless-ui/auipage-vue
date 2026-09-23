import { defineComponent, h } from "vue";
import { useThreadListItem } from "../ItemContext";
import { useAuiContext } from "../../Context";

export default defineComponent({
    name: "ThreadList.Item.Trigger",
    setup(_props, { slots, attrs }) {
        const { thread } = useThreadListItem();
        const { aui } = useAuiContext();

        return () => {
            return h(
                "button",
                {
                    ...attrs,
                    type: "button",
                    class: ["aui-item-trigger", attrs.class].filter(Boolean).join(" "),
                    onClick: (e: MouseEvent) => {
                        e.preventDefault();
                        if (thread.status === "regular") {
                            aui.activeThread(thread.threadId);
                        }
                    },
                },
                slots.default?.()
            );
        };
    },
});
