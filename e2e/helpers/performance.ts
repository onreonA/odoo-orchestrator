/**
 * Performance Testing Helper
 * 
 * Bu helper, performans metriklerini ölçmek ve raporlamak için kullanılır.
 */

import { Page } from '@playwright/test'

export interface PerformanceMetrics {
  loadTime: number
  domContentLoaded: number
  firstPaint?: number
  firstContentfulPaint?: number
  networkRequests: number
  jsHeapUsed?: number
  jsHeapTotal?: number
}

/**
 * Sayfa yükleme performansını ölçer
 */
export async function measurePageLoad(
  page: Page,
  url: string
): Promise<PerformanceMetrics> {
  const startTime = Date.now()
  const requests: string[] = []

  // Network request tracking
  page.on('request', (request) => {
    requests.push(request.url())
  })

  // Performance timing
  await page.goto(url)
  await page.waitForLoadState('networkidle')

  const loadTime = Date.now() - startTime

  // Performance API'den metrikleri al
  const performanceTiming = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
      firstPaint: (performance.getEntriesByType('paint').find((e) => e.name === 'first-paint') as PerformanceEntry)?.startTime,
      firstContentfulPaint: (performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint') as PerformanceEntry)?.startTime,
    }
  })

  // Memory metrics (Playwright metrics API deprecated, using CDP instead)
  let metrics: any = {}
  try {
    const client = await page.context().newCDPSession(page)
    const performanceMetrics = await client.send('Performance.getMetrics')
    metrics = {
      JSHeapUsedSize: performanceMetrics.metrics?.find((m: any) => m.name === 'JSHeapUsedSize')?.value || 0,
      JSHeapTotalSize: performanceMetrics.metrics?.find((m: any) => m.name === 'JSHeapTotalSize')?.value || 0,
    }
  } catch {
    // Fallback if CDP not available
    metrics = { JSHeapUsedSize: 0, JSHeapTotalSize: 0 }
  }

  return {
    loadTime,
    domContentLoaded: performanceTiming.domContentLoaded,
    firstPaint: performanceTiming.firstPaint,
    firstContentfulPaint: performanceTiming.firstContentfulPaint,
    networkRequests: requests.length,
    jsHeapUsed: metrics.JSHeapUsedSize,
    jsHeapTotal: metrics.JSHeapTotalSize,
  }
}

/**
 * API response time ölçer
 */
export async function measureAPIResponse(
  page: Page,
  url: string
): Promise<number> {
  const startTime = Date.now()
  await page.request.get(url)
  return Date.now() - startTime
}

/**
 * Performans metriklerini loglar
 */
export function logPerformanceMetrics(
  name: string,
  metrics: PerformanceMetrics
): void {
  console.log(`\n📊 ${name} Performance Metrics:`)
  console.log(`  Load Time: ${metrics.loadTime}ms`)
  console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`)
  if (metrics.firstPaint) {
    console.log(`  First Paint: ${metrics.firstPaint.toFixed(2)}ms`)
  }
  if (metrics.firstContentfulPaint) {
    console.log(`  First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`)
  }
  console.log(`  Network Requests: ${metrics.networkRequests}`)
  if (metrics.jsHeapUsed) {
    console.log(`  JS Heap Used: ${(metrics.jsHeapUsed / 1024 / 1024).toFixed(2)}MB`)
  }
  if (metrics.jsHeapTotal) {
    console.log(`  JS Heap Total: ${(metrics.jsHeapTotal / 1024 / 1024).toFixed(2)}MB`)
  }
}

