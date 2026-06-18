import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: 'all',
    https: {
      key:  require('fs').readFileSync('/home/leslie/vote_delegue/ssl/key.pem'),
      cert: require('fs').readFileSync('/home/leslie/vote_delegue/ssl/cert.pem'),
    },
    proxy: {
      '/api': {
        target: 'https://192.168.11.203:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
})
