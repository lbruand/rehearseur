import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  base: process.env.GITHUB_ACTIONS ? '/rehearseur/' : '/',
  build: mode === 'production' ? {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Rehearseur',
      formats: ['es', 'cjs'],
      fileName: (format) => `rehearseur.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ['react', 'react-dom', 'rrweb', 'driver.js'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          rrweb: 'rrweb',
          'driver.js': 'driver',
        },
      },
    },
  } : {},
}))
