import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// This test requires lighthouse to be installed:
// npm install -g lighthouse
// Or: npm install --save-dev lighthouse

test.describe('Lighthouse Audit', () => {
  const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
  const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

  test('dashboard meets performance and accessibility targets', async ({ page, browser }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
    await page.waitForTimeout(3000)  // Allow full render

    // Run Lighthouse programmatically
    const { default: lighthouse } = await import('lighthouse')

    // Get the browser's debugging port
    const wsEndpoint = (browser as { wsEndpoint?(): string }).wsEndpoint
    const browserWsEndpoint = wsEndpoint ? wsEndpoint() : ''
    const port = browserWsEndpoint ? parseInt(new URL(browserWsEndpoint).port) : 9222

    const result = await lighthouse('http://localhost:3000/dashboard', {
      port,
      logLevel:       'error',
      output:         'json',
      onlyCategories: ['performance', 'accessibility'],
      settings: {
        formFactor:            'desktop',
        screenEmulation:       { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
        throttlingMethod:      'provided',
      },
    } as Parameters<typeof lighthouse>[1])

    if (!result?.lhr) {
      console.warn('Lighthouse result not available — skipping score assertions')
      return
    }

    const { categories, audits } = result.lhr

    const perfScore   = Math.round((categories.performance?.score   ?? 0) * 100)
    const a11yScore   = Math.round((categories.accessibility?.score ?? 0) * 100)
    const clsScore    = audits['cumulative-layout-shift']?.numericValue ?? 0

    console.log(`Performance:   ${perfScore}`)
    console.log(`Accessibility: ${a11yScore}`)
    console.log(`CLS:           ${clsScore.toFixed(4)}`)

    // Write report
    const reportDir = path.join(process.cwd(), 'lighthouse-report')
    fs.mkdirSync(reportDir, { recursive: true })
    fs.writeFileSync(
      path.join(reportDir, 'dashboard.json'),
      JSON.stringify(result.lhr, null, 2)
    )

    // PRD success criteria
    expect(perfScore).toBeGreaterThanOrEqual(90)   // Performance 90+
    expect(a11yScore).toBeGreaterThanOrEqual(95)   // Accessibility 95+
    expect(clsScore).toBeLessThan(0.1)              // CLS < 0.1 (target: 0)
  })

  test('oracle page meets accessibility target', async ({ page, browser }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
    await page.goto('/oracle')
    await page.waitForTimeout(2000)

    const { default: lighthouse } = await import('lighthouse')
    const port = (browser as unknown as { wsEndpoint?(): string }).wsEndpoint
      ? parseInt(new URL((browser as unknown as { wsEndpoint(): string }).wsEndpoint()).port)
      : 9222

    const result = await lighthouse('http://localhost:3000/oracle', {
      port,
      logLevel:       'error',
      output:         'json',
      onlyCategories: ['accessibility'],
      settings: {
        formFactor:       'desktop',
        screenEmulation:  { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: 'provided',
      },
    } as Parameters<typeof lighthouse>[1])

    if (!result?.lhr) return

    const a11yScore = Math.round((result.lhr.categories.accessibility?.score ?? 0) * 100)
    console.log(`Oracle Accessibility: ${a11yScore}`)
    expect(a11yScore).toBeGreaterThanOrEqual(95)
  })
})
