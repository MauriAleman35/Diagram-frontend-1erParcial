import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // Alias para src
      '@lib': fileURLToPath(new URL('./lib', import.meta.url)), // Alias para lib
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)) // Alias para hooks
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // El backend que quieres usar
        changeOrigin: true, // Cambia el origen del host para que coincida con el target
        rewrite: (path) => path.replace(/^\/api/, '') // Opcional, reescribe la URL
      }
    }
  }
})
