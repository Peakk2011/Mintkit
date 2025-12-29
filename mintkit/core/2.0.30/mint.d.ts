/**
 * Mintkit Framework Core - TypeScript Declaration File
 * Provides type definitions for the Mintkit framework.
 *
 * Copyright © 2025 Mint teams
 * Licensed under the MIT License
 */

declare global {
    /**
     * Represents the context for a Mintkit event.
     */
    interface EventContext<T extends Event = Event> {
        /** The target DOM element. */
        el: Element;
        /** Function to dispatch the event on the target element. */
        fire: () => void;
        /** The original event object. */
        event: T;
        /** The duration of a long press event in milliseconds. */
        duration?: number;
        /** The direction of a swipe event. */
        direction?: 'left' | 'right' | 'up' | 'down';
        /** The distance of a swipe in pixels. */
        distance?: number;
        /** The velocity of a swipe in pixels per millisecond. */
        velocity?: number;
        /** The state of a toggle event ('visible' or 'hidden'). */
        state?: 'visible' | 'hidden';
    }

    interface Event {
        /** The internal promise for handling asynchronous event logic. */
        _promise: Promise<EventContext>;
        /** The delay in milliseconds before the event logic is executed. */
        _delay?: number;

        /**
         * Sets the target for the event and initializes the event listener.
         * @param target The CSS selector string or the DOM element to target.
         * @returns The event instance for chaining.
         */
        on(target: string | EventTarget): this;

        /**
         * Sets a delay in milliseconds before the event is fired.
         * @param ms The delay time in milliseconds.
         * @returns The event instance for chaining.
         */
        delay(ms: number): this;

        /**
         * Executes a callback when the event has been successfully processed.
         * @param callback The function to execute, receiving the event context.
         * @returns A new promise that resolves with the return value of the callback.
         */
        then<TResult1 = EventContext, TResult2 = never>(onfulfilled?: ((value: EventContext) => TResult1 | PromiseLike<TResult1>) | undefined | null): Promise<TResult1 | TResult2>;

        /**
         * Attaches an error handler to the promise chain.
         * @param errorHandler The function to handle any errors.
         * @returns A new promise for error handling.
         */
        catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<EventContext | TResult>;

        /**
         * Dispatches the event on multiple targets simultaneously.
         * @param targets An array of CSS selectors or DOM elements.
         * @returns A promise that resolves with an array of the event contexts.
         */
        all(targets: Array<string | EventTarget>): Promise<Array<EventContext>>;

        /**
         * Listens for a long press (or haptic touch) gesture on a target element.
         * @param target The CSS selector or DOM element to attach the listener to.
         * @param duration The minimum duration in milliseconds to qualify as a long press. Defaults to 500ms.
         * @returns The event instance for chaining.
         */
        longPress(target: string | EventTarget, duration?: number): this;

        /**
         * Detects a swipe gesture on a target element in a specified direction.
         * @param target The CSS selector or DOM element.
         * @param direction The direction to detect ('left', 'right', 'up', 'down'). Defaults to 'left'.
         * @param threshold The minimum swipe distance in pixels. Defaults to 50.
         * @returns The event instance for chaining.
         */
        swipe(target: string | EventTarget, direction?: 'left' | 'right' | 'up' | 'down', threshold?: number): this;

        /**
         * Listens for a double-click event on a target element.
         * @param target The CSS selector or DOM element.
         * @returns The event instance for chaining.
         */
        doubleClick(target: string | EventTarget): this;

        /**
         * Listens for a hover (mouseenter) event on a target element.
         * @param target The CSS selector or DOM element.
         * @returns The event instance for chaining.
         */
        hover(target: string | EventTarget): this;

        /**
         * Listens for a right-click (contextmenu) event on a target element.
         * @param target The CSS selector or DOM element.
         * @returns The event instance for chaining.
         */
        rightClick(target: string | EventTarget): this;

        /**
         * Shows an element with a transition.
         * @param target The CSS selector or DOM element.
         * @param display The CSS display value to apply when shown. Defaults to 'block'.
         * @param duration The transition duration in milliseconds. Defaults to 300.
         * @returns The event instance for chaining.
         */
        show(target: string | EventTarget, display?: string, duration?: number): this;

        /**
         * Hides an element with a transition.
         * @param target The CSS selector or DOM element.
         * @param duration The transition duration in milliseconds. Defaults to 300.
         * @returns The event instance for chaining.
         */
        hide(target: string | EventTarget, duration?: number): this;

        /**
         * Toggles the visibility of an element with a transition.
         * @param target The CSS selector or DOM element.
         * @param display The CSS display value to apply when showing. Defaults to 'block'.
         * @param duration The transition duration in milliseconds. Defaults to 300.
         * @returns The event instance for chaining.
         */
        toggle(target: string | EventTarget, display?: string, duration?: number): this;

        /**
         * Fades in an element.
         * @param target The CSS selector or DOM element.
         * @param duration The duration in milliseconds. Defaults to 300.
         * @returns The event instance for chaining.
         */
        fadeIn(target: string | EventTarget, duration?: number): this;

        /**
         * Fades out an element.
         * @param target The CSS selector or DOM element.
         * @param duration The duration in milliseconds. Defaults to 300.
         * @returns The event instance for chaining.
         */
        fadeOut(target: string | EventTarget, duration?: number): this;

        /**
         * Slides down an element to reveal it.
         * @param target The CSS selector or DOM element.
         * @param duration The duration in milliseconds. Defaults to 300.
         * @returns The event instance for chaining.
         */
        slideDown(target: string | EventTarget, duration?: number): this;

        /**
         * Slides up an element to hide it.
         * @param target The CSS selector or DOM element.
         * @param duration The duration in milliseconds. Defaults to 300.
         * @returns The event instance for chaining.
         */
        slideUp(target: string | EventTarget, duration?: number): this;
    }
}

