import { Page, expect } from '@playwright/test';
import { NavigationPage } from './navigation.page';

export class HirePage {
  constructor(
    private page: Page,
    private nav: NavigationPage,
  ) {}

  get scoutButton() {
    return this.page.getByRole('button', { name: /Scout Recruits/i });
  }

  get candidateCards() {
    return this.page.locator('app-hire-minion-panel .grid button');
  }

  get chooseText() {
    return this.page.getByText('Choose your new minion');
  }

  get cancelButton() {
    return this.page.getByRole('button', { name: /Cancel/i });
  }

  get newBadges() {
    return this.page.locator('app-hire-minion-panel .grid').getByText('new!');
  }

  async scoutRecruits(): Promise<void> {
    await this.nav.goToHirePanel();
    await this.scoutButton.waitFor({ state: 'visible', timeout: 5_000 });
    await this.scoutButton.click();
    await expect(this.chooseText).toBeVisible({ timeout: 3_000 });
  }

  async pickFirstCandidate(): Promise<void> {
    await this.candidateCards.first().click();
    await this.page.waitForTimeout(500);
  }

  async cancelSelection(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.chooseText).not.toBeVisible();
  }

  /** Close the drawer/panel after hiring (desktop: click gear; mobile: no-op since tabs switch) */
  async closePanel(): Promise<void> {
    if (!this.nav.isMobile) {
      await this.page.locator('app-header button').filter({ hasText: '⚙️' }).click();
      await this.page.waitForTimeout(300);
    }
  }
}
