import { defineComponent, h } from "vue";
import { useThreadListItem } from "../ItemContext";
import { useAuiContext } from "../../Context";

export default defineComponent({
    name: "ThreadList.Item.Archive",
    setup(_props, { slots, attrs }) {
        const { thread } = useThreadListItem();
        const { aui } = useAuiContext();

        return () => {
            return h(
                "button",
                {
                    ...attrs,
                    type: "button",
                    class: ["aui-item-archive", attrs.class].filter(Boolean).join(" "),
                    onClick: (e: MouseEvent) => {
                        e.preventDefault();
                        aui.archiveThread(thread.threadId);
                    },
                },
                slots.default?.()
            );
        };
    },
});
