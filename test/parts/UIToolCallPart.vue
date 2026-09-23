<template>
    <span
        class="aui-chat-content-part aui-tool-call"
        :data-phase="part.phase"
    >
        <span class="aui-tool-call-header">
            <span class="aui-tool-call-name">{{ part.name }}</span>
            <span class="aui-tool-call-args">入参：{{ argsText }}</span>
        </span>

        <span class="aui-tool-call-body">
            <span v-if="part.phase === 'pending'" class="aui-tool-call-running">
                运行中…
            </span>

            <span v-else-if="part.phase === 'result'" class="aui-tool-call-result">
                结果：{{ formatValue(part.result) }}
            </span>

            <component
                :is="part.render"
                v-else-if="part.phase === 'executing' && part.render"
                v-bind="renderProps"
            />
        </span>
    </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ToolCallPart } from "@auipage/vue";

const props = defineProps<{ part: ToolCallPart }>();

/** 把任意值格式化为可读文本 */
function formatValue(value: unknown): string {
    if (value === void 0) return "";
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.message || String(value);
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

/** 入参展示：空对象时给个占位 */
const argsText = computed(() => {
    const text = formatValue(props.part.args);
    return text && text !== "{}" ? text : "无";
});

/** 传给工具 render 组件的 props */
const renderProps = computed(() => ({
    args: props.part.args,
    result: props.part.result,
    status: props.part.status,
    uiResult: props.part.uiResult,
    uiStatus: props.part.uiStatus,
    call: props.part.call,
}));
</script>
