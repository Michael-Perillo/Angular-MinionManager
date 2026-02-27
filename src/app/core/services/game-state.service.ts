import { Injectable, computed, signal, inject } from '@angular/core';
import {
  Task, TaskStatus, TaskTier, TaskCategory, TIER_CONFIG, TaskTemplate, GOLD_SCALE_PER_LEVEL,
  QueueTarget,
} from '../models/task.model';
import {
  Minion, MinionAppearance, MinionStats, MINION_NAMES, MINION_COLORS, MINION_ACCESSORIES,
  SPECIALTY_CATEGORIES, SPECIALTY_BONUS, levelFromXp, xpForLevel,
  CapturedMinion, PRISON_DURATION_MS,
} from '../models/minion.model';
import { GameNotification } from '../models/game-state.model';
import { TASK_POOL } from '../models/task-pool';
import {
  Department, DEPT_TIER_XP, deptLevelFromXp, deptXpForLevel, availableTiersForDeptLevel,
  DEPARTMENT_LABELS, getPassiveBonus,
} from '../models/department.model';
import { Upgrade, upgradeCost, upgradeEffect, createDefaultUpgrades } from '../models/upgrade.model';
import {
  NOTORIETY_PER_TIER, MAX_NOTORIETY, getThreatLevel, notorietyGoldPenalty,
  bribeCost, COVER_TRACKS_REDUCTION, BASE_NOTORIETY_DECAY, ThreatLevel,
} from '../models/notoriety.model';
import { INFLUENCE_PER_TIER } from '../models/resource.model';
import { SaveData } from '../models/save-data.model';
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

  private readonly _upgrades = signal<Upgrade[]>(createDefaultUpgrades());
  private readonly _notoriety = signal(0);
  private readonly _raidActive = signal(false);
  private readonly _raidTimer = signal(0); // seconds to defend
  private readonly _capturedMinions = signal<CapturedMinion[]>([]);
  private readonly _lastSaved = signal(0);

  // ─── Kanban queue signals ──────────────────
  private readonly _departmentQueues = signal<Record<TaskCategory, Task[]>>({
    schemes: [],
    heists: [],
    research: [],
    mayhem: [],
  });
  private readonly _playerQueue = signal<Task[]>([]);
  private readonly _influence = signal(0);

  // ─── Public read-only signals ──────────────
  readonly gold = this._gold.asReadonly();
  readonly minions = this._minions.asReadonly();
  readonly missionBoard = this._missionBoard.asReadonly();
  readonly completedCount = this._completedCount.asReadonly();
  readonly totalGoldEarned = this._totalGoldEarned.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly departments = this._departments.asReadonly();
  readonly upgrades = this._upgrades.asReadonly();
  readonly notoriety = this._notoriety.asReadonly();
  readonly raidActive = this._raidActive.asReadonly();
  readonly raidTimer = this._raidTimer.asReadonly();
  readonly capturedMinions = this._capturedMinions.asReadonly();
  readonly lastSaved = this._lastSaved.asReadonly();
  readonly departmentQueues = this._departmentQueues.asReadonly();
  readonly playerQueue = this._playerQueue.asReadonly();
  readonly influence = this._influence.asReadonly();

  readonly threatLevel = computed(() => getThreatLevel(this._notoriety()));

  readonly notorietyGoldPenaltyPercent = computed(() =>
    Math.round(notorietyGoldPenalty(this._notoriety()) * 100)
  );

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
    return Math.min(20, Math.floor(Math.sqrt(completed / 2.5)) + 1);
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

  readonly nextMinionCost = computed(() => {
    const base = Math.floor(50 * Math.pow(1.5, this._minions().length));
    const discount = this.getUpgradeEffect('hire-discount');
    return Math.floor(base * (1 - discount));
  });

  readonly canHireMinion = computed(() =>
    this._gold() >= this.nextMinionCost()
  );

  readonly queuedTasks = computed(() =>
    this.activeMissions().filter(t => t.status === 'queued')
  );

  readonly inProgressTasks = computed(() =>
    this.activeMissions().filter(t => t.status === 'in-progress')
  );

  /** Mission board capacity: base 12, scales with minions + upgrades */
  readonly boardCapacity = computed(() => {
    const base = 12;
    const minionBonus = Math.min(8, this._minions().length * 2);
    const upgradeBonus = this.getUpgradeEffect('board-slots');
    return base + minionBonus + upgradeBonus;
  });

  /** Active mission slots: base 3 + 1 per minion + upgrades */
  readonly activeSlots = computed(() =>
    3 + this._minions().length + this.getUpgradeEffect('active-slots')
  );

  /** Click power: 1 + upgrade level */
  readonly clickPower = computed(() =>
    1 + this.getUpgradeEffect('click-power')
  );

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
  private readonly RAID_CHANCE_PER_TICK = 0.02; // 2% per tick when notoriety >= 60
  private readonly RAID_DURATION = 10; // 10 seconds to defend
  private readonly COVER_TRACKS_CHANCE = 0.12; // 12% chance a board mission is "Cover Your Tracks"

  /** XP earned per task tier */
  private readonly TIER_XP: Record<TaskTier, number> = {
    petty: 3,
    sinister: 8,
    diabolical: 15,
    legendary: 25,
  };

  private lastBoardRefresh = 0;
  private usedNameIndices = new Set<number>();
  private notorietyDecayAccumulator = 0;

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
    this._upgrades.set(createDefaultUpgrades());
    this._notoriety.set(0);
    this._raidActive.set(false);
    this._raidTimer.set(0);
    this._capturedMinions.set([]);
    this._departmentQueues.set({
      schemes: [], heists: [], research: [], mayhem: [],
    });
    this._playerQueue.set([]);
    this._influence.set(0);
    this._unlockedDepartments.set(new Set());
    this.usedNameIndices.clear();
    this.lastBoardRefresh = 0;
    this.notorietyDecayAccumulator = 0;

    // Fill the board immediately
    this.fillBoard();
  }

  resetGame(): void {
    this.initializeGame();
  }

  // ─── Snapshot (persistence) ─────────────────
  getSnapshot(): SaveData {
    return {
      version: 4,
      savedAt: Date.now(),
      gold: this._gold(),
      completedCount: this._completedCount(),
      totalGoldEarned: this._totalGoldEarned(),
      notoriety: this._notoriety(),
      minions: this._minions(),
      departments: this._departments(),
      upgradeLevels: this._upgrades().map(u => ({ id: u.id, currentLevel: u.currentLevel })),
      activeMissions: [], // kept empty for v3+; all tasks live in department/player queues
      missionBoard: this._missionBoard(),
      raidActive: this._raidActive(),
      raidTimer: this._raidTimer(),
      usedNameIndices: [...this.usedNameIndices],
      lastBoardRefresh: this.lastBoardRefresh,
      capturedMinions: this._capturedMinions(),
      departmentQueues: this._departmentQueues(),
      playerQueue: this._playerQueue(),
      influence: this._influence(),
      unlockedDepartments: [...this._unlockedDepartments()],
    };
  }

  loadSnapshot(data: SaveData): void {
    this._gold.set(data.gold);
    this._completedCount.set(data.completedCount);
    this._totalGoldEarned.set(data.totalGoldEarned);
    this._notoriety.set(data.notoriety);
    this._minions.set(data.minions.map(m => ({
      ...m,
      assignedDepartment: m.assignedDepartment ?? m.specialty,
    })));
    this._departments.set(data.departments);
    this._missionBoard.set(data.missionBoard);
    this._raidActive.set(data.raidActive);
    this._raidTimer.set(data.raidTimer);
    this._capturedMinions.set(data.capturedMinions ?? []);
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

    // Load influence (v4+)
    this._influence.set(data.influence ?? 0);

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

    // Upgrades: start from defaults, merge saved levels
    const upgrades = createDefaultUpgrades();
    for (const saved of data.upgradeLevels) {
      const match = upgrades.find(u => u.id === saved.id);
      if (match) match.currentLevel = saved.currentLevel;
    }
    this._upgrades.set(upgrades);

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

  // ─── Upgrades ──────────────────────────────
  purchaseUpgrade(upgradeId: string): void {
    const upgrade = this._upgrades().find(u => u.id === upgradeId);
    if (!upgrade) return;
    const cost = upgradeCost(upgrade);
    if (this._gold() < cost) return;

    this._gold.update(g => g - cost);
    const newLevel = upgrade.currentLevel + 1;
    this._upgrades.update(list =>
      list.map(u =>
        u.id === upgradeId
          ? { ...u, currentLevel: newLevel }
          : u
      )
    );
    this.addNotification(`Upgraded ${upgrade.name} to level ${newLevel}!`, 'task');
    this.events.emit({ type: 'UpgradePurchased', upgradeId, newLevel });
  }

  /** Get the current level of an upgrade by ID */
  getUpgradeLevel(id: string): number {
    return this._upgrades().find(u => u.id === id)?.currentLevel ?? 0;
  }

  /** Get the computed effect of an upgrade by ID */
  private getUpgradeEffect(id: string): number {
    const upgrade = this._upgrades().find(u => u.id === id);
    return upgrade ? upgradeEffect(upgrade) : 0;
  }

  // ─── Notoriety actions ──────────────────────
  /** Pay gold to reduce notoriety by 10 */
  payBribe(): void {
    const baseCost = bribeCost(this._notoriety());
    const discount = this.getUpgradeEffect('bribe-network');
    const cost = Math.floor(baseCost * (1 - discount));
    if (this._gold() < cost) return;
    if (this._notoriety() <= 0) return;

    const oldNotoriety = this._notoriety();
    this._gold.update(g => g - cost);
    this._notoriety.update(n => Math.max(0, n - 10));
    this.addNotification(`Bribed officials (-10 notoriety, -${cost}g)`, 'task');
    this.events.emit({ type: 'ThreatChanged', oldNotoriety, newNotoriety: this._notoriety() });
  }

  /** Click to defend during a hero raid */
  defendRaid(): void {
    if (!this._raidActive()) return;
    this._raidTimer.update(t => t - 1);
    if (this._raidTimer() <= 0) {
      this._raidActive.set(false);
      const oldNotoriety = this._notoriety();
      this._notoriety.update(n => Math.max(0, n - 20));
      this.addNotification('Hero raid repelled! (-20 notoriety)', 'task');
      this.events.emit({ type: 'ThreatChanged', oldNotoriety, newNotoriety: this._notoriety() });
      this.events.emit({ type: 'RaidEnded', defended: true });
    }
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

    // Prevent routing to a locked department
    if (target !== 'player' && !this._unlockedDepartments().has(target as TaskCategory)) return;

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
    const clickGoldBonus = 1 + this.getUpgradeEffect('click-gold');

    // Check player queue first
    const playerTask = this._playerQueue().find(t => t.id === taskId);
    if (playerTask) {
      this._playerQueue.update(queue =>
        queue.map(task => {
          if (task.id !== taskId) return task;
          if (task.status === 'complete') return task;

          const newClicks = task.clicksRemaining - power;
          if (newClicks <= 0) {
            if (task.isBreakoutOp) {
              this.completeBreakout(task);
            } else if (task.isCoverOp) {
              this.completeCoverOp(task.template.name, task.tier);
            } else {
              const bonusGold = Math.round(task.goldReward * clickGoldBonus);
              this.awardGold(bonusGold, task.template.name, task.tier, task.template.category);
            }
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
              if (task.isBreakoutOp) {
                this.completeBreakout(task);
              } else if (task.isCoverOp) {
                this.completeCoverOp(task.template.name, task.tier);
              } else {
                const bonusGold = Math.round(task.goldReward * clickGoldBonus);
                this.awardGold(bonusGold, task.template.name, task.tier, task.template.category);
              }
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

  /** Complete a task by timer (event-driven path from GameTimerService) */
  completeTaskByTimer(taskId: string, dept: TaskCategory): void {
    const task = this._departmentQueues()[dept].find(t => t.id === taskId);
    if (!task || task.status !== 'in-progress') return;

    const minionId = task.assignedMinionId;

    if (task.isBreakoutOp) {
      this.completeBreakout(task);
    } else if (task.isCoverOp) {
      this.completeCoverOp(task.template.name, task.tier);
    } else {
      const minion = minionId ? this._minions().find(m => m.id === minionId) : null;
      const effMult = minion ? this.getMinionEfficiencyMultiplier(minion, task.template.category) : 1;
      const bonusGold = Math.round(task.goldReward * effMult);
      this.awardGold(bonusGold, task.template.name, task.tier, task.template.category);
    }

    if (minionId) {
      this.freeMinionFromTask(minionId, task.tier, task.template.category);
    }

    // Remove the completed task from the queue
    this._departmentQueues.update(queues => ({
      ...queues,
      [dept]: queues[dept].filter(t => t.id !== taskId),
    }));
  }

  /** Set timing info for a task being resumed from save (called by GameTimerService on load) */
  setTaskTimingInfo(taskId: string, dept: TaskCategory, assignedAt: number, completesAt: number): void {
    this._departmentQueues.update(queues => ({
      ...queues,
      [dept]: queues[dept].map(t => t.id === taskId ? { ...t, assignedAt, completesAt } : t),
    }));
  }

  // ─── Tick step methods ────────────────

  /** Step 3: Remove a specific expired special op from the board */
  removeExpiredSpecialOp(missionId: string): void {
    this._missionBoard.update(board => board.filter(m => m.id !== missionId));
  }

  /** Step 4: Refill mission board and emit BoardRefreshed */
  refreshBoard(): void {
    this.fillBoard();
    this.lastBoardRefresh = Date.now();
    this.events.emit({
      type: 'BoardRefreshed', missionCount: this._missionBoard().length,
    });
  }

  /** Get the effective board refresh interval in ms (factoring upgrades and passives) */
  getEffectiveBoardRefreshInterval(): number {
    const refreshSpeedMult = this.getUpgradeEffect('board-refresh') || 1;
    const schemesPassive = getPassiveBonus('schemes', this._departments().schemes.level);
    const schemesRefreshBonus = 1 - schemesPassive * 0.01;
    return this.BOARD_REFRESH_INTERVAL * Math.max(0.2, refreshSpeedMult * schemesRefreshBonus);
  }

  /** Step 6: Hero raid trigger — chance per tick when notoriety >= 60 */
  checkRaidTrigger(): void {
    if (!this._raidActive() && this._notoriety() >= 60) {
      if (Math.random() < this.RAID_CHANCE_PER_TICK) {
        this._raidActive.set(true);
        this._raidTimer.set(this.RAID_DURATION);
        this.addNotification('HERO RAID! Click to defend or lose a minion!', 'task');
        this.events.emit({ type: 'RaidStarted' });
      }
    }
  }

  /** Step 7: Raid countdown — if not defended in time, capture a minion */
  processRaidCountdown(now: number): void {
    if (!this._raidActive()) return;

    this._raidTimer.update(t => t - 1);
    if (this._raidTimer() > 0) return;

    this._raidActive.set(false);
    const minions = this._minions();
    if (minions.length > 0) {
      const idle = minions.filter(m => m.status === 'idle');
      const target = idle.length > 0
        ? idle[Math.floor(Math.random() * idle.length)]
        : minions[Math.floor(Math.random() * minions.length)];

      if (target.assignedTaskId) {
        this.unassignMinionFromTask(target.id, target.assignedTaskId);
      }

      this._minions.update(list => list.filter(m => m.id !== target.id));
      this._capturedMinions.update(list => [...list, {
        minion: { ...target, status: 'idle' as const, assignedTaskId: null },
        capturedAt: now,
        expiresAt: now + PRISON_DURATION_MS,
        rescueDifficulty: target.level,
      }]);
      this.addNotification(
        `Heroes captured ${target.name}! Break them out before they're gone for good!`,
        'minion'
      );
      this.events.emit({
        type: 'MinionCaptured', minionId: target.id, minionName: target.name,
      });
    }
    const oldNotoriety = this._notoriety();
    this._notoriety.update(n => Math.max(0, n - 15));
    this.events.emit({ type: 'ThreatChanged', oldNotoriety, newNotoriety: this._notoriety() });
    this.events.emit({ type: 'RaidEnded', defended: false });
  }

  /** Step 8: Prison expiry — permanently lose minion whose time ran out */
  processPrisonExpiry(now: number): void {
    const expired = this._capturedMinions().filter(c => now >= c.expiresAt);
    if (expired.length === 0) return;

    for (const c of expired) {
      this.addNotification(
        `${c.minion.name} has been transferred to maximum security — gone for good.`,
        'minion'
      );
    }
    const expiredIds = new Set(expired.map(c => c.minion.id));
    this._capturedMinions.update(list => list.filter(c => !expiredIds.has(c.minion.id)));
    this._missionBoard.update(board =>
      board.filter(m => !m.breakoutTargetId || !expiredIds.has(m.breakoutTargetId))
    );
    for (const cat of ALL_CATEGORIES) {
      this._departmentQueues.update(queues => ({
        ...queues,
        [cat]: queues[cat].filter(m => !m.breakoutTargetId || !expiredIds.has(m.breakoutTargetId)),
      }));
    }
    this._playerQueue.update(q =>
      q.filter(m => !m.breakoutTargetId || !expiredIds.has(m.breakoutTargetId))
    );
  }

  /** Step 9: Passive notoriety decay (when not raided) */
  processNotorietyDecay(): void {
    if (this._notoriety() <= 0 || this._raidActive()) return;
    const layLowBonus = this.getUpgradeEffect('lay-low');
    this.notorietyDecayAccumulator += BASE_NOTORIETY_DECAY + layLowBonus;
    if (this.notorietyDecayAccumulator >= 1.0) {
      const oldNotoriety = this._notoriety();
      const intDecay = Math.floor(this.notorietyDecayAccumulator);
      this.notorietyDecayAccumulator -= intDecay;
      this._notoriety.update(n => Math.max(0, n - intDecay));
      if (this._notoriety() !== oldNotoriety) {
        this.events.emit({ type: 'ThreatChanged', oldNotoriety, newNotoriety: this._notoriety() });
      }
    }
  }

  /** Step 10: Clean old notifications */
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
  private getMinionSpeedMultiplier(minion: Minion, taskCategory: TaskCategory): number {
    let speed = minion.stats.speed;
    speed += (minion.level - 1) * 0.02;
    if (minion.specialty === taskCategory) {
      speed += SPECIALTY_BONUS;
    }
    // Global speed upgrade
    speed *= 1 + this.getUpgradeEffect('minion-speed');
    return speed;
  }

  private getMinionEfficiencyMultiplier(minion: Minion, taskCategory: TaskCategory): number {
    let eff = minion.stats.efficiency;
    eff += (minion.level - 1) * 0.03;
    if (minion.specialty === taskCategory) {
      eff += SPECIALTY_BONUS;
    }
    // Global efficiency upgrade
    eff *= 1 + this.getUpgradeEffect('minion-efficiency');
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
    // Chance to spawn breakout mission when minions are captured
    if (this._capturedMinions().length > 0 && Math.random() < 0.20) {
      const mission = this.tryCreateBreakoutMission();
      if (mission) return mission;
    }

    // Chance to spawn "Cover Your Tracks" mission when notoriety > 20
    const coverSpawnBonus = this.getUpgradeEffect('cover-spawn');
    if (this._notoriety() > 20 && Math.random() < this.COVER_TRACKS_CHANCE + coverSpawnBonus) {
      return this.createCoverTracksMission();
    }

    const template = this.pickRandomTemplate();
    const config = TIER_CONFIG[template.tier];

    const levelBonus = 1 + (this.villainLevel() - 1) * GOLD_SCALE_PER_LEVEL;
    let scaledGold = Math.round(config.gold * levelBonus);

    // Mayhem passive: increased Special Op appearance rate
    const mayhemBonus = getPassiveBonus('mayhem', this._departments().mayhem.level);
    const specialOpChance = this.SPECIAL_OP_CHANCE + mayhemBonus * 0.01;
    const isSpecialOp = Math.random() < specialOpChance;
    if (isSpecialOp) {
      scaledGold = Math.round(scaledGold * 1.5);
    }

    const mission: Task = {
      id: crypto.randomUUID(),
      template,
      status: 'queued',
      tier: template.tier,
      goldReward: scaledGold,
      timeToComplete: config.time,
      timeRemaining: config.time,
      clicksRequired: config.clicks,
      clicksRemaining: config.clicks,
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

  private createCoverTracksMission(): Task {
    const coverTracksTemplates: TaskTemplate[] = [
      { name: 'Bribe the Witnesses', description: 'Pay off everyone who saw anything. Reduces notoriety.', category: 'schemes', tier: 'petty' },
      { name: 'Destroy the Evidence', description: 'Shred documents and wipe security footage. Reduces notoriety.', category: 'mayhem', tier: 'petty' },
      { name: 'Forge Alibis', description: 'Create airtight cover stories for your minions. Reduces notoriety.', category: 'schemes', tier: 'sinister' },
      { name: 'Hack Police Database', description: 'Delete your criminal records digitally. Reduces notoriety.', category: 'research', tier: 'sinister' },
      { name: 'Witness Protection Purge', description: 'Eliminate all protected witnesses. Reduces notoriety.', category: 'heists', tier: 'diabolical' },
      { name: 'Deepfake the Evidence', description: 'Replace all incriminating footage with AI fakes. Reduces notoriety.', category: 'research', tier: 'diabolical' },
      { name: 'Rewrite the History Books', description: 'Erase your entire criminal history from all records. Reduces notoriety.', category: 'schemes', tier: 'legendary' },
      { name: 'Memory Wipe Protocol', description: 'Deploy mass amnesia gas across the city. Reduces notoriety.', category: 'mayhem', tier: 'legendary' },
    ];
    // Filter by unlocked department tiers
    const depts = this._departments();
    const available = coverTracksTemplates.filter(t => {
      const deptLevel = depts[t.category as TaskCategory]?.level ?? 1;
      const unlockedTiers = availableTiersForDeptLevel(deptLevel);
      return unlockedTiers.includes(t.tier as TaskTier);
    });
    const pool = available.length > 0 ? available : coverTracksTemplates.slice(0, 2); // fallback to petty
    const template = pool[Math.floor(Math.random() * pool.length)];
    const config = TIER_CONFIG[template.tier];

    return {
      id: crypto.randomUUID(),
      template,
      status: 'queued',
      tier: template.tier,
      goldReward: 0, // No gold, but reduces notoriety
      timeToComplete: Math.floor(config.time * 0.6), // Faster than normal
      timeRemaining: Math.floor(config.time * 0.6),
      clicksRequired: Math.floor(config.clicks * 0.5),
      clicksRemaining: Math.floor(config.clicks * 0.5),
      assignedMinionId: null,
      queuedAt: Date.now(),
      isCoverOp: true,
      assignedQueue: null,
    };
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
    const task = this._departmentQueues()[dept].find(t => t.id === taskId);
    const minion = this._minions().find(m => m.id === minionId);

    let completesAt: number | null = null;
    let durationMs = 0;
    const now = Date.now();
    if (task && minion) {
      const speedMult = this.getMinionSpeedMultiplier(minion, dept);
      durationMs = Math.round((task.timeRemaining / speedMult) * 1000);
      completesAt = now + durationMs;
    }

    this._departmentQueues.update(queues => ({
      ...queues,
      [dept]: queues[dept].map(t =>
        t.id === taskId
          ? { ...t, status: 'in-progress' as TaskStatus, assignedMinionId: minionId, assignedAt: now, completesAt }
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

    if (task && minion) {
      this.events.emit({ type: 'TaskAssigned', taskId, minionId, department: dept, durationMs });
    }
  }

  /** Unassign a minion from a task (e.g., when captured during a raid) */
  private unassignMinionFromTask(minionId: string, taskId: string): void {
    for (const cat of ALL_CATEGORIES) {
      this._departmentQueues.update(queues => ({
        ...queues,
        [cat]: queues[cat].map(t =>
          t.id === taskId
            ? { ...t, status: 'queued' as TaskStatus, assignedMinionId: null, assignedAt: null, completesAt: null }
            : t
        ),
      }));
    }
  }

  private freeMinionFromTask(minionId: string, taskTier: TaskTier, taskCategory: TaskCategory): void {
    const baseXp = this.TIER_XP[taskTier];
    const xpBonus = 1 + this.getUpgradeEffect('minion-xp');
    const xpGain = Math.round(baseXp * xpBonus);

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

  /** Call when a cover-op mission completes */
  private completeCoverOp(taskName: string, tier: TaskTier): void {
    const reduction = COVER_TRACKS_REDUCTION[tier] ?? COVER_TRACKS_REDUCTION.petty;
    const oldNotoriety = this._notoriety();
    this._notoriety.update(n => Math.max(0, n - reduction));
    this._completedCount.update(c => c + 1);
    this.addNotification(`"${taskName}" — notoriety reduced by ${reduction}!`, 'task');
    this.events.emit({
      type: 'ThreatChanged', oldNotoriety, newNotoriety: this._notoriety(),
    });
  }

  // ─── Breakout missions ──────────────────────
  private tryCreateBreakoutMission(): Task | null {
    // Find a captured minion that doesn't already have a breakout mission
    const allTasks = this.activeMissions();
    const existingTargetIds = new Set([
      ...this._missionBoard().filter(m => m.isBreakoutOp).map(m => m.breakoutTargetId),
      ...allTasks.filter(m => m.isBreakoutOp).map(m => m.breakoutTargetId),
    ]);

    const eligible = this._capturedMinions().filter(c => !existingTargetIds.has(c.minion.id));
    if (eligible.length === 0) return null;

    const target = eligible[Math.floor(Math.random() * eligible.length)];
    const tier = this.breakoutTierFromLevel(target.rescueDifficulty);
    const config = TIER_CONFIG[tier];

    return {
      id: crypto.randomUUID(),
      template: {
        name: `Prison Break: ${target.minion.name}`,
        description: `Break ${target.minion.name} out of hero custody before it's too late!`,
        category: 'mayhem',
        tier,
      },
      status: 'queued',
      tier,
      goldReward: 0,
      timeToComplete: config.time,
      timeRemaining: config.time,
      clicksRequired: config.clicks,
      clicksRemaining: config.clicks,
      assignedMinionId: null,
      queuedAt: Date.now(),
      isBreakoutOp: true,
      breakoutTargetId: target.minion.id,
      assignedQueue: null,
    };
  }

  private breakoutTierFromLevel(level: number): TaskTier {
    if (level <= 2) return 'petty';
    if (level <= 4) return 'sinister';
    if (level <= 7) return 'diabolical';
    return 'legendary';
  }

  private completeBreakout(task: Task): void {
    const targetId = task.breakoutTargetId;
    if (!targetId) return;

    const captured = this._capturedMinions().find(c => c.minion.id === targetId);
    if (!captured) return;

    const restoredDept = captured.minion.assignedDepartment ?? captured.minion.specialty;

    // Restore minion with their original department assignment
    this._minions.update(list => [...list, {
      ...captured.minion,
      status: 'idle' as const,
      assignedTaskId: null,
      assignedDepartment: restoredDept,
    }]);
    this._capturedMinions.update(list => list.filter(c => c.minion.id !== targetId));
    this._completedCount.update(c => c + 1);

    // Jailbreaks are loud: +5 bonus notoriety on top of tier notoriety
    const oldNotoriety = this._notoriety();
    const tierNotoriety = NOTORIETY_PER_TIER[task.tier];
    this._notoriety.update(n => Math.min(MAX_NOTORIETY, n + tierNotoriety + 5));

    this.addNotification(`${captured.minion.name} has been broken out! They're back in action!`, 'minion');
    this.events.emit({ type: 'ThreatChanged', oldNotoriety, newNotoriety: this._notoriety() });
    this.events.emit({ type: 'BreakoutCompleted', minionId: targetId, department: restoredDept });
  }

  private awardGold(amount: number, taskName: string, taskTier?: TaskTier, taskCategory?: TaskCategory): void {
    // Apply Heists passive: +gold from all tasks
    const heistsBonus = getPassiveBonus('heists', this._departments().heists.level);
    const boostedAmount = Math.round(amount * (1 + heistsBonus * 0.01));

    // Apply notoriety gold penalty
    const penalty = notorietyGoldPenalty(this._notoriety());
    const finalAmount = Math.round(boostedAmount * (1 - penalty));

    this._gold.update(g => g + finalAmount);
    this._totalGoldEarned.update(g => g + finalAmount);
    const oldVillainLevel = this.villainLevel();
    this._completedCount.update(c => c + 1);
    const newVillainLevel = this.villainLevel();
    if (newVillainLevel > oldVillainLevel) {
      this.events.emit({ type: 'LevelUp', target: 'villain', targetId: 'player', newLevel: newVillainLevel });
    }

    const penaltyNote = penalty > 0 ? ` (${Math.round(penalty * 100)}% heat penalty)` : '';
    this.addNotification(`+${finalAmount}g from "${taskName}"${penaltyNote}`, 'gold');

    // Award department XP
    if (taskTier && taskCategory) {
      this.awardDeptXp(taskCategory, taskTier);
    }

    // Increase notoriety
    if (taskTier) {
      const oldNotoriety = this._notoriety();
      const notGain = NOTORIETY_PER_TIER[taskTier];
      // Research dept reduces notoriety gain: -5% per dept level above 1
      const researchLevel = this._departments().research.level;
      const researchReduction = Math.max(0, (researchLevel - 1) * 0.05);
      // Shadow-ops upgrade reduces notoriety gain
      const shadowOpsReduction = this.getUpgradeEffect('shadow-ops');
      const reducedGain = Math.max(1, Math.round(notGain * (1 - researchReduction) * (1 - shadowOpsReduction)));
      this._notoriety.update(n => Math.min(MAX_NOTORIETY, n + reducedGain));
      this.events.emit({
        type: 'ThreatChanged', oldNotoriety, newNotoriety: this._notoriety(),
      });
    }

    // Award influence from all task completions
    if (taskTier) {
      const influenceGain = INFLUENCE_PER_TIER[taskTier] ?? 0;
      this._influence.update(i => i + influenceGain);
    }

    // Emit task completed event
    if (taskTier && taskCategory) {
      this.events.emit({
        type: 'TaskCompleted',
        taskName, tier: taskTier, category: taskCategory,
        goldEarned: finalAmount, minionId: null,
        isCoverOp: false, isBreakoutOp: false,
      });
    }
  }

  private awardDeptXp(category: TaskCategory, tier: TaskTier): void {
    const baseXp = DEPT_TIER_XP[tier];
    const deptBonus = 1 + this.getUpgradeEffect('dept-xp-boost');
    const xpGain = Math.round(baseXp * deptBonus);
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
}
