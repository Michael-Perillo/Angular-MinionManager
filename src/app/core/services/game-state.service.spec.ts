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

    it('should seed 3 initial tasks', () => {
      expect(service.taskQueue().length).toBe(3);
    });

    it('should start with 0 completed count', () => {
      expect(service.completedCount()).toBe(0);
    });

    it('should have all initial tasks in queued status', () => {
      service.taskQueue().forEach(task => {
        expect(task.status).toBe('queued');
      });
    });
  });

  describe('clickTask', () => {
    it('should decrement clicks remaining', () => {
      const task = service.taskQueue()[0];
      const initialClicks = task.clicksRemaining;
      service.clickTask(task.id);
      const updatedTask = service.taskQueue().find(t => t.id === task.id);
      if (updatedTask) {
        expect(updatedTask.clicksRemaining).toBeLessThan(initialClicks);
      }
    });

    it('should change status to in-progress on first click', () => {
      const task = service.taskQueue()[0];
      service.clickTask(task.id);
      const updatedTask = service.taskQueue().find(t => t.id === task.id);
      if (updatedTask) {
        expect(updatedTask.status).toBe('in-progress');
      }
    });

    it('should award gold and remove task when all clicks done', () => {
      const task = service.taskQueue()[0];
      const reward = task.goldReward;

      for (let i = 0; i < task.clicksRequired; i++) {
        service.clickTask(task.id);
      }

      expect(service.gold()).toBe(reward);
      expect(service.completedCount()).toBe(1);
      expect(service.taskQueue().find(t => t.id === task.id)).toBeUndefined();
    });

    it('should not allow clicking a minion-assigned task', () => {
      const task = service.taskQueue()[0];
      // Hire a minion and let it assign
      service.addGold(50);
      service.hireMinion();
      service.tickTime(); // assigns minion

      const assignedTask = service.taskQueue().find(t => t.assignedMinionId !== null);
      if (assignedTask) {
        const clicksBefore = assignedTask.clicksRemaining;
        service.clickTask(assignedTask.id);
        const taskAfter = service.taskQueue().find(t => t.id === assignedTask.id);
        if (taskAfter) {
          expect(taskAfter.clicksRemaining).toBe(clicksBefore);
        }
      }
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

    it('should scale cost for second minion', () => {
      service.addGold(200);
      service.hireMinion(); // 1st costs 50
      expect(service.nextMinionCost()).toBe(75); // 50 * 1.5^1
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

    it('queuedTasks should return only queued tasks', () => {
      expect(service.queuedTasks().length).toBe(3);
      // Click one task to make it in-progress
      service.clickTask(service.taskQueue()[0].id);
      expect(service.queuedTasks().length).toBe(2);
    });
  });

  describe('tickTime', () => {
    it('should auto-assign idle minions to queued tasks', () => {
      service.addGold(50);
      service.hireMinion();
      expect(service.queuedTasks().length).toBeGreaterThan(0);

      service.tickTime();
      expect(service.workingMinions().length).toBe(1);
      expect(service.idleMinions().length).toBe(0);
    });

    it('should decrement time remaining for minion-worked tasks', () => {
      service.addGold(50);
      service.hireMinion();
      service.tickTime(); // assigns minion

      const task = service.inProgressTasks()[0];
      expect(task).toBeTruthy();
      const timeBefore = task.timeRemaining;

      service.tickTime();

      const taskAfter = service.taskQueue().find(t => t.id === task.id);
      if (taskAfter) {
        expect(taskAfter.timeRemaining).toBe(timeBefore - 1);
      }
    });

    it('should complete task and free minion when timer reaches 0', () => {
      service.addGold(50);
      service.hireMinion();
      service.tickTime(); // assigns minion

      const task = service.inProgressTasks()[0];
      expect(task).toBeTruthy();
      const goldBefore = service.gold();
      const completedBefore = service.completedCount();

      // Tick enough times to complete the task
      for (let i = 0; i < task.timeRemaining + 1; i++) {
        service.tickTime();
      }

      // Task should be removed and gold earned
      expect(service.taskQueue().find(t => t.id === task.id)).toBeUndefined();
      expect(service.gold()).toBeGreaterThan(goldBefore);
      expect(service.completedCount()).toBeGreaterThan(completedBefore);
      // Minion may be idle or re-assigned to another queued task
      expect(service.minions()[0]).toBeTruthy();
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
      expect(service.taskQueue().length).toBe(3);
    });
  });

  describe('notifications', () => {
    it('should add notification when gold is awarded', () => {
      const task = service.taskQueue()[0];
      for (let i = 0; i < task.clicksRequired; i++) {
        service.clickTask(task.id);
      }
      expect(service.notifications().length).toBeGreaterThan(0);
      expect(service.notifications()[0].type).toBe('gold');
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
