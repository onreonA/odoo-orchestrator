import { test, expect } from '@playwright/test'

/**
 * Loading State Tests
 * Form submit'lerde loading state'in doğru çalıştığını kontrol eder
 */
test.describe('Loading State Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('loading state resets on form error', async ({ page }) => {
    await page.goto('/companies/new')

    // Try to submit empty form (should fail validation)
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait a bit
    await page.waitForTimeout(1000)

    // Button should not be in loading state after validation error
    const buttonText = await submitButton.textContent()
    const isDisabled = await submitButton.isDisabled()

    // Button might be disabled due to HTML5 validation, but shouldn't show "Kaydediliyor"
    if (buttonText) {
      expect(buttonText).not.toContain('Kaydediliyor')
    }
  })

  test('loading state shows during submission', async ({ page }) => {
    await page.goto('/companies/new')

    // Fill form with valid data
    await page.fill('[name="name"]', 'Loading State Test')
    await page.selectOption('[name="industry"]', 'metal')

    // Submit form
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Immediately check if loading state appears
    const buttonText = await submitButton.textContent()
    const isLoading = buttonText?.includes('Kaydediliyor') || (await submitButton.isDisabled())

    // Should show loading state briefly
    expect(isLoading).toBeTruthy()

    // Wait for completion (success or error)
    await Promise.race([
      page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 10000 }),
      page.waitForSelector('[class*="error"]', { timeout: 10000 }),
      page.waitForTimeout(15000),
    ])

    // After completion, loading should be gone
    const finalButtonText = await submitButton.textContent()
    if (finalButtonText) {
      expect(finalButtonText).not.toContain('Kaydediliyor')
    }
  })

  test('loading state resets on navigation away', async ({ page }) => {
    await page.goto('/companies/new')

    // Fill form
    await page.fill('[name="name"]', 'Test')
    await page.selectOption('[name="industry"]', 'metal')

    // Start submission
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Immediately navigate away
    await page.click('a[href="/companies"]')
    await page.waitForURL('/companies')

    // Should navigate successfully (loading state shouldn't block navigation)
    expect(page.url()).toContain('/companies')
  })
})



