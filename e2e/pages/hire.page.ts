import { Page, expect } from '@playwright/test';
import { NavigationPage } from './navigation.page';

export class HirePage {
  constructor(
    private page: Page,
    private nav: NavigationPage,
  ) {}

  /**
   * Hire a minion via the shop modal.
   * Opens the shop (via dev console), switches to Hire tab, clicks first option.
   */
  async hireMinion(): Promise<void> {
    await this.nav.openShop();

    const shop = this.page.locator('app-shop');
    await shop.waitFor({ state: 'visible', timeout: 5_000 });

    // Switch to Hire tab
    await this.page.getByTestId('shop-tab-hire').click();
    await this.page.waitForTimeout(200);

    // Click the first hire card button
    const hireCard = shop.locator('[data-testid^="hire-"]').first();
    await hireCard.waitFor({ state: 'visible', timeout: 3_000 });
    await hireCard.click();
    await this.page.waitForTimeout(300);

    // Close shop
    await this.closePanel();
  }

  /** Close the shop by clicking Continue */
  async closePanel(): Promise<void> {
    const continueBtn = this.page.getByTestId('shop-continue');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await this.page.waitForTimeout(200);
    }
  }
}
