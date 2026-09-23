import { defineComponent, h } from "vue";
import { useAuiContext } from "../Context";
import { ItemScope } from "./ItemContext";

export default defineComponent({
    name: "ThreadList.Items",
    setup(_props, { slots, attrs }) {
        const { store } = useAuiContext();

        return () => {
            const children: any[] = [];
            for (const t of store.threads) {
                // 关键：传 key 让 Vue 正确追踪每个 ItemScope 实例
                // 不传 key 时 Vue 按 index 复用，unshift 后位置变化会导致数据错位
                children.push(
                    h(ItemScope, { key: t.threadId, thread: t }, () => slots.default?.({ thread: t }))
                );
            }
            return h(
                "div",
                {
                    ...attrs,
                    class: ["aui-thread-list-items", attrs.class].filter(Boolean).join(" "),
                },
                children
            );
        };
    },
});
