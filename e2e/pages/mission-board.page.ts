import { Page } from '@playwright/test';
import { NavigationPage } from './navigation.page';

export class MissionBoardPage {
  constructor(
    private page: Page,
    private nav: NavigationPage,
  ) {}

  get cards() {
    return this.page.locator('app-mission-board .game-card');
  }

  get sortButton() {
    return this.page.locator('app-mission-board button').filter({ hasText: /Default|Tier|Gold|Clicks/ });
  }

  get tierBadges() {
    return this.page.locator('app-mission-board app-tier-badge');
  }

  /** Execute first scheme — auto-routes to Schemes queue (no router popup) */
  async executeFirstScheme(): Promise<void> {
    await this.nav.goToMissions();
    const execBtn = this.page.locator('app-mission-board button').filter({ hasText: /Execute/ }).first();
    await execBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await execBtn.click();
    // Wait for 350ms exit animation + event emission before navigating away
    // (mobile tab switch destroys the component, severing the output binding)
    await this.page.waitForTimeout(500);
    await this.nav.goToWorkbench();
  }

  /** @deprecated Use executeFirstScheme() instead */
  async sendFirstMissionToQueue(): Promise<void> {
    await this.executeFirstScheme();
  }

  async cardCount(): Promise<number> {
    await this.nav.goToMissions();
    return this.cards.count();
  }

  async sortTo(mode: string): Promise<void> {
    await this.nav.goToMissions();
    const btn = this.page.locator('app-mission-board button').filter({ hasText: new RegExp(mode === 'Default' ? 'Time' : this.previousMode(mode)) });
    await btn.click();
  }

  async clickSortButton(): Promise<void> {
    await this.sortButton.click();
  }

  async getSortLabel(): Promise<string> {
    const text = await this.sortButton.textContent();
    return text?.trim() ?? '';
  }

  private previousMode(mode: string): string {
    const order = ['Default', 'Tier', 'Gold', 'Clicks'];
    const idx = order.indexOf(mode);
    return idx > 0 ? order[idx - 1] : order[order.length - 1];
  }
}
