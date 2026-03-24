/**
 * E2E tests for Chord Editor
 * Tests creating, editing, and saving custom chords
 */

import { test, expect } from '@playwright/test';

test.describe('Chord Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chord-editor');
  });

  test('should load chord editor interface', async ({ page }) => {
    await expect(page.getByText(/chord editor/i)).toBeVisible();
    await expect(page.getByTestId('fretboard-svg')).toBeVisible();
    await expect(page.getByLabel(/chord name/i)).toBeVisible();
  });

  test('should allow placing dots on fretboard', async ({ page }) => {
    // Click on fretboard to place dot
    const fretboard = page.getByTestId('fretboard-svg');
    await fretboard.click({ position: { x: 100, y: 100 } });
    
    // Should show dot marker
    await expect(page.getByTestId('dot-marker')).toBeVisible();
  });

  test('should allow selecting finger numbers', async ({ page }) => {
    // Place a dot
    await page.getByTestId('fretboard-svg').click({ position: { x: 100, y: 100 } });
    
    // Select finger number
    await page.getByRole('button', { name: '1' }).click();
    
    // Dot should be selected with finger 1
    // Visual verification would be needed here
  });

  test('should create barre chords', async ({ page }) => {
    // Click barre button
    await page.getByRole('button', { name: /bar/i }).click();
    
    // Should enter barre mode
    await expect(page.getByText(/click two dots/i)).toBeVisible();
    
    // Place two dots on same fret
    const fretboard = page.getByTestId('fretboard-svg');
    await fretboard.click({ position: { x: 100, y: 50 } });
    await fretboard.click({ position: { x: 100, y: 150 } });
    
    // Should show barre line
    await expect(page.getByTestId('barre-marker')).toBeVisible();
  });

  test('should save custom chord', async ({ page }) => {
    // Enter chord name
    await page.getByLabel(/chord name/i).fill('My Custom Chord');
    
    // Place some dots
    const fretboard = page.getByTestId('fretboard-svg');
    await fretboard.click({ position: { x: 100, y: 50 } });
    await fretboard.click({ position: { x: 150, y: 100 } });
    await fretboard.click({ position: { x: 200, y: 150 } });
    
    // Save chord
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/chord saved/i)).toBeVisible();
    
    // Verify in chord library
    await page.goto('/library');
    await expect(page.getByText('My Custom Chord')).toBeVisible();
  });

  test('should validate chord before saving', async ({ page }) => {
    // Try to save without name
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/chord name required/i)).toBeVisible();
  });

  test('should support undo/redo', async ({ page }) => {
    // Place dots
    const fretboard = page.getByTestId('fretboard-svg');
    await fretboard.click({ position: { x: 100, y: 100 } });
    await fretboard.click({ position: { x: 150, y: 150 } });
    
    // Undo
    await page.keyboard.press('Control+Z');
    
    // Second dot should be removed
    const dots = await page.getByTestId('dot-marker').count();
    expect(dots).toBe(1);
    
    // Redo
    await page.keyboard.press('Control+Shift+Z');
    
    // Second dot should be restored
    const dotsAfterRedo = await page.getByTestId('dot-marker').count();
    expect(dotsAfterRedo).toBe(2);
  });

  test('should clear fretboard', async ({ page }) => {
    // Place dots
    const fretboard = page.getByTestId('fretboard-svg');
    await fretboard.click({ position: { x: 100, y: 100 } });
    await fretboard.click({ position: { x: 150, y: 150 } });
    
    // Clear
    await page.getByRole('button', { name: /clear/i }).click();
    
    // Confirm dialog
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Should remove all dots
    const dots = await page.getByTestId('dot-marker').count();
    expect(dots).toBe(0);
  });
});
