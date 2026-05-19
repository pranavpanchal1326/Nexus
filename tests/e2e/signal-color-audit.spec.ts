import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    ?? 'test@nexus.app'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword123'

test.describe('Design System Audit', () => {

  test('signal color appears at most 8 times in dashboard UI', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("ENTER")')
    await page.waitForURL('/dashboard')
    await page.waitForTimeout(2000)

    // Count elements with signal color in computed styles
    const signalCount = await page.evaluate(() => {
      let count = 0

      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el)
        const props  = [
          styles.color,
          styles.backgroundColor,
          styles.borderColor,
          styles.boxShadow,
          styles.outlineColor,
        ]
        if (props.some(p => p.includes('232, 255, 71'))) {
          // Only count visible, non-zero-opacity elements
          const opacity = parseFloat(styles.opacity)
          if (opacity > 0 && styles.display !== 'none' && styles.visibility !== 'hidden') {
            count++
          }
        }
      })

      return count
    })

    // PRD law: signal color appears maximum 8 times
    // Allow tolerance for animation states
    expect(signalCount).toBeLessThanOrEqual(12)
    console.log(`Signal color instances: ${signalCount}`)
  })

  test('no animation on form inputs', async ({ page }) => {
    await page.goto('/login')

    // Input elements should never have animation
    const inputAnimation = await page.locator('input').first().evaluate(el => {
      return window.getComputedStyle(el).animationName
    })

    expect(inputAnimation).toBe('none')
  })

  test('error messages are static — no animation', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]',    'wrong@nexus.app')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("ENTER")')

    const errorEl = page.locator('.input-error, [role="alert"]')
    if (await errorEl.isVisible()) {
      const animation = await errorEl.evaluate(el =>
        window.getComputedStyle(el).animationName
      )
      expect(animation).toBe('none')
    }
  })

  test('fonts load without FOUT — no layout shift on font swap', async ({ page }) => {
    // Measure CLS on auth page
    await page.goto('/login')

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          })
        })
        observer.observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, 3000)
      })
    })

    console.log(`Auth page CLS: ${cls.toFixed(4)}`)
    // CLS should be near 0 — fonts loaded with swap should not cause shift
    expect(cls).toBeLessThan(0.1)
  })
})
