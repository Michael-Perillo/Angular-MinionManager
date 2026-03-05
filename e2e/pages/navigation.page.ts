import { Page } from '@playwright/test';

/** Must match SAVE_VERSION in src/app/core/models/save-data.model.ts */
const SAVE_VERSION = 21;

export interface NavigationPage {
  resetGame(): Promise<void>;
  seedState(overrides: Record<string, unknown>): Promise<void>;
  goToMissions(): Promise<void>;
  goToWorkbench(): Promise<void>;
  goToDepartments(): Promise<void>;
  goToHirePanel(): Promise<void>;
  goToDepartmentPanel(): Promise<void>;
  /** Open the shop modal (for testing hire/upgrades between quarters) */
  openShop(): Promise<void>;
  readonly isMobile: boolean;
}

/** Minimal valid SaveData that loadSnapshot accepts. */
function baseSaveData(): Record<string, unknown> {
  const defaultDept = (category: string, workerSlots = 0) => ({ category, level: 1, workerSlots, hasManager: false });
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    gold: 0,
    completedCount: 0,
    totalGoldEarned: 0,
    minions: [],
    departments: {
      schemes: defaultDept('schemes', 1),
      heists: defaultDept('heists'),
      research: defaultDept('research'),
      mayhem: defaultDept('mayhem'),
    },
    activeMissions: [],
    missionBoard: [],
    usedNameIndices: [],
    lastBoardRefresh: 0,
    departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
    ownedVouchers: {},
    hireOptions: ['penny-pincher', 'tip-jar', 'iron-grip'],
    schemeDeck: [],
    dismissalsRemaining: 5,
    researchCompleted: 0,
    activeBreakthroughs: 0,
    deptTierUnlocks: {
      schemes: ['petty'],
      heists: ['petty'],
      research: ['petty'],
      mayhem: ['petty'],
    },
    completedTaskTemplates: [],
    encounteredReviewers: [],
    encounteredModifiers: [],
  };
}

export class DesktopNavigation implements NavigationPage {
  readonly isMobile = false;

  constructor(private page: Page) {}

  async resetGame(): Promise<void> {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
    // Main menu appears — click New Run to start fresh game
    await this.page.locator('[data-testid="menu-new-run"]').waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.locator('[data-testid="menu-new-run"]').click();
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
    // Main menu appears with Continue button — click it
    await this.page.locator('[data-testid="menu-continue"]').waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.locator('[data-testid="menu-continue"]').click();
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
    // Hiring is now shop-only — open the shop
    await this.openShop();
  }

  async goToDepartmentPanel(): Promise<void> {
    // Department info is always visible in column headers — no navigation needed
  }

  async openShop(): Promise<void> {
    await this.page.locator('app-header').waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.evaluate(() => (window as any).dev.openShop());
    await this.page.waitForTimeout(200);
  }
}

export class MobileNavigation implements NavigationPage {
  readonly isMobile = true;

  constructor(private page: Page) {}

  async resetGame(): Promise<void> {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
    // Main menu appears — click New Run to start fresh game
    await this.page.locator('[data-testid="menu-new-run"]').waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.locator('[data-testid="menu-new-run"]').click();
    await this.page.locator('app-header').waitFor({ state: 'visible', timeout: 15_000 });
  }

  async seedState(overrides: Record<string, unknown>): Promise<void> {
    const save = { ...baseSaveData(), ...overrides, version: SAVE_VERSION, savedAt: Date.now() };
    const json = JSON.stringify(save);
    await this.page.addInitScript((data) => {
      localStorage.setItem('minion-manager-save', data);
    }, json);
    await this.page.goto('/');
    // Main menu appears with Continue button — click it
    await this.page.locator('[data-testid="menu-continue"]').waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.locator('[data-testid="menu-continue"]').click();
    await this.page.locator('app-header').waitFor({ state: 'visible', timeout: 10_000 });
  }

  async goToMissions(): Promise<void> {
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Missions' }).click();
    await this.page.waitForTimeout(100);
  }

  async goToWorkbench(): Promise<void> {
    // Work tab shows department columns (click buttons are in dept columns now)
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Work' }).click();
    await this.page.waitForTimeout(100);
  }

  async goToDepartments(): Promise<void> {
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'Work' }).click();
    await this.page.waitForTimeout(100);
  }

  async goToHirePanel(): Promise<void> {
    // Hiring is now shop-only — open the shop
    await this.openShop();
  }

  async goToDepartmentPanel(): Promise<void> {
    await this.page.locator('app-mobile-bottom-nav button').filter({ hasText: 'More' }).click();
    await this.page.waitForTimeout(100);
    await this.page.getByText('Departments').click();
  }

  async openShop(): Promise<void> {
    await this.page.locator('app-header').waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.evaluate(() => (window as any).dev.openShop());
    await this.page.waitForTimeout(200);
  }
}
