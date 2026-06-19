import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy API + uploads to the Express server (port 5000 by default;
// set VITE_API_PROXY to point dev at a remote backend).
const apiTarget = process.env.VITE_API_PROXY || 'http://localhost:5000';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
  },
});
