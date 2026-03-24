/**
 * E2E tests for authentication flows
 * Tests signup, login, and logout functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/practice');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in signup form
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Should navigate to home page after successful signup
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should allow user to log in', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in login form
    await page.getByLabel(/email/i).fill('existing@example.com');
    await page.getByLabel(/password/i).fill('ExistingPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show authenticated state
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle login errors gracefully', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test('should allow user to log out', async ({ page }) => {
    // Assume user is logged in
    await page.goto('/settings');
    
    // Click logout button
    await page.getByRole('button', { name: /log out/i }).click();
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Log in
    await page.goto('/auth');
    await page.getByLabel(/email/i).fill('existing@example.com');
    await page.getByLabel(/password/i).fill('ExistingPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});
