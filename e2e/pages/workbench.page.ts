import { Page } from '@playwright/test';
import { NavigationPage } from './navigation.page';

export class WorkbenchPage {
  constructor(
    private page: Page,
    private nav: NavigationPage,
  ) {}

  /** Click button is now in department columns */
  get clickButton() {
    return this.page.locator('app-department-column button').filter({ hasText: /Click/ });
  }

  /** The schemes department column (always unlocked, primary work area) */
  get workbench() {
    return this.page.locator('app-department-column').first();
  }

  /** Drop target is now the schemes department column */
  get dropTarget() {
    return this.page.locator('#schemes');
  }

  async clickUntilTaskComplete(): Promise<void> {
    await this.nav.goToWorkbench();
    await this.clickButton.first().waitFor({ state: 'visible', timeout: 5_000 });

    for (let i = 0; i < 60; i++) {
      const count = await this.clickButton.count();
      if (count === 0) break;
      await this.clickButton.first().click();
      await this.page.waitForTimeout(20);
    }

    await this.page.waitForTimeout(200);
  }

  async hasActiveTask(): Promise<boolean> {
    await this.nav.goToWorkbench();
    return (await this.clickButton.count()) > 0;
  }
}
