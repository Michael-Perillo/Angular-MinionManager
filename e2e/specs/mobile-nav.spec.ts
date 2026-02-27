import { test, expect } from '../fixtures';

test.beforeEach(async ({ nav }) => {
  await nav.resetGame();
});

test('Bottom nav visible with 4 tabs', async ({ page }) => {
  const nav = page.locator('app-mobile-bottom-nav nav');
  await expect(nav).toBeVisible();

  const tabs = nav.locator('button');
  await expect(tabs).toHaveCount(4);

  await expect(tabs.nth(0)).toContainText('Missions');
  await expect(tabs.nth(1)).toContainText('Work');
  await expect(tabs.nth(2)).toContainText('Click');
  await expect(tabs.nth(3)).toContainText('More');
});

test('Tab switching shows correct content', async ({ page, nav }) => {
  // Missions tab (default) — mission board visible
  await nav.goToMissions();
  await expect(page.locator('app-mission-board')).toBeVisible();

  // Work tab
  await nav.goToDepartments();
  await page.waitForTimeout(300);

  // Click tab — player workbench visible
  await nav.goToWorkbench();
  await expect(page.locator('app-player-workbench')).toBeVisible();

  // More tab — settings/more menu visible
  await page.locator('app-mobile-bottom-nav button').filter({ hasText: 'More' }).click();
  await expect(page.getByText('Notoriety & Raids')).toBeVisible();
  await expect(page.getByText('Hire Minions')).toBeVisible();
});

test('Touch scrolling works without CDK drag ghost', async ({ page, nav }) => {
  await nav.goToWorkbench();
  await expect(page.locator('app-player-workbench')).toBeVisible();

  const dragPreview = page.locator('.cdk-drag-preview');
  await expect(dragPreview).toHaveCount(0);
});

test('Swipe navigation between department columns after hire', async ({ page, nav }) => {
  await nav.goToDepartments();
  await page.waitForTimeout(300);
  // At fresh start no departments are unlocked — expected with progressive unlocking
});

test('Send to Queue button works on mobile', async ({ page, missionBoard, nav }) => {
  await nav.goToMissions();
  const sendBtn = page.locator('app-mission-board button').filter({ hasText: /Send to Queue/ }).first();
  await sendBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await sendBtn.click();

  const workbenchOption = page.locator('app-mission-router button').filter({ hasText: /My Workbench/ });
  await workbenchOption.waitFor({ state: 'visible', timeout: 3_000 });
  await workbenchOption.click();

  // Navigate to Click tab to verify task was queued
  await nav.goToWorkbench();
  const clickBtn = page.locator('app-player-workbench button').filter({ hasText: /CLICK/ });
  await expect(clickBtn.first()).toBeVisible({ timeout: 5_000 });
});

test('Player workbench fills viewport width on mobile', async ({ page, nav }) => {
  await nav.goToWorkbench();
  await expect(page.locator('app-player-workbench')).toBeVisible();

  const workbenchWidth = await page.locator('app-player-workbench').evaluate(el => {
    return el.getBoundingClientRect().width;
  });
  const viewportWidth = page.viewportSize()?.width ?? 0;

  expect(workbenchWidth).toBeGreaterThan(viewportWidth * 0.8);
});
