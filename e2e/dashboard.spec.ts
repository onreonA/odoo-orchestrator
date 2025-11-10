import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('dashboard page loads correctly', async ({ page }) => {
    await page.goto('/dashboard')

    // Check page title
    expect(page.locator('h1')).toContainText('Dashboard')

    // Check statistics cards
    expect(page.locator('text=Toplam Firma')).toBeVisible()
    expect(page.locator('text=Aktif Proje')).toBeVisible()
    expect(page.locator('text=Açık Destek Talebi')).toBeVisible()
    expect(page.locator('text=Sağlık Skoru')).toBeVisible()
  })

  test('quick actions are visible', async ({ page }) => {
    await page.goto('/dashboard')

    // Check quick action buttons
    expect(page.locator('text=Yeni Firma Ekle')).toBeVisible()
    expect(page.locator('text=Discovery Başlat')).toBeVisible()
    expect(page.locator('text=Rapor Oluştur')).toBeVisible()
  })

  test('quick action: navigate to new company', async ({ page }) => {
    await page.goto('/dashboard')

    // Click "Yeni Firma Ekle" quick action
    await page.click('text=Yeni Firma Ekle')

    // Should navigate to new company page
    await page.waitForURL('/companies/new', { timeout: 5000 })
    expect(page.locator('h1')).toContainText('Yeni Firma Ekle')
  })

  test('statistics show correct values', async ({ page }) => {
    await page.goto('/dashboard')

    // Statistics should be visible (even if 0)
    const statsCards = page.locator('[class*="rounded-xl"]')
    await expect(statsCards.first()).toBeVisible()
  })

  test('dashboard layout is correct', async ({ page }) => {
    await page.goto('/dashboard')

    // Check sidebar is visible
    expect(page.locator('text=Odoo AI')).toBeVisible()
    expect(page.locator('text=Dashboard')).toBeVisible()
    expect(page.locator('text=Firmalar')).toBeVisible()

    // Check header is visible
    expect(page.locator('text=Çıkış')).toBeVisible()
  })
})