declare module 'mintkit' {

    //================================================================
    // Virtual DOM and State Management Types
    //================================================================

    /**
     * Represents a virtual DOM node.
     */
    export interface VNode {
        tag: string;
        props: { [key: string]: any; key?: string | number | null };
        children: (VNode | string | number)[];
        key: string | number | null;
    }

    /**
     * Represents a state object created by `createState`.
     */
    export interface State<T> {
        /**
         * Returns the current value of the state.
         * @returns The current state value.
         */
        get(): T;

        /**
         * Updates the state.
         * @param newState The new state value, or a function that receives the old state and returns the new state.
         */
        set(newState: T | ((prevState: T) => T)): void;

        /**
         * Subscribes to state changes or mounts a VDOM component.
         * @param subscriber A function that will be called with the new state whenever it changes.
         * @param mountPoint The DOM element to mount the VDOM to.
         * @returns An unsubscribe function.
         */
        subscribe(subscriber: (state: T) => void, mountPoint?: HTMLElement): () => void;

        /**
         * Creates a virtual DOM element.
         * @param tag The HTML tag for the element.
         * @param props The properties (attributes) of the element.
        * @param children The child elements.
         * @returns A VNode object.
         */
        createElement(tag: string, props: { [key: string]: any }, ...children: any[]): VNode;

        /**
         * Gets the number of active subscribers.
         * @returns The number of subscribers.
         */
        getSubscriberCount(): number;

        /**
         * Checks if there are any active subscribers.
         * @returns True if there are subscribers, false otherwise.
         */
        hasSubscribers(): boolean;

        /**
         * Clears all subscribers and resets the state's internal DOM references.
         */
        clear(): void;
    }

    /**
     * Creates a reactive state object.
     * @param initialValue The initial value of the state.
     * @returns A state management object.
     */
    export function createState<T>(initialValue: T): State<T>;

    /**
     * Creates a virtual DOM element.
     * @param tag The HTML tag for the element.
     * @param props The properties (attributes) of the element.
     * @param children The child elements.
     * @returns A VNode object.
     */
    export function createElement(tag: string, props: { [key: string]: any }, ...children: any[]): VNode;

    //================================================================
    // Functional Utilities
    //================================================================

