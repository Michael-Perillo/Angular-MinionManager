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
    return this.page.locator('app-mission-board button').filter({ hasText: /Default|Tier|Gold|Time/ });
  }

  get tierBadges() {
    return this.page.locator('app-mission-board app-tier-badge');
  }

  async sendFirstMissionToQueue(): Promise<void> {
    await this.nav.goToMissions();
    const sendBtn = this.page.locator('app-mission-board button').filter({ hasText: /Send to Queue/ }).first();
    await sendBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await sendBtn.click();
  }

  async routeToWorkbench(): Promise<void> {
    const router = this.page.locator('app-mission-router');
    const workbenchOption = router.locator('button').filter({ hasText: /My Workbench/ });
    await workbenchOption.waitFor({ state: 'visible', timeout: 3_000 });
    await workbenchOption.click();
    await router.waitFor({ state: 'hidden', timeout: 5_000 });
    await this.nav.goToWorkbench();
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

  /** Get the mission router popup locator */
  get router() {
    return this.page.locator('app-mission-router');
  }

  get routerButtons() {
    return this.router.locator('button').filter({ hasNotText: /CANCEL|✕/ });
  }

  private previousMode(mode: string): string {
    const order = ['Default', 'Tier', 'Gold', 'Time'];
    const idx = order.indexOf(mode);
    return idx > 0 ? order[idx - 1] : order[order.length - 1];
  }
}
