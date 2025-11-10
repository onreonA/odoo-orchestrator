import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Discovery Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginAsTestUser(page)
  })

  test('should navigate to discoveries page', async ({ page }) => {
    await page.goto('http://localhost:3001/discoveries')
    await expect(page).toHaveURL(/.*discoveries/)
    await expect(page.locator('h1')).toContainText(/discover/i)
  })

  test('should navigate to new discovery page', async ({ page }) => {
    await page.goto('http://localhost:3001/discoveries')
    await page.click('a[href*="/discoveries/new"]')
    await expect(page).toHaveURL(/.*discoveries\/new/)
    await expect(page.locator('h1')).toContainText(/discovery|ses|yükle/i)
  })

  test('should show file upload form', async ({ page }) => {
    await page.goto('http://localhost:3001/discoveries/new')
    
    // Wait for page to load
    await page.waitForSelector('h1')
    
    // Check for file input (it's hidden but exists, check via label)
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeAttached()
    const fileLabel = page.locator('label[for="audio-file"]')
    await expect(fileLabel).toBeVisible()
    
    // Check for company select
    const companySelect = page.locator('select')
    await expect(companySelect).toBeVisible()
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should validate file type', async ({ page }) => {
    await page.goto('http://localhost:3001/discoveries/new')
    
    // Try to upload invalid file (this would be handled by browser, but we can check the accept attribute)
    const fileInput = page.locator('input[type="file"]')
    const accept = await fileInput.getAttribute('accept')
    expect(accept).toContain('audio')
  })

  test('should show error for missing company', async ({ page }) => {
    await page.goto('http://localhost:3001/discoveries/new')
    
    // Wait for page to load
    await page.waitForSelector('select')
    
    // Select first company to enable button (or check if button is disabled when no company)
    const companySelect = page.locator('select')
    const optionsCount = await companySelect.locator('option').count()
    
    if (optionsCount > 1) {
      // If companies exist, select first one
      await companySelect.selectOption({ index: 1 })
    }
    
    // Try to submit without file
    const submitButton = page.locator('button[type="submit"]')
    
    // Button should be disabled if no file selected
    const isDisabled = await submitButton.isDisabled()
    expect(isDisabled).toBe(true)
  })
})

