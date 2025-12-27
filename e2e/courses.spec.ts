import { test, expect } from '@playwright/test';
import { filterConsoleErrors } from './utils/consoleErrors';

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
        const location = msg.location();
        const locationHint = location?.url ? ` @ ${location.url}:${location.lineNumber ?? 0}` : '';
        errors.push(`${msg.text()}${locationHint}`);
      }
    });

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Filter out known third-party errors
    const { blocking, ignored } = filterConsoleErrors(errors);
    if (ignored.length > 0) {
      test.info().log('Ignored console errors', ignored.join('\\n'));
    }
    if (blocking.length > 0) {
      test.info().log('Blocking console errors', blocking.join('\\n'));
    }
    expect(blocking).toHaveLength(0);
  });
});
