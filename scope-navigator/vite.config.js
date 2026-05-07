import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/vpr-prototypes/scope-navigator/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: parseInt(process.env.PORT || '5179'),
  },
}))
