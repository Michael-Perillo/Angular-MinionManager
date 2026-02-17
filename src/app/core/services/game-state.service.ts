import { Injectable, computed, signal } from '@angular/core';
import {
  Task, TaskStatus, TaskTier, TIER_CONFIG, TaskTemplate,
} from '../models/task.model';
import {
  Minion, MinionAppearance, MINION_NAMES, MINION_COLORS, MINION_ACCESSORIES,
} from '../models/minion.model';
import { GameNotification } from '../models/game-state.model';
import { TASK_POOL } from '../models/task-pool';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  // ─── State signals ─────────────────────────
  private readonly _gold = signal(0);
  private readonly _minions = signal<Minion[]>([]);
  private readonly _taskQueue = signal<Task[]>([]);
  private readonly _completedCount = signal(0);
  private readonly _totalGoldEarned = signal(0);
  private readonly _notifications = signal<GameNotification[]>([]);

  // ─── Public read-only signals ──────────────
  readonly gold = this._gold.asReadonly();
  readonly minions = this._minions.asReadonly();
  readonly taskQueue = this._taskQueue.asReadonly();
  readonly completedCount = this._completedCount.asReadonly();
  readonly totalGoldEarned = this._totalGoldEarned.asReadonly();
  readonly notifications = this._notifications.asReadonly();

  // ─── Computed signals ──────────────────────
  readonly idleMinions = computed(() =>
    this._minions().filter(m => m.status === 'idle')
  );

  readonly workingMinions = computed(() =>
    this._minions().filter(m => m.status === 'working')
  );

  readonly nextMinionCost = computed(() =>
    Math.floor(50 * Math.pow(1.5, this._minions().length))
  );

  readonly canHireMinion = computed(() =>
    this._gold() >= this.nextMinionCost()
  );

  readonly queuedTasks = computed(() =>
    this._taskQueue().filter(t => t.status === 'queued')
  );

  readonly inProgressTasks = computed(() =>
    this._taskQueue().filter(t => t.status === 'in-progress')
  );

  // ─── Constants ─────────────────────────────
  private readonly QUEUE_CAPACITY = 5;
  private readonly TASK_EXPIRE_TIME = 60_000; // 60s in ms
  private readonly SPAWN_MIN = 8_000;
  private readonly SPAWN_MAX = 12_000;

  private lastSpawnTime = 0;
  private nextSpawnDelay = 0;
  private usedNameIndices = new Set<number>();

  // ─── Game lifecycle ────────────────────────
  initializeGame(): void {
    this._gold.set(0);
    this._minions.set([]);
    this._taskQueue.set([]);
    this._completedCount.set(0);
    this._totalGoldEarned.set(0);
    this._notifications.set([]);
    this.usedNameIndices.clear();
    this.lastSpawnTime = Date.now();
    this.nextSpawnDelay = this.randomSpawnDelay();

    // Seed initial queue with 3 tasks
    for (let i = 0; i < 3; i++) {
      this.spawnTask();
    }
  }

  resetGame(): void {
    this.initializeGame();
  }

  /** Add gold directly (useful for testing / debug) */
  addGold(amount: number): void {
    this._gold.update(g => g + amount);
  }

  // ─── Manual work (clicking) ────────────────
  clickTask(taskId: string): void {
    this._taskQueue.update(queue =>
      queue.map(task => {
        if (task.id !== taskId) return task;
        if (task.status === 'complete') return task;
        if (task.assignedMinionId) return task; // minion is working it

        const newClicks = task.clicksRemaining - 1;
        if (newClicks <= 0) {
          // Complete the task
          this.awardGold(task.goldReward, task.template.name);
          return { ...task, status: 'complete' as TaskStatus, clicksRemaining: 0 };
        }
        return {
          ...task,
          status: 'in-progress' as TaskStatus,
          clicksRemaining: newClicks,
        };
      })
    );

    // Remove completed tasks
    this.cleanCompletedTasks();
  }

  // ─── Hire minion ───────────────────────────
  hireMinion(): void {
    const cost = this.nextMinionCost();
    if (this._gold() < cost) return;

    this._gold.update(g => g - cost);
    const minion = this.createMinion();
    this._minions.update(list => [...list, minion]);

    this.addNotification(`${minion.name} has joined your evil crew!`, 'minion');
  }

  // ─── Tick (called every 1s) ────────────────
  tickTime(): void {
    const now = Date.now();

    // 1. Decrement timers for minion-worked tasks
    this._taskQueue.update(queue =>
      queue.map(task => {
        if (task.status !== 'in-progress' || !task.assignedMinionId) return task;
        const newTime = task.timeRemaining - 1;
        if (newTime <= 0) {
          this.awardGold(task.goldReward, task.template.name);
          this.freeMinionFromTask(task.assignedMinionId);
          return { ...task, status: 'complete' as TaskStatus, timeRemaining: 0 };
        }
        return { ...task, timeRemaining: newTime };
      })
    );

    // 2. Remove completed tasks
    this.cleanCompletedTasks();

    // 3. Expire stale queued tasks (60s without being started)
    this._taskQueue.update(queue =>
      queue.filter(task => {
        if (task.status !== 'queued') return true;
        return (now - task.queuedAt) < this.TASK_EXPIRE_TIME;
      })
    );

    // 4. Spawn new tasks if queue has room
    if (now - this.lastSpawnTime >= this.nextSpawnDelay) {
      if (this._taskQueue().length < this.QUEUE_CAPACITY) {
        this.spawnTask();
      }
      this.lastSpawnTime = now;
      this.nextSpawnDelay = this.randomSpawnDelay();
    }

    // 5. Auto-assign idle minions to highest-tier queued tasks
    this.autoAssignMinions();

    // 6. Clean old notifications
    this._notifications.update(list =>
      list.filter(n => now - n.timestamp < 4000)
    );
  }

  dismissNotification(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  // ─── Private helpers ───────────────────────
  private spawnTask(): void {
    const template = this.pickRandomTemplate();
    const config = TIER_CONFIG[template.tier];
    const task: Task = {
      id: crypto.randomUUID(),
      template,
      status: 'queued',
      tier: template.tier,
      goldReward: config.gold,
      timeToComplete: config.time,
      timeRemaining: config.time,
      clicksRequired: config.clicks,
      clicksRemaining: config.clicks,
      assignedMinionId: null,
      queuedAt: Date.now(),
    };
    this._taskQueue.update(queue => [...queue, task]);
  }

  private pickRandomTemplate(): TaskTemplate {
    // Weight: more petty tasks early, but always a mix
    const tierWeights: Record<TaskTier, number> = {
      petty: 50,
      sinister: 35,
      diabolical: 15,
    };

    const roll = Math.random() * 100;
    let tier: TaskTier;
    if (roll < tierWeights.petty) tier = 'petty';
    else if (roll < tierWeights.petty + tierWeights.sinister) tier = 'sinister';
    else tier = 'diabolical';

    const candidates = TASK_POOL.filter(t => t.tier === tier);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private autoAssignMinions(): void {
    const idle = this.idleMinions();
    if (idle.length === 0) return;

    const queued = this.queuedTasks();
    if (queued.length === 0) return;

    // Sort queued tasks by tier priority: diabolical > sinister > petty
    const tierPriority: Record<TaskTier, number> = {
      diabolical: 3,
      sinister: 2,
      petty: 1,
    };
    const sorted = [...queued].sort(
      (a, b) => tierPriority[b.tier] - tierPriority[a.tier]
    );

    const assignCount = Math.min(idle.length, sorted.length);
    for (let i = 0; i < assignCount; i++) {
      const minion = idle[i];
      const task = sorted[i];
      this.assignMinionToTask(minion.id, task.id);
    }
  }

  private assignMinionToTask(minionId: string, taskId: string): void {
    this._taskQueue.update(queue =>
      queue.map(t =>
        t.id === taskId
          ? { ...t, status: 'in-progress' as TaskStatus, assignedMinionId: minionId }
          : t
      )
    );
    this._minions.update(list =>
      list.map(m =>
        m.id === minionId
          ? { ...m, status: 'working' as const, assignedTaskId: taskId }
          : m
      )
    );
  }

  private freeMinionFromTask(minionId: string): void {
    this._minions.update(list =>
      list.map(m =>
        m.id === minionId
          ? { ...m, status: 'idle' as const, assignedTaskId: null }
          : m
      )
    );
  }

  private awardGold(amount: number, taskName: string): void {
    this._gold.update(g => g + amount);
    this._totalGoldEarned.update(g => g + amount);
    this._completedCount.update(c => c + 1);
    this.addNotification(`+${amount}g from "${taskName}"`, 'gold');
  }

  private cleanCompletedTasks(): void {
    this._taskQueue.update(queue =>
      queue.filter(t => t.status !== 'complete')
    );
  }

  private createMinion(): Minion {
    const name = this.pickMinionName();
    const color = MINION_COLORS[Math.floor(Math.random() * MINION_COLORS.length)];
    const accessory = MINION_ACCESSORIES[Math.floor(Math.random() * MINION_ACCESSORIES.length)];

    return {
      id: crypto.randomUUID(),
      name,
      appearance: { color, accessory } as MinionAppearance,
      status: 'idle',
      assignedTaskId: null,
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

  private randomSpawnDelay(): number {
    return this.SPAWN_MIN + Math.random() * (this.SPAWN_MAX - this.SPAWN_MIN);
  }
}
