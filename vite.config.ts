import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
// import NodePolyfills from 'rollup-plugin-polyfill-node'; // Comentar si no es necesario

export default defineConfig({
  plugins: [
    vue()
    // NodePolyfills() // Comentado o eliminado temporalmente
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@lib': fileURLToPath(new URL('./lib', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url))
      // 'vue': 'vue/dist/vue.esm-bundler.js' // Eliminado este alias
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws-diagram': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['sockjs-client'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    minify: false, // Deshabilita la minificación para depuración
    sourcemap: true, // Facilita la depuración en producción
    commonjsOptions: {
      transformMixedEsModules: true
    },
    chunkSizeWarningLimit: 1000 // Opcional: aumenta el límite de advertencia de tamaño de chunk
  }
})
