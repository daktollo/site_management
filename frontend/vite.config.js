import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Dev server proxies /api to the backend so the SPA can use same-origin paths.
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // Use polling to avoid host inotify watcher limits (ENOSPC).
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
