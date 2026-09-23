import { defineComponent, h } from "vue";
import { useThreadListItem } from "../ItemContext";
import { useAuiContext } from "../../Context";

export default defineComponent({
    name: "ThreadList.Item.UnArchive",
    setup(_props, { slots, attrs }) {
        const { thread } = useThreadListItem();
        const { aui } = useAuiContext();

        return () => {
            return h(
                "button",
                {
                    ...attrs,
                    type: "button",
                    class: ["aui-item-unarchive", attrs.class].filter(Boolean).join(" "),
                    onClick: (e: MouseEvent) => {
                        e.preventDefault();
                        aui.unarchiveThread(thread.threadId);
                    },
                },
                slots.default?.()
            );
        };
    },
});
