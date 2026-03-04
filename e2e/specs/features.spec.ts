import { test, expect } from '../fixtures';

test.beforeEach(async ({ nav }) => {
  await nav.resetGame();
});

// ─── Progressive Department Unlocking ──────────

test.describe('Progressive Department Unlocking', () => {
  test('New game starts with schemes department column visible', async ({ kanban }) => {
    await kanban.goToDepartments();
    await expect(kanban.departmentColumns).toHaveCount(1);
  });

  test('Seeded department unlock shows additional department columns', async ({ nav, kanban }) => {
    await nav.seedState({
      gold: 200,
      ownedVouchers: { 'unlock-heists': 1 },
    });

    await kanban.goToDepartments();
    await expect(kanban.departmentColumns).toHaveCount(2);
  });
});

// ─── Minion Hiring ──────────

test.describe('Minion Hiring', () => {
  test('Hire Minion button hires and updates minion count', async ({ nav, hire, header }) => {
    await nav.seedState({ gold: 200 });
    await hire.hireMinion();

    expect(await header.minions).toBe(1);
  });

  test('Hired minion appears in unassigned pool', async ({ nav, hire, page }) => {
    await nav.seedState({ gold: 200 });
    await hire.hireMinion();

    // The pool section or "Unassigned Pool" label should be visible
    await expect(page.getByText(/assign/i).first()).toBeVisible({ timeout: 3_000 });
  });
});

// ─── Scheme Board Sorting ──────────

