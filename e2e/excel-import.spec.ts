import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Excel Import Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginAsTestUser(page)
  })

  test('should navigate to excel import page', async ({ page }) => {
    await page.goto('http://localhost:3001/excel/import')
    await expect(page).toHaveURL(/.*excel\/import/)
    await expect(page.locator('h1')).toContainText(/excel|import|içe aktar/i)
  })

  test('should show file upload form', async ({ page }) => {
    await page.goto('http://localhost:3001/excel/import')

    // Wait for page to load
    await page.waitForSelector('h1')

    // Check for file input (it's hidden but exists, check via label)
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeAttached()
    const fileLabel = page.locator('label[for="excel-file"]')
    await expect(fileLabel).toBeVisible()

    // Check for import type selection buttons
    const productsButton = page.locator('button:has-text("Ürünler")')
    await expect(productsButton).toBeVisible()

    // Check for company select
    const companySelect = page.locator('select')
    await expect(companySelect).toBeVisible()
  })

  test('should show import type options', async ({ page }) => {
    await page.goto('http://localhost:3001/excel/import')

    // Wait for page to load
    await page.waitForSelector('h1')

    // Check for Products button
    const productsButton = page.locator('button:has-text("Ürünler")')
    await expect(productsButton).toBeVisible()

    // Check for BOM button
    const bomButton = page.locator('button:has-text("BOM")')
    await expect(bomButton).toBeVisible()

    // Check for Employees button
    const employeesButton = page.locator('button:has-text("Çalışanlar")')
    await expect(employeesButton).toBeVisible()
  })

  test('should show Odoo connection fields', async ({ page }) => {
    await page.goto('http://localhost:3001/excel/import')

    // Wait for page to load
    await page.waitForSelector('h1')

    // Check for Odoo URL field (by placeholder or label)
    const odooUrlInput = page.locator(
      'input[placeholder*="odoo"], input[placeholder*="Odoo"], input[placeholder*="example.com"]'
    )
    await expect(odooUrlInput.first()).toBeVisible()

    // Check for database field
    const dbInput = page.locator(
      'input[placeholder*="database"], input[placeholder*="veritabanı"], input[placeholder*="odoo_db"]'
    )
    await expect(dbInput.first()).toBeVisible()

    // Check for username field
    const usernameInput = page.locator(
      'input[placeholder*="admin"], input[placeholder*="kullanıcı"]'
    )
    await expect(usernameInput.first()).toBeVisible()

    // Check for password field
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('http://localhost:3001/excel/import')

    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()
  })
})
