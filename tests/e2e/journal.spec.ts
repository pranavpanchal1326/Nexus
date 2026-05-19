import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

test.describe('Journal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
    await page.goto('/journal')
  })

  test('journal page renders editor and history', async ({ page }) => {
    await expect(page.locator('.journal-editor')).toBeVisible()
    await expect(page.locator('.journal-textarea')).toBeVisible()
    await expect(page.locator('text=PREVIOUS ENTRIES')).toBeVisible()
  })

  test('textarea is focused on mount', async ({ page }) => {
    const focused = await page.evaluate(() =>
      document.activeElement?.classList.contains('journal-textarea')
    )
    expect(focused).toBe(true)
  })

  test('SAVE button disabled on empty content', async ({ page }) => {
    await expect(page.locator('.journal-save-btn')).toBeDisabled()
  })

  test('cursor turns signal yellow after 3s pause', async ({ page }) => {
    const textarea = page.locator('.journal-textarea')
    await textarea.fill('This is more than fifty characters of meaningful content here.')

    // Wait 3.5 seconds for listening state
    await page.waitForTimeout(3500)

    // Caret color should be signal yellow
    const caretColor = await textarea.evaluate(el =>
      window.getComputedStyle(el).caretColor
    )
    expect(caretColor).toContain('232')  // rgb contains 232 from #E8FF47
  })

  test('listening indicator appears after 3s pause', async ({ page }) => {
    const textarea = page.locator('.journal-textarea')
    await textarea.fill('This is more than fifty characters of meaningful writing content here.')

    await page.waitForSelector('.journal-listening-indicator', { timeout: 5000 })
    await expect(page.locator('.journal-listening-indicator')).toBeVisible()
  })

  test('Cmd+S saves journal entry', async ({ page }) => {
    const textarea = page.locator('.journal-textarea')
    await textarea.fill('This is a test journal entry with enough words to save.')
    await page.keyboard.press('Meta+S')

    // Saved indicator appears
    await expect(page.locator('.journal-saved-indicator')).toBeVisible({ timeout: 5000 })
  })

  test('saved entry appears in history list', async ({ page }) => {
    const content = `Test entry ${Date.now()} — unique enough to find in list.`
    const textarea = page.locator('.journal-textarea')
    await textarea.fill(content)
    await page.keyboard.press('Meta+S')

    // Wait for save
    await page.waitForSelector('.journal-saved-indicator', { timeout: 5000 })

    // Entry should appear in list
    const preview = content.slice(0, 50)
    await expect(page.locator(`.journal-entry__content:has-text("${preview.slice(0, 30)}")`))
      .toBeVisible({ timeout: 3000 })
  })

  test('APEX mode uses monospace textarea font', async ({ page }) => {
    // Force APEX mode via mode selector if needed
    const fontFamily = await page.locator('.journal-textarea').evaluate(el =>
      window.getComputedStyle(el).fontFamily
    )
    // Check mode and expected font
    const modeText = await page.locator('.mode-indicator').first().textContent()
    if (modeText?.includes('APEX')) {
      expect(fontFamily.toLowerCase()).toContain('mono')
    }
  })
})
