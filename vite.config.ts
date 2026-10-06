import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Libraries change far less often than the museum: separate chunks stay cached across deploys. */
function vendorChunk(id: string) {
  if (id.indexOf('node_modules') === -1) return undefined
  if (/node_modules\/three\//.test(id)) return 'three'
  if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
  return 'vendor'
}

export default defineConfig({
  plugins: [react()],
  build: {
    // three alone is ~700 kB unminified-gzip-free; it is one module and cannot be split further.
    chunkSizeWarningLimit: 750,
    rollupOptions: { output: { manualChunks: vendorChunk } },
  },
})
