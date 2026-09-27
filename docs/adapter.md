# 适配器（Adapter）

组件库本身不发任何网络请求，也不绑定具体的模型或后端。它通过三个适配器与你的业务后端通信：**你负责实现接口，组件库负责在合适的时机调用它们**。

## 总览

| 适配器 | 职责 | 需要实现的方法 |
| --- | --- | --- |
| `ChatTransportAdapter` | 发起一轮对话，流式产出回复片段 | `run`、`response` |
| `MessageHistoryAdapter` | 历史消息的加载与入库 | `load`、`append` |
| `ThreadListAdapter` | 会话列表的增删改查 | `list`、`new`、`archive`、`unarchive`、`delete` |

三个实例放入一个对象，传给 `AuiRuntimeProvider` 的 `adapter` 属性，**key 名固定**：

```ts
export default {
    ChatTransport,
    MessageHistory,
    ThreadList,
};
```

```vue
<AuiRuntimeProvider :adapter="adapter">
    <!-- ... -->
</AuiRuntimeProvider>
```

---

## ChatTransportAdapter：对话传输

### run：流式对话的核心

`run` 是一个**异步生成器函数**，每一轮对话开始时被调用，通过 `yield` 逐个吐出回复片段，界面会随之增量渲染。

```ts
new ChatTransportAdapter({
    async *run({ messages, context }) {
        // messages：本轮新发送的消息（通常只有一条用户消息）
        // context.history：当前会话已入库的历史消息组
        // context.tools：注册的前端工具描述（透传给后端用）
    },
});
```

入参结构：

```ts
{
    messages: Array<{
        role: string;
        content: ContentPart[];
    }>;
    context: {
        history: HistoryMessageGroup[];
        tools: Array<{ description: ToolDescription }>;
    };
}
```

### 可以 yield 的片段类型

```ts
// 普通文本（流式增量）
yield { type: "text", text: "你好" };

// 加载/状态提示（不会写入历史，历史回读时会被过滤）
yield { type: "loading", text: "思考中..." };

// 思维链内容
yield { type: "thinking", text: "用户在问时间，我需要调用工具..." };

// 工具调用（后端工具）
yield {
    type: "tool-call",
    id: "call_xxx",       // 单次调用的唯一标识，后续状态更新靠它对齐
    name: "readPlain",
    args: { path: "./a.txt" },
    status: "pending",    // pending | success | error
};
```

同类型的连续文本片段会被**增量拼接**，因此模型每输出一个字就可以 yield 一次，天然实现打字机效果。

### 对接真实后端：SSE 示例

后端返回标准的 `text/event-stream` 时，用原生 `fetch` 读取流并逐段 yield：

```ts
new ChatTransportAdapter({
    async *run({ messages, context }) {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages,
                tools: context.tools,
            }),
        });

        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE 帧以 \n\n 分隔，形如：data: {"type":"text","text":"你好"}\n\n
            const frames = buffer.split("\n\n");
            buffer = frames.pop() ?? "";

            for (const frame of frames) {
                const line = frame.replace(/^data: /, "").trim();
                if (line) yield JSON.parse(line);
            }
        }
    },
});
```

### generator：把回调式 API 桥接成 AsyncGenerator

如果你的请求库是事件回调风格（Node 的 http、`@auipage/fetch` 的 emitter 等），直接写生成器会很别扭。库提供了 `generator` 工具函数，把 `next / done / error` 三个回调桥接成异步生成器：

```ts
import { ChatTransportAdapter, generator } from "@auipage/vue";
import { fetch } from "@auipage/fetch";

new ChatTransportAdapter({
    async *run({ messages, context }) {
        yield { type: "loading", text: "思考中..." };

        yield* generator(function (next, done, error) {
            fetch({
                url: "/api/chat",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages, tools: context.tools }),
            }).then((res) => {
                res.on("data", (payload) => next(JSON.parse(payload)));
                res.on("end", done);
                res.on("error", error);
            }).catch(error);
        });
    },
});
```

