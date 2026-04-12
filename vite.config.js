import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Use '/' for Firebase Hosting (no subdirectory).
  // The old '/cueWedding/' base was for GitHub Pages.
  base: '/',
})
