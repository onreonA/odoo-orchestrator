import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Calendar Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginAsTestUser(page)
  })

  test('should navigate to calendar page', async ({ page }) => {
    await page.goto('http://localhost:3001/calendar')
    await expect(page).toHaveURL(/.*calendar/)
    await expect(page.locator('h1')).toContainText(/takvim|calendar/i)
  })

  test('should show new event button', async ({ page }) => {
    await page.goto('http://localhost:3001/calendar')
    
    const newEventButton = page.locator('a[href*="/calendar/events/new"]')
    await expect(newEventButton).toBeVisible()
    await expect(newEventButton).toContainText(/yeni|new/i)
  })

  test('should navigate to new event page', async ({ page }) => {
    await page.goto('http://localhost:3001/calendar')
    await page.click('a[href*="/calendar/events/new"]')
    await expect(page).toHaveURL(/.*calendar\/events\/new/)
    await expect(page.locator('h1')).toContainText(/yeni|new|etkinlik|event/i)
  })

  test('should show event form fields', async ({ page }) => {
    await page.goto('http://localhost:3001/calendar/events/new')
    
    // Wait for page to load
    await page.waitForSelector('h1')
    
    // Check required fields
    const titleInput = page.locator('input[id="title"]')
    await expect(titleInput).toBeVisible()
    
    const startTimeInput = page.locator('input[id="start_time"]')
    await expect(startTimeInput).toBeVisible()
    
    const endTimeInput = page.locator('input[id="end_time"]')
    await expect(endTimeInput).toBeVisible()
    
    // Check optional fields
    const descriptionTextarea = page.locator('textarea[id="description"]')
    await expect(descriptionTextarea).toBeVisible()
    
    const locationInput = page.locator('input[id="location"]')
    await expect(locationInput).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('http://localhost:3001/calendar/events/new')
    
    await page.waitForSelector('form')
    
    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]')
    
    // HTML5 validation should prevent submission
    const isDisabled = await submitButton.isDisabled()
    // Note: HTML5 validation might not disable the button, so we check form validation
    await submitButton.click()
    
    // Form should not submit (check if we're still on the same page)
    await expect(page).toHaveURL(/.*calendar\/events\/new/)
  })

  test('should create event with valid data', async ({ page }) => {
    await page.goto('http://localhost:3001/calendar/events/new')
    
    await page.waitForSelector('form')
    
    // Fill form
    await page.fill('input[id="title"]', 'Test Event')
    
    // Set start time (tomorrow at 10:00)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startTime = tomorrow.toISOString().slice(0, 16)
    tomorrow.setHours(tomorrow.getHours() + 1)
    const endTime = tomorrow.toISOString().slice(0, 16)
    
    await page.fill('input[id="start_time"]', startTime)
    await page.fill('input[id="end_time"]', endTime)
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Should redirect to event detail page
    await page.waitForURL(/.*calendar\/events\/.*/, { timeout: 10000 })
    await expect(page).toHaveURL(/.*calendar\/events\/.*/)
  })

  test('should show calendar view when events exist', async ({ page }) => {
    await page.goto('http://localhost:3001/calendar')
    
    // Wait for page to load
    await page.waitForSelector('h1')
    
    // Check if calendar view or empty state is shown
    const calendarView = page.locator('text=/ay|hafta|gün|month|week|day/i')
    const emptyState = page.locator('text=/henüz etkinlik yok|no events/i')
    
    // One of them should be visible
    const calendarVisible = await calendarView.count() > 0
    const emptyVisible = await emptyState.count() > 0
    
    expect(calendarVisible || emptyVisible).toBe(true)
  })

  test('should navigate to event detail from list', async ({ page }) => {
    await page.goto('http://localhost:3001/calendar')
    
    await page.waitForSelector('h1')
    
    // Look for event links
    const eventLinks = page.locator('a[href*="/calendar/events/"]')
    const count = await eventLinks.count()
    
    if (count > 0) {
      // Click first event link
      await eventLinks.first().click()
      await expect(page).toHaveURL(/.*calendar\/events\/.*/)
      await expect(page.locator('h1')).toBeVisible()
    } else {
      // No events, skip test
      test.skip()
    }
  })
})


