import type { DefineComponent, Component } from 'vue';
import type { AdapterType } from './adapter';

export { ChatContentType, ChatContentPart, ChatMessage } from "./ChatContent";
export { ThreadListType, ThreadListItem } from "./ThreadList";

export { ChatTransportAdapter, generator, MessageHistoryAdapter, ThreadListAdapter } from '@auipage/core';

/** render 组件收到的数据 */
export type ToolRenderProps = {
    args: any;
    result?: any;
    status: "pending" | "success" | "error";
    /** 历史回读：render 组件当时通过 call 交还的结果 */
    uiResult?: unknown;
    /** 历史回读：render 交互的状态 */
    uiStatus?: "success" | "error";
    /** 实时态：调用后交还工具结果并结束挂起 */
    call?: (result: unknown) => void;
};

/** Vue 版工具定义 */
export type VueTool = {
    description: {
        type: "function";
        function: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        };
    };
    execute: (args: any) => unknown | Promise<unknown>;
    render?: Component;
};

/** defineTool 的平铺入参 */
export type DefineToolOptions = {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute?: (args: any) => unknown | Promise<unknown>;
    render?: Component;
};

/** 工具调用片段 */
export type ToolCallPart = {
    type: "tool-call";
    id: string;
    name: string;
    args: any;
    phase: "pending" | "executing" | "result";
    status: "pending" | "success" | "error";
    result?: any;
    render?: Component<ToolRenderProps>;
    call?: (result: unknown) => void;
    uiResult?: unknown;
    uiStatus?: "success" | "error";
};

export declare function defineTool(options: DefineToolOptions): VueTool;

export declare const AuiRuntimeProvider: DefineComponent<{
    adapter: AdapterType;
    tools?: VueTool[];
}>;

export declare const ChatContent: ChatContentType;
export declare const ThreadList: ThreadListType;
