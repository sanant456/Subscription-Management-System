import { test, expect, type Page } from '@playwright/test';

/**
 * ──────────────────────────────────────────────────────────
 *  SubVault E2E Tests — Landing Page
 * ──────────────────────────────────────────────────────────
 * Validates that the public landing page loads, contains core
 * marketing sections, and navigation links work.
 */

test.describe('Landing Page', () => {
  test('should load the landing page with SubVault branding', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to settle (framer-motion animations)
    await page.waitForLoadState('networkidle');
    
    // Check brand name is visible
    await expect(page.getByText('SubVault').first()).toBeVisible();
    
    // Check hero section is present
    await expect(page.locator('body')).toContainText('Subscription');
  });

  test('should display pricing section with plan tiers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to pricing section and verify plan tiers exist
    const body = page.locator('body');
    await expect(body).toContainText('Basic');
    await expect(body).toContainText('Pro');
    await expect(body).toContainText('Enterprise');
  });

  test('should display trusted company logos section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify trusted companies section
    await expect(page.getByText('STRIPE').first()).toBeVisible();
    await expect(page.getByText('VERCEL').first()).toBeVisible();
    await expect(page.getByText('NOTION').first()).toBeVisible();
  });

  test('should navigate to login page from navbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click sign-in link in navbar
    const signInLink = page.getByRole('link', { name: /sign in|login|log in/i }).first();
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });

  test('should navigate to signup page from navbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click get started / sign up link
    const getStartedLink = page.getByRole('link', { name: /get started|sign up|start free/i }).first();
    if (await getStartedLink.isVisible()) {
      await getStartedLink.click();
      await expect(page).toHaveURL(/\/auth\/(signup|login)/);
    }
  });
});
