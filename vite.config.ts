import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Same-origin in dev so the SameSite=Strict auth cookies are sent.
      '/api': {
        target: 'https://aminesidki-postprep.hf.space',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('proxy error', err))
        },
      },
    },
  },
})
