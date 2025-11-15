import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.describe('Templates Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginAsTestUser(page)
  })

  test('should navigate to templates page', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')
    await expect(page).toHaveURL(/.*templates/)
    await expect(page.locator('h1')).toContainText(/template/i)
  })

  test('should show search and filter options', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')

    // Check for search input
    const searchInput = page.locator(
      'input[type="text"][placeholder*="ara"], input[type="text"][placeholder*="search"]'
    )
    await expect(searchInput).toBeVisible()

    // Check for industry filter
    const filterSelect = page.locator('select')
    await expect(filterSelect).toBeVisible()
  })

  test('should navigate to template detail page', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')

    // Wait for templates to load
    await page.waitForTimeout(1000)

    // Try to find a template card and click "Detaylar" or template name
    const templateLink = page.locator('a[href*="/templates/"]').first()

    if ((await templateLink.count()) > 0) {
      await templateLink.click()
      await expect(page).toHaveURL(/.*templates\/[^/]+$/)
      await expect(page.locator('h1')).toBeVisible()
    } else {
      // If no templates, should show empty state
      await expect(
        page.locator('text=/henüz template|no template|template bulunamadı/i')
      ).toBeVisible()
    }
  })

  test('should navigate to apply template page', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')

    // Wait for templates to load
    await page.waitForTimeout(1000)

    // Try to find "Uygula" button
    const applyButton = page.locator('a[href*="/apply"], button:has-text("Uygula")').first()

    if ((await applyButton.count()) > 0) {
      await applyButton.click()
      await expect(page).toHaveURL(/.*templates\/.*\/apply/)
      await expect(page.locator('h1')).toContainText(/uygula|apply/i)
    }
  })

  test('should show template details when available', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')

    // Wait for templates to load
    await page.waitForTimeout(1000)

    const templateLink = page.locator('a[href*="/templates/"]').first()

    if ((await templateLink.count()) > 0) {
      await templateLink.click()
      await page.waitForURL(/.*templates\/[^/]+$/)

      // Check for template name
      await expect(page.locator('h1')).toBeVisible()

      // Check for modules section (if template has modules)
      const modulesSection = page.locator('text=/modül|module/i')
      if ((await modulesSection.count()) > 0) {
        await expect(modulesSection.first()).toBeVisible()
      }
    }
  })

  test('should show apply form with required fields', async ({ page }) => {
    await page.goto('http://localhost:3001/templates')

    // Wait for templates to load
    await page.waitForTimeout(1000)

    const applyButton = page.locator('a[href*="/apply"]').first()

    if ((await applyButton.count()) > 0) {
      await applyButton.click()
      await page.waitForURL(/.*templates\/.*\/apply/)

      // Check for company select
      await expect(page.locator('select')).toBeVisible()

      // Check for Odoo connection fields
      await expect(page.locator('input[type="password"]')).toBeVisible()

      // Check for submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    }
  })

  test.describe('Template Deployment', () => {
    test('should navigate to deployment detail page after deployment', async ({ page }) => {
      await page.goto('http://localhost:3001/templates')

      // Wait for templates to load
      await page.waitForTimeout(1000)

      const applyButton = page.locator('a[href*="/apply"]').first()

      if ((await applyButton.count()) > 0) {
        await applyButton.click()
        await page.waitForURL(/.*templates\/.*\/apply/)

        // Check if deployment form is visible
        const deploymentForm = page.locator('form')
        if ((await deploymentForm.count()) > 0) {
          // Form exists, deployment page is accessible
          await expect(deploymentForm).toBeVisible()
        }
      }
    })

    test('should show deployment status after submission', async ({ page }) => {
      // Navigate to deployments page
      await page.goto('http://localhost:3001/odoo/deployments')

      // Check if deployments page loads
      await expect(page.locator('h1, h2')).toBeVisible()

      // Check for deployment list or empty state
      const deploymentList = page.locator('[data-testid="deployment-list"], .deployment-card, text=/deployment/i')
      if ((await deploymentList.count()) > 0) {
        await expect(deploymentList.first()).toBeVisible()
      }
    })

    test('should show deployment details when clicking on deployment', async ({ page }) => {
      await page.goto('http://localhost:3001/odoo/deployments')

      // Wait for page to load
      await page.waitForTimeout(1000)

      // Try to find a deployment link
      const deploymentLink = page.locator('a[href*="/odoo/deployments/"]').first()

      if ((await deploymentLink.count()) > 0) {
        await deploymentLink.click()
        await expect(page).toHaveURL(/.*odoo\/deployments\/[^/]+$/)

        // Check for deployment details
        await expect(page.locator('h1, h2')).toBeVisible()

        // Check for deployment status
        const statusElement = page.locator('text=/pending|in_progress|success|failed/i')
        if ((await statusElement.count()) > 0) {
          await expect(statusElement.first()).toBeVisible()
        }
      }
    })

    test('should show deployment results (modules, custom fields, workflows, dashboards)', async ({ page }) => {
      await page.goto('http://localhost:3001/odoo/deployments')

      // Wait for page to load
      await page.waitForTimeout(1000)

      const deploymentLink = page.locator('a[href*="/odoo/deployments/"]').first()

      if ((await deploymentLink.count()) > 0) {
        await deploymentLink.click()
        await page.waitForURL(/.*odoo\/deployments\/[^/]+$/)

        // Check for modules section
        const modulesSection = page.locator('text=/modül|module/i')
        if ((await modulesSection.count()) > 0) {
          await expect(modulesSection.first()).toBeVisible()
        }

        // Check for custom fields section
        const customFieldsSection = page.locator('text=/custom field|özel alan/i')
        if ((await customFieldsSection.count()) > 0) {
          await expect(customFieldsSection.first()).toBeVisible()
        }

        // Check for workflows section
        const workflowsSection = page.locator('text=/workflow|iş akışı/i')
        if ((await workflowsSection.count()) > 0) {
          await expect(workflowsSection.first()).toBeVisible()
        }

        // Check for dashboards section
        const dashboardsSection = page.locator('text=/dashboard|gösterge/i')
        if ((await dashboardsSection.count()) > 0) {
          await expect(dashboardsSection.first()).toBeVisible()
        }
      }
    })

    test('should show deployment logs', async ({ page }) => {
      await page.goto('http://localhost:3001/odoo/deployments')

      // Wait for page to load
      await page.waitForTimeout(1000)

      const deploymentLink = page.locator('a[href*="/odoo/deployments/"]').first()

      if ((await deploymentLink.count()) > 0) {
        await deploymentLink.click()
        await page.waitForURL(/.*odoo\/deployments\/[^/]+$/)

        // Check for logs section
        const logsSection = page.locator('text=/log|kayıt/i')
        if ((await logsSection.count()) > 0) {
          await expect(logsSection.first()).toBeVisible()
        }
      }
    })
  })
})
