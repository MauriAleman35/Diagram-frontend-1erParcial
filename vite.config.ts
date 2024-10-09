import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import NodePolyfills from 'rollup-plugin-polyfill-node'

export default defineConfig({
  plugins: [
    vue(),
    NodePolyfills() // Polyfills para funcionalidades de Node en Vite
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // Alias para src
      '@lib': fileURLToPath(new URL('./lib', import.meta.url)), // Alias para lib
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js' // Alias para hooks
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Proxy para el backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Reescribir rutas para /api
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
        global: 'globalThis' // Compatibilidad con global en el navegador
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router'] // Evitar problemas de duplicación de dependencias en el bundle
    },
    commonjsOptions: {
      transformMixedEsModules: true // Transforma módulos mixtos ES/AMD, si es necesario para compatibilidad
    }
  }
})
