import { Page } from '@playwright/test';
import { NavigationPage } from './navigation.page';

export class KanbanPage {
  constructor(
    private page: Page,
    private nav: NavigationPage,
  ) {}

  get departmentColumns() {
    return this.page.locator('app-department-column');
  }

  get kanbanBoard() {
    return this.page.locator('app-kanban-board');
  }

  get lockedPlaceholder() {
    return this.page.locator('app-kanban-board').getByText('More departments unlock');
  }

  get missionBoardDropList() {
    return this.page.locator('app-mission-board #mission-board');
  }

  get missionCards() {
    return this.page.locator('app-mission-board .game-card');
  }

  async goToDepartments(): Promise<void> {
    await this.nav.goToDepartments();
  }
}
