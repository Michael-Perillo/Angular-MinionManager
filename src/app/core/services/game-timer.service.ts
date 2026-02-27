import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameStateService } from './game-state.service';
import { GameEventService } from './game-event.service';
import { SaveService } from './save.service';
import { TaskCategory } from '../models/task.model';

const ALL_CATEGORIES: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];

@Injectable({ providedIn: 'root' })
export class GameTimerService implements OnDestroy {
  private readonly gameState = inject(GameStateService);
  private readonly events = inject(GameEventService);
  private readonly saveService = inject(SaveService);

  private notorietyDecayInterval: ReturnType<typeof setInterval> | null = null;
  private notificationCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private boardRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
  private specialOpTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private taskTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private raidStartSub: Subscription | null = null;
  private raidEndSub: Subscription | null = null;
  private specialOpSub: Subscription | null = null;
  private upgradeSub: Subscription | null = null;
  private levelUpSub: Subscription | null = null;
  private taskAssignedSub: Subscription | null = null;
  private minionCapturedSub: Subscription | null = null;

  private raidCheckInterval: ReturnType<typeof setInterval> | null = null;
  private raidCountdownInterval: ReturnType<typeof setInterval> | null = null;
  private prisonTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private breakoutSub: Subscription | null = null;
  private autoAssignSubs: Subscription[] = [];
  private autoAssignPending = false;

  start(): void {
    this.startNotorietyDecay();
    this.startNotificationCleanup();
    this.startAutoSave();
    this.scheduleBoardRefresh();
    this.scheduleExistingSpecialOps();
    this.scheduleExistingTaskTimers();

    if (this.gameState.raidActive()) {
      this.stopNotorietyDecay();
      this.startRaidCountdown();
    } else {
      this.startRaidCheck();
    }
    this.scheduleExistingPrisonTimers();

    // Pause notoriety decay during raids, manage raid countdown
    this.raidStartSub = this.events.on('RaidStarted').subscribe(() => {
      this.stopNotorietyDecay();
      this.stopRaidCheck();
      this.startRaidCountdown();
    });
    this.raidEndSub = this.events.on('RaidEnded').subscribe(() => {
      this.stopRaidCountdown();
      this.startNotorietyDecay();
      this.startRaidCheck();
    });

    // On capture: cancel task timer + schedule prison expiry
    this.minionCapturedSub = this.events.on('MinionCaptured').subscribe(e => {
      this.cancelTaskTimerForMinion(e.minionId);
      this.schedulePrisonExpiry(e.minionId);
    });

    // Cancel prison timer on breakout
    this.breakoutSub = this.events.on('BreakoutCompleted').subscribe(e => {
      this.cancelPrisonTimer(e.minionId);
    });

    // Schedule special op expiry timers
    this.specialOpSub = this.events.on('SpecialOpSpawned').subscribe(e => {
      this.scheduleSpecialOpExpiry(e.missionId);
    });

    // Schedule task completion timers
    this.taskAssignedSub = this.events.on('TaskAssigned').subscribe(e => {
      this.scheduleTaskCompletion(e.taskId, e.department, e.durationMs);
    });

    // Auto-assign on relevant events (debounced via microtask)
    const autoAssignEvents: Array<'MinionIdle' | 'TaskQueued' | 'MinionHired' | 'MinionReassigned' | 'BreakoutCompleted'> =
      ['MinionIdle', 'TaskQueued', 'MinionHired', 'MinionReassigned', 'BreakoutCompleted'];
    for (const eventType of autoAssignEvents) {
      this.autoAssignSubs.push(
        this.events.on(eventType).subscribe(() => this.debouncedAutoAssign())
      );
    }

    // Recalculate board refresh when upgrades/levels change
    this.upgradeSub = this.events.on('UpgradePurchased').subscribe(e => {
      if (e.upgradeId === 'board-refresh') {
        this.rescheduleBoardRefresh();
      }
    });
    this.levelUpSub = this.events.on('LevelUp').subscribe(e => {
      if (e.target === 'department' && e.targetId === 'schemes') {
        this.rescheduleBoardRefresh();
      }
    });
  }

