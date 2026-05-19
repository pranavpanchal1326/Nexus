import { defineConfig }   from 'vitest/config'
import { resolve }        from 'path'
import react              from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment:    'jsdom',
    globals:        true,
    setupFiles:     ['./tests/setup/vitest.setup.ts'],
    include:        [
      'lib/**/*.test.ts',
      'hooks/**/*.test.ts',
      'components/**/*.test.ts',
      'app/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/tests/e2e/**',
    ],
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'lib/**/*.ts',
        'hooks/**/*.ts',
        'components/**/*.tsx',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/node_modules/**',
        '**/.next/**',
        '**/types/**',
      ],
      thresholds: {
        global: {
          branches:   80,
          functions:  80,
          lines:      80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