### response：工具结果反向回传

带交互的前端工具在页面上执行完成后，结果需要回传给正在等待的后端。组件库会调用 `response(name, data)`，目前 `name` 固定为 `"tool-result"`：

```ts
new ChatTransportAdapter({
    // run: ...,
    response(name, data) {
        return fetch(`/api/chat/${name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data), // { id, status, result }
        });
    },
});
```

前端工具的完整机制见 [前端工具 defineTool](./tools.md)。

---

## MessageHistoryAdapter：历史消息

```ts
new MessageHistoryAdapter({
    // 切换进入某个会话时调用，返回该会话的全部历史消息组
    async load(threadId) {
        const res = await fetch(`/api/threads/${threadId}/messages`);
        return res.json();
    },

    // 每一轮对话（用户消息 + 助手回复）完成后调用，一次写入一组
    async append(threadId, group) {
        await fetch(`/api/threads/${threadId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(group),
        });
    },
});
```

`load` 的返回值与 `append` 的入参都是 `HistoryMessageGroup`：

```ts
interface HistoryMessageGroup {
    messages: Array<{
        role: string;
        content: ContentPart[];
    }>;
}
```

即“一轮对话”包含一到多条消息（用户一条、助手一条）。返回假值（`null` / `undefined` / 空数组）时跳过历史加载。

---

## ThreadListAdapter：会话列表

```ts
new ThreadListAdapter({
    // 查询全部会话
    async list() {
        const res = await fetch("/api/threads");
        return res.json();
    },

    // 首轮对话后调用：根据首轮消息创建会话并返回
    async new(firstGroup) {
        const res = await fetch("/api/threads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(firstGroup),
        });
        return res.json();
    },

    async archive(threadId) { /* PATCH 归档 */ },
    async unarchive(threadId) { /* PATCH 取消归档 */ },
    async delete(threadId) { /* DELETE 删除 */ },
});
```

返回的会话对象必须包含 `threadId` 字段，Vue 版运行时按以下结构消费：

```ts
interface Thread {
    threadId: string;                  // 必须，全局唯一
    title?: string;                    // 会话标题
    status?: "regular" | "archived";   // 缺省视为 regular
}
```

`new` 返回假值时，本轮对话中止：不会渲染会话、也不会写入历史。

---

## 短路语义速查

适配器的部分方法允许通过返回假值来中止流程，便于在异常/无权限时优雅退出：

| 方法 | 返回假值的效果 |
| --- | --- |
| `ChatTransport.run` | 直接终止本轮处理 |
| `MessageHistory.load` | 跳过历史加载，按空历史开始 |
| `ThreadList.new` | 中止本轮后续处理（不建会话、不落库） |

## 注意事项

1. **key 名不要写错**：`adapter` 对象的三个 key 必须是 `ChatTransport`、`MessageHistory`、`ThreadList`，运行时按名字查找实例。
2. **`loading` 片段是临时态**：可以在 `run` 中 yield 用来展示“思考中”，但它不会被写入历史；历史数据回读时这类片段也会被自动过滤。
3. **工具调用靠 `id` 对齐**：同一个工具调用先 yield `pending`，结束时再用相同 `id` 推送 `success` / `error` 与 `result`，界面上是同一张卡片原地更新，而不是新增一条。
4. **错误要抛出来**：`run` 内部抛出的异常会结束本轮对话并复位执行状态；用 `generator` 桥接时记得把异常传给第三个回调 `error`。
5. **执行中拒绝重复发送与切换会话**：这是核心状态机的行为，适配器方法被调用的时机已由组件库保证，无需在适配器内自行加锁。

## 延伸阅读

- [聊天视图 ChatContent](./chat-content.md)：片段如何渲染成界面
- [会话列表 ThreadList](./thread-list.md)：会话操作对应的组件
- [前端工具 defineTool](./tools.md)：`response("tool-result")` 的完整链路
