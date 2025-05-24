import { defineConfig } from 'vite';
import { resolve } from 'path';

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
    }
  }
}); 