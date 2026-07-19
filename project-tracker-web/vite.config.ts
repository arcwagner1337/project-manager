import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Вот она, та самая строчка!
    proxy: {
      // Все запросы к /api теперь будут проксироваться на бэк
      '/api': {
        target: 'https://localhost:7291',
        changeOrigin: true,
        secure: false, // Игнорируем проблемы с самоподписанным SSL на локалке
      }
    }
  }
})