  stop(): void {
    this.stopNotorietyDecay();
    this.stopNotificationCleanup();
    this.stopAutoSave();
    this.stopBoardRefresh();
    this.clearAllSpecialOpTimers();
    this.clearAllTaskTimers();
    this.stopRaidCheck();
    this.stopRaidCountdown();
    this.clearAllPrisonTimers();
    this.raidStartSub?.unsubscribe();
    this.raidStartSub = null;
    this.raidEndSub?.unsubscribe();
    this.raidEndSub = null;
    this.specialOpSub?.unsubscribe();
    this.specialOpSub = null;
    this.upgradeSub?.unsubscribe();
    this.upgradeSub = null;
    this.levelUpSub?.unsubscribe();
    this.levelUpSub = null;
    this.taskAssignedSub?.unsubscribe();
    this.taskAssignedSub = null;
    this.minionCapturedSub?.unsubscribe();
    this.minionCapturedSub = null;
    this.breakoutSub?.unsubscribe();
    this.breakoutSub = null;
    for (const sub of this.autoAssignSubs) sub.unsubscribe();
    this.autoAssignSubs = [];
  }

  restartTimers(): void {
    this.stop();
    this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // ─── Board refresh ────────────────────
  private scheduleBoardRefresh(): void {
    this.stopBoardRefresh();
    const interval = this.gameState.getEffectiveBoardRefreshInterval();
    this.boardRefreshTimeout = setTimeout(() => {
      this.gameState.refreshBoard();
      this.scheduleBoardRefresh(); // self-reschedule
    }, interval);
  }

  private rescheduleBoardRefresh(): void {
    this.scheduleBoardRefresh();
  }

  private stopBoardRefresh(): void {
    if (this.boardRefreshTimeout) {
      clearTimeout(this.boardRefreshTimeout);
      this.boardRefreshTimeout = null;
    }
  }

  // ─── Special op expiry ────────────────
  private scheduleSpecialOpExpiry(missionId: string): void {
    const board = this.gameState.missionBoard();
    const mission = board.find(m => m.id === missionId);
    if (!mission?.specialOpExpiry) return;

    const remaining = mission.specialOpExpiry - Date.now();
    if (remaining <= 0) {
      this.gameState.removeExpiredSpecialOp(missionId);
      return;
    }

    const timer = setTimeout(() => {
      this.gameState.removeExpiredSpecialOp(missionId);
      this.specialOpTimers.delete(missionId);
    }, remaining);
    this.specialOpTimers.set(missionId, timer);
  }

  private scheduleExistingSpecialOps(): void {
    const board = this.gameState.missionBoard();
    for (const mission of board) {
      if (mission.isSpecialOp && mission.specialOpExpiry) {
        this.scheduleSpecialOpExpiry(mission.id);
      }
    }
  }

  private clearAllSpecialOpTimers(): void {
    for (const timer of this.specialOpTimers.values()) {
      clearTimeout(timer);
    }
    this.specialOpTimers.clear();
  }

  // ─── Auto-assign (debounced) ──────────
  private debouncedAutoAssign(): void {
    if (this.autoAssignPending) return;
    this.autoAssignPending = true;
    queueMicrotask(() => {
      this.autoAssignPending = false;
      this.gameState.autoAssignMinions();
    });
  }

  // ─── Raid system ──────────────────────
  private startRaidCheck(): void {
    if (this.raidCheckInterval) return;
    this.raidCheckInterval = setInterval(() => {
      this.gameState.checkRaidTrigger();
    }, 1000);
  }

  private stopRaidCheck(): void {
    if (this.raidCheckInterval) {
      clearInterval(this.raidCheckInterval);
      this.raidCheckInterval = null;
    }
  }

  private startRaidCountdown(): void {
    if (this.raidCountdownInterval) return;
    this.raidCountdownInterval = setInterval(() => {
      this.gameState.processRaidCountdown(Date.now());
    }, 1000);
  }

  private stopRaidCountdown(): void {
    if (this.raidCountdownInterval) {
      clearInterval(this.raidCountdownInterval);
      this.raidCountdownInterval = null;
    }
  }

  // ─── Prison expiry ───────────────────
  private schedulePrisonExpiry(minionId: string): void {
    const captured = this.gameState.capturedMinions().find(c => c.minion.id === minionId);
    if (!captured) return;

    const remaining = captured.expiresAt - Date.now();
    if (remaining <= 0) {
      this.gameState.processPrisonExpiry(Date.now());
      return;
    }

    const timer = setTimeout(() => {
      this.gameState.processPrisonExpiry(Date.now());
      this.prisonTimers.delete(minionId);
    }, remaining);
    this.prisonTimers.set(minionId, timer);
  }

  private cancelPrisonTimer(minionId: string): void {
    const timer = this.prisonTimers.get(minionId);
    if (timer) {
      clearTimeout(timer);
      this.prisonTimers.delete(minionId);
    }
  }

  private scheduleExistingPrisonTimers(): void {
    for (const captured of this.gameState.capturedMinions()) {
      this.schedulePrisonExpiry(captured.minion.id);
    }
  }

  private clearAllPrisonTimers(): void {
    for (const timer of this.prisonTimers.values()) {
      clearTimeout(timer);
    }
    this.prisonTimers.clear();
  }

  // ─── Task completion timers ────────────
  private scheduleTaskCompletion(taskId: string, dept: TaskCategory, durationMs: number): void {
    // Cancel any existing timer for this task
    const existing = this.taskTimers.get(taskId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.gameState.completeTaskByTimer(taskId, dept);
      this.taskTimers.delete(taskId);
    }, durationMs);
    this.taskTimers.set(taskId, timer);
  }

