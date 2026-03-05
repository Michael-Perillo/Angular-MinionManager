import { Injectable, computed, signal, inject } from '@angular/core';
import {
  Task, TaskStatus, TaskTier, TaskCategory, TIER_CONFIG, TaskTemplate,
  QueueTarget, SCOUTING_TIER_WEIGHTS, TIER_UNLOCK_COSTS,
  SchemeCard, SCHEME_TIER_CONFIG, rollOperationCount,
  ComboState, createDefaultComboState, advanceComboState,
} from '../models/task.model';
import {
  Minion, MinionRole, MinionArchetype, MINION_ARCHETYPES,
  rollHireOptions, getActivePassives, aggregatePassiveFlat, aggregatePassiveMult,
  getMinionDisplay,
} from '../models/minion.model';
import { GameNotification } from '../models/game-state.model';
import { TASK_POOL } from '../models/task-pool';
import {
  Department,
  DEPARTMENT_LABELS, getDeptMult, DeptTierUnlocks, createDefaultTierUnlocks, getUnlockedTiers,
  rollHeistGold, getBreakthroughThreshold, getMayhemClicks, getMayhemGold,
  MAYHEM_COMBO_THRESHOLD, MAYHEM_COMBO_TIMEOUT_MS, RESEARCH_DECK_GROWTH_INTERVAL,
  getDeptLevelCost, getWorkerSlotCost, MANAGER_SLOT_COST,
  getDeptQueueCapacity,
} from '../models/department.model';
import {
  QuarterProgress, createInitialProgress, getQuarterTarget,
  isQuarterBudgetExhausted, evaluateQuarter, BASE_DISMISSALS,
} from '../models/quarter.model';
import {
  Reviewer, Modifier, selectReviewer, getReviewModifiers, getReviewerGoldTarget,
} from '../models/reviewer.model';
import {
  VoucherId, VOUCHERS, ALL_VOUCHER_IDS, createEmptyVoucherLevels,
  getVoucherCost, getVoucherEffect,
} from '../models/voucher.model';
import { SaveData, SAVE_VERSION } from '../models/save-data.model';
import { GameEventService } from './game-event.service';

