import { test, expect } from '@playwright/test'

test.describe('Companies CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('user can view companies list', async ({ page }) => {
    await page.goto('/companies')

    // Check if companies page loads
    expect(page.locator('h1')).toContainText('Firmalar')
    expect(page.locator('text=Yeni Firma Ekle')).toBeVisible()
  })

  test('user can create a company', async ({ page }) => {
    await page.goto('/companies')

    // Click "Yeni Firma Ekle"
    await page.click('text=Yeni Firma Ekle')
    await page.waitForURL('/companies/new')

    // Fill form
    await page.fill('[name="name"]', 'Test Furniture Co')
    await page.selectOption('[name="industry"]', 'furniture')
    await page.selectOption('[name="size"]', 'medium')
    await page.fill('[name="contact_person"]', 'John Doe')
    await page.fill('[name="contact_email"]', 'john@test.com')

    // Submit
    await page.click('button:has-text("Firmayı Ekle")')

    // Should redirect to company detail
    await page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 10000 })
    expect(page.locator('h1')).toContainText('Test Furniture Co')
  })

  test('form validation works', async ({ page }) => {
    await page.goto('/companies/new')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors (HTML5 validation)
    const nameInput = page.locator('input[name="name"]')
    const validity = await nameInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(validity).toBe(false)
  })

  test('form validation: required fields', async ({ page }) => {
    await page.goto('/companies/new')

    // Check required fields
    const nameInput = page.locator('input[name="name"]')
    const industrySelect = page.locator('select[name="industry"]')

    await expect(nameInput).toHaveAttribute('required', '')
    await expect(industrySelect).toHaveAttribute('required', '')
  })

  test('form validation: email format', async ({ page }) => {
    await page.goto('/companies/new')

    // Fill form with invalid email
    await page.fill('[name="name"]', 'Test Company')
    await page.selectOption('[name="industry"]', 'furniture')
    await page.fill('[name="contact_email"]', 'invalid-email')

    // Email validation should work
    const emailInput = page.locator('input[name="contact_email"]')
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(validity).toBe(false)
  })

  test('user can edit a company', async ({ page }) => {
    // First create a company
    await page.goto('/companies/new')
    await page.fill('[name="name"]', 'Original Name')
    await page.selectOption('[name="industry"]', 'furniture')
    await page.click('button:has-text("Firmayı Ekle")')
    await page.waitForURL(/\/companies\/[a-f0-9-]+/)

    // Click edit button
    await page.click('text=Düzenle')
    await page.waitForURL(/\/companies\/[a-f0-9-]+\/edit/)

    // Change name
    await page.fill('[name="name"]', 'Updated Name')
    await page.click('button:has-text("Değişiklikleri Kaydet")')

    // Should redirect back and show updated name
    await page.waitForURL(/\/companies\/[a-f0-9-]+/)
    expect(page.locator('h1')).toContainText('Updated Name')
  })

  test('user can delete a company', async ({ page }) => {
    // First create a company
    await page.goto('/companies/new')
    await page.fill('[name="name"]', 'To Delete')
    await page.selectOption('[name="industry"]', 'furniture')
    await page.click('button:has-text("Firmayı Ekle")')
    await page.waitForURL(/\/companies\/[a-f0-9-]+/)

    // Click delete button
    await page.click('text=Sil')

    // Confirm deletion
    await page.click('text=Evet, Sil')

    // Should redirect to companies list
    await page.waitForURL('/companies')

    // Company should not be in list
    await expect(page.locator('text=To Delete')).not.toBeVisible()
  })
})
