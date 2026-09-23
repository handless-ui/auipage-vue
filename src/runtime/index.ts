import type { AuiStore } from "../store";
import type { ChatContentRuntime, ThreadListRuntime } from "@auipage/core";
import { makeChatContentRuntime } from "./chatContent";
import { makeThreadListRuntime } from "./threadList";
import type { VueTool } from "../defineTool";

export interface RuntimeInstances {
    ChatContent: ChatContentRuntime;
    ThreadList: ThreadListRuntime;
}

export function makeRuntimes(
    store: AuiStore,
    tools: VueTool[]
): RuntimeInstances {
    return {
        ChatContent: makeChatContentRuntime(store, tools),
        ThreadList: makeThreadListRuntime(store),
    };
}
