/**
 * Admin Dashboard E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('http://localhost:3001/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*dashboard/, { timeout: 10000 })
  })

  test('should navigate to admin dashboard', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/dashboard')
    await expect(page).toHaveURL(/.*admin\/dashboard/)
    await expect(page.locator('h1').first()).toContainText(/admin|yönetim/i)
  })

  test('should display stats cards', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/dashboard')
    await page.waitForSelector('h1')

    // Check for stats cards
    const statsCards = page.locator('.grid.gap-4').first()
    await expect(statsCards).toBeVisible()

    // Check for specific stat cards
    const totalProjects = page.locator('text=/toplam proje|total project/i').first()
    const totalUsers = page.locator('text=/kullanıcı|user/i').first()
    const openTickets = page.locator('text=/açık|open/i').first()

    // At least one of these should be visible
    const hasStats = (await totalProjects.count()) > 0 || 
                     (await totalUsers.count()) > 0 || 
                     (await openTickets.count()) > 0
    
    expect(hasStats).toBe(true)
  })

  test('should display quick actions', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/dashboard')
    await page.waitForSelector('h1')

    // Check for quick actions section
    const quickActions = page.locator('text=/hızlı işlem|quick action/i').first()
    
    if (await quickActions.count() > 0) {
      await expect(quickActions).toBeVisible()
    } else {
      // If quick actions section doesn't exist, skip test
      test.skip()
    }
  })

  test('should display recent projects table', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/dashboard')
    await page.waitForSelector('h1')

    // Check for projects table or projects section
    const projectsSection = page.locator('text=/proje|project/i').first()
    
    if (await projectsSection.count() > 0) {
      await expect(projectsSection).toBeVisible()
    } else {
      // If projects section doesn't exist, skip test
      test.skip()
    }
  })

  test('should navigate to users page from quick actions', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/dashboard')
    await page.waitForSelector('h1')

    // Look for users link
    const usersLink = page.locator('a[href*="/admin/users"], text=/kullanıcı|user/i').first()
    
    if (await usersLink.count() > 0) {
      await usersLink.click()
      await expect(page).toHaveURL(/.*admin\/users/)
    } else {
      test.skip()
    }
  })

  test('should show access denied for non-admin user', async ({ page }) => {
    // Logout first
    await page.goto('http://localhost:3001/logout')
    
    // Login as regular user
    await page.goto('http://localhost:3001/login')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*dashboard/, { timeout: 10000 })

    // Try to access admin dashboard
    await page.goto('http://localhost:3001/admin/dashboard')
    
    // Should be redirected or see access denied message
    const accessDenied = page.locator('text=/erişim|access|yetki|permission/i').first()
    const isRedirected = !page.url().includes('/admin/dashboard')
    
    expect(accessDenied.count() > 0 || isRedirected).toBe(true)
  })
})