    /**
     * Performs left-to-right function composition. The first function may have any arity; the remaining functions must be unary.
     * @param funcs The functions to pipe.
     * @returns A new function that applies the piped functions in sequence.
     */
    export function pipe(...funcs: Function[]): (initialValue: any) => any;

    /**
     * Performs right-to-left function composition.
     * @param funcs The functions to compose.
     * @returns A new function that applies the composed functions in sequence.
     */
    export function compose(...funcs: Function[]): (initialValue: any) => any;

    //================================================================
    // DOM Injection and Content Management
    //================================================================

    /**
     * Options for `injectCSS`.
     */
    export interface InjectCSSOptions {
        /** A cryptographic nonce for Content Security Policy. */
        nonce?: string | null;
        /** Media query for which the styles should apply. */
        media?: string | null;
        /** Loading priority ('high', 'normal', 'low'). */
        priority?: 'high' | 'normal' | 'low';
        /** Whether to perform security validation on the CSS string. */
        validate?: boolean;
        /** Custom error handling function. */
        onError?: (error: Error) => void;
    }

    /**
     * Injects a CSS string into the document's head.
     * @param cssString The CSS rules to inject.
     * @param options Configuration options for the injection.
     * @returns The created `<style>` element with a `removeCSS` method, or null on failure.
     */
    export function injectCSS(cssString: string, options?: InjectCSSOptions): HTMLStyleElement & { removeCSS?: () => void } | null;

    /**
     * Options for `injectHTML`.
     */
    export interface InjectHTMLOptions {
        /** Whether to sanitize the HTML content. Defaults to true. */
        sanitize?: boolean;
        /** Whether to allow script tags. Defaults to false. */
        allowScripts?: boolean;
        /** Whether to allow event handlers (e.g., onclick). Defaults to false. */
        allowEvents?: boolean;
        /** The insertion mode: 'replace', 'append', 'prepend'. Defaults to 'replace'. */
        mode?: 'replace' | 'append' | 'prepend';
        /** Custom error handling function. */
        onError?: (error: Error) => void;
        /** Whether to perform security validation. Defaults to true. */
        validate?: boolean;
    }

    /**
     * Safely injects HTML content into a target element.
     * @param targetSelector The CSS selector for the target element.
     * @param htmlContent The HTML string to inject.
     * @param options Configuration options for the injection.
     * @returns The target HTMLElement on success.
     */
    export function injectHTML(targetSelector: string, htmlContent: string, options?: InjectHTMLOptions): HTMLElement;

    /**
     * Configuration for HTML injection within the `inject` function.
     */
    export interface InjectHTMLConfig {
        /** The CSS selector for the target element (e.g., '#app'). */
        id: string;
        /** A function returning the HTML string, or the HTML string directly. */
        location: () => string | string;
        /** Additional options passed to `injectHTML`. */
        options?: InjectHTMLOptions;
    }

    /**
     * Configuration for CSS injection within the `inject` function.
     */
    export interface InjectCSSConfig {
        /** A function returning CSS, a CSS string, or an object of CSS strings. */
        location: () => string | { [key: string]: string } | string | { [key: string]: string };
        /** Additional options passed to `injectCSS`. */
        options?: InjectCSSOptions;
    }

    /**
     * Configuration object for the `inject` function.
     */
    export interface InjectConfig {
        /** Configuration for HTML injection. */
        html?: InjectHTMLConfig;
        /** Configuration for CSS injection. */
        css?: InjectCSSConfig;
    }

    /**
     * A unified API to inject both HTML and CSS in a structured way.
     * @param config The injection configuration object.
     */
    export function inject(config: InjectConfig): void;

    /**
     * Injects or replaces the document's title.
     * @param titleHtmlString The title string, preferably wrapped in `<title>` tags.
     */
    export function injectTitle(titleHtmlString: string): void;

    /**
     * Clears the cache used by `injectCSS`.
     */
    export function clearInjectionCache(): void;

    /**
     * Retrieves statistics about the injection system.
     */
    export function getInjectionStats(): {
        hashCacheSize: number;
        memoryUsage: any;
    };

