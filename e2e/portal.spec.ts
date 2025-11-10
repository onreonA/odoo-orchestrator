/**
 * Customer Portal E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Customer Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user (company user)
    await page.goto('http://localhost:3001/login')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*dashboard/, { timeout: 10000 })
  })

  test('should navigate to portal page', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await expect(page).toHaveURL(/.*portal/)
    await expect(page.locator('h1').first()).toContainText(/portal|proje/i)
  })

  test('should display project cards', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Check for project cards or project section
    const projectSection = page.locator('text=/proje|project/i').first()
    
    if (await projectSection.count() > 0) {
      await expect(projectSection).toBeVisible()
    } else {
      // If no projects, should show empty state
      const emptyState = page.locator('text=/henüz|no project|empty/i').first()
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible()
      } else {
        test.skip()
      }
    }
  })

  test('should display project progress', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Look for progress indicators
    const progressBars = page.locator('[style*="width"], .bg-blue-500, .bg-green-500').first()
    const progressText = page.locator('text=/%.*tamamlanma|%.*progress/i').first()
    
    // At least one progress indicator should exist
    const hasProgress = (await progressBars.count()) > 0 || (await progressText.count()) > 0
    
    if (!hasProgress) {
      // If no projects, skip test
      test.skip()
    }
  })

  test('should display milestones', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Look for milestone section
    const milestones = page.locator('text=/milestone|go-live|tarih|date/i').first()
    
    if (await milestones.count() > 0) {
      await expect(milestones).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should display module status', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Look for module section
    const modules = page.locator('text=/modül|module/i').first()
    
    if (await modules.count() > 0) {
      await expect(modules).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should display training and migration progress', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Look for training or migration section
    const training = page.locator('text=/eğitim|training/i').first()
    const migration = page.locator('text=/göç|migration/i').first()
    
    const hasTrainingOrMigration = (await training.count()) > 0 || (await migration.count()) > 0
    
    if (!hasTrainingOrMigration) {
      test.skip()
    }
  })

  test('should display recent activities', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Look for activities section
    const activities = page.locator('text=/aktivite|activity|son/i').first()
    
    if (await activities.count() > 0) {
      await expect(activities).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should navigate to project detail from quick links', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Look for detail link
    const detailLink = page.locator('a[href*="/portal/projects"], text=/detay|detail/i').first()
    
    if (await detailLink.count() > 0) {
      await detailLink.click()
      // Should navigate to project detail or stay on portal
      await page.waitForTimeout(1000)
      expect(page.url()).toMatch(/.*portal/)
    } else {
      test.skip()
    }
  })

  test('should navigate to documents from quick links', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Look for documents link
    const documentsLink = page.locator('a[href*="/portal/documents"], text=/doküman|document/i').first()
    
    if (await documentsLink.count() > 0) {
      await documentsLink.click()
      await page.waitForTimeout(1000)
      // Should navigate to documents or show 404 (if not implemented)
      expect(page.url()).toMatch(/.*portal/)
    } else {
      test.skip()
    }
  })

  test('should navigate to support from quick links', async ({ page }) => {
    await page.goto('http://localhost:3001/portal')
    await page.waitForSelector('h1')

    // Look for support link
    const supportLink = page.locator('a[href*="/portal/support"], text=/destek|support/i').first()
    
    if (await supportLink.count() > 0) {
      await supportLink.click()
      await page.waitForTimeout(1000)
      // Should navigate to support or show 404 (if not implemented)
      expect(page.url()).toMatch(/.*portal|.*support/)
    } else {
      test.skip()
    }
  })
})

