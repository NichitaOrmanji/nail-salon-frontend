import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-phone-input-2']
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // React и роутер меняются редко: отдельный файл остаётся в кэше браузера
            // между обновлениями сайта (код сайта меняется — этот файл нет)
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
})
