import { defineComponent, h } from "vue";
import { useThreadListItem } from "../ItemContext";

export default defineComponent({
    name: "ThreadList.Item.Title",
    setup(_props, { slots, attrs }) {
        const { thread } = useThreadListItem();

        return () => {
            return h(
                "span",
                {
                    ...attrs,
                    class: ["aui-item-title", attrs.class].filter(Boolean).join(" "),
                },
                slots.default?.() ?? thread.title ?? "新会话"
            );
        };
    },
});
