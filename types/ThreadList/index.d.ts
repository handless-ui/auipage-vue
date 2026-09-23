import type {
    DefineComponent,
    SlotsType,
    ComputedOptions,
    MethodOptions,
    ComponentOptionsMixin,
    PublicProps,
} from 'vue';
import type { ThreadListItemType } from "./Item";

export interface ThreadListItem {
    threadId: string;
    title: string;
    status: 'regular' | 'archived';
}

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

export interface ThreadListType {
    Root: DefineComponent;
    /** 默认插槽逐条会话执行，作用域为 { thread } */
    Items: ScopedComponent<{ thread: ThreadListItem }>;
    New: DefineComponent;
    Item: ThreadListItemType;
}
