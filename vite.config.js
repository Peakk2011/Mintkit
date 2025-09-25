import { defineConfig } from 'vite';

export default defineConfig({
    root: 'usage/mintkit-implementation',
    server: {
        open: true,
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            },
        },
    },
});
