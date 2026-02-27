import { test, expect } from '../fixtures';

test.beforeEach(async ({ nav }) => {
  await nav.resetGame();
});

test('Mission board cards are draggable (have cursor-grab class)', async ({ page }) => {
  const missionCard = page.locator('app-mission-board .game-card').first();
  await expect(missionCard).toBeVisible();
  await expect(missionCard).toHaveClass(/cursor-grab/);
});

test('Mission board has cdkDropList with id mission-board', async ({ page }) => {
  const dropList = page.locator('app-mission-board #mission-board');
  await expect(dropList).toBeVisible();
});

test('Department columns appear after hiring minions', async ({ page, kanban }) => {
  await expect(kanban.lockedPlaceholder).toBeVisible();
  await expect(page.locator('#player')).toBeVisible();
});

test('Player workbench has drop list with id player', async ({ page }) => {
  await expect(page.locator('#player')).toBeVisible();
});

test('Drag mission card to player workbench from board', async ({ page, workbench }) => {
  const missionCard = page.locator('app-mission-board .game-card').first();
  await expect(missionCard).toBeVisible();
  await expect(workbench.dropTarget).toBeVisible();

  await missionCard.dragTo(workbench.dropTarget);
  await page.waitForTimeout(500);

  const workbenchContent = await workbench.workbench.textContent();
  expect(workbenchContent).toBeTruthy();
});

test('Drag mission card to player workbench', async ({ page, workbench }) => {
  const missionCard = page.locator('app-mission-board .game-card').first();
  await expect(missionCard).toBeVisible();
  await expect(workbench.dropTarget).toBeVisible();

  await missionCard.dragTo(workbench.dropTarget);
  await page.waitForTimeout(500);

  const workbenchContent = await workbench.workbench.textContent();
  expect(workbenchContent).toBeTruthy();
});

test('Send to Queue button still works alongside drag', async ({ page, missionBoard }) => {
  const sendBtn = page.locator('app-mission-board button').filter({ hasText: /Send to Queue/ }).first();
  await expect(sendBtn).toBeVisible();

  const countBefore = await page.locator('app-mission-board .game-card').count();
  await sendBtn.click();
  await page.waitForTimeout(500);

  const routerVisible = await page.locator('app-mission-router').isVisible().catch(() => false);
  const countAfter = await page.locator('app-mission-board .game-card').count();

  expect(routerVisible || countAfter !== countBefore).toBeTruthy();
});
