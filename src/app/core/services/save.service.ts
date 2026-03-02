import { Injectable, inject } from '@angular/core';
import { GameStateService } from './game-state.service';
import { SaveData, SAVE_VERSION } from '../models/save-data.model';
import { STORAGE_BACKEND } from './storage-backend';

const STORAGE_KEY = 'minion-manager-save';

@Injectable({ providedIn: 'root' })
export class SaveService {
  private readonly gameState = inject(GameStateService);
  private readonly storage = inject(STORAGE_BACKEND);

  save(): void {
    try {
      const snapshot = this.gameState.getSnapshot();
      this.storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }

  load(): boolean {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
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
    return this.storage.getItem(STORAGE_KEY) !== null;
  }

  clearSave(): void {
    this.storage.removeItem(STORAGE_KEY);
  }

  private migrate(data: SaveData): SaveData {
    if (data.version < 2) {
      // v1 → v2: capturedMinions was added (now removed in v5)
      data.version = 2;
    }
    if (data.version < 3) {
      // v2 → v3: Add kanban queues, resources, minion department assignments
      // activeMissions will be migrated into department queues by loadSnapshot
      data.departmentQueues = data.departmentQueues ?? {
        schemes: [], heists: [], research: [], mayhem: [],
      };
      data.playerQueue = data.playerQueue ?? [];
      (data as any).resources = (data as any).resources ?? { supplies: 0, intel: 0 };

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
    if (data.version < 4) {
      // v3 → v4: Resources removed (influence removed in v6)
      delete (data as any).resources;
      data.version = 4;
    }
    if (data.version < 5) {
      // v4 → v5: Remove notoriety system (notoriety, raids, captured minions, cover/breakout ops)
      delete (data as any).notoriety;
      delete (data as any).raidActive;
      delete (data as any).raidTimer;
      delete (data as any).capturedMinions;

      // Strip cover-op and breakout-op tasks from queues and board
      const stripOps = (tasks: any[]) =>
        (tasks ?? []).filter((t: any) => !t.isCoverOp && !t.isBreakoutOp);
      data.missionBoard = stripOps(data.missionBoard);
      data.activeMissions = stripOps(data.activeMissions);
      if (data.departmentQueues) {
        for (const cat of ['schemes', 'heists', 'research', 'mayhem'] as const) {
          data.departmentQueues[cat] = stripOps(data.departmentQueues[cat]);
        }
      }
      data.playerQueue = stripOps(data.playerQueue);

      // Remove notoriety upgrades from saved upgrade levels (legacy field)
      const notorietyUpgradeIds = ['bribe-network', 'shadow-ops', 'cover-spawn', 'lay-low'];
      if ((data as any).upgradeLevels) {
        (data as any).upgradeLevels = (data as any).upgradeLevels.filter(
          (u: any) => !notorietyUpgradeIds.includes(u.id)
        );
      }

      data.version = 5;
    }
    if (data.version < 6) {
      // v5 → v6: Remove influence currency
      delete (data as any).influence;
      data.version = 6;
    }
    if (data.version < 7) {
      // v6 → v7: Quarterly progress added (handled by loadSnapshot defaults)
      data.version = 7;
    }
    if (data.version < 8) {
      // v7 → v8: Year-End reviewer/modifier state added
      data.currentReviewer = data.currentReviewer ?? null;
      data.activeModifiers = data.activeModifiers ?? [];
      data.isRunOver = data.isRunOver ?? false;
      data.version = 8;
    }
    if (data.version < 9) {
      // v8 → v9: Remove upgrades, remove task time fields (scoring overhaul)
      delete (data as any).upgradeLevels;

      // Strip time fields from tasks in all queues
      const stripTimeFields = (tasks: any[]) =>
        (tasks ?? []).map((t: any) => {
          const { timeToComplete, timeRemaining, assignedAt, completesAt, ...rest } = t;
          // Ensure click fields exist
          rest.clicksRemaining = rest.clicksRemaining ?? rest.clicksRequired ?? 12;
          rest.clicksRequired = rest.clicksRequired ?? 12;
          return rest;
        });
      data.missionBoard = stripTimeFields(data.missionBoard);
      data.activeMissions = stripTimeFields(data.activeMissions);
      if (data.departmentQueues) {
        for (const cat of ['schemes', 'heists', 'research', 'mayhem'] as const) {
          data.departmentQueues[cat] = stripTimeFields(data.departmentQueues[cat]);
        }
      }
      data.playerQueue = stripTimeFields(data.playerQueue);
      data.version = 9;
    }
    if (data.version < 10) {
      // v9 → v10: Add voucher levels
      data.ownedVouchers = data.ownedVouchers ?? {};
      data.version = 10;
    }
    if (data.version < 11) {
      // v10 → v11: Add card/joker/rule system
      data.ownedCards = data.ownedCards ?? [];
      data.ownedJokers = data.ownedJokers ?? [];
      data.equippedJokers = data.equippedJokers ?? [];
      data.rules = data.rules ?? [];
      data.version = 11;
    }
    return data;
  }
}