const ALL_CATEGORIES: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly events = inject(GameEventService);

  /** Delay (ms) before removing completed click tasks — allows progress bar to fill. Set to 0 in tests. */
  clickCompleteDelay = 350;

  // ─── State signals ─────────────────────────
  private readonly _gold = signal(0);
  private readonly _minions = signal<Minion[]>([]);
  private readonly _backlog = signal<Task[]>([]);   // Backlog: scheme cards to choose from
  private readonly _activeMissions = signal<Task[]>([]);  // Legacy flat list (kept for backwards compat)
  private readonly _completedCount = signal(0);
  private readonly _totalGoldEarned = signal(0);
  private readonly _notifications = signal<GameNotification[]>([]);
  private readonly _departments = signal<Record<TaskCategory, Department>>({
    schemes: { category: 'schemes', level: 1, workerSlots: 1, hasManager: false },
    heists: { category: 'heists', level: 1, workerSlots: 0, hasManager: false },
    research: { category: 'research', level: 1, workerSlots: 0, hasManager: false },
    mayhem: { category: 'mayhem', level: 1, workerSlots: 0, hasManager: false },
  });

  private readonly _lastSaved = signal(0);

  // ─── Kanban queue signals ──────────────────
  private readonly _departmentQueues = signal<Record<TaskCategory, Task[]>>({
    schemes: [],
    heists: [],
    research: [],
    mayhem: [],
  });
  private readonly _quarterProgress = signal<QuarterProgress>(createInitialProgress());

  // ─── Reviewer signals ───────────────────────
  private readonly _currentReviewer = signal<Reviewer | null>(null);
  private readonly _activeModifiers = signal<Modifier[]>([]);
  private readonly _isRunOver = signal(false);
  private readonly _showReviewerIntro = signal(false);

  // ─── Modifier constraint signals ────────────
  private readonly _hiringDisabled = signal(false);
  private readonly _upgradesDisabled = signal(false);
  private readonly _backlogFrozen = signal(false);
  private readonly _backlogLimited = signal(false);
  private readonly _goldDrainPerTask = signal(0);
  private readonly _goldRewardMultiplier = signal(1);
  private readonly _lockedCategory = signal<TaskCategory | null>(null);

  // ─── Voucher & shop signals ───────────────
  private readonly _ownedVouchers = signal<Record<VoucherId, number>>(createEmptyVoucherLevels());
  private readonly _showShop = signal(false);

  // ─── Dept tier unlock signals ────────────
  private readonly _deptTierUnlocks = signal<DeptTierUnlocks>(createDefaultTierUnlocks());

  // ─── Scheme deck signals ───────────────
  private readonly _schemeDeck = signal<SchemeCard[]>([]);
  private readonly _mayhemComboCount = signal(0);
  private readonly _lastMayhemCompletionTime = signal(0);

  // ─── Hire draft signals ─────────────────────
  private readonly _hireOptions = signal<string[]>([]);

  // ─── Combo state signal ───────────────────
  private readonly _comboState = signal<ComboState>(createDefaultComboState());
  readonly comboState = this._comboState.asReadonly();

  // ─── Per-run tracking for compendium ──────
  private readonly _completedTaskTemplates = signal<string[]>([]);
  private readonly _encounteredReviewers = signal<string[]>([]);
  private readonly _encounteredModifiers = signal<string[]>([]);
  readonly completedTaskTemplates = this._completedTaskTemplates.asReadonly();
  readonly encounteredReviewers = this._encounteredReviewers.asReadonly();
  readonly encounteredModifiers = this._encounteredModifiers.asReadonly();

  // ─── Public read-only signals ──────────────
  readonly gold = this._gold.asReadonly();
  readonly minions = this._minions.asReadonly();
  readonly backlog = this._backlog.asReadonly();
  /** @deprecated Alias for backlog — use backlog() instead */
  readonly missionBoard = this._backlog.asReadonly();
  readonly completedCount = this._completedCount.asReadonly();
  readonly totalGoldEarned = this._totalGoldEarned.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly departments = this._departments.asReadonly();
  readonly lastSaved = this._lastSaved.asReadonly();
  readonly departmentQueues = this._departmentQueues.asReadonly();
  readonly quarterProgress = this._quarterProgress.asReadonly();
  readonly currentReviewer = this._currentReviewer.asReadonly();
  readonly activeModifiers = this._activeModifiers.asReadonly();
  readonly isRunOver = this._isRunOver.asReadonly();
  readonly showReviewerIntro = this._showReviewerIntro.asReadonly();
  readonly isInReview = computed(() => this._currentReviewer() !== null);
  readonly reviewGoldTarget = computed(() => {
    const reviewer = this._currentReviewer();
    if (!reviewer) return 0;
    return getReviewerGoldTarget(reviewer, this._quarterProgress().year);
  });
  readonly hiringDisabled = this._hiringDisabled.asReadonly();
  readonly upgradesDisabled = this._upgradesDisabled.asReadonly();
  readonly backlogFrozen = this._backlogFrozen.asReadonly();
  readonly backlogLimited = this._backlogLimited.asReadonly();
  readonly lockedCategory = this._lockedCategory.asReadonly();
  readonly ownedVouchers = this._ownedVouchers.asReadonly();
  readonly showShop = this._showShop.asReadonly();
  readonly deptTierUnlocks = this._deptTierUnlocks.asReadonly();
  readonly schemeDeck = this._schemeDeck.asReadonly();
  readonly schemeDeckTierCounts = computed(() => {
    const deck = this._schemeDeck();
    const counts: Record<TaskTier, number> = { petty: 0, sinister: 0, diabolical: 0, legendary: 0 };
    for (const card of deck) counts[card.tier]++;
    return counts;
  });
  readonly mayhemComboCount = this._mayhemComboCount.asReadonly();
  readonly dismissalsRemaining = computed(() => this._quarterProgress().dismissalsRemaining);
  readonly researchCompleted = computed(() => this._quarterProgress().researchCompleted);
  readonly activeBreakthroughs = computed(() => this._quarterProgress().activeBreakthroughs);
  readonly hireOptions = this._hireOptions.asReadonly();

  /** Per-department effective mult for UI display (click-completed, no worker passive) */
  readonly deptEffectiveMults = computed(() => {
    const result = {} as Record<TaskCategory, number>;
    for (const cat of ALL_CATEGORIES) {
      const passives = getActivePassives(this._minions(), cat);
      const mgrMult = aggregatePassiveFlat(passives, 'gold-mult');
      const dm = getDeptMult(this._departments()[cat].level);
      const bt = this._quarterProgress().activeBreakthroughs;
      result[cat] = Math.max(1, 1 + dm + mgrMult + bt + this.getBossMultPenalty());
    }
    return result;
  });

  readonly bossPenalty = computed(() => this.getBossMultPenalty());

  // ─── Voucher effect helpers (private computed) ──
  private readonly voucherClickPower = computed(() => getVoucherEffect('iron-fingers', this._ownedVouchers()['iron-fingers']));
  private readonly voucherBoardBonus = computed(() => getVoucherEffect('board-expansion', this._ownedVouchers()['board-expansion']));
  private readonly voucherSlotBonus = computed(() => getVoucherEffect('operations-desk', this._ownedVouchers()['operations-desk']));
  private readonly voucherHireDiscount = computed(() => getVoucherEffect('hire-discount', this._ownedVouchers()['hire-discount']));
  private readonly voucherDismissalBonus = computed(() => getVoucherEffect('dismissal-expert', this._ownedVouchers()['dismissal-expert']));

  readonly currentQuarterTarget = computed(() => {
    const p = this._quarterProgress();
    return getQuarterTarget(p.year, p.quarter);
  });
  readonly quarterGold = computed(() => this._quarterProgress().grossGoldEarned);

  // activeMissions merges all department queues into a single flat list
  readonly activeMissions = computed(() => {
    const deptQueues = this._departmentQueues();
    const all: Task[] = [];
    for (const cat of ALL_CATEGORIES) {
      all.push(...deptQueues[cat]);
    }
    return all;
  });

  // Backwards-compat: taskQueue = activeMissions
  readonly taskQueue = this.activeMissions;

  // ─── Computed signals ──────────────────────
  readonly idleMinions = computed(() =>
    this._minions().filter(m => m.status === 'idle')
  );

  readonly workingMinions = computed(() =>
    this._minions().filter(m => m.status === 'working')
  );

  readonly nextMinionCost = computed(() =>
    Math.floor(75 * Math.pow(1.5, this._minions().length) * (1 - this.voucherHireDiscount()))
  );

  /** Reroll cost = 50% of hire cost */
  readonly rerollCost = computed(() => Math.floor(this.nextMinionCost() * 0.5));

  readonly canHireMinion = computed(() =>
    this._gold() >= this.nextMinionCost()
  );

  readonly queuedTasks = computed(() =>
    this.activeMissions().filter(t => t.status === 'queued')
  );

  readonly inProgressTasks = computed(() =>
    this.activeMissions().filter(t => t.status === 'in-progress')
  );

  /** Backlog capacity: base 8 + min(4, minionCount) + voucher bonus. Reduced to 1 by board-frozen, 2 by board-limited. */
  readonly backlogCapacity = computed(() => {
    if (this._backlogFrozen()) return 1;
    if (this._backlogLimited()) return 2;
    const base = 8;
    const minionBonus = Math.min(4, this._minions().length);
    return base + minionBonus + this.voucherBoardBonus();
  });

  /** Per-department queue capacity: base 1 + workerSlots + operationsDesk bonus */
  readonly deptQueueCapacity = computed(() => {
    const depts = this._departments();
    const opsBonus = this.voucherSlotBonus();
    const result = {} as Record<TaskCategory, number>;
    for (const cat of ALL_CATEGORIES) {
      result[cat] = getDeptQueueCapacity(depts[cat].workerSlots, opsBonus);
    }
    return result;
  });

  /** Click power: base 1 + voucher bonus + manager click-power passives (from all dept managers) */
  readonly clickPower = computed(() => {
    let power = 1 + this.voucherClickPower();
    // Add click-power from all managers across all departments
    for (const cat of ALL_CATEGORIES) {
      const passives = getActivePassives(this._minions(), cat);
      power += aggregatePassiveFlat(passives, 'click-power');
    }
    return power;
  });

  /** Minions grouped by assigned department (excludes unassigned pool minions) */
  readonly minionsByDepartment = computed(() => {
    const result: Record<TaskCategory, Minion[]> = {
      schemes: [], heists: [], research: [], mayhem: [],
    };
    for (const m of this._minions()) {
      if (m.assignedDepartment !== null) {
        result[m.assignedDepartment].push(m);
      }
    }
    return result;
  });

  /** Managers by department */
  readonly managersByDepartment = computed(() => {
    const result: Record<TaskCategory, Minion | null> = {
      schemes: null, heists: null, research: null, mayhem: null,
    };
    for (const m of this._minions()) {
      if (m.assignedDepartment !== null && m.role === 'manager') {
        result[m.assignedDepartment] = m;
      }
    }
    return result;
  });

  /** Minions not assigned to any department */
  readonly unassignedMinions = computed(() =>
    this._minions().filter(m => m.assignedDepartment === null)
  );

  // ─── Progressive department unlocking (derived from vouchers) ────
  /** Departments the player has unlocked. Schemes is always unlocked. */
  readonly unlockedDepartments = computed(() => {
    const v = this._ownedVouchers();
    const set = new Set<TaskCategory>(['schemes']); // Schemes always unlocked
    if (v['unlock-heists'] > 0) set.add('heists');
    if (v['unlock-research'] > 0) set.add('research');
    if (v['unlock-mayhem'] > 0) set.add('mayhem');
    return set;
  });

  /** Ordered list of unlocked department categories */
  readonly unlockedDepartmentList = computed(() =>
    ALL_CATEGORIES.filter(cat => this.unlockedDepartments().has(cat))
  );

  /** Department queues filtered to only unlocked departments */
  readonly unlockedDepartmentQueues = computed(() => {
    const queues = this._departmentQueues();
    const unlocked = this.unlockedDepartments();
    const result = {} as Record<TaskCategory, Task[]>;
    for (const cat of ALL_CATEGORIES) {
      result[cat] = unlocked.has(cat) ? queues[cat] : [];
    }
    return result;
  });

  /** Count of workers (non-manager) per department */
  readonly workerCountByDept = computed(() => {
    const result: Record<TaskCategory, number> = { schemes: 0, heists: 0, research: 0, mayhem: 0 };
    for (const m of this._minions()) {
      if (m.assignedDepartment !== null && m.role === 'worker') {
        result[m.assignedDepartment]++;
      }
    }
    return result;
  });

  // ─── Scouting signals ───────────────────────

  private readonly BACKLOG_LOW_THRESHOLD = 5;

  // ─── Constants ─────────────────────────────
  private readonly SPECIAL_OP_CHANCE = 0.15;
  private readonly SPECIAL_OP_DURATION = 30_000;
  private usedNameIndices = new Set<number>();

  // ─── Game lifecycle ────────────────────────
  initializeGame(): void {
    this._gold.set(0);
    this._minions.set([]);
    this._backlog.set([]);
    this._activeMissions.set([]);
    this._completedCount.set(0);
    this._totalGoldEarned.set(0);
    this._notifications.set([]);
    this._departments.set({
      schemes: { category: 'schemes', level: 1, workerSlots: 1, hasManager: false },
      heists: { category: 'heists', level: 1, workerSlots: 0, hasManager: false },
      research: { category: 'research', level: 1, workerSlots: 0, hasManager: false },
      mayhem: { category: 'mayhem', level: 1, workerSlots: 0, hasManager: false },
    });
    this._departmentQueues.set({
      schemes: [], heists: [], research: [], mayhem: [],
    });
    this._quarterProgress.set(createInitialProgress());
    this._currentReviewer.set(null);
    this._activeModifiers.set([]);
    this._isRunOver.set(false);
    this._showReviewerIntro.set(false);
    this._hiringDisabled.set(false);
    this._upgradesDisabled.set(false);
    this._backlogFrozen.set(false);
    this._backlogLimited.set(false);
    this._goldDrainPerTask.set(0);
    this._goldRewardMultiplier.set(1);
    this._lockedCategory.set(null);
    this._ownedVouchers.set(createEmptyVoucherLevels());
    this._showShop.set(false);
    this._deptTierUnlocks.set(createDefaultTierUnlocks());
    this._schemeDeck.set(this.generateQuarterlyDeck(25, 1));
    this._mayhemComboCount.set(0);
    this._lastMayhemCompletionTime.set(0);
    this._hireOptions.set(rollHireOptions(3));
    this._comboState.set(createDefaultComboState());
    this._completedTaskTemplates.set([]);
    this._encounteredReviewers.set([]);
    this._encounteredModifiers.set([]);
    this.usedNameIndices.clear();

    // Draw initial hand of scheme cards
    this.drawSchemeHand();
  }

  resetGame(): void {
    this.initializeGame();
  }

  // ─── Snapshot (persistence) ─────────────────
  getSnapshot(): SaveData {
    return {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      gold: this._gold(),
      completedCount: this._completedCount(),
      totalGoldEarned: this._totalGoldEarned(),
      minions: this._minions(),
      departments: this._departments(),
      activeMissions: [], // kept empty for v3+; all tasks live in department queues
      missionBoard: this._backlog(),
      usedNameIndices: [...this.usedNameIndices],
      departmentQueues: this._departmentQueues(),
      quarterProgress: this._quarterProgress(),
      currentReviewer: this._currentReviewer(),
      activeModifiers: this._activeModifiers(),
      isRunOver: this._isRunOver(),
      ownedVouchers: this._ownedVouchers(),
      deptTierUnlocks: Object.fromEntries(
        Object.entries(this._deptTierUnlocks()).map(([cat, set]) => [cat, [...set]])
      ) as Record<TaskCategory, string[]>,
      schemeDeck: this._schemeDeck(),
      hireOptions: this._hireOptions(),
      comboState: this._comboState(),
      completedTaskTemplates: this._completedTaskTemplates(),
      encounteredReviewers: this._encounteredReviewers(),
      encounteredModifiers: this._encounteredModifiers(),
    };
  }

  loadSnapshot(data: SaveData): void {
    this._gold.set(data.gold);
    this._completedCount.set(data.completedCount);
    this._totalGoldEarned.set(data.totalGoldEarned);
    this._minions.set(data.minions.map(m => ({
      id: m.id,
      archetypeId: m.archetypeId,
      role: m.role ?? 'worker',
      status: m.status,
      assignedTaskId: m.assignedTaskId,
      assignedDepartment: m.assignedDepartment ?? null,
    })));
    this._departments.set(data.departments);
    this._backlog.set(data.missionBoard);
    this._notifications.set([]);

    // Load kanban queues (v3+)
    if (data.departmentQueues) {
      this._departmentQueues.set(data.departmentQueues);
    } else {
      this._departmentQueues.set({ schemes: [], heists: [], research: [], mayhem: [] });
    }

    // Load quarterly progress (v7+)
    if (data.quarterProgress) {
      const defaults = createInitialProgress();
      this._quarterProgress.set({ ...defaults, ...data.quarterProgress });
    } else {
      this._quarterProgress.set(createInitialProgress());
    }

    // Load reviewer state (v8+)
    this._currentReviewer.set(data.currentReviewer ?? null);
    this._activeModifiers.set(data.activeModifiers ?? []);
    this._isRunOver.set(data.isRunOver ?? false);
    this._showReviewerIntro.set(false);

    // Load vouchers (v10+)
    if (data.ownedVouchers) {
      const levels = createEmptyVoucherLevels();
      for (const id of ALL_VOUCHER_IDS) {
        if (id in data.ownedVouchers) {
          levels[id] = (data.ownedVouchers as Record<string, number>)[id] ?? 0;
        }
      }
      this._ownedVouchers.set(levels);
    } else {
      this._ownedVouchers.set(createEmptyVoucherLevels());
    }
    this._showShop.set(false);

    // Re-apply modifier constraints if in review
    this.revertModifiers();
    if (data.activeModifiers && data.activeModifiers.length > 0) {
      this.applyModifiers(data.activeModifiers);
    }

    // Legacy: migrate activeMissions into department queues
    if (data.activeMissions && data.activeMissions.length > 0) {
      const deptQueues = { ...this._departmentQueues() };
      for (const cat of ALL_CATEGORIES) {
        deptQueues[cat] = [...deptQueues[cat]];
      }
      for (const task of data.activeMissions) {
        const target = task.assignedQueue ?? task.template.category;
        const cat = ((target as string) === 'player' ? 'schemes' : target) as TaskCategory;
        deptQueues[cat] = [...deptQueues[cat], { ...task, assignedQueue: cat }];
      }
      this._departmentQueues.set(deptQueues);
    }

    // Legacy flat list cleared
    this._activeMissions.set([]);

    // Load dept tier unlocks (v14+)
    if (data.deptTierUnlocks) {
      const unlocks = createDefaultTierUnlocks();
      for (const cat of ALL_CATEGORIES) {
        const tiers = (data.deptTierUnlocks as Record<string, string[]>)[cat];
        if (tiers) {
          unlocks[cat] = new Set(tiers as TaskTier[]);
        }
      }
      this._deptTierUnlocks.set(unlocks);
    } else {
      this._deptTierUnlocks.set(createDefaultTierUnlocks());
    }

    // Load scheme deck (v15+)
    if (data.schemeDeck && data.schemeDeck.length > 0) {
      this._schemeDeck.set(data.schemeDeck);
    } else {
      // Generate starter deck for saves that don't have one
      this._schemeDeck.set(this.generateQuarterlyDeck(25, 1));
    }

    // If board is empty after loading, draw a hand from the deck
    if (this._backlog().length === 0 && this._schemeDeck().length > 0) {
      this.drawSchemeHand();
    }

    this._mayhemComboCount.set(0);
    this._lastMayhemCompletionTime.set(0);

    // Load hire options (v17+)
    this._hireOptions.set(data.hireOptions && data.hireOptions.length > 0 ? data.hireOptions : rollHireOptions(3));

    // Load combo state (v18+)
    this._comboState.set(data.comboState ?? createDefaultComboState());

    // Load per-run tracking (v21+)
    this._completedTaskTemplates.set(data.completedTaskTemplates ?? []);
    this._encounteredReviewers.set(data.encounteredReviewers ?? []);
    this._encounteredModifiers.set(data.encounteredModifiers ?? []);

    this.usedNameIndices = new Set(data.usedNameIndices);
  }

  addGold(amount: number): void {
    this._gold.update(g => g + amount);
  }

  // ─── Backlog actions ─────────────────
  /** Accept a mission from the backlog into its category queue */
  acceptMission(missionId: string): void {
    const mission = this._backlog().find(m => m.id === missionId);
    if (!mission) return;

    const target = mission.template.category;
    const currentCount = this._departmentQueues()[target].length;
    if (currentCount >= this.deptQueueCapacity()[target]) return;

    this._backlog.update(board => board.filter(m => m.id !== missionId));
    this._departmentQueues.update(queues => ({
      ...queues,
      [target]: [...queues[target], { ...mission, status: 'queued' as TaskStatus, assignedQueue: target }],
    }));
    this.events.emit({ type: 'TaskQueued', taskId: missionId, department: target });
  }

  /** Route a mission from the backlog to a specific department queue */
  routeMission(missionId: string, target: QueueTarget): void {
    const mission = this._backlog().find(m => m.id === missionId);
    if (!mission) return;

    const currentCount = this._departmentQueues()[target].length;
    if (currentCount >= this.deptQueueCapacity()[target]) return;

    // Prevent routing to a locked department (unlocking or modifier-locked)
    if (!this.unlockedDepartments().has(target)) return;
    if (this._lockedCategory() === target) return;

    this._backlog.update(board => board.filter(m => m.id !== missionId));

    const routed: Task = { ...mission, status: 'queued' as TaskStatus, assignedQueue: target };

    this._departmentQueues.update(queues => ({
      ...queues,
      [target]: [...queues[target], routed],
    }));
    this.events.emit({ type: 'TaskQueued', taskId: missionId, department: target });

    // Draw a replacement scheme card to keep the board full
    if (mission.template.category === 'schemes' && !mission.isOperation) {
      this.drawSchemeCard();
    }
  }

  /** Reorder tasks within a queue (drag to reorder priority) */
  reorderQueue(queue: QueueTarget, taskIds: string[]): void {
    const cat = queue as TaskCategory;
    this._departmentQueues.update(queues => {
      const current = queues[cat];
      const byId = new Map(current.map(t => [t.id, t]));
      return {
        ...queues,
        [cat]: taskIds.map(id => byId.get(id)!).filter(Boolean),
      };
    });
  }

  /** Reassign a minion to a different department (or null for unassigned pool) */
  reassignMinion(minionId: string, newDept: TaskCategory | null): void {
    const minion = this._minions().find(m => m.id === minionId);
    if (!minion) return;
    if (minion.assignedDepartment === newDept) return;

    // If working, can't reassign
    if (minion.status === 'working') return;

    // Enforce worker slot limit on target department
    if (newDept !== null) {
      const deptData = this._departments()[newDept];
      const currentWorkers = this.workerCountByDept()[newDept];
      // If already in this dept, don't double-count
      const alreadyHere = minion.assignedDepartment === newDept;
      if (!alreadyHere && currentWorkers >= deptData.workerSlots) return;
    }

    const fromDepartment = minion.assignedDepartment;
    this._minions.update(list =>
      list.map(m =>
        m.id === minionId
          ? { ...m, assignedDepartment: newDept, role: 'worker' as const }
          : m
      )
    );

    if (fromDepartment !== null && newDept !== null) {
      this.events.emit({ type: 'MinionReassigned', minionId, fromDepartment, toDepartment: newDept });
    }
  }

  /** Assign a minion from the unassigned pool to a department with a specific role */
  assignMinionToDepartment(minionId: string, dept: TaskCategory, role: MinionRole): void {
    const minion = this._minions().find(m => m.id === minionId);
    if (!minion) return;
    if (minion.status === 'working') return;

    const deptData = this._departments()[dept];

    // Enforce manager slot purchased
    if (role === 'manager') {
      if (!deptData.hasManager) return; // No manager slot purchased
      const existing = this._minions().find(m =>
        m.assignedDepartment === dept && m.role === 'manager' && m.id !== minionId
      );
      if (existing) return; // Already has a manager
    }

    // Enforce worker slot limit
    if (role === 'worker') {
      const currentWorkers = this.workerCountByDept()[dept];
      // If this minion is already a worker in this dept, don't double-count
      const alreadyHere = minion.assignedDepartment === dept && minion.role === 'worker';
      if (!alreadyHere && currentWorkers >= deptData.workerSlots) return;
    }

    this._minions.update(list =>
      list.map(m =>
        m.id === minionId
          ? { ...m, assignedDepartment: dept, role }
          : m
      )
    );

    this.events.emit({ type: 'MinionAssigned', minionId, department: dept });
  }

  /** Unassign a minion back to the unassigned pool */
  unassignMinion(minionId: string): void {
    const minion = this._minions().find(m => m.id === minionId);
    if (!minion) return;
    if (minion.status === 'working') return;

    this._minions.update(list =>
      list.map(m =>
        m.id === minionId
          ? { ...m, assignedDepartment: null, role: 'worker' as const }
          : m
      )
    );
  }

  // ─── Manual work (clicking) ────────────────
  clickTask(taskId: string): void {
    const power = this.clickPower();

    // Check department queues
    for (const cat of ALL_CATEGORIES) {
      const queue = this._departmentQueues()[cat];
      const deptTask = queue.find(t => t.id === taskId);
      if (deptTask) {
        let completedTask: Task | null = null;
        this._departmentQueues.update(queues => ({
          ...queues,
          [cat]: queues[cat].map(task => {
            if (task.id !== taskId) return task;
            if (task.status === 'complete') return task;
            if (task.assignedMinionId) return task; // can't click minion-assigned tasks

            const newClicks = task.clicksRemaining - power;
            if (newClicks <= 0) {
              completedTask = task;
              this.awardGold(task.goldReward, task.template.name, task.tier, task.template.category, 'click', null, task.isSpecialOp, task.isOperation, task.comboMult);
              return { ...task, status: 'complete' as TaskStatus, clicksRemaining: 0 };
            }
            return {
              ...task,
              status: 'in-progress' as TaskStatus,
              clicksRemaining: newClicks,
            };
          }),
        }));
        // If this was a scheme task, generate operations
        if (completedTask) {
          this.handleSchemeCompletion(completedTask);
        }
        if (this.clickCompleteDelay > 0) {
          setTimeout(() => this.cleanDeptQueue(cat), this.clickCompleteDelay);
        } else {
          this.cleanDeptQueue(cat);
        }
        return;
      }
    }
  }

  /** Handle scheme completion: if the task was a scheme, generate operations and draw replacement */
  private handleSchemeCompletion(task: Task): void {
    if (task.template.category !== 'schemes' || task.isOperation) return;

    // Reconstruct scheme card from stored task metadata
    if (task.schemeTargetDept && task.schemeOperationCount && task.schemeOperationTiers) {
      // Advance combo state before generating operations
      const comboResult = advanceComboState(this._comboState(), task.schemeTargetDept, task.tier);
      this._comboState.set(comboResult.newState);

      if (comboResult.totalComboMult > 0) {
        const parts: string[] = [];
        if (comboResult.deptFocusBonus > 0) parts.push(`Focus +${comboResult.deptFocusBonus}`);
        if (comboResult.tierEscalationBonus > 0) parts.push(`Ladder +${comboResult.tierEscalationBonus}`);
        this.addNotification(`Combo! ${parts.join(' | ')} → +${comboResult.totalComboMult} mult on ops`, 'gold');
      }

      const schemeCard: SchemeCard = {
        id: task.id,
        templateId: task.template.name,
        tier: task.tier,
        targetDept: task.schemeTargetDept,
        operationCount: task.schemeOperationCount,
        operationTiers: task.schemeOperationTiers,
        clicksRequired: task.clicksRequired,
        directGold: task.goldReward,
        isSpecialOp: task.isSpecialOp,
      };
      this.generateOperations(schemeCard, comboResult.totalComboMult);
    }
  }

  // ─── Hire minion (draft pick) ─────────────
  hireMinion(archetypeId: string): void {
    if (this._hiringDisabled()) return;
    if (!this._showShop()) return; // Can only hire in the shop
    const cost = this.nextMinionCost();
    if (this._gold() < cost) return;

    // Validate the archetype is in current options
    if (!this._hireOptions().includes(archetypeId)) return;

    this._gold.update(g => g - cost);
    const minion = this.createMinion(archetypeId);
    this._minions.update(list => [...list, minion]);

    const arch = getMinionDisplay(minion);
    this.addNotification(
      `${arch.icon} ${arch.name} joined! — assign to a department`,
      'minion'
    );
    this.events.emit({ type: 'MinionHired', minionId: minion.id, department: minion.assignedDepartment });

    // Roll new hire options
    this._hireOptions.set(rollHireOptions(3));
  }

  /** Reroll the hire draft options for gold */
  rerollHireOptions(): void {
    const cost = this.rerollCost();
    if (this._gold() < cost) return;
    this._gold.update(g => g - cost);
    this._hireOptions.set(rollHireOptions(3));
  }

  // ─── Shop purchase methods ──────────────────

  /** Purchase a department level upgrade. Returns true if successful. */
  purchaseDeptLevel(category: TaskCategory): boolean {
    const dept = this._departments()[category];
    const cost = getDeptLevelCost(dept.level);
    if (cost <= 0) return false; // Already max level
    if (this._gold() < cost) return false;
    if (!this._showShop()) return false;

    this._gold.update(g => g - cost);
    this._departments.update(depts => ({
      ...depts,
      [category]: { ...depts[category], level: depts[category].level + 1 },
    }));

    const newLevel = dept.level + 1;
    this.addNotification(
      `${DEPARTMENT_LABELS[category].icon} ${DEPARTMENT_LABELS[category].label} upgraded to Lv.${newLevel}! (+${getDeptMult(newLevel)} mult)`,
      'task');
    this.events.emit({ type: 'LevelUp', target: 'department', targetId: category, newLevel });
    return true;
  }

  /** Purchase a worker slot for a department. Returns true if successful. */
  purchaseWorkerSlot(category: TaskCategory): boolean {
    const dept = this._departments()[category];
    const cost = getWorkerSlotCost(dept.workerSlots);
    if (cost <= 0) return false; // Already max slots
    if (this._gold() < cost) return false;
    if (!this._showShop()) return false;

    this._gold.update(g => g - cost);
    this._departments.update(depts => ({
      ...depts,
      [category]: { ...depts[category], workerSlots: depts[category].workerSlots + 1 },
    }));

    this.addNotification(
      `${DEPARTMENT_LABELS[category].icon} ${DEPARTMENT_LABELS[category].label} gained a worker slot!`,
      'task');
    return true;
  }

  /** Purchase a manager slot for a department. Returns true if successful. */
  purchaseManagerSlot(category: TaskCategory): boolean {
    const dept = this._departments()[category];
    if (dept.hasManager) return false; // Already has manager slot
    if (this._gold() < MANAGER_SLOT_COST) return false;
    if (!this._showShop()) return false;

    this._gold.update(g => g - MANAGER_SLOT_COST);
    this._departments.update(depts => ({
      ...depts,
      [category]: { ...depts[category], hasManager: true },
    }));

    this.addNotification(
      `${DEPARTMENT_LABELS[category].icon} ${DEPARTMENT_LABELS[category].label} gained a manager slot!`,
      'task');
    return true;
  }

  /** @deprecated All tick logic migrated to GameTimerService. Retained for test compatibility. */
  tickTime(): void {
    this.autoAssignMinions();
  }

  /**
   * Process one tick of minion auto-clicks.
   * Each assigned worker applies 1 click per tick (base), multiplied by passive speed-mult.
   * Called once per second by GameTimerService.
   */
  processMinionClicks(): void {
    const completedTasks: { taskId: string; dept: TaskCategory; minionId: string }[] = [];

    this._departmentQueues.update(queues => {
      const updated = { ...queues };
      for (const cat of ALL_CATEGORIES) {
        updated[cat] = queues[cat].map(task => {
          if (task.status !== 'in-progress' || !task.assignedMinionId) return task;

          const minion = this._minions().find(m => m.id === task.assignedMinionId);
          if (!minion) return task;

          // Base speed = 1, multiplied by passive speed-mult from manager + self
          const passives = getActivePassives(this._minions(), cat, minion.id);
          const speedMult = aggregatePassiveMult(passives, 'speed-mult');
          const clicks = Math.max(1, Math.floor(1 * speedMult));
          const newRemaining = task.clicksRemaining - clicks;

          if (newRemaining <= 0) {
            completedTasks.push({ taskId: task.id, dept: cat, minionId: minion.id });
            return { ...task, clicksRemaining: 0, status: 'complete' as TaskStatus };
          }
          return { ...task, clicksRemaining: newRemaining };
        });
      }
      return updated;
    });

    // Process completions outside the signal update
    for (const { taskId, dept, minionId } of completedTasks) {
      const task = this._departmentQueues()[dept].find(t => t.id === taskId);
      if (task) {
        this.awardGold(task.goldReward, task.template.name, task.tier, task.template.category, 'minion', minionId, task.isSpecialOp, task.isOperation, task.comboMult);
        this.freeMinionFromTask(minionId, task.tier, task.template.category);
        this.handleSchemeCompletion(task);
      }
      // Remove completed task immediately (minion progress shown via component-local tracking)
      this.cleanDeptQueue(dept);
    }
    this.checkBacklogLow();
  }

  // ─── Tick step methods ────────────────

  /** Step 3: Remove a specific expired special op from the board */
  removeExpiredSpecialOp(missionId: string): void {
    this._backlog.update(board => board.filter(m => m.id !== missionId));
  }

  /** Clean old notifications */
  cleanNotifications(now: number): void {
    this._notifications.update(list =>
      list.filter(n => now - n.timestamp < 4000)
    );
  }


  /** Mark the game as just saved (updates the lastSaved timestamp) */
  markSaved(): void {
    this._lastSaved.set(Date.now());
  }

  dismissNotification(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  // ─── Board management ─────────────────────
  createBoardMission(forcedCategory?: TaskCategory): Task {
    const template = this.pickRandomTemplate(forcedCategory);
    const config = TIER_CONFIG[template.tier];

    // Base gold = tier base (no VL scaling)
    const baseGold = config.gold;

    // Clicks fixed per tier, reduced by passive click-reduction from all managers
    const passiveClickReduction = this.getPassiveClickReduction();
    const scaledClicks = Math.max(3, config.clicks - passiveClickReduction);

    // Special Op: 15% chance, adds +1 to mult (no timer/expiry)
    const isSpecialOp = Math.random() < this.SPECIAL_OP_CHANCE;

    const mission: Task = {
      id: crypto.randomUUID(),
      template,
      status: 'queued',
      tier: template.tier,
      goldReward: baseGold,
      clicksRequired: scaledClicks,
      clicksRemaining: scaledClicks,
      assignedMinionId: null,
      queuedAt: Date.now(),
      isSpecialOp,
      assignedQueue: null,
    };

    if (isSpecialOp) {
      this.events.emit({ type: 'SpecialOpSpawned', missionId: mission.id, tier: mission.tier });
    }

    return mission;
  }

  private pickRandomTemplate(forcedCategory?: TaskCategory): TaskTemplate {
    // Pick category: forced, or random from unlocked
    let category: TaskCategory;
    if (forcedCategory) {
      category = forcedCategory;
    } else {
      const unlocked = this.unlockedDepartmentList();
      const categories = unlocked.length > 0 ? unlocked : ALL_CATEGORIES;
      category = categories[Math.floor(Math.random() * categories.length)];
    }

    // Get unlocked tiers for this department
    const deptUnlocks = this._deptTierUnlocks()[category];
    const unlockedTiers = getUnlockedTiers(deptUnlocks);

    // Weight-based tier selection within unlocked tiers
    const weights = unlockedTiers.map(t => SCOUTING_TIER_WEIGHTS[t]);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    let tier: TaskTier = unlockedTiers[0];
    for (let i = 0; i < unlockedTiers.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        tier = unlockedTiers[i];
        break;
      }
    }

    // Get candidates from the pool matching category + tier
    let candidates = TASK_POOL.filter(t => t.category === category && t.tier === tier);
    // Fallback: if no candidates, try any template of this tier, then fall to any in category
    if (candidates.length === 0) {
      candidates = TASK_POOL.filter(t => t.tier === tier);
    }
    if (candidates.length === 0) {
      candidates = TASK_POOL.filter(t => t.category === category);
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /** Default fallback auto-assign: workers get tasks. Used when automation disabled. */
  defaultAutoAssign(): void {
    const minionsByDept = this.minionsByDepartment();
    const deptQueues = this._departmentQueues();

    for (const cat of ALL_CATEGORIES) {
      const deptMinions = minionsByDept[cat];

      // Workers: assign to queued tasks (managers skip — they don't work tasks)
      const idleWorkers = deptMinions.filter(m => m.status === 'idle' && m.role === 'worker');
      const queued = deptQueues[cat].filter(t => t.status === 'queued');
      const assignedMinionIds = new Set<string>();

      for (const task of queued) {
        if (assignedMinionIds.size >= idleWorkers.length) break;
        const available = idleWorkers.filter(m => !assignedMinionIds.has(m.id));
        if (available.length === 0) break;

        const chosen = available[0];
        assignedMinionIds.add(chosen.id);
        this.assignMinionToTask(chosen.id, task.id, cat);
      }
    }
  }

  /** Backward compat alias */
  autoAssignMinions(): void {
    this.defaultAutoAssign();
  }

  /** Check if backlog is low and emit event */
  private checkBacklogLow(): void {
    const count = this._backlog().length;
    if (count < this.BACKLOG_LOW_THRESHOLD) {
      this.events.emit({ type: 'BacklogLow', count });
    }
  }

  // ─── Role management ──────────────────────

  /** Change a minion's role (must be idle). Enforces 1 manager per department. */
  assignMinionRole(minionId: string, role: MinionRole): void {
    const minion = this._minions().find(m => m.id === minionId);
    if (!minion) return;
    if (minion.status === 'working') return;
    if (minion.role === role) return;

    // Enforce manager slot purchased + 1 manager per department
    if (role === 'manager' && minion.assignedDepartment) {
      const deptData = this._departments()[minion.assignedDepartment];
      if (!deptData.hasManager) return; // No manager slot purchased
      const existing = this._minions().find(m =>
        m.assignedDepartment === minion.assignedDepartment && m.role === 'manager' && m.id !== minionId
      );
      if (existing) return; // Already has a manager
    }

    this._minions.update(list =>
      list.map(m => m.id === minionId ? { ...m, role } : m)
    );
  }

  private assignMinionToTask(minionId: string, taskId: string, dept: TaskCategory): void {
    this._departmentQueues.update(queues => ({
      ...queues,
      [dept]: queues[dept].map(t =>
        t.id === taskId
          ? { ...t, status: 'in-progress' as TaskStatus, assignedMinionId: minionId }
          : t
      ),
    }));
    this._minions.update(list =>
      list.map(m =>
        m.id === minionId
          ? { ...m, status: 'working' as const, assignedTaskId: taskId }
          : m
      )
    );

    this.events.emit({ type: 'TaskAssigned', taskId, minionId, department: dept, durationMs: 0 });
  }

  private freeMinionFromTask(minionId: string, taskTier: TaskTier, taskCategory: TaskCategory): void {
    // No more minion XP/level/specialty — just free the minion
    this._minions.update(list =>
      list.map(m => {
        if (m.id !== minionId) return m;
        return {
          ...m,
          status: 'idle' as const,
          assignedTaskId: null,
        };
      })
    );

    this.events.emit({
      type: 'MinionIdle', minionId, department: taskCategory,
    });
  }

  /**
   * Award gold using the integer additive Base × Mult formula.
   * Base = tier base gold (from TIER_CONFIG or pre-rolled for heists)
   * Mult = 1 + deptMult + specialOp + passiveMult + bossModifier + breakthroughs
   * All additive bonuses are integers — trivial mental math.
   */
  private awardGold(
    baseGold: number,
    taskName: string,
    taskTier?: TaskTier,
    taskCategory?: TaskCategory,
    source: 'minion' | 'click' = 'minion',
    minionId?: string | null,
    isSpecialOp?: boolean,
    isOperation?: boolean,
    comboMult?: number,
  ): void {
    let mult = 1;

    // Dept level mult: +1 per level above 1
    if (taskCategory) {
      mult += getDeptMult(this._departments()[taskCategory].level);
    }

    // Passive gold-mult from manager + completing worker
    if (taskCategory) {
      const passives = getActivePassives(this._minions(), taskCategory, minionId ?? undefined);
      mult += aggregatePassiveFlat(passives, 'gold-mult');
    }

    // Special Op: +1
    if (isSpecialOp) {
      mult += 1;
    }

    // Combo mult from scheme fishing (operations only)
    if (comboMult && comboMult > 0) {
      mult += comboMult;
    }

    // Active breakthroughs: +1 per breakthrough (research mechanic)
    // Plus breakthrough bonus passive from eureka-catalyst
    let breakthroughMult = this._quarterProgress().activeBreakthroughs;
    if (taskCategory) {
      const passives = getActivePassives(this._minions(), taskCategory, minionId ?? undefined);
      breakthroughMult += aggregatePassiveFlat(passives, 'breakthrough-bonus');
    }
    mult += breakthroughMult > 0 ? breakthroughMult : this._quarterProgress().activeBreakthroughs;

    // Mayhem combo: check and apply 2× gold if combo triggers
    let mayhemComboGold = false;
    if (isOperation && taskCategory) {
      mayhemComboGold = this.checkMayhemCombo(taskCategory, minionId);
    }

    // Boss modifier penalty (integer: -1 or -2)
    mult += this.getBossMultPenalty();

    // Ensure mult is at least 1
    mult = Math.max(1, mult);

    let finalAmount = baseGold * mult;
    if (mayhemComboGold) finalAmount *= 2;

    // Add passive flat gold from manager + completing worker
    if (taskCategory) {
      const passives = getActivePassives(this._minions(), taskCategory, minionId ?? undefined);
      finalAmount += aggregatePassiveFlat(passives, 'gold-flat');
    }

    finalAmount = Math.max(0, finalAmount - this._goldDrainPerTask());

    this._gold.update(g => g + finalAmount);
    this._totalGoldEarned.update(g => g + finalAmount);
    this._completedCount.update(c => c + 1);

    // Track completed task template for compendium
    if (!this._completedTaskTemplates().includes(taskName)) {
      this._completedTaskTemplates.update(t => [...t, taskName]);
    }

    const multLabel = mult > 1 ? ` (${baseGold}g ×${mult})` : '';
    this.addNotification(`+${finalAmount}g${multLabel} from "${taskName}"`, 'gold');

    // Track quarterly progress — operations don't cost budget
    if (isOperation) {
      this._quarterProgress.update(p => ({
        ...p,
        grossGoldEarned: p.grossGoldEarned + finalAmount,
      }));

      // Track research completions for breakthrough mechanic
      if (taskCategory === 'research') {
        this._quarterProgress.update(p => ({
          ...p,
          researchCompleted: p.researchCompleted + 1,
        }));
        this.checkBreakthrough(taskCategory);
      }
    } else {
      // Scheme/board task — costs budget
      this._quarterProgress.update(p => ({
        ...p,
        grossGoldEarned: p.grossGoldEarned + finalAmount,
        tasksCompleted: p.tasksCompleted + 1,
      }));
    }

    // Emit task completed event
    if (taskTier && taskCategory) {
      this.events.emit({
        type: 'TaskCompleted',
        taskName, tier: taskTier, category: taskCategory,
        goldEarned: finalAmount, minionId: null,
      });
    }

    // Check if the quarter's task budget is exhausted
    this.checkQuarterCompletion();
  }


  // ─── Queue cleanup ─────────────────────────
  private cleanDeptQueue(cat: TaskCategory): void {
    this._departmentQueues.update(queues => ({
      ...queues,
      [cat]: queues[cat].filter(t => t.status !== 'complete'),
    }));
  }


  private createMinion(archetypeId: string): Minion {
    return {
      id: crypto.randomUUID(),
      archetypeId,
      role: 'worker',
      status: 'idle',
      assignedTaskId: null,
      assignedDepartment: null,
    };
  }

  private addNotification(message: string, type: GameNotification['type']): void {
    const notification: GameNotification = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: Date.now(),
    };
    this._notifications.update(list => [...list, notification]);
  }

  // ─── Dept tier unlocking ──────────────────

  /** Unlock a tier in a department (costs gold) */
  unlockDeptTier(category: TaskCategory, tier: TaskTier): boolean {
    const unlocks = this._deptTierUnlocks();
    if (unlocks[category].has(tier)) return false; // already unlocked
    const cost = TIER_UNLOCK_COSTS[tier];
    if (cost === 0) return false; // petty is always free
    if (this._gold() < cost) return false;

    this._gold.update(g => g - cost);
    this._deptTierUnlocks.update(u => {
      const updated = { ...u };
      updated[category] = new Set(u[category]);
      updated[category].add(tier);
      return updated;
    });

    const label = DEPARTMENT_LABELS[category].label;
    this.addNotification(`Unlocked ${tier} tier in ${label}!`, 'task');
    return true;
  }

  // ─── Scheme deck system ──────────────────

  /** Generate a quarterly deck based on budget and Schemes dept level.
   *  Card count = budget + 5 (dismiss buffer). Tier distribution scales with level. */
  generateQuarterlyDeck(budget: number, schemesLevel: number): SchemeCard[] {
    const deck: SchemeCard[] = [];
    const executionDepts: TaskCategory[] = ['heists', 'research', 'mayhem'];
    const cardCount = budget + 5;

    // Tier distribution based on Schemes dept level
    let tierWeights: { tier: TaskTier; weight: number }[];
    if (schemesLevel >= 8) {
      tierWeights = [
        { tier: 'petty', weight: 10 },
        { tier: 'sinister', weight: 30 },
        { tier: 'diabolical', weight: 35 },
        { tier: 'legendary', weight: 25 },
      ];
    } else if (schemesLevel >= 5) {
      tierWeights = [
        { tier: 'petty', weight: 30 },
        { tier: 'sinister', weight: 40 },
        { tier: 'diabolical', weight: 20 },
        { tier: 'legendary', weight: 10 },
      ];
    } else if (schemesLevel >= 3) {
      tierWeights = [
        { tier: 'petty', weight: 60 },
        { tier: 'sinister', weight: 30 },
        { tier: 'diabolical', weight: 10 },
      ];
    } else {
      tierWeights = [
        { tier: 'petty', weight: 90 },
        { tier: 'sinister', weight: 10 },
      ];
    }

    const totalWeight = tierWeights.reduce((a, w) => a + w.weight, 0);

    for (let i = 0; i < cardCount; i++) {
      // Pick tier from weighted distribution
      let roll = Math.random() * totalWeight;
      let tier: TaskTier = 'petty';
      for (const tw of tierWeights) {
        roll -= tw.weight;
        if (roll <= 0) { tier = tw.tier; break; }
      }

      // Evenly distribute target depts
      const targetDept = executionDepts[i % executionDepts.length];
      deck.push(this.generateSchemeCard(tier, targetDept));
    }

    return this.shuffleDeck(deck);
  }

  /** Generate a single scheme card with pre-rolled operation data */
  generateSchemeCard(tier: TaskTier, targetDept: TaskCategory): SchemeCard {
    const config = SCHEME_TIER_CONFIG[tier];
    let opCount = rollOperationCount(tier);

    // Check for ops-coordinator passive bonus (30% chance extra op)
    // Only applies from managers in the schemes department
    const schemesPassives = getActivePassives(this._minions(), 'schemes');
    const opBonus = aggregatePassiveFlat(schemesPassives, 'op-count-bonus');
    if (opBonus > 0 && Math.random() < opBonus) {
      opCount += 1;
    }

    // Pre-roll operation tiers (same as scheme tier for now)
    const operationTiers: TaskTier[] = [];
    for (let i = 0; i < opCount; i++) {
      operationTiers.push(tier);
    }

    // Pick a random template name for flavor
    const templates = TASK_POOL.filter(t => t.tier === tier);
    const templateId = templates.length > 0
      ? templates[Math.floor(Math.random() * templates.length)].name
      : `${tier}-scheme`;

    const isSpecialOp = Math.random() < this.SPECIAL_OP_CHANCE;

    return {
      id: crypto.randomUUID(),
      templateId,
      tier,
      targetDept,
      operationCount: opCount,
      operationTiers,
      clicksRequired: config.clicks,
      directGold: config.directGold,
      isSpecialOp,
    };
  }

  /** Draw a card from the deck to the board. Returns false if deck is empty (dead draw). */
  drawSchemeCard(): boolean {
    const deck = this._schemeDeck();
    if (deck.length === 0) return false; // Dead draw — no reshuffle

    const [card, ...remaining] = this._schemeDeck();
    this._schemeDeck.set(remaining);

    // Convert scheme card to a Task for the mission board
    const task = this.schemeCardToTask(card);
    this._backlog.update(board => [...board, task]);
    return true;
  }

  /** Fill the board to capacity from the deck (replaces preseedBoard) */
  drawSchemeHand(): void {
    const capacity = Math.min(this.backlogCapacity(), 8); // Cap at 8 for initial hand
    const currentCount = this._backlog().length;
    const toAdd = Math.max(0, capacity - currentCount);
    for (let i = 0; i < toAdd; i++) {
      if (!this.drawSchemeCard()) break;
    }
  }

  /** Dismiss a scheme card from the board and draw a replacement */
  dismissScheme(taskId: string): boolean {
    const progress = this._quarterProgress();
    if (progress.dismissalsRemaining <= 0) return false;

    const task = this._backlog().find(t => t.id === taskId);
    if (!task) return false;

    this._backlog.update(board => board.filter(t => t.id !== taskId));
    this._quarterProgress.update(p => ({
      ...p,
      dismissalsRemaining: p.dismissalsRemaining - 1,
    }));

    // Draw a replacement
    this.drawSchemeCard();

    this.addNotification('Scheme dismissed — new intel incoming!', 'task');
    return true;
  }

  /** Convert a SchemeCard to a Task for the mission board */
  private schemeCardToTask(card: SchemeCard): Task {
    const template: TaskTemplate = {
      name: card.templateId,
      description: `${card.tier} scheme → ${card.operationCount}× ${DEPARTMENT_LABELS[card.targetDept].label} ops`,
      category: 'schemes', // Schemes are always category 'schemes'
      tier: card.tier,
    };

    return {
      id: card.id,
      template,
      status: 'queued',
      tier: card.tier,
      goldReward: card.directGold,
      clicksRequired: card.clicksRequired,
      clicksRemaining: card.clicksRequired,
      assignedMinionId: null,
      queuedAt: Date.now(),
      isSpecialOp: card.isSpecialOp,
      assignedQueue: null,
      schemeTargetDept: card.targetDept,
      schemeOperationCount: card.operationCount,
      schemeOperationTiers: card.operationTiers,
    };
  }

  /** Generate 1-3 operation Tasks from a completed scheme and route them to dept queues.
   *  Operations are only generated if the target department is unlocked.
   *  Overflow ops (beyond dept queue capacity) are silently dropped. */
  generateOperations(schemeCard: SchemeCard, comboMult: number = 0): void {
    const dept = schemeCard.targetDept;

    // Only generate operations if the target department is unlocked
    if (!this.unlockedDepartments().has(dept)) return;

    const deptLevel = this._departments()[dept].level;
    const capacity = this.deptQueueCapacity()[dept];
    let currentCount = this._departmentQueues()[dept].length;
    let opsAdded = 0;
    let opsDropped = 0;

    for (let i = 0; i < schemeCard.operationCount; i++) {
      if (currentCount >= capacity) { opsDropped++; continue; }

      const opTier = schemeCard.operationTiers[i] ?? schemeCard.tier;
      const config = TIER_CONFIG[opTier];

      // Apply department-specific modifiers to the operation
      let opGold: number;
      let opClicks: number;

      switch (dept) {
        case 'heists': {
          // Check heist-floor passive for adjusted floor
          const heistPassives = getActivePassives(this._minions(), 'heists');
          const floorBonus = aggregatePassiveFlat(heistPassives, 'heist-floor');
          opGold = rollHeistGold(config.gold, deptLevel, floorBonus);
          opClicks = config.clicks;
          break;
        }
        case 'mayhem':
          opGold = getMayhemGold(config.gold);
          opClicks = getMayhemClicks(config.clicks);
          break;
        default: // research and fallback
          opGold = config.gold;
          opClicks = config.clicks;
          break;
      }

      // Apply passive click reduction from dept manager
      const passiveClickReduction = this.getPassiveClickReductionForDept(dept);
      opClicks = Math.max(3, opClicks - passiveClickReduction);

      // Pick a template for flavor
      const templates = TASK_POOL.filter(t => t.category === dept && t.tier === opTier);
      const template: TaskTemplate = templates.length > 0
        ? templates[Math.floor(Math.random() * templates.length)]
        : { name: `${opTier} ${dept} op`, description: '', category: dept, tier: opTier };

      const operation: Task = {
        id: crypto.randomUUID(),
        template,
        status: 'queued',
        tier: opTier,
        goldReward: opGold,
        clicksRequired: opClicks,
        clicksRemaining: opClicks,
        assignedMinionId: null,
        queuedAt: Date.now(),
        isSpecialOp: schemeCard.isSpecialOp,
        assignedQueue: dept,
        isOperation: true,
        comboMult: comboMult > 0 ? comboMult : undefined,
      };

      // Route to the target department's queue
      this._departmentQueues.update(queues => ({
        ...queues,
        [dept]: [...queues[dept], operation],
      }));
      currentCount++;
      opsAdded++;
    }

    const deptLabel = DEPARTMENT_LABELS[dept].label;
    if (opsDropped > 0) {
      this.addNotification(
        `Scheme done! ${opsAdded} ${deptLabel} op${opsAdded !== 1 ? 's' : ''} deployed, ${opsDropped} lost (queue full)`,
        'task'
      );
    } else {
      this.addNotification(
        `Scheme complete! ${opsAdded} ${deptLabel} op${opsAdded !== 1 ? 's' : ''} deployed`,
        'task'
      );
    }
  }

  /** Fisher-Yates shuffle */
  private shuffleDeck(deck: SchemeCard[]): SchemeCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /** Add a scheme card to the deck (for research growth) */
  addSchemeCardToDeck(tier: TaskTier, targetDept?: TaskCategory): void {
    const executionDepts: TaskCategory[] = ['heists', 'research', 'mayhem'];
    const dept = targetDept ?? executionDepts[Math.floor(Math.random() * executionDepts.length)];
    const card = this.generateSchemeCard(tier, dept);
    this._schemeDeck.update(deck => [...deck, card]);
  }

  /** Check and trigger research breakthrough mechanic */
  private checkBreakthrough(category: TaskCategory): void {
    if (category !== 'research') return;

    const researchLevel = this._departments().research.level;
    const threshold = getBreakthroughThreshold(researchLevel);
    const researchCompleted = this._quarterProgress().researchCompleted;

    if (researchCompleted > 0 && researchCompleted % threshold === 0) {
      this._quarterProgress.update(p => ({
        ...p,
        activeBreakthroughs: p.activeBreakthroughs + 1,
      }));
      const breakthroughs = this._quarterProgress().activeBreakthroughs;
      this.addNotification(`⚡ Research Breakthrough #${breakthroughs}! +1 mult to ALL departments`, 'task');
    }

    // Deck growth: every N research completions, add a card
    if (researchCompleted > 0 && researchCompleted % RESEARCH_DECK_GROWTH_INTERVAL === 0) {
      // Tier based on research dept level
      const tierForGrowth: TaskTier = researchLevel >= 5 ? 'diabolical' : researchLevel >= 3 ? 'sinister' : 'petty';
      this.addSchemeCardToDeck(tierForGrowth);
      this.addNotification('Research added a new scheme to your deck!', 'task');
    }
  }

  /** Check and update mayhem combo counter */
  private checkMayhemCombo(category: TaskCategory, minionId?: string | null): boolean {
    const now = Date.now();
    let comboActive = false;

    if (category === 'mayhem') {
      const lastTime = this._lastMayhemCompletionTime();
      if (lastTime > 0 && (now - lastTime) <= MAYHEM_COMBO_TIMEOUT_MS) {
        this._mayhemComboCount.update(c => c + 1);
      } else {
        this._mayhemComboCount.set(1);
      }
      this._lastMayhemCompletionTime.set(now);

      // Combo threshold may be reduced by demolitions-expert passive
      const passives = getActivePassives(this._minions(), 'mayhem', minionId ?? undefined);
      const thresholdReduction = aggregatePassiveFlat(passives, 'combo-threshold');
      const effectiveThreshold = Math.max(2, MAYHEM_COMBO_THRESHOLD + thresholdReduction);

      if (this._mayhemComboCount() >= effectiveThreshold) {
        comboActive = true;
        this._mayhemComboCount.set(0); // Reset after triggering
        this.addNotification('🔥 Mayhem Combo! 2× gold on this operation!', 'task');
      }
    } else {
      // Non-mayhem completion resets the combo
      this._mayhemComboCount.set(0);
    }

    return comboActive;
  }

  // ─── Voucher shop ─────────────────────────

  purchaseVoucher(id: VoucherId): boolean {
    const current = this._ownedVouchers()[id];
    const def = VOUCHERS[id];
    if (current >= def.maxLevel) return false;
    const year = this._quarterProgress().year;
    const cost = getVoucherCost(id, current + 1, year);
    if (this._gold() < cost) return false;
    this._gold.update(g => g - cost);
    this._ownedVouchers.update(v => ({ ...v, [id]: current + 1 }));
    return true;
  }

  openShop(): void { this._showShop.set(true); }
  closeShop(): void { this._showShop.set(false); }

  /** Called after the player closes the between-quarter shop to actually advance the quarter. */
  continueAfterShop(): void {
    this._showShop.set(false);
    this.advanceToNextQuarter();
  }

  // ─── Quarterly tracking ──────────────────

  private checkQuarterCompletion(): void {
    const progress = this._quarterProgress();
    if (progress.isComplete) return;
    if (!isQuarterBudgetExhausted(progress)) return;

    // Quarter's task budget exhausted — evaluate results
    let result = evaluateQuarter(progress);

    // For Q4, override the gold target with the reviewer's target
    if (progress.quarter === 4) {
      const reviewTarget = this.reviewGoldTarget();
      result = {
        ...result,
        target: reviewTarget,
        passed: progress.grossGoldEarned >= reviewTarget,
      };
    }

    const passed = result.passed;

    this._quarterProgress.update(p => ({
      ...p,
      isComplete: true,
      missedQuarters: passed ? p.missedQuarters : p.missedQuarters + 1,
      quarterResults: [...p.quarterResults, result],
    }));

    this.events.emit({
      type: 'QuarterCompleted',
      year: result.year,
      quarter: result.quarter,
      passed,
      goldEarned: result.goldEarned,
      target: result.target,
    });

    const statusText = passed ? 'TARGET MET' : 'TARGET MISSED';
    this.addNotification(
      `Q${result.quarter} Year ${result.year} Review: ${statusText} (${result.goldEarned}g / ${result.target}g)`,
      'task'
    );
  }

  /** Advance to the next quarter (called after player acknowledges quarter results).
   *  For Q1-Q2 and Q4-pass transitions, opens the shop first; shop calls continueAfterShop().
   *  For Q3→Q4 (review start), skips shop and goes straight to reviewer intro. */
  advanceQuarter(): void {
    const progress = this._quarterProgress();
    if (!progress.isComplete) return;

    const nextQuarter = progress.quarter === 3 ? 4 as const :
      progress.quarter === 4 ? 1 as const :
      (progress.quarter + 1) as 1 | 2 | 3 | 4;

    // Q3→Q4: Start Year-End review — skip shop, go straight to reviewer intro
    if (nextQuarter === 4) {
      this.startReview(progress);
      this.advanceToNextQuarter();
      return;
    }

    // Q4 done: check pass/fail
    if (progress.quarter === 4) {
      if (!progress.quarterResults[progress.quarterResults.length - 1]?.passed) {
        // Run over — Q4 failed
        this._isRunOver.set(true);
        this.events.emit({
          type: 'RunEnded',
          year: progress.year,
          quarterResults: progress.quarterResults.map(r => ({ quarter: r.quarter, passed: r.passed })),
        });
        return; // Don't advance — game is over
      }
      // Q4 passed — revert modifiers, then show shop before next year
      this.revertReview();
    }

    // Show shop before advancing (Q1→Q2, Q2→Q3, Q4→Y+1 Q1)
    this._showShop.set(true);
  }

  /** Internal: actually set the next quarter progress (called by advanceQuarter for Q3→Q4, or by continueAfterShop) */
  private advanceToNextQuarter(): void {
    const progress = this._quarterProgress();
    const nextQuarter = progress.quarter === 3 ? 4 as const :
      progress.quarter === 4 ? 1 as const :
      (progress.quarter + 1) as 1 | 2 | 3 | 4;
    const nextYear = progress.quarter === 4 ? progress.year + 1 : progress.year;

    // Calculate dismissals with paper-shredder passive bonus
    let dismissBonus = this.voucherDismissalBonus();
    // Add dismiss-bonus from all managers
    for (const cat of ALL_CATEGORIES) {
      const passives = getActivePassives(this._minions(), cat);
      dismissBonus += aggregatePassiveFlat(passives, 'dismiss-bonus');
    }

    this._quarterProgress.set({
      year: nextYear,
      quarter: nextQuarter,
      grossGoldEarned: 0,
      tasksCompleted: 0,
      isComplete: false,
      missedQuarters: nextQuarter === 1 ? 0 : progress.missedQuarters,
      quarterResults: progress.quarterResults,
      dismissalsRemaining: BASE_DISMISSALS + dismissBonus,
      researchCompleted: 0,
      activeBreakthroughs: 0,
    });

    // Reset mayhem combo
    this._mayhemComboCount.set(0);
    this._lastMayhemCompletionTime.set(0);

    // Reset combo state
    this._comboState.set(createDefaultComboState());

    // Generate new quarterly deck — leftover cards from previous quarter carry over
    const target = getQuarterTarget(nextYear, nextQuarter);
    const schemesLevel = this._departments().schemes.level;
    const newCards = this.generateQuarterlyDeck(target.taskBudget, schemesLevel);
    this._schemeDeck.update(deck => [...deck, ...newCards]);

    // Draw a new hand of scheme cards from the deck
    this.drawSchemeHand();
  }

  /** Dismiss the reviewer intro modal (called when player clicks "Begin Review") */
  dismissReviewerIntro(): void {
    this._showReviewerIntro.set(false);
  }

  /** Start a new run (after run-over) */
  startNewRun(): void {
    this.initializeGame();
  }

  // ─── Review lifecycle ──────────────────────

  private startReview(progress: QuarterProgress): void {
    const year = progress.year;
    const reviewer = selectReviewer(year);
    const modifiers = getReviewModifiers(reviewer, progress.missedQuarters);

    this._currentReviewer.set(reviewer);
    this._activeModifiers.set(modifiers);
    this._showReviewerIntro.set(true);
    this.applyModifiers(modifiers);

    // Track reviewer and modifiers for compendium
    if (!this._encounteredReviewers().includes(reviewer.id)) {
      this._encounteredReviewers.update(r => [...r, reviewer.id]);
    }
    for (const mod of modifiers) {
      if (!this._encounteredModifiers().includes(mod.id)) {
        this._encounteredModifiers.update(m => [...m, mod.id]);
      }
    }

    this.events.emit({
      type: 'ReviewStarted',
      reviewer,
      modifiers,
      year,
    });
  }

  private applyModifiers(modifiers: Modifier[]): void {
    for (const mod of modifiers) {
      switch (mod.id) {
        case 'no-hiring':
          this._hiringDisabled.set(true);
          break;
        case 'upgrades-disabled':
          this._upgradesDisabled.set(true);
          break;
        case 'board-frozen':
          this._backlogFrozen.set(true);
          break;
        case 'board-limited':
          this._backlogLimited.set(true);
          break;
        case 'gold-drain':
          this._goldDrainPerTask.set(5);
          break;
        case 'gold-halved':
        case 'gold-reduced-30':
          // Handled by getBossMultPenalty() as integer mult adjustments
          break;
        case 'starting-gold-zero':
          this._gold.set(0);
          break;
        case 'lock-schemes':
          this._lockedCategory.set('schemes');
          break;
        case 'lock-heists':
          this._lockedCategory.set('heists');
          break;
        case 'lock-research':
          this._lockedCategory.set('research');
          break;
        case 'lock-mayhem':
          this._lockedCategory.set('mayhem');
          break;
        case 'automation-disabled':
          // Automation engine removed — modifier has no effect
          break;
      }
    }
  }

  private revertModifiers(): void {
    this._hiringDisabled.set(false);
    this._upgradesDisabled.set(false);
    this._backlogFrozen.set(false);
    this._backlogLimited.set(false);
    this._goldDrainPerTask.set(0);
    this._goldRewardMultiplier.set(1);
    this._lockedCategory.set(null);
  }

  private revertReview(): void {
    this._currentReviewer.set(null);
    this._activeModifiers.set([]);
    this._showReviewerIntro.set(false);
    this.revertModifiers();
  }

  // ─── Passive effect helpers (private) ──────

  /** Aggregate click-reduction passives from all dept managers (global) */
  private getPassiveClickReduction(): number {
    let total = 0;
    for (const cat of ALL_CATEGORIES) {
      const passives = getActivePassives(this._minions(), cat);
      total += aggregatePassiveFlat(passives, 'click-reduction');
    }
    return total;
  }

  /** Aggregate click-reduction passives for a specific department */
  private getPassiveClickReductionForDept(dept: TaskCategory): number {
    const passives = getActivePassives(this._minions(), dept);
    return aggregatePassiveFlat(passives, 'click-reduction');
  }

  /** Get integer mult penalty from boss review modifiers.
   *  gold-halved = -2, gold-reduced-30 = -1 */
  private getBossMultPenalty(): number {
    let penalty = 0;
    for (const mod of this._activeModifiers()) {
      if (mod.id === 'gold-halved') penalty -= 2;
      if (mod.id === 'gold-reduced-30') penalty -= 1;
    }
    return penalty;
  }
}
