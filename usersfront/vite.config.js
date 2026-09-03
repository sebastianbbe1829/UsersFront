import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, el proxy permite que el navegador use el mismo origen
// tanto desde localhost como desde la IP LAN del PC.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/tenants': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/tenant-config': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/bootstrap': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/roles': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/permissions': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/permission': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/role-permissions': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/user-tenants': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/user-tenant-roles': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/extinguisher-types': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/extinguishers': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/extinguisher-inspections': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/extinguisher-inspection-items': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/diagnostics': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
