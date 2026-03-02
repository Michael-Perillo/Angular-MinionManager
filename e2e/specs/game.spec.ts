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

test('Drawer tab navigation shows correct content', async ({ page, nav }) => {
  test.skip(nav.isMobile, 'Desktop drawer not available on mobile');

  // Open drawer — Minions is default tab
  await nav.goToHirePanel();
  await expect(page.locator('app-hire-minion-panel')).toBeVisible();

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

test('Quarter review modal appears on quarter completion', async ({ page, nav }) => {
  // Seed state: Y1Q1 at 29/30 tasks, with a 1-click task in the player workbench
  const taskId = 'e2e-final-task';
  await nav.seedState({
    gold: 100,
    completedCount: 29,
    totalGoldEarned: 100,
    unlockedDepartments: ['schemes'],
    missionBoard: [],
    playerQueue: [
      {
        id: taskId,
        template: { name: 'Final Task', description: 'Complete this.', category: 'schemes', tier: 'petty' },
        status: 'queued',
        tier: 'petty',
        goldReward: 5,
        clicksRequired: 1,
        clicksRemaining: 1,
        assignedMinionId: null,
        queuedAt: Date.now(),
        assignedQueue: 'player',
      },
    ],
    quarterProgress: {
      year: 1,
      quarter: 1,
      grossGoldEarned: 100,
      tasksCompleted: 29,
      isComplete: false,
      missedQuarters: 0,
      quarterResults: [],
    },
  });

  // Navigate to workbench and click the task to complete it
  await nav.goToWorkbench();
  const clickBtn = page.locator('app-player-workbench button').filter({ hasText: /CLICK/ }).first();
  await clickBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await clickBtn.click();

  // Quarter review modal should appear
  const modal = page.locator('app-quarter-review');
  await modal.waitFor({ state: 'visible', timeout: 5_000 });
  await expect(modal.getByRole('heading', { name: 'Q1 Year 1 Review' })).toBeVisible();
  await expect(modal.getByText('TARGET MET')).toBeVisible();

  // Click Continue
  const continueBtn = page.getByRole('button', { name: /Continue to Q2/i });
  await continueBtn.click();

  // Quarter review modal should dismiss
  await modal.waitFor({ state: 'hidden', timeout: 3_000 });

  // Shop modal should appear between quarters
  const shop = page.locator('app-shop');
  await shop.waitFor({ state: 'visible', timeout: 3_000 });

  // Close shop to advance to next quarter
  const shopContinue = shop.getByTestId('shop-continue');
  await shopContinue.click();
  await shop.waitFor({ state: 'hidden', timeout: 3_000 });

  // Header should show Y1Q2
  await expect(page.getByText('Y1Q2')).toBeVisible({ timeout: 3_000 });
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
