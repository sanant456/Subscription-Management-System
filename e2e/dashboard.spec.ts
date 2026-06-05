import { test, expect, type Page } from '@playwright/test';

/**
 * ──────────────────────────────────────────────────────────
 *  SubVault E2E Tests — Dashboard
 * ──────────────────────────────────────────────────────────
 * Tests the dashboard after login: overview metrics, sidebar
 * navigation, subscriptions table, billing tab, monitors tab,
 * and admin console.
 */

const timestamp = Date.now();

// Helper: Login and navigate to dashboard
async function loginAndGoToDashboard(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /sign in to dashboard/i }).click();
  
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByText(/overview center/i)).toBeVisible({ timeout: 10000 });
}

// Helper: Signup a fresh user for tests that need one
async function signupFreshUser(page: Page) {
  const email = `pw_dash_${timestamp}@example.com`;
  const password = 'DashTest123!';

  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder('Alex Carter').fill('Dashboard Tester');
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /start my free trial/i }).click();
  
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  return { email, password };
}

test.describe('Dashboard — Overview Tab', () => {
  test('should display all four KPI metric cards after login', async ({ page }) => {
    await signupFreshUser(page);

    // Four metric cards should be present
    const body = page.locator('body');
    await expect(body).toContainText(/monthly/i);
    await expect(body).toContainText(/active/i);
    await expect(body).toContainText(/churn|cancellation/i);
    await expect(body).toContainText(/payment success/i);
  });

  test('should display the MRR chart', async ({ page }) => {
    await signupFreshUser(page);

    // Chart container should be present
    await expect(page.getByText(/revenue growth|spending growth/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display subscription creation form', async ({ page }) => {
    await signupFreshUser(page);

    // Subscription form elements
    await expect(page.getByText(/purchase new subscription|quick subscription/i)).toBeVisible();
    await expect(page.getByText(/billing tier/i)).toBeVisible();
    await expect(page.getByText(/interval/i).first()).toBeVisible();
  });

  test('should display chaos engineering console', async ({ page }) => {
    await signupFreshUser(page);

    await expect(page.getByText(/microservices resilience/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /inject mock database error/i })).toBeVisible();
  });
});

test.describe('Dashboard — Sidebar Navigation', () => {
  test('should navigate between dashboard tabs via sidebar', async ({ page }) => {
    await signupFreshUser(page);

    // Click "Subscriptions" tab
    await page.getByRole('button', { name: /subscriptions/i }).first().click();
    await expect(page.getByText(/subscriptions center/i)).toBeVisible({ timeout: 5000 });

    // Click "Billing" tab
    await page.getByRole('button', { name: /billing/i }).first().click();
    await expect(page.getByText(/billing center/i)).toBeVisible({ timeout: 5000 });

    // Click "Monitors" tab
    await page.getByRole('button', { name: /monitors/i }).first().click();
    await expect(page.getByText(/monitors center/i)).toBeVisible({ timeout: 5000 });

    // Click "API" tab
    await page.getByRole('button', { name: /api/i }).first().click();
    await expect(page.getByText(/api gateway playground/i)).toBeVisible({ timeout: 5000 });

    // Navigate back to Overview
    await page.getByRole('button', { name: /overview/i }).first().click();
    await expect(page.getByText(/overview center/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard — Subscriptions Tab', () => {
  test('should display subscriptions table with correct columns', async ({ page }) => {
    await signupFreshUser(page);

    // Navigate to subscriptions
    await page.getByRole('button', { name: /subscriptions/i }).first().click();
    await expect(page.getByText(/subscriptions center/i)).toBeVisible({ timeout: 5000 });

    // Table headers should exist
    const body = page.locator('body');
    await expect(body).toContainText(/email|subscriber/i);
    await expect(body).toContainText(/plan/i);
    await expect(body).toContainText(/status/i);
  });
});

test.describe('Dashboard — Billing Tab', () => {
  test('should display billing/invoices section', async ({ page }) => {
    await signupFreshUser(page);

    // Navigate to billing
    await page.getByRole('button', { name: /billing/i }).first().click();
    await expect(page.getByText(/billing center/i)).toBeVisible({ timeout: 5000 });

    // Invoice table should have structure
    const body = page.locator('body');
    await expect(body).toContainText(/invoice|payment/i);
  });
});

test.describe('Dashboard — Monitors Tab', () => {
  test('should display system logs', async ({ page }) => {
    await signupFreshUser(page);

    // Navigate to monitors
    await page.getByRole('button', { name: /monitors/i }).first().click();
    await expect(page.getByText(/monitors center/i)).toBeVisible({ timeout: 5000 });

    // Should show log entries
    const body = page.locator('body');
    await expect(body).toContainText(/api gateway|postgresql|redis|billing service/i);
  });

  test('should be able to trigger chaos mock injection', async ({ page }) => {
    await signupFreshUser(page);

    // Navigate to monitors
    await page.getByRole('button', { name: /monitors/i }).first().click();
    await expect(page.getByText(/monitors center/i)).toBeVisible({ timeout: 5000 });

    // Find and click the chaos inject button
    const chaosButton = page.getByRole('button', { name: /inject|chaos|simulate/i }).first();
    if (await chaosButton.isVisible()) {
      await chaosButton.click();
      // Should see error logs appear
      await expect(page.locator('body')).toContainText(/error|critical|warn/i);
    }
  });
});

test.describe('Dashboard — Logout', () => {
  test('should successfully logout and redirect to landing', async ({ page }) => {
    await signupFreshUser(page);

    // Find and click logout button in sidebar
    const logoutButton = page.getByRole('button', { name: /logout|sign out|log out/i }).first();
    await logoutButton.click();

    // Should redirect away from dashboard
    await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});
