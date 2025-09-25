interface InjectConfig {
    html?: {
        id: string;
        location: () => string;
    };
    css?: {
        location: () => { css: string };
    };
}

declare module 'https://mint-teams.web.app/Mintkit/mint.js' {
    export const Mint: {
        include(path: string): Promise<void>;
        injectHTML(selector: string, html: string): void;
        injectTitle(titleHtml: string): void;
        init(callback: () => void): void;
        inject(config: InjectConfig): void;
    };
}
