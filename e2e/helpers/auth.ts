/**
 * E2E Test Authentication Helpers
 */

import { Page } from '@playwright/test'
import { TEST_USER } from '../../test/utils/test-user'

/**
 * Login as test user
 * If login fails, tries to register first
 */
export async function loginAsTestUser(page: Page) {
  // Try login first
  await page.goto('http://localhost:3001/login')

  // Wait for form to be visible - use id selector
  await page.waitForSelector('#email', { timeout: 5000 })

  // Fill login form - use id selectors
  await page.fill('#email', TEST_USER.email)
  await page.fill('#password', TEST_USER.password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard or error
  try {
    await page.waitForURL('**/dashboard', { timeout: 5000 })
    return // Login successful
  } catch {
    // Login failed, try to register
    console.log('Login failed, attempting registration...')
    await page.goto('http://localhost:3001/register')
    await page.waitForSelector('#fullName', { timeout: 5000 })

    await page.fill('#fullName', TEST_USER.fullName)
    await page.fill('#email', TEST_USER.email)
    await page.fill('#password', TEST_USER.password)

    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 })
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('text=/dashboard|firmalar|companies/i', { timeout: 2000 })
    return true
  } catch {
    return false
  }
}

/**
 * Logout
 */
export async function logout(page: Page) {
  // Try to find logout button in header
  const logoutButton = page.locator(
    'button:has-text("Çıkış"), button:has-text("Logout"), a:has-text("Çıkış")'
  )

  if ((await logoutButton.count()) > 0) {
    await logoutButton.click()
    await page.waitForURL('**/login')
  } else {
    // If no logout button, navigate to login and clear cookies
    await page.goto('http://localhost:3001/login')
    await page.context().clearCookies()
  }
}
