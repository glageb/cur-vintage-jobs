import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/adzuna': {
        target: 'https://api.adzuna.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/adzuna/, '/v1/api'),
      },
      '/api/ipapi': {
        target: 'https://ipapi.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ipapi/, ''),
      },
      '/api/extract-skills': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
