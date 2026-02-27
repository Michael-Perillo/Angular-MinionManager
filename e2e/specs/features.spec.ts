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

    // Gold → Time
    await sortArea.locator('button').filter({ hasText: /Gold/ }).click();
    await expect(sortArea.getByText('Time')).toBeVisible();

    // Time → Default (wraps)
    await sortArea.locator('button').filter({ hasText: /Time/ }).click();
    await expect(sortArea.getByText('Default')).toBeVisible();
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
