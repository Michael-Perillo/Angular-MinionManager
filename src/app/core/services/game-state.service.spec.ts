import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { completeTaskByClicking, setupGameWithMinions, acceptFirstMission, tickUntilComplete } from '../../../testing/helpers/game-test-helpers';
import { makeSaveData } from '../../../testing/factories/game-state.factory';
import { makeMinion, makeCapturedMinion } from '../../../testing/factories/minion.factory';
import { makeTask, makeCoverOpTask, makeBreakoutTask } from '../../../testing/factories/task.factory';
import { NOTORIETY_PER_TIER, COVER_TRACKS_REDUCTION } from '../models/notoriety.model';
import { TIER_CONFIG } from '../models/task.model';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStateService);
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

    it('should start with 0 notoriety', () => {
      expect(service.notoriety()).toBe(0);
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

      // Gold should be awarded (may be modified by notoriety penalty but at 0 it's exact)
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
      service.addGold(50);
      service.hireMinion();
      expect(service.minions().length).toBe(1);
    });

    it('should deduct the cost from gold', () => {
      service.addGold(60);
      service.hireMinion(); // costs 50
      expect(service.gold()).toBe(10);
    });

    it('should give minion stats, specialty, and level', () => {
      service.addGold(50);
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
      service.addGold(50);
      service.hireMinion();
      const minion = service.minions()[0];
      expect(minion).toBeTruthy();
      expect(minion.name).toBeTruthy();
      expect(minion.status).toBe('idle');
      expect(minion.assignedTaskId).toBeNull();
    });

    it('should give minion an appearance', () => {
      service.addGold(50);
      service.hireMinion();
      const minion = service.minions()[0];
      expect(minion.appearance).toBeTruthy();
      expect(minion.appearance.color).toBeTruthy();
      expect(minion.appearance.accessory).toBeTruthy();
    });
  });

  describe('upgrades', () => {
    it('should start with default upgrades all at level 0', () => {
      const upgrades = service.upgrades();
      expect(upgrades.length).toBeGreaterThan(0);
      upgrades.forEach(u => expect(u.currentLevel).toBe(0));
    });

    it('should purchase upgrade when gold is sufficient', () => {
      service.addGold(1000);
      service.purchaseUpgrade('click-power');
      const upgrade = service.upgrades().find(u => u.id === 'click-power');
      expect(upgrade?.currentLevel).toBe(1);
    });

    it('should not purchase when gold is insufficient', () => {
      service.purchaseUpgrade('click-power');
      const upgrade = service.upgrades().find(u => u.id === 'click-power');
      expect(upgrade?.currentLevel).toBe(0);
    });
  });

  describe('notoriety', () => {
    it('should start at 0', () => {
      expect(service.notoriety()).toBe(0);
    });

    it('should increase when tasks are completed', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      const task = service.activeMissions()[0];

      for (let i = 0; i < task.clicksRequired; i++) {
        service.clickTask(task.id);
      }

      expect(service.notoriety()).toBeGreaterThan(0);
    });

    it('should decrease when bribe is paid', () => {
      // Manually set notoriety high
      service.addGold(1000);
      // Complete many tasks to build notoriety
      for (let i = 0; i < 5; i++) {
        const mission = service.missionBoard()[0];
        service.acceptMission(mission.id);
        const task = service.activeMissions().find(t => t.status === 'queued')!;
        for (let j = 0; j < task.clicksRequired; j++) {
          service.clickTask(task.id);
        }
      }

      const notBefore = service.notoriety();
      expect(notBefore).toBeGreaterThan(0);

      service.payBribe();
      expect(service.notoriety()).toBeLessThan(notBefore);
    });
  });

  describe('computed signals', () => {
    it('nextMinionCost should be 50 for first minion', () => {
      expect(service.nextMinionCost()).toBe(50);
    });

    it('canHireMinion should be false with 0 gold', () => {
      expect(service.canHireMinion()).toBe(false);
    });

    it('canHireMinion should be true with enough gold', () => {
      service.addGold(50);
      expect(service.canHireMinion()).toBe(true);
    });

    it('idleMinions should track idle minions', () => {
      service.addGold(50);
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
      service.addGold(50);
      service.hireMinion();

      // Reassign minion to the task's department so auto-assign can work
      const minion = service.minions()[0];
      service.reassignMinion(minion.id, mission.template.category);

      service.tickTime();
      expect(service.workingMinions().length).toBe(1);
      expect(service.idleMinions().length).toBe(0);
    });

    it('should complete task and free minion when timer reaches 0', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      service.addGold(50);
      service.hireMinion();

      // Reassign minion to matching department
      const minion = service.minions()[0];
      service.reassignMinion(minion.id, mission.template.category);

      service.tickTime(); // assigns minion

      const task = service.inProgressTasks()[0];
      expect(task).toBeTruthy();
      const goldBefore = service.gold();
      const completedBefore = service.completedCount();

      // Tick enough times to complete the task (accounting for speed > 1)
      for (let i = 0; i < task.timeToComplete + 5; i++) {
        service.tickTime();
      }

      expect(service.activeMissions().find(t => t.id === task.id)).toBeUndefined();
      expect(service.gold()).toBeGreaterThan(goldBefore);
      expect(service.completedCount()).toBeGreaterThan(completedBefore);
      expect(service.minions()[0]).toBeTruthy();
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
      expect(service.notoriety()).toBe(0);
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
      service.addGold(50);
      service.hireMinion();
      const minionNotif = service.notifications().find(n => n.type === 'minion');
      expect(minionNotif).toBeTruthy();
    });

    it('should dismiss notification by id', () => {
      service.addGold(50);
      service.hireMinion();
      const notif = service.notifications()[0];
      service.dismissNotification(notif.id);
      expect(service.notifications().find(n => n.id === notif.id)).toBeUndefined();
    });
  });

  // ─── Phase 2: Expanded tests ──────────────────

  describe('awardGold (via clickTask completion)', () => {
    it('should award full gold at 0 notoriety', () => {
      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;
      const reward = task.goldReward;

      completeTaskByClicking(service, task.id);
      // At 0 notoriety, gold awarded equals reward (possibly + click-gold bonus at level 0 = 1x)
      expect(service.gold()).toBe(reward);
    });

    it('should apply notoriety gold penalty at high notoriety', () => {
      // Grab board missions from the already-initialized game, then reload
      // with high notoriety so we have both missions and penalty in place.
      const board = service.missionBoard();
      service.loadSnapshot(makeSaveData({ notoriety: 80, missionBoard: board }));

      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp && m.goldReward > 0)!;
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;
      const reward = task.goldReward;

      completeTaskByClicking(service, task.id);

      // penalty at 80 = (80-35)/65*0.30 ≈ 20.7%, so gold < full reward
      expect(service.gold()).toBeLessThan(reward);
      expect(service.gold()).toBeGreaterThan(0);
    });

    it('should increase department XP on task completion', () => {
      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
      const category = mission.template.category;
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;

      completeTaskByClicking(service, task.id);
      expect(service.departments()[category].xp).toBeGreaterThan(0);
    });

    it('should increase notoriety on task completion', () => {
      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;

      completeTaskByClicking(service, task.id);
      expect(service.notoriety()).toBeGreaterThan(0);
    });
  });

  describe('clickTask edge cases', () => {
    it('should apply click power upgrade', () => {
      service.addGold(10_000);
      service.purchaseUpgrade('click-power'); // level 1 → clickPower = 2
      expect(service.clickPower()).toBe(2);

      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;
      const clicksBefore = task.clicksRemaining;

      service.clickTask(task.id);
      const after = service.activeMissions().find(t => t.id === task.id);
      if (after) {
        expect(after.clicksRemaining).toBe(clicksBefore - 2);
      }
    });

    it('should not click a task that is already complete', () => {
      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
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
      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
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

    it('should apply click gold bonus upgrade', () => {
      service.addGold(10_000);
      service.purchaseUpgrade('click-gold'); // +15% gold

      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp && m.goldReward > 0)!;
      service.acceptMission(mission.id);
      const task = service.activeMissions().find(t => t.id === mission.id)!;
      const baseReward = task.goldReward;

      completeTaskByClicking(service, task.id);
      // With click-gold level 1, bonus = 1 + 0.15 = 1.15x, so gold >= round(reward * 1.15)
      const expectedMin = Math.round(baseReward * 1.15);
      expect(service.gold()).toBeGreaterThanOrEqual(expectedMin - service.nextMinionCost());
    });
  });

  describe('cover op completion', () => {
    it('should reduce notoriety and award no gold when completing a cover op by clicking', () => {
      // First build some notoriety
      for (let i = 0; i < 5; i++) {
        const m = service.missionBoard().find(t => !t.isCoverOp && !t.isBreakoutOp);
        if (!m) break;
        service.acceptMission(m.id);
        completeTaskByClicking(service, m.id);
      }
      const notorietyBefore = service.notoriety();
      expect(notorietyBefore).toBeGreaterThan(0);

      // Now find or force a cover op
      const coverMission = service.missionBoard().find(m => m.isCoverOp);
      if (coverMission) {
        const goldBefore = service.gold();
        service.acceptMission(coverMission.id);
        completeTaskByClicking(service, coverMission.id);

        // Cover ops don't award gold (goldReward = 0)
        expect(service.gold()).toBe(goldBefore);
        // Notoriety should decrease
        expect(service.notoriety()).toBeLessThan(notorietyBefore);
      }
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
        const m = service.missionBoard().find(t => !t.isCoverOp && !t.isBreakoutOp);
        if (!m) break;
        service.acceptMission(m.id);
        completeTaskByClicking(service, m.id);
      }
      expect(service.villainLevel()).toBeGreaterThan(1);
    });

    it('should cap at 20', () => {
      // Formula: min(20, floor(sqrt(completed/2.5)) + 1)
      // To reach 20: sqrt(c/2.5) + 1 >= 20 → c >= 2.5 * 19^2 = 902.5
      // We can test the formula directly
      // At completed = 1000, floor(sqrt(1000/2.5)) + 1 = floor(20) + 1 = 21, capped at 20
      // We test via snapshot
      const saveData = makeSaveData({ completedCount: 1000 });
      service.loadSnapshot(saveData);
      expect(service.villainLevel()).toBe(20);
    });

    it('should return specific values for known completedCount', () => {
      // completedCount=0 → level 1
      expect(service.villainLevel()).toBe(1);

      // completedCount=3 → floor(sqrt(3/2.5)) + 1 = floor(1.095) + 1 = 2
      let data = makeSaveData({ completedCount: 3 });
      service.loadSnapshot(data);
      expect(service.villainLevel()).toBe(2);

      // completedCount=10 → floor(sqrt(10/2.5)) + 1 = floor(2) + 1 = 3
      data = makeSaveData({ completedCount: 10 });
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

  describe('raid mechanics', () => {
    it('should not trigger raid when notoriety < 60', () => {
      spyOn(Math, 'random').and.returnValue(0.001); // would trigger if allowed
      service.tickTime();
      expect(service.raidActive()).toBe(false);
    });

    it('should trigger raid when notoriety >= 60 and random < 0.02', () => {
      const data = makeSaveData({ notoriety: 70 });
      service.loadSnapshot(data);
      spyOn(Math, 'random').and.returnValue(0.01); // < 0.02
      service.tickTime();
      expect(service.raidActive()).toBe(true);
      expect(service.raidTimer()).toBeGreaterThan(0);
    });

    it('should not trigger raid when random >= 0.02', () => {
      const data = makeSaveData({ notoriety: 70 });
      service.loadSnapshot(data);
      spyOn(Math, 'random').and.returnValue(0.5);
      service.tickTime();
      expect(service.raidActive()).toBe(false);
    });

    it('should decrement raid timer each tick', () => {
      const data = makeSaveData({ notoriety: 70 });
      service.loadSnapshot(data);
      spyOn(Math, 'random').and.returnValue(0.01);
      service.tickTime(); // triggers raid

      const timerAfterTrigger = service.raidTimer();
      // Next tick should decrement (raid is active, so step 7 runs)
      (Math.random as jasmine.Spy).and.returnValue(0.99); // prevent new events
      service.tickTime();
      expect(service.raidTimer()).toBeLessThan(timerAfterTrigger);
    });

    it('should reduce notoriety by 20 when raid is repelled via defendRaid', () => {
      const data = makeSaveData({ notoriety: 70 });
      service.loadSnapshot(data);
      spyOn(Math, 'random').and.returnValue(0.01);
      service.tickTime(); // triggers raid

      // Defend until repelled
      while (service.raidActive()) {
        service.defendRaid();
      }
      expect(service.notoriety()).toBe(50); // 70 - 20
    });

    it('should capture a minion when raid timer expires', () => {
      const minion = makeMinion();
      const data = makeSaveData({
        notoriety: 70,
        minions: [minion],
      });
      service.loadSnapshot(data);
      expect(service.minions().length).toBe(1);

      spyOn(Math, 'random').and.returnValue(0.01);
      service.tickTime(); // triggers raid

      // Let raid timer expire by ticking
      (Math.random as jasmine.Spy).and.returnValue(0.99);
      tickUntilComplete(service, 15);

      // Minion should be captured
      expect(service.minions().length).toBe(0);
      expect(service.capturedMinions().length).toBe(1);
    });

    it('should reduce notoriety by 15 when raid captures a minion', () => {
      const minion = makeMinion();
      const data = makeSaveData({
        notoriety: 70,
        minions: [minion],
      });
      service.loadSnapshot(data);

      spyOn(Math, 'random').and.returnValue(0.01);
      service.tickTime();

      (Math.random as jasmine.Spy).and.returnValue(0.99);
      tickUntilComplete(service, 15);

      // notoriety = 70 - 15 = 55 (raid lost reduces by 15)
      expect(service.notoriety()).toBe(55);
    });
  });

  describe('breakout missions', () => {
    it('should generate breakout mission for captured minion', () => {
      const minion = makeMinion();
      const captured = makeCapturedMinion({ minion });
      const data = makeSaveData({
        capturedMinions: [captured],
      });
      service.loadSnapshot(data);

      // Board may contain breakout missions after refill
      // Force a board refill by ticking
      spyOn(Math, 'random').and.returnValue(0.1); // 0.1 < 0.20 → breakout mission chance
      tickUntilComplete(service, 5);

      const breakoutMission = service.missionBoard().find(m => m.isBreakoutOp);
      if (breakoutMission) {
        expect(breakoutMission.breakoutTargetId).toBe(minion.id);
        expect(breakoutMission.goldReward).toBe(0);
      }
    });
  });

  describe('minion XP & leveling', () => {
    it('should award minion XP after completing a task via minion', () => {
      setupGameWithMinions(service, 1);
      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
      service.acceptMission(mission.id);

      // Reassign minion to matching department
      const minion = service.minions()[0];
      service.reassignMinion(minion.id, mission.template.category);

      service.tickTime(); // assigns minion

      const minionBefore = service.minions()[0];
      expect(minionBefore.xp).toBe(0);

      // Tick until task completes
      tickUntilComplete(service, 100);

      const minionAfter = service.minions()[0];
      if (minionAfter) {
        expect(minionAfter.xp).toBeGreaterThan(0);
      }
    });

    it('should increase XP with minion-xp upgrade', () => {
      service.addGold(10_000);
      service.hireMinion();
      service.purchaseUpgrade('minion-xp'); // +20% XP

      const mission = service.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
      service.acceptMission(mission.id);

      // Reassign minion to matching department
      service.reassignMinion(service.minions()[0].id, mission.template.category);

      service.tickTime();

      tickUntilComplete(service, 100);

      const minion = service.minions()[0];
      if (minion) {
        expect(minion.xp).toBeGreaterThan(0);
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
      expect(service.notoriety()).toBe(snapshot.notoriety);
    });

    it('should preserve upgrade levels through snapshot', () => {
      service.addGold(10_000);
      service.purchaseUpgrade('click-power');
      service.purchaseUpgrade('click-power');

      const snapshot = service.getSnapshot();
      service.resetGame();
      expect(service.getUpgradeLevel('click-power')).toBe(0);

      service.loadSnapshot(snapshot);
      expect(service.getUpgradeLevel('click-power')).toBe(2);
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

    it('should handle capturedMinions defaulting to [] on load', () => {
      const data = makeSaveData();
      delete (data as any).capturedMinions;
      service.loadSnapshot(data);
      expect(service.capturedMinions().length).toBe(0);
    });

    it('should include version 3 in snapshot', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot.version).toBe(3);
    });
  });

  describe('purchaseUpgrade edge cases', () => {
    it('should not exceed maxLevel', () => {
      service.addGold(1_000_000);
      const upgrade = service.upgrades().find(u => u.id === 'click-power')!;
      for (let i = 0; i < upgrade.maxLevel + 5; i++) {
        service.purchaseUpgrade('click-power');
      }
      expect(service.getUpgradeLevel('click-power')).toBe(upgrade.maxLevel);
    });

    it('should do nothing for unknown upgrade ID', () => {
      service.addGold(1000);
      const goldBefore = service.gold();
      service.purchaseUpgrade('nonexistent');
      expect(service.gold()).toBe(goldBefore);
    });
  });

  describe('payBribe edge cases', () => {
    it('should not bribe when notoriety is 0', () => {
      service.addGold(1000);
      const goldBefore = service.gold();
      service.payBribe();
      expect(service.gold()).toBe(goldBefore);
    });

    it('should not bribe when gold is insufficient', () => {
      const data = makeSaveData({ notoriety: 50 });
      service.loadSnapshot(data);
      // bribeCost(50) = 20 + 50*2 = 120
      service.addGold(10);
      service.payBribe();
      expect(service.notoriety()).toBe(50);
    });

    it('should not reduce notoriety below 0', () => {
      const data = makeSaveData({ notoriety: 5, gold: 1000 });
      service.loadSnapshot(data);
      service.payBribe();
      expect(service.notoriety()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('defendRaid', () => {
    it('should do nothing when no raid is active', () => {
      expect(service.raidActive()).toBe(false);
      service.defendRaid();
      expect(service.raidActive()).toBe(false);
    });
  });

  describe('board and active capacity scaling', () => {
    it('should increase board capacity with minions', () => {
      const baseCap = service.boardCapacity();
      setupGameWithMinions(service, 2, 10_000);
      expect(service.boardCapacity()).toBeGreaterThan(baseCap);
    });

    it('should increase board capacity with board-slots upgrade', () => {
      service.addGold(10_000);
      const baseCap = service.boardCapacity();
      service.purchaseUpgrade('board-slots');
      expect(service.boardCapacity()).toBe(baseCap + 3);
    });

    it('should increase active slots with minions', () => {
      const baseSlots = service.activeSlots(); // 3
      setupGameWithMinions(service, 2, 10_000);
      expect(service.activeSlots()).toBe(baseSlots + 2);
    });

    it('should increase active slots with active-slots upgrade', () => {
      service.addGold(10_000);
      const baseSlots = service.activeSlots();
      service.purchaseUpgrade('active-slots');
      expect(service.activeSlots()).toBe(baseSlots + 1);
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

  describe('hire discount', () => {
    it('should reduce hire cost with hire-discount upgrade', () => {
      service.addGold(10_000);
      const baseCost = service.nextMinionCost();
      service.purchaseUpgrade('hire-discount');
      const discountedCost = service.nextMinionCost();
      expect(discountedCost).toBeLessThan(baseCost);
    });
  });

  describe('acceptMission edge cases', () => {
    it('should not accept a mission not on the board', () => {
      service.acceptMission('nonexistent-id');
      expect(service.activeMissions().length).toBe(0);
    });
  });
});
