import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

test.describe('Lexicon Duel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
    await page.goto('/lexicon')
  })

  test('lexicon page renders correctly', async ({ page }) => {
    await expect(page.locator('.page-title, .text-display')).toContainText('Lexicon')
    await expect(page.locator('button:has-text("+ ADD WORD")')).toBeVisible()
    await expect(page.locator('.lexicon-duel')).toBeVisible()
  })

  test('Add Word modal opens and closes', async ({ page }) => {
    await page.click('button:has-text("+ ADD WORD")')
    await expect(page.locator('.modal-panel')).toBeVisible()
    await expect(page.locator('text=ADD WORD')).toBeVisible()

    // Close via Cancel button
    await page.click('button:has-text("CANCEL")')
    await expect(page.locator('.modal-panel')).not.toBeVisible()
  })

  test('Add Word modal validates required fields', async ({ page }) => {
    await page.click('button:has-text("+ ADD WORD")')

    // Try to submit without word or definition
    await page.click('button:has-text("ADD TO LEXICON")')

    // Should still be on modal — not submitted
    await expect(page.locator('.modal-panel')).toBeVisible()
  })

  test('complete duel flow — add word, select, write sentence, judge', async ({ page }) => {
    // Add a test word
    await page.click('button:has-text("+ ADD WORD")')
    await page.fill('input[placeholder="ephemeral"]', 'ephemeral')
    await page.fill('textarea[placeholder*="Lasting"]', 'Lasting for a very short time')
    await page.click('button:has-text("ADD TO LEXICON")')

    // Wait for modal to close
    await expect(page.locator('.modal-panel')).not.toBeVisible()

    // Word should appear in selector
    await expect(page.locator('.duel-word-chip:has-text("ephemeral")')).toBeVisible()

    // Select the word
    await page.click('.duel-word-chip:has-text("ephemeral")')

    // Writing phase
    await expect(page.locator('.duel-word-card')).toBeVisible()
    await expect(page.locator('.duel-word-card__word')).toContainText('ephemeral')

    // Write sentence
    await page.fill('.duel-textarea', 'The ephemeral beauty of the sunrise was gone by 7am.')

    // Submit
    await page.click('button:has-text("SUBMIT")')

    // Judging state
    await expect(page.locator('button:has-text("JUDGING...")')).toBeVisible()

    // Result reveals
    await page.waitForSelector('.duel-verdict', { timeout: 15_000 })
    await expect(page.locator('.duel-verdict')).toBeVisible()
    await expect(page.locator('.duel-verdict__label')).toBeVisible()

    // Reasoning appears
    await expect(page.locator('.duel-reasoning')).toBeVisible()

    // NEXT WORD button appears
    await expect(page.locator('button:has-text("NEXT WORD")')).toBeVisible()
  })

  test('duplicate word shows 409 error message', async ({ page }) => {
    // Add word twice
    for (let i = 0; i < 2; i++) {
      await page.click('button:has-text("+ ADD WORD")')
      await page.fill('input[placeholder="ephemeral"]', 'duplicate-test-word')
      await page.fill('textarea[placeholder*="Lasting"]', 'A test word')
      await page.click('button:has-text("ADD TO LEXICON")')
      await page.waitForTimeout(500)
    }

    // Second add should show error
    await expect(page.locator('.input-error, .add-word-form .settings-error')).toBeVisible()
  })
})
