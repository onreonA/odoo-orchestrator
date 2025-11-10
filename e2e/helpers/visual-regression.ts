/**
 * Visual Regression Testing Helper
 * 
 * Bu helper, Playwright'ın built-in screenshot comparison özelliğini kullanarak
 * visual regression testleri yapmayı kolaylaştırır.
 */

import { Page, expect } from '@playwright/test'

export interface VisualRegressionOptions {
  /** Screenshot adı (dosya adı olarak kullanılır) */
  name: string
  /** Screenshot alınacak element (opsiyonel, yoksa tüm sayfa) */
  element?: string
  /** Threshold (0-1 arası, varsayılan: 0.2) */
  threshold?: number
  /** Max diff pixels (varsayılan: 0) */
  maxDiffPixels?: number
  /** Animasyonların bitmesini bekle */
  waitForAnimations?: boolean
}

/**
 * Visual regression test helper
 * 
 * @example
 * ```ts
 * await visualRegression(page, {
 *   name: 'dashboard-home',
 *   threshold: 0.2
 * })
 * ```
 */
export async function visualRegression(
  page: Page,
  options: VisualRegressionOptions
): Promise<void> {
  const {
    name,
    element,
    threshold = 0.2,
    maxDiffPixels = 0,
    waitForAnimations = true,
  } = options

  // Animasyonların bitmesini bekle
  if (waitForAnimations) {
    await page.waitForTimeout(500)
  }

  // Element varsa sadece o elementi, yoksa tüm sayfayı screenshot al
  if (element) {
    const locator = page.locator(element).first()
    await expect(locator).toHaveScreenshot(name, {
      threshold,
      maxDiffPixels,
    })
  } else {
    await expect(page).toHaveScreenshot(name, {
      threshold,
      maxDiffPixels,
    })
  }
}

/**
 * Full page screenshot helper
 */
export async function fullPageScreenshot(
  page: Page,
  name: string,
  options?: { threshold?: number; maxDiffPixels?: number }
): Promise<void> {
  await visualRegression(page, {
    name,
    threshold: options?.threshold,
    maxDiffPixels: options?.maxDiffPixels,
    waitForAnimations: true,
  })
}

/**
 * Element screenshot helper
 */
export async function elementScreenshot(
  page: Page,
  element: string,
  name: string,
  options?: { threshold?: number; maxDiffPixels?: number }
): Promise<void> {
  await visualRegression(page, {
    name,
    element,
    threshold: options?.threshold,
    maxDiffPixels: options?.maxDiffPixels,
    waitForAnimations: true,
  })
}

