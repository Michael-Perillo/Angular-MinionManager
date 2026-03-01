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
}

export interface MinionIdleEvent {
  type: 'MinionIdle';
  minionId: string;
  department: TaskCategory;
}

export interface BoardRefreshedEvent {
  type: 'BoardRefreshed';
  missionCount: number;
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

export interface QuarterCompletedEvent {
  type: 'QuarterCompleted';
  year: number;
  quarter: 1 | 2 | 3 | 4;
  passed: boolean;
  goldEarned: number;
  target: number;
}

export type GameEvent =
  | TaskCompletedEvent
  | MinionIdleEvent
  | BoardRefreshedEvent
  | LevelUpEvent
  | SpecialOpSpawnedEvent
  | TaskQueuedEvent
  | TaskAssignedEvent
  | MinionHiredEvent
  | MinionReassignedEvent
  | UpgradePurchasedEvent
  | QuarterCompletedEvent;

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
