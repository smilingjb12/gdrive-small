import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display folders on the home page', async ({ page }) => {
    await page.goto('/')

    // Check that the page has loaded with the Drive Clone header
    await expect(page.getByText('Drive Clone')).toBeVisible()

    // Check that the My Drive section is visible
    await expect(page.getByText('My Drive').first()).toBeVisible()

    // Check that the expected folders are displayed
    await expect(page.getByText('Documents')).toBeVisible()
    await expect(page.getByText('Images')).toBeVisible()
    await expect(page.getByText('Projects')).toBeVisible()

    // Verify the item count shows the correct number (3 folders + 9 files = 12 items)
    await expect(page.getByText('12 items')).toBeVisible()
  })

  test('should display all three demo folders', async ({ page }) => {
    await page.goto('/')

    const folders = ['Documents', 'Images', 'Projects']

    for (const folderName of folders) {
      const folder = page.getByText(folderName)
      await expect(folder).toBeVisible()
    }
  })
})
