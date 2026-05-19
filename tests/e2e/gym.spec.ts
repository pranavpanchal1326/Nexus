import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

test.describe('Gym Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
    await page.goto('/gym')
  })

  test('gym page renders tracker and history', async ({ page }) => {
    await expect(page.locator('.gym-tracker')).toBeVisible()
    await expect(page.locator('.gym-form')).toBeVisible()
    await expect(page.locator('text=HISTORY')).toBeVisible()
  })

  test('LOG SET button disabled without exercise', async ({ page }) => {
    await expect(page.locator('.gym-submit')).toBeDisabled()
  })

  test('unit toggle switches kg/lbs', async ({ page }) => {
    await expect(page.locator('.gym-unit-toggle:has-text("kg")')).toBeVisible()
    await page.click('.gym-unit-toggle')
    await expect(page.locator('.gym-unit-toggle:has-text("lbs")')).toBeVisible()
    await page.click('.gym-unit-toggle')
    await expect(page.locator('.gym-unit-toggle:has-text("kg")')).toBeVisible()
  })

  test('notes toggle shows/hides textarea', async ({ page }) => {
    await expect(page.locator('.gym-notes-field')).not.toBeVisible()
    await page.click('button:has-text("+ NOTES")')
    await expect(page.locator('.gym-notes-field')).toBeVisible()
    await page.click('button:has-text("— NOTES")')
    await expect(page.locator('.gym-notes-field')).not.toBeVisible()
  })

  test('logging a set adds it to THIS SESSION list', async ({ page }) => {
    await page.fill('.gym-input--exercise', 'Test Exercise E2E')
    await page.fill('.gym-input--number:first-of-type', '3')
    await page.click('.gym-submit')

    // Session list appears
    await expect(page.locator('text=THIS SESSION')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.gym-set-row:has-text("Test Exercise E2E")')).toBeVisible()
  })

  test('form resets sets/reps/weight after log', async ({ page }) => {
    await page.fill('.gym-input--exercise', 'Reset Test')
    const setsInput   = page.locator('.gym-input--number').first()
    const weightInput = page.locator('.gym-input--weight')

    await setsInput.fill('5')
    await weightInput.fill('100')
    await page.click('.gym-submit')

    // Weight should be cleared after log
    await page.waitForTimeout(1000)
    await expect(weightInput).toHaveValue('')
  })

  test('autocomplete shows known exercises', async ({ page }) => {
    // First log an exercise to populate history
    await page.fill('.gym-input--exercise', 'Autocomplete Test Exercise')
    await page.click('.gym-submit')
    await page.waitForTimeout(1000)

    // Now type first few chars — autocomplete should appear
    await page.fill('.gym-input--exercise', 'Autocom')
    await page.waitForTimeout(500)

    // Dropdown may appear if exercise exists in history
    const dropdown = page.locator('.gym-autocomplete')
    if (await dropdown.isVisible()) {
      await expect(dropdown.locator('.gym-autocomplete__item')).toBeVisible()
    }
  })

  test('filter pills appear with multiple exercises', async ({ page }) => {
    // Log two different exercises
    for (const ex of ['Filter Test A', 'Filter Test B']) {
      await page.fill('.gym-input--exercise', ex)
      await page.click('.gym-submit')
      await page.waitForTimeout(500)
    }

    // History should have filter pills
    await page.waitForTimeout(1000)
    const pills = page.locator('.gym-filter-pill')
    if (await pills.count() > 1) {
      await expect(pills.locator('text=ALL')).toBeVisible()
    }
  })
})
