import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

test.describe('Data Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
    await page.goto('/settings')
  })

  test('Black Box component renders on Settings', async ({ page }) => {
    await expect(page.locator('.black-box')).toBeVisible()
    await expect(page.locator('text=BLACK BOX')).toBeVisible()
    await expect(page.locator('text=Data Sovereignty Export')).toBeVisible()
    await expect(page.locator('button:has-text("DOWNLOAD MY DATA")')).toBeVisible()
  })

  test('export completes under 5 seconds and triggers download', async ({ page }) => {
    // Intercept download
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 })

    const start = Date.now()
    await page.click('button:has-text("DOWNLOAD MY DATA")')

    const download = await downloadPromise
    const elapsed  = Date.now() - start

    // Under 5 seconds — PRD success criterion
    expect(elapsed).toBeLessThan(5000)

    // Correct filename format
    expect(download.suggestedFilename()).toMatch(/nexus-export-\d{4}-\d{2}-\d{2}\.zip/)
  })

  test('loading state shows during export', async ({ page }) => {
    // Click and immediately check loading state
    await page.click('button:has-text("DOWNLOAD MY DATA")')

    // Loading state should be visible briefly
    await expect(page.locator('text=PACKAGING DATA...')).toBeVisible({ timeout: 2000 })
  })

  test('file contents list shows correct files', async ({ page }) => {
    const contents = page.locator('.black-box__contents')
    await expect(contents.locator('text=profile.json')).toBeVisible()
    await expect(contents.locator('text=journal.json')).toBeVisible()
    await expect(contents.locator('text=gym.json')).toBeVisible()
    await expect(contents.locator('text=lexicon.json')).toBeVisible()
    await expect(contents.locator('text=oracle.json')).toBeVisible()
    await expect(contents.locator('text=activity.json')).toBeVisible()
  })
})
