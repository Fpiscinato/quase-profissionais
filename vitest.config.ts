import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  define: {
    // Separate config from vite.config.ts, so its __APP_VERSION__ define
    // isn't picked up here — tests don't care about the real git hash.
    __APP_VERSION__: JSON.stringify('test'),
  },
  plugins: [react()],
  test: {
    environment: 'node',
    globals: false,
  },
})
