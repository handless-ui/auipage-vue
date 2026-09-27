# 会话列表 ThreadList

`ThreadList` 提供会话维度的管理能力：新建、切换、归档、取消归档和删除。和 `ChatContent` 一样是无头组件，只负责状态与触发，样式完全自定义。

## 组件总览

| 组件 | 渲染标签 | 作用 |
| --- | --- | --- |
| `ThreadList.Root` | `div` | 列表根容器 |
| `ThreadList.New` | `button` | 新建会话，进入空白对话状态 |
| `ThreadList.Items` | `div` | 遍历会话，提供 `{ thread }` 作用域插槽 |
| `ThreadList.Item.Root` | `div` | 单条会话容器，带状态与高亮属性 |
| `ThreadList.Item.Trigger` | `button` | 切换到该会话（归档态不可点） |
| `ThreadList.Item.Title` | `span` | 会话标题 |
| `ThreadList.Item.Archive` | `button` | 归档会话 |
| `ThreadList.Item.UnArchive` | `button` | 取消归档 |
| `ThreadList.Item.Delete` | `button` | 删除会话 |

## 标准组合结构

```vue
<ThreadList.Root>
    <ThreadList.New>新建会话</ThreadList.New>

    <ThreadList.Items v-slot="{ thread }">
        <ThreadList.Item.Root>
            <ThreadList.Item.Trigger>
                <ThreadList.Item.Title />
            </ThreadList.Item.Trigger>

            <ThreadList.Item.Archive>归档</ThreadList.Item.Archive>
            <ThreadList.Item.UnArchive>取消归档</ThreadList.Item.UnArchive>
            <ThreadList.Item.Delete>删除</ThreadList.Item.Delete>
        </ThreadList.Item.Root>
    </ThreadList.Items>
</ThreadList.Root>
```

插槽作用域中的 `thread` 结构：

```ts
interface ThreadListItem {
    threadId: string;
    title: string;
    status: "regular" | "archived";
}
```

---

## 各组件说明

### New：新建会话

点击后进入“新建会话”状态：清空当前激活会话、界面回到空白对话。此时发送第一条消息，核心会自动调用 `ThreadListAdapter.new` 创建会话记录。

### Items：遍历会话

对 `store.threads` 逐条渲染。内部以 `threadId` 作为 key——这一点很重要：新会话会 `unshift` 到列表头部，没有稳定 key 时 Vue 按位置复用组件会导致数据错位。

### Item.Root：单条容器

渲染为 `div`，并带上两个状态属性，方便用 CSS 属性选择器写样式：

- `data-status="regular"` / `"archived"`：会话当前状态
- `data-active`：该会话是当前激活会话时出现（属性无值），非激活时该属性不存在

### Item.Trigger：切换会话

点击后把该会话激活，并通过 `MessageHistoryAdapter.load` 拉取它的历史消息渲染。

**归档会话不会被激活**：`thread.status === "archived"` 时点击是无效的，需要先取消归档。

### Item.Title：标题

渲染 `thread.title`；标题缺省时回退显示“新会话”。也可以传入插槽内容自定义。

### Archive / UnArchive / Delete

分别触发核心对应的会话操作，最终调用 `ThreadListAdapter` 的同名方法：

- **归档**：状态变为 `archived`；如果归档的是**当前正在打开的会话**，界面会自动进入新建会话状态
- **取消归档**：状态恢复为 `regular`，**不会**自动切换进该会话
- **删除**：从列表移除；如果删除的是**当前会话**，同样自动进入新建会话状态

---

## 完整示例

```vue
<template>
    <ThreadList.Root class="sidebar">
        <ThreadList.New class="new-btn">＋ 新建会话</ThreadList.New>

        <ThreadList.Items v-slot="{ thread }">
            <ThreadList.Item.Root class="thread-item">
                <ThreadList.Item.Trigger class="thread-trigger">
                    <ThreadList.Item.Title />
                </ThreadList.Item.Trigger>

                <!-- 根据状态决定显示哪个操作按钮 -->
                <ThreadList.Item.Archive v-if="thread.status === 'regular'" class="op-btn">
                    归档
                </ThreadList.Item.Archive>
                <ThreadList.Item.UnArchive v-else class="op-btn">
                    取消归档
                </ThreadList.Item.UnArchive>

                <ThreadList.Item.Delete class="op-btn danger">删除</ThreadList.Item.Delete>
            </ThreadList.Item.Root>
        </ThreadList.Items>
    </ThreadList.Root>
</template>

<script setup lang="ts">
import { ThreadList } from "@auipage/vue";
</script>
```

`Items` 的插槽里拿到的 `thread` 是响应式的，归档后状态变化会自动触发重渲染，因此可以直接用 `v-if="thread.status === 'regular'"` 切换按钮。

---

## 样式钩子

| 组件 | class | 额外属性 |
| --- | --- | --- |
| `Root` | `aui-thread-list-root` | — |
| `New` | `aui-thread-list-new` | — |
| `Items` | `aui-thread-list-items` | — |
| `Item.Root` | `aui-item-root` | `data-status`、`data-active` |
| `Item.Trigger` | `aui-item-trigger` | — |
| `Item.Title` | `aui-item-title` | — |
| `Item.Archive` | `aui-item-archive` | — |
| `Item.UnArchive` | `aui-item-unarchive` | — |
| `Item.Delete` | `aui-item-delete` | — |

组件上写的 `class` 会与内置 class 合并，其余属性透传到真实 DOM。

## 注意事项

1. **执行中切换会话会被忽略**：一轮对话尚未结束时点击其他会话不会生效，这是核心状态机的保护行为，避免历史与流式数据串台。
2. **归档项不可点击进入**：`Trigger` 内部判断了状态，归档会话需先 `UnArchive`。
3. **操作当前会话会自动跳转**：归档或删除当前打开的会话后，自动回到新建会话状态；取消归档则保持在原界面。
4. **列表顺序最新在上**：新建会话 `unshift` 到头部，依赖稳定的 `threadId` 作为 key，业务后端务必保证 `threadId` 全局唯一。
5. **会话数据来自适配器**：首次挂载时 `ThreadListAdapter.list` 的返回值决定列表内容；`title`、`status` 等字段由后端提供，缺省状态按 `regular` 处理。

## 延伸阅读

- [适配器（Adapter）](./adapter.md)：会话列表接口的实现细节
- [聊天视图 ChatContent](./chat-content.md)：会话切换后如何展示消息
- [前端工具 defineTool](./tools.md)：让智能体拥有页面侧能力
