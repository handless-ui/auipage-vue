import { defineComponent, h } from "vue";
import { useThreadListItem } from "../ItemContext";
import { useAuiContext } from "../../Context";

export default defineComponent({
    name: "ThreadList.Item.Root",
    setup(_props, { slots, attrs }) {
        const { thread } = useThreadListItem();
        const { store } = useAuiContext();

        return () => {
            const activeId = store.activeThreadId;
            return h(
                "div",
                {
                    ...attrs,
                    class: ["aui-item-root", attrs.class].filter(Boolean).join(" "),
                    "data-status": thread.status,
                    "data-active": activeId === thread.threadId || undefined,
                },
                slots.default?.()
            );
        };
    },
});
