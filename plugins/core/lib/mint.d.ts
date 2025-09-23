// Copyright © 2025 Mint teams
// Licensed under the MIT License
// TypeScript definition file for the Mintkit Framework
// Module definition for 'mintkit' which is the package name.
// Updated at: 2025-09-23

declare module 'mintkit' {

    // MintAssembly
    /** Interpreting and executing MintAssembly code. */
    export const MintAssembly: any; // Note: Replace `any` with a more specific type if the structure of MintAssembly

    // Virtual DOM and Component Types

    /** virtual DOM node. */
    export interface VNode {
        tag: string;
        props: Record<string, any>;
        children: (VNode | string | number)[];
        key?: string | number | null;
    }

    /** Represents a component that can be rendered. */
    export type Component<P = {}> = (props: P, ...children: (VNode | string | number)[]) => VNode;

    // State Management

    /**
     * Reactive state container.
     */
    export interface MintState<T> {
        /** Returns the current state. */
        get(): T;
        /**
         * Updates the state.
         * @param newState The new state or a function that receives the old state and returns the new state.
         */
        set(newState: T | ((prevState: T) => T)): void;
        /**
         * Subscribes to state changes or mounts the VDOM.
         * @param subscriber A function to call when the state changes.
         * @param mountPoint The DOM element to mount the VDOM to.
         */
        subscribe(subscriber: (state: T) => void, mountPoint?: HTMLElement): (() => void) | undefined;
        /** Creates a virtual DOM element. */
        createElement(tag: string | Component<any>, props: Record<string, any> | null, ...children: any[]): VNode;
        /** Returns the number of active subscribers. */
        getSubscriberCount(): number;
        /** Checks if there are any subscribers. */
        hasSubscribers(): boolean;
        /** Clears all subscribers and resets the mount point. */
        clear(): void;
    }

    /**
     * Creates a reactive state object.
     * @param initialValue The initial value of the state.
     */
    export function createState<T>(initialValue: T): MintState<T>;

    // Functional Utilities

    /**
     * Performs left-to-right function composition.
     */
    export function pipe(...fns: Function[]): (x: any) => any;

    /**
     * Performs right-to-left function composition.
     */
    export function compose(...fns: Function[]): (x: any) => any;

    // DOM Injection

    export interface InjectCSSOptions {
        nonce?: string;
        media?: string;
        priority?: 'normal' | 'high' | 'low';
        validate?: boolean;
        onError?: (error: Error) => void;
    }

    export interface InjectedStyleElement extends HTMLStyleElement {
        removeCSS(): void;
    }

    /**
     * Injects a CSS string into the document head.
     * @param cssString The CSS rules to inject.
     * @param options Configuration options.
     */
    export function injectCSS(cssString: string, options?: InjectCSSOptions): InjectedStyleElement | null;

    export interface InjectHTMLOptions {
        sanitize?: boolean;
        allowScripts?: boolean;
        allowEvents?: boolean;
        mode?: 'replace' | 'append' | 'prepend';
        onError?: (error: Error) => void;
    }

    /**
     * Injects an HTML string into a target element.
     * @param targetSelector The CSS selector for the target element.
     * @param htmlContent The HTML string to inject.
     * @param options Configuration options.
     */
    export function injectHTML(targetSelector: string, htmlContent: string, options?: InjectHTMLOptions): HTMLElement;

    /**
     * Injects a title into the document head.
     * @param titleHtmlString The title string, preferably wrapped in `<title>` tags.
     */
    export function injectTitle(titleHtmlString: string): void;

    export interface InjectConfig {
        html?: {
            id: string;
            location: string | (() => string);
            options?: InjectHTMLOptions;
        };
        css?: {
            location: string | Record<string, string> | (() => string | Record<string, string>);
            options?: InjectCSSOptions;
        };
    }

    /**
     * A unified API for injecting HTML and CSS.
     * @param config The injection configuration object.
     */
    export function inject(config: InjectConfig): void;

    // File Loading

    /**
     * Fetches and injects a .css or .html file.
     * @param url The URL of the file.
     * @param targetSelector For HTML files, the CSS selector of the target element.
     */
    export function get(url: string, targetSelector?: string): Promise<HTMLElement | HTMLLinkElement | void>;

    /** Alias for `get`. */
    export const include: typeof get;

    /**
     * Processes `@include()` directives within a given DOM context.
     * @param context The DOM element or document to search within.
     */
    export function processIncludes(context?: Document | Element): Promise<void>;

    // Development & Performance

    export interface AdjustHookMetrics {
        requests: { total: number; successful: number; failed: number; retries: number; };
        performance: { totalTime: number; avgResponseTime: number; minResponseTime: number; maxResponseTime: number; lastResponseTime: number; responseTimeHistory: number[]; };
        errors: { total: number; consecutive: number; maxConsecutive: number; types: Record<string, number>; lastError: string | null; lastErrorTime: number | null; };
        health: { uptime: number; isHealthy: boolean; lastSuccessTime: number | null; lastFailureTime: number | null; successRate: number; };
        server: { memoryUsage: number; cpuUsage: number; uptime: number; version: string | null; lastUpdate: number | null; };
    }

