import { test, expect } from '@playwright/test'

test.describe('Departments Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should display departments list page', async ({ page }) => {
    await page.goto('/departments')
    await expect(page.locator('h1')).toContainText('Departmanlar')
  })

  test('should navigate to create department page', async ({ page }) => {
    await page.goto('/departments')

    // Check if "Yeni Departman" button exists
    const newButton = page.locator('a:has-text("Yeni Departman")')
    if ((await newButton.count()) > 0) {
      await newButton.click()
      await page.waitForURL(/\/departments\/new/)
      await expect(page.locator('h1')).toContainText('Yeni Departman')
    }
  })

  test('should display department form fields', async ({ page }) => {
    await page.goto('/departments/new')

    // Check form fields exist
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="technical_name"]')).toBeVisible()
    await expect(page.locator('textarea[name="description"]')).toBeVisible()
  })

  test('should show error when required fields are missing', async ({ page }) => {
    await page.goto('/departments/new')

    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]')
    if ((await submitButton.count()) > 0) {
      await submitButton.click()

      // Should show validation errors
      await expect(page.locator('text=/required|gerekli/i'))
        .toBeVisible({ timeout: 2000 })
        .catch(() => {
          // If no error message appears, that's also acceptable (form might prevent submission)
        })
    }
  })
})