    //================================================================
    // Asynchronous Content Loading
    //================================================================

    /**
     * Fetches and injects a CSS or HTML file.
     * For HTML, it can insert the content into a specified target.
     * @param url The URL of the file to get (.css, .html, .htm).
     * @param targetSelector Optional CSS selector for HTML injection. Defaults to 'body'.
     * @returns A promise that resolves with the created element (link or target) or void for CSS if already loaded.
     */
    export function get(url: string, targetSelector?: string): Promise<void | HTMLElement | HTMLLinkElement>;

    /**
     * Alias for the `get` function.
     */
    export const include: typeof get;

    /**
     * Processes `@include('path/to/file')` directives within the text nodes of a given context.
     * @param context The DOM context to search within. Defaults to `document`.
     * @returns A promise that resolves when all includes have been processed.
     */
    export function processIncludes(context?: Document | HTMLElement): Promise<void>;

    //================================================================
    // Live Reloading and Performance Monitoring
    //================================================================

    /**
     * Options for `AdjustHook`.
     */
    export interface AdjustHookOptions {
        interval?: number;
        endpoint?: string;
        onReload?: () => void;
        onError?: (error: Error) => void;
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
     * Represents the control object returned by `AdjustHook`.
     */
    export interface AdjustHookInstance {
        /** Stops the hot-reloading checks. */
        stop: () => void;
        /** Gets basic statistics. */
        getStats: () => object;
        /** Gets detailed metrics. */
        getMetrics: () => object;
        /** Manually triggers a metrics report. */
        reportMetrics: () => void;
        /** Gets the time of the last check. */
        getLastCheckTime: () => number;
        /** Checks if the connection is healthy. */
        isHealthy: () => boolean;
        /** Gets formatted metrics for display. */
        getFormattedMetrics: () => object;
    }

    /**
     * A client-side hot-reloading and performance monitoring utility.
     * @param options Configuration options.
     * @returns A control object with methods to stop and get stats.
     */
    export function AdjustHook(options?: AdjustHookOptions): AdjustHookInstance;

    /**
     * A utility for measuring code execution time.
     */
    export const PerformanceMonitor: {
        timers: Map<string, number>;
        enabled: boolean;
        start(label: string): this;
        end(label: string): number;
        measure<T>(label: string, fn: () => T): T;
        measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T>;
        getStats(): { [key: string]: number };
        clear(): void;
        enable(): void;
        disable(): void;
    };

    /**
     * A utility for tracking performance metrics of reloads.
     */
    export const ReloadPerformanceTracker: {
        history: any[];
        maxHistory: number;
        enabled: boolean;
        recordReload(duration: number, fileCount?: number, memoryUsage?: number): object | null;
        getStats(): object | null;
        logStats(): void;
        clear(): void;
        enable(): void;
        disable(): void;
    };

    //================================================================
    // General Utilities
    //================================================================

    /**
     * A collection of utility functions.
     */
    export const MintUtils: {
        isElement: (el: any) => el is Element;
        isTextNode: (node: any) => node is Text;
        isVNode: (obj: any) => obj is VNode;
        debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
        deepEqual: (obj1: any, obj2: any) => boolean;
    };

    //================================================================
    // Client-Side Router
    //================================================================

    /**
     * Represents the router instance.
     */
    export interface RouterInstance {
        /**
         * Registers a route pattern and its corresponding callback function.
         * @param pattern The route pattern (e.g., '/user/:id').
         * @param callback The function to execute when the route matches.
         * @returns The Router instance for method chaining.
         */
        route(pattern: string, callback: (params: { [key: string]: string }) => void): this;

        /**
         * Defines a handler for when no routes match the current path.
         * @param callback The function to execute.
         * @returns The Router instance for method chaining.
         */
        notFound(callback: (path: string) => void): this;

        /**
         * Programmatically navigates to a new path.
         * @param path The path to navigate to.
         */
        navigate(path: string): void;

