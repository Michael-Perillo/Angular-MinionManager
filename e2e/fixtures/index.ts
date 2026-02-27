import { test as base } from '@playwright/test';
import { NavigationPage, DesktopNavigation, MobileNavigation } from '../pages/navigation.page';
import { HeaderPage } from '../pages/header.page';
import { MissionBoardPage } from '../pages/mission-board.page';
import { WorkbenchPage } from '../pages/workbench.page';
import { HirePage } from '../pages/hire.page';
import { KanbanPage } from '../pages/kanban.page';
import { GameActions } from '../pages/game-actions';

interface GameFixtures {
  nav: NavigationPage;
  header: HeaderPage;
  missionBoard: MissionBoardPage;
  workbench: WorkbenchPage;
  hire: HirePage;
  kanban: KanbanPage;
  game: GameActions;
}

export const test = base.extend<GameFixtures>({
  nav: async ({ page }, use, testInfo) => {
    const mobile = testInfo.project.name.includes('mobile');
    await use(mobile ? new MobileNavigation(page) : new DesktopNavigation(page));
  },
  header: async ({ page }, use) => {
    await use(new HeaderPage(page));
  },
  missionBoard: async ({ page, nav }, use) => {
    await use(new MissionBoardPage(page, nav));
  },
  workbench: async ({ page, nav }, use) => {
    await use(new WorkbenchPage(page, nav));
  },
  hire: async ({ page, nav }, use) => {
    await use(new HirePage(page, nav));
  },
  kanban: async ({ page, nav }, use) => {
    await use(new KanbanPage(page, nav));
  },
  game: async ({ header, missionBoard, workbench }, use) => {
    await use(new GameActions(header, missionBoard, workbench));
  },
});

export { expect } from '@playwright/test';
