import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Transformers.js resolves its ONNX runtime + WASM assets at runtime;
    // Vite pre-bundling breaks those paths, so leave it unbundled in dev
    exclude: ['@huggingface/transformers'],
  },
})
