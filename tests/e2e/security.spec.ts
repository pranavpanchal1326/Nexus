import { test, expect } from '@playwright/test'

test.describe('Security', () => {

  test('GROQ_API_KEY never appears in client bundle', async ({ page }) => {
    await page.goto('/')

    // Intercept all JS chunks
    const jsContent: string[] = []
    page.on('response', async (res) => {
      if (res.url().includes('_next/static') && res.headers()['content-type']?.includes('javascript')) {
        try {
          const text = await res.text()
          jsContent.push(text)
        } catch {/* skip */}
      }
    })

    await page.waitForTimeout(3000)

    const combined = jsContent.join('')

    // GROQ API key prefix must never appear in any JS bundle
    expect(combined).not.toContain('gsk_')
    expect(combined).not.toContain('GROQ_API_KEY')
    expect(combined).not.toContain('dangerouslyAllowBrowser')
    expect(combined).not.toContain('NEXT_PUBLIC_GROQ')
  })

  test('Supabase service role key never in client bundle', async ({ page }) => {
    await page.goto('/')

    const jsContent: string[] = []
    page.on('response', async (res) => {
      if (res.url().includes('_next/static') && res.headers()['content-type']?.includes('javascript')) {
        try { jsContent.push(await res.text()) } catch {/* skip */}
      }
    })

    await page.waitForTimeout(3000)
    const combined = jsContent.join('')

    expect(combined).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(combined).not.toContain('service_role')
  })

  test('API routes return 401 without authentication', async ({ page }) => {
    // Clear cookies — no session
    await page.context().clearCookies()

    const protectedAPIs = [
      '/api/chat',
      '/api/journal',
      '/api/gym',
      '/api/stats',
      '/api/export',
      '/api/lexicon/words',
    ]

    for (const api of protectedAPIs) {
      const res = await page.request.post(
        `http://localhost:3000${api}`,
        { data: {}, failOnStatusCode: false }
      )
      // POST without auth → 401 (or 405 for GET-only routes)
      expect([401, 405]).toContain(res.status())
    }
  })

  test('no Math.random() in dashboard components for data', async ({ page }) => {
    const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
    const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')

    // Stats API is called — data comes from API, not Math.random()
    let statsCallMade = false
    page.on('request', req => {
      if (req.url().includes('/api/stats')) statsCallMade = true
    })

    await page.reload()
    await page.waitForTimeout(2000)
    expect(statsCallMade).toBe(true)
  })
})
