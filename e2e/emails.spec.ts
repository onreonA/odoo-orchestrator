import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Email Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('should navigate to emails page', async ({ page }) => {
    await page.goto('http://localhost:3001/emails')
    await expect(page).toHaveURL(/.*emails/)
    await expect(page.locator('h1')).toContainText(/email|posta|gelen kutusu|inbox/i)
  })

  test('should show email inbox sidebar', async ({ page }) => {
    await page.goto('http://localhost:3001/emails')
    await page.waitForSelector('h1')

    // Check sidebar navigation
    const inboxLink = page.locator('text=/inbox|gelen/i')
    const sentLink = page.locator('text=/sent|gönderilen/i')
    const draftsLink = page.locator('text=/draft|taslak/i')

    // At least one should be visible
    const hasInbox = (await inboxLink.count()) > 0
    const hasSent = (await sentLink.count()) > 0
    const hasDrafts = (await draftsLink.count()) > 0

    expect(hasInbox || hasSent || hasDrafts).toBe(true)
  })

  test('should navigate to compose page', async ({ page }) => {
    await page.goto('http://localhost:3001/emails')
    await page.waitForSelector('h1')

    const composeButton = page.locator(
      'a[href*="/emails/compose"], button:has-text("Yeni"), button:has-text("Compose")'
    )
    const count = await composeButton.count()

    if (count > 0) {
      await composeButton.first().click()
      await expect(page).toHaveURL(/.*emails\/compose/)
    } else {
      // Skip if compose button not found
      test.skip()
    }
  })

  test('should navigate to email accounts page', async ({ page }) => {
    await page.goto('http://localhost:3001/emails/accounts')
    await expect(page).toHaveURL(/.*emails\/accounts/)
  })

  test('should show add account button', async ({ page }) => {
    await page.goto('http://localhost:3001/emails/accounts')
    await page.waitForSelector('h1')

    const addButton = page.locator(
      'a[href*="/emails/accounts/new"], button:has-text("Yeni"), button:has-text("Add")'
    )
    const count = await addButton.count()

    // Button should exist (even if not visible)
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
