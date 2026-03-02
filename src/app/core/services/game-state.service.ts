import { Injectable, computed, signal, inject } from '@angular/core';
import {
  Task, TaskStatus, TaskTier, TaskCategory, TIER_CONFIG, TaskTemplate, VILLAIN_SCALE_PER_LEVEL,
  QueueTarget,
} from '../models/task.model';
import {
  Minion, MinionAppearance, MinionStats, MINION_NAMES, MINION_COLORS, MINION_ACCESSORIES,
  SPECIALTY_CATEGORIES, SPECIALTY_BONUS, levelFromXp, xpForLevel,
} from '../models/minion.model';
import { GameNotification } from '../models/game-state.model';
import { TASK_POOL } from '../models/task-pool';
import {
  Department, DEPT_TIER_XP, deptLevelFromXp, deptXpForLevel, availableTiersForDeptLevel,
  DEPARTMENT_LABELS, getPassiveBonus, getDeptLocalMult,
} from '../models/department.model';
import {
  QuarterProgress, createInitialProgress, getQuarterTarget,
  isQuarterBudgetExhausted, evaluateQuarter,
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
  private readonly _missionBoard = signal<Task[]>([]);   // Available missions to choose from
  private readonly _activeMissions = signal<Task[]>([]);  // Legacy flat list (kept for backwards compat)
  private readonly _completedCount = signal(0);
  private readonly _totalGoldEarned = signal(0);
  private readonly _notifications = signal<GameNotification[]>([]);
  private readonly _departments = signal<Record<TaskCategory, Department>>({
    schemes: { category: 'schemes', xp: 0, level: 1 },
    heists: { category: 'heists', xp: 0, level: 1 },
    research: { category: 'research', xp: 0, level: 1 },
    mayhem: { category: 'mayhem', xp: 0, level: 1 },
  });

  private readonly _lastSaved = signal(0);

  // ─── Kanban queue signals ──────────────────
  private readonly _departmentQueues = signal<Record<TaskCategory, Task[]>>({
    schemes: [],
    heists: [],
    research: [],
    mayhem: [],
  });
  private readonly _playerQueue = signal<Task[]>([]);
  private readonly _quarterProgress = signal<QuarterProgress>(createInitialProgress());

  // ─── Reviewer signals ───────────────────────
  private readonly _currentReviewer = signal<Reviewer | null>(null);
  private readonly _activeModifiers = signal<Modifier[]>([]);
  private readonly _isRunOver = signal(false);
  private readonly _showReviewerIntro = signal(false);

  // ─── Modifier constraint signals ────────────
  private readonly _hiringDisabled = signal(false);
  private readonly _upgradesDisabled = signal(false);
  private readonly _boardFrozen = signal(false);
  private readonly _boardLimited = signal(false);
  private readonly _goldDrainPerTask = signal(0);
  private readonly _goldRewardMultiplier = signal(1);
  private readonly _lockedCategory = signal<TaskCategory | null>(null);

  // ─── Voucher & shop signals ───────────────
  private readonly _ownedVouchers = signal<Record<VoucherId, number>>(createEmptyVoucherLevels());
  private readonly _showShop = signal(false);

  // ─── Public read-only signals ──────────────
  readonly gold = this._gold.asReadonly();
  readonly minions = this._minions.asReadonly();
  readonly missionBoard = this._missionBoard.asReadonly();
  readonly completedCount = this._completedCount.asReadonly();
  readonly totalGoldEarned = this._totalGoldEarned.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly departments = this._departments.asReadonly();
  readonly lastSaved = this._lastSaved.asReadonly();
  readonly departmentQueues = this._departmentQueues.asReadonly();
  readonly playerQueue = this._playerQueue.asReadonly();
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
  readonly boardFrozen = this._boardFrozen.asReadonly();
  readonly boardLimited = this._boardLimited.asReadonly();
  readonly lockedCategory = this._lockedCategory.asReadonly();
  readonly ownedVouchers = this._ownedVouchers.asReadonly();
  readonly showShop = this._showShop.asReadonly();

  // ─── Voucher effect helpers (private computed) ──
  private readonly voucherClickPower = computed(() => getVoucherEffect('iron-fingers', this._ownedVouchers()['iron-fingers']));
  private readonly voucherBoardBonus = computed(() => getVoucherEffect('board-expansion', this._ownedVouchers()['board-expansion']));
  private readonly voucherSlotBonus = computed(() => getVoucherEffect('operations-desk', this._ownedVouchers()['operations-desk']));
  private readonly voucherRefreshMult = computed(() => getVoucherEffect('rapid-intel', this._ownedVouchers()['rapid-intel']));
  private readonly voucherHireDiscount = computed(() => getVoucherEffect('hire-discount', this._ownedVouchers()['hire-discount']));
  private readonly voucherXpMult = computed(() => getVoucherEffect('dept-funding', this._ownedVouchers()['dept-funding']));

  readonly currentQuarterTarget = computed(() => {
    const p = this._quarterProgress();
    return getQuarterTarget(p.year, p.quarter);
  });
  readonly quarterGold = computed(() => this._quarterProgress().grossGoldEarned);

  // Backwards-compat: activeMissions merges all queues into a single flat list
  readonly activeMissions = computed(() => {
    const deptQueues = this._departmentQueues();
    const player = this._playerQueue();
    const all: Task[] = [];
    for (const cat of ALL_CATEGORIES) {
      all.push(...deptQueues[cat]);
    }
    all.push(...player);
    return all;
  });

  // Backwards-compat: taskQueue = activeMissions
  readonly taskQueue = this.activeMissions;

  // ─── Villain level ─────────────────────────
  readonly villainLevel = computed(() => {
    const completed = this._completedCount();
    return Math.min(20, Math.floor(Math.sqrt(completed / 5)) + 1);
  });

  readonly villainTitle = computed(() => {
    const level = this.villainLevel();
    if (level <= 2) return 'Petty Troublemaker';
    if (level <= 4) return 'Aspiring Villain';
    if (level <= 6) return 'Notorious Scoundrel';
    if (level <= 8) return 'Criminal Mastermind';
    if (level <= 10) return 'Arch-Villain';
    if (level <= 14) return 'Dark Overlord';
    return 'Supreme Evil Genius';
  });

  // ─── Computed signals ──────────────────────
  readonly idleMinions = computed(() =>
    this._minions().filter(m => m.status === 'idle')
  );

  readonly workingMinions = computed(() =>
    this._minions().filter(m => m.status === 'working')
  );

  readonly nextMinionCost = computed(() =>
    Math.floor(75 * Math.pow(1.6, this._minions().length) * (1 - this.voucherHireDiscount()))
  );

  readonly canHireMinion = computed(() =>
    this._gold() >= this.nextMinionCost()
  );

  readonly queuedTasks = computed(() =>
    this.activeMissions().filter(t => t.status === 'queued')
  );

  readonly inProgressTasks = computed(() =>
    this.activeMissions().filter(t => t.status === 'in-progress')
  );

  /** Mission board capacity: base 12, scales with minions + voucher bonus. Clamped to 2 by board-limited modifier. */
  readonly boardCapacity = computed(() => {
    if (this._boardLimited()) return 2;
    const base = 12;
    const minionBonus = Math.min(8, this._minions().length * 2);
    return base + minionBonus + this.voucherBoardBonus();
  });

  /** Active mission slots: base 3 + 1 per minion + voucher bonus */
  readonly activeSlots = computed(() =>
    3 + this._minions().length + this.voucherSlotBonus()
  );

  /** Click power: base 1 + voucher bonus */
  readonly clickPower = computed(() => 1 + this.voucherClickPower());

  /** Minions grouped by assigned department */
  readonly minionsByDepartment = computed(() => {
    const result: Record<TaskCategory, Minion[]> = {
      schemes: [], heists: [], research: [], mayhem: [],
    };
    for (const m of this._minions()) {
      result[m.assignedDepartment].push(m);
    }
    return result;
  });

  // ─── Progressive department unlocking ────
  /**
   * Tracks which departments have been unlocked (have or had a minion assigned).
   * Persisted so departments stay unlocked even if the minion is lost.
   */
  private readonly _unlockedDepartments = signal<Set<TaskCategory>>(new Set());

  /** Departments the player has unlocked (computed from persisted set) */
  readonly unlockedDepartments = computed(() => this._unlockedDepartments());

  /** Ordered list of unlocked department categories */
  readonly unlockedDepartmentList = computed(() =>
    ALL_CATEGORIES.filter(cat => this._unlockedDepartments().has(cat))
  );

  /** Department queues filtered to only unlocked departments */
  readonly unlockedDepartmentQueues = computed(() => {
    const queues = this._departmentQueues();
    const unlocked = this._unlockedDepartments();
    const result = {} as Record<TaskCategory, Task[]>;
    for (const cat of ALL_CATEGORIES) {
      result[cat] = unlocked.has(cat) ? queues[cat] : [];
    }
    return result;
  });

  // ─── Constants ─────────────────────────────
  private readonly BOARD_REFRESH_INTERVAL = 3_000;
  private readonly SPECIAL_OP_CHANCE = 0.15;
  private readonly SPECIAL_OP_DURATION = 30_000;
  /** XP earned per task tier */
  private readonly TIER_XP: Record<TaskTier, number> = {
    petty: 3,
    sinister: 8,
    diabolical: 15,
    legendary: 25,
  };

  private lastBoardRefresh = 0;
  private usedNameIndices = new Set<number>();

  // ─── Game lifecycle ────────────────────────
  initializeGame(): void {
    this._gold.set(0);
    this._minions.set([]);
    this._missionBoard.set([]);
    this._activeMissions.set([]);
    this._completedCount.set(0);
    this._totalGoldEarned.set(0);
    this._notifications.set([]);
    this._departments.set({
      schemes: { category: 'schemes', xp: 0, level: 1 },
      heists: { category: 'heists', xp: 0, level: 1 },
      research: { category: 'research', xp: 0, level: 1 },
      mayhem: { category: 'mayhem', xp: 0, level: 1 },
    });
    this._departmentQueues.set({
      schemes: [], heists: [], research: [], mayhem: [],
    });
    this._playerQueue.set([]);
    this._quarterProgress.set(createInitialProgress());
    this._currentReviewer.set(null);
    this._activeModifiers.set([]);
    this._isRunOver.set(false);
    this._showReviewerIntro.set(false);
    this._hiringDisabled.set(false);
    this._upgradesDisabled.set(false);
    this._boardFrozen.set(false);
    this._boardLimited.set(false);
    this._goldDrainPerTask.set(0);
    this._goldRewardMultiplier.set(1);
    this._lockedCategory.set(null);
    this._ownedVouchers.set(createEmptyVoucherLevels());
    this._showShop.set(false);
    this._unlockedDepartments.set(new Set());
    this.usedNameIndices.clear();
    this.lastBoardRefresh = 0;

    // Fill the board immediately
    this.fillBoard();
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
      activeMissions: [], // kept empty for v3+; all tasks live in department/player queues
      missionBoard: this._missionBoard(),
      usedNameIndices: [...this.usedNameIndices],
      lastBoardRefresh: this.lastBoardRefresh,
      departmentQueues: this._departmentQueues(),
      playerQueue: this._playerQueue(),
      quarterProgress: this._quarterProgress(),
      unlockedDepartments: [...this._unlockedDepartments()],
      currentReviewer: this._currentReviewer(),
      activeModifiers: this._activeModifiers(),
      isRunOver: this._isRunOver(),
      ownedVouchers: this._ownedVouchers(),
    };
  }

  loadSnapshot(data: SaveData): void {
    this._gold.set(data.gold);
    this._completedCount.set(data.completedCount);
    this._totalGoldEarned.set(data.totalGoldEarned);
    this._minions.set(data.minions.map(m => ({
      ...m,
      assignedDepartment: m.assignedDepartment ?? m.specialty,
    })));
    this._departments.set(data.departments);
    this._missionBoard.set(data.missionBoard);
    this._notifications.set([]);

    // Load kanban queues (v3+)
    if (data.departmentQueues) {
      this._departmentQueues.set(data.departmentQueues);
    } else {
      this._departmentQueues.set({ schemes: [], heists: [], research: [], mayhem: [] });
    }
    if (data.playerQueue) {
      this._playerQueue.set(data.playerQueue);
    } else {
      this._playerQueue.set([]);
    }

    // Load quarterly progress (v7+)
    if (data.quarterProgress) {
      this._quarterProgress.set(data.quarterProgress);
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
        if (target === 'player') {
          this._playerQueue.update(q => [...q, { ...task, assignedQueue: 'player' }]);
        } else {
          const cat = target as TaskCategory;
          deptQueues[cat] = [...deptQueues[cat], { ...task, assignedQueue: cat }];
        }
      }
      this._departmentQueues.set(deptQueues);
    }

    // Legacy flat list cleared
    this._activeMissions.set([]);

    // Load unlocked departments (v4+), or derive from current minions for older saves
    if (data.unlockedDepartments && data.unlockedDepartments.length > 0) {
      this._unlockedDepartments.set(new Set(data.unlockedDepartments as TaskCategory[]));
    } else {
      // Backwards compat: derive from minion assignments
      const unlocked = new Set<TaskCategory>();
      for (const m of this._minions()) {
        unlocked.add(m.assignedDepartment);
      }
      this._unlockedDepartments.set(unlocked);
    }

    this.usedNameIndices = new Set(data.usedNameIndices);
    this.lastBoardRefresh = data.lastBoardRefresh;
  }

  addGold(amount: number): void {
    this._gold.update(g => g + amount);
  }

  // ─── Mission Board actions ─────────────────
  /** Legacy: Player accepts a mission from the board into the old flat list (still used by old UI) */
  acceptMission(missionId: string): void {
    // Route to the mission's category queue by default
    const mission = this._missionBoard().find(m => m.id === missionId);
    if (!mission) return;

    const totalActive = this.activeMissions().length;
    if (totalActive >= this.activeSlots()) return;

    this._missionBoard.update(board => board.filter(m => m.id !== missionId));
    const target = mission.template.category;
    this._departmentQueues.update(queues => ({
      ...queues,
      [target]: [...queues[target], { ...mission, status: 'queued' as TaskStatus, assignedQueue: target }],
    }));
    this.events.emit({ type: 'TaskQueued', taskId: missionId, department: target });
  }

  /** Route a mission from the board to a specific queue */
  routeMission(missionId: string, target: QueueTarget): void {
    const mission = this._missionBoard().find(m => m.id === missionId);
    if (!mission) return;

    const totalActive = this.activeMissions().length;
    if (totalActive >= this.activeSlots()) return;

    // Prevent routing to a locked department (unlocking or modifier-locked)
    if (target !== 'player' && !this._unlockedDepartments().has(target as TaskCategory)) return;
    if (target !== 'player' && this._lockedCategory() === target) return;

    this._missionBoard.update(board => board.filter(m => m.id !== missionId));

    const routed: Task = { ...mission, status: 'queued' as TaskStatus, assignedQueue: target };

    if (target === 'player') {
      this._playerQueue.update(q => [...q, routed]);
    } else {
      this._departmentQueues.update(queues => ({
        ...queues,
        [target]: [...queues[target], routed],
      }));
    }
    this.events.emit({ type: 'TaskQueued', taskId: missionId, department: target });
  }

  /** Move a task between queues (e.g., from one department to another, or to player workbench) */
  moveTaskToQueue(taskId: string, fromQueue: QueueTarget, toQueue: QueueTarget): void {
    if (fromQueue === toQueue) return;

    let task: Task | undefined;

    // Remove from source queue
    if (fromQueue === 'player') {
      const q = this._playerQueue();
      task = q.find(t => t.id === taskId);
      if (!task) return;
      // Don't move tasks that are in-progress with a minion
      if (task.assignedMinionId) return;
      this._playerQueue.update(queue => queue.filter(t => t.id !== taskId));
    } else {
      const cat = fromQueue as TaskCategory;
      const q = this._departmentQueues()[cat];
      task = q.find(t => t.id === taskId);
      if (!task) return;
      if (task.assignedMinionId) return;
      this._departmentQueues.update(queues => ({
        ...queues,
        [cat]: queues[cat].filter(t => t.id !== taskId),
      }));
    }

    const moved: Task = { ...task, assignedQueue: toQueue };

    // Add to target queue
    if (toQueue === 'player') {
      this._playerQueue.update(q => [...q, moved]);
    } else {
      this._departmentQueues.update(queues => ({
        ...queues,
        [toQueue]: [...queues[toQueue as TaskCategory], moved],
      }));
    }
    this.events.emit({ type: 'TaskQueued', taskId, department: toQueue });
  }

  /** Reorder tasks within a queue (drag to reorder priority) */
  reorderQueue(queue: QueueTarget, taskIds: string[]): void {
    if (queue === 'player') {
      this._playerQueue.update(current => {
        const byId = new Map(current.map(t => [t.id, t]));
        return taskIds.map(id => byId.get(id)!).filter(Boolean);
      });
    } else {
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
  }

  /** Reassign a minion to a different department */
  reassignMinion(minionId: string, newDept: TaskCategory): void {
    const minion = this._minions().find(m => m.id === minionId);
    if (!minion) return;
    if (minion.assignedDepartment === newDept) return;

    // If working, can't reassign
    if (minion.status === 'working') return;

    const fromDepartment = minion.assignedDepartment;
    this._minions.update(list =>
      list.map(m =>
        m.id === minionId
          ? { ...m, assignedDepartment: newDept }
          : m
      )
    );

    // Unlock the department if this is the first minion in it
    this.unlockDepartment(newDept, minion.name);
    this.events.emit({ type: 'MinionReassigned', minionId, fromDepartment, toDepartment: newDept });
  }

  // ─── Manual work (clicking) ────────────────
  clickTask(taskId: string): void {
    const power = this.clickPower();

    // Check player queue first
    const playerTask = this._playerQueue().find(t => t.id === taskId);
    if (playerTask) {
      this._playerQueue.update(queue =>
        queue.map(task => {
          if (task.id !== taskId) return task;
          if (task.status === 'complete') return task;

          const newClicks = task.clicksRemaining - power;
          if (newClicks <= 0) {
            this.awardGold(task.goldReward, task.template.name, task.tier, task.template.category, 'click');
            return { ...task, status: 'complete' as TaskStatus, clicksRemaining: 0 };
          }
          return {
            ...task,
            status: 'in-progress' as TaskStatus,
            clicksRemaining: newClicks,
          };
        })
      );
      if (this.clickCompleteDelay > 0) {
        setTimeout(() => this.cleanPlayerQueue(), this.clickCompleteDelay);
      } else {
        this.cleanPlayerQueue();
      }
      return;
    }

    // Check department queues
    for (const cat of ALL_CATEGORIES) {
      const queue = this._departmentQueues()[cat];
      const deptTask = queue.find(t => t.id === taskId);
      if (deptTask) {
        this._departmentQueues.update(queues => ({
          ...queues,
          [cat]: queues[cat].map(task => {
            if (task.id !== taskId) return task;
            if (task.status === 'complete') return task;
            if (task.assignedMinionId) return task; // can't click minion-assigned tasks

            const newClicks = task.clicksRemaining - power;
            if (newClicks <= 0) {
              this.awardGold(task.goldReward, task.template.name, task.tier, task.template.category, 'click');
              return { ...task, status: 'complete' as TaskStatus, clicksRemaining: 0 };
            }
            return {
              ...task,
              status: 'in-progress' as TaskStatus,
              clicksRemaining: newClicks,
            };
          }),
        }));
        if (this.clickCompleteDelay > 0) {
          setTimeout(() => this.cleanDeptQueue(cat), this.clickCompleteDelay);
        } else {
          this.cleanDeptQueue(cat);
        }
        return;
      }
    }
  }

  // ─── Hire minion ───────────────────────────
  hireMinion(): void {
    if (this._hiringDisabled()) return;
    const cost = this.nextMinionCost();
    if (this._gold() < cost) return;

    this._gold.update(g => g - cost);
    const minion = this.createMinion();
    this._minions.update(list => [...list, minion]);

    // Unlock the department if this is the first minion in it
    this.unlockDepartment(minion.assignedDepartment, minion.name);

    const specialtyLabel = minion.specialty.charAt(0).toUpperCase() + minion.specialty.slice(1);
    this.addNotification(
      `${minion.name} joined! Spd:${minion.stats.speed.toFixed(1)} Eff:${minion.stats.efficiency.toFixed(1)} [${specialtyLabel}]`,
      'minion'
    );
    this.events.emit({ type: 'MinionHired', minionId: minion.id, department: minion.assignedDepartment });
  }

  /** Hire a specific pre-generated minion (from the pick-one-of-two choice) */
  hireChosenMinion(minion: Minion): void {
    if (this._hiringDisabled()) return;
    const cost = this.nextMinionCost();
    if (this._gold() < cost) return;

    this._gold.update(g => g - cost);
    this._minions.update(list => [...list, minion]);

    this.unlockDepartment(minion.assignedDepartment, minion.name);

    const specialtyLabel = minion.specialty.charAt(0).toUpperCase() + minion.specialty.slice(1);
    this.addNotification(
      `${minion.name} joined! Spd:${minion.stats.speed.toFixed(1)} Eff:${minion.stats.efficiency.toFixed(1)} [${specialtyLabel}]`,
      'minion'
    );
    this.events.emit({ type: 'MinionHired', minionId: minion.id, department: minion.assignedDepartment });
  }

  /** Generate 2 hiring candidates. If not all depts unlocked, at least one opens a new dept. */
  generateHiringCandidates(): [Minion, Minion] {
    const unlocked = this._unlockedDepartments();
    const lockedDepts = ALL_CATEGORIES.filter(cat => !unlocked.has(cat));

    if (lockedDepts.length > 0) {
      // Guarantee at least one candidate is from a locked department
      const newDept = lockedDepts[Math.floor(Math.random() * lockedDepts.length)];
      const candidate1 = this.createMinion(newDept);
      const candidate2 = this.createMinion();
      // Randomize order so the "new dept" candidate isn't always first
      return Math.random() < 0.5 ? [candidate1, candidate2] : [candidate2, candidate1];
    }

    return [this.createMinion(), this.createMinion()];
  }

  /** Unlock a department, firing a notification if it was newly unlocked */
  private unlockDepartment(dept: TaskCategory, minionName: string): void {
    const current = this._unlockedDepartments();
    if (current.has(dept)) return;
    const updated = new Set(current);
    updated.add(dept);
    this._unlockedDepartments.set(updated);
    const label = DEPARTMENT_LABELS[dept];
    this.addNotification(
      `${label.icon} ${label.label} Department opened! ${minionName} is ready to work.`,
      'task'
    );
  }

  /** @deprecated All tick logic migrated to GameTimerService. Retained for test compatibility. */
  tickTime(): void {
    this.autoAssignMinions();
  }

  /**
   * Process one tick of minion auto-clicks.
   * Each assigned minion applies floor(speed) clicks to their task per tick.
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

          const clicks = Math.max(1, Math.floor(minion.stats.speed));
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
        this.awardGold(task.goldReward, task.template.name, task.tier, task.template.category, 'minion');
        this.freeMinionFromTask(minionId, task.tier, task.template.category);
      }
      // Remove completed task
      this._departmentQueues.update(qs => ({
        ...qs,
        [dept]: qs[dept].filter(t => t.id !== taskId),
      }));
    }
  }

  // ─── Tick step methods ────────────────

  /** Step 3: Remove a specific expired special op from the board */
  removeExpiredSpecialOp(missionId: string): void {
    this._missionBoard.update(board => board.filter(m => m.id !== missionId));
  }

  /** Step 4: Refill mission board and emit BoardRefreshed */
  refreshBoard(): void {
    if (this._boardFrozen()) return;
    this.fillBoard();
    this.lastBoardRefresh = Date.now();
    this.events.emit({
      type: 'BoardRefreshed', missionCount: this._missionBoard().length,
    });
  }

  /** Get the effective board refresh interval in ms (factoring passives + voucher) */
  getEffectiveBoardRefreshInterval(): number {
    const schemesPassive = getPassiveBonus('schemes', this._departments().schemes.level);
    const schemesRefreshBonus = 1 - schemesPassive * 0.01;
    const voucherMult = this.voucherRefreshMult() || 1;
    return this.BOARD_REFRESH_INTERVAL * Math.max(0.2, schemesRefreshBonus * voucherMult);
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

  // ─── Minion stat helpers ───────────────────

  /** Efficiency multiplier used for dept XP bonus (not gold) */
  private getMinionEfficiencyMultiplier(minion: Minion, taskCategory: TaskCategory): number {
    let eff = minion.stats.efficiency;
    eff += (minion.level - 1) * 0.03;
    if (minion.specialty === taskCategory) {
      eff += SPECIALTY_BONUS;
    }
    return eff;
  }

  // ─── Board management ─────────────────────
  /** Fill the mission board up to capacity */
  private fillBoard(): void {
    const capacity = this.boardCapacity();
    const current = this._missionBoard().length;
    const toSpawn = capacity - current;

    if (toSpawn <= 0) return;

    const newMissions: Task[] = [];
    for (let i = 0; i < toSpawn; i++) {
      newMissions.push(this.createBoardMission());
    }
    this._missionBoard.update(board => [...board, ...newMissions]);
  }

  private createBoardMission(): Task {
    const template = this.pickRandomTemplate();
    const config = TIER_CONFIG[template.tier];

    // Gold scales with VL
    const vlBonus = 1 + (this.villainLevel() - 1) * VILLAIN_SCALE_PER_LEVEL;
    let scaledGold = Math.round(config.gold * vlBonus);

    // Clicks are fixed per tier, reduced by Research passive
    const researchBonus = getPassiveBonus('research', this._departments().research.level);
    const clickReduction = 1 - researchBonus * 0.01;
    const scaledClicks = Math.max(1, Math.round(config.clicks * clickReduction));

    // Mayhem passive: increased Special Op appearance rate
    const mayhemBonus = getPassiveBonus('mayhem', this._departments().mayhem.level);
    const specialOpChance = this.SPECIAL_OP_CHANCE + mayhemBonus * 0.01;
    const isSpecialOp = Math.random() < specialOpChance;
    if (isSpecialOp) {
      // Heists passive: increased Special Op gold bonus (base 1.5×)
      const heistsBonus = getPassiveBonus('heists', this._departments().heists.level);
      const specialOpMult = 1.5 + heistsBonus * 0.01;
      scaledGold = Math.round(scaledGold * specialOpMult);
    }

    const mission: Task = {
      id: crypto.randomUUID(),
      template,
      status: 'queued',
      tier: template.tier,
      goldReward: scaledGold,
      clicksRequired: scaledClicks,
      clicksRemaining: scaledClicks,
      assignedMinionId: null,
      queuedAt: Date.now(),
      isSpecialOp,
      specialOpExpiry: isSpecialOp ? Date.now() + this.SPECIAL_OP_DURATION : undefined,
      assignedQueue: null,
    };

    if (isSpecialOp) {
      this.events.emit({ type: 'SpecialOpSpawned', missionId: mission.id, tier: mission.tier });
    }

    return mission;
  }

  private pickRandomTemplate(): TaskTemplate {
    const level = this.villainLevel();

    // Determine desired tier based on villain level weights
    const pettyWeight = Math.max(10, 70 - (level - 1) * 5);
    const legendaryWeight = level >= 8 ? Math.min(25, (level - 7) * 4) : 0;
    const diabolicalWeight = Math.min(40, 5 + (level - 1) * 4);
    const sinisterWeight = 100 - pettyWeight - diabolicalWeight - legendaryWeight;

    const roll = Math.random() * 100;
    let desiredTier: TaskTier;
    if (roll < pettyWeight) desiredTier = 'petty';
    else if (roll < pettyWeight + sinisterWeight) desiredTier = 'sinister';
    else if (roll < pettyWeight + sinisterWeight + diabolicalWeight) desiredTier = 'diabolical';
    else desiredTier = 'legendary';

    // Pick a random category from unlocked departments only
    const unlocked = this.unlockedDepartmentList();
    const categories = unlocked.length > 0 ? unlocked : ALL_CATEGORIES;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const depts = this._departments();
    const deptLevel = depts[category].level;
    const allowedTiers = availableTiersForDeptLevel(deptLevel);

    // If desired tier isn't unlocked for this dept, fall back to the highest available
    let tier = desiredTier;
    if (!allowedTiers.includes(tier)) {
      tier = allowedTiers[allowedTiers.length - 1];
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

  /** Per-department auto-assign: each department's idle minions pick from their department's queue */
  autoAssignMinions(): void {
    const minionsByDept = this.minionsByDepartment();
    const deptQueues = this._departmentQueues();

    const tierPriority: Record<TaskTier, number> = {
      legendary: 4,
      diabolical: 3,
      sinister: 2,
      petty: 1,
    };

    for (const cat of ALL_CATEGORIES) {
      const deptMinions = minionsByDept[cat];
      const idle = deptMinions.filter(m => m.status === 'idle');
      if (idle.length === 0) continue;

      const queued = deptQueues[cat].filter(t => t.status === 'queued');
      if (queued.length === 0) continue;

      // Queued tasks are already in priority order (player reorders them)
      // But we still prefer specialty matches among idle minions
      const assignedMinionIds = new Set<string>();

      for (const task of queued) {
        if (assignedMinionIds.size >= idle.length) break;

        const available = idle.filter(m => !assignedMinionIds.has(m.id));
        if (available.length === 0) break;

        const specialtyMatch = available.find(m => m.specialty === task.template.category);
        const chosen = specialtyMatch || available[0];

        assignedMinionIds.add(chosen.id);
        this.assignMinionToTask(chosen.id, task.id, cat);
      }
    }
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
    const baseXp = this.TIER_XP[taskTier];
    const xpGain = baseXp;

    this._minions.update(list =>
      list.map(m => {
        if (m.id !== minionId) return m;
        const newXp = m.xp + xpGain;
        const newLevel = levelFromXp(newXp);
        const didLevelUp = newLevel > m.level;

        if (didLevelUp) {
          this.addNotification(`${m.name} reached level ${newLevel}!`, 'minion');
          this.events.emit({
            type: 'LevelUp', target: 'minion', targetId: minionId, newLevel,
          });
        }

        return {
          ...m,
          status: 'idle' as const,
          assignedTaskId: null,
          xp: newXp,
          level: newLevel,
        };
      })
    );

    this.events.emit({
      type: 'MinionIdle', minionId, department: taskCategory,
    });
  }

  /**
   * Award gold using the new Base × Mult formula.
   * Base = goldReward (already includes tier × VL × specialOpMult from createBoardMission)
   * Mult = deptLocalMult × bossModifierMult
   */
  private awardGold(
    baseGold: number,
    taskName: string,
    taskTier?: TaskTier,
    taskCategory?: TaskCategory,
    source: 'minion' | 'click' = 'minion'
  ): void {
    let mult = 1.0;

    // Dept local mult (minion tasks in a department)
    if (taskCategory) {
      mult *= getDeptLocalMult(this._departments()[taskCategory].level);
    }

    // Boss modifier
    mult *= this._goldRewardMultiplier();

    let finalAmount = Math.round(baseGold * mult);
    finalAmount = Math.max(0, finalAmount - this._goldDrainPerTask());

    this._gold.update(g => g + finalAmount);
    this._totalGoldEarned.update(g => g + finalAmount);
    const oldVillainLevel = this.villainLevel();
    this._completedCount.update(c => c + 1);
    const newVillainLevel = this.villainLevel();
    if (newVillainLevel > oldVillainLevel) {
      this.events.emit({ type: 'LevelUp', target: 'villain', targetId: 'player', newLevel: newVillainLevel });
    }

    this.addNotification(`+${finalAmount}g from "${taskName}"`, 'gold');

    // Award department XP (efficiency bonus as XP multiplier)
    if (taskTier && taskCategory) {
      this.awardDeptXp(taskCategory, taskTier, source);
    }

    // Track quarterly progress
    this._quarterProgress.update(p => ({
      ...p,
      grossGoldEarned: p.grossGoldEarned + finalAmount,
      tasksCompleted: p.tasksCompleted + 1,
    }));

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

  private awardDeptXp(category: TaskCategory, tier: TaskTier, source: 'minion' | 'click' = 'minion'): void {
    const baseXp = DEPT_TIER_XP[tier];
    const xpGain = Math.round(baseXp * (1 + this.voucherXpMult()));
    this._departments.update(depts => {
      const dept = depts[category];
      const newXp = dept.xp + xpGain;
      const newLevel = deptLevelFromXp(newXp);
      const didLevelUp = newLevel > dept.level;

      if (didLevelUp) {
        const unlocked = availableTiersForDeptLevel(newLevel);
        const highest = unlocked[unlocked.length - 1];
        this.addNotification(
          `${category.charAt(0).toUpperCase() + category.slice(1)} dept reached level ${newLevel}! (${highest} unlocked)`,
          'task');
        this.events.emit({
          type: 'LevelUp', target: 'department', targetId: category, newLevel,
        }
        );
      }

      return {
        ...depts,
        [category]: { ...dept, xp: newXp, level: newLevel },
      };
    });
  }

  // ─── Queue cleanup ─────────────────────────
  private cleanDeptQueue(cat: TaskCategory): void {
    this._departmentQueues.update(queues => ({
      ...queues,
      [cat]: queues[cat].filter(t => t.status !== 'complete'),
    }));
  }

  private cleanPlayerQueue(): void {
    this._playerQueue.update(queue =>
      queue.filter(t => t.status !== 'complete')
    );
  }

  private createMinion(forceSpecialty?: TaskCategory): Minion {
    const name = this.pickMinionName();
    const color = MINION_COLORS[Math.floor(Math.random() * MINION_COLORS.length)];
    const accessory = MINION_ACCESSORIES[Math.floor(Math.random() * MINION_ACCESSORIES.length)];
    const specialty = forceSpecialty ?? SPECIALTY_CATEGORIES[Math.floor(Math.random() * SPECIALTY_CATEGORIES.length)];

    const randStat = () => {
      const r = (Math.random() + Math.random()) / 2;
      return Math.round((0.7 + r * 0.6) * 100) / 100;
    };

    return {
      id: crypto.randomUUID(),
      name,
      appearance: { color, accessory } as MinionAppearance,
      status: 'idle',
      assignedTaskId: null,
      stats: { speed: randStat(), efficiency: randStat() },
      specialty,
      assignedDepartment: specialty, // default to their specialty
      xp: 0,
      level: 1,
    };
  }

  private pickMinionName(): string {
    if (this.usedNameIndices.size >= MINION_NAMES.length) {
      this.usedNameIndices.clear();
    }
    let idx: number;
    do {
      idx = Math.floor(Math.random() * MINION_NAMES.length);
    } while (this.usedNameIndices.has(idx));
    this.usedNameIndices.add(idx);
    return MINION_NAMES[idx];
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

  // ─── Voucher shop ─────────────────────────

  purchaseVoucher(id: VoucherId): boolean {
    const current = this._ownedVouchers()[id];
    const def = VOUCHERS[id];
    if (current >= def.maxLevel) return false;
    const cost = getVoucherCost(id, current + 1);
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

    this._quarterProgress.set({
      year: nextYear,
      quarter: nextQuarter,
      grossGoldEarned: 0,
      tasksCompleted: 0,
      isComplete: false,
      missedQuarters: nextQuarter === 1 ? 0 : progress.missedQuarters,
      quarterResults: progress.quarterResults,
    });
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
          this._boardFrozen.set(true);
          break;
        case 'board-limited':
          this._boardLimited.set(true);
          break;
        case 'gold-drain':
          this._goldDrainPerTask.set(5);
          break;
        case 'gold-halved':
          this._goldRewardMultiplier.set(this._goldRewardMultiplier() * 0.5);
          break;
        case 'gold-reduced-30':
          this._goldRewardMultiplier.set(this._goldRewardMultiplier() * 0.7);
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
      }
    }
  }

  private revertModifiers(): void {
    this._hiringDisabled.set(false);
    this._upgradesDisabled.set(false);
    this._boardFrozen.set(false);
    this._boardLimited.set(false);
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
}
