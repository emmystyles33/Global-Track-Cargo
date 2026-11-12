import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL ? env.VITE_API_URL.replace(/\/$/, '') : '';

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      proxy: apiUrl
        ? undefined
        : {
            '/api': {
              target: 'http://localhost:8787',
              changeOrigin: true,
            },
          },
    },
    build: {
      // Keep memory use down during build on low-RAM machines: smaller
      // worker pool, no source maps by default.
      sourcemap: false,
      chunkSizeWarningLimit: 600,
    },
  });
};
