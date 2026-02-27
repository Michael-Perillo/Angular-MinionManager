import { test, expect } from '../fixtures';

test.beforeEach(async ({ nav }) => {
  await nav.resetGame();
});

test('App loads with heading and mission board', async ({ page, nav }) => {
  await expect(page.getByRole('heading', { name: 'Minion Manager' })).toBeVisible();
  await nav.goToMissions();
  await expect(page.getByRole('heading', { name: 'Mission Board' })).toBeVisible();
  const cards = page.locator('app-mission-board .game-card');
  await expect(cards.first()).toBeVisible();
});

test('Accept mission moves it to a queue', async ({ missionBoard, workbench }) => {
  await missionBoard.sendFirstMissionToQueue();
  await missionBoard.routeToWorkbench();

  // Verify the workbench received the task (CLICK button visible)
  await expect(workbench.clickButton.first()).toBeVisible({ timeout: 5_000 });
});

test('Click task to completion earns gold', async ({ game }) => {
  const gold = await game.earnGold();
  expect(gold).toBeGreaterThan(0);
});

test('Hire minion after earning gold', async ({ nav, hire, header }) => {
  await nav.seedState({ gold: 200 });
  await hire.scoutRecruits();
  await hire.pickFirstCandidate();
  expect(await header.minions).toBeGreaterThanOrEqual(1);
});

test('Purchase upgrade after earning gold', async ({ page, nav }) => {
  await nav.seedState({ gold: 200 });

  await nav.goToUpgradeShop();

  const buyBtn = page.locator('app-upgrade-shop button:not([disabled])').filter({ hasText: /\d+g/ }).first();
  await buyBtn.click();

  await expect(page.locator('app-upgrade-shop').locator('text=Lv.1')).toBeVisible();
});

test('Drawer tab navigation shows correct content', async ({ page, nav }) => {
  test.skip(nav.isMobile, 'Desktop drawer not available on mobile');

  // Open drawer — Notoriety is default tab
  await nav.goToNotoriety();
  await expect(page.locator('app-notoriety-bar')).toBeVisible();

  // Minions tab
  await nav.goToHirePanel();
  await expect(page.locator('app-hire-minion-panel')).toBeVisible();

  // Upgrades tab
  await nav.goToUpgradeShop();
  await expect(page.locator('app-upgrade-shop')).toBeVisible();

  // Depts tab
  await nav.goToDepartmentPanel();
  await expect(page.locator('app-department-panel')).toBeVisible();
});

test('Reset game clears progress', async ({ nav, game, header, page }) => {
  await game.earnGold();
  const goldBefore = await header.gold;
  expect(goldBefore).toBeGreaterThan(0);

  await nav.resetGame();

  const goldAfter = await header.gold;
  expect(goldAfter).toBe(0);
  await nav.goToMissions();
  await expect(page.locator('app-mission-board .game-card').first()).toBeVisible();
});

// Re-enable when event-driven saves land (save on task completion, hiring, etc.)
test.skip('Persistence across page reload', async ({ page, game, header }) => {
  await game.earnGold();
  const goldBefore = await header.gold;
  expect(goldBefore).toBeGreaterThan(0);

  await page.reload();
  await page.locator('app-header').waitFor({ state: 'visible' });

  const goldAfter = await header.gold;
  expect(goldAfter).toBe(goldBefore);
});

test('Notoriety tracks after completing tasks', async ({ game, header }) => {
  const initial = await header.notoriety;
  expect(initial).toBe(0);

  await game.earnGold();

  const after = await header.notoriety;
  expect(after).toBeGreaterThan(0);
});
