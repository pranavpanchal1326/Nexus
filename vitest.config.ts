import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Mock server-only so modules with `import 'server-only'` can be
      // unit-tested in Vitest without Next.js build context.
      // The real package throws in browser/test envs — this is correct.
      'server-only': path.resolve(__dirname, 'tests/unit/__mocks__/server-only.ts'),
    },
  },
})
