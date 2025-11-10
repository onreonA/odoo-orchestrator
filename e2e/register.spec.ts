import { test, expect } from '@playwright/test'

test.describe('Registration Flow', () => {
  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register')

    // Wait for page to load
    await page.waitForSelector('#fullName')

    // Check page elements - use id selectors
    await expect(page.locator('h1')).toContainText(/kayıt|register/i)
    await expect(page.locator('#fullName')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('form validation works', async ({ page }) => {
    await page.goto('/register')
    await page.waitForSelector('#fullName')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Required fields should show validation - use id selectors
    const nameInput = page.locator('#fullName')
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')

    // Check HTML5 validation
    await expect(nameInput).toHaveAttribute('required', '')
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
  })

  test('invalid email shows validation', async ({ page }) => {
    await page.goto('/register')
    await page.waitForSelector('#email')

    await page.fill('#fullName', 'Test User')
    await page.fill('#email', 'invalid-email')
    await page.fill('#password', 'password123')

    // HTML5 email validation should prevent submission
    const emailInput = page.locator('#email')
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
    await page.waitForSelector('#password')

    const passwordInput = page.locator('#password')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