        /**
         * Gets the parameters from the current URL.
         * @returns An object containing the URL parameters.
         */
        getParams(): { [key: string]: string };

        /**
         * Gets the current URL path.
         * @returns The current path string.
         */
        getPath(): string;

        /**
         * Starts the router and executes the handler for the initial route.
         * @returns The Router instance for method chaining.
         */
        init(): this;
    }

    /**
     * A singleton client-side router.
     */
    export const Router: RouterInstance;

    /**
     * A helper function for programmatic navigation.
     * @param path The path to navigate to.
     */
    export function navigate(path: string): void;

    /**
     * A virtual DOM component for creating navigation links that use the client-side router.
     * @param props The properties for the link, including a `to` property for the destination path.
     * @param children The child elements of the link.
     * @returns A VNode representing the link.
     */
    export function Link(props: { to: string; [key: string]: any }, ...children: any[]): VNode;

    /**
     * A Higher-Order Component (HOC) that injects router information (path, params) into a component.
     * @param Component The component function to wrap.
     * @returns A new component function that receives router props.
     */
    export function withRouter<P>(Component: (props: P & { router: { path: string; params: object } }) => VNode): (props: P) => VNode;

    //================================================================
    // MintAssembly - WebAssembly-like Interpreter / Template Engine
    //================================================================

    /**
     * Options for the Universal Template Engine mode of MintAssembly.
     */
    export interface UniversalTemplateEngineOptions {
        context?: { [key: string]: any };
        filters?: { [key: string]: (...args: any[]) => any };
    }

    /**
     * The interface for the Universal Template Engine.
     */
    export interface UniversalTemplateEngineInstance {
        /**
         * Renders the template within the specified selector.
         * @param selector The CSS selector or DOM element to mount to.
         * @param props Additional properties to merge with the context.
         */
        mount(selector: string | HTMLElement, props?: { [key: string]: any }): void;
        /** A map of named template elements found in the DOM. */
        templates: { [key: string]: HTMLTemplateElement };
        /**
         * Hashes a string using the FNV-1a algorithm.
         * @param str The string to hash.
         * @returns The hash as a number.
         */
        hashString(str: string): number;
    }

    /**
     * A factory function that initializes either the legacy MintAssembly interpreter
     * or a modern universal template engine based on the provided options.
     *
     * @param opts - Options object. If `context` or `filters` are provided, it initializes the template engine. Otherwise, it runs the legacy interpreter.
     * @returns The template engine instance if `opts` match, otherwise `void` as the legacy version runs immediately.
     */
    export function MintAssembly(opts?: UniversalTemplateEngineOptions): UniversalTemplateEngineInstance | void;

    //================================================================
    // Main Mint Object
    //================================================================

    /**
     * The main Mint object, containing all major framework functionalities.
     */
    export const Mint: {
        createState: typeof createState;
        injectCSS: typeof injectCSS;
        injectHTML: typeof injectHTML;
        inject: typeof inject;
        injectTitle: typeof injectTitle;
        get: typeof get;
        include: typeof include;
        processIncludes: typeof processIncludes;
        MintAssembly: typeof MintAssembly;
        Router: typeof Router;
        navigate: typeof navigate;
        Link: typeof Link;
        withRouter: typeof withRouter;
        AdjustHook: typeof AdjustHook;
        PerformanceMonitor: typeof PerformanceMonitor;
        ReloadPerformanceTracker: typeof ReloadPerformanceTracker;
        getInjectionStats: typeof getInjectionStats;
        clearInjectionCache: typeof clearInjectionCache;
        pipe: typeof pipe;
        compose: typeof compose;
        MintUtils: typeof MintUtils;
        /**
         * Executes a function after the current microtask queue is empty.
         * Useful for running setup code after the initial DOM content has been loaded and parsed.
         * @param fn The function to execute.
         */
        init: (fn: () => void) => void;
    };

    /**
     * A placeholder for the extended Event API. The actual implementation augments the global Event object.
     * @deprecated This export is null. Use `new Event('...')` and chain methods like `.on()`, `.delay()`, etc.
     */
    export const event: null;

    export default Mint;
}