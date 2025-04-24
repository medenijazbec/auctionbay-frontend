import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: false,
    proxy: {
      // Proxy all /api requests to your ASP.NET backend
      '/api': {
        target: 'https://localhost:7056',
        secure: false,       // accept self-signed cert
        changeOrigin: true,  // rewrite Host header to match target
      },
	  '/images': {                    // ← add this block
        target: 'https://localhost:7056',
        secure: false,
        changeOrigin: true,
      },  
    },
  },
})
