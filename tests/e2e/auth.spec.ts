import { test, expect } from '@playwright/test'

// Test credentials — must exist in Supabase test project
const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

test.describe('Authentication', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('login page renders Void Intelligence aesthetic', async ({ page }) => {
    // Verify auth page visual identity
    await expect(page.locator('text=NEXUS')).toBeVisible()
    await expect(page.locator('text=INTELLIGENCE OPERATING SYSTEM')).toBeVisible()

    // Verify no generic UI
    await expect(page.locator('text=Welcome back')).toBeVisible()

    // Verify CTA says Enter not Login
    await expect(page.locator('button:has-text("ENTER")')).toBeVisible()

    // Verify background is void black — not white or grey
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    // #080808 in RGB is approximately rgb(8, 8, 8)
    expect(bgColor).toMatch(/rgb\([0-9]{1,2},\s*[0-9]{1,2},\s*[0-9]{1,2}\)/)
  })

  test('signup page has Initialize button not Sign Up', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('button:has-text("INITIALIZE")')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@nexus.app')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("ENTER")')

    // Error appears — static, no animation
    await expect(page.locator('.input-error, [role="alert"]')).toBeVisible()
  })

  test('empty form fields are validated', async ({ page }) => {
    await page.click('button:has-text("ENTER")')
    // Form should not submit with empty fields
    await expect(page).toHaveURL('/login')
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)

    const start = Date.now()
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard', { timeout: 10_000 })
    const elapsed = Date.now() - start

    // Auth → Dashboard under 2 seconds — PRD success criterion
    expect(elapsed).toBeLessThan(2000)
  })

  test('authenticated user on login page redirects to dashboard', async ({ page }) => {
    // Set auth cookie first
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')

    // Navigate back to login — should redirect
    await page.goto('/login')
    await page.waitForURL('/dashboard')
  })

  test('protected routes redirect unauthenticated users', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()

    const protectedRoutes = ['/dashboard', '/oracle', '/journal', '/gym', '/lexicon', '/settings']

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('sign out clears session and redirects to login', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')

    // Navigate to settings and sign out
    await page.goto('/settings')
    await page.click('button:has-text("SIGN OUT")')
    await page.waitForURL('/login')

    // Verify session cleared — protected route should redirect
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
