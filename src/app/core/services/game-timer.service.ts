import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameStateService } from './game-state.service';
import { GameEventService } from './game-event.service';
import { SaveService } from './save.service';

@Injectable({ providedIn: 'root' })
export class GameTimerService implements OnDestroy {
  private readonly gameState = inject(GameStateService);
  private readonly events = inject(GameEventService);
  private readonly saveService = inject(SaveService);

  private notificationCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private boardRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
  private minionClickInterval: ReturnType<typeof setInterval> | null = null;
  private specialOpTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private specialOpSub: Subscription | null = null;
  private levelUpSub: Subscription | null = null;
  private autoAssignSubs: Subscription[] = [];
  private autoAssignPending = false;

  start(): void {
    this.startNotificationCleanup();
    this.startAutoSave();
    this.scheduleBoardRefresh();
    this.scheduleExistingSpecialOps();
    this.startMinionClickInterval();

    // Schedule special op expiry timers
    this.specialOpSub = this.events.on('SpecialOpSpawned').subscribe(e => {
      this.scheduleSpecialOpExpiry(e.missionId);
    });

    // Auto-assign on relevant events (debounced via microtask)
    const autoAssignEvents: Array<'MinionIdle' | 'TaskQueued' | 'MinionHired' | 'MinionReassigned'> =
      ['MinionIdle', 'TaskQueued', 'MinionHired', 'MinionReassigned'];
    for (const eventType of autoAssignEvents) {
      this.autoAssignSubs.push(
        this.events.on(eventType).subscribe(() => this.debouncedAutoAssign())
      );
    }

    // Recalculate board refresh when Schemes dept levels up
    this.levelUpSub = this.events.on('LevelUp').subscribe(e => {
      if (e.target === 'department' && e.targetId === 'schemes') {
        this.rescheduleBoardRefresh();
      }
    });
  }

  stop(): void {
    this.stopNotificationCleanup();
    this.stopAutoSave();
    this.stopBoardRefresh();
    this.stopMinionClickInterval();
    this.clearAllSpecialOpTimers();
    this.specialOpSub?.unsubscribe();
    this.specialOpSub = null;
    this.levelUpSub?.unsubscribe();
    this.levelUpSub = null;
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

  // ─── Minion click interval (1s) ────────
  private startMinionClickInterval(): void {
    if (this.minionClickInterval) return;
    this.minionClickInterval = setInterval(() => {
      this.gameState.processMinionClicks();
    }, 1000);
  }

  private stopMinionClickInterval(): void {
    if (this.minionClickInterval) {
      clearInterval(this.minionClickInterval);
      this.minionClickInterval = null;
    }
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
