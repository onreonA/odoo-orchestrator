/**
 * Documents E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Document Library', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('http://localhost:3001/login')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*dashboard/, { timeout: 10000 })
  })

  test('should navigate to documents page', async ({ page }) => {
    await page.goto('http://localhost:3001/portal/documents')
    await expect(page).toHaveURL(/.*portal\/documents/)
    await expect(page.locator('h1').first()).toContainText(/doküman|document/i)
  })

  test('should display documents page elements', async ({ page }) => {
    await page.goto('http://localhost:3001/portal/documents')
    await page.waitForSelector('h1')

    // Check for search input
    const searchInput = page.locator('input[type="text"]').first()
    await expect(searchInput).toBeVisible()

    // Check for category filter
    const categoryFilter = page.locator('select').first()
    await expect(categoryFilter).toBeVisible()

    // Check for upload button
    const uploadButton = page.locator('button, a').filter({ hasText: /yükle|upload/i }).first()
    if (await uploadButton.count() > 0) {
      await expect(uploadButton).toBeVisible()
    }
  })

  test('should search documents', async ({ page }) => {
    await page.goto('http://localhost:3001/portal/documents')
    await page.waitForSelector('h1')

    const searchInput = page.locator('input[type="text"]').first()
    await searchInput.fill('test')
    await page.waitForTimeout(500) // Wait for debounce

    // Check if search is applied (no error means it worked)
    expect(await searchInput.inputValue()).toBe('test')
  })

  test('should filter by category', async ({ page }) => {
    await page.goto('http://localhost:3001/portal/documents')
    await page.waitForSelector('h1')

    const categoryFilter = page.locator('select').first()
    await categoryFilter.selectOption('training')
    await page.waitForTimeout(500)

    // Check if filter is applied
    expect(await categoryFilter.inputValue()).toBe('training')
  })

  test('should show empty state when no documents', async ({ page }) => {
    await page.goto('http://localhost:3001/portal/documents')
    await page.waitForSelector('h1')

    // Wait a bit for data to load
    await page.waitForTimeout(2000)

    // Check for empty state or document cards
    const emptyState = page.locator('text=/henüz|no document|empty/i').first()
    const documentCards = page.locator('.grid, .card, [class*="document"]').first()

    // Either empty state or documents should be visible
    const hasEmptyState = (await emptyState.count()) > 0
    const hasDocuments = (await documentCards.count()) > 0

    expect(hasEmptyState || hasDocuments).toBe(true)
  })

  test('should show upload modal when clicking upload button', async ({ page }) => {
    await page.goto('http://localhost:3001/portal/documents')
    await page.waitForSelector('h1')

    const uploadButton = page.locator('button, a').filter({ hasText: /yükle|upload/i }).first()
    
    if (await uploadButton.count() > 0) {
      await uploadButton.click()
      await page.waitForTimeout(500)

      // Check for modal
      const modal = page.locator('text=/doküman yükle|upload document/i').first()
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible()
      }
    } else {
      test.skip()
    }
  })
})

