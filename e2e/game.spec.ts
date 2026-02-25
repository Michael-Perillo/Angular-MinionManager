import { test, expect } from '@playwright/test';
import { resetGame, earnGold, earnGoldUntil, getHeaderStat } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetGame(page);
});

test('App loads with heading and mission board', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Minion Manager' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mission Board' })).toBeVisible();
  const cards = page.locator('app-mission-board .game-card');
  await expect(cards.first()).toBeVisible();
});

test('Accept mission moves it to active slots', async ({ page }) => {
  // Read initial slots text
  const slotsText = page.locator('text=/\\d+ \\/ \\d+ slots/');
  await expect(slotsText).toContainText('0 /');

  const boardCountBefore = await page.locator('app-mission-board .game-card').count();

  // Accept first mission
  await page.locator('app-mission-board .game-card').first().click();

  await expect(slotsText).toContainText('1 /');
  const boardCountAfter = await page.locator('app-mission-board .game-card').count();
  expect(boardCountAfter).toBeLessThan(boardCountBefore);
});

test('Click task to completion earns gold', async ({ page }) => {
  const gold = await earnGold(page);
  expect(gold).toBeGreaterThan(0);
});

test('Hire minion after earning gold', async ({ page }) => {
  // Minion costs 50g, so earn enough gold by completing multiple missions
  await earnGoldUntil(page, 50);

  // Switch to Minions tab
  await page.getByRole('button', { name: 'Minions' }).click();

  // Click hire button — when affordable, it shows "Hire Minion (50g)"
  await page.getByRole('button', { name: /Hire Minion/i }).click();

  // Wait for the header to update after hiring
  await page.waitForTimeout(500);

  const minionCount = await getHeaderStat(page, 'Minions');
  expect(minionCount).toBeGreaterThanOrEqual(1);
});

test('Purchase upgrade after earning gold', async ({ page }) => {
  // Cheapest upgrade costs 30g, earn enough
  await earnGoldUntil(page, 30);

  // Switch to Upgrades tab
  await page.getByRole('button', { name: 'Upgrades' }).click();

  // Find the first affordable buy button (shows gold cost like "10g")
  const buyBtn = page.locator('app-upgrade-shop button:not([disabled])').filter({ hasText: /\d+g/ }).first();
  await buyBtn.click();

  // Verify level incremented — look for "1/" text (level went from 0 to 1)
  await expect(page.locator('app-upgrade-shop').locator('text=1/')).toBeVisible();
});

test('Tab navigation shows correct content', async ({ page }) => {
  // Status tab -> Notoriety heading
  await page.getByRole('button', { name: 'Status' }).click();
  await expect(page.locator('text=Notoriety')).toBeVisible();

  // Minions tab -> Hire Minion heading
  await page.getByRole('button', { name: 'Minions' }).click();
  await expect(page.locator('text=Hire Minion')).toBeVisible();

  // Upgrades tab -> app-upgrade-shop
  await page.getByRole('button', { name: 'Upgrades' }).click();
  await expect(page.locator('app-upgrade-shop')).toBeVisible();

  // Depts tab -> app-department-panel
  await page.getByRole('button', { name: 'Depts' }).click();
  await expect(page.locator('app-department-panel')).toBeVisible();
});

test('Reset game clears progress', async ({ page }) => {
  await earnGold(page);
  const goldBefore = await getHeaderStat(page, 'Gold');
  expect(goldBefore).toBeGreaterThan(0);

  // Click Reset
  await page.getByRole('button', { name: 'Reset' }).click();

  // Wait for the reset to take effect
  await page.waitForTimeout(300);

  const goldAfter = await getHeaderStat(page, 'Gold');
  expect(goldAfter).toBe(0);

  // Board should be re-populated
  await expect(page.locator('app-mission-board .game-card').first()).toBeVisible();
});

test('Persistence across page reload', async ({ page }) => {
  await earnGold(page);
  const goldBefore = await getHeaderStat(page, 'Gold');
  expect(goldBefore).toBeGreaterThan(0);

  // Trigger beforeunload save by navigating away and back
  await page.reload();
  await page.locator('app-header').waitFor({ state: 'visible' });

  const goldAfter = await getHeaderStat(page, 'Gold');
  expect(goldAfter).toBe(goldBefore);
});

test('Notoriety tracks after completing tasks', async ({ page }) => {
  // Check initial notoriety
  await page.getByRole('button', { name: 'Status' }).click();
  await expect(page.locator('text=0 / 100')).toBeVisible();

  // Complete a task
  await earnGold(page);

  // Check notoriety increased
  await page.getByRole('button', { name: 'Status' }).click();
  const notorietyText = await page.locator('app-notoriety-bar').locator('text=/\\d+ \\/ 100/').textContent();
  const notoriety = parseInt(notorietyText?.trim().split(' ')[0] ?? '0', 10);
  expect(notoriety).toBeGreaterThan(0);
});
