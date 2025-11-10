import { test, expect } from '@playwright/test'

/**
 * Server Health & Console Error Tests
 * Bu testler server durumunu ve console hatalarını kontrol eder
 */
test.describe('Server Health Check', () => {
  test('server responds correctly', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
  })

  test('no critical console errors on page load', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/dashboard')

    // Wait a bit for any async errors
    await page.waitForTimeout(2000)

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      err =>
        !err.includes('favicon') &&
        !err.includes('react-devtools') &&
        !err.includes('HMR') &&
        !err.includes('Fast Refresh')
    )

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors)
    }

    expect(criticalErrors).toHaveLength(0)
  })

  test('no console errors on companies page', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })

    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/companies')
    await page.waitForTimeout(2000)

    const criticalErrors = errors.filter(
      err => !err.includes('favicon') && !err.includes('react-devtools')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('form submission does not hang in loading state', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })

    await page.goto('/companies/new')

    // Fill form
    await page.fill('[name="name"]', 'Loading Test Company')
    await page.selectOption('[name="industry"]', 'metal')

    // Submit form
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for either success or error (should not hang)
    await Promise.race([
      page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 10000 }),
      page.waitForSelector('[class*="error"], [class*="Error"]', { timeout: 10000 }),
      page.waitForTimeout(15000), // Max wait time
    ])

    // Check if button is still in loading state (should not be)
    const buttonText = await submitButton.textContent()
    const isStillLoading = buttonText?.includes('Kaydediliyor')

    // If still loading after 15 seconds, that's a bug
    expect(isStillLoading).toBeFalsy()
  })

  test('API endpoints respond', async ({ request }) => {
    // Test API health endpoint
    const response = await request.get('/api/test-supabase')
    expect(response.status()).toBeLessThan(500)
  })
})



