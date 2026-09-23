import { defineComponent, h } from "vue";
import { useAuiContext } from "../Context";
import { MessageScope } from "./MessageContext";

export default defineComponent({
    name: "ChatContent.Messages",
    setup(_props, { slots, attrs }) {
        const { store } = useAuiContext();

        return () => {
            const msgs = store.messages;
            const children: any[] = [];
            for (let i = 0; i < msgs.length; i++) {
                // 关键：传 key 让 Vue 正确追踪每个 MessageScope 实例
                children.push(
                    h(MessageScope, {
                        key: msgs[i].id,
                        message: msgs[i],
                        index: i,
                        total: msgs.length,
                    }, () => slots.default?.({ message: msgs[i] }))
                );
            }
            return h(
                "div",
                {
                    ...attrs,
                    class: ["aui-chat-content-messages", attrs.class].filter(Boolean).join(" "),
                },
                children
            );
        };
    },
});
