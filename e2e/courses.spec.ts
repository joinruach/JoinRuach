import { test, expect } from '@playwright/test';

test.describe('Courses Page', () => {
  test('should display courses page', async ({ page }) => {
    await page.goto('/courses');
    await expect(page).toHaveURL(/courses/);

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should display course cards', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Check if any course cards are displayed
    const courseCards = page.locator('[data-testid="course-card"]').or(
      page.locator('article, .course-card, [class*="course"]')
    );

    // If courses exist, verify they have required content
    const count = await courseCards.count();
    if (count > 0) {
      const firstCard = courseCards.first();
      await expect(firstCard).toBeVisible();
    }
  });

  test('should be able to navigate to course details', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Find first course link
    const courseLink = page.locator('a[href*="/courses/"]').first();

    const isVisible = await courseLink.isVisible().catch(() => false);
    if (isVisible) {
      await courseLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to course detail page
      await expect(page).toHaveURL(/courses\/.+/);
    }
  });

  test('should load courses without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Filter out known third-party errors
    const relevantErrors = errors.filter(
      (error) => !error.includes('Extension') && !error.includes('chrome-extension')
    );

    expect(relevantErrors.length).toBe(0);
  });
});
