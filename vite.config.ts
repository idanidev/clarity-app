import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        external: ['@capacitor-community/native-biometric'],
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@capacitor/core', '@capacitor/haptics'],
      // Vite lo resuelve automáticamente - no hace falta más
    },
    server: {
      proxy: {
        '/api/ai': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, '/v1/chat/completions'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Añadir headers necesarios
              const apiKey = env.VITE_DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
                console.log('✅ API Key añadida al proxy');
              } else {
                console.error('❌ VITE_DEEPSEEK_API_KEY no encontrada');
              }
              proxyReq.setHeader('Content-Type', 'application/json');
            });
            proxy.on('error', (err, req, res) => {
              console.error('❌ Error en proxy:', err);
            });
          },
        },
      },
    },
  }
})
