import { defineComponent, h } from "vue";
import { useAuiContext } from "../../Context";
import { sendMessage } from "./sendMessage";

export default defineComponent({
    name: "ChatContent.Composer.Send",
    setup(_props, { slots, attrs }) {
        const { store, aui } = useAuiContext();

        return () => {
            // 必须在 render 内读取，才能被 reactive 追踪，发送中自动禁用
            const isExecuting = store.isExecuting;
            const attrsDisabled = attrs.disabled !== undefined && attrs.disabled !== false;
            return h(
                "button",
                {
                    ...attrs,
                    type: "button",
                    disabled: attrsDisabled || isExecuting,
                    "data-disabled": isExecuting || undefined,
                    class: ["aui-composer-send", attrs.class].filter(Boolean).join(" "),
                    onClick: (e: MouseEvent) => {
                        e.preventDefault();
                        sendMessage(aui, store);
                    },
                },
                slots.default?.() ?? "发送"
            );
        };
    },
});
