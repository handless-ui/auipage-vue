<template>
    <ThreadList.Root>
        <ThreadList.New>
            新建会话
        </ThreadList.New>
        <ThreadList.Items v-slot="{ thread }">
            <ThreadList.Item.Root>
                <ThreadList.Item.Trigger>
                    <ThreadList.Item.Title />
                </ThreadList.Item.Trigger>
                <ThreadList.Item.Archive>
                    归档
                </ThreadList.Item.Archive>
                <ThreadList.Item.UnArchive>
                    取消归档
                </ThreadList.Item.UnArchive>
                <ThreadList.Item.Delete>
                    删除
                </ThreadList.Item.Delete>
            </ThreadList.Item.Root>
        </ThreadList.Items>
    </ThreadList.Root>
</template>
<script setup lang="ts">
import { ThreadList } from "@auipage/vue";

</script>
<style scoped></style>
