# 聊天视图 ChatContent

`ChatContent` 是一组按层级组合的无头组件，负责把对话消息渲染到页面上。组件本身不带样式，每个组件会渲染固定的标签、class 与数据属性，方便你完全接管视觉。

## 组件总览

| 组件 | 渲染标签 | 作用 |
| --- | --- | --- |
| `ChatContent.Root` | `div` | 聊天区域根容器 |
| `ChatContent.Viewport` | `div` | 滚动视口，新消息/流式增量时自动滚到底部 |
| `ChatContent.Messages` | `div` | 遍历消息，提供 `{ message }` 作用域插槽 |
| `ChatContent.Parts` | `span` | 遍历单条消息的片段，提供 `{ part }` 作用域插槽 |
| `ChatContent.Composer.Root` | `form` | 输入区容器（自动阻止默认提交） |
| `ChatContent.Composer.Input` | `textarea` | 消息输入框，支持 `Cmd/Ctrl + Enter` 发送 |
| `ChatContent.Composer.Send` | `button` | 发送按钮，执行中自动禁用 |

## 标准组合结构

```vue
<ChatContent.Root>
    <ChatContent.Viewport>
        <ChatContent.Messages v-slot>
            <ChatContent.Parts v-slot="{ part }">
                <!-- 在这里按 part.type 决定渲染什么 -->
            </ChatContent.Parts>
        </ChatContent.Messages>
    </ChatContent.Viewport>

    <ChatContent.Composer.Root>
        <ChatContent.Composer.Input />
        <ChatContent.Composer.Send>发送</ChatContent.Composer.Send>
    </ChatContent.Composer.Root>
</ChatContent.Root>
```

---

## Messages 与 Parts：作用域插槽

`Messages` 会对 `store.messages` 逐条渲染，`Parts` 再对当前消息的 `parts` 逐个渲染。两层插槽把"消息"和"片段"的遍历都替你做好了：

- `Messages` 默认插槽作用域：`{ message }`
- `Parts` 默认插槽作用域：`{ message }` → 插槽内取 `{ part }`

`message` 的结构：

```ts
interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    parts: ChatContentPart[];
}
```

### part 的判别联合类型

`part` 是一个按 `type` 区分的联合类型，模板里用 `v-if` 按类型收窄后即可安全访问字段：

```ts
type ChatContentPart =
    | { type: "text"; text: string }
    | { type: "loading"; text: string }
    | { type: "thinking"; text: string }
    | ToolCallPart;

interface ToolCallPart {
    type: "tool-call";
    id: string;
    name: string;
    args: any;
    phase: "pending" | "executing" | "result";
    status: "pending" | "success" | "error";
    result?: any;      // execute/后端返回的结果
    render?: Component;// 前端工具的渲染组件
    call?: (result: unknown) => void;       // 实时态：交还交互结果
    uiResult?: unknown;                     // 历史回读：当时的交互结果
    uiStatus?: "success" | "error";
}
```

注意 **`tool-call` 分支没有 `text` 字段**，直接访问 `part.text` 前必须先按 `part.type` 收窄。

### 自定义渲染示例

```vue
<template>
    <ChatContent.Root>
        <ChatContent.Viewport>
            <ChatContent.Messages v-slot="{ message }">
                <!-- 可以按 message.role 决定气泡对齐方向等 -->
                <div :data-role="message.role">
                    <ChatContent.Parts v-slot="{ part }">
                        <p v-if="part.type === 'text'">{{ part.text }}</p>

                        <p v-else-if="part.type === 'loading'" class="hint">
                            {{ part.text }}
                        </p>

                        <details v-else-if="part.type === 'thinking'">
                            <summary>思考过程</summary>
                            <p>{{ part.text }}</p>
                        </details>

                        <ToolCallCard
                            v-else-if="part.type === 'tool-call'"
                            :part="part"
                        />
                    </ChatContent.Parts>
                </div>
            </ChatContent.Messages>
        </ChatContent.Viewport>

        <ChatContent.Composer.Root>
            <ChatContent.Composer.Input />
            <ChatContent.Composer.Send>发送</ChatContent.Composer.Send>
        </ChatContent.Composer.Root>
    </ChatContent.Root>
</template>

<script setup lang="ts">
import { ChatContent } from "@auipage/vue";
import ToolCallCard from "./ToolCallCard.vue";
</script>
```

