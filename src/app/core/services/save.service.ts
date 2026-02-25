import { Injectable, inject } from '@angular/core';
import { GameStateService } from './game-state.service';
import { SaveData } from '../models/save-data.model';

const STORAGE_KEY = 'minion-manager-save';
const CURRENT_VERSION = 3;

@Injectable({ providedIn: 'root' })
export class SaveService {
  private readonly gameState = inject(GameStateService);

  constructor() {
    window.addEventListener('beforeunload', () => this.save());
  }

  save(): void {
    try {
      const snapshot = this.gameState.getSnapshot();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // localStorage full or unavailable — silently fail
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      let data: SaveData = JSON.parse(raw);
      data = this.migrate(data);
      this.gameState.loadSnapshot(data);
      return true;
    } catch {
      return false;
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  clearSave(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private migrate(data: SaveData): SaveData {
    if (data.version < 2) {
      data.capturedMinions = data.capturedMinions ?? [];
      data.version = 2;
    }
    if (data.version < 3) {
      // v2 → v3: Add kanban queues, resources, minion department assignments
      // activeMissions will be migrated into department queues by loadSnapshot
      data.departmentQueues = data.departmentQueues ?? {
        schemes: [], heists: [], research: [], mayhem: [],
      };
      data.playerQueue = data.playerQueue ?? [];
      data.resources = data.resources ?? { supplies: 0, intel: 0 };

      // Ensure all minions have assignedDepartment (default to specialty)
      if (data.minions) {
        data.minions = data.minions.map(m => ({
          ...m,
          assignedDepartment: (m as any).assignedDepartment ?? m.specialty,
        }));
      }

      // Ensure all tasks have assignedQueue
      if (data.activeMissions) {
        data.activeMissions = data.activeMissions.map(t => ({
          ...t,
          assignedQueue: (t as any).assignedQueue ?? t.template.category,
        }));
      }

      data.version = 3;
    }
    return data;
  }
}
