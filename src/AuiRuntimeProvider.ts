import type { AdapterType } from "../types/adapter";
import { defineComponent, Fragment, h, provide, type PropType } from "vue";
import { AuiPage } from "@auipage/core";
import type { Tool } from "@auipage/core";
import { createAuiStore } from "./store";
import { makeRuntimes } from "./runtime";
import { AuiContextKey } from "./Context";
import type { VueTool } from "./defineTool";

export default defineComponent({
    name: "AuiRuntimeProvider",
    props: {
        adapter: {
            type: Object as PropType<AdapterType>,
            required: true,
        },
        tools: {
            type: Array as PropType<VueTool[]>,
            default: () => [],
        },
    },
    emits: {},
    setup(props, { slots }) {
        // 每次 Provider 创建独立的 store + runtime 实例，多 Provider 隔离
        const store = createAuiStore();
        const runtime = makeRuntimes(store, props.tools);

        // core 的 Tool 类型把 render 描述为异步函数，此处 render 实际是 Vue 组件；
        // 运行时 core 只做字段透传，因此这里做一次结构转换
        const aui = new AuiPage({
            adapter: props.adapter,
            runtime,
            tools: props.tools as unknown as Tool[],
        });

        provide(AuiContextKey, { store, aui });

        // 对齐 React 的 Context.Provider：不渲染任何外层 DOM
        return () => h(Fragment, null, slots.default?.());
    },
});
