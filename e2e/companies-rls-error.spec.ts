import { test, expect } from '@playwright/test'

/**
 * RLS (Row Level Security) Error Test
 * Bu test, firma eklerken RLS policy hatası olmamasını kontrol eder
 */
test.describe('Companies RLS Policy', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('user can create company without RLS error', async ({ page }) => {
    await page.goto('/companies/new')

    // Fill form with valid data
    await page.fill('[name="name"]', 'Test Company RLS')
    await page.selectOption('[name="industry"]', 'metal')
    await page.selectOption('[name="size"]', 'medium')
    await page.fill('[name="contact_person"]', 'Test User')
    await page.fill('[name="contact_email"]', 'test@company.com')
    await page.fill('[name="contact_phone"]', '05554443322')
    await page.fill('[name="address"]', 'Test Address')

    // Submit form
    await page.click('button:has-text("Firmayı Ekle")')

    // Should NOT show RLS error
    const errorMessage = page.locator('text=new row violates row-level security policy')
    await expect(errorMessage).not.toBeVisible({ timeout: 2000 })

    // Should redirect to company detail page (success)
    await page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 10000 })
    expect(page.locator('h1')).toContainText('Test Company RLS')
  })

  test('error message shows if RLS policy fails', async ({ page }) => {
    // This test documents what happens if RLS fails
    // In normal operation, this should not happen after the fix

    await page.goto('/companies/new')

    // Fill form
    await page.fill('[name="name"]', 'Test Company')
    await page.selectOption('[name="industry"]', 'metal')

    // Submit
    await page.click('button:has-text("Firmayı Ekle")')

    // Wait a bit to see if error appears
    await page.waitForTimeout(2000)

    // Check if there's an error message (should not be RLS error)
    const errorContainer = page.locator('[class*="error"], [class*="Error"]')
    const hasError = (await errorContainer.count()) > 0

    if (hasError) {
      const errorText = await errorContainer.first().textContent()
      // RLS error should not appear
      expect(errorText).not.toContain('row-level security policy')
    }
  })
})

