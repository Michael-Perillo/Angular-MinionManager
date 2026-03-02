import { Page } from '@playwright/test';

/** Must match SAVE_VERSION in src/app/core/models/save-data.model.ts */
const SAVE_VERSION = 11;

export interface NavigationPage {
  resetGame(): Promise<void>;
  seedState(overrides: Record<string, unknown>): Promise<void>;
  goToMissions(): Promise<void>;
  goToWorkbench(): Promise<void>;
  goToDepartments(): Promise<void>;
  goToHirePanel(): Promise<void>;
  goToDepartmentPanel(): Promise<void>;
  readonly isMobile: boolean;
}

/** Minimal valid SaveData that loadSnapshot accepts. */
function baseSaveData(): Record<string, unknown> {
  const defaultDept = (category: string) => ({ category, xp: 0, level: 1 });
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    gold: 0,
    completedCount: 0,
    totalGoldEarned: 0,
    minions: [],
    departments: {
      schemes: defaultDept('schemes'),
      heists: defaultDept('heists'),
      research: defaultDept('research'),
      mayhem: defaultDept('mayhem'),
    },
    activeMissions: [],
    missionBoard: [],
    usedNameIndices: [],
    lastBoardRefresh: 0,
    departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
    playerQueue: [],
    unlockedDepartments: [],
    ownedVouchers: {},
    ownedCards: [],
    ownedJokers: [],
    equippedJokers: [],
    rules: [],
  };
}

export class DesktopNavigation implements NavigationPage {
  readonly isMobile = false;

  constructor(private page: Page) {}

  async resetGame(): Promise<void> {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
    await this.page.locator('app-header').waitFor({ state: 'visible', timeout: 15_000 });
  }

  async seedState(overrides: Record<string, unknown>): Promise<void> {
    const save = { ...baseSaveData(), ...overrides, version: SAVE_VERSION, savedAt: Date.now() };
    const json = JSON.stringify(save);
    // Use addInitScript so seeded data is written before the Angular app boots.
    // This avoids the beforeunload auto-save race (app saves empty state over seed on reload).
    await this.page.addInitScript((data) => {
      localStorage.setItem('minion-manager-save', data);
    }, json);
    await this.page.goto('/');
    await this.page.locator('app-header').waitFor({ state: 'visible', timeout: 10_000 });
  }

  async goToMissions(): Promise<void> {
    // Mission board is always visible on desktop
  }

  async goToWorkbench(): Promise<void> {
    // Player workbench is always visible on desktop
  }

  async goToDepartments(): Promise<void> {
    // Kanban board with department columns is always visible on desktop
  }

  async goToHirePanel(): Promise<void> {
    const drawer = this.page.locator('app-drawer-panel');
    const isOpen = await drawer.isVisible().catch(() => false);
    if (!isOpen) {
      await this.page.locator('app-header button').filter({ hasText: '⚙️' }).click();
      await drawer.waitFor({ state: 'visible', timeout: 3_000 });
    }
    const minionsTab = this.page.locator('app-drawer-panel button').filter({ hasText: /Minions/ });
    await minionsTab.waitFor({ state: 'visible', timeout: 3_000 });
    await minionsTab.click();
  }

  async goToDepartmentPanel(): Promise<void> {
    const drawer = this.page.locator('app-drawer-panel');
    const isOpen = await drawer.isVisible().catch(() => false);
    if (!isOpen) {
      await this.page.locator('app-header button').filter({ hasText: '⚙️' }).click();
      await drawer.waitFor({ state: 'visible', timeout: 3_000 });
    }
    const deptsTab = this.page.locator('app-drawer-panel button').filter({ hasText: /Depts/ });
    await deptsTab.waitFor({ state: 'visible', timeout: 3_000 });
    await deptsTab.click();
  }
}

export class MobileNavigation implements NavigationPage {
  readonly isMobile = true;

  constructor(private page: Page) {}

  async resetGame(): Promise<void> {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
    await this.page.locator('app-header').waitFor({ state: 'visible', timeout: 15_000 });
  }

  async seedState(overrides: Record<string, unknown>): Promise<void> {
    const save = { ...baseSaveData(), ...overrides, version: SAVE_VERSION, savedAt: Date.now() };
    await this.page.evaluate((data) => {
      localStorage.setItem('minion-manager-save', JSON.stringify(data));
    }, save);
    await this.page.reload();
    await this.page.locator('app-header').waitFor({ state: 'visible', timeout: 10_000 });
  }

  async goToMissions(): Promise<void> {
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Missions' }).click();
    await this.page.waitForTimeout(100);
  }

  async goToWorkbench(): Promise<void> {
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Click' }).click();
    await this.page.waitForTimeout(100);
  }

  async goToDepartments(): Promise<void> {
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Work' }).click();
    await this.page.waitForTimeout(100);
  }

  async goToHirePanel(): Promise<void> {
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'More' }).click();
    await this.page.waitForTimeout(100);
    await this.page.getByText('Hire Minions').click();
  }

  async goToDepartmentPanel(): Promise<void> {
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'More' }).click();
    await this.page.waitForTimeout(100);
    await this.page.getByText('Departments').click();
  }
}