    export interface AdjustHookAPI {
        /** Stops the monitoring interval. */
        stop(): void;
        /** Gets basic request and error statistics. */
        getStats(): { requests: number; errors: number; totalTime: number; avgTime: number; lastCheckTime: number; };
        /** Gets the full detailed metrics object. */
        getMetrics(): AdjustHookMetrics & { summary: { uptime: number; successRate: number; avgResponseTime: number; p95ResponseTime: number; healthStatus: 'healthy' | 'degraded'; } };
        /** Manually triggers a metrics report. */
        reportMetrics(): void;
        /** Gets the duration of the last check. */
        getLastCheckTime(): number;
        /** Returns true if the connection is considered healthy. */
        isHealthy(): boolean;
        /** Returns a formatted summary of key metrics. */
        getFormattedMetrics(): { uptime: string; successRate: string; avgResponse: string; memoryUsage: string; totalRequests: string; errorRate: string; };
    }

    export interface AdjustHookOptions {
        interval?: number;
        endpoint?: string;
        onReload?: () => void;
        onError?: (error: any) => void;
        onMetricsUpdate?: (report: any) => void;
        enabled?: boolean;
        performanceMonitoring?: boolean;
        detailedLogging?: boolean;
        maxRetries?: number;
        retryDelay?: number;
        healthCheckInterval?: number;
        metricsReportInterval?: number;
    }

    /**
     * A hook for live-reloading during development.
     */
    export function AdjustHook(options?: AdjustHookOptions): AdjustHookAPI;

    export interface PerformanceMonitorAPI {
        /** Starts a timer with a given label. */
        start(label: string): this;
        /** Ends a timer and logs the duration. */
        end(label: string): number;
        /** Measures the execution time of a synchronous function. */
        measure<T>(label: string, fn: () => T): T;
        /** Measures the execution time of an asynchronous function. */
        measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T>;
        /** Gets the current duration of all active timers. */
        getStats(): Record<string, number>;
        /** Clears all active timers. */
        clear(): void;
        /** Enables the monitor. */
        enable(): void;
        /** Disables the monitor. */
        disable(): void;
    }

    /** A utility for measuring code execution time. */
    export const PerformanceMonitor: PerformanceMonitorAPI;

    export interface ReloadPerformanceEntry {
        timestamp: number;
        duration: number;
        fileCount: number;
        memoryUsage: number;
        date: string;
    }

    export interface ReloadPerformanceStats {
        totalReloads: number;
        averageTime: number;
        minTime: number;
        maxTime: number;
        lastReload: ReloadPerformanceEntry;
    }

    export interface ReloadPerformanceTrackerAPI {
        /** Records a new reload event. */
        recordReload(duration: number, fileCount?: number, memoryUsage?: number): ReloadPerformanceEntry | null;
        /** Gets aggregated statistics of all recorded reloads. */
        getStats(): ReloadPerformanceStats | null;
        /** Logs the current stats to the console. */
        logStats(): void;
        /** Clears all recorded history. */
        clear(): void;
        /** Enables the tracker. */
        enable(): void;
        /** Disables the tracker. */
        disable(): void;
    }

    /** A utility for tracking performance of hot-reloads. */
    export const ReloadPerformanceTracker: ReloadPerformanceTrackerAPI;

    /**
     * Clears the cache used by `injectCSS`.
     */
    export function clearInjectionCache(): void;

    /**
     * Gets statistics about injected resources.
     */
    export function getInjectionStats(): { hashCacheSize: number; memoryUsage: any; };

    // General Utilities

    export const MintUtils: {
        isElement(el: any): el is Element;
        isTextNode(node: any): node is Text;
        isVNode(obj: any): obj is VNode;
        debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
        deepEqual(obj1: any, obj2: any): boolean;
    };

    // Routing

    export interface RouterAPI {
        route(pattern: string, callback: (params: Record<string, string>) => void): this;
        notFound(callback: (path: string) => void): this;
        navigate(path: string): void;
        getParams(): Record<string, string>;
        getPath(): string;
        init(): this;
    }

    export const Router: RouterAPI;

    /**
     * Programmatically navigates to a new path.
     * @param path The path to navigate to.
     */
    export function navigate(path: string): void;

    /**
     * A component for declarative navigation.
     */
    export function Link(props: { to: string; [key: string]: any }, ...children: any[]): VNode;

    /**
     * A Higher-Order Component that provides router props to a component.
     */
    export function withRouter<P extends object>(Component: Component<P & { router: { path: string; params: Record<string, string> } }>): (props: P) => VNode;

}

declare module 'mintkit/main' {
    import { MintAssembly } from 'mintkit';

    export const Mint: {
        createState: any;
        injectCSS: any;
        injectHTML: any;
        injectTitle: any;
        get: any;
        include: any;
        processIncludes: any;
        MintAssembly: any;
        Router: any;
        navigate: any;
        Link: any;
        init: (fn: () => void) => void;
    };

    export const Utility: {
        pipe: any;
        compose: any;
        PerformanceMonitor: any;
        ReloadPerformanceTracker: any;
        getInjectionStats: any;
        clearInjectionCache: any;
        MintUtils: any;
        withRouter: any;
    };
}