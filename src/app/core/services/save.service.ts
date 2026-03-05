import { Injectable, inject } from '@angular/core';
import { GameStateService } from './game-state.service';
import { SaveData, SAVE_VERSION } from '../models/save-data.model';
import { STORAGE_BACKEND } from './storage-backend';
import { rollHireOptions, ALL_ARCHETYPE_IDS } from '../models/minion.model';

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
      (data as any).playerQueue = (data as any).playerQueue ?? [];
      (data as any).resources = (data as any).resources ?? { supplies: 0, intel: 0 };

      // Ensure all minions have assignedDepartment (default to specialty)
      if (data.minions) {
        data.minions = data.minions.map(m => ({
          ...m,
          assignedDepartment: (m as any).assignedDepartment ?? (m as any).specialty,
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
      (data as any).playerQueue = stripOps((data as any).playerQueue);

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
      (data as any).playerQueue = stripTimeFields((data as any).playerQueue);
      data.version = 9;
    }
    if (data.version < 10) {
      // v9 → v10: Add voucher levels
      data.ownedVouchers = data.ownedVouchers ?? {};
      data.version = 10;
    }
    if (data.version < 11) {
      // v10 → v11: Add card/joker/rule system
      (data as any).ownedCards = (data as any).ownedCards ?? [];
      (data as any).ownedJokers = (data as any).ownedJokers ?? [];
      (data as any).equippedJokers = (data as any).equippedJokers ?? [];
      (data as any).rules = (data as any).rules ?? [];
      data.version = 11;
    }
    if (data.version < 12) {
      // v11 → v12: Scouting + dept unlock vouchers + minion roles
      // Convert existing unlockedDepartments → set unlock vouchers
      const vouchers = (data.ownedVouchers ?? {}) as Record<string, number>;
      if (data.unlockedDepartments) {
        for (const dept of data.unlockedDepartments) {
          const voucherId = `unlock-${dept}`;
          if (!vouchers[voucherId]) {
            vouchers[voucherId] = 1;
          }
        }
      }
      data.ownedVouchers = vouchers;
      delete data.unlockedDepartments;

      // Add role: 'worker' to all minions
      if (data.minions) {
        data.minions = data.minions.map(m => ({
          ...m,
          role: (m as any).role ?? 'worker',
        }));
      }

      // Strip lastBoardRefresh (field removed)
      delete (data as any).lastBoardRefresh;

      data.version = 12;
    }
    if (data.version < 13) {
      // v12 → v13: Remove efficiency stat, add deptXp, nullable specialty/assignedDepartment
      if (data.minions) {
        data.minions = data.minions.map((m: any) => {
          const { efficiency, ...restStats } = m.stats ?? {};
          return {
            ...m,
            stats: restStats.speed != null ? { speed: restStats.speed } : { speed: 1.0 },
            deptXp: m.deptXp ?? { schemes: 0, heists: 0, research: 0, mayhem: 0 },
          };
        });
      }
      data.version = 13;
    }
    if (data.version < 14) {
      // v13 → v14: Balance overhaul — Base x Mult economy
      // Remove workbenchScoutTask (scouting is now instant)
      delete (data as any).workbenchScoutTask;

      // Remove specialOpExpiry from all tasks (special ops no longer expire)
      const stripExpiry = (tasks: any[]) =>
        (tasks ?? []).map((t: any) => {
          const { specialOpExpiry, ...rest } = t;
          return rest;
        });
      data.missionBoard = stripExpiry(data.missionBoard);
      if (data.departmentQueues) {
        for (const cat of ['schemes', 'heists', 'research', 'mayhem'] as const) {
          data.departmentQueues[cat] = stripExpiry(data.departmentQueues[cat]);
        }
      }
      (data as any).playerQueue = stripExpiry((data as any).playerQueue);

      // Remove scout tasks from department queues (scouting no longer uses task objects)
      if (data.departmentQueues) {
        for (const cat of ['schemes', 'heists', 'research', 'mayhem'] as const) {
          data.departmentQueues[cat] = (data.departmentQueues[cat] ?? []).filter(
            (t: any) => !t.isScoutTask
          );
        }
      }

      // Remove rapid-intel and scout-expansion from owned vouchers
      if (data.ownedVouchers) {
        delete (data.ownedVouchers as any)['rapid-intel'];
        delete (data.ownedVouchers as any)['scout-expansion'];
      }

      // Add default dept tier unlocks (petty for all)
      data.deptTierUnlocks = {
        schemes: ['petty'],
        heists: ['petty'],
        research: ['petty'],
        mayhem: ['petty'],
      };

      // Recalculate gold rewards on existing tasks to use new TIER_CONFIG
      const TIER_BASE: Record<string, number> = { petty: 2, sinister: 5, diabolical: 12, legendary: 30 };
      const recalcGold = (tasks: any[]) =>
        (tasks ?? []).map((t: any) => ({
          ...t,
          goldReward: TIER_BASE[t.tier] ?? t.goldReward,
        }));
      data.missionBoard = recalcGold(data.missionBoard);
      if (data.departmentQueues) {
        for (const cat of ['schemes', 'heists', 'research', 'mayhem'] as const) {
          data.departmentQueues[cat] = recalcGold(data.departmentQueues[cat]);
        }
      }
      (data as any).playerQueue = recalcGold((data as any).playerQueue);

      data.version = 14;
    }
    if (data.version < 15) {
      // v14 → v15: Scheme deck system + department mechanics
      // Initialize scheme deck (empty — will be rebuilt on load)
      data.schemeDeck = data.schemeDeck ?? [];

      // Ensure quarterProgress has new fields
      if (data.quarterProgress) {
        const qp = data.quarterProgress as any;
        qp.dismissalsRemaining = qp.dismissalsRemaining ?? 5;
        qp.researchCompleted = qp.researchCompleted ?? 0;
        qp.activeBreakthroughs = qp.activeBreakthroughs ?? 0;
      }

      // Clear mission board (will be redrawn from deck)
      data.missionBoard = [];

      // Strip isScoutTask and scout role from minions
      if (data.minions) {
        data.minions = data.minions.map((m: any) => ({
          ...m,
          role: m.role === 'scout' ? 'worker' : m.role,
        }));
      }

      data.version = 15;
    }
    if (data.version < 16) {
      // v15 → v16: Remove automation engine (cards, rules, playerQueue)
      delete (data as any).ownedCards;
      delete (data as any).rules;

      // Merge playerQueue into schemes dept queue
      const playerQueue = (data as any).playerQueue ?? [];
      if (playerQueue.length > 0 && data.departmentQueues) {
        data.departmentQueues.schemes = [
          ...(data.departmentQueues.schemes ?? []),
          ...playerQueue.map((t: any) => ({ ...t, assignedQueue: 'schemes' })),
        ];
      }
      delete (data as any).playerQueue;

      // Replace rule-mastery voucher with dismissal-expert
      if (data.ownedVouchers) {
        delete (data.ownedVouchers as any)['rule-mastery'];
      }

      // Remove unlock-schemes voucher (schemes is always unlocked now)
      // Keep the voucher entry but it's no longer needed for gating

      data.version = 16;
    }
    if (data.version < 17) {
      // v16 → v17: Replace jokers with archetype system, remove minion XP/level/specialty
      // Strip joker fields
      delete (data as any).ownedJokers;
      delete (data as any).equippedJokers;

      // Convert minions to archetype-based format
      if (data.minions) {
        data.minions = data.minions.map((m: any) => {
          // Pick a random archetype for legacy minions
          const archetypeId = ALL_ARCHETYPE_IDS[Math.floor(Math.random() * ALL_ARCHETYPE_IDS.length)];
          return {
            id: m.id,
            archetypeId,
            role: m.role === 'manager' ? 'manager' : 'worker',
            status: m.status ?? 'idle',
            assignedTaskId: m.assignedTaskId ?? null,
            assignedDepartment: m.assignedDepartment ?? null,
          };
        });
      }

      // Generate initial hire options
      data.hireOptions = rollHireOptions(3);

      data.version = 17;
    }
    if (data.version < 18) {
      // v17 → v18: Combo state (defaults on load)
      data.comboState = undefined;
      data.version = 18;
    }
    if (data.version < 19) {
      // v18 → v19: Gold-gated progression — remove XP, add workerSlots/hasManager
      // Strip xp from departments, compute workerSlots from assigned workers, hasManager from assigned managers
      if (data.departments) {
        const workerCounts: Record<string, number> = { schemes: 0, heists: 0, research: 0, mayhem: 0 };
        const hasMgr: Record<string, boolean> = { schemes: false, heists: false, research: false, mayhem: false };
        if (data.minions) {
          for (const m of data.minions) {
            if (m.assignedDepartment) {
              if (m.role === 'manager') {
                hasMgr[m.assignedDepartment] = true;
              } else {
                workerCounts[m.assignedDepartment] = (workerCounts[m.assignedDepartment] ?? 0) + 1;
              }
            }
          }
        }
        for (const cat of ['schemes', 'heists', 'research', 'mayhem'] as const) {
          const dept = data.departments[cat] as any;
          delete dept.xp;
          dept.workerSlots = Math.min(4, workerCounts[cat]);
          dept.hasManager = hasMgr[cat];
          // Give Schemes at least 1 worker slot
          if (cat === 'schemes' && dept.workerSlots === 0) {
            dept.workerSlots = 1;
          }
        }
        // Auto-unassign excess workers (>4 per dept)
        if (data.minions) {
          const remaining: Record<string, number> = { ...workerCounts };
          data.minions = data.minions.map((m: any) => {
            if (m.assignedDepartment && m.role !== 'manager') {
              if (remaining[m.assignedDepartment] > 4) {
                remaining[m.assignedDepartment]--;
                return { ...m, assignedDepartment: null, status: 'idle' };
              }
            }
            return m;
          });
        }
      }
      // Remove deprecated vouchers
      if (data.ownedVouchers) {
        delete (data.ownedVouchers as any)['unlock-schemes'];
        delete (data.ownedVouchers as any)['dept-funding'];
      }
      data.version = 19;
    }
    if (data.version < 20) {
      // v19 → v20: Per-department queue limits (behavioral, no structural changes)
      data.version = 20;
    }
    if (data.version < 21) {
      // v20 → v21: Per-run tracking for compendium (default empty arrays)
      data.completedTaskTemplates = data.completedTaskTemplates ?? [];
      data.encounteredReviewers = data.encounteredReviewers ?? [];
      data.encounteredModifiers = data.encounteredModifiers ?? [];
      data.version = 21;
    }
    return data;
  }
}
