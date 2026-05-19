import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
  })

  test('dashboard renders three-zone layout', async ({ page }) => {
    await expect(page.locator('.nav-rail')).toBeVisible()
    await expect(page.locator('.dashboard-main')).toBeVisible()
    // Intel panel visible on desktop only
    const width = page.viewportSize()?.width ?? 1440
    if (width >= 1280) {
      await expect(page.locator('.intel-panel')).toBeVisible()
    }
  })

  test('DynamicIsland visible at top center', async ({ page }) => {
    await expect(page.locator('.dynamic-island-anchor')).toBeVisible()
    await expect(page.locator('.dynamic-island')).toBeVisible()
  })

  test('Tesseract renders without errors', async ({ page }) => {
    // Canvas element should be present
    await expect(page.locator('canvas')).toBeVisible()

    // No WebGL error messages in console
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.waitForTimeout(2000)
    const webglErrors = errors.filter(e => e.toLowerCase().includes('webgl'))
    expect(webglErrors).toHaveLength(0)
  })

  test('ArtifactModule shows streak and XP', async ({ page }) => {
    await expect(page.locator('.artifact-module')).toBeVisible()
    await expect(page.locator('.artifact-streak-value')).toBeVisible()
    await expect(page.locator('.artifact-xp-value')).toBeVisible()
    await expect(page.locator('text=DAY STREAK')).toBeVisible()
    await expect(page.locator('text=COGNITIVE XP')).toBeVisible()
  })

  test('all four stat cards render with correct links', async ({ page }) => {
    const cards = [
      { label: 'JOURNAL', href: '/journal' },
      { label: 'GYM',     href: '/gym'     },
      { label: 'LEXICON', href: '/lexicon' },
      { label: 'ORACLE',  href: '/oracle'  },
    ]

    for (const { label, href } of cards) {
      const card = page.locator(`.stat-card-link[href="${href}"]`)
      await expect(card).toBeVisible()
      await expect(card.locator('.stat-card__label')).toContainText(label)
    }
  })

  test('heatmap renders 365 cells', async ({ page }) => {
    // Scroll heatmap into view to trigger reveal animation
    await page.locator('.heatmap-wrapper').scrollIntoViewIfNeeded()
    await expect(page.locator('.heatmap-wrapper')).toBeVisible()

    // Count grid cells — should be approximately 365
    await page.waitForTimeout(1000)  // Allow reveal animation
    const cells = page.locator('.heatmap-cell:not(.heatmap-cell--empty)')
    const count = await cells.count()
    expect(count).toBeGreaterThan(300)
    expect(count).toBeLessThanOrEqual(366)
  })

  test('heatmap reveal animation triggered by scroll', async ({ page }) => {
    // Heatmap may be below fold — scroll to it
    await page.locator('.heatmap-wrapper').scrollIntoViewIfNeeded()

    // After scrolling into view, cells should become visible
    await page.waitForTimeout(1500)  // Animation takes ~824ms
    await expect(page.locator('.heatmap-cell').first()).toBeVisible()
  })

  test('NavRail has all six navigation items', async ({ page }) => {
    const navItems = ['/dashboard', '/oracle', '/lexicon', '/journal', '/gym', '/settings']
    for (const href of navItems) {
      await expect(page.locator(`.nav-rail a[href="${href}"], .nav-rail [href="${href}"]`))
        .toBeVisible()
    }
  })

  test('navigation to each route works', async ({ page }) => {
    const routes = [
      { href: '/oracle',   title: 'Oracle'  },
      { href: '/journal',  title: 'Journal' },
      { href: '/gym',      title: 'Gym'     },
      { href: '/lexicon',  title: 'Lexicon' },
      { href: '/settings', title: 'Settings'},
    ]

    for (const { href, title } of routes) {
      await page.goto(href)
      await expect(page).toHaveURL(href)
      // Page title visible
      await expect(page.locator('.text-display, .page-title')).toContainText(title)
      await page.goBack()
    }
  })

  test('no mock data in production — stats come from API', async ({ page }) => {
    // Intercept the stats API call
    let statsCallMade = false
    page.on('request', req => {
      if (req.url().includes('/api/stats')) statsCallMade = true
    })

    await page.reload()
    await page.waitForTimeout(2000)

    expect(statsCallMade).toBe(true)
  })
})
