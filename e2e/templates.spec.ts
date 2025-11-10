import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Templates Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginAsTestUser(page)
  })

  test('should navigate to templates page', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')
    await expect(page).toHaveURL(/.*templates/)
    await expect(page.locator('h1')).toContainText(/template/i)
  })

  test('should show search and filter options', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')
    
    // Check for search input
    const searchInput = page.locator('input[type="text"][placeholder*="ara"], input[type="text"][placeholder*="search"]')
    await expect(searchInput).toBeVisible()
    
    // Check for industry filter
    const filterSelect = page.locator('select')
    await expect(filterSelect).toBeVisible()
  })

  test('should navigate to template detail page', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')
    
    // Wait for templates to load
    await page.waitForTimeout(1000)
    
    // Try to find a template card and click "Detaylar" or template name
    const templateLink = page.locator('a[href*="/templates/"]').first()
    
    if (await templateLink.count() > 0) {
      await templateLink.click()
      await expect(page).toHaveURL(/.*templates\/[^/]+$/)
      await expect(page.locator('h1')).toBeVisible()
    } else {
      // If no templates, should show empty state
      await expect(page.locator('text=/henüz template|no template|template bulunamadı/i')).toBeVisible()
    }
  })

  test('should navigate to apply template page', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')
    
    // Wait for templates to load
    await page.waitForTimeout(1000)
    
    // Try to find "Uygula" button
    const applyButton = page.locator('a[href*="/apply"], button:has-text("Uygula")').first()
    
    if (await applyButton.count() > 0) {
      await applyButton.click()
      await expect(page).toHaveURL(/.*templates\/.*\/apply/)
      await expect(page.locator('h1')).toContainText(/uygula|apply/i)
    }
  })

  test('should show template details when available', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')
    
    // Wait for templates to load
    await page.waitForTimeout(1000)
    
    const templateLink = page.locator('a[href*="/templates/"]').first()
    
    if (await templateLink.count() > 0) {
      await templateLink.click()
      await page.waitForURL(/.*templates\/[^/]+$/)
      
      // Check for template name
      await expect(page.locator('h1')).toBeVisible()
      
      // Check for modules section (if template has modules)
      const modulesSection = page.locator('text=/modül|module/i')
      if (await modulesSection.count() > 0) {
        await expect(modulesSection.first()).toBeVisible()
      }
    }
  })

  test('should show apply form with required fields', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')
    
    // Wait for templates to load
    await page.waitForTimeout(1000)
    
    const applyButton = page.locator('a[href*="/apply"]').first()
    
    if (await applyButton.count() > 0) {
      await applyButton.click()
      await page.waitForURL(/.*templates\/.*\/apply/)
      
      // Check for company select
      await expect(page.locator('select')).toBeVisible()
      
      // Check for Odoo connection fields
      await expect(page.locator('input[type="password"]')).toBeVisible()
      
      // Check for submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    }
  })
})

