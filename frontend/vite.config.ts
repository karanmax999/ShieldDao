import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': '{}',
    'process.browser': 'true',
  },
  resolve: {
    alias: {
      // Stub out Node-only native modules that can't run in browser
      'keccak':        resolve(__dirname, 'src/stubs/keccak.ts'),
      'secp256k1':     resolve(__dirname, 'src/stubs/empty.ts'),
      'leveldown':     resolve(__dirname, 'src/stubs/empty.ts'),
      'electron':      resolve(__dirname, 'src/stubs/empty.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@zama-fhe/relayer-sdk'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
