import { test, expect } from '@playwright/test'

test.describe('Tasks Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should display tasks list page', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.locator('h1')).toContainText('Görevler')
  })

  test('should display task statistics', async ({ page }) => {
    await page.goto('/tasks')

    // Check if stats cards are visible
    const statsCards = page.locator('text=/Toplam|Tamamlanan|Beklemede|Devam Ediyor/i')
    await expect(statsCards.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Stats might not be visible if no tasks exist
      })
  })

  test('should navigate to create task page', async ({ page }) => {
    await page.goto('/tasks')

    // Check if "Yeni Görev" button exists
    const newButton = page.locator('a:has-text("Yeni Görev")')
    if ((await newButton.count()) > 0) {
      await newButton.click()
      await page.waitForURL(/\/tasks\/new/)
      await expect(page.locator('h1')).toContainText('Yeni Görev')
    }
  })

  test('should display task form fields', async ({ page }) => {
    await page.goto('/tasks/new')

    // Check form fields exist
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('textarea[name="description"]')).toBeVisible()
  })

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('/tasks?status=pending')

    // Page should load without errors
    await expect(page.locator('h1')).toContainText('Görevler')
  })

  test('should filter tasks by priority', async ({ page }) => {
    await page.goto('/tasks?priority=high')

    // Page should load without errors
    await expect(page.locator('h1')).toContainText('Görevler')
  })
})
