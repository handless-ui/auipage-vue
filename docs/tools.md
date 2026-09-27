# 前端工具 defineTool

工具让智能体能够“动手做事”。按照执行位置，工具分两类：

- **后端工具**：完全在服务端执行（读文件、查数据库、调外部 API），页面只展示调用过程与结果，由 `ChatTransport` 的流式片段驱动。
- **前端工具**：在浏览器页面内执行，可以访问浏览器能力（本地时间、地理位置、剪贴板……），还可以通过 UI 与用户交互（弹窗选择、补充表单）。前端工具用本库提供的 `defineTool` 定义。

## defineTool 入参

```ts
defineTool({
    name: "getBrowserTime",          // 工具名，全局唯一，模型据此发起调用
    description: "获取浏览器本地时间", // 给模型看的功能说明，决定模型何时调用它
    parameters: {                    // 入参的 JSON Schema
        type: "object",
        properties: {},
        required: [],
    },
    execute(args) {                  // 页面侧执行函数，可同步或异步
        return new Date().toLocaleString();
    },
    render: MyComponent,             // 可选：交互渲染组件（Vue 组件）
});
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 工具名，对应模型工具描述中的 `function.name` |
| `description` | 是 | 给模型看的描述，写清“什么时候该用” |
| `parameters` | 是 | 入参 JSON Schema，无入参也要给出空的 object 结构 |
| `execute` | 否 | 页面侧执行函数，入参为模型解析出的参数；省略时按空执行兜底 |
| `render` | 否 | Vue 交互组件；缺省时 `execute` 的返回值就是最终工具结果 |

---

## 无 render 的工具：execute 的返回值即结果

适合“取个数据就返回”的场景。比如获取浏览器当前时间：

```ts
import { defineTool } from "@auipage/vue";

export default defineTool({
    name: "getBrowserTime",
    description: "获取当前浏览器所在设备的本地日期与时间",
    parameters: {
        type: "object",
        properties: {},
        required: [],
    },
    execute() {
        return new Date().toLocaleString();
    },
});
```

模型调用该工具后，核心在页面内执行 `execute`，拿到结果（或捕获到异常）后：把工具卡片从 `pending` 更新为结果态，并把结果通过 `ChatTransport.response("tool-result", ...)` 回传给后端，模型随后继续作答。

---

## 带 render 的工具：与用户交互

当工具的最终结果需要用户参与（选择、确认、填写）时，提供一个 `render` Vue 组件。典型流程：

1. 模型发起工具调用，核心先执行 `execute`（比如拉取候选列表）
2. 工具卡片进入 `executing`，挂载你的 `render` 组件，并把 `execute` 的结果交给它
3. 用户在组件中完成操作，组件调用 `call(result)` 交还结果
4. 核心把交互结果回传后端，卡片保留在页面上展示当时的选择

### render 组件的 props

实时态与历史回读态共用同一套 props，保证组件既能交互、又能只读回显：

```ts
interface ToolRenderProps {
    args: any;                        // 模型解析出的入参
    result?: any;                     // execute 的结果（异常时为错误对象）
    status: "pending" | "success" | "error"; // execute 的状态
    call?: (result: unknown) => void; // 【实时态】调用它交还结果、结束挂起
    uiResult?: unknown;               // 【历史回读】当时通过 call 交还的结果
    uiStatus?: "success" | "error";   // 【历史回读】交互状态
}
```

判断当前是哪种状态非常简单：**有 `call` 就是实时交互态，没有 `call` 就是历史只读态**。

### 示例：让用户选择喜欢的水果

工具定义：

```ts
import { defineTool } from "@auipage/vue";
import FruitPicker from "./FruitPicker.vue";

const FRUITS = ["苹果", "香蕉", "橙子", "葡萄", "西瓜"];

export default defineTool({
    name: "askFavoriteFruit",
    description:
        "当需要了解用户喜欢什么水果时使用，会弹窗询问用户并返回所选水果",
    parameters: {
        type: "object",
        properties: {},
        required: [],
    },
    execute() {
        // 实际项目里可以改为发请求获取候选列表
        return FRUITS;
    },
    render: FruitPicker,
});
```

render 组件：

```vue
<template>
    <!-- 历史回读态：无 call，只读展示当时的选择 -->
    <span v-if="!call" class="fruit-picker-readonly">
        已选择：{{ uiResult }}
    </span>

    <!-- 实时态：用 execute 返回的 result 渲染按钮，点击后 call(水果名) -->
    <div v-else class="fruit-picker">
        <div class="fruit-picker-tip">请选择你喜欢的水果：</div>
        <button
            v-for="fruit in fruits"
            :key="fruit"
            type="button"
            class="fruit-picker-btn"
            @click="call?.(fruit)"
        >
            {{ fruit }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    args: any;
    result?: any;
    status: "pending" | "success" | "error";
    call?: (result: unknown) => void;
    uiResult?: unknown;
    uiStatus?: "success" | "error";
}>();

