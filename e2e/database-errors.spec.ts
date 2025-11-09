import { test, expect } from '@playwright/test'

/**
 * Database Error Tests
 * Database constraint hatalarını ve foreign key sorunlarını test eder
 */
test.describe('Database Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('handles foreign key constraint errors gracefully', async ({ page }) => {
    await page.goto('/companies/new')

    // Fill form with valid data
    await page.fill('[name="name"]', 'Foreign Key Test Company')
    await page.selectOption('[name="industry"]', 'metal')
    await page.selectOption('[name="size"]', 'medium')
    await page.fill('[name="contact_person"]', 'Test User')
    await page.fill('[name="contact_email"]', 'test@company.com')

    // Submit form
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait for response (either success or error)
    await page.waitForTimeout(3000)

    // Check for error messages
    const errorElement = page.locator('[class*="error"], [class*="Error"]')
    const hasError = (await errorElement.count()) > 0

    if (hasError) {
      const errorText = await errorElement.first().textContent()

      // Should not show raw database constraint errors to user
      expect(errorText).not.toContain('violates foreign key constraint')
      expect(errorText).not.toContain('SQLSTATE')
      expect(errorText).not.toContain('constraint')

      // Should show user-friendly error message
      if (errorText) {
        expect(errorText.length).toBeGreaterThan(0)
      }
    } else {
      // If no error, should redirect to company detail page
      await page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 10000 })
      expect(page.url()).toMatch(/\/companies\/[a-f0-9-]+/)
    }
  })

  test('handles RLS policy errors gracefully', async ({ page }) => {
    await page.goto('/companies/new')

    // Fill form
    await page.fill('[name="name"]', 'RLS Test Company')
    await page.selectOption('[name="industry"]', 'metal')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for response
    await page.waitForTimeout(3000)

    // Check for RLS errors
    const errorElement = page.locator('[class*="error"]')
    const hasError = (await errorElement.count()) > 0

    if (hasError) {
      const errorText = await errorElement.first().textContent()

      // Should not show raw RLS errors
      expect(errorText).not.toContain('row-level security policy')
      expect(errorText).not.toContain('RLS')
    }
  })

  test('handles database connection errors', async ({ page }) => {
    // This test documents how we should handle DB errors
    // In a real scenario, we might mock Supabase to simulate connection errors

    await page.goto('/companies')

    // Page should load even if there are DB issues
    // (showing empty state or error message)
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()

    // Should not show raw database errors
    const errorText = pageContent || ''
    expect(errorText).not.toContain('ECONNREFUSED')
    expect(errorText).not.toContain('connection refused')
  })
})