  private cancelTaskTimerForMinion(minionId: string): void {
    const queues = this.gameState.departmentQueues();
    for (const dept of ALL_CATEGORIES) {
      for (const task of queues[dept]) {
        if (task.assignedMinionId === minionId && this.taskTimers.has(task.id)) {
          clearTimeout(this.taskTimers.get(task.id)!);
          this.taskTimers.delete(task.id);
        }
      }
    }
  }

  private scheduleExistingTaskTimers(): void {
    const queues = this.gameState.departmentQueues();
    for (const dept of ALL_CATEGORIES) {
      for (const task of queues[dept]) {
        if (task.status === 'in-progress' && task.assignedMinionId) {
          const minion = this.gameState.minions().find(m => m.id === task.assignedMinionId);
          if (minion) {
            const durationMs = Math.max(100, Math.round(task.timeRemaining * 1000));
            const now = Date.now();
            this.gameState.setTaskTimingInfo(task.id, dept, now, now + durationMs);
            this.scheduleTaskCompletion(task.id, dept, durationMs);
          }
        }
      }
    }
  }

  private clearAllTaskTimers(): void {
    for (const timer of this.taskTimers.values()) {
      clearTimeout(timer);
    }
    this.taskTimers.clear();
  }

  // ─── Notoriety decay ─────────────────
  private startNotorietyDecay(): void {
    if (this.notorietyDecayInterval) return;
    this.notorietyDecayInterval = setInterval(() => {
      this.gameState.processNotorietyDecay();
    }, 1000);
  }

  private stopNotorietyDecay(): void {
    if (this.notorietyDecayInterval) {
      clearInterval(this.notorietyDecayInterval);
      this.notorietyDecayInterval = null;
    }
  }

  // ─── Notification cleanup ────────────
  private startNotificationCleanup(): void {
    if (this.notificationCleanupInterval) return;
    this.notificationCleanupInterval = setInterval(() => {
      this.gameState.cleanNotifications(Date.now());
    }, 1000);
  }

  private stopNotificationCleanup(): void {
    if (this.notificationCleanupInterval) {
      clearInterval(this.notificationCleanupInterval);
      this.notificationCleanupInterval = null;
    }
  }

  // ─── Auto-save ───────────────────────
  private startAutoSave(): void {
    if (this.autoSaveInterval) return;
    this.autoSaveInterval = setInterval(() => {
      this.saveService.save();
      this.gameState.markSaved();
    }, 30_000);
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}
