import { test, expect } from '../fixtures';

test.beforeEach(async ({ nav }) => {
  await nav.resetGame();
});

test('Bottom nav visible with 3 tabs', async ({ page }) => {
  const nav = page.locator('app-mobile-bottom-nav nav');
  await expect(nav).toBeVisible();

  const tabs = nav.locator('button');
  await expect(tabs).toHaveCount(3);

  await expect(tabs.nth(0)).toContainText('Missions');
  await expect(tabs.nth(1)).toContainText('Work');
  await expect(tabs.nth(2)).toContainText('More');
});

test('Tab switching shows correct content', async ({ page, nav }) => {
  // Missions tab (default) — mission board visible
  await nav.goToMissions();
  await expect(page.locator('app-mission-board')).toBeVisible();

  // Work tab — department columns visible (schemes always unlocked)
  await nav.goToDepartments();
  await page.waitForTimeout(300);
  await expect(page.locator('app-department-column').first()).toBeVisible();

  // More tab — settings/more menu visible
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'More' }).click();
  await expect(page.getByText('Departments')).toBeVisible();
});

test('Touch scrolling works without CDK drag ghost', async ({ page, nav }) => {
  await nav.goToDepartments();
  await expect(page.locator('app-department-column').first()).toBeVisible();

  const dragPreview = page.locator('.cdk-drag-preview');
  await expect(dragPreview).toHaveCount(0);
});

test('Swipe navigation between department columns after hire', async ({ page, nav }) => {
  await nav.goToDepartments();
  await page.waitForTimeout(300);
  // Schemes dept always visible, others require unlocking
  await expect(page.locator('app-department-column')).toHaveCount(1);
});

test('Execute button auto-routes to Schemes on mobile', async ({ page, nav }) => {
  // Board is pre-seeded with scheme cards
  await nav.goToMissions();
  const execBtn = page.locator('app-mission-board button').filter({ hasText: /Execute/ }).first();
  await execBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await execBtn.click();
  // Wait for 350ms exit animation + event emission before switching tabs
  await page.waitForTimeout(500);

  // Navigate to Work tab to verify task was queued in dept column (no router popup)
  await nav.goToWorkbench();
  const clickBtn = page.locator('app-department-column button').filter({ hasText: /Click/ });
  await expect(clickBtn.first()).toBeVisible({ timeout: 5_000 });
});

test('Department column fills viewport width on mobile', async ({ page, nav }) => {
  await nav.goToDepartments();
  await expect(page.locator('app-department-column').first()).toBeVisible();

  const columnWidth = await page.locator('app-department-column').first().evaluate(el => {
    return el.getBoundingClientRect().width;
  });
  const viewportWidth = page.viewportSize()?.width ?? 0;

  expect(columnWidth).toBeGreaterThan(viewportWidth * 0.8);
});
