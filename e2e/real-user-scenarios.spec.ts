import { test, expect } from '@playwright/test'

/**
 * Real User Scenarios
 * Gerçek kullanıcıların yaptığı adımları simüle eder
 * Manuel test sırasında bulunan hataları yakalar
 */
test.describe('Real User Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('complete company creation flow - real user journey', async ({ page }) => {
    // Step 1: Navigate to companies
    await page.goto('/companies')
    await expect(page.locator('h1')).toContainText('Firmalar')

    // Step 2: Click "Yeni Firma Ekle"
    await page.click('text=Yeni Firma Ekle')
    await page.waitForURL('/companies/new')

    // Step 3: Fill form completely (like a real user would)
    await page.fill('[name="name"]', 'Şahbaz Isı')
    await page.selectOption('[name="industry"]', 'metal')
    await page.selectOption('[name="size"]', 'medium')
    await page.fill('[name="contact_person"]', 'Onur Erginler')
    await page.fill('[name="contact_email"]', 'onur@sahbaz.com.tr')
    await page.fill('[name="contact_phone"]', '05554443322')
    await page.fill('[name="address"]', 'OSB')

    // Step 4: Submit form
    const submitButton = page.locator('button:has-text("Firmayı Ekle")')
    await submitButton.click()

    // Step 5: Wait for result (success or error)
    await Promise.race([
      page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 15000 }),
      page.waitForSelector('[class*="error"]', { timeout: 15000 }),
      page.waitForTimeout(20000), // Max wait
    ])

    // Step 6: Check result
    const currentUrl = page.url()
    const hasError = (await page.locator('[class*="error"]').count()) > 0

    if (hasError) {
      // If error, check it's user-friendly
      const errorText = await page.locator('[class*="error"]').first().textContent()
      console.log('Error occurred:', errorText)

      // Should not be raw database errors
      expect(errorText).not.toContain('violates foreign key constraint')
      expect(errorText).not.toContain('row-level security policy')
      expect(errorText).not.toContain('SQLSTATE')
    } else {
      // Should redirect to company detail page
      expect(currentUrl).toMatch(/\/companies\/[a-f0-9-]+/)
      await expect(page.locator('h1')).toContainText('Şahbaz Isı')
    }
  })

  test('navigate to company detail page - check for 404 errors', async ({ page }) => {
    // First create a company
    await page.goto('/companies/new')
    await page.fill('[name="name"]', 'Detail Test Company')
    await page.selectOption('[name="industry"]', 'metal')
    await page.click('button:has-text("Firmayı Ekle")')

    // Wait for redirect
    await page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 15000 })
    const companyUrl = page.url()

    // Now navigate to that company detail page
    await page.goto(companyUrl)

    // Should not show 404
    const pageContent = await page.textContent('body')
    expect(pageContent).not.toContain('404')
    expect(pageContent).not.toContain('This page could not be found')

    // Should show company name
    await expect(page.locator('h1')).toContainText('Detail Test Company')
  })

  test('check console errors during normal usage', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Navigate through the app like a real user
    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    await page.goto('/companies')
    await page.waitForTimeout(1000)

    await page.click('text=Yeni Firma Ekle')
    await page.waitForTimeout(1000)

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      err =>
        !err.includes('favicon') &&
        !err.includes('react-devtools') &&
        !err.includes('HMR') &&
        !err.includes('Fast Refresh') &&
        !err.includes('Download the React DevTools')
    )

    // Should not have critical errors
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors)
    }

    expect(criticalErrors).toHaveLength(0)
  })

  test('form submission does not hang - loading state check', async ({ page }) => {
    await page.goto('/companies/new')

    // Fill form
    await page.fill('[name="name"]', 'Loading Test')
    await page.selectOption('[name="industry"]', 'metal')

    // Submit
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Wait max 20 seconds
    const startTime = Date.now()
    await Promise.race([
      page.waitForURL(/\/companies\/[a-f0-9-]+/, { timeout: 20000 }),
      page.waitForSelector('[class*="error"]', { timeout: 20000 }),
      page.waitForTimeout(20000),
    ])
    const elapsedTime = Date.now() - startTime

    // Should complete within reasonable time (not hang)
    expect(elapsedTime).toBeLessThan(20000)

    // Button should not be stuck in loading state
    const buttonText = await submitButton.textContent()
    if (buttonText) {
      expect(buttonText).not.toContain('Kaydediliyor')
    }
  })
})
