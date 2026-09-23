import type {
    DefineComponent,
    SlotsType,
    ComputedOptions,
    MethodOptions,
    ComponentOptionsMixin,
    PublicProps,
} from 'vue';
import type { ChatContentComposerType } from './Composer';
import type { ToolRenderProps } from '../index';

/**
 * 对话片段，直接对齐 src/store.ts 的 ChatContentPart 判别联合
 * 注意：tool-call 分支没有 text 字段，访问前必须先按 type/"text" in p 收窄
 */
export type ChatContentPart =
    | { type: "text"; text: string }
    | { type: "loading"; text: string }
    | { type: "thinking"; text: string }
    | ToolCallPartLocal;

/** 工具调用片段（本文件本地声明，避免跨 src 相对路径） */
export type ToolCallPartLocal = {
    type: "tool-call";
    id: string;
    name: string;
    args: any;
    phase: "pending" | "executing" | "result";
    status: "pending" | "success" | "error";
    result?: any;
    render?: any;
    call?: (result: unknown) => void;
    uiResult?: unknown;
    uiStatus?: "success" | "error";
};

/** 单条消息，对齐 src/store.ts 的 ChatMessage */
export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    parts: ChatContentPart[];
};

/**
 * 带默认作用域插槽的组件
 * DefineComponent 第 13 个泛型才是 SlotsType，中间参数必须补齐
 */
type ScopedComponent<Scope> = DefineComponent<
    {},
    {},
    {},
    ComputedOptions,
    MethodOptions,
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    {},
    string,
    PublicProps,
    {},
    {},
    SlotsType<{ default: Scope }>
>;

export interface ChatContentType {
    Root: DefineComponent;
    Viewport: DefineComponent;
    /** 默认插槽逐条消息执行，作用域为 { message } */
    Messages: ScopedComponent<{ message: ChatMessage }>;
    /** 默认插槽逐个片段执行，作用域为 { part } */
    Parts: ScopedComponent<{ part: ChatContentPart }>;
    Composer: ChatContentComposerType;
}
