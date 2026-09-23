import { defineComponent, h } from "vue";
import { useAuiContext } from "../../Context";
import { sendMessage } from "./sendMessage";

export default defineComponent({
    name: "ChatContent.Composer.Input",
    setup(_props, { attrs }) {
        const { store, aui } = useAuiContext();

        return () => {
            return h("textarea", {
                ...attrs,
                class: ["aui-composer-input", attrs.class].filter(Boolean).join(" "),
                value: store.composerValue,
                onInput: (e: Event) => {
                    store.composerValue = (e.target as HTMLTextAreaElement).value;
                },
                onKeydown: (e: KeyboardEvent) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        sendMessage(aui, store);
                    }
                },
            });
        };
    },
});
