import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { TaskTier, TaskCategory } from '../models/task.model';

// ─── Event types ──────────────────────────
export interface TaskCompletedEvent {
  type: 'TaskCompleted';
  taskName: string;
  tier: TaskTier;
  category: TaskCategory;
  goldEarned: number;
  minionId: string | null;
  isCoverOp: boolean;
  isBreakoutOp: boolean;
}

export interface MinionIdleEvent {
  type: 'MinionIdle';
  minionId: string;
  department: TaskCategory;
}

export interface ThreatChangedEvent {
  type: 'ThreatChanged';
  oldNotoriety: number;
  newNotoriety: number;
}

export interface BoardRefreshedEvent {
  type: 'BoardRefreshed';
  missionCount: number;
}

export interface MinionCapturedEvent {
  type: 'MinionCaptured';
  minionId: string;
  minionName: string;
}

export interface LevelUpEvent {
  type: 'LevelUp';
  target: 'minion' | 'department' | 'villain';
  targetId: string;
  newLevel: number;
}

export interface SpecialOpSpawnedEvent {
  type: 'SpecialOpSpawned';
  missionId: string;
  tier: TaskTier;
}

export interface RaidStartedEvent {
  type: 'RaidStarted';
}

export interface RaidEndedEvent {
  type: 'RaidEnded';
  defended: boolean;
}

export interface TaskQueuedEvent {
  type: 'TaskQueued';
  taskId: string;
  department: TaskCategory | 'player';
}

export interface TaskAssignedEvent {
  type: 'TaskAssigned';
  taskId: string;
  minionId: string;
  department: TaskCategory;
  durationMs: number;
}

export interface MinionHiredEvent {
  type: 'MinionHired';
  minionId: string;
  department: TaskCategory;
}

export interface MinionReassignedEvent {
  type: 'MinionReassigned';
  minionId: string;
  fromDepartment: TaskCategory;
  toDepartment: TaskCategory;
}

export interface UpgradePurchasedEvent {
  type: 'UpgradePurchased';
  upgradeId: string;
  newLevel: number;
}

export interface BreakoutCompletedEvent {
  type: 'BreakoutCompleted';
  minionId: string;
  department: TaskCategory;
}

export type GameEvent =
  | TaskCompletedEvent
  | MinionIdleEvent
  | ThreatChangedEvent
  | BoardRefreshedEvent
  | MinionCapturedEvent
  | LevelUpEvent
  | SpecialOpSpawnedEvent
  | RaidStartedEvent
  | RaidEndedEvent
  | TaskQueuedEvent
  | TaskAssignedEvent
  | MinionHiredEvent
  | MinionReassignedEvent
  | UpgradePurchasedEvent
  | BreakoutCompletedEvent;

@Injectable({ providedIn: 'root' })
export class GameEventService {
  private readonly eventSubject = new Subject<GameEvent>();

  /** Observable stream of all game events */
  readonly events$: Observable<GameEvent> = this.eventSubject.asObservable();

  /** Emit a game event */
  emit(event: GameEvent): void {
    this.eventSubject.next(event);
  }

  /** Get a filtered observable for a specific event type */
  on<T extends GameEvent['type']>(
    type: T
  ): Observable<Extract<GameEvent, { type: T }>> {
    return new Observable(subscriber => {
      const sub = this.eventSubject.subscribe(event => {
        if (event.type === type) {
          subscriber.next(event as Extract<GameEvent, { type: T }>);
        }
      });
      return () => sub.unsubscribe();
    });
  }
}
