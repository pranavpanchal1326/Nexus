import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

test.describe('Oracle', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
    await page.goto('/oracle')
  })

  test('oracle page renders intelligence document UI — not chat bubbles', async ({ page }) => {
    await expect(page.locator('.oracle-chat')).toBeVisible()

    // Input exists at bottom
    await expect(page.locator('.oracle-input-field')).toBeVisible()

    // No chat bubble elements — verify absence of bubble-style classes
    await expect(page.locator('.message-bubble')).toHaveCount(0)
    await expect(page.locator('.chat-bubble')).toHaveCount(0)

    // Correct page title
    await expect(page.locator('.oracle-header__title')).toContainText('Oracle')
  })

  test('empty state shows mode-appropriate prompt', async ({ page }) => {
    // Assuming fresh session or cleared history
    const emptyState = page.locator('.oracle-empty')
    if (await emptyState.isVisible()) {
      await expect(emptyState.locator('.oracle-empty__label')).toBeVisible()
      await expect(emptyState.locator('.oracle-empty__subline')).toBeVisible()
    }
  })

  test('input accepts text and enter submits', async ({ page }) => {
    const input = page.locator('.oracle-input-field')
    await input.focus()
    await input.fill('Status.')
    await input.press('Enter')

    // User message appears immediately
    await expect(page.locator('.oracle-user-message')).toBeVisible()
  })

  test('TTFB under 500ms for first oracle token', async ({ page }) => {
    const input = page.locator('.oracle-input-field')
    await input.focus()
    await input.fill('Status.')

    const start = Date.now()
    await input.press('Enter')

    // Wait for streaming to begin — thinking indicator or first content
    await page.waitForSelector('.oracle-thinking, .oracle-response--streaming, .oracle-response', {
      timeout: 3000,
    })
    const ttfb = Date.now() - start

    // Under 500ms TTFB — PRD success criterion
    expect(ttfb).toBeLessThan(500)
  })

  test('STOP button appears during streaming and aborts stream', async ({ page }) => {
    const input = page.locator('.oracle-input-field')
    await input.focus()
    await input.fill('Tell me something long and detailed about intelligence.')
    await input.press('Enter')

    // STOP button should appear during streaming
    const stopBtn = page.locator('button:has-text("STOP")')
    await expect(stopBtn).toBeVisible({ timeout: 3000 })

    // Click STOP
    await stopBtn.click()

    // SEND button should return
    await expect(page.locator('button:has-text("SEND")')).toBeVisible({ timeout: 2000 })
  })

  test('Cmd+Enter submits message', async ({ page }) => {
    const input = page.locator('.oracle-input-field')
    await input.focus()
    await input.fill('Status check.')
    await page.keyboard.press('Meta+Enter')
    await expect(page.locator('.oracle-user-message')).toBeVisible()
  })

  test('CLEAR button removes conversation history', async ({ page }) => {
    // Send a message first
    const input = page.locator('.oracle-input-field')
    await input.fill('Hello.')
    await input.press('Enter')

    // Wait for response
    await page.waitForSelector('.oracle-response', { timeout: 10_000 })

    // Clear button should be visible
    const clearBtn = page.locator('button:has-text("CLEAR")')
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()

    // Conversation should be cleared
    await expect(page.locator('.oracle-response')).toHaveCount(0)
    await expect(page.locator('.oracle-user-message')).toHaveCount(0)
  })

  test('oracle response renders in correct typography per mode', async ({ page }) => {
    // Check mode and verify response typography class
    const modeIndicator = page.locator('.mode-indicator')
    const modeText      = await modeIndicator.textContent()

    const input = page.locator('.oracle-input-field')
    await input.fill('Status.')
    await input.press('Enter')
    await page.waitForSelector('.oracle-response', { timeout: 10_000 })

    if (modeText?.includes('APEX') || modeText?.includes('COMMANDER')) {
      await expect(page.locator('.oracle-response--commander')).toBeVisible()
    } else {
      await expect(page.locator('.oracle-response--poet')).toBeVisible()
    }
  })
})
