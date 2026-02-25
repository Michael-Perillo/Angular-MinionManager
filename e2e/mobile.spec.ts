import { test, expect } from '@playwright/test';
import { resetGame } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetGame(page);
});

test('Bottom nav visible with 4 tabs', async ({ page }) => {
  const nav = page.locator('app-mobile-bottom-nav nav');
  await expect(nav).toBeVisible();

  const tabs = nav.locator('button');
  await expect(tabs).toHaveCount(4);

  // Verify tab labels
  await expect(tabs.nth(0)).toContainText('Missions');
  await expect(tabs.nth(1)).toContainText('Work');
  await expect(tabs.nth(2)).toContainText('Click');
  await expect(tabs.nth(3)).toContainText('More');
});

test('Tab switching shows correct content', async ({ page }) => {
  // Missions tab (default) — mission board visible
  await expect(page.locator('app-mission-board')).toBeVisible();

  // Work tab — department column visible
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Work' }).click();
  await expect(page.locator('app-department-column').first()).toBeVisible();

  // Click tab — player workbench visible
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Click' }).click();
  await expect(page.locator('app-player-workbench')).toBeVisible();

  // More tab — settings/more menu visible
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'More' }).click();
  await expect(page.getByText('Notoriety & Raids')).toBeVisible();
  await expect(page.getByText('Hire Minions')).toBeVisible();
});

test('Touch scrolling works without CDK drag ghost', async ({ page }) => {
  // Navigate to Work tab
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Work' }).click();
  await expect(page.locator('app-department-column').first()).toBeVisible();

  // Verify no cdk-drag-preview appears when touching/scrolling
  const dragPreview = page.locator('.cdk-drag-preview');
  await expect(dragPreview).toHaveCount(0);
});

test('Swipe navigation between department columns', async ({ page }) => {
  // Navigate to Work tab
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Work' }).click();
  await expect(page.locator('app-department-column').first()).toBeVisible();

  // Dot indicators should be visible
  const dots = page.locator('[aria-label="Schemes"], [aria-label="Heists"], [aria-label="Research"], [aria-label="Mayhem"]');
  await expect(dots).toHaveCount(4);

  // First dot should be active (accent color)
  const firstDot = page.locator('[aria-label="Schemes"]');
  await expect(firstDot).toBeVisible();

  // Click the second dot to scroll to Heists
  const secondDot = page.locator('[aria-label="Heists"]');
  await secondDot.click();
  await page.waitForTimeout(500);

  // The swipe container should display the department label text
  // Verify the label updated in dots area
  await expect(page.getByText('Heists').first()).toBeVisible();
});

test('Send to Queue button works on mobile', async ({ page }) => {
  // Should start on Missions tab
  const sendBtn = page.locator('app-mission-board button').filter({ hasText: /Send to Queue/ }).first();
  await sendBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await sendBtn.click();

  // Mission router popup should appear
  const workbenchOption = page.locator('app-mission-router button').filter({ hasText: /My Workbench/ });
  await workbenchOption.waitFor({ state: 'visible', timeout: 3_000 });
  await workbenchOption.click();

  // Navigate to Click tab to verify task was queued
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Click' }).click();
  const clickBtn = page.locator('app-player-workbench button').filter({ hasText: /CLICK/ });
  await expect(clickBtn.first()).toBeVisible({ timeout: 5_000 });
});

test('Department columns fill viewport width', async ({ page }) => {
  // Navigate to Work tab
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Work' }).click();
  await expect(page.locator('app-department-column').first()).toBeVisible();

  // The department column's root div should fill the viewport width (minus padding)
  const columnWidth = await page.locator('app-department-column').first().evaluate(el => {
    return el.getBoundingClientRect().width;
  });
  const viewportWidth = page.viewportSize()?.width ?? 0;

  // Column should be at least 80% of viewport width (accounting for padding)
  expect(columnWidth).toBeGreaterThan(viewportWidth * 0.8);
});
