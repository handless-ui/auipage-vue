# [@auipage/vue](https://github.com/handless-ui/auipage-vue)
Vue版本的智能体UI组件库

<p>
    <a href="https://zxl20070701.github.io/toolbox/#/npm-download?packages=@auipage/vue&interval=7">
        <img src="https://img.shields.io/npm/dm/@auipage/vue.svg" alt="downloads">
    </a>
    <a href="https://www.npmjs.com/package/@auipage/vue">
        <img src="https://img.shields.io/npm/v/@auipage/vue.svg" alt="npm">
    </a>
    <a href="https://github.com/handless-ui/auipage-vue/issues">
        <img src="https://img.shields.io/github/issues/handless-ui/auipage-vue" alt="issue">
    </a>
    <a href="https://github.com/handless-ui/auipage-vue" target='_blank'>
        <img alt="GitHub repo stars" src="https://img.shields.io/github/stars/handless-ui/auipage-vue?style=social">
    </a>
    <a href="https://github.com/handless-ui/auipage-vue">
        <img src="https://img.shields.io/github/forks/handless-ui/auipage-vue" alt="forks">
    </a>
     <a href="https://gitee.com/handless-ui/auipage-vue" target='_blank'>
        <img alt="Gitee repo stars" src="https://gitee.com/handless-ui/auipage-vue/badge/star.svg">
    </a>
    <a href="https://gitee.com/handless-ui/auipage-vue">
        <img src="https://gitee.com/handless-ui/auipage-vue/badge/fork.svg" alt="forks">
    </a>
</p>

<img src="https://nodei.co/npm/@auipage/vue.png?downloads=true&amp;downloadRank=true&amp;stars=true" alt="NPM">

## 如何使用？

> 本库是 **Headless（无头）** 组件库：只负责状态与逻辑，不附带任何样式，界面长什么样完全由你决定。

### 1. 安装

```bash
npm install @auipage/vue
```

### 2. 实现适配器

组件库不关心你的后端用什么语言、模型用哪家，一切通过三个适配器对接。新建 `adapter.ts`（下面是一份零依赖、开箱即跑的内存示例）：

```ts
import {
    ChatTransportAdapter,
    MessageHistoryAdapter,
    ThreadListAdapter,
} from "@auipage/vue";

// —— 演示用内存存储，实际项目替换成你的后端接口即可 ——
const historyDB: Record<string, any[]> = {};
let threads: any[] = [];

// ① 对话传输：对接大模型，这里用本地“复读”模拟流式回复
const ChatTransport = new ChatTransportAdapter({
    async *run({ messages }) {
        yield { type: "loading", text: "思考中..." };

        const question =
            messages[0]?.content.find((p: any) => p.type === "text")?.text ?? "";

        for (const char of `收到：${question}`) {
            yield { type: "text", text: char };
        }
    },
});

// ② 历史消息：加载 / 入库
const MessageHistory = new MessageHistoryAdapter({
    async load(threadId) {
        return historyDB[threadId] ?? [];
    },
    async append(threadId, group) {
        (historyDB[threadId] ??= []).push(group);
    },
});

// ③ 会话列表：查询 / 新建 / 归档 / 删除
const ThreadList = new ThreadListAdapter({
    async list() {
        return threads;
    },
    async new(group) {
        const title =
            group.messages[0]?.content.find((p: any) => p.type === "text")
                ?.text ?? "新会话";
        const thread = {
            threadId: `${Date.now()}`,
            title: title.slice(0, 20),
            status: "regular",
        };
        threads.unshift(thread);
        return thread;
    },
    async archive(threadId) {
        threads = threads.map((t) =>
            t.threadId === threadId ? { ...t, status: "archived" } : t
        );
    },
    async unarchive(threadId) {
        threads = threads.map((t) =>
            t.threadId === threadId ? { ...t, status: "regular" } : t
        );
    },
    async delete(threadId) {
        threads = threads.filter((t) => t.threadId !== threadId);
    },
});

export default { ChatTransport, MessageHistory, ThreadList };
```

### 3. 组装页面

用 `AuiRuntimeProvider` 把适配器注入应用，再像搭积木一样组合 `ChatContent` 下的子组件：

```vue
<!-- App.vue -->
<template>
    <AuiRuntimeProvider :adapter="adapter">
        <ChatContent.Root>
            <ChatContent.Viewport>
                <ChatContent.Messages v-slot>
                    <ChatContent.Parts v-slot="{ part }">
                        <p v-if="part.type === 'text'">{{ part.text }}</p>
                    </ChatContent.Parts>
                </ChatContent.Messages>
            </ChatContent.Viewport>

            <ChatContent.Composer.Root>
                <ChatContent.Composer.Input />
                <ChatContent.Composer.Send>发送</ChatContent.Composer.Send>
            </ChatContent.Composer.Root>
        </ChatContent.Root>
    </AuiRuntimeProvider>
</template>

<script setup lang="ts">
import { AuiRuntimeProvider, ChatContent } from "@auipage/vue";
import adapter from "./adapter";
</script>
```

启动后输入消息，即可看到流式回复。需要多会话管理时，再按同样的方式引入 `ThreadList` 组件即可。

### 进阶文档

简单例子只覆盖了主干流程，更多细节分章节说明：

- [适配器（Adapter）](./docs/adapter.md)：对接真实后端、SSE 流式输出、`generator` 与工具结果回传
- [聊天视图 ChatContent](./docs/chat-content.md)：消息片段类型、自定义渲染、输入区定制
- [会话列表 ThreadList](./docs/thread-list.md)：新建、归档、取消归档与删除
- [前端工具 defineTool](./docs/tools.md)：注册前端工具及带交互的 `render` 组件

## 版权

MIT License

Copyright (c) [zxl20070701](https://zxl20070701.github.io/notebook/home.html) 走一步，再走一步
