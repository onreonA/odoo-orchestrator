/**
 * Performance Tests
 *
 * Bu testler, sayfa yükleme süreleri, API response time'ları ve
 * genel performans metriklerini ölçer.
 */

import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('dashboard page load performance', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Dashboard 3 saniyeden hızlı yüklenmeli
    expect(loadTime).toBeLessThan(3000)

    console.log(`Dashboard load time: ${loadTime}ms`)
  })

  test('companies list page load performance', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/companies')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Companies list 3 saniyeden hızlı yüklenmeli
    expect(loadTime).toBeLessThan(3000)

    console.log(`Companies list load time: ${loadTime}ms`)
  })

  test('calendar page load performance', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Calendar 3 saniyeden hızlı yüklenmeli
    expect(loadTime).toBeLessThan(3000)

    console.log(`Calendar load time: ${loadTime}ms`)
  })

  test('emails page load performance', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/emails')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Emails 3 saniyeden hızlı yüklenmeli
    expect(loadTime).toBeLessThan(3000)

    console.log(`Emails load time: ${loadTime}ms`)
  })

  test('messages page load performance', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // Messages 3 saniyeden hızlı yüklenmeli
    expect(loadTime).toBeLessThan(3000)

    console.log(`Messages load time: ${loadTime}ms`)
  })

  test('API response time - companies list', async ({ page }) => {
    const startTime = Date.now()

    const response = await page.request.get('/api/companies')
    const responseTime = Date.now() - startTime

    expect(response.status()).toBe(200)
    // API 1 saniyeden hızlı yanıt vermeli
    expect(responseTime).toBeLessThan(1000)

    console.log(`Companies API response time: ${responseTime}ms`)
  })

  test('API response time - calendar events', async ({ page }) => {
    const startTime = Date.now()

    const response = await page.request.get('/api/calendar/events')
    const responseTime = Date.now() - startTime

    expect(response.status()).toBe(200)
    // API 1 saniyeden hızlı yanıt vermeli
    expect(responseTime).toBeLessThan(1000)

    console.log(`Calendar events API response time: ${responseTime}ms`)
  })

  test('API response time - messages threads', async ({ page }) => {
    const startTime = Date.now()

    const response = await page.request.get('/api/messages/threads')
    const responseTime = Date.now() - startTime

    expect(response.status()).toBe(200)
    // API 1 saniyeden hızlı yanıt vermeli
    expect(responseTime).toBeLessThan(1000)

    console.log(`Messages threads API response time: ${responseTime}ms`)
  })

  test('memory usage - dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Memory kullanımını kontrol et (CDP kullanarak)
    try {
      const client = await page.context().newCDPSession(page)
      const performanceMetrics = await client.send('Performance.getMetrics')
      const jsHeapUsed =
        performanceMetrics.metrics?.find((m: any) => m.name === 'JSHeapUsedSize')?.value || 0

      if (jsHeapUsed > 0) {
        const heapUsedMB = jsHeapUsed / 1024 / 1024
        console.log(`JS Heap Used: ${heapUsedMB.toFixed(2)}MB`)
        // Bu test şimdilik sadece log, threshold belirlemek için veri topluyoruz
      }
    } catch {
      // CDP not available, skip memory test
      console.log('Memory metrics not available')
    }
  })

  test('network requests count - dashboard', async ({ page }) => {
    const requests: string[] = []

    page.on('request', request => {
      requests.push(request.url())
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Dashboard için makul sayıda request olmalı (50'den az)
    expect(requests.length).toBeLessThan(50)

    console.log(`Dashboard network requests: ${requests.length}`)
  })
})