工具调用卡片的典型写法是按 `part.phase` 切换：`pending` 显示“运行中”，`result` 显示结果，`executing` 用 `<component :is="part.render">` 挂载交互组件，详见 [前端工具 defineTool](./tools.md)。

### 不提供插槽时的默认渲染

`Parts` 如果不给默认插槽，会走内置兜底：`text` / `loading` / `thinking` 片段输出纯文本，`tool-call` 不显示。适合快速调试。

---

## Composer：输入区

### Root

渲染为 `<form>`，已拦截 submit 的默认行为（不会导致页面刷新）。

### Input

渲染为 `<textarea>`：

- 值与 `store.composerValue` 双向同步（通过 `onInput`）
- 按下 `Cmd + Enter`（Mac）或 `Ctrl + Enter`（Windows）直接发送
- 空白消息和执行中发送都会被忽略

### Send

渲染为 `<button type="button">`：

- 插槽内容为按钮文字，缺省显示“发送”
- **执行中自动 `disabled`**，并带上 `data-disabled` 属性；也可以显式传 `disabled` 属性强制禁用
- 在 render 阶段读取执行状态，状态变化会自动反映到按钮上，无需手动处理

发送时的内部流程：取出输入文本并 trim → 清空输入框 → 置 `isExecuting = true` → 驱动核心完整流程（含落库）→ 无论成功失败最终复位 `isExecuting`。

---

## Viewport：自动滚动

`Viewport` 监听两类变化并在 `nextTick` 后滚到底部：

1. 消息数量变化（新消息出现）
2. 全部片段的文本总长度变化（流式输出中持续增长）

只有当内容确实溢出（出现滚动条）时才滚动，避免短消息产生无意义的滚动跳动。把它作为需要滚动的消息列表外层即可，滚动行为无需自己实现。

---

## 样式钩子

各组件渲染时附带的 class / 属性如下，可以直接据此写 CSS：

| 组件 | class | 额外属性 |
| --- | --- | --- |
| `Root` | `aui-chat-content-root` | — |
| `Viewport` | `aui-chat-content-viewport` | — |
| `Messages` | `aui-chat-content-messages` | — |
| `Parts` | `aui-chat-content-parts` | `data-role="user/assistant"` |
| 文本片段（默认渲染） | `aui-chat-content-part aui-chat-content-part-{type}` | — |
| `Composer.Root` | `aui-composer-root` | — |
| `Composer.Input` | `aui-composer-input` | — |
| `Composer.Send` | `aui-composer-send` | 执行中：`data-disabled` |

你在组件上写的 `class` 会与内置 class 合并，写的其余属性（`attrs`，如 `placeholder`、`rows`）会透传到真实 DOM 元素上。

## 注意事项

1. **必须在 `AuiRuntimeProvider` 子树内使用**，组件通过 inject 获取 store，脱离 Provider 会直接报错。
2. **片段 key 已由组件维护**：`tool-call` 以稳定 `id` 为 key、文本片段以序号为 key，保证工具卡片在 `phase` 原地切换时不会被重新挂载。
3. **`loading` 不进历史**：历史回读时会过滤掉加载提示片段，过滤后为空的消息整条丢弃，不会出现空气泡。
4. **自定义输入组件**：发送逻辑封装在内置 `Input` / `Send` 中（读写 store 的 `composerValue`、按 `isExecuting` 防重、空消息不发送）。多数情况下通过 class 和透传属性定制外观即可；确有特殊交互时，也建议保留内置组件、在外层包裹你自己的 UI。

## 延伸阅读

- [适配器（Adapter）](./adapter.md)：消息与片段从哪里来
- [会话列表 ThreadList](./thread-list.md)：与聊天视图配合切换会话
- [前端工具 defineTool](./tools.md)：`tool-call` 片段与交互组件
