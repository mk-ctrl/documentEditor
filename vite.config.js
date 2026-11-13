import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React app lives in client/. .env sits at the repo root and is shared with Express,
// and only VITE_-prefixed variables are exposed to the browser bundle.
export default defineConfig({
  root: 'client',
  envDir: '..',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
