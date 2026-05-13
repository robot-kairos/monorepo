import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    allowedHosts: true,
    forwardConsole: true,
    proxy: {
      '/video': {
        target: 'http://robot-web:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://robot-web:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
