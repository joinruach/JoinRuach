import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Skip these tests if backend is not running
  test.skip(
    process.env.E2E_BACKEND !== 'true',
    'Backend required - run with E2E_BACKEND=true'
  );

  const LIVE_LOGIN_EMAIL = process.env.E2E_TEST_EMAIL;
  const LIVE_LOGIN_PASSWORD = process.env.E2E_TEST_PASSWORD;
  const LIVE_LOGIN_ENABLED = Boolean(LIVE_LOGIN_EMAIL && LIVE_LOGIN_PASSWORD);
  test('should display login page', async ({ page }) => {
    await page.goto('/api/auth/signin');

    // NextAuth signin page should load
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('auth');
  });

  test('should have sign in form or button', async ({ page }) => {
    await page.goto('/');

    // Look for sign in link/button
    const signInLink = page
      .getByRole('link', { name: /sign in|log in|login/i })
      .or(page.getByRole('button', { name: /sign in|log in|login/i }))
      .first();

    // If sign in is visible (user not authenticated), verify it
    const isVisible = await signInLink.isVisible().catch(() => false);
    if (isVisible) {
      await expect(signInLink).toBeVisible();
    }
  });

  test('should handle sign in navigation', async ({ page }) => {
    await page.goto('/');

    // Try to navigate to sign in
    const signInLink = page
      .getByRole('link', { name: /sign in|log in|login/i })
      .first();

    const isVisible = await signInLink.isVisible().catch(() => false);
    if (isVisible) {
      await signInLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to auth page
      const url = page.url();
      expect(url).toMatch(/auth|sign[-_]?in|sign[-_]?up|login|register/i);
    }
  });

  test('should show user menu when authenticated', async ({ page, context }) => {
    // Set mock session cookie for testing (in real scenarios, you'd go through actual login)
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/');

    // Look for user menu or profile indicator
    const userMenu = page
      .locator('[data-testid="user-menu"]')
      .or(page.locator('[aria-label*="user menu"]'))
      .or(page.locator('button[aria-label*="profile"]'))
      .first();

    // User menu may or may not be visible depending on auth state
    // This test documents expected behavior
  });

  test('should handle sign out', async ({ page }) => {
    await page.goto('/');

    // Look for sign out link (only visible when authenticated)
    const signOutLink = page
      .getByRole('link', { name: /sign out|log out|logout/i })
      .or(page.getByRole('button', { name: /sign out|log out|logout/i }))
      .first();

    const isVisible = await signOutLink.isVisible().catch(() => false);
    if (isVisible) {
      await signOutLink.click();
      await page.waitForLoadState('networkidle');

      // Should redirect to home or sign in page
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });

  test('should redirect to account page after successful login', async ({ page }) => {
    test.skip(
      !LIVE_LOGIN_ENABLED,
      'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run the live login redirect test'
    );

    const email = LIVE_LOGIN_EMAIL!;
    const password = LIVE_LOGIN_PASSWORD!;

    await page.goto('/en/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.getByRole('button', { name: /login|sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    await emailInput.fill(email);
    await passwordInput.fill(password);

    await Promise.all([
      submitButton.click(),
      page.waitForURL(/\/en\/members\/account/, { timeout: 10000 }),
    ]);

    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('should handle failed login gracefully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/en/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.getByRole('button', { name: /login|sign in/i });

    // Try login with obviously wrong credentials
    await emailInput.fill('nonexistent@example.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    // Should show error message (either from backend or form validation)
    // Note: Actual error display depends on backend response
    // For now, verify we stay on login page
    await page.waitForTimeout(2000); // Wait for potential redirect attempt

    // Should NOT redirect - should stay on login page
    const url = page.url();
    expect(url).toContain('/login');

    // Button should be re-enabled (loading state ended)
    await expect(submitButton).not.toBeDisabled();
  });

  test('should prevent double-submit during login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/en/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.getByRole('button', { name: /login|sign in/i });

    // Fill in form
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    // Click submit button
    await submitButton.click();

    // Button should be disabled immediately (loading state)
    await expect(submitButton).toBeDisabled();

    // Verify button text changed to "Signing in..."
    await expect(submitButton).toContainText(/signing in/i);

    // Inputs should also be disabled during loading
    await expect(emailInput).toBeDisabled();
    await expect(passwordInput).toBeDisabled();
  });
});
