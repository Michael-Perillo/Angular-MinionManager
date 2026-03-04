import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { GameEventService, GameEvent } from './game-event.service';
import { completeTaskByClicking, setupGameWithMinions } from '../../../testing/helpers/game-test-helpers';
import { makeSaveData } from '../../../testing/factories/game-state.factory';
import { makeMinion } from '../../../testing/factories/minion.factory';
import { SAVE_VERSION } from '../models/save-data.model';
import { TaskCategory } from '../models/task.model';

describe('GameStateService', () => {
  let service: GameStateService;

  /** Seed the mission board with n missions (board is empty after initializeGame) */
  function seedBoard(n = 12): void {
    for (let i = 0; i < n; i++) {
      const mission = service.createBoardMission();
      (service as any)._backlog.update((b: any[]) => [...b, mission]);
    }
  }

  /** Hire a minion via the shop (shop must be open for hiring). */
  function shopHire(): void {
    service.openShop();
    service.hireMinion(service.hireOptions()[0]);
    service.closeShop();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStateService);
    service.clickCompleteDelay = 0;
    service.initializeGame();
    seedBoard();
  });

  describe('initializeGame', () => {
    it('should start with 0 gold', () => {
      expect(service.gold()).toBe(0);
    });

    it('should start with no minions', () => {
      expect(service.minions().length).toBe(0);
    });

    it('should seed the mission board via seedBoard helper', () => {
      expect(service.missionBoard().length).toBeGreaterThan(0);
    });

    it('should start with 0 completed count', () => {
      expect(service.completedCount()).toBe(0);
    });

    it('should start with no active missions', () => {
      expect(service.activeMissions().length).toBe(0);
    });

    it('should have all departments at level 1', () => {
      const depts = service.departments();
      expect(depts.schemes.level).toBe(1);
      expect(depts.heists.level).toBe(1);
      expect(depts.research.level).toBe(1);
      expect(depts.mayhem.level).toBe(1);
    });
  });

  describe('acceptMission', () => {
    it('should move a mission from board to active', () => {
      const mission = service.missionBoard()[0];
      const boardBefore = service.missionBoard().length;
      service.acceptMission(mission.id);
      expect(service.activeMissions().length).toBe(1);
      expect(service.missionBoard().length).toBe(boardBefore - 1);
    });

    it('should not accept when dept queue is full', () => {
      // Schemes capacity = 1 + workerSlots(1) + bonus(0) = 2
      const missions = service.missionBoard();
      service.acceptMission(missions[0].id);
      service.acceptMission(missions[1].id);
      expect(service.activeMissions().length).toBe(2);

      // Try a 3rd — should be rejected (schemes queue full)
      const remaining = service.missionBoard()[0];
      service.acceptMission(remaining.id);
      expect(service.activeMissions().length).toBe(2);
    });
  });

  describe('clickTask', () => {
    beforeEach(() => {
      // Accept a mission first
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
    });

    it('should decrement clicks remaining', () => {
      const task = service.activeMissions()[0];
      const initialClicks = task.clicksRemaining;
      service.clickTask(task.id);
      const updatedTask = service.activeMissions().find(t => t.id === task.id);
      if (updatedTask) {
        expect(updatedTask.clicksRemaining).toBeLessThan(initialClicks);
      }
    });

    it('should change status to in-progress on first click', () => {
      const task = service.activeMissions()[0];
      service.clickTask(task.id);
      const updatedTask = service.activeMissions().find(t => t.id === task.id);
      if (updatedTask) {
        expect(updatedTask.status).toBe('in-progress');
      }
    });

    it('should award gold and remove task when all clicks done', () => {
      const task = service.activeMissions()[0];
      const reward = task.goldReward;

      for (let i = 0; i < task.clicksRequired; i++) {
        service.clickTask(task.id);
      }

      expect(service.gold()).toBeGreaterThanOrEqual(reward);
      expect(service.completedCount()).toBe(1);
      expect(service.activeMissions().find(t => t.id === task.id)).toBeUndefined();
    });
  });

  describe('hireMinion', () => {
    beforeEach(() => service.openShop());

    it('should not hire when insufficient gold', () => {
      service.hireMinion(service.hireOptions()[0]);
      expect(service.minions().length).toBe(0);
    });

    it('should not hire when shop is closed', () => {
      service.closeShop();
      service.addGold(75);
      service.hireMinion(service.hireOptions()[0]);
      expect(service.minions().length).toBe(0);
    });

    it('should hire when gold is sufficient and shop is open', () => {
      service.addGold(75);
      service.hireMinion(service.hireOptions()[0]);
      expect(service.minions().length).toBe(1);
    });

    it('should deduct the cost from gold', () => {
      service.addGold(100);
      service.hireMinion(service.hireOptions()[0]); // costs 75
      expect(service.gold()).toBe(25);
    });

    it('should give minion an archetypeId and set to idle worker', () => {
      service.addGold(75);
      service.hireMinion(service.hireOptions()[0]);
      const minion = service.minions()[0];
      expect(minion).toBeTruthy();
      expect(minion.archetypeId).toBeTruthy();
      expect(minion.role).toBe('worker');
      expect(minion.status).toBe('idle');
      expect(minion.assignedTaskId).toBeNull();
      expect(minion.assignedDepartment).toBeNull();
    });

    it('should roll new hire options after hiring', () => {
      service.addGold(75);
      const optionsBefore = [...service.hireOptions()];
      service.hireMinion(optionsBefore[0]);
      // Options should be refreshed (may or may not differ due to randomness)
      expect(service.hireOptions().length).toBe(3);
    });
  });

  describe('computed signals', () => {
    it('nextMinionCost should be 75 for first minion', () => {
      expect(service.nextMinionCost()).toBe(75);
    });

    it('canHireMinion should be false with 0 gold', () => {
      expect(service.canHireMinion()).toBe(false);
    });

    it('canHireMinion should be true with enough gold', () => {
      service.addGold(75);
      expect(service.canHireMinion()).toBe(true);
    });

    it('idleMinions should track idle minions', () => {
      service.addGold(75);
      shopHire();
      expect(service.idleMinions().length).toBe(1);
      expect(service.workingMinions().length).toBe(0);
    });

    it('backlogCapacity should be at least 8 (base capacity with 0 minions)', () => {
      expect(service.backlogCapacity()).toBeGreaterThanOrEqual(8);
    });

    it('deptQueueCapacity should return correct values for default state', () => {
      // schemes starts with workerSlots: 1, others: 0; no operations-desk bonus
      expect(service.deptQueueCapacity().schemes).toBe(2); // 1 + 1 + 0
      expect(service.deptQueueCapacity().heists).toBe(1);  // 1 + 0 + 0
    });
  });

  describe('tickTime', () => {
    it('should auto-assign idle minions to queued active missions', () => {
      // Accept a mission, then hire a minion and assign to matching department
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      service.addGold(75);
      shopHire();

      // Reassign minion to the task's department so auto-assign can work
      const minion = service.minions()[0];
      service.reassignMinion(minion.id, mission.template.category);

      service.tickTime();
      expect(service.workingMinions().length).toBe(1);
      expect(service.idleMinions().length).toBe(0);
    });

    it('should complete task and free minion via processMinionClicks', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      service.addGold(75);
      shopHire();

      // Reassign minion to matching department
      const minion = service.minions()[0];
      const dept = mission.template.category;
      service.reassignMinion(minion.id, dept);

      service.tickTime(); // auto-assigns minion

      const task = service.inProgressTasks()[0];
      expect(task).toBeTruthy();
      const goldBefore = service.gold();
      const completedBefore = service.completedCount();

      // Complete via processMinionClicks (each call applies floor(speed) clicks)
      for (let i = 0; i < 200; i++) {
        service.processMinionClicks();
        const remaining = service.departmentQueues()[dept].find(t => t.id === task.id);
        if (!remaining) break;
      }

      expect(service.departmentQueues()[dept].find(t => t.id === task.id)).toBeUndefined();
      expect(service.gold()).toBeGreaterThan(goldBefore);
      expect(service.completedCount()).toBeGreaterThan(completedBefore);
      expect(service.minions()[0]).toBeTruthy();
      expect(service.minions()[0].status).toBe('idle');
    });

    // Board refresh removed — scouting replaces board refill
  });

  describe('resetGame', () => {
    it('should reset all state', () => {
      service.addGold(100);
      shopHire();
      service.resetGame();

      expect(service.gold()).toBe(0);
      expect(service.minions().length).toBe(0);
      expect(service.completedCount()).toBe(0);
      // After reset, board is populated from starter deck
      expect(service.missionBoard().length).toBeGreaterThan(0);
      expect(service.activeMissions().length).toBe(0);
    });
  });

  describe('notifications', () => {
    it('should add notification when gold is awarded', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      const task = service.activeMissions()[0];
      for (let i = 0; i < task.clicksRequired; i++) {
        service.clickTask(task.id);
      }
      expect(service.notifications().length).toBeGreaterThan(0);
      expect(service.notifications().some(n => n.type === 'gold')).toBe(true);
    });

    it('should add notification when minion is hired', () => {
      service.addGold(75);
      shopHire();
      const minionNotif = service.notifications().find(n => n.type === 'minion');
      expect(minionNotif).toBeTruthy();
    });

    it('should dismiss notification by id', () => {
      service.addGold(75);
      shopHire();
      const notif = service.notifications()[0];
      service.dismissNotification(notif.id);
      expect(service.notifications().find(n => n.id === notif.id)).toBeUndefined();
    });
  });

  // ─── Phase 2: Expanded tests ──────────────────

  describe('awardGold (via clickTask completion)', () => {
    it('should award full gold at baseline', () => {
      // Use a controlled mission (no special op) so mult is deterministic
      const mission = {
        id: 'baseline-test', template: { name: 'Test', description: '', category: 'schemes' as TaskCategory, tier: 'petty' as const },
        status: 'queued' as const, tier: 'petty' as const, goldReward: 2, clicksRequired: 10, clicksRemaining: 10,
        assignedMinionId: null, queuedAt: Date.now(), isSpecialOp: false, assignedQueue: null,
      };
      const data = makeSaveData({ missionBoard: [mission] });
      service.loadSnapshot(data);

      service.acceptMission('baseline-test');
      completeTaskByClicking(service, 'baseline-test');
      // At baseline (dept level 1, no special op), gold = 2 × 1 = 2
      expect(service.gold()).toBe(2);
    });

  });

  describe('clickTask edge cases', () => {
    it('clickPower should be 1', () => {
      expect(service.clickPower()).toBe(1);
    });

    it('should not click a task that is already complete', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;

      completeTaskByClicking(service, task.id);
      const goldAfter = service.gold();
      // Clicking again should have no effect (task is removed)
      service.clickTask(task.id);
      expect(service.gold()).toBe(goldAfter);
    });

    it('should not click a minion-assigned task', () => {
      setupGameWithMinions(service, 1);
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);

      // Reassign minion to matching department
      service.reassignMinion(service.minions()[0].id, mission.template.category);

      service.tickTime(); // auto-assign

      const task = service.activeMissions().find(t => t.id === mission.id)!;
      expect(task.assignedMinionId).not.toBeNull();

      const clicksBefore = task.clicksRemaining;
      service.clickTask(task.id);
      const after = service.activeMissions().find(t => t.id === task.id)!;
      expect(after.clicksRemaining).toBe(clicksBefore);
    });

  });

  describe('autoAssignMinions', () => {
    it('should assign minion to task in its department', () => {
      service.addGold(10_000);
      shopHire();

      // Accept a mission and reassign the minion to match
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      const minion = service.minions()[0];
      service.reassignMinion(minion.id, mission.template.category);

      service.tickTime();

      const task = service.activeMissions().find(t => t.id === mission.id);
      expect(task).toBeDefined();
      expect(task!.assignedMinionId).not.toBeNull();
    });

    it('should not double-assign a minion', () => {
      setupGameWithMinions(service, 1);
      // Accept 2 missions of same category so they go to same dept queue
      const missions = service.missionBoard();
      const cat = missions[0].template.category;
      const sameCat = missions.filter(m => m.template.category === cat);

      if (sameCat.length >= 2) {
        service.acceptMission(sameCat[0].id);
        service.acceptMission(sameCat[1].id);
        // Reassign minion to this department
        service.reassignMinion(service.minions()[0].id, cat);
        service.tickTime();

        // Only 1 minion → only 1 task should be assigned
        const assigned = service.activeMissions().filter(t => t.assignedMinionId !== null);
        expect(assigned.length).toBe(1);
      } else {
        // Fallback: just accept one and verify
        service.acceptMission(missions[0].id);
        service.reassignMinion(service.minions()[0].id, missions[0].template.category);
        service.tickTime();
        const assigned = service.activeMissions().filter(t => t.assignedMinionId !== null);
        expect(assigned.length).toBe(1);
      }
    });

    it('should not assign minion to task in different department', () => {
      service.addGold(10_000);
      shopHire();

      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);

      // Assign minion to a DIFFERENT department than the task
      const minion = service.minions()[0];
      const otherDepts = (['schemes', 'heists', 'research', 'mayhem'] as const)
        .filter(c => c !== mission.template.category);
      service.reassignMinion(minion.id, otherDepts[0]);

      service.tickTime();

      // Minion should NOT be assigned (different department)
      const task = service.activeMissions().find(t => t.id === mission.id);
      expect(task).toBeDefined();
      expect(task!.assignedMinionId).toBeNull();
    });
  });

  describe('hire options (draft system)', () => {
    it('should initialize with 3 hire options', () => {
      expect(service.hireOptions().length).toBe(3);
    });

    it('should have valid archetype IDs in hire options', () => {
      const { MINION_ARCHETYPES } = require('../models/minion.model');
      for (const id of service.hireOptions()) {
        expect(MINION_ARCHETYPES[id]).toBeTruthy();
      }
    });
  });

  describe('getSnapshot / loadSnapshot', () => {
    it('should round-trip state correctly', () => {
      service.addGold(500);
      setupGameWithMinions(service, 2, 0);
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);

      const snapshot = service.getSnapshot();
      service.resetGame();
      expect(service.gold()).toBe(0);

      service.loadSnapshot(snapshot);
      expect(service.gold()).toBe(snapshot.gold);
      expect(service.minions().length).toBe(snapshot.minions.length);
      expect(service.completedCount()).toBe(snapshot.completedCount);
    });

    it('should preserve hireOptions through snapshot', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot.hireOptions).toBeDefined();
      expect(snapshot.hireOptions!.length).toBe(3);

      service.resetGame();
      service.loadSnapshot(snapshot);

      expect(service.hireOptions().length).toBe(3);
    });

    it('should include current version in snapshot', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot.version).toBe(SAVE_VERSION);
    });
  });

  describe('board and queue capacity scaling', () => {
    it('should increase backlog capacity with minions', () => {
      const baseCap = service.backlogCapacity();
      setupGameWithMinions(service, 2, 10_000);
      expect(service.backlogCapacity()).toBeGreaterThan(baseCap);
    });

    it('acceptMission should reject when dept queue is at capacity', () => {
      // Default schemes has workerSlots: 1, so capacity = 2
      const m1 = service.missionBoard()[0];
      const m2 = service.missionBoard()[1];
      const m3 = service.missionBoard()[2];
      service.acceptMission(m1.id);
      service.acceptMission(m2.id);
      // Third should be rejected (capacity = 2)
      service.acceptMission(m3.id);
      expect(service.departmentQueues().schemes.length).toBe(2);
    });

  });

  describe('hiring many minions', () => {
    it('should allow hiring many minions without error', () => {
      service.addGold(100_000_000); // enough for exponentially scaling costs
      for (let i = 0; i < 20; i++) {
        shopHire();
      }
      expect(service.minions().length).toBe(20);
    });
  });

  describe('acceptMission edge cases', () => {
    it('should not accept a mission not on the board', () => {
      service.acceptMission('nonexistent-id');
      expect(service.activeMissions().length).toBe(0);
    });
  });

  // ─── Department Unlocking (via vouchers) ──────────

  describe('department unlocking via vouchers', () => {
    it('should start with schemes always unlocked', () => {
      expect(service.unlockedDepartments().size).toBe(1);
      expect(service.unlockedDepartments().has('schemes')).toBe(true);
    });

    it('should unlock department when purchasing unlock voucher', () => {
      service.addGold(100);
      service.purchaseVoucher('unlock-heists');
      expect(service.unlockedDepartments().has('heists')).toBe(true);
      expect(service.unlockedDepartmentList().length).toBe(2); // schemes + heists
    });

    it('should not duplicate department in unlocked set on double purchase attempt', () => {
      service.addGold(10_000);
      service.purchaseVoucher('unlock-heists');
      const sizeBefore = service.unlockedDepartments().size;

      // Purchasing again should fail (max level 1)
      service.purchaseVoucher('unlock-heists');
      expect(service.unlockedDepartments().size).toBe(sizeBefore);
    });

    it('should restore unlockedDepartments from voucher levels in save data', () => {
      const data = makeSaveData({
        ownedVouchers: { 'unlock-heists': 1 } as any,
      });
      service.loadSnapshot(data);
      expect(service.unlockedDepartments().has('schemes')).toBe(true);
      expect(service.unlockedDepartments().has('heists')).toBe(true);
      expect(service.unlockedDepartments().has('research')).toBe(false);
    });

    it('should reset unlockedDepartments to only schemes on initializeGame', () => {
      service.addGold(100);
      service.purchaseVoucher('unlock-heists');
      expect(service.unlockedDepartments().size).toBeGreaterThan(1);

      service.initializeGame();
      expect(service.unlockedDepartments().size).toBe(1);
      expect(service.unlockedDepartments().has('schemes')).toBe(true);
    });
  });

  // ─── Phase 1B: Minion Assignment ──────────

  describe('assignMinionToDepartment', () => {
    it('should assign an unassigned minion to a department with role', () => {
      service.addGold(75);
      shopHire();
      const minion = service.minions()[0];
      expect(minion.assignedDepartment).toBeNull();

      service.assignMinionToDepartment(minion.id, 'schemes', 'worker');
      expect(service.minions()[0].assignedDepartment).toBe('schemes');
      expect(service.minions()[0].role).toBe('worker');
    });

    it('should not assign a working minion', () => {
      service.addGold(75);
      shopHire();
      const minion = service.minions()[0];
      service.assignMinionToDepartment(minion.id, 'schemes', 'worker');

      // Simulate working state
      service['_minions'].update(list =>
        list.map(m => ({ ...m, status: 'working' as const }))
      );

      // Give heists a worker slot so the rejection is due to working status, not slot limit
      service['_departments'].update(d => ({ ...d, heists: { ...d.heists, workerSlots: 1 } }));
      service.assignMinionToDepartment(minion.id, 'heists', 'worker');
      expect(service.minions()[0].assignedDepartment).toBe('schemes');
    });
  });

  describe('unassignMinion', () => {
    it('should return minion to unassigned pool', () => {
      service.addGold(75);
      shopHire();
      const minion = service.minions()[0];
      service.assignMinionToDepartment(minion.id, 'schemes', 'worker');
      expect(service.minions()[0].assignedDepartment).toBe('schemes');

      service.unassignMinion(minion.id);
      expect(service.minions()[0].assignedDepartment).toBeNull();
      expect(service.minions()[0].role).toBe('worker');
    });
  });

  describe('unassignedMinions', () => {
    it('should include newly hired minions', () => {
      service.addGold(75);
      shopHire();
      expect(service.unassignedMinions().length).toBe(1);
    });

    it('should exclude assigned minions', () => {
      service.addGold(75);
      shopHire();
      const minion = service.minions()[0];
      service.assignMinionToDepartment(minion.id, 'schemes', 'worker');
      expect(service.unassignedMinions().length).toBe(0);
    });
  });

  // ─── Department local multiplier on gold ──────────

  describe('department integer additive gold multiplier', () => {
    it('should apply dept mult when department level > 1', () => {
      // getDeptMult(3) = 2 → mult = 1 + 2 = 3
      // Create a controlled mission (no special op) at known category
      const mission = {
        id: 'test-task', template: { name: 'Test', description: '', category: 'schemes' as TaskCategory, tier: 'petty' as const },
        status: 'queued' as const, tier: 'petty' as const, goldReward: 2, clicksRequired: 10, clicksRemaining: 10,
        assignedMinionId: null, queuedAt: Date.now(), isSpecialOp: false, assignedQueue: null,
      };
      const data = makeSaveData({
        departments: {
          schemes: { category: 'schemes', level: 3, workerSlots: 1, hasManager: false },
          heists: { category: 'heists', level: 1, workerSlots: 0, hasManager: false },
          research: { category: 'research', level: 1, workerSlots: 0, hasManager: false },
          mayhem: { category: 'mayhem', level: 1, workerSlots: 0, hasManager: false },
        },
        missionBoard: [mission],
      });
      service.loadSnapshot(data);

      service.acceptMission('test-task');
      completeTaskByClicking(service, 'test-task');

      // Base 2 × mult 3 (1 + deptMult(3)=2) = 6
      expect(service.gold()).toBe(6);
    });

    it('should award exact base reward at dept level 1 (mult = 1)', () => {
      // All departments at level 1 → getDeptMult(1) = 0, mult = 1
      const mission = {
        id: 'test-task', template: { name: 'Test', description: '', category: 'schemes' as TaskCategory, tier: 'petty' as const },
        status: 'queued' as const, tier: 'petty' as const, goldReward: 2, clicksRequired: 10, clicksRemaining: 10,
        assignedMinionId: null, queuedAt: Date.now(), isSpecialOp: false, assignedQueue: null,
      };
      const data = makeSaveData({ missionBoard: [mission] });
      service.loadSnapshot(data);

      service.acceptMission('test-task');
      completeTaskByClicking(service, 'test-task');

      expect(service.gold()).toBe(2);
    });
  });

  // ─── Phase 3A: Mission Board (service-level) ──────────

  describe('unlockedDepartmentList ordering', () => {
    it('should maintain canonical category order', () => {
      service.addGold(100_000);
      // Unlock mayhem first, then heists via vouchers (schemes always unlocked)
      service.purchaseVoucher('unlock-mayhem');
      service.purchaseVoucher('unlock-heists');

      const list = service.unlockedDepartmentList();
      // Should follow ALL_CATEGORIES order: schemes before heists before mayhem
      const schemesIdx = list.indexOf('schemes');
      const heistsIdx = list.indexOf('heists');
      const mayhemIdx = list.indexOf('mayhem');
      expect(schemesIdx).toBeLessThan(heistsIdx);
      expect(heistsIdx).toBeLessThan(mayhemIdx);
    });
  });

  // ─── Quarterly tracking ───────────────────

  describe('quarterly tracking', () => {
    it('should start at Year 1 Q1 with all zeros', () => {
      const progress = service.quarterProgress();
      expect(progress.year).toBe(1);
      expect(progress.quarter).toBe(1);
      expect(progress.grossGoldEarned).toBe(0);

      expect(progress.tasksCompleted).toBe(0);
    });

    it('should track gold earned and tasks completed when completing tasks', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      completeTaskByClicking(service, mission.id);

      const progress = service.quarterProgress();
      expect(progress.grossGoldEarned).toBeGreaterThan(0);
      expect(progress.tasksCompleted).toBe(1);
    });

    it('should include quarterProgress in snapshot', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      completeTaskByClicking(service, mission.id);

      const snapshot = service.getSnapshot();
      expect(snapshot.quarterProgress).toBeDefined();
      expect(snapshot.quarterProgress!.tasksCompleted).toBe(1);
    });

    it('should restore quarterProgress from snapshot', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 2,
          quarter: 3,
          grossGoldEarned: 500,
          tasksCompleted: 25,
          isComplete: false,
          missedQuarters: 1,
          quarterResults: [],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);

      const progress = service.quarterProgress();
      expect(progress.year).toBe(2);
      expect(progress.quarter).toBe(3);
      expect(progress.grossGoldEarned).toBe(500);
    });

    it('should reset quarterly progress on resetGame', () => {
      service.addGold(10_000);

      service.resetGame();

      const progress = service.quarterProgress();
      expect(progress.year).toBe(1);
      expect(progress.quarter).toBe(1);

    });

    it('should advance quarter when called', () => {
      // Manually set a completed quarter
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 1,
          grossGoldEarned: 200,

          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 1, passed: true, goldEarned: 200, target: 75, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Shop opens after quarter advance
      expect(service.showShop()).toBe(true);
      service.continueAfterShop();

      const progress = service.quarterProgress();
      expect(progress.quarter).toBe(2);
      expect(progress.grossGoldEarned).toBe(0);

      expect(progress.tasksCompleted).toBe(0);
      expect(progress.isComplete).toBe(false);
    });

    it('should mark quarter complete when task budget is exhausted', () => {
      // Load state with 29/30 tasks completed
      const board = service.missionBoard().slice();
      const data = makeSaveData({
        missionBoard: board,
        quarterProgress: {
          year: 1,
          quarter: 1,
          grossGoldEarned: 100,

          tasksCompleted: 29,
          isComplete: false,
          missedQuarters: 0,
          quarterResults: [],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);

      // Complete one more task to hit 30/30
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      completeTaskByClicking(service, mission.id);

      const progress = service.quarterProgress();
      expect(progress.isComplete).toBe(true);
      expect(progress.tasksCompleted).toBe(30);
      expect(progress.quarterResults.length).toBe(1);
    });

    it('should advance Q3 to Q4', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1500,

          tasksCompleted: 60,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      const progress = service.quarterProgress();
      expect(progress.quarter).toBe(4);
      expect(progress.year).toBe(1);
      expect(progress.isComplete).toBe(false);
    });

    it('should advance Q4 to Year 2 Q1 and reset missedQuarters', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 4,
          grossGoldEarned: 500,

          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 2,
          quarterResults: [{ year: 1, quarter: 4, passed: true, goldEarned: 500, target: 0, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Shop opens after quarter advance
      expect(service.showShop()).toBe(true);
      service.continueAfterShop();

      const progress = service.quarterProgress();
      expect(progress.quarter).toBe(1);
      expect(progress.year).toBe(2);
      expect(progress.missedQuarters).toBe(0);
      expect(progress.isComplete).toBe(false);
    });

    it('should not advance quarter if not complete', () => {
      service.advanceQuarter();
      const progress = service.quarterProgress();
      expect(progress.quarter).toBe(1);
      expect(progress.year).toBe(1);
    });

    it('should increment missedQuarters when quarter target is missed', () => {
      const board = service.missionBoard().slice();
      const data = makeSaveData({
        missionBoard: board,
        quarterProgress: {
          year: 1,
          quarter: 1,
          grossGoldEarned: 10,

          tasksCompleted: 29,
          isComplete: false,
          missedQuarters: 0,
          quarterResults: [],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);

      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      completeTaskByClicking(service, mission.id);

      const progress = service.quarterProgress();
      expect(progress.isComplete).toBe(true);
      // Net gold (10 + mission reward) likely < 75 target, so should be missed
      // unless the mission has a huge reward, in which case missedQuarters stays 0
      const result = progress.quarterResults[0];
      if (result.passed) {
        expect(progress.missedQuarters).toBe(0);
      } else {
        expect(progress.missedQuarters).toBe(1);
      }
    });
  });

  describe('event emission integration', () => {
    let events: GameEventService;
    let emitted: GameEvent[];

    beforeEach(() => {
      events = TestBed.inject(GameEventService);
      emitted = [];
      events.events$.subscribe(e => emitted.push(e));
    });

    it('should emit TaskQueued when accepting a mission to player queue', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      const queued = emitted.filter(e => e.type === 'TaskQueued');
      expect(queued.length).toBe(1);
      expect(queued[0].type).toBe('TaskQueued');
    });

    it('should emit MinionHired when hiring a minion', () => {
      service.addGold(500);
      shopHire();
      const hired = emitted.filter(e => e.type === 'MinionHired');
      expect(hired.length).toBe(1);
      if (hired[0].type === 'MinionHired') {
        expect(hired[0].minionId).toBeTruthy();
      }
    });

    it('should emit MinionAssigned when assigning a minion to a department', () => {
      service.addGold(500);
      shopHire();
      const minion = service.minions()[0];
      emitted = [];
      service.assignMinionToDepartment(minion.id, 'schemes', 'worker');
      const assigned = emitted.filter(e => e.type === 'MinionAssigned');
      expect(assigned.length).toBe(1);
      if (assigned[0].type === 'MinionAssigned') {
        expect(assigned[0].minionId).toBe(minion.id);
        expect(assigned[0].department).toBe('schemes');
      }
    });

    it('should emit MinionReassigned when reassigning a minion', () => {
      service.addGold(500);
      shopHire();
      const minion = service.minions()[0];
      // Assign to schemes first (starts unassigned)
      service.assignMinionToDepartment(minion.id, 'schemes', 'worker');
      // Give heists a worker slot so reassignment works
      service['_departments'].update(d => ({ ...d, heists: { ...d.heists, workerSlots: 1 } }));
      emitted = [];
      service.reassignMinion(minion.id, 'heists');
      const reassigned = emitted.filter(e => e.type === 'MinionReassigned');
      expect(reassigned.length).toBe(1);
      if (reassigned[0].type === 'MinionReassigned') {
        expect(reassigned[0].minionId).toBe(minion.id);
        expect(reassigned[0].toDepartment).toBe('heists');
      }
    });

    it('should emit TaskAssigned when auto-assigning a minion to a task', () => {
      service.addGold(500);
      shopHire();
      const minion = service.minions()[0];
      const dept: TaskCategory = 'schemes';

      // Assign minion to department (starts unassigned)
      service.assignMinionToDepartment(minion.id, dept, 'worker');

      // Route a mission to the minion's department
      const mission = service.missionBoard().find(m => m.template.category === dept)
        || service.missionBoard()[0];
      service.routeMission(mission.id, dept);

      // Auto-assign triggers in tickTime
      service.tickTime();
      const assigned = emitted.filter(e => e.type === 'TaskAssigned');
      expect(assigned.length).toBeGreaterThanOrEqual(1);
      if (assigned[0].type === 'TaskAssigned') {
        expect(assigned[0].minionId).toBe(minion.id);
      }
    });

  });

  // ─── Phase B: Year-End Boss Reviews ──────────

  describe('reviewer system', () => {
    it('should start with no reviewer and run-over false', () => {
      expect(service.currentReviewer()).toBeNull();
      expect(service.activeModifiers()).toEqual([]);
      expect(service.isRunOver()).toBe(false);
      expect(service.isInReview()).toBe(false);
    });

    it('should select a reviewer when advancing from Q3 to Q4', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1500,
          tasksCompleted: 60,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      expect(service.currentReviewer()).not.toBeNull();
      expect(service.isInReview()).toBe(true);
      expect(service.activeModifiers().length).toBeGreaterThanOrEqual(1); // at least base modifier
      expect(service.showReviewerIntro()).toBe(true);
    });

    it('should draw extra modifiers based on missed quarters', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1500,
          tasksCompleted: 60,
          isComplete: true,
          missedQuarters: 2,
          quarterResults: [{ year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      // Should have base + up to 2 extras
      expect(service.activeModifiers().length).toBeGreaterThanOrEqual(1);
      expect(service.activeModifiers().length).toBeLessThanOrEqual(3);
    });

    it('should show reviewer intro that can be dismissed', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1500,
          tasksCompleted: 60,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      expect(service.showReviewerIntro()).toBe(true);
      service.dismissReviewerIntro();
      expect(service.showReviewerIntro()).toBe(false);
    });

    it('should have a reviewer gold target for Q4', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1500,
          tasksCompleted: 60,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      expect(service.reviewGoldTarget()).toBeGreaterThan(0);
    });

    it('should revert reviewer on Q4 pass and advance to next year', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 4,
          grossGoldEarned: 500,
          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 1,
          quarterResults: [{ year: 1, quarter: 4, passed: true, goldEarned: 500, target: 200, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      expect(service.currentReviewer()).toBeNull();
      expect(service.activeModifiers()).toEqual([]);
      expect(service.isRunOver()).toBe(false);
      // Shop opens before Y+1 Q1
      expect(service.showShop()).toBe(true);
      service.continueAfterShop();
      expect(service.quarterProgress().year).toBe(2);
      expect(service.quarterProgress().quarter).toBe(1);
    });

    it('should set run-over when Q4 is failed', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 4,
          grossGoldEarned: 10,
          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 2,
          quarterResults: [{ year: 1, quarter: 4, passed: false, goldEarned: 10, target: 200, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      expect(service.isRunOver()).toBe(true);
      // Should NOT advance to next year
      expect(service.quarterProgress().quarter).toBe(4);
      expect(service.quarterProgress().year).toBe(1);
    });

    it('should emit RunEnded event when Q4 fails', () => {
      const events = TestBed.inject(GameEventService);
      const emitted: GameEvent[] = [];
      events.events$.subscribe(e => emitted.push(e));

      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 4,
          grossGoldEarned: 10,
          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 2,
          quarterResults: [{ year: 1, quarter: 4, passed: false, goldEarned: 10, target: 200, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      const runEnded = emitted.filter(e => e.type === 'RunEnded');
      expect(runEnded.length).toBe(1);
    });

    it('should emit ReviewStarted event when Q3 advances to Q4', () => {
      const events = TestBed.inject(GameEventService);
      const emitted: GameEvent[] = [];
      events.events$.subscribe(e => emitted.push(e));

      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1500,
          tasksCompleted: 60,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      const reviewStarted = emitted.filter(e => e.type === 'ReviewStarted');
      expect(reviewStarted.length).toBe(1);
    });

    it('should reset all state on startNewRun', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 4,
          grossGoldEarned: 10,
          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 2,
          quarterResults: [{ year: 1, quarter: 4, passed: false, goldEarned: 10, target: 200, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      expect(service.isRunOver()).toBe(true);

      service.startNewRun();
      expect(service.isRunOver()).toBe(false);
      expect(service.currentReviewer()).toBeNull();
      expect(service.quarterProgress().year).toBe(1);
      expect(service.quarterProgress().quarter).toBe(1);
    });
  });

  describe('modifier effects', () => {
    function enterReview(missedQuarters = 0): void {
      const board = service.missionBoard().slice();
      const data = makeSaveData({
        missionBoard: board,
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1500,
          tasksCompleted: 60,
          isComplete: true,
          missedQuarters,
          quarterResults: [{ year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
    }

    it('should block hiring when hiringDisabled is active', () => {
      enterReview();
      // Force the hiring-disabled constraint directly for deterministic testing
      (service as any)._hiringDisabled.set(true);

      service.addGold(10_000);
      const minionsBefore = service.minions().length;
      shopHire();
      expect(service.minions().length).toBe(minionsBefore);
    });

    it('should block hireMinion when hiringDisabled is active', () => {
      enterReview();
      (service as any)._hiringDisabled.set(true);

      service.addGold(10_000);
      shopHire();
      expect(service.minions().length).toBe(0);
    });

    it('should expose backlogFrozen constraint signal', () => {
      enterReview();
      (service as any)._backlogFrozen.set(true);
      expect(service.backlogFrozen()).toBe(true);
    });

    it('should limit backlog capacity to 1 when backlogFrozen is active', () => {
      enterReview();
      (service as any)._backlogFrozen.set(true);
      expect(service.backlogCapacity()).toBe(1);
    });

    it('should limit backlog capacity to 2 when backlogLimited is active', () => {
      enterReview();
      (service as any)._backlogLimited.set(true);

      expect(service.backlogCapacity()).toBe(2);
    });

    it('should apply gold drain per task', () => {
      (service as any)._goldDrainPerTask.set(5);

      const mission = service.missionBoard()[0];
      const reward = mission.goldReward;
      service.acceptMission(mission.id);
      completeTaskByClicking(service, mission.id);

      // Gold should be reward - 5 (drain)
      expect(service.gold()).toBe(Math.max(0, reward - 5));
    });

    it('should apply boss mult penalty (gold-reduced-30 = -1 mult)', () => {
      // Create a controlled task with no special op
      const mission = {
        id: 'test-mod', template: { name: 'Test', description: '', category: 'schemes' as TaskCategory, tier: 'petty' as const },
        status: 'queued' as const, tier: 'petty' as const, goldReward: 2, clicksRequired: 10, clicksRemaining: 10,
        assignedMinionId: null, queuedAt: Date.now(), isSpecialOp: false, assignedQueue: null,
      };
      const data = makeSaveData({ missionBoard: [mission] });
      service.loadSnapshot(data);

      // Simulate gold-reduced-30 modifier: -1 mult → mult = max(1, 1 + 0 - 1) = max(1, 0) = 1
      // With dept level 1 and no other bonuses, mult would be 1 - 1 = 0, clamped to 1
      (service as any)._activeModifiers.set([{ id: 'gold-reduced-30', name: 'Budget Cuts', description: '', category: 'operational' }]);

      service.acceptMission('test-mod');
      completeTaskByClicking(service, 'test-mod');

      // mult clamped to 1, so gold = 2 × 1 = 2
      expect(service.gold()).toBe(2);
    });

    it('should block routing to locked category', () => {
      service.addGold(10_000);
      // Schemes is always unlocked, just set the locked category constraint
      (service as any)._lockedCategory.set('schemes');

      const mission = service.missionBoard()[0];
      service.routeMission(mission.id, 'schemes');
      // Should not have been routed
      expect(service.departmentQueues().schemes.length).toBe(0);
    });

    it('should persist reviewer state in snapshot', () => {
      enterReview();
      const snapshot = service.getSnapshot();
      expect(snapshot.currentReviewer).not.toBeNull();
      expect(snapshot.activeModifiers!.length).toBeGreaterThanOrEqual(1);
      expect(snapshot.isRunOver).toBe(false);
    });

    it('should restore reviewer state from snapshot', () => {
      enterReview();
      const snapshot = service.getSnapshot();

      // Reset and reload
      service.initializeGame();
      expect(service.currentReviewer()).toBeNull();

      service.loadSnapshot(snapshot);
      expect(service.currentReviewer()).not.toBeNull();
      expect(service.activeModifiers().length).toBeGreaterThanOrEqual(1);
    });

    it('should revert all constraints when Q4 passes', () => {
      enterReview();
      // Set up some constraints
      (service as any)._hiringDisabled.set(true);
      (service as any)._backlogFrozen.set(true);

      // Simulate Q4 completion and pass
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 4,
          grossGoldEarned: 500,
          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 4, passed: true, goldEarned: 500, target: 200, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Constraints should be reverted immediately, even before shop closes
      expect(service.hiringDisabled()).toBe(false);
      expect(service.backlogFrozen()).toBe(false);
      expect(service.lockedCategory()).toBeNull();
    });
  });

  describe('Vouchers', () => {
    it('should start with all vouchers at level 0', () => {
      const v = service.ownedVouchers();
      expect(v['iron-fingers']).toBe(0);
      expect(v['board-expansion']).toBe(0);
      expect(v['operations-desk']).toBe(0);
      expect(v['hire-discount']).toBe(0);
    });

    it('should have base click power of 1 with no vouchers', () => {
      expect(service.clickPower()).toBe(1);
    });

    describe('purchaseVoucher', () => {
      it('should purchase a voucher when gold is sufficient', () => {
        service.addGold(100);
        const result = service.purchaseVoucher('iron-fingers');
        expect(result).toBe(true);
        expect(service.ownedVouchers()['iron-fingers']).toBe(1);
        expect(service.gold()).toBe(60); // 100 - 40
      });

      it('should reject purchase when gold is insufficient', () => {
        service.addGold(10);
        const result = service.purchaseVoucher('iron-fingers');
        expect(result).toBe(false);
        expect(service.ownedVouchers()['iron-fingers']).toBe(0);
        expect(service.gold()).toBe(10);
      });

      it('should reject purchase when voucher is at max level', () => {
        service.addGold(10000);
        service.purchaseVoucher('iron-fingers'); // L1: -40
        service.purchaseVoucher('iron-fingers'); // L2: -200
        service.purchaseVoucher('iron-fingers'); // L3: -600
        expect(service.ownedVouchers()['iron-fingers']).toBe(3);
        const result = service.purchaseVoucher('iron-fingers'); // L4: should fail
        expect(result).toBe(false);
        expect(service.ownedVouchers()['iron-fingers']).toBe(3);
      });

      it('should upgrade through all levels with correct costs', () => {
        service.addGold(10000);
        service.purchaseVoucher('iron-fingers'); // L1: -40
        expect(service.gold()).toBe(9960);
        service.purchaseVoucher('iron-fingers'); // L2: -200
        expect(service.gold()).toBe(9760);
        service.purchaseVoucher('iron-fingers'); // L3: -600
        expect(service.gold()).toBe(9160);
      });
    });

    describe('voucher effects', () => {
      beforeEach(() => {
        service.addGold(50000);
      });

      it('iron-fingers should increase click power', () => {
        expect(service.clickPower()).toBe(1);
        service.purchaseVoucher('iron-fingers');
        expect(service.clickPower()).toBe(3); // 1 + 2
        service.purchaseVoucher('iron-fingers');
        expect(service.clickPower()).toBe(6); // 1 + 5
        service.purchaseVoucher('iron-fingers');
        expect(service.clickPower()).toBe(13); // 1 + 12
      });

      it('board-expansion should increase backlog capacity', () => {
        const baseCap = service.backlogCapacity();
        service.purchaseVoucher('board-expansion');
        expect(service.backlogCapacity()).toBe(baseCap + 3);
      });

      it('operations-desk should increase dept queue capacity', () => {
        const baseCap = service.deptQueueCapacity().schemes;
        service.purchaseVoucher('operations-desk');
        expect(service.deptQueueCapacity().schemes).toBe(baseCap + 2);
      });

      it('hire-discount should reduce next minion cost', () => {
        const baseCost = service.nextMinionCost();
        service.purchaseVoucher('hire-discount');
        const discountedCost = service.nextMinionCost();
        expect(discountedCost).toBeLessThan(baseCost);
        expect(discountedCost).toBe(Math.floor(75 * (1 - 0.20)));
      });

      it('dismissal-expert should be purchasable', () => {
        const snap1 = service.getSnapshot();
        expect(snap1.ownedVouchers?.['dismissal-expert'] ?? 0).toBe(0);
        service.purchaseVoucher('dismissal-expert');
        const snap2 = service.getSnapshot();
        expect(snap2.ownedVouchers?.['dismissal-expert']).toBe(1);
      });
    });

    describe('persistence', () => {
      it('should include voucher levels in snapshot', () => {
        service.addGold(1000);
        service.purchaseVoucher('iron-fingers');
        service.purchaseVoucher('board-expansion');
        const snapshot = service.getSnapshot();
        expect(snapshot.ownedVouchers).toBeDefined();
        expect(snapshot.ownedVouchers!['iron-fingers']).toBe(1);
        expect(snapshot.ownedVouchers!['board-expansion']).toBe(1);
      });

      it('should restore voucher levels from snapshot', () => {
        const data = makeSaveData({
          ownedVouchers: { 'iron-fingers': 2, 'hire-discount': 1 } as any,
        });
        service.loadSnapshot(data);
        expect(service.ownedVouchers()['iron-fingers']).toBe(2);
        expect(service.ownedVouchers()['hire-discount']).toBe(1);
        expect(service.ownedVouchers()['board-expansion']).toBe(0);
      });

      it('should restore voucher effects on load', () => {
        const data = makeSaveData({
          ownedVouchers: { 'iron-fingers': 3 },
        });
        service.loadSnapshot(data);
        expect(service.clickPower()).toBe(13); // 1 + 12
      });
    });
  });

  describe('Shop flow', () => {
    it('should not show shop initially', () => {
      expect(service.showShop()).toBe(false);
    });

    it('openShop/closeShop should toggle showShop signal', () => {
      service.openShop();
      expect(service.showShop()).toBe(true);
      service.closeShop();
      expect(service.showShop()).toBe(false);
    });

    it('advanceQuarter should show pack reward for Q1→Q2 transition (passed)', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 1,
          grossGoldEarned: 100,
          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Passed quarter: shop opens
      expect(service.showShop()).toBe(true);
      // Quarter should NOT have advanced yet (shop must be dismissed first)
      expect(service.quarterProgress().quarter).toBe(1);
      expect(service.quarterProgress().isComplete).toBe(true);
    });

    it('continueAfterShop should advance the quarter and close shop', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 1,
          grossGoldEarned: 100,
          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Shop opens directly (no pack reward)
      expect(service.showShop()).toBe(true);

      service.continueAfterShop();
      expect(service.showShop()).toBe(false);
      expect(service.quarterProgress().quarter).toBe(2);
      expect(service.quarterProgress().isComplete).toBe(false);
    });

    it('Q3→Q4 should skip shop and go straight to review', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1000,
          tasksCompleted: 60,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [
            { year: 1, quarter: 1, passed: true, goldEarned: 100, target: 75, tasksCompleted: 30 },
            { year: 1, quarter: 2, passed: true, goldEarned: 400, target: 300, tasksCompleted: 40 },
            { year: 1, quarter: 3, passed: true, goldEarned: 1000, target: 900, tasksCompleted: 60 },
          ],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Shop should NOT be shown for Q3→Q4
      expect(service.showShop()).toBe(false);
      // Reviewer should be shown instead
      expect(service.showReviewerIntro()).toBe(true);
      expect(service.quarterProgress().quarter).toBe(4);
    });

    it('Q4 pass should show pack reward then shop before advancing to Y+1 Q1', () => {
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 4,
          grossGoldEarned: 500,
          tasksCompleted: 30,
          isComplete: true,
          missedQuarters: 0,
          quarterResults: [{ year: 1, quarter: 4, passed: true, goldEarned: 500, target: 200, tasksCompleted: 30 }],
          dismissalsRemaining: 5,
          researchCompleted: 0,
          activeBreakthroughs: 0,
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Shop opens directly
      expect(service.showShop()).toBe(true);

      service.continueAfterShop();
      expect(service.quarterProgress().year).toBe(2);
      expect(service.quarterProgress().quarter).toBe(1);
    });

    it('resetGame should clear vouchers and shop', () => {
      service.addGold(1000);
      service.purchaseVoucher('iron-fingers');
      service.openShop();
      expect(service.ownedVouchers()['iron-fingers']).toBe(1);
      expect(service.showShop()).toBe(true);

      service.resetGame();
      expect(service.ownedVouchers()['iron-fingers']).toBe(0);
      expect(service.showShop()).toBe(false);
    });
  });

  describe('combo state', () => {
    it('should start with empty combo state', () => {
      const combo = service.comboState();
      expect(combo.deptFocus.dept).toBeNull();
      expect(combo.deptFocus.count).toBe(0);
      expect(combo.tierLadder.lastTier).toBeNull();
      expect(combo.tierLadder.step).toBe(0);
    });

    it('should persist combo state through snapshot round-trip', () => {
      // Set a non-default combo state via loadSnapshot
      const snapshot = service.getSnapshot();
      snapshot.comboState = {
        deptFocus: { dept: 'heists', count: 3 },
        tierLadder: { lastTier: 'sinister', step: 2 },
      };
      service.loadSnapshot(snapshot);

      const combo = service.comboState();
      expect(combo.deptFocus.dept).toBe('heists');
      expect(combo.deptFocus.count).toBe(3);
      expect(combo.tierLadder.lastTier).toBe('sinister');
      expect(combo.tierLadder.step).toBe(2);

      // Round-trip
      const snapshot2 = service.getSnapshot();
      expect(snapshot2.comboState).toEqual(combo);
    });

    it('should reset combo state on initializeGame', () => {
      // Load non-default state
      const snapshot = service.getSnapshot();
      snapshot.comboState = {
        deptFocus: { dept: 'heists', count: 3 },
        tierLadder: { lastTier: 'sinister', step: 2 },
      };
      service.loadSnapshot(snapshot);

      service.initializeGame();
      const combo = service.comboState();
      expect(combo.deptFocus.dept).toBeNull();
      expect(combo.deptFocus.count).toBe(0);
    });

    it('should apply comboMult to operation gold when set', () => {
      // Create an operation with comboMult and verify gold is boosted
      // Direct test: create a task with comboMult in a dept queue and click-complete it
      const opTask = {
        id: 'combo-test-op',
        template: { name: 'Heist Op', description: '', category: 'heists' as TaskCategory, tier: 'petty' as const },
        status: 'queued' as const,
        tier: 'petty' as const,
        goldReward: 2,  // base gold
        clicksRequired: 1,
        clicksRemaining: 1,
        assignedMinionId: null,
        queuedAt: Date.now(),
        assignedQueue: 'heists' as TaskCategory,
        isOperation: true,
        comboMult: 3,  // +3 to mult
      };

      // Load the task into heists queue
      const snapshot = service.getSnapshot();
      snapshot.departmentQueues = {
        ...snapshot.departmentQueues,
        heists: [opTask],
      };
      service.loadSnapshot(snapshot);

      const goldBefore = service.gold();
      service.clickTask('combo-test-op');

      // Gold earned should be: 2 × (1 + deptMult(L1=0) + comboMult(3)) = 2 × 4 = 8
      const goldEarned = service.gold() - goldBefore;
      expect(goldEarned).toBe(8);
    });
  });

});
