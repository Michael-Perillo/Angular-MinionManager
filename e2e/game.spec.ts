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

test('Accept mission moves it to a queue', async ({ page }) => {
  const boardCountBefore = await page.locator('app-mission-board .game-card').count();

  // Click "Send to Queue" on the first mission card
  const sendBtn = page.locator('app-mission-board button').filter({ hasText: /Send to Queue/ }).first();
  await sendBtn.click();

  // Pick "My Workbench" from the mission router popup
  const workbenchOption = page.locator('app-mission-router button').filter({ hasText: /My Workbench/ });
  await workbenchOption.waitFor({ state: 'visible', timeout: 3_000 });
  await workbenchOption.click();

  // Wait for state update
  await page.waitForTimeout(300);

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

  // Open the drawer panel by clicking the ⚙️ button
  await page.locator('app-header button').filter({ hasText: '⚙️' }).click();

  // Switch to "Minions" tab inside the drawer
  const minionsTab = page.locator('app-drawer-panel button').filter({ hasText: /Minions/ });
  await minionsTab.waitFor({ state: 'visible', timeout: 3_000 });
  await minionsTab.click();

  // Click hire button
  await page.getByRole('button', { name: /Hire Minion/i }).click();

  // Wait for the header to update after hiring
  await page.waitForTimeout(500);

  const minionCount = await getHeaderStat(page, 'Minions');
  expect(minionCount).toBeGreaterThanOrEqual(1);
});

test('Purchase upgrade after earning gold', async ({ page }) => {
  // Cheapest upgrade costs 30g, earn enough
  await earnGoldUntil(page, 30);

  // Open the drawer panel by clicking the ⚙️ button
  await page.locator('app-header button').filter({ hasText: '⚙️' }).click();

  // Switch to "Upgrades" tab inside the drawer
  const upgradesTab = page.locator('app-drawer-panel button').filter({ hasText: /Upgrades/ });
  await upgradesTab.waitFor({ state: 'visible', timeout: 3_000 });
  await upgradesTab.click();

  // Find the first affordable buy button (shows gold cost like "10g")
  const buyBtn = page.locator('app-upgrade-shop button:not([disabled])').filter({ hasText: /\d+g/ }).first();
  await buyBtn.click();

  // Verify level incremented — look for "1/" text (level went from 0 to 1)
  await expect(page.locator('app-upgrade-shop').locator('text=1/')).toBeVisible();
});

test('Drawer tab navigation shows correct content', async ({ page }) => {
  // Open the drawer panel by clicking the ⚙️ button
  await page.locator('app-header button').filter({ hasText: '⚙️' }).click();

  // Notoriety tab (default) -> app-notoriety-bar
  await expect(page.locator('app-notoriety-bar')).toBeVisible();

  // Minions tab -> app-hire-minion-panel
  await page.locator('app-drawer-panel button').filter({ hasText: /Minions/ }).click();
  await expect(page.locator('app-hire-minion-panel')).toBeVisible();

  // Upgrades tab -> app-upgrade-shop
  await page.locator('app-drawer-panel button').filter({ hasText: /Upgrades/ }).click();
  await expect(page.locator('app-upgrade-shop')).toBeVisible();

  // Depts tab -> app-department-panel
  await page.locator('app-drawer-panel button').filter({ hasText: /Depts/ }).click();
  await expect(page.locator('app-department-panel')).toBeVisible();
});

test('Reset game clears progress', async ({ page }) => {
  await earnGold(page);
  const goldBefore = await getHeaderStat(page, 'Gold');
  expect(goldBefore).toBeGreaterThan(0);

  // Use resetGame helper which properly clears localStorage and reloads
  await resetGame(page);

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
  // Check initial notoriety in the header (shows as "0/100" next to 🔥)
  const initialNotoriety = await getHeaderStat(page, 'Notoriety');
  expect(initialNotoriety).toBe(0);

  // Complete a task
  await earnGold(page);

  // Check notoriety increased in the header
  const notoriety = await getHeaderStat(page, 'Notoriety');
  expect(notoriety).toBeGreaterThan(0);
});
