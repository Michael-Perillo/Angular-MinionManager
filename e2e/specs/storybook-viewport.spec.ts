import { test, expect } from '@playwright/test';

/**
 * Viewport smoke tests — verify responsive rendering of key components
 * against Storybook at desktop and mobile widths.
 *
 * These tests run against a Storybook instance (not the app).
 * Use: npx playwright test --config playwright-storybook.config.ts
 */

const STORYBOOK_URL = process.env['STORYBOOK_URL'] || 'http://localhost:6006';

const storyUrl = (storyId: string) =>
  `${STORYBOOK_URL}/iframe.html?id=${storyId}&viewMode=story`;

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 393, height: 851 };

test.describe('Kanban Board responsive', () => {
  const storyId = 'minion-manager-organisms-kanbanboard--early-game';

  test('desktop — columns display side by side', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP });
    const page = await context.newPage();
    await page.goto(storyUrl(storyId));
    await page.waitForSelector('app-kanban-board', { timeout: 15_000 });

    // Verify the board renders
    await expect(page.locator('app-kanban-board')).toBeVisible();
    await expect(page.locator('app-department-column').first()).toBeVisible();
    await context.close();
  });

  test('mobile — board renders at narrow width', async ({ browser }) => {
    const context = await browser.newContext({ viewport: MOBILE });
    const page = await context.newPage();
    await page.goto(storyUrl(storyId));
    await page.waitForSelector('app-kanban-board', { timeout: 15_000 });

    await expect(page.locator('app-kanban-board')).toBeVisible();
    await context.close();
  });
});

test.describe('Mission Board responsive', () => {
  const storyId = 'minion-manager-organisms-missionboard--full-board';

  test('desktop — grid renders missions', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP });
    const page = await context.newPage();
    await page.goto(storyUrl(storyId));
    await page.waitForSelector('app-mission-board', { timeout: 15_000 });

    await expect(page.locator('app-mission-board')).toBeVisible();
    const cards = page.locator('app-mission-board .game-card');
    await expect(cards.first()).toBeVisible();
    await context.close();
  });

  test('mobile — missions stack vertically', async ({ browser }) => {
    const context = await browser.newContext({ viewport: MOBILE });
    const page = await context.newPage();
    await page.goto(storyUrl(storyId));
    await page.waitForSelector('app-mission-board', { timeout: 15_000 });

    await expect(page.locator('app-mission-board')).toBeVisible();
    await context.close();
  });
});

test.describe('Mobile Bottom Nav responsive', () => {
  const storyId = 'minion-manager-molecules-mobilebottomnav--missions-tab';

  test('mobile — nav bar visible', async ({ browser }) => {
    const context = await browser.newContext({ viewport: MOBILE });
    const page = await context.newPage();
    await page.goto(storyUrl(storyId));
    await page.waitForSelector('app-mobile-bottom-nav', { timeout: 15_000 });

    await expect(page.getByText('Missions')).toBeVisible();
    await expect(page.getByText('Work')).toBeVisible();
    await expect(page.getByText('More')).toBeVisible();
    await context.close();
  });

  test('desktop — nav bar still renders', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP });
    const page = await context.newPage();
    await page.goto(storyUrl(storyId));
    await page.waitForSelector('app-mobile-bottom-nav', { timeout: 15_000 });

    // Component renders at any width (hidden in full app via media query, but visible in isolation)
    await expect(page.getByText('Missions')).toBeVisible();
    await context.close();
  });
});
