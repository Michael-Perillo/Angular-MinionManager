import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameTimerService } from './game-timer.service';
import { GameStateService } from './game-state.service';
import { GameEventService } from './game-event.service';
import { SaveService } from './save.service';

describe('GameTimerService', () => {
  let timerService: GameTimerService;
  let gameState: GameStateService;
  let events: GameEventService;
  let saveService: SaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    timerService = TestBed.inject(GameTimerService);
    gameState = TestBed.inject(GameStateService);
    events = TestBed.inject(GameEventService);
    saveService = TestBed.inject(SaveService);
    gameState.initializeGame();
  });

  afterEach(() => {
    timerService.stop();
  });

  it('should be created', () => {
    expect(timerService).toBeTruthy();
  });

  it('fakeAsync advances Date.now()', fakeAsync(() => {
    const start = Date.now();
    tick(5000);
    expect(Date.now()).toBe(start + 5000);
  }));

  describe('notoriety decay', () => {
    it('should call processNotorietyDecay every 1s', fakeAsync(() => {
      spyOn(gameState, 'processNotorietyDecay');
      timerService.start();

      tick(3000);
      expect(gameState.processNotorietyDecay).toHaveBeenCalledTimes(3);

      timerService.stop();
    }));

    it('should pause notoriety decay on RaidStarted', fakeAsync(() => {
      spyOn(gameState, 'processNotorietyDecay');
      timerService.start();

      tick(1000);
      expect(gameState.processNotorietyDecay).toHaveBeenCalledTimes(1);

      events.emit({ type: 'RaidStarted' });
      tick(3000);
      // Should still be 1 — paused during raid
      expect(gameState.processNotorietyDecay).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should resume notoriety decay on RaidEnded', fakeAsync(() => {
      spyOn(gameState, 'processNotorietyDecay');
      timerService.start();

      events.emit({ type: 'RaidStarted' });
      tick(2000);
      expect(gameState.processNotorietyDecay).toHaveBeenCalledTimes(0);

      events.emit({ type: 'RaidEnded', defended: true });
      tick(2000);
      expect(gameState.processNotorietyDecay).toHaveBeenCalledTimes(2);

      timerService.stop();
    }));
  });

  describe('notification cleanup', () => {
    it('should call cleanNotifications every 1s', fakeAsync(() => {
      spyOn(gameState, 'cleanNotifications');
      timerService.start();

      tick(3000);
      expect(gameState.cleanNotifications).toHaveBeenCalledTimes(3);

      timerService.stop();
    }));
  });

  describe('auto-save', () => {
    it('should save every 30s', fakeAsync(() => {
      spyOn(saveService, 'save');
      spyOn(gameState, 'markSaved');
      timerService.start();

      tick(29_000);
      expect(saveService.save).not.toHaveBeenCalled();

      tick(1000);
      expect(saveService.save).toHaveBeenCalledTimes(1);
      expect(gameState.markSaved).toHaveBeenCalledTimes(1);

      tick(30_000);
      expect(saveService.save).toHaveBeenCalledTimes(2);

      timerService.stop();
    }));
  });

  describe('board refresh', () => {
    it('should call refreshBoard after the effective interval', fakeAsync(() => {
      spyOn(gameState, 'refreshBoard');
      const interval = gameState.getEffectiveBoardRefreshInterval();
      timerService.start();

      tick(interval - 1);
      expect(gameState.refreshBoard).not.toHaveBeenCalled();

      tick(1);
      expect(gameState.refreshBoard).toHaveBeenCalledTimes(1);

      // Self-reschedules
      tick(interval);
      expect(gameState.refreshBoard).toHaveBeenCalledTimes(2);

      timerService.stop();
    }));
  });

  describe('special op expiry', () => {
    it('should schedule expiry timer on SpecialOpSpawned event', fakeAsync(() => {
      spyOn(gameState, 'removeExpiredSpecialOp');
      timerService.start();

      // Add a special op to the board
      const board = gameState.missionBoard();
      const specialOp = {
        ...board[0],
        id: 'special-test',
        isSpecialOp: true,
        specialOpExpiry: Date.now() + 5000,
      };
      // Directly inject the mission into the board for testing
      gameState.loadSnapshot({
        ...gameState.getSnapshot(),
        missionBoard: [...board, specialOp],
      });

      events.emit({ type: 'SpecialOpSpawned', missionId: 'special-test', tier: 'sinister' });

      tick(4999);
      expect(gameState.removeExpiredSpecialOp).not.toHaveBeenCalled();

      tick(1);
      expect(gameState.removeExpiredSpecialOp).toHaveBeenCalledWith('special-test');

      timerService.stop();
    }));
  });

  describe('task completion timers', () => {
    it('should schedule and fire task completion on TaskAssigned event', fakeAsync(() => {
      spyOn(gameState, 'completeTaskByTimer');
      timerService.start();

      events.emit({ type: 'TaskAssigned', taskId: 't1', minionId: 'm1', department: 'schemes', durationMs: 3000 });

      tick(2999);
      expect(gameState.completeTaskByTimer).not.toHaveBeenCalled();

      tick(1);
      expect(gameState.completeTaskByTimer).toHaveBeenCalledWith('t1', 'schemes');

      timerService.stop();
    }));

    it('should cancel task timer when minion is captured', fakeAsync(() => {
      spyOn(gameState, 'completeTaskByTimer');
      // Set up a minion with an in-progress task
      gameState.addGold(500);
      gameState.hireMinion();
      const minion = gameState.minions()[0];
      const mission = gameState.missionBoard()[0];
      const dept = mission.template.category;
      gameState.reassignMinion(minion.id, dept);
      gameState.routeMission(mission.id, dept);
      gameState.tickTime(); // auto-assign

      timerService.start();

      events.emit({ type: 'TaskAssigned', taskId: mission.id, minionId: minion.id, department: dept, durationMs: 5000 });
      events.emit({ type: 'MinionCaptured', minionId: minion.id, minionName: minion.name });

      tick(6000);
      expect(gameState.completeTaskByTimer).not.toHaveBeenCalled();

      timerService.stop();
    }));
  });

  describe('auto-assign', () => {
    it('should call autoAssignMinions on MinionIdle event (debounced)', fakeAsync(() => {
      spyOn(gameState, 'autoAssignMinions');
      timerService.start();

      events.emit({ type: 'MinionIdle', minionId: 'm1', department: 'schemes' });
      // Not called yet — debounced via microtask
      expect(gameState.autoAssignMinions).not.toHaveBeenCalled();

      tick(0); // flush microtask
      expect(gameState.autoAssignMinions).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should call autoAssignMinions on TaskQueued event', fakeAsync(() => {
      spyOn(gameState, 'autoAssignMinions');
      timerService.start();

      events.emit({ type: 'TaskQueued', taskId: 't1', department: 'heists' });
      tick(0);
      expect(gameState.autoAssignMinions).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should call autoAssignMinions on MinionHired event', fakeAsync(() => {
      spyOn(gameState, 'autoAssignMinions');
      timerService.start();

      events.emit({ type: 'MinionHired', minionId: 'm1', department: 'research' });
      tick(0);
      expect(gameState.autoAssignMinions).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should debounce multiple rapid events into one call', fakeAsync(() => {
      spyOn(gameState, 'autoAssignMinions');
      timerService.start();

      events.emit({ type: 'MinionIdle', minionId: 'm1', department: 'schemes' });
      events.emit({ type: 'TaskQueued', taskId: 't1', department: 'schemes' });
      events.emit({ type: 'MinionHired', minionId: 'm2', department: 'heists' });

      tick(0);
      // All three events should be batched into a single call
      expect(gameState.autoAssignMinions).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should allow subsequent auto-assign after debounce completes', fakeAsync(() => {
      spyOn(gameState, 'autoAssignMinions');
      timerService.start();

      events.emit({ type: 'MinionIdle', minionId: 'm1', department: 'schemes' });
      tick(0);
      expect(gameState.autoAssignMinions).toHaveBeenCalledTimes(1);

      // Second batch
      events.emit({ type: 'TaskQueued', taskId: 't2', department: 'heists' });
      tick(0);
      expect(gameState.autoAssignMinions).toHaveBeenCalledTimes(2);

      timerService.stop();
    }));
  });

  describe('lifecycle', () => {
    it('stop should clear all timers', fakeAsync(() => {
      spyOn(gameState, 'processNotorietyDecay');
      spyOn(gameState, 'cleanNotifications');
      spyOn(saveService, 'save');
      timerService.start();

      tick(1000);
      expect(gameState.processNotorietyDecay).toHaveBeenCalledTimes(1);

      timerService.stop();
      tick(5000);
      // No additional calls after stop
      expect(gameState.processNotorietyDecay).toHaveBeenCalledTimes(1);
      expect(gameState.cleanNotifications).toHaveBeenCalledTimes(1);
    }));

    it('restartTimers should re-subscribe to events', fakeAsync(() => {
      spyOn(gameState, 'processNotorietyDecay');
      timerService.start();

      timerService.restartTimers();
      tick(2000);
      expect(gameState.processNotorietyDecay).toHaveBeenCalledTimes(2);

      timerService.stop();
    }));
  });
});
