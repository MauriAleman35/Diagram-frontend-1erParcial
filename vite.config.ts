import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import NodePolyfills from 'rollup-plugin-polyfill-node'

export default defineConfig({
  plugins: [
    vue(),
    NodePolyfills() // Usamos rollup-plugin-polyfill-node para manejar los polyfills
  ],
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
        target: 'http://localhost:3000', // El backend en el puerto 3000
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws-diagram': {
        target: 'http://localhost:3000', // Proxy para WebSocket
        ws: true, // Habilitar WebSocket
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis' // Define global como globalThis para compatibilidad en navegador
      }
    }
  },
  build: {
    rollupOptions: {
      plugins: [NodePolyfills()] // Añadir el plugin también a las opciones de Rollup
    }
  }
})
