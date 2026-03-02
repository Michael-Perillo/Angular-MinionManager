import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { GameEventService, GameEvent } from './game-event.service';
import { completeTaskByClicking, setupGameWithMinions } from '../../../testing/helpers/game-test-helpers';
import { makeSaveData } from '../../../testing/factories/game-state.factory';
import { makeMinion } from '../../../testing/factories/minion.factory';
import { SAVE_VERSION } from '../models/save-data.model';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStateService);
    service.clickCompleteDelay = 0;
    service.initializeGame();
  });

  describe('initializeGame', () => {
    it('should start with 0 gold', () => {
      expect(service.gold()).toBe(0);
    });

    it('should start with no minions', () => {
      expect(service.minions().length).toBe(0);
    });

    it('should seed the mission board with missions', () => {
      expect(service.missionBoard().length).toBeGreaterThan(0);
    });

    it('should start with 0 completed count', () => {
      expect(service.completedCount()).toBe(0);
    });

    it('should start with no active missions', () => {
      expect(service.activeMissions().length).toBe(0);
    });

    it('should start at villain level 1', () => {
      expect(service.villainLevel()).toBe(1);
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

    it('should not accept when active slots are full', () => {
      // Active slots = 3 + 0 minions = 3
      const missions = service.missionBoard();
      service.acceptMission(missions[0].id);
      service.acceptMission(missions[1].id);
      service.acceptMission(missions[2].id);
      expect(service.activeMissions().length).toBe(3);

      // Try a 4th — should be rejected
      const remaining = service.missionBoard()[0];
      service.acceptMission(remaining.id);
      expect(service.activeMissions().length).toBe(3);
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
    it('should not hire when insufficient gold', () => {
      service.hireMinion();
      expect(service.minions().length).toBe(0);
    });

    it('should hire when gold is sufficient', () => {
      service.addGold(75);
      service.hireMinion();
      expect(service.minions().length).toBe(1);
    });

    it('should deduct the cost from gold', () => {
      service.addGold(100);
      service.hireMinion(); // costs 75
      expect(service.gold()).toBe(25);
    });

    it('should give minion stats, specialty, and level', () => {
      service.addGold(75);
      service.hireMinion();
      const minion = service.minions()[0];
      expect(minion.stats).toBeTruthy();
      expect(minion.stats.speed).toBeGreaterThan(0);
      expect(minion.stats.efficiency).toBeGreaterThan(0);
      expect(minion.specialty).toBeTruthy();
      expect(minion.level).toBe(1);
      expect(minion.xp).toBe(0);
    });

    it('should give minion a name and set to idle', () => {
      service.addGold(75);
      service.hireMinion();
      const minion = service.minions()[0];
      expect(minion).toBeTruthy();
      expect(minion.name).toBeTruthy();
      expect(minion.status).toBe('idle');
      expect(minion.assignedTaskId).toBeNull();
    });

    it('should give minion an appearance', () => {
      service.addGold(75);
      service.hireMinion();
      const minion = service.minions()[0];
      expect(minion.appearance).toBeTruthy();
      expect(minion.appearance.color).toBeTruthy();
      expect(minion.appearance.accessory).toBeTruthy();
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
      service.hireMinion();
      expect(service.idleMinions().length).toBe(1);
      expect(service.workingMinions().length).toBe(0);
    });

    it('boardCapacity should be at least 12', () => {
      expect(service.boardCapacity()).toBeGreaterThanOrEqual(12);
    });

    it('activeSlots should be at least 3', () => {
      expect(service.activeSlots()).toBeGreaterThanOrEqual(3);
    });
  });

  describe('tickTime', () => {
    it('should auto-assign idle minions to queued active missions', () => {
      // Accept a mission, then hire a minion and assign to matching department
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      service.addGold(75);
      service.hireMinion();

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
      service.hireMinion();

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

    it('should refill mission board over time', () => {
      // Accept all missions to empty the board
      const initialCount = service.missionBoard().length;
      expect(initialCount).toBeGreaterThan(0);

      // Remove some from board by accepting
      service.acceptMission(service.missionBoard()[0].id);
      service.acceptMission(service.missionBoard()[0].id);

      // Tick enough for a board refresh (refresh interval = 3s, tick = 1s)
      for (let i = 0; i < 5; i++) {
        service.tickTime();
      }

      // Board should have been refilled
      expect(service.missionBoard().length).toBeGreaterThanOrEqual(initialCount - 2);
    });
  });

  describe('resetGame', () => {
    it('should reset all state', () => {
      service.addGold(100);
      service.hireMinion();
      service.resetGame();

      expect(service.gold()).toBe(0);
      expect(service.minions().length).toBe(0);
      expect(service.completedCount()).toBe(0);
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
      service.hireMinion();
      const minionNotif = service.notifications().find(n => n.type === 'minion');
      expect(minionNotif).toBeTruthy();
    });

    it('should dismiss notification by id', () => {
      service.addGold(75);
      service.hireMinion();
      const notif = service.notifications()[0];
      service.dismissNotification(notif.id);
      expect(service.notifications().find(n => n.id === notif.id)).toBeUndefined();
    });
  });

  // ─── Phase 2: Expanded tests ──────────────────

  describe('awardGold (via clickTask completion)', () => {
    it('should award full gold at baseline', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;
      const reward = task.goldReward;

      completeTaskByClicking(service, task.id);
      // At baseline (dept level 1), gold = base × 1.0 dept mult × 1.0 boss mult - 0 drain
      expect(service.gold()).toBe(reward);
    });

    it('should increase department XP on task completion', () => {
      const mission = service.missionBoard()[0];
      const category = mission.template.category;
      // Dept XP gated behind unlock — unlock the task's department
      (service as any)._unlockedDepartments.set(new Set([category]));
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;

      completeTaskByClicking(service, task.id);
      expect(service.departments()[category].xp).toBeGreaterThan(0);
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
      service.hireMinion();

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
      service.hireMinion();

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

  describe('villain level', () => {
    it('should be 1 at 0 completed', () => {
      expect(service.villainLevel()).toBe(1);
    });

    it('should increase with completedCount', () => {
      // Complete several tasks
      for (let i = 0; i < 10; i++) {
        const m = service.missionBoard()[0];
        if (!m) break;
        service.acceptMission(m.id);
        completeTaskByClicking(service, m.id);
      }
      expect(service.villainLevel()).toBeGreaterThan(1);
    });

    it('should cap at 20', () => {
      // Formula: min(20, floor(sqrt(completed/5)) + 1)
      // To reach 20: sqrt(c/5) >= 19 → c >= 5 * 19^2 = 1805
      // At completed = 2000, floor(sqrt(2000/5)) + 1 = floor(20) + 1 = 21, capped at 20
      const saveData = makeSaveData({ completedCount: 2000 });
      service.loadSnapshot(saveData);
      expect(service.villainLevel()).toBe(20);
    });

    it('should return specific values for known completedCount', () => {
      // completedCount=0 → level 1
      expect(service.villainLevel()).toBe(1);

      // completedCount=5 → floor(sqrt(5/5)) + 1 = floor(1) + 1 = 2
      let data = makeSaveData({ completedCount: 5 });
      service.loadSnapshot(data);
      expect(service.villainLevel()).toBe(2);

      // completedCount=20 → floor(sqrt(20/5)) + 1 = floor(2) + 1 = 3
      data = makeSaveData({ completedCount: 20 });
      service.loadSnapshot(data);
      expect(service.villainLevel()).toBe(3);
    });
  });

  describe('villainTitle', () => {
    it('should return Petty Troublemaker at level 1', () => {
      expect(service.villainTitle()).toBe('Petty Troublemaker');
    });

    it('should return higher titles at higher levels', () => {
      const data = makeSaveData({ completedCount: 1000 });
      service.loadSnapshot(data);
      expect(service.villainTitle()).toBe('Supreme Evil Genius');
    });
  });

  describe('minion XP & leveling', () => {
    it('should award minion XP after completing a task via minion', () => {
      setupGameWithMinions(service, 1);
      const mission = service.missionBoard()[0];
      const dept = mission.template.category;
      service.acceptMission(mission.id);

      // Reassign minion to matching department
      const minion = service.minions()[0];
      service.reassignMinion(minion.id, dept);

      service.tickTime(); // auto-assigns minion

      const minionBefore = service.minions()[0];
      expect(minionBefore.xp).toBe(0);

      // Complete via processMinionClicks
      const task = service.inProgressTasks()[0];
      for (let i = 0; i < 200; i++) {
        service.processMinionClicks();
        if (!service.departmentQueues()[dept].find(t => t.id === task.id)) break;
      }

      const minionAfter = service.minions()[0];
      if (minionAfter) {
        expect(minionAfter.xp).toBeGreaterThan(0);
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

    it('should preserve usedNameIndices through snapshot', () => {
      service.addGold(10_000);
      service.hireMinion();
      const firstName = service.minions()[0].name;

      const snapshot = service.getSnapshot();
      expect(snapshot.usedNameIndices.length).toBeGreaterThan(0);

      service.resetGame();
      service.loadSnapshot(snapshot);

      // usedNameIndices restored, so next minion shouldn't get same name
      service.addGold(10_000);
      service.hireMinion();
      // With only 2 minions out of 25 names, the second should differ
      if (service.minions().length === 2) {
        expect(service.minions()[1].name).not.toBe(firstName);
      }
    });

    it('should include current version in snapshot', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot.version).toBe(SAVE_VERSION);
    });
  });

  describe('board and active capacity scaling', () => {
    it('should increase board capacity with minions', () => {
      const baseCap = service.boardCapacity();
      setupGameWithMinions(service, 2, 10_000);
      expect(service.boardCapacity()).toBeGreaterThan(baseCap);
    });

    it('should increase active slots with minions', () => {
      const baseSlots = service.activeSlots(); // 3
      setupGameWithMinions(service, 2, 10_000);
      expect(service.activeSlots()).toBe(baseSlots + 2);
    });

  });

  describe('name pool exhaustion', () => {
    it('should recycle names after all 25 are used', () => {
      service.addGold(100_000_000); // enough for exponentially scaling costs
      for (let i = 0; i < 26; i++) {
        service.hireMinion();
      }
      // Should have 26 minions without error
      expect(service.minions().length).toBe(26);
    });
  });

  describe('acceptMission edge cases', () => {
    it('should not accept a mission not on the board', () => {
      service.acceptMission('nonexistent-id');
      expect(service.activeMissions().length).toBe(0);
    });
  });

  // ─── Phase 1A: Progressive Department Unlocking ──────────

  describe('progressive department unlocking', () => {
    it('should start with empty unlockedDepartments', () => {
      expect(service.unlockedDepartments().size).toBe(0);
      expect(service.unlockedDepartmentList().length).toBe(0);
    });

    it('should unlock department when hireMinion is called', () => {
      service.addGold(75);
      service.hireMinion();
      const minion = service.minions()[0];
      expect(service.unlockedDepartments().has(minion.assignedDepartment)).toBe(true);
      expect(service.unlockedDepartmentList().length).toBeGreaterThanOrEqual(1);
    });

    it('should unlock department when hireChosenMinion is called', () => {
      const candidates = service.generateHiringCandidates();
      service.addGold(75);
      service.hireChosenMinion(candidates[0]);
      expect(service.unlockedDepartments().has(candidates[0].assignedDepartment)).toBe(true);
    });

    it('should not duplicate department in unlocked set on second hire in same dept', () => {
      service.addGold(10_000);
      service.hireMinion();
      const dept = service.minions()[0].assignedDepartment;
      const sizeBefore = service.unlockedDepartments().size;

      // Hire another minion and force it into the same department via hireChosenMinion
      const candidate = makeMinion({ assignedDepartment: dept, specialty: dept });
      service.hireChosenMinion(candidate);
      expect(service.unlockedDepartments().size).toBe(sizeBefore);
    });

    it('should emit notification when a new department is unlocked', () => {
      service.addGold(75);
      const notifsBefore = service.notifications().length;
      service.hireMinion();
      const deptNotif = service.notifications().find(n => n.message.includes('Department opened'));
      expect(deptNotif).toBeTruthy();
    });

    it('should persist unlockedDepartments in snapshot', () => {
      service.addGold(10_000);
      service.hireMinion();
      const snapshot = service.getSnapshot();
      expect(snapshot.version).toBe(SAVE_VERSION);
      expect(snapshot.unlockedDepartments).toBeDefined();
      expect(snapshot.unlockedDepartments!.length).toBeGreaterThanOrEqual(1);
    });

    it('should restore unlockedDepartments from save data', () => {
      const data = makeSaveData({
        unlockedDepartments: ['schemes', 'heists'],
      });
      service.loadSnapshot(data);
      expect(service.unlockedDepartments().has('schemes' as any)).toBe(true);
      expect(service.unlockedDepartments().has('heists' as any)).toBe(true);
      expect(service.unlockedDepartments().has('research' as any)).toBe(false);
    });

    it('should derive unlockedDepartments from minions for older saves without the field', () => {
      const minions = [
        makeMinion({ assignedDepartment: 'research' }),
        makeMinion({ assignedDepartment: 'mayhem' }),
      ];
      const data = makeSaveData({ minions, unlockedDepartments: [] });
      service.loadSnapshot(data);
      expect(service.unlockedDepartments().has('research' as any)).toBe(true);
      expect(service.unlockedDepartments().has('mayhem' as any)).toBe(true);
    });

    it('should reset unlockedDepartments on initializeGame', () => {
      service.addGold(75);
      service.hireMinion();
      expect(service.unlockedDepartments().size).toBeGreaterThan(0);

      service.initializeGame();
      expect(service.unlockedDepartments().size).toBe(0);
    });

    it('should only generate new missions from unlocked departments', () => {
      // Start a fresh game, hire a minion to unlock one department
      service.addGold(75);
      service.hireMinion();
      const unlocked = service.unlockedDepartments();

      // Clear the board and force a complete refill so all missions are newly generated
      // We can do this via loadSnapshot with an empty board and the current state
      const snapshot = service.getSnapshot();
      snapshot.missionBoard = [];
      service.loadSnapshot(snapshot);

      // Trigger board refill directly (migrated from tickTime to GameTimerService)
      service.refreshBoard();

      // All newly generated missions should be from unlocked depts
      const boardMissions = service.missionBoard();
      expect(boardMissions.length).toBeGreaterThan(0);
      for (const m of boardMissions) {
        expect(unlocked.has(m.template.category)).toBe(true);
      }
    });
  });

  // ─── Phase 1B: Minion Hiring Choice ──────────

  describe('generateHiringCandidates', () => {
    it('should return exactly 2 minions', () => {
      const candidates = service.generateHiringCandidates();
      expect(candidates.length).toBe(2);
      expect(candidates[0]).toBeTruthy();
      expect(candidates[1]).toBeTruthy();
    });

    it('should return minions with valid properties', () => {
      const candidates = service.generateHiringCandidates();
      for (const minion of candidates) {
        expect(minion.id).toBeTruthy();
        expect(minion.name).toBeTruthy();
        expect(minion.stats.speed).toBeGreaterThan(0);
        expect(minion.stats.efficiency).toBeGreaterThan(0);
        expect(minion.specialty).toBeTruthy();
        expect(minion.assignedDepartment).toBeTruthy();
      }
    });

    it('should include at least one candidate from a locked department when locked depts exist', () => {
      // At start, no departments are unlocked. Unlock one via hire.
      service.addGold(75);
      service.hireMinion();
      const unlockedDept = service.minions()[0].assignedDepartment;

      // If there are still locked depts, at least one candidate should open a new one
      if (service.unlockedDepartments().size < 4) {
        // Run multiple times to account for random ordering
        let foundLockedCandidate = false;
        for (let attempt = 0; attempt < 20; attempt++) {
          const candidates = service.generateHiringCandidates();
          const hasLocked = candidates.some(c => !service.unlockedDepartments().has(c.assignedDepartment));
          if (hasLocked) {
            foundLockedCandidate = true;
            break;
          }
        }
        expect(foundLockedCandidate).toBe(true);
      }
    });

    it('should return both random when all departments are unlocked', () => {
      // Unlock all 4 departments
      service.addGold(100_000);
      const allDepts = ['schemes', 'heists', 'research', 'mayhem'] as const;
      for (const dept of allDepts) {
        const candidate = makeMinion({ assignedDepartment: dept, specialty: dept });
        service.hireChosenMinion(candidate);
        service.addGold(100_000); // replenish
      }
      expect(service.unlockedDepartments().size).toBe(4);

      // All candidates should be from unlocked depts (which is all of them)
      const candidates = service.generateHiringCandidates();
      expect(candidates.length).toBe(2);
    });

    it('should generate two different minion IDs', () => {
      const candidates = service.generateHiringCandidates();
      expect(candidates[0].id).not.toBe(candidates[1].id);
    });
  });

  describe('hireChosenMinion', () => {
    it('should deduct gold and add the chosen minion', () => {
      service.addGold(100);
      const cost = service.nextMinionCost();
      const candidates = service.generateHiringCandidates();

      service.hireChosenMinion(candidates[0]);
      expect(service.gold()).toBe(100 - cost);
      expect(service.minions().length).toBe(1);
      expect(service.minions()[0].id).toBe(candidates[0].id);
    });

    it('should not hire when gold is insufficient', () => {
      const candidates = service.generateHiringCandidates();
      service.hireChosenMinion(candidates[0]);
      expect(service.minions().length).toBe(0);
    });

    it('should add a hire notification', () => {
      service.addGold(100);
      const candidates = service.generateHiringCandidates();
      service.hireChosenMinion(candidates[0]);
      const minionNotif = service.notifications().find(n => n.type === 'minion');
      expect(minionNotif).toBeTruthy();
    });
  });

  // ─── Department local multiplier on gold ──────────

  describe('department local gold multiplier', () => {
    it('should apply dept local mult when department level > 1', () => {
      // getDeptLocalMult(level) = 1 + (level-1)*0.06
      // At level 3: 1 + 2*0.06 = 1.12
      const board = service.missionBoard();
      const category = board[0].template.category;
      const data = makeSaveData({
        departments: {
          schemes: { category: 'schemes', xp: 0, level: category === 'schemes' ? 3 : 1 },
          heists: { category: 'heists', xp: 0, level: category === 'heists' ? 3 : 1 },
          research: { category: 'research', xp: 0, level: category === 'research' ? 3 : 1 },
          mayhem: { category: 'mayhem', xp: 0, level: category === 'mayhem' ? 3 : 1 },
        },
        missionBoard: board,
      });
      service.loadSnapshot(data);

      const mission = service.missionBoard().find(m => m.goldReward > 0)!;
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;
      const baseReward = task.goldReward;

      completeTaskByClicking(service, task.id);

      // With dept level 3: gold = round(baseReward * 1.12)
      const expected = Math.round(baseReward * 1.12);
      expect(service.gold()).toBe(expected);
    });

    it('should award exact base reward at dept level 1', () => {
      // All departments at level 1 → getDeptLocalMult(1) = 1.0
      const mission = service.missionBoard().find(m => m.goldReward > 0)!;
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;
      const baseReward = task.goldReward;

      completeTaskByClicking(service, task.id);
      expect(service.gold()).toBe(baseReward);
    });
  });

  // ─── Phase 3A: Mission Board (service-level) ──────────

  describe('unlockedDepartmentList ordering', () => {
    it('should maintain canonical category order', () => {
      service.addGold(100_000);
      // Unlock mayhem first, then schemes
      const m1 = makeMinion({ assignedDepartment: 'mayhem', specialty: 'mayhem' });
      service.hireChosenMinion(m1);
      service.addGold(100_000);
      const m2 = makeMinion({ assignedDepartment: 'schemes', specialty: 'schemes' });
      service.hireChosenMinion(m2);

      const list = service.unlockedDepartmentList();
      // Should follow ALL_CATEGORIES order: schemes before mayhem
      const schemesIdx = list.indexOf('schemes');
      const mayhemIdx = list.indexOf('mayhem');
      expect(schemesIdx).toBeLessThan(mayhemIdx);
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
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Passed quarter: pack reward shown first
      expect(service.showPackReward()).toBe(true);
      service.pickFromPack([]);
      service.continueAfterPack();
      // Then shop opens
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
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Q4 pass: pack reward shown first
      expect(service.showPackReward()).toBe(true);
      service.pickFromPack([]);
      service.continueAfterPack();
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

    it('should emit TaskQueued when routing a mission to player queue', () => {
      const mission = service.missionBoard()[0];
      service.routeMission(mission.id, 'player');
      const queued = emitted.filter(e => e.type === 'TaskQueued');
      expect(queued.length).toBe(1);
      if (queued[0].type === 'TaskQueued') {
        expect(queued[0].department).toBe('player');
      }
    });

    it('should emit MinionHired when hiring a minion', () => {
      service.addGold(500);
      service.hireMinion();
      const hired = emitted.filter(e => e.type === 'MinionHired');
      expect(hired.length).toBe(1);
      if (hired[0].type === 'MinionHired') {
        expect(hired[0].minionId).toBeTruthy();
      }
    });

    it('should emit MinionReassigned when reassigning a minion', () => {
      service.addGold(500);
      service.hireMinion();
      const minion = service.minions()[0];
      const newDept = minion.assignedDepartment === 'schemes' ? 'heists' : 'schemes';
      service.reassignMinion(minion.id, newDept);
      const reassigned = emitted.filter(e => e.type === 'MinionReassigned');
      expect(reassigned.length).toBe(1);
      if (reassigned[0].type === 'MinionReassigned') {
        expect(reassigned[0].minionId).toBe(minion.id);
        expect(reassigned[0].toDepartment).toBe(newDept);
      }
    });

    it('should emit TaskAssigned when auto-assigning a minion to a task', () => {
      service.addGold(500);
      service.hireMinion();
      const minion = service.minions()[0];
      const dept = minion.assignedDepartment;

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

    it('should emit LevelUp for villain when completedCount crosses level threshold', () => {
      // level = min(20, floor(sqrt(c/5)) + 1)
      // Level 1: c < 5 → c in [0, 4]
      // Level 2: sqrt(c/5) >= 1 → c >= 5
      // Start at completedCount = 4 (still level 1), complete a task to cross to 5+
      const board = service.missionBoard().slice();
      service.loadSnapshot(makeSaveData({ completedCount: 4, missionBoard: board }));
      emitted = [];

      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      completeTaskByClicking(service, mission.id);

      const levelUps = emitted.filter(e => e.type === 'LevelUp' && e.target === 'villain');
      expect(levelUps.length).toBe(1);
      if (levelUps[0].type === 'LevelUp') {
        expect(levelUps[0].newLevel).toBe(2);
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
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();

      expect(service.currentReviewer()).toBeNull();
      expect(service.activeModifiers()).toEqual([]);
      expect(service.isRunOver()).toBe(false);
      // Pack reward first, then shop opens before Y+1 Q1
      expect(service.showPackReward()).toBe(true);
      service.pickFromPack([]);
      service.continueAfterPack();
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
      const data = makeSaveData({
        quarterProgress: {
          year: 1,
          quarter: 3,
          grossGoldEarned: 1500,
          tasksCompleted: 60,
          isComplete: true,
          missedQuarters,
          quarterResults: [{ year: 1, quarter: 3, passed: true, goldEarned: 1500, target: 1200, tasksCompleted: 60 }],
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
      service.hireMinion();
      expect(service.minions().length).toBe(minionsBefore);
    });

    it('should block hireChosenMinion when hiringDisabled is active', () => {
      enterReview();
      (service as any)._hiringDisabled.set(true);

      service.addGold(10_000);
      const candidates = service.generateHiringCandidates();
      service.hireChosenMinion(candidates[0]);
      expect(service.minions().length).toBe(0);
    });

    it('should block board refresh when boardFrozen is active', () => {
      enterReview();
      (service as any)._boardFrozen.set(true);

      // Clear the board manually
      const snapshot = service.getSnapshot();
      snapshot.missionBoard = [];
      service.loadSnapshot(snapshot);
      (service as any)._boardFrozen.set(true);

      service.refreshBoard();
      expect(service.missionBoard().length).toBe(0); // Board stays empty
    });

    it('should limit board capacity to 2 when boardLimited is active', () => {
      enterReview();
      (service as any)._boardLimited.set(true);

      expect(service.boardCapacity()).toBe(2);
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

    it('should apply gold reward multiplier', () => {
      (service as any)._goldRewardMultiplier.set(0.7);

      const mission = service.missionBoard()[0];
      const reward = mission.goldReward;
      service.acceptMission(mission.id);
      completeTaskByClicking(service, mission.id);

      expect(service.gold()).toBe(Math.round(reward * 0.7));
    });

    it('should block routing to locked category', () => {
      service.addGold(10_000);
      // Unlock schemes
      const m = makeMinion({ assignedDepartment: 'schemes', specialty: 'schemes' });
      service.hireChosenMinion(m);

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
      (service as any)._boardFrozen.set(true);

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
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Constraints should be reverted immediately, even before shop closes
      expect(service.hiringDisabled()).toBe(false);
      expect(service.boardFrozen()).toBe(false);
      expect(service.lockedCategory()).toBeNull();
    });
  });

  describe('Vouchers', () => {
    it('should start with all vouchers at level 0', () => {
      const v = service.ownedVouchers();
      expect(v['iron-fingers']).toBe(0);
      expect(v['board-expansion']).toBe(0);
      expect(v['operations-desk']).toBe(0);
      expect(v['rapid-intel']).toBe(0);
      expect(v['hire-discount']).toBe(0);
      expect(v['dept-funding']).toBe(0);
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

      it('board-expansion should increase board capacity', () => {
        const baseCap = service.boardCapacity();
        service.purchaseVoucher('board-expansion');
        expect(service.boardCapacity()).toBe(baseCap + 3);
      });

      it('operations-desk should increase active slots', () => {
        const baseSlots = service.activeSlots();
        service.purchaseVoucher('operations-desk');
        expect(service.activeSlots()).toBe(baseSlots + 2);
      });

      it('hire-discount should reduce next minion cost', () => {
        const baseCost = service.nextMinionCost();
        service.purchaseVoucher('hire-discount');
        const discountedCost = service.nextMinionCost();
        expect(discountedCost).toBeLessThan(baseCost);
        expect(discountedCost).toBe(Math.floor(75 * (1 - 0.20)));
      });

      it('rapid-intel should reduce board refresh interval', () => {
        const baseInterval = service.getEffectiveBoardRefreshInterval();
        service.purchaseVoucher('rapid-intel');
        const newInterval = service.getEffectiveBoardRefreshInterval();
        expect(newInterval).toBeLessThan(baseInterval);
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
          ownedVouchers: { 'iron-fingers': 2, 'dept-funding': 1 },
        });
        service.loadSnapshot(data);
        expect(service.ownedVouchers()['iron-fingers']).toBe(2);
        expect(service.ownedVouchers()['dept-funding']).toBe(1);
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
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Passed quarter: pack reward first, then shop
      expect(service.showPackReward()).toBe(true);
      expect(service.showShop()).toBe(false);
      // Quarter should NOT have advanced yet
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
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Passed quarter: go through pack reward first
      expect(service.showPackReward()).toBe(true);
      service.pickFromPack([]);
      service.continueAfterPack();
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
        },
      });
      service.loadSnapshot(data);
      service.advanceQuarter();
      // Pack reward first
      expect(service.showPackReward()).toBe(true);
      service.pickFromPack([]);
      service.continueAfterPack();
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

});
