<template>

    <!-- 将运行时注入到整个应用 -->
    <AuiRuntimeProvider :adapter="adapter" :tools="tools">

        <!-- 聊天视图 -->
        <ChatContent />

        <!-- 会话列表 -->
        <ThreadList />

    </AuiRuntimeProvider>
</template>
<script setup lang="ts">
import { AuiRuntimeProvider } from "@auipage/vue";

import ThreadList from "./ThreadList.vue";
import ChatContent from "./ChatContent.vue";

import adapter from "./adapter";
import tools from "./tools";


</script>
<style scoped></style>
