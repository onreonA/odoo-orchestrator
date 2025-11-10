import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can register', async ({ page }) => {
    await page.goto('/register')

    // Wait for form to be visible
    await page.waitForSelector('#fullName')

    // Fill registration form - use id selectors
    await page.fill('#fullName', 'Test User')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard (with longer timeout for registration)
    await page.waitForURL('/dashboard', { timeout: 15000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('user can login', async ({ page }) => {
    await page.goto('/login')

    // Wait for form to be visible
    await page.waitForSelector('#email')

    // Fill login form - use id selectors
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword123')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('user can logout', async ({ page }) => {
    // First login (you might need to set up auth state)
    await page.goto('/dashboard')

    // Click logout button
    await page.click('button:has-text("Çıkış")')

    // Should redirect to login
    await page.waitForURL('/login')
    expect(page.url()).toContain('/login')
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login if not authenticated
    await page.waitForURL('/login', { timeout: 5000 })
  })
})
