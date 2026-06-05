import { test, expect } from '@playwright/test';

/**
 * ──────────────────────────────────────────────────────────
 *  SubVault E2E Tests — Authentication Flow
 * ──────────────────────────────────────────────────────────
 * Tests signup, login, validation errors, and navigation
 * guard (protected routes redirect to login).
 */

// Generate unique emails per test run to avoid collisions with backend JSON store
const timestamp = Date.now();
const TEST_USER = {
  name: 'Playwright Test User',
  email: `pw_test_${timestamp}@example.com`,
  password: 'TestPassword123!',
};

test.describe('Authentication — Signup', () => {
  test('should display signup page with all form fields', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    // Page title / heading
    await expect(page.getByText('Create Your Account')).toBeVisible();

    // All input fields
    await expect(page.getByPlaceholder('Alex Carter')).toBeVisible();
    await expect(page.getByPlaceholder('name@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();

    // CTA button
    await expect(page.getByRole('button', { name: /start my free trial/i })).toBeVisible();

    // OAuth buttons
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /linkedin/i })).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    // Submit empty form
    await page.getByRole('button', { name: /start my free trial/i }).click();

    // Expect validation error
    await expect(page.getByText(/please fill in all/i)).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Alex Carter').fill('Test User');
    await page.getByPlaceholder('name@company.com').fill('invalid-email');
    await page.getByPlaceholder('••••••••').fill('TestPassword123!');

    await page.getByRole('button', { name: /start my free trial/i }).click();

    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Alex Carter').fill('Test User');
    await page.getByPlaceholder('name@company.com').fill('test@valid.com');
    await page.getByPlaceholder('••••••••').fill('short');

    await page.getByRole('button', { name: /start my free trial/i }).click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('should display password strength indicator', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    // Type a weak password
    await page.getByPlaceholder('••••••••').fill('a');
    await expect(page.getByText(/weak/i).first()).toBeVisible();

    // Type a strong password
    await page.getByPlaceholder('••••••••').fill('StrongPass1!');
    await expect(page.getByText(/excellent/i)).toBeVisible();
  });

  test('should successfully create an account and redirect to dashboard', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    // Fill valid credentials
    await page.getByPlaceholder('Alex Carter').fill(TEST_USER.name);
    await page.getByPlaceholder('name@company.com').fill(TEST_USER.email);
    await page.getByPlaceholder('••••••••').fill(TEST_USER.password);

    // Submit
    await page.getByRole('button', { name: /start my free trial/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Dashboard header should be visible
    await expect(page.getByText(/overview center/i)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to login page from signup link', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Authentication — Login', () => {
  const loginTimestamp = Date.now();
  const LOGIN_USER = {
    name: 'Login Test User',
    email: `pw_login_${loginTimestamp}@example.com`,
    password: 'LoginPassword123!',
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post('http://localhost:5001/api/auth/signup', {
      data: {
        name: LOGIN_USER.name,
        email: LOGIN_USER.email,
        password: LOGIN_USER.password,
      },
    });
    expect(response.ok()).toBeTruthy();
  });

  test('should display login page with all form fields', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByPlaceholder('name@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in to dashboard/i })).toBeVisible();
  });

  test('should show validation error for empty credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /sign in to dashboard/i }).click();
    await expect(page.getByText(/please fill in all/i)).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('name@company.com').fill('not-an-email');
    await page.getByPlaceholder('••••••••').fill('password123');

    await page.getByRole('button', { name: /sign in to dashboard/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('name@company.com').fill('nonexistent@user.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');

    await page.getByRole('button', { name: /sign in to dashboard/i }).click();

    // Wait for server response error
    await expect(page.getByText(/invalid|not found|denied/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with the previously created account', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('name@company.com').fill(LOGIN_USER.email);
    await page.getByPlaceholder('••••••••').fill(LOGIN_USER.password);

    await page.getByRole('button', { name: /sign in to dashboard/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/overview center/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display admin hint for demo access', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('admin@saascorp.com')).toBeVisible();
  });

  test('should navigate to signup page from login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /forgot/i }).click();
    await expect(page).toHaveURL(/\/auth\/forgot/);
  });
});

test.describe('Authentication — Protected Routes', () => {
  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    // Clear all storage to ensure not authenticated
    await page.goto('/auth/login');
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('should redirect unauthenticated users from checkout to login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.goto('/checkout');

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});
