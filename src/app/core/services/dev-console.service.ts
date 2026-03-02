/* istanbul ignore file -- dev-only console, not production code */
import { Injectable, inject, isDevMode } from '@angular/core';
import { GameStateService } from './game-state.service';
import { GameTimerService } from './game-timer.service';
import { SaveService } from './save.service';
import { SaveData, SAVE_VERSION } from '../models/save-data.model';
import { TaskCategory } from '../models/task.model';
import {
  Minion, MinionAppearance, MINION_NAMES, MINION_COLORS, MINION_ACCESSORIES,
  SPECIALTY_CATEGORIES,
} from '../models/minion.model';
import { deptXpForLevel } from '../models/department.model';
import { createInitialProgress, QuarterProgress } from '../models/quarter.model';
import { selectReviewer, getReviewModifiers } from '../models/reviewer.model';
import { VoucherId, ALL_VOUCHER_IDS, createEmptyVoucherLevels } from '../models/voucher.model';
import { ALL_CARD_IDS } from '../models/card.model';
import { ALL_JOKER_IDS, JokerId } from '../models/joker.model';
import { DEFAULT_RULE } from '../models/rule.model';

const ALL_CATEGORIES: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];

@Injectable({ providedIn: 'root' })
export class DevConsoleService {
  private readonly gameState = inject(GameStateService);
  private readonly gameTimer = inject(GameTimerService);
  private readonly saveService = inject(SaveService);

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
        // Unlock departments for all specialties
        const unlocked = new Set<TaskCategory>(minions.map(m => m.specialty));
        self.gameState['_unlockedDepartments'].set(unlocked);
        console.log(`👾 Set ${count} minions (specialties: ${[...unlocked].join(', ')})`);
      },
      year(y: number, q: 1 | 2 | 3 | 4 = 1) {
        const progress: QuarterProgress = {
          year: y,
          quarter: q,
          grossGoldEarned: 0,
          tasksCompleted: 0,
          isComplete: false,
          missedQuarters: 0,
          quarterResults: [],
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
        // Trigger the quarter budget check on next minion click tick
        console.log(`✅ Quarter Y${progress.year}Q${progress.quarter} force-completed. Refresh the page or wait for tick.`);
      },
      levelDept(cat: TaskCategory, level: number) {
        if (!ALL_CATEGORIES.includes(cat)) {
          console.error(`Invalid category. Use: ${ALL_CATEGORIES.join(', ')}`);
          return;
        }
        const depts = { ...self.gameState.departments() };
        depts[cat] = { ...depts[cat], level, xp: deptXpForLevel(level) };
        self.gameState['_departments'].set(depts);
        console.log(`🏛️ ${cat} set to level ${level}`);
      },
      unlockAllDepts() {
        self.gameState['_unlockedDepartments'].set(new Set(ALL_CATEGORIES));
        console.log('🔓 All departments unlocked');
      },
      addCards(...ids: string[]) {
        for (const id of ids) self.gameState.addCard(id);
        console.log(`🃏 Added ${ids.length} cards: ${ids.join(', ')}`);
      },
      allCards() {
        for (const id of ALL_CARD_IDS) self.gameState.addCard(id);
        console.log(`🃏 Added all ${ALL_CARD_IDS.length} cards`);
      },
      addJokers(...ids: string[]) {
        for (const id of ids) self.gameState.addJoker(id);
        console.log(`🃏 Added ${ids.length} jokers: ${ids.join(', ')}`);
      },
      allJokers() {
        for (const id of ALL_JOKER_IDS) self.gameState.addJoker(id);
        console.log(`🃏 Added all ${ALL_JOKER_IDS.length} jokers`);
      },
      equipJoker(id: JokerId) {
        self.gameState.equipJoker(id);
        console.log(`🃏 Equipped joker: ${id}`);
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

      // ─── Inspection ─────────────────────────
      state() {
        const gs = self.gameState;
        const qp = gs.quarterProgress();
        console.table({
          'Year/Quarter': `Y${qp.year}Q${qp.quarter}`,
          'Gold': gs.gold(),
          'Quarter Gold': qp.grossGoldEarned,
          'Tasks Done': qp.tasksCompleted,
          'Villain Level': gs.villainLevel(),
          'Minions': gs.minions().length,
          'Click Power': gs.clickPower(),
          'Board Slots': gs.boardCapacity(),
          'Active Slots': gs.activeSlots(),
          'In Review': gs.currentReviewer() ? gs.currentReviewer()!.name : 'No',
          'Run Over': gs.isRunOver(),
          'Owned Cards': gs.ownedCards().size,
          'Owned Jokers': gs.ownedJokers().size,
          'Equipped Jokers': gs.equippedJokers().join(', ') || 'none',
        });
        console.log('Departments:', gs.departments());
        console.log('Vouchers:', gs.ownedVouchers());
        console.log('Rules:', gs.rules());
      },
      help() {
        console.log(`
🎮 Dev Console Commands
═══════════════════════════════════════

PRESETS (load complete game states):
  dev.preset.freshStart()       Y1Q1, 0 gold, 0 minions
  dev.preset.earlyGame()        Y1Q2, 200g, 2 minions, schemes unlocked
  dev.preset.midGame()          Y2Q1, 1500g, 4 minions, 3 depts, some cards/jokers
  dev.preset.lateGame()         Y3Q3, 5000g, 6 minions, all depts, full cards/jokers
  dev.preset.bossReview(year?)  Y{n}Q4 with reviewer active (default Y1)
  dev.preset.runOver()          Failed boss review state

MANIPULATION:
  dev.gold(amount)              Set gold to amount
  dev.addGold(amount)           Add gold
  dev.minions(count)            Set minion count (random specialties)
  dev.year(y, q?)               Jump to year Y, quarter Q (default 1)
  dev.completeQuarter()         Force-complete current quarter
  dev.levelDept(cat, level)     Set department level (schemes/heists/research/mayhem)
  dev.unlockAllDepts()          Unlock all 4 departments
  dev.addCards(...ids)          Add specific cards to collection
  dev.allCards()                Add ALL logic cards
  dev.addJokers(...ids)         Add specific jokers to collection
  dev.allJokers()               Add ALL jokers
  dev.equipJoker(id)            Equip a joker
  dev.voucher(id, level)        Set voucher level
  dev.allVouchers(level?)       Set all vouchers to level (default max=3)

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
        schemes: { category: 'schemes', xp: 0, level: 1 },
        heists: { category: 'heists', xp: 0, level: 1 },
        research: { category: 'research', xp: 0, level: 1 },
        mayhem: { category: 'mayhem', xp: 0, level: 1 },
      },
      activeMissions: [],
      missionBoard: [],
      usedNameIndices: [],
      lastBoardRefresh: 0,
      departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
      playerQueue: [],
      quarterProgress: createInitialProgress(),
      unlockedDepartments: [],
      currentReviewer: null,
      activeModifiers: [],
      isRunOver: false,
      ownedVouchers: {},
      ownedCards: [],
      ownedJokers: [],
      equippedJokers: [],
      rules: [DEFAULT_RULE],
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
    save.unlockedDepartments = ['schemes'];
    save.quarterProgress = {
      year: 1, quarter: 2,
      grossGoldEarned: 0, tasksCompleted: 0,
      isComplete: false, missedQuarters: 0,
      quarterResults: [{ year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 }],
    };
    save.departments.schemes = { category: 'schemes', xp: 25, level: 2 };
    return save;
  }

  private buildMidGame(): SaveData {
    const save = this.baseSave();
    save.gold = 1500;
    save.completedCount = 120;
    save.totalGoldEarned = 3000;
    save.minions = this.generateMinions(4, ['schemes', 'heists', 'research', 'schemes']);
    save.unlockedDepartments = ['schemes', 'heists', 'research'];
    save.quarterProgress = {
      year: 2, quarter: 1,
      grossGoldEarned: 0, tasksCompleted: 0,
      isComplete: false, missedQuarters: 0,
      quarterResults: [
        { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
        { year: 1, quarter: 2, passed: true, goldEarned: 400, target: 300, tasksCompleted: 40 },
        { year: 1, quarter: 3, passed: true, goldEarned: 1000, target: 900, tasksCompleted: 60 },
        { year: 1, quarter: 4, passed: true, goldEarned: 250, target: 200, tasksCompleted: 30 },
      ],
    };
    save.departments = {
      schemes: { category: 'schemes', xp: 100, level: 3 },
      heists: { category: 'heists', xp: 60, level: 3 },
      research: { category: 'research', xp: 25, level: 2 },
      mayhem: { category: 'mayhem', xp: 0, level: 1 },
    };
    save.ownedVouchers = { 'iron-fingers': 1, 'board-expansion': 1 };
    save.ownedCards = ['when-idle', 'when-task-appears', 'specialty-match', 'assign-to-work', 'assign-highest-tier'];
    save.ownedJokers = ['gold-rush', 'deep-pockets', 'iron-fist'];
    save.equippedJokers = ['gold-rush'];
    return save;
  }

  private buildLateGame(): SaveData {
    const save = this.baseSave();
    save.gold = 5000;
    save.completedCount = 400;
    save.totalGoldEarned = 15000;
    save.minions = this.generateMinions(6, ['schemes', 'heists', 'research', 'mayhem', 'schemes', 'heists']);
    save.unlockedDepartments = [...ALL_CATEGORIES];
    save.quarterProgress = {
      year: 3, quarter: 3,
      grossGoldEarned: 0, tasksCompleted: 0,
      isComplete: false, missedQuarters: 0,
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
      schemes: { category: 'schemes', xp: 400, level: 5 },
      heists: { category: 'heists', xp: 300, level: 5 },
      research: { category: 'research', xp: 200, level: 4 },
      mayhem: { category: 'mayhem', xp: 100, level: 3 },
    };
    save.ownedVouchers = {
      'iron-fingers': 2, 'board-expansion': 2, 'operations-desk': 1,
      'rapid-intel': 1, 'hire-discount': 1, 'dept-funding': 1, 'rule-mastery': 1,
    };
    save.ownedCards = [...ALL_CARD_IDS];
    save.ownedJokers = [...ALL_JOKER_IDS];
    save.equippedJokers = ['gold-rush', 'speed-demon', 'lucky-break'];
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
    save.unlockedDepartments = deptCats;
    for (const cat of deptCats) {
      save.departments[cat] = { category: cat, xp: year * 50, level: 1 + year };
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
      year, quarter: 4,
      grossGoldEarned: 0, tasksCompleted: 0,
      isComplete: false, missedQuarters: 0,
      quarterResults: results,
    };
    save.currentReviewer = reviewer;
    save.activeModifiers = modifiers;

    if (year >= 2) {
      save.ownedVouchers = { 'iron-fingers': 1, 'board-expansion': 1 };
      save.ownedCards = ['when-idle', 'specialty-match', 'assign-to-work'];
      save.ownedJokers = ['gold-rush', 'iron-fist'];
      save.equippedJokers = ['gold-rush'];
    }

    return save;
  }

  private buildRunOver(): SaveData {
    const save = this.buildBossReview(1);
    save.isRunOver = true;
    return save;
  }

  // ─── Helpers ──────────────────────────────

  private generateMinions(count: number, specialties?: TaskCategory[]): Minion[] {
    const minions: Minion[] = [];
    const usedNames = new Set<number>();

    for (let i = 0; i < count; i++) {
      let nameIdx: number;
      do {
        nameIdx = Math.floor(Math.random() * MINION_NAMES.length);
      } while (usedNames.has(nameIdx));
      usedNames.add(nameIdx);

      const specialty = specialties?.[i] ?? SPECIALTY_CATEGORIES[i % SPECIALTY_CATEGORIES.length];
      const color = MINION_COLORS[i % MINION_COLORS.length];
      const accessory = MINION_ACCESSORIES[i % MINION_ACCESSORIES.length];
      const randStat = () => Math.round((0.85 + Math.random() * 0.3) * 100) / 100;

      minions.push({
        id: crypto.randomUUID(),
        name: MINION_NAMES[nameIdx],
        appearance: { color, accessory } as MinionAppearance,
        status: 'idle',
        assignedTaskId: null,
        stats: { speed: randStat(), efficiency: randStat() },
        specialty,
        assignedDepartment: specialty,
        xp: 0,
        level: 1,
      });
    }

    return minions;
  }
}
