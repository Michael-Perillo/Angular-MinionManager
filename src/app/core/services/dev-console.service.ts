/* istanbul ignore file -- dev-only console, not production code */
import { Injectable, inject, isDevMode } from '@angular/core';
import { GameStateService } from './game-state.service';
import { GameTimerService } from './game-timer.service';
import { SaveService } from './save.service';
import { MetaService } from './meta.service';
import { SaveData, SAVE_VERSION } from '../models/save-data.model';
import { TaskCategory } from '../models/task.model';
import {
  Minion, ALL_ARCHETYPE_IDS, MINION_ARCHETYPES, rollHireOptions,
} from '../models/minion.model';
import { createInitialProgress, QuarterProgress } from '../models/quarter.model';
import { selectReviewer, getReviewModifiers } from '../models/reviewer.model';
import { VoucherId, ALL_VOUCHER_IDS, createEmptyVoucherLevels } from '../models/voucher.model';
import { buildRunSummary, DiscoveredItems } from '../models/meta.model';

const ALL_CATEGORIES: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];

@Injectable({ providedIn: 'root' })
export class DevConsoleService {
  private readonly gameState = inject(GameStateService);
  private readonly gameTimer = inject(GameTimerService);
  private readonly saveService = inject(SaveService);
  private readonly meta = inject(MetaService);

