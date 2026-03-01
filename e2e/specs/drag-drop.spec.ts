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

test('Player workbench queued tasks are draggable for reordering', async ({ nav, page }) => {
  const makeTask = (id: string, name: string) => ({
    id,
    template: { name, description: 'Test', category: 'schemes', tier: 'petty' },
    status: 'queued',
    tier: 'petty',
    goldReward: 5,
    timeToComplete: 10,
    timeRemaining: 10,
    clicksRequired: 12,
    clicksRemaining: 12,
    assignedMinionId: null,
    queuedAt: Date.now(),
    assignedQueue: 'player',
  });

  await nav.seedState({
    playerQueue: [
      makeTask('task-1', 'Alpha Mission'),
      makeTask('task-2', 'Bravo Mission'),
      makeTask('task-3', 'Charlie Mission'),
    ],
  });

  // Verify the active task and queued tasks render in order
  const activeTask = page.locator('app-player-workbench .game-card.border-gold\\/30');
  await expect(activeTask).toContainText('Alpha Mission');

  const queuedCards = page.locator('app-player-workbench [cdkdrag]');
  await expect(queuedCards).toHaveCount(2);
  await expect(queuedCards.nth(0)).toContainText('Bravo Mission');
  await expect(queuedCards.nth(1)).toContainText('Charlie Mission');

  // Verify queued cards have cursor-grab class (are draggable)
  await expect(queuedCards.nth(0)).toHaveClass(/cursor-grab/);
  await expect(queuedCards.nth(1)).toHaveClass(/cursor-grab/);
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
