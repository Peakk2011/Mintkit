declare module 'mintkit' {
    // Core types
    export type VNode = {
        tag: string;
        props: Record<string, any>;
        children: Array<VNode | string | number>;
        key: string | null;
    };

    export type State<T = any> = {
        get(): T;
        set(value: T | ((prev: T) => T)): void;
        subscribe(callback?: (state: T) => void, mountPoint?: HTMLElement): (() => void) | undefined;
        getSubscriberCount(): number;
        hasSubscribers(): boolean;
        clear(): void;
    };

    // Injection types
    export interface InjectionOptions {
        sanitize?: boolean;
        allowScripts?: boolean;
        allowEvents?: boolean;
        mode?: 'replace' | 'append' | 'prepend';
        onError?: (error: Error) => void;
        validate?: boolean;
    }

    export interface CSSInjectionOptions {
        nonce?: string | null;
        media?: string | null;
        priority?: 'normal' | 'high' | 'low';
        validate?: boolean;
        onError?: (error: Error) => void;
    }

    // Router types
    export interface Router {
        route(pattern: string, callback: (params: Record<string, string>) => void): Router;
        notFound(callback: (path: string) => void): Router;
        navigate(path: string): void;
        getParams(): Record<string, string>;
        getPath(): string;
        init(): Router;
    }

    // Main exports
    export const pipe: (...fns: Function[]) => Function;
    export const compose: (...fns: Function[]) => Function;
    export const clone: <T>(obj: T) => T;
    
    export function createElement(tag: string, props?: Record<string, any>, ...children: any[]): VNode;
    export function createState<T>(initialValue: T): State<T>;
    
    export function injectCSS(css: string, options?: CSSInjectionOptions): HTMLStyleElement | null;
    export function injectHTML(selector: string, html: string, options?: InjectionOptions): Element | null;
    export function injectTitle(title: string): void;
    export function inject(config: {
        html?: { id: string; location: string | (() => string); options?: InjectionOptions };
        css?: { location: string | object | (() => string | object); options?: CSSInjectionOptions };
    }): void;
    
    export const Router: Router;
    export function navigate(path: string): void;
    export function Link(props: { to: string } & Record<string, any>, ...children: any[]): VNode;
    export function withRouter<T>(Component: (props: T) => any): (props: T) => any;
    
    export function get(url: string, targetSelector?: string): Promise<void | HTMLElement>;
    export const include: typeof get;
    export function processIncludes(context?: Document | Element): Promise<void>;
    
    export const AdjustHook: (options?: any) => any;
    export const PerformanceMonitor: any;
    export const ReloadPerformanceTracker: any;
    
    export const MintUtils: {
        isElement: (el: any) => boolean;
        isTextNode: (node: any) => boolean;
        isVNode: (obj: any) => boolean;
        debounce: (func: Function, wait: number) => Function;
        deepEqual: (obj1: any, obj2: any) => boolean;
        formatBytes: (bytes: number) => string;
        formatDuration: (ms: number) => string;
        getInjectionStats: () => any;
        clearInjectionCache: () => void;
    };

    export const Mint: {
        pipe: typeof pipe;
        compose: typeof compose;
        clone: typeof clone;
        createElement: typeof createElement;
        createState: typeof createState;
        injectCSS: typeof injectCSS;
        injectHTML: typeof injectHTML;
        injectTitle: typeof injectTitle;
        inject: typeof inject;
        Router: typeof Router;
        navigate: typeof navigate;
        Link: typeof Link;
        withRouter: typeof withRouter;
        get: typeof get;
        include: typeof include;
        processIncludes: typeof processIncludes;
        AdjustHook: typeof AdjustHook;
        PerformanceMonitor: typeof PerformanceMonitor;
        ReloadPerformanceTracker: typeof ReloadPerformanceTracker;
        MintUtils: typeof MintUtils;
    };
}