  install(): void {
    if (!isDevMode()) return;

    const self = this;

    (window as any).dev = {
      // ─── Presets ─────────────────────────────
      preset: {
        freshStart() { self.loadPreset(self.buildFreshStart()); },
        earlyGame() { self.loadPreset(self.buildEarlyGame()); },
        midGame() { self.loadPreset(self.buildMidGame()); },
        lateGame() { self.loadPreset(self.buildLateGame()); },
        bossReview(year = 1) { self.loadPreset(self.buildBossReview(year)); },
        runOver() { self.loadPreset(self.buildRunOver()); },
      },

      // ─── Manipulation ───────────────────────
      gold(amount: number) {
        self.gameState['_gold'].set(amount);
        console.log(`🪙 Gold set to ${amount}`);
      },
      addGold(amount: number) {
        self.gameState.addGold(amount);
        console.log(`🪙 Added ${amount} gold (now ${self.gameState.gold()})`);
      },
      minions(count: number) {
        const minions = self.generateMinions(count);
        self.gameState['_minions'].set(minions);
        console.log(`👾 Set ${count} minions`);
      },
      year(y: number, q: 1 | 2 | 3 | 4 = 1) {
        const progress: QuarterProgress = {
          ...createInitialProgress(),
          year: y,
          quarter: q,
        };
        self.gameState['_quarterProgress'].set(progress);
        console.log(`📅 Jumped to Y${y}Q${q}`);
      },
      completeQuarter() {
        const progress = self.gameState.quarterProgress();
        const target = self.gameState.currentQuarterTarget();
        self.gameState['_quarterProgress'].set({
          ...progress,
          tasksCompleted: target.taskBudget,
          grossGoldEarned: target.goldTarget + 1,
        });
        console.log(`✅ Quarter Y${progress.year}Q${progress.quarter} force-completed.`);
      },
      levelDept(cat: TaskCategory, level: number) {
        if (!ALL_CATEGORIES.includes(cat)) {
          console.error(`Invalid category. Use: ${ALL_CATEGORIES.join(', ')}`);
          return;
        }
        const depts = { ...self.gameState.departments() };
        depts[cat] = { ...depts[cat], level };
        self.gameState['_departments'].set(depts);
        console.log(`🏛️ ${cat} set to level ${level}`);
      },
      unlockAllDepts() {
        const vouchers = { ...self.gameState['_ownedVouchers']() };
        for (const cat of ALL_CATEGORIES) {
          if (cat !== 'schemes') {
            vouchers[`unlock-${cat}` as VoucherId] = 1;
          }
        }
        self.gameState['_ownedVouchers'].set(vouchers);
        console.log('🔓 All departments unlocked via vouchers');
      },
      voucher(id: VoucherId, level: number) {
        if (!ALL_VOUCHER_IDS.includes(id)) {
          console.error(`Invalid voucher. Use: ${ALL_VOUCHER_IDS.join(', ')}`);
          return;
        }
        const vouchers = { ...self.gameState.ownedVouchers() };
        vouchers[id] = level;
        self.gameState['_ownedVouchers'].set(vouchers);
        console.log(`🎟️ ${id} set to level ${level}`);
      },
      allVouchers(level = 3) {
        const vouchers = { ...createEmptyVoucherLevels() };
        for (const id of ALL_VOUCHER_IDS) vouchers[id] = level;
        self.gameState['_ownedVouchers'].set(vouchers);
        console.log(`🎟️ All vouchers set to level ${level}`);
      },
      openShop() {
        self.gameState.openShop();
        console.log('🛒 Shop opened');
      },
      closeShop() {
        self.gameState.closeShop();
        console.log('🛒 Shop closed');
      },
      listArchetypes() {
        console.table(Object.values(MINION_ARCHETYPES).map(a => ({
          id: a.id, name: a.name, icon: a.icon, rarity: a.rarity,
          passive: a.description, scope: a.passive.scope,
        })));
      },
      setArchetype(minionId: string, archetypeId: string) {
        if (!MINION_ARCHETYPES[archetypeId]) {
          console.error(`Invalid archetype. Use dev.listArchetypes() to see options.`);
          return;
        }
        self.gameState['_minions'].update((list: Minion[]) =>
          list.map(m => m.id === minionId ? { ...m, archetypeId } : m)
        );
        console.log(`Set minion ${minionId} to archetype ${archetypeId}`);
      },

      // ─── Meta-progression ────────────────────
      seedCompendium() {
        const discovered: DiscoveredItems = {
          archetypes: ALL_ARCHETYPE_IDS.slice(0, 8),
          tasks: [
            'Forge Hall Passes', 'Rig the Lottery', 'Spread Rumors', 'Steal Lunch Money',
            'Blackmail the Mayor', 'Infiltrate the Council', 'Frame a Rival',
            'Pilfer the Tip Jar', 'Snatch a Purse', 'Rob a Lemonade Stand',
            'Museum Night Raid', 'Jewel Store Heist',
            'Explode a Mailbox', 'Graffiti Spree',
            'Lab Rat Experiment', 'Reverse-Engineer Gadget',
          ],
          reviewers: ['thornton', 'grimes', 'hale'],
          modifiers: ['no-hiring', 'board-frozen', 'sinister-only', 'gold-drain', 'gold-halved'],
        };
        const summary = buildRunSummary(
          [
            { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
            { year: 1, quarter: 2, passed: true, goldEarned: 500, target: 300, tasksCompleted: 40 },
            { year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 900, tasksCompleted: 60 },
            { year: 1, quarter: 4, passed: false, goldEarned: 100, target: 200, tasksCompleted: 20 },
          ],
          2200, 150,
        );
        self.meta.recordRun(summary, discovered);
        console.log('📚 Compendium seeded with sample discoveries (8 archetypes, 16 tasks, 3 reviewers, 5 modifiers)');
        console.log(`🏴 Infamy: ${self.meta.totalInfamy()}`);
      },

      // ─── Inspection ─────────────────────────
      state() {
        const gs = self.gameState;
        const qp = gs.quarterProgress();
        console.table({
          'Year/Quarter': `Y${qp.year}Q${qp.quarter}`,
          'Gold': gs.gold(),
          'Quarter Gold': qp.grossGoldEarned,
          'Tasks Done': qp.tasksCompleted,
          'Completed': gs.completedCount(),
          'Minions': gs.minions().length,
          'Click Power': gs.clickPower(),
          'Board Slots': gs.backlogCapacity(),
          'Queue Capacity': JSON.stringify(gs.deptQueueCapacity()),
          'In Review': gs.currentReviewer() ? gs.currentReviewer()!.name : 'No',
          'Run Over': gs.isRunOver(),
        });
        console.log('Departments:', gs.departments());
        console.log('Vouchers:', gs.ownedVouchers());
        console.log('Minions:', gs.minions().map(m => ({
          id: m.id.slice(0, 8),
          archetype: MINION_ARCHETYPES[m.archetypeId]?.name ?? m.archetypeId,
          role: m.role,
          dept: m.assignedDepartment,
          status: m.status,
        })));
      },
      help() {
        console.log(`
🎮 Dev Console Commands
═══════════════════════════════════════

PRESETS (load complete game states):
  dev.preset.freshStart()       Y1Q1, 0 gold, 0 minions
  dev.preset.earlyGame()        Y1Q2, 200g, 2 minions
  dev.preset.midGame()          Y2Q1, 1500g, 4 minions, 3 depts
  dev.preset.lateGame()         Y3Q3, 5000g, 6 minions, all depts
  dev.preset.bossReview(year?)  Y{n}Q4 with reviewer active (default Y1)
  dev.preset.runOver()          Failed boss review state

MANIPULATION:
  dev.gold(amount)              Set gold to amount
  dev.addGold(amount)           Add gold
  dev.minions(count)            Set minion count (random archetypes)
  dev.year(y, q?)               Jump to year Y, quarter Q (default 1)
  dev.completeQuarter()         Force-complete current quarter
  dev.levelDept(cat, level)     Set department level
  dev.unlockAllDepts()          Unlock all 4 departments
  dev.voucher(id, level)        Set voucher level
  dev.allVouchers(level?)       Set all vouchers to level (default max=3)
  dev.listArchetypes()          List all minion archetypes
  dev.setArchetype(mid, aid)    Set a minion's archetype

META-PROGRESSION:
  dev.seedCompendium()          Seed compendium with sample discoveries + infamy

INSPECTION:
  dev.state()                   Log current game state summary
  dev.help()                    Print this help
`);
      },
    };

    console.log('🎮 Dev console ready. Type dev.help() for commands.');
  }

  // ─── Preset builders ─────────────────────

  private loadPreset(data: SaveData): void {
    this.gameTimer.stop();
    this.gameState.loadSnapshot(data);
    this.gameTimer.restartTimers();
    this.saveService.save();
    console.log(`✅ Preset loaded: Y${data.quarterProgress!.year}Q${data.quarterProgress!.quarter}`);
  }

  private baseSave(): SaveData {
    return {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      gold: 0,
      completedCount: 0,
      totalGoldEarned: 0,
      minions: [],
      departments: {
        schemes: { category: 'schemes', level: 1, workerSlots: 1, hasManager: false },
        heists: { category: 'heists', level: 1, workerSlots: 0, hasManager: false },
        research: { category: 'research', level: 1, workerSlots: 0, hasManager: false },
        mayhem: { category: 'mayhem', level: 1, workerSlots: 0, hasManager: false },
      },
      activeMissions: [],
      missionBoard: [],
      usedNameIndices: [],
      departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
      quarterProgress: createInitialProgress(),
      currentReviewer: null,
      activeModifiers: [],
      isRunOver: false,
      ownedVouchers: {},
      hireOptions: rollHireOptions(3),
    };
  }

  private buildFreshStart(): SaveData {
    return this.baseSave();
  }

  private buildEarlyGame(): SaveData {
    const save = this.baseSave();
    save.gold = 200;
    save.completedCount = 15;
    save.totalGoldEarned = 300;
    save.minions = this.generateMinions(2, ['schemes', 'schemes']);
    save.quarterProgress = {
      ...createInitialProgress(),
      year: 1, quarter: 2,
      quarterResults: [{ year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 }],
    };
    save.departments.schemes = { category: 'schemes', level: 2, workerSlots: 2, hasManager: false };
    return save;
  }

  private buildMidGame(): SaveData {
    const save = this.baseSave();
    save.gold = 1500;
    save.completedCount = 120;
    save.totalGoldEarned = 3000;
    save.minions = this.generateMinions(4, ['schemes', 'heists', 'research', 'schemes']);
    save.ownedVouchers = { ...save.ownedVouchers, 'unlock-heists': 1, 'unlock-research': 1 } as any;
    save.quarterProgress = {
      ...createInitialProgress(),
      year: 2, quarter: 1,
      quarterResults: [
        { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
        { year: 1, quarter: 2, passed: true, goldEarned: 400, target: 300, tasksCompleted: 40 },
        { year: 1, quarter: 3, passed: true, goldEarned: 1000, target: 900, tasksCompleted: 60 },
        { year: 1, quarter: 4, passed: true, goldEarned: 250, target: 200, tasksCompleted: 30 },
      ],
    };
    save.departments = {
      schemes: { category: 'schemes', level: 3, workerSlots: 2, hasManager: true },
      heists: { category: 'heists', level: 3, workerSlots: 2, hasManager: true },
      research: { category: 'research', level: 2, workerSlots: 1, hasManager: false },
      mayhem: { category: 'mayhem', level: 1, workerSlots: 1, hasManager: false },
    };
    save.ownedVouchers = { 'unlock-heists': 1, 'unlock-research': 1, 'iron-fingers': 1, 'board-expansion': 1 };
    return save;
  }

  private buildLateGame(): SaveData {
    const save = this.baseSave();
    save.gold = 5000;
    save.completedCount = 400;
    save.totalGoldEarned = 15000;
    save.minions = this.generateMinions(6, ['schemes', 'heists', 'research', 'mayhem', 'schemes', 'heists']);
    save.quarterProgress = {
      ...createInitialProgress(),
      year: 3, quarter: 3,
      quarterResults: [
        { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
        { year: 1, quarter: 2, passed: true, goldEarned: 400, target: 300, tasksCompleted: 40 },
        { year: 1, quarter: 3, passed: true, goldEarned: 1000, target: 900, tasksCompleted: 60 },
        { year: 1, quarter: 4, passed: true, goldEarned: 250, target: 200, tasksCompleted: 30 },
        { year: 2, quarter: 1, passed: true, goldEarned: 500, target: 400, tasksCompleted: 40 },
        { year: 2, quarter: 2, passed: true, goldEarned: 1200, target: 1000, tasksCompleted: 50 },
        { year: 2, quarter: 3, passed: true, goldEarned: 3000, target: 2500, tasksCompleted: 70 },
        { year: 2, quarter: 4, passed: true, goldEarned: 500, target: 350, tasksCompleted: 30 },
      ],
    };
    save.departments = {
      schemes: { category: 'schemes', level: 5, workerSlots: 3, hasManager: true },
      heists: { category: 'heists', level: 5, workerSlots: 3, hasManager: true },
      research: { category: 'research', level: 4, workerSlots: 2, hasManager: true },
      mayhem: { category: 'mayhem', level: 3, workerSlots: 2, hasManager: false },
    };
    save.ownedVouchers = {
      'unlock-heists': 1, 'unlock-research': 1, 'unlock-mayhem': 1,
      'iron-fingers': 2, 'board-expansion': 2, 'operations-desk': 1,
      'hire-discount': 1, 'dismissal-expert': 1,
    };
    return save;
  }

  private buildBossReview(year: number): SaveData {
    const save = this.baseSave();
    save.gold = year * 500;
    save.completedCount = year * 100;
    save.totalGoldEarned = year * 2000;

    const minionCount = Math.min(2 + year, 6);
    save.minions = this.generateMinions(minionCount);

    const deptCount = Math.min(1 + year, 4);
    const deptCats = ALL_CATEGORIES.slice(0, deptCount);
    const voucherUnlocks: Record<string, number> = {};
    for (const cat of deptCats) {
      if (cat !== 'schemes') {
        voucherUnlocks[`unlock-${cat}`] = 1;
      }
    }
    save.ownedVouchers = { ...save.ownedVouchers, ...voucherUnlocks } as any;
    for (const cat of deptCats) {
      save.departments[cat] = { category: cat, level: 1 + year, workerSlots: Math.min(1 + year, 4), hasManager: year >= 2 };
    }

    // Build quarter history
    const results: QuarterProgress['quarterResults'] = [];
    for (let y = 1; y <= year; y++) {
      for (let q = 1; q <= (y < year ? 4 : 3); q++) {
        results.push({
          year: y, quarter: q as 1 | 2 | 3 | 4,
          passed: true, goldEarned: 500 * y, target: 300 * y, tasksCompleted: 30 + y * 10,
        });
      }
    }

    // Now at Q4 with reviewer
    const reviewer = selectReviewer(year);
    const modifiers = getReviewModifiers(reviewer, 0);

    save.quarterProgress = {
      ...createInitialProgress(),
      year, quarter: 4,
      quarterResults: results,
    };
    save.currentReviewer = reviewer;
    save.activeModifiers = modifiers;

    if (year >= 2) {
      save.ownedVouchers = { ...save.ownedVouchers, 'iron-fingers': 1, 'board-expansion': 1 } as any;
    }

    return save;
  }

  private buildRunOver(): SaveData {
    const save = this.buildBossReview(1);
    save.isRunOver = true;
    return save;
  }

  // ─── Helpers ──────────────────────────────

  private generateMinions(count: number, depts?: TaskCategory[]): Minion[] {
    const minions: Minion[] = [];

    for (let i = 0; i < count; i++) {
      const archetypeId = ALL_ARCHETYPE_IDS[i % ALL_ARCHETYPE_IDS.length];
      const dept = depts?.[i] ?? ALL_CATEGORIES[i % ALL_CATEGORIES.length];

      minions.push({
        id: crypto.randomUUID(),
        archetypeId,
        role: 'worker',
        status: 'idle',
        assignedTaskId: null,
        assignedDepartment: dept,
      });
    }

    return minions;
  }
}
