import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: true,
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
