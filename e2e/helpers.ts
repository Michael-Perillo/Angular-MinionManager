import { Page } from '@playwright/test';

/** Clear localStorage, reload, and wait for the app shell to render. */
export async function resetGame(page: Page): Promise<void> {
  await page.goto('/');
  // Disable localStorage.setItem so the beforeunload save handler can't
  // re-persist state when we reload, then clear storage.
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {};
    localStorage.clear();
  });
  await page.reload();
  await page.locator('app-header').waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Accept a mission from the board by clicking "Send to Queue",
 * routing it to the player workbench, and clicking CLICK until
 * the task completes. Returns the gold value shown in the header.
 */
export async function earnGold(page: Page): Promise<number> {
  // Click "Send to Queue" on the first mission card
  const sendBtn = page.locator('app-mission-board button').filter({ hasText: /Send to Queue/ }).first();
  await sendBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await sendBtn.click();

  // The mission router popup appears — click "My Workbench"
  const workbenchOption = page.locator('app-mission-router button').filter({ hasText: /My Workbench/ });
  await workbenchOption.waitFor({ state: 'visible', timeout: 3_000 });
  await workbenchOption.click();

  // Wait for the CLICK button to appear in the player workbench
  const clickBtn = page.locator('app-player-workbench button').filter({ hasText: /CLICK/ });
  await clickBtn.first().waitFor({ state: 'visible', timeout: 5_000 });

  // Click the CLICK button until the task completes
  for (let i = 0; i < 60; i++) {
    const count = await clickBtn.count();
    if (count === 0) break;
    await clickBtn.first().click();
    await page.waitForTimeout(100);
  }

  // Wait for gold to update after task completion
  await page.waitForTimeout(200);

  return getHeaderStat(page, 'Gold');
}

/**
 * Earn gold by completing multiple missions until at least the target amount.
 */
export async function earnGoldUntil(page: Page, target: number): Promise<number> {
  let gold = await getHeaderStat(page, 'Gold');
  let attempts = 0;
  while (gold < target && attempts < 20) {
    gold = await earnGold(page);
    attempts++;
  }
  return gold;
}

/**
 * Read a numeric stat value from the header by its label.
 * The new header uses emoji + value pairs (e.g. 🪙 100).
 * Supported labels: Gold, Completed, Minions.
 */
export async function getHeaderStat(page: Page, label: string): Promise<number> {
  const emojiMap: Record<string, string> = {
    gold: '🪙',
    completed: '✅',
    minions: '👾',
    notoriety: '🔥',
    supplies: '⚗️',
    intel: '🕵️',
  };

  const emoji = emojiMap[label.toLowerCase()];
  if (!emoji) return 0;

  // Find the stat group containing the emoji, then read the sibling value span
  const value = await page.locator('app-header').evaluate((header, e) => {
    const spans = header.querySelectorAll('span');
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].textContent?.trim() === e) {
        // The next span sibling should contain the numeric value
        const valueSpan = spans[i].nextElementSibling;
        if (valueSpan) {
          // Handle notoriety format "X/100"
          const text = valueSpan.textContent?.trim() ?? '0';
          return text.split('/')[0];
        }
      }
    }
    return '0';
  }, emoji);

  return parseInt(value, 10);
}
