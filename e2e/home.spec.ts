import { test, expect } from '@playwright/test';
import { filterConsoleErrors } from './utils/consoleErrors';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Ruach/i);
  });

  test('should display header with logo', async ({ page }) => {
    const logo = page.locator('[aria-label="Ruach Studios logo"]').or(page.locator('img[alt*="Ruach"]')).first();
    await expect(logo).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    const nav = page.locator('nav').first();
    const viewport = await page.viewportSize();
    const isMobile = Boolean(viewport && viewport.width <= 768);

    if (isMobile) {
      await expect(nav).not.toBeVisible();
      const menuToggle = page.getByTestId('mobile-nav-button');
      await expect(menuToggle).toBeVisible();
      await menuToggle.click();
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toHaveCount(1);
      await expect(mobileMenu.first()).toBeVisible();
      await menuToggle.click();
      await expect(mobileMenu).toHaveCount(0);
    } else {
      await expect(nav).toBeVisible();
    }

    // Check for common navigation items
    const homeLink = page.getByRole('link', { name: /home/i }).first();
    if (await homeLink.isVisible()) {
      await expect(homeLink).toBeVisible();
    }
  });

  test('should display hero section', async ({ page }) => {
    // Hero section should have prominent text
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should have functional footer', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveTitle(/Ruach/i);

    // Check mobile menu visibility
    const nav = page.locator('nav').first();
    await expect(nav).not.toBeVisible();

    const menuToggle = page.getByTestId('mobile-nav-button');
    await expect(menuToggle).toBeVisible();

    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toHaveCount(0);

    await menuToggle.click();
    await expect(mobileMenu).toHaveCount(1);
    await expect(mobileMenu.first()).toBeVisible();

    await menuToggle.click();
    await expect(mobileMenu).toHaveCount(0);
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const location = msg.location();
        const locationHint = location?.url ? ` @ ${location.url}:${location.lineNumber ?? 0}` : '';
        errors.push(`${msg.text()}${locationHint}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const { blocking, ignored } = filterConsoleErrors(errors);
    if (ignored.length > 0) {
      console.info('Ignored console errors:\n' + ignored.join('\\n'));
    }
    if (blocking.length > 0) {
      console.warn('Blocking console errors:\n' + blocking.join('\\n'));
    }
    expect(blocking).toHaveLength(0);
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');

    // Check for essential meta tags
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /.+/);
  });

  test('should load without accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for basic accessibility
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // Ensure links have text
    const links = await page.locator('a[href]').all();
    for (const link of links.slice(0, 5)) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});
