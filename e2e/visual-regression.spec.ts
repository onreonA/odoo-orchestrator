/**
 * Visual Regression Tests
 * 
 * Bu testler, UI'da beklenmeyen görsel değişiklikleri tespit eder.
 * İlk çalıştırmada baseline screenshot'ları oluşturur,
 * sonraki çalıştırmalarda mevcut screenshot'ları baseline ile karşılaştırır.
 */

import { test, expect } from '@playwright/test'
import { visualRegression, fullPageScreenshot, elementScreenshot } from './helpers/visual-regression'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('dashboard page visual regression', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Full page screenshot
    await fullPageScreenshot(page, 'dashboard-full', {
      threshold: 0.2, // %20 fark toleransı
    })
  })

  test('dashboard statistics cards visual regression', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Statistics cards screenshot
    await elementScreenshot(page, '[class*="rounded-xl"]', 'dashboard-statistics', {
      threshold: 0.2,
    })
  })

  test('companies list page visual regression', async ({ page }) => {
    await page.goto('/companies')
    await page.waitForLoadState('networkidle')
    
    await fullPageScreenshot(page, 'companies-list', {
      threshold: 0.2,
    })
  })

  test('companies new form visual regression', async ({ page }) => {
    await page.goto('/companies/new')
    await page.waitForLoadState('networkidle')
    
    await fullPageScreenshot(page, 'companies-new-form', {
      threshold: 0.2,
    })
  })

  test('calendar page visual regression', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    
    await fullPageScreenshot(page, 'calendar-view', {
      threshold: 0.2,
    })
  })

  test('emails inbox visual regression', async ({ page }) => {
    await page.goto('/emails')
    await page.waitForLoadState('networkidle')
    
    await fullPageScreenshot(page, 'emails-inbox', {
      threshold: 0.2,
    })
  })

  test('messages page visual regression', async ({ page }) => {
    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    
    await fullPageScreenshot(page, 'messages-list', {
      threshold: 0.2,
    })
  })

  test('discoveries page visual regression', async ({ page }) => {
    await page.goto('/discoveries')
    await page.waitForLoadState('networkidle')
    
    await fullPageScreenshot(page, 'discoveries-list', {
      threshold: 0.2,
    })
  })

  test('templates page visual regression', async ({ page }) => {
    await page.goto('/templates')
    await page.waitForLoadState('networkidle')
    
    await fullPageScreenshot(page, 'templates-list', {
      threshold: 0.2,
    })
  })

  test('sidebar navigation visual regression', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Sidebar screenshot
    await elementScreenshot(page, 'nav, aside, [role="navigation"]', 'sidebar-navigation', {
      threshold: 0.2,
    })
  })
})

