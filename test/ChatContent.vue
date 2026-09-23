<template>
    <ChatContent.Root>
        <ChatContent.Viewport>
            <ChatContent.Messages v-slot>
                <ChatContent.Parts v-slot="{ part }">
                    <UITextPart v-if="part.type === 'text'">
                        {{ part.text }}
                    </UITextPart>

                    <UILoadingPart v-else-if="part.type === 'loading'">
                        {{ part.text }}
                    </UILoadingPart>

                    <UIThinkingPart v-else-if="part.type === 'thinking'">
                        {{ part.text }}
                    </UIThinkingPart>

                    <UIToolCallPart
                        v-else-if="part.type === 'tool-call'"
                        :part="part"
                    />
                </ChatContent.Parts>
            </ChatContent.Messages>
        </ChatContent.Viewport>
        <ChatContent.Composer.Root>
            <ChatContent.Composer.Input />
            <ChatContent.Composer.Send>
                发送
            </ChatContent.Composer.Send>
        </ChatContent.Composer.Root>
    </ChatContent.Root>
</template>

<script setup lang="ts">
import { ChatContent } from "@auipage/vue";

import UITextPart from "./parts/UITextPart.vue";
import UILoadingPart from "./parts/UILoadingPart.vue";
import UIThinkingPart from "./parts/UIThinkingPart.vue";
import UIToolCallPart from "./parts/UIToolCallPart.vue";
</script>
