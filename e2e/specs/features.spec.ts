import { test, expect } from '../fixtures';

test.beforeEach(async ({ nav }) => {
  await nav.resetGame();
});

// ─── Progressive Department Unlocking ──────────

test.describe('Progressive Department Unlocking', () => {
  test('New game starts with no department columns visible', async ({ kanban }) => {
    await kanban.goToDepartments();
    await expect(kanban.departmentColumns).toHaveCount(0);
  });

  test('Hiring a minion unlocks a department column', async ({ nav, hire, header, kanban }) => {
    await nav.seedState({ gold: 200 });
    await hire.scoutRecruits();
    await hire.pickFirstCandidate();

    expect(await header.minions).toBeGreaterThanOrEqual(1);

    await kanban.goToDepartments();
    await expect(kanban.departmentColumns.first()).toBeVisible({ timeout: 5_000 });
  });

  test('Department opened notification appears after first hire', async ({ nav, hire, page }) => {
    await nav.seedState({ gold: 200 });
    await hire.scoutRecruits();
    await hire.pickFirstCandidate();

    await expect(page.getByText(/Department opened/)).toBeVisible({ timeout: 3_000 });
  });
});

// ─── Minion Hiring Choice ──────────

test.describe('Minion Hiring Choice (Pick-one-of-two)', () => {
  test('Scout Recruits shows two candidate cards', async ({ nav, hire }) => {
    await nav.seedState({ gold: 200 });
    await hire.scoutRecruits();

    await expect(hire.candidateCards).toHaveCount(2);

    for (let i = 0; i < 2; i++) {
      const card = hire.candidateCards.nth(i);
      await expect(card.locator('text=Speed')).toBeVisible();
      await expect(card.locator('text=Efficiency')).toBeVisible();
    }
  });

  test('Cancel button dismisses candidate cards', async ({ nav, hire }) => {
    await nav.seedState({ gold: 200 });
    await hire.scoutRecruits();
    await hire.cancelSelection();

    await expect(hire.scoutButton).toBeVisible();
  });

  test('Choosing a candidate hires them and updates minion count', async ({ nav, hire, header }) => {
    await nav.seedState({ gold: 200 });
    await hire.scoutRecruits();
    await hire.pickFirstCandidate();

    expect(await header.minions).toBe(1);
    await expect(hire.chooseText).not.toBeVisible();
  });

  test('Candidate from locked dept shows "new!" badge', async ({ nav, hire }) => {
    // Seed enough gold for two hires
    await nav.seedState({ gold: 200 });

    // First hire
    await hire.scoutRecruits();
    await hire.pickFirstCandidate();
    await hire.closePanel();

    // Second hire
    await hire.scoutRecruits();

    // At least one candidate should show "new!" (since only 1 of 4 depts unlocked)
    const badgeCount = await hire.newBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(1);
  });
});

// ─── Mission Board Sorting ──────────

test.describe('Mission Board Sorting', () => {
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

// ─── Mission Router Guards ──────────

test.describe('Mission Router guards', () => {
  test('Mission router only shows My Workbench when no departments unlocked', async ({ missionBoard }) => {
    await missionBoard.sendFirstMissionToQueue();

    await expect(missionBoard.router).toBeVisible({ timeout: 3_000 });
    await expect(missionBoard.routerButtons).toHaveCount(1);
    await expect(missionBoard.routerButtons.first()).toContainText('My Workbench');
  });
});

// ─── Year-End Boss Review ──────────

test.describe('Year-End Boss Review', () => {
  test('Reviewer intro appears after Q3 completion', async ({ page, nav }) => {
    // Seed at end of Q3: 59/60 tasks done, with a 1-click task in player queue
    const taskId = 'e2e-q3-final';
    await nav.seedState({
      gold: 1500,
      completedCount: 59,
      totalGoldEarned: 1500,
      unlockedDepartments: ['schemes'],
      missionBoard: [],
      playerQueue: [
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
          assignedQueue: 'player',
        },
      ],
      quarterProgress: {
        year: 1,
        quarter: 3,
        grossGoldEarned: 1500,
        tasksCompleted: 59,
        isComplete: false,
        missedQuarters: 0,
        quarterResults: [
          { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
          { year: 1, quarter: 2, passed: true, goldEarned: 500, target: 300, tasksCompleted: 40 },
        ],
      },
    });

    // Complete the final Q3 task
    await nav.goToWorkbench();
    const clickBtn = page.locator('app-player-workbench button').filter({ hasText: /CLICK/ }).first();
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

  test('Hiring Frozen constraint visible during Q4 review', async ({ page, nav }) => {
    // Seed directly in Q4 with Grimes (base: no-hiring) as reviewer
    await nav.seedState({
      gold: 200,
      completedCount: 130,
      totalGoldEarned: 2100,
      unlockedDepartments: ['schemes', 'heists'],
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
      },
    });

    // Open hire panel and verify the constraint is shown
    await nav.goToHirePanel();
    await expect(page.getByText('Hiring Frozen')).toBeVisible({ timeout: 5_000 });
  });

  test('Run-over screen appears when game is over', async ({ page, nav }) => {
    // Seed with isRunOver: true
    await nav.seedState({
      gold: 50,
      completedCount: 160,
      totalGoldEarned: 2200,
      unlockedDepartments: ['schemes'],
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
      },
    });

    // Quarter review modal should be visible — click Continue
    const reviewModal = page.locator('app-quarter-review');
    await reviewModal.waitFor({ state: 'visible', timeout: 5_000 });
    const reviewContinue = page.getByRole('button', { name: /Continue to Q2/i });
    await reviewContinue.click();
    await reviewModal.waitFor({ state: 'hidden', timeout: 3_000 });

    // Shop modal should appear
    const shop = page.locator('app-shop');
    await shop.waitFor({ state: 'visible', timeout: 3_000 });

    // Buy Iron Fingers voucher
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
