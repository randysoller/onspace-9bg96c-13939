/**
 * E2E tests for practice session flow
 * Tests the complete practice workflow from setup to completion
 */

import { test, expect } from '@playwright/test';

test.describe('Practice Session', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is authenticated
    await page.goto('/chord-setup');
  });

  test('should allow user to configure practice settings', async ({ page }) => {
    // Select chord roots
    await page.getByLabel(/select roots/i).click();
    await page.getByText('C').click();
    await page.getByText('G').click();
    
    // Select chord categories
    await page.getByLabel(/categories/i).click();
    await page.getByText('Major').click();
    
    // Set interval
    await page.getByLabel(/interval/i).fill('10');
    
    // Toggle options
    await page.getByLabel(/play sound/i).click();
    await page.getByLabel(/show diagrams/i).click();
    
    // Start practice
    await page.getByRole('button', { name: /start practice/i }).click();
    
    // Should navigate to practice page
    await expect(page).toHaveURL(/\/practice/);
  });

  test('should display chord information during practice', async ({ page }) => {
    // Start practice with defaults
    await page.getByRole('button', { name: /start practice/i }).click();
    
    // Should show chord name
    await expect(page.getByTestId('current-chord-name')).toBeVisible();
    
    // Should show chord diagram
    await expect(page.getByTestId('chord-diagram')).toBeVisible();
    
    // Should show timer
    await expect(page.getByTestId('practice-timer')).toBeVisible();
  });

  test('should advance to next chord automatically', async ({ page }) => {
    // Configure short interval
    await page.getByLabel(/interval/i).fill('2');
    await page.getByRole('button', { name: /start practice/i }).click();
    
    // Get initial chord name
    const initialChord = await page.getByTestId('current-chord-name').textContent();
    
    // Wait for auto-advance
    await page.waitForTimeout(2500);
    
    // Should show different chord
    const newChord = await page.getByTestId('current-chord-name').textContent();
    expect(newChord).not.toBe(initialChord);
  });

  test('should allow manual chord navigation', async ({ page }) => {
    await page.getByRole('button', { name: /start practice/i }).click();
    
    // Get initial chord
    const initialChord = await page.getByTestId('current-chord-name').textContent();
    
    // Click next button
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should show different chord
    const newChord = await page.getByTestId('current-chord-name').textContent();
    expect(newChord).not.toBe(initialChord);
    
    // Click previous button
    await page.getByRole('button', { name: /previous/i }).click();
    
    // Should return to initial chord
    const returnedChord = await page.getByTestId('current-chord-name').textContent();
    expect(returnedChord).toBe(initialChord);
  });

  test('should save practice session on completion', async ({ page }) => {
    // Configure short session
    await page.getByLabel(/interval/i).fill('2');
    await page.getByRole('button', { name: /start practice/i }).click();
    
    // Practice a few chords
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /next/i }).click();
    
    // End practice
    await page.getByRole('button', { name: /end practice/i }).click();
    
    // Should show completion summary
    await expect(page.getByText(/session complete/i)).toBeVisible();
    await expect(page.getByText(/chords practiced/i)).toBeVisible();
    
    // Verify session was saved
    await page.goto('/practice-history');
    await expect(page.getByText(/recent sessions/i)).toBeVisible();
  });

  test('should integrate with metronome during practice', async ({ page }) => {
    await page.getByLabel(/enable metronome/i).click();
    await page.getByRole('button', { name: /start practice/i }).click();
    
    // Open metronome controls
    await page.getByRole('button', { name: /metronome/i }).click();
    
    // Should show metronome modal
    await expect(page.getByText(/beats per minute/i)).toBeVisible();
    
    // Start metronome
    await page.getByRole('button', { name: /start/i }).click();
    
    // Should show playing indicator
    await expect(page.getByTestId('metronome-playing')).toBeVisible();
  });

  test('should handle empty chord selection gracefully', async ({ page }) => {
    // Deselect all options
    await page.getByLabel(/select roots/i).click();
    await page.getByText(/deselect all/i).click();
    
    // Try to start practice
    await page.getByRole('button', { name: /start practice/i }).click();
    
    // Should show error message
    await expect(page.getByText(/select at least one/i)).toBeVisible();
  });
});
