import { defineComponent, h, Fragment } from "vue";
import { useMessageContext } from "./MessageContext";
import type { ChatContentPart } from "../store";

/**
 * 消息片段渲染
 * 自动从 MessageContext 拿到当前 message，遍历其 parts：
 * - 提供默认作用域插槽 → 逐个 part 调插槽，作用域为 { part }
 * - 未提供插槽 → 默认渲染：text/loading/thinking 输出文本，tool-call 不显示
 *
 * 每个片段补 key（tool-call 用稳定 id），保证原地 phase 切换时组件不重挂。
 * 外层 span 自动挂 data-role = user / assistant
 */
export default defineComponent({
    name: "ChatContent.Parts",
    setup(_props, { slots, attrs }) {
        const { message } = useMessageContext();

        return () => {
            const children: any[] = [];

            for (let i = 0; i < message.parts.length; i++) {
                const p: ChatContentPart = message.parts[i];
                const key = p.type === "tool-call" ? p.id : i;

                // 作用域插槽：交由使用方自定义渲染（keyed Fragment，不额外套 DOM）
                if (slots.default) {
                    children.push(h(Fragment, { key }, slots.default({ part: p })));
                    continue;
                }

                // 默认渲染：仅处理带 text 的片段
                if ("text" in p) {
                    children.push(
                        h(
                            "span",
                            {
                                key,
                                class: [
                                    "aui-chat-content-part",
                                    `aui-chat-content-part-${p.type}`,
                                ]
                                    .filter(Boolean)
                                    .join(" "),
                            },
                            p.text
                        )
                    );
                }
            }

            return h(
                "span",
                {
                    ...attrs,
                    class: ["aui-chat-content-parts", attrs.class]
                        .filter(Boolean)
                        .join(" "),
                    "data-role": message.role,
                },
                children
            );
        };
    },
});
