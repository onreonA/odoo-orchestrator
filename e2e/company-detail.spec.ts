import { test, expect } from '@playwright/test'

test.describe('Company Detail Page', () => {
  let companyId: string

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })

    // Create a company for testing
    await page.goto('/companies/new')
    await page.fill('[name="name"]', 'Detail Test Company')
    await page.selectOption('[name="industry"]', 'furniture')
    await page.selectOption('[name="size"]', 'medium')
    await page.fill('[name="contact_person"]', 'John Doe')
    await page.fill('[name="contact_email"]', 'john@test.com')
    await page.fill('[name="contact_phone"]', '+90 555 123 4567')
    await page.fill('[name="address"]', 'Test Address')
    await page.click('button:has-text("Firmayı Ekle")')

    // Get company ID from URL
    await page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 10000 })
    const url = page.url()
    companyId = url.split('/companies/')[1]
  })

  test('company detail page loads correctly', async ({ page }) => {
    await page.goto(`/companies/${companyId}`)

    // Check page title
    expect(page.locator('h1')).toContainText('Detail Test Company')

    // Check stats cards
    expect(page.locator('text=Durum')).toBeVisible()
    expect(page.locator('text=Sağlık Skoru')).toBeVisible()
    expect(page.locator('text=Projeler')).toBeVisible()
  })

  test('company information is displayed', async ({ page }) => {
    await page.goto(`/companies/${companyId}`)

    // Check company info section
    expect(page.locator('text=Firma Bilgileri')).toBeVisible()
    expect(page.locator('text=Detail Test Company')).toBeVisible()
    expect(page.locator('text=Mobilya Üretim')).toBeVisible()
  })

  test('contact information is displayed', async ({ page }) => {
    await page.goto(`/companies/${companyId}`)

    // Check contact section
    expect(page.locator('text=İletişim')).toBeVisible()
    expect(page.locator('text=John Doe')).toBeVisible()
    expect(page.locator('text=john@test.com')).toBeVisible()
    expect(page.locator('text=+90 555 123 4567')).toBeVisible()
    expect(page.locator('text=Test Address')).toBeVisible()
  })

  test('quick actions are visible', async ({ page }) => {
    await page.goto(`/companies/${companyId}`)

    // Check quick actions
    expect(page.locator('text=Hızlı İşlemler')).toBeVisible()
    expect(page.locator('text=Discovery Başlat')).toBeVisible()
    expect(page.locator('text=Proje Oluştur')).toBeVisible()
    expect(page.locator('text=Excel Import')).toBeVisible()
    expect(page.locator('text=Rapor Oluştur')).toBeVisible()
  })

  test('edit button navigates to edit page', async ({ page }) => {
    await page.goto(`/companies/${companyId}`)

    // Click edit button
    await page.click('text=Düzenle')

    // Should navigate to edit page
    await page.waitForURL(`/companies/${companyId}/edit`)
    expect(page.locator('h1')).toContainText('Firmayı Düzenle')
  })

  test('back button navigates to companies list', async ({ page }) => {
    await page.goto(`/companies/${companyId}`)

    // Click back button
    const backButton = page
      .locator('a[href="/companies"]')
      .or(page.locator('button').filter({ hasText: /arrow/i }))
    if ((await backButton.count()) > 0) {
      await backButton.first().click()
    } else {
      await page.click('a[href="/companies"]')
    }

    // Should navigate to companies list
    await page.waitForURL('/companies')
    expect(page.locator('h1')).toContainText('Firmalar')
  })

  test('projects section is visible', async ({ page }) => {
    await page.goto(`/companies/${companyId}`)

    // Check projects section
    expect(page.locator('text=Projeler')).toBeVisible()
    expect(page.locator('text=Yeni Proje')).toBeVisible()
  })
})
