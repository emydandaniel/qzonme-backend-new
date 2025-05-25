import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
    build: {
        target: 'esnext',
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'server/index.ts')
            },
            output: {
                format: 'es'
            }
        }
    },
    resolve: {
        alias: {
            '@shared': resolve(__dirname, 'shared')
        }
    },
    server: {
        middlewareMode: true,
        hmr: false,
        watch: {
            usePolling: true
        },
        allowedHosts: ['localhost', '127.0.0.1', 'render.com']
    }
});
