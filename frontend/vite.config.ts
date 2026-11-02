import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const backend = 'http://127.0.0.1:8082'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': backend,
      '/media': backend,
      '/sitemap.xml': backend,
      '/robots.txt': backend,
    },
  },
})
