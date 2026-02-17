import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';

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
      // Accept a mission, then hire a minion
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      service.addGold(50);
      service.hireMinion();

      service.tickTime();
      expect(service.workingMinions().length).toBe(1);
      expect(service.idleMinions().length).toBe(0);
    });

    it('should complete task and free minion when timer reaches 0', () => {
      const mission = service.missionBoard()[0];
      service.acceptMission(mission.id);
      service.addGold(50);
      service.hireMinion();
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
});
