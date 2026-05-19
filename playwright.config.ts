import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })


export default defineConfig({
  testDir:  './tests/e2e',
  timeout:  30_000,
  retries:  process.env.CI ? 2 : 0,
  workers:  process.env.CI ? 1 : 1,
  reporter: [
    ['html',  { outputFolder: 'playwright-report' }],
    ['line'],
    ['json',  { outputFile: 'playwright-report/results.json' }],
  ],

  use: {
    baseURL:           'http://localhost:3000',
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'on-first-retry',
    actionTimeout:     10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
    {
      name:  'mobile-chrome',
      use:   { ...devices['Pixel 5'] },
    },
    {
      name:  'accessibility',
      use:   { ...devices['Desktop Chrome'] },
      testMatch: ['**/accessibility.spec.ts'],
    },
  ],

  webServer: {
    command:            'npm run dev',
    url:                'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout:            60_000,
  },
})
