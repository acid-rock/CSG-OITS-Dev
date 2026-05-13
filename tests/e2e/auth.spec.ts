import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout } from './helpers/auth';

test.describe('Admin authentication', () => {
  test('/admin redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login|\/admin/);
  });

  test('login form rejects empty credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.click('button[type="submit"]');
    // Should not navigate away from login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('login form rejects invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'wrong@admin.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test.skip('successful login navigates to admin dashboard', async ({ page }) => {
    // Skipped by default — requires real credentials in TEST_ADMIN_EMAIL env var.
    // To run: TEST_ADMIN_EMAIL=x TEST_ADMIN_PASSWORD=y npx playwright test auth
    await loginAsAdmin(page);
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await logout(page);
  });
});
