import type { InjectionKey } from "vue";
import { inject } from "vue";
import type { AuiStore } from "./store";
import type { AuiPage } from "@auipage/core";

/**
 * Vue 版 Context：用 InjectionKey + provide/inject
 * 和 React 版 Context 对等
 */
export interface AuiContextValue {
    store: AuiStore;
    aui: AuiPage;
}

export const AuiContextKey: InjectionKey<AuiContextValue> = Symbol("AuiContext");

/** 在组件中拿到 store + aui，必须在 <AuiRuntimeProvider> 子树中调用 */
export function useAuiContext(): AuiContextValue {
    const ctx = inject(AuiContextKey);
    if (!ctx) {
        throw new Error(
            "AuiContext not found. Did you forget to wrap with <AuiRuntimeProvider>?"
        );
    }
    return ctx;
}