// execute 异常或返回非数组时兜底为空列表，避免渲染崩溃
const fruits = computed(() =>
    props.status === "success" && Array.isArray(props.result)
        ? props.result
        : []
);
</script>
```

### 在工具卡片中挂载 render

`render` 组件不是凭空出现的，它由你在 `ChatContent.Parts` 插槽里渲染：当 `part.phase === "executing"` 且 `part.render` 存在时，用动态组件挂载，并把 part 上的字段作为 props 传入：

```vue
<component
    :is="part.render"
    v-if="part.phase === 'executing' && part.render"
    :args="part.args"
    :result="part.result"
    :status="part.status"
    :ui-result="part.uiResult"
    :ui-status="part.uiStatus"
    :call="part.call"
/>
```

完整的卡片写法（含 `pending` / `result` 两个阶段）见 [聊天视图 ChatContent](./chat-content.md)。

---

## 注册工具

把工具收集成数组，传给 `AuiRuntimeProvider` 的 `tools` 属性：

```ts
// tools/index.ts
import getBrowserTime from "./getBrowserTime";
import askFavoriteFruit from "./askFavoriteFruit";

export default [getBrowserTime, askFavoriteFruit];
```

```vue
<AuiRuntimeProvider :adapter="adapter" :tools="tools">
    <ChatContent />
    <ThreadList />
</AuiRuntimeProvider>
```

每个 Provider 拥有独立的 store 与工具注册表，多个 Provider 之间相互隔离。

---

## 结果流转全链路

以带交互的前端工具为例，一次完整调用的时序是：

1. 后端模型决定调用前端工具，流式推来 `tool-call` 片段：`status: "pending"`，并标记 **`caller: "frontend"`**（核心据此区分前端工具，`@auipage/agent` 的 `CreateTool` 会自动带上）
2. 页面先出现“运行中”卡片，核心执行 `execute(args)`，得到 `result` 与 `status`
3. 有 `render`：卡片切换为 `executing` 并挂载组件，核心在此**挂起等待**，直到组件调用 `call(uiResult)`
4. 核心调用 `ChatTransport.response("tool-result", { id, status, result })`，把最终结果回传后端，模型继续生成
5. 同时工具调用以持久化结构写入一轮历史；带 render 的工具额外保存 `ui: { status, result }`，供历史回读时还原

历史回读时，运行时按工具名找回 `render` 组件：找得到就还原为只读形态（无 `call`、用 `uiResult` 回显）；工具已下线则退化为普通结果卡片。

## 注意事项

1. **组件已自动 `markRaw`**：render 组件会被存进深响应式的工具片段，`defineTool` 内部已做 `markRaw` 处理，避免 Vue 把组件对象包成 Proxy 告警；你直接传组件即可。
2. **`execute` 必须存在**：核心对前端工具是无判空调用的，纯交互工具即使没有活要干也省略不得——`defineTool` 已统一兜底为空执行，render 会收到 `success` 状态。
3. **`call` 只需调用一次**：用户做出选择后调用 `call(result)` 即可，调用后核心会移除它（`part.call` 变为 `undefined`），重复调用无效。
4. **用好 description**：模型是否选这个工具、传什么参数，完全取决于 `description` 与 `parameters` 的描述质量；写清使用时机和参数含义。
5. **execute 抛错不会中断对话**：异常会被捕获并作为 `error` 状态的结果交给 render / 回传后端，render 组件应对 `status === "error"` 和非预期 `result` 做好兜底渲染。
6. **后端要认识前端工具**：`context.tools` 里的工具描述需要随对话请求发给后端（见 [适配器](./adapter.md)），后端智能体据此在决定调用时标记 `caller: "frontend"`。

## 延伸阅读

- [适配器（Adapter）](./adapter.md)：`response` 回传与 `context.tools` 透传
- [聊天视图 ChatContent](./chat-content.md)：工具片段的三个 phase 与卡片渲染
- [会话列表 ThreadList](./thread-list.md)：工具能力与会话管理的配合
