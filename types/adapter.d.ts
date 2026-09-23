import { MessageHistoryAdapter, ThreadListAdapter, ChatTransportAdapter } from "@auipage/core";

export interface AdapterType {
    MessageHistory: MessageHistoryAdapter;
    ThreadList: ThreadListAdapter;
    ChatTransport: ChatTransportAdapter;
}