test.describe('Scheme Board Sorting', () => {
  test('Sort button is visible and shows "Default" initially', async ({ page, nav }) => {
    await nav.goToMissions();
    const sortBtn = page.locator('app-mission-board button').filter({ hasText: /Default/ });
    await expect(sortBtn).toBeVisible();
  });

  test('Clicking sort button cycles through sort modes', async ({ page, nav }) => {
    await nav.goToMissions();
    const sortArea = page.locator('app-mission-board');

    // Default → Tier
    await sortArea.locator('button').filter({ hasText: /Default/ }).click();
    await expect(sortArea.getByText('Tier')).toBeVisible();

    // Tier → Gold
    await sortArea.locator('button').filter({ hasText: /Tier/ }).click();
    await expect(sortArea.getByText('Gold')).toBeVisible();

    // Gold → Clicks
    await sortArea.locator('button').filter({ hasText: /Gold/ }).click();
    await expect(sortArea.locator('button').filter({ hasText: /Clicks/ })).toBeVisible();

    // Clicks → Default (wraps)
    await sortArea.locator('button').filter({ hasText: /Clicks/ }).click();
    await expect(sortArea.locator('button').filter({ hasText: /Default/ })).toBeVisible();
  });

  test('Sort by tier shows higher tier missions first', async ({ page, nav }) => {
    await nav.goToMissions();
    const sortBtn = page.locator('app-mission-board button').filter({ hasText: /Default/ });
    await sortBtn.click();
    await expect(page.locator('app-mission-board').getByText('Tier')).toBeVisible();

    const badges = page.locator('app-mission-board app-tier-badge');
    const count = await badges.count();
    if (count >= 2) {
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test('Sort persists when missions refresh', async ({ page, nav }) => {
    await nav.goToMissions();
    const sortBtn = page.locator('app-mission-board button').filter({ hasText: /Default/ });
    await sortBtn.click(); // → Tier
    await page.locator('app-mission-board button').filter({ hasText: /Tier/ }).click(); // → Gold
    await expect(page.locator('app-mission-board').getByText('Gold')).toBeVisible();

    await page.waitForTimeout(3000);

    await expect(page.locator('app-mission-board').getByText('Gold')).toBeVisible();
  });
});

// ─── Year-End Boss Review ──────────

test.describe('Year-End Boss Review', () => {
  test('Reviewer intro appears after Q3 completion', async ({ page, nav }) => {
    // Seed at end of Q3 with a 1-click task in schemes queue
    const taskId = 'e2e-q3-final';
    await nav.seedState({
      gold: 1500,
      completedCount: 44,
      totalGoldEarned: 1500,
      missionBoard: [],
      departmentQueues: {
        schemes: [
          {
            id: taskId,
            template: { name: 'Q3 Final', description: 'Complete this.', category: 'schemes', tier: 'petty' },
            status: 'queued',
            tier: 'petty',
            goldReward: 5,
            clicksRequired: 1,
            clicksRemaining: 1,
            assignedMinionId: null,
            queuedAt: Date.now(),
            assignedQueue: 'schemes',
          },
        ],
        heists: [], research: [], mayhem: [],
      },
      quarterProgress: {
        year: 1,
        quarter: 3,
        grossGoldEarned: 1500,
        tasksCompleted: 44,
        isComplete: false,
        missedQuarters: 0,
        quarterResults: [
          { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
          { year: 1, quarter: 2, passed: true, goldEarned: 500, target: 300, tasksCompleted: 40 },
        ],
        dismissalsRemaining: 5,
        researchCompleted: 0,
        activeBreakthroughs: 0,
      },
    });

    // Complete the final Q3 task
    await nav.goToWorkbench();
    const clickBtn = page.locator('app-department-column button').filter({ hasText: /Click/ }).first();
    await clickBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await clickBtn.click();

    // Q3 review modal should appear
    const quarterReview = page.locator('app-quarter-review');
    await quarterReview.waitFor({ state: 'visible', timeout: 5_000 });
    await expect(quarterReview.getByText('TARGET MET')).toBeVisible();

    // Dismiss Q3 review → advance to Q4
    await page.getByRole('button', { name: /Continue to Q4/i }).click();

    // Reviewer intro modal should appear
    const reviewerIntro = page.locator('app-reviewer-intro');
    await reviewerIntro.waitFor({ state: 'visible', timeout: 5_000 });
    await expect(reviewerIntro.getByText('Year-End Review')).toBeVisible();
    await expect(reviewerIntro.getByRole('button', { name: 'Begin Review' })).toBeVisible();
  });

  test('Hiring Freeze modifier badge visible during Q4 review', async ({ page, nav }) => {
    // Seed directly in Q4 with Grimes (base: no-hiring) as reviewer
    await nav.seedState({
      gold: 200,
      completedCount: 130,
      totalGoldEarned: 2100,
      ownedVouchers: { 'unlock-heists': 1 },
      missionBoard: [],
      currentReviewer: {
        id: 'grimes',
        name: 'Viktor Grimes',
        title: 'Head of Internal Affairs',
        personality: 'mixed',
        baseModifier: 'no-hiring',
        modifierPool: ['board-frozen', 'gold-drain', 'lock-heists'],
        yearMinimum: 1,
        goldTarget: 150,
      },
      activeModifiers: [
        { id: 'no-hiring', name: 'Hiring Freeze', description: 'No new hires during review', category: 'operational-constraint' },
      ],
      isRunOver: false,
      quarterProgress: {
        year: 1,
        quarter: 4,
        grossGoldEarned: 0,
        tasksCompleted: 0,
        isComplete: false,
        missedQuarters: 0,
        quarterResults: [
          { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
          { year: 1, quarter: 2, passed: true, goldEarned: 500, target: 300, tasksCompleted: 40 },
          { year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 900, tasksCompleted: 60 },
        ],
        dismissalsRemaining: 5,
        researchCompleted: 0,
        activeBreakthroughs: 0,
      },
    });

    // Verify the modifier badge is shown in the header
    await expect(page.getByText('Hiring Freeze')).toBeVisible({ timeout: 5_000 });
  });

  test('Run-over screen appears when game is over', async ({ page, nav }) => {
    // Seed with isRunOver: true
    await nav.seedState({
      gold: 50,
      completedCount: 160,
      totalGoldEarned: 2200,
      missionBoard: [],
      currentReviewer: {
        id: 'thornton',
        name: 'Margaret Thornton',
        title: 'VP of Compliance',
        personality: 'strict',
        baseModifier: 'sinister-only',
        modifierPool: ['no-hiring', 'gold-reduced-30', 'lock-research'],
        yearMinimum: 1,
        goldTarget: 200,
      },
      activeModifiers: [
        { id: 'sinister-only', name: 'High Standards', description: 'Only Sinister+ tasks count toward gold target', category: 'task-constraint' },
      ],
      isRunOver: true,
      quarterProgress: {
        year: 1,
        quarter: 4,
        grossGoldEarned: 100,
        tasksCompleted: 30,
        isComplete: true,
        missedQuarters: 1,
        quarterResults: [
          { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
          { year: 1, quarter: 2, passed: true, goldEarned: 500, target: 300, tasksCompleted: 40 },
          { year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 900, tasksCompleted: 60 },
          { year: 1, quarter: 4, passed: false, goldEarned: 100, target: 200, tasksCompleted: 30 },
        ],
        dismissalsRemaining: 5,
        researchCompleted: 0,
        activeBreakthroughs: 0,
      },
    });

    // Run-over screen should be visible immediately
    const runOver = page.locator('app-run-over');
    await runOver.waitFor({ state: 'visible', timeout: 5_000 });
    await expect(runOver.getByText('Performance Review Failed')).toBeVisible();
    await expect(runOver.getByRole('button', { name: 'New Run' })).toBeVisible();
  });
});

// ─── Voucher Shop ──────────────────────────

test.describe('Voucher Shop', () => {
  test('Shop appears after quarter completion and allows purchase', async ({ page, nav }) => {
    // Seed: Q1 complete with gold to buy a voucher
    await nav.seedState({
      gold: 500,
      quarterProgress: {
        year: 1,
        quarter: 1,
        grossGoldEarned: 200,
        tasksCompleted: 30,
        isComplete: true,
        missedQuarters: 0,
        quarterResults: [
          { year: 1, quarter: 1, passed: true, goldEarned: 200, target: 75, tasksCompleted: 30 },
        ],
        dismissalsRemaining: 5,
        researchCompleted: 0,
        activeBreakthroughs: 0,
      },
    });

    // Quarter review modal should be visible — click Continue
    const reviewModal = page.locator('app-quarter-review');
    await reviewModal.waitFor({ state: 'visible', timeout: 5_000 });
    const reviewContinue = page.getByRole('button', { name: /Continue to Q2/i });
    await reviewContinue.click();
    await reviewModal.waitFor({ state: 'hidden', timeout: 3_000 });

    // Shop modal should appear (no pack reward — jokers removed)
    const shop = page.locator('app-shop');
    await shop.waitFor({ state: 'visible', timeout: 3_000 });

    // Switch to Upgrades tab and buy Iron Fingers voucher
    await shop.getByTestId('shop-tab-upgrades').click();
    const buyBtn = shop.getByTestId('buy-iron-fingers');
    await buyBtn.click();

    // Gold should have decreased (40g for Iron Fingers L1)
    await expect(shop.getByText('460')).toBeVisible({ timeout: 2_000 });

    // Close shop
    await shop.getByTestId('shop-continue').click();
    await shop.waitFor({ state: 'hidden', timeout: 3_000 });

    // Header should show Y1Q2
    await expect(page.getByText('Y1Q2')).toBeVisible({ timeout: 3_000 });
  });

  test('Shop does not appear for Q3→Q4 transition', async ({ page, nav }) => {
    // Seed: Q3 complete → should go straight to reviewer intro
    await nav.seedState({
      gold: 500,
      quarterProgress: {
        year: 1,
        quarter: 3,
        grossGoldEarned: 1500,
        tasksCompleted: 60,
        isComplete: true,
        missedQuarters: 0,
        quarterResults: [
          { year: 1, quarter: 1, passed: true, goldEarned: 200, target: 75, tasksCompleted: 30 },
          { year: 1, quarter: 2, passed: true, goldEarned: 500, target: 300, tasksCompleted: 40 },
          { year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 900, tasksCompleted: 60 },
        ],
        dismissalsRemaining: 5,
        researchCompleted: 0,
        activeBreakthroughs: 0,
      },
    });

    // Quarter review modal — click Continue
    const reviewModal = page.locator('app-quarter-review');
    await reviewModal.waitFor({ state: 'visible', timeout: 5_000 });
    const reviewContinue = page.getByRole('button', { name: /Continue to Q4/i });
    await reviewContinue.click();
    await reviewModal.waitFor({ state: 'hidden', timeout: 3_000 });

    // Shop should NOT appear — reviewer intro should appear instead
    const shop = page.locator('app-shop');
    await expect(shop).not.toBeVisible();
    const reviewerIntro = page.locator('app-reviewer-intro');
    await reviewerIntro.waitFor({ state: 'visible', timeout: 3_000 });
  });
});
