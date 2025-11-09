import { test, expect } from '@playwright/test'

test.describe('Registration Flow', () => {
  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register')

    // Check page elements
    expect(page.locator('h1')).toContainText('Kayıt Ol')
    expect(page.locator('input[name="fullName"]')).toBeVisible()
    expect(page.locator('input[name="email"]')).toBeVisible()
    expect(page.locator('input[name="password"]')).toBeVisible()
    expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('form validation works', async ({ page }) => {
    await page.goto('/register')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Required fields should show validation
    const nameInput = page.locator('input[name="fullName"]')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')

    // Check HTML5 validation
    await expect(nameInput).toHaveAttribute('required', '')
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
  })

  test('invalid email shows validation', async ({ page }) => {
    await page.goto('/register')

    await page.fill('[name="fullName"]', 'Test User')
    await page.fill('[name="email"]', 'invalid-email')
    await page.fill('[name="password"]', 'password123')

    // HTML5 email validation should prevent submission
    const emailInput = page.locator('input[name="email"]')
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(validity).toBe(false)
  })

  test('can navigate to login from register', async ({ page }) => {
    await page.goto('/register')

    // Click login link
    await page.click('a[href="/login"]')

    // Should navigate to login
    await page.waitForURL('/login')
    expect(page.locator('h1')).toContainText('Giriş Yap')
  })

  test('password field is secure', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('input[name="password"]')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
