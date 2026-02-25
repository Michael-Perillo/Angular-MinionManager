import { Page } from '@playwright/test';

/** Clear localStorage, reload, and wait for the app shell to render. */
export async function resetGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('app-header').waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Accept a mission from the board and click WORK until the task completes.
 * Returns the gold value shown in the header.
 */
export async function earnGold(page: Page): Promise<number> {
  // Accept first mission from the board
  const boardCard = page.locator('app-mission-board .game-card').first();
  await boardCard.click();

  // Wait for the WORK button to appear in the active missions area
  const workBtnLocator = page.locator('app-task-queue button', { hasText: /WORK|CLICK/i });
  await workBtnLocator.first().waitFor({ state: 'visible', timeout: 5_000 });

  // Click the WORK / CLICK button until it disappears (task completed)
  for (let i = 0; i < 60; i++) {
    const count = await workBtnLocator.count();
    if (count === 0) break;
    await workBtnLocator.first().click();
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

/** Read a numeric stat value from the header by its label (Gold, Completed, Minions). */
export async function getHeaderStat(page: Page, label: string): Promise<number> {
  // Use Playwright's text-based locators to find the stat label within the header,
  // then navigate to the sibling value element.
  // The structure is: <div><div>Label</div><div>Value</div></div>
  // We find the label's parent div (which wraps both label + value), then get the second child.
  const value = await page.locator('app-header').evaluate((header, lbl) => {
    const walker = document.createTreeWalker(header, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent?.trim().toLowerCase() === lbl.toLowerCase()) {
        // Found the label text node; its parent element is the label div.
        const labelEl = node.parentElement;
        if (!labelEl) continue;
        // The next sibling element should be the value div.
        const valueEl = labelEl.nextElementSibling;
        if (valueEl) {
          return valueEl.textContent?.trim() ?? '0';
        }
      }
    }
    return '0';
  }, label);

  return parseInt(value, 10);
}
