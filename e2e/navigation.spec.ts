import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard')

    // Navigate to Companies
    await page.click('a[href="/companies"]')
    await page.waitForURL('/companies')
    expect(page.locator('h1')).toContainText('Firmalar')

    // Navigate back to Dashboard
    await page.click('a[href="/dashboard"]')
    await page.waitForURL('/dashboard')
    expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('active navigation item is highlighted', async ({ page }) => {
    await page.goto('/dashboard')

    // Dashboard link should be active
    const dashboardLink = page.locator('a[href="/dashboard"]')
    await expect(dashboardLink).toHaveClass(/bg-\[var\(--brand-primary-50\)\]/)

    // Navigate to Companies
    await page.click('a[href="/companies"]')
    await page.waitForURL('/companies')

    // Companies link should be active
    const companiesLink = page.locator('a[href="/companies"]')
    await expect(companiesLink).toHaveClass(/bg-\[var\(--brand-primary-50\)\]/)
  })

  test('breadcrumb navigation works', async ({ page }) => {
    // Go to companies list
    await page.goto('/companies')

    // Click "Yeni Firma Ekle"
    await page.click('text=Yeni Firma Ekle')
    await page.waitForURL('/companies/new')

    // Check back button exists
    const backButton = page
      .locator('button')
      .filter({ hasText: /arrow/i })
      .or(page.locator('a[href="/companies"]'))
    await expect(backButton.first()).toBeVisible()
  })

  test('header logout works', async ({ page }) => {
    await page.goto('/dashboard')

    // Click logout button
    await page.click('text=Çıkış')

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})



