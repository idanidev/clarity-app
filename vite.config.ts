import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
        manifest: {
          name: 'Clarity',
          short_name: 'Clarity',
          description: 'Gestor de gastos personales',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),

      // Compresión Brotli (mejor que gzip)
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),

      // Compresión Gzip (fallback)
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false,
      }),

      // Bundle analyzer (solo con ANALYZE=true)
      ...(process.env.ANALYZE ? [visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      })] : []),
    ],
    build: {
      outDir: 'dist',
      sourcemap: false, // Sin source maps en producción
      rollupOptions: {
        external: ['@capacitor-community/native-biometric'],
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'framer-motion'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
            'vendor-charts': ['recharts'],
            'vendor-capacitor': ['@capacitor/core', '@capacitor/haptics', '@capacitor/camera', '@capacitor/share'],
          },
        },
      },

      // Minificación agresiva con terser
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
      },

      chunkSizeWarningLimit: 500,
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
    },
    server: {
      proxy: {
        '/api/ai': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, '/v1/chat/completions'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
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
