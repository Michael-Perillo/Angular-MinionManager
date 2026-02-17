import { Minion } from './minion.model';
import { Task } from './task.model';

export interface GameState {
  gold: number;
  minions: Minion[];
  taskQueue: Task[];
  completedCount: number;
  totalGoldEarned: number;
}

export interface GameNotification {
  id: string;
  message: string;
  type: 'gold' | 'minion' | 'task';
  timestamp: number;
}
