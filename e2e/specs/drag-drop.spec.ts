import { test, expect } from '../fixtures';

test.beforeEach(async ({ nav }) => {
  await nav.resetGame();
});

test('Schemes department column is always visible', async ({ page }) => {
  const schemesColumn = page.locator('#schemes');
  await expect(schemesColumn).toBeVisible();
});

test('Department queue tasks are draggable for reordering', async ({ nav, page }) => {
  const makeTask = (id: string, name: string) => ({
    id,
    template: { name, description: 'Test', category: 'schemes', tier: 'petty' },
    status: 'queued',
    tier: 'petty',
    goldReward: 5,
    clicksRequired: 12,
    clicksRemaining: 12,
    assignedMinionId: null,
    queuedAt: Date.now(),
    assignedQueue: 'schemes',
  });

  await nav.seedState({
    departmentQueues: {
      schemes: [
        makeTask('task-1', 'Alpha Mission'),
        makeTask('task-2', 'Bravo Mission'),
        makeTask('task-3', 'Charlie Mission'),
      ],
      heists: [], research: [], mayhem: [],
    },
  });

  // Verify the department column shows queued tasks
  const deptColumn = page.locator('app-department-column').first();
  await expect(deptColumn).toBeVisible({ timeout: 5_000 });

  // Verify queued cards have cursor-grab class (are draggable)
  const queuedCards = deptColumn.locator('[cdkdrag]');
  const count = await queuedCards.count();
  expect(count).toBeGreaterThanOrEqual(1);
  if (count > 0) {
    await expect(queuedCards.first()).toHaveClass(/cursor-grab/);
  }
});

test('Execute button routes scheme to queue', async ({ page, nav }) => {
  const execBtn = page.locator('app-mission-board button').filter({ hasText: /Execute/ }).first();
  await expect(execBtn).toBeVisible();

  await execBtn.click();
  await page.waitForTimeout(500);

  // Scheme should have routed to the Schemes department queue
  const clickBtn = page.locator('app-department-column button').filter({ hasText: /Click/ }).first();
  await expect(clickBtn).toBeVisible({ timeout: 3_000 });
});
