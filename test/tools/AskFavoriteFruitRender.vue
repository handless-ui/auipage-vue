<template>
    <!-- 历史回读态：无 call，只读展示当时的选择 -->
    <span v-if="!call" class="fruit-picker-readonly">
        已选择：{{ uiResult }}
    </span>

    <!-- 实时态：用 execute 返回的 result 渲染水果按钮，点击后 call(水果名) 交还结果 -->
    <div v-else class="fruit-picker">
        <div class="fruit-picker-tip">请选择你喜欢的水果：</div>
        <div class="fruit-picker-options">
            <button v-for="fruit in fruits" :key="fruit" type="button" class="fruit-picker-btn" @click="call?.(fruit)">
                {{ fruit }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    args: { type: null, required: true },
    result: { type: null, default: undefined },
    status: { type: String, required: true },
    uiResult: { type: null, default: undefined },
    uiStatus: { type: String, default: undefined },
    call: { type: Function, default: undefined },
});

// execute 异常时兜底为空列表，避免渲染崩溃
const fruits = computed(() =>
    props.status === "success" && Array.isArray(props.result) ? props.result : []
);
</script>
