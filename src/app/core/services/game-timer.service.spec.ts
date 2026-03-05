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
    it('should save every 10s', fakeAsync(() => {
      spyOn(saveService, 'save');
      spyOn(gameState, 'markSaved');
      timerService.start();

      tick(9_000);
      expect(saveService.save).not.toHaveBeenCalled();

      tick(1000);
      expect(saveService.save).toHaveBeenCalledTimes(1);
      expect(gameState.markSaved).toHaveBeenCalledTimes(1);

      tick(10_000);
      expect(saveService.save).toHaveBeenCalledTimes(2);

      timerService.stop();
    }));

    it('saveNow() should save immediately', () => {
      spyOn(saveService, 'save');
      spyOn(gameState, 'markSaved');

      timerService.saveNow();

      expect(saveService.save).toHaveBeenCalledTimes(1);
      expect(gameState.markSaved).toHaveBeenCalledTimes(1);
    });
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

  describe('minion click interval', () => {
    it('should call processMinionClicks every 1s', fakeAsync(() => {
      spyOn(gameState, 'processMinionClicks');
      timerService.start();

      tick(3000);
      expect(gameState.processMinionClicks).toHaveBeenCalledTimes(3);

      timerService.stop();
    }));

    it('should stop calling processMinionClicks after stop', fakeAsync(() => {
      spyOn(gameState, 'processMinionClicks');
      timerService.start();

      tick(2000);
      expect(gameState.processMinionClicks).toHaveBeenCalledTimes(2);

      timerService.stop();
      tick(3000);
      // No additional calls after stop
      expect(gameState.processMinionClicks).toHaveBeenCalledTimes(2);
    }));
  });

  describe('auto-assign (default)', () => {
    it('should call defaultAutoAssign on MinionIdle event (debounced)', fakeAsync(() => {
      spyOn(gameState, 'defaultAutoAssign');
      timerService.start();

      events.emit({ type: 'MinionIdle', minionId: 'm1', department: 'schemes' });
      // Not called yet — debounced via microtask
      expect(gameState.defaultAutoAssign).not.toHaveBeenCalled();

      tick(0); // flush microtask
      expect(gameState.defaultAutoAssign).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should call defaultAutoAssign on TaskQueued event', fakeAsync(() => {
      spyOn(gameState, 'defaultAutoAssign');
      timerService.start();

      events.emit({ type: 'TaskQueued', taskId: 't1', department: 'heists' });
      tick(0);
      expect(gameState.defaultAutoAssign).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should call defaultAutoAssign on MinionHired event', fakeAsync(() => {
      spyOn(gameState, 'defaultAutoAssign');
      timerService.start();

      events.emit({ type: 'MinionHired', minionId: 'm1', department: 'research' });
      tick(0);
      expect(gameState.defaultAutoAssign).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should debounce multiple rapid events into one call', fakeAsync(() => {
      spyOn(gameState, 'defaultAutoAssign');
      timerService.start();

      events.emit({ type: 'MinionIdle', minionId: 'm1', department: 'schemes' });
      events.emit({ type: 'TaskQueued', taskId: 't1', department: 'schemes' });
      events.emit({ type: 'MinionHired', minionId: 'm2', department: 'heists' });

      tick(0);
      // All three events should be batched into a single call
      expect(gameState.defaultAutoAssign).toHaveBeenCalledTimes(1);

      timerService.stop();
    }));

    it('should allow subsequent evaluation after debounce completes', fakeAsync(() => {
      spyOn(gameState, 'defaultAutoAssign');
      timerService.start();

      events.emit({ type: 'MinionIdle', minionId: 'm1', department: 'schemes' });
      tick(0);
      expect(gameState.defaultAutoAssign).toHaveBeenCalledTimes(1);

      // Second batch
      events.emit({ type: 'TaskQueued', taskId: 't2', department: 'heists' });
      tick(0);
      expect(gameState.defaultAutoAssign).toHaveBeenCalledTimes(2);

      timerService.stop();
    }));
  });

  describe('lifecycle', () => {
    it('stop should clear all timers', fakeAsync(() => {
      spyOn(gameState, 'cleanNotifications');
      spyOn(saveService, 'save');
      timerService.start();

      tick(1000);
      expect(gameState.cleanNotifications).toHaveBeenCalledTimes(1);

      timerService.stop();
      tick(5000);
      // No additional calls after stop
      expect(gameState.cleanNotifications).toHaveBeenCalledTimes(1);
    }));

    it('restartTimers should re-subscribe to events', fakeAsync(() => {
      spyOn(gameState, 'cleanNotifications');
      timerService.start();

      timerService.restartTimers();
      tick(2000);
      expect(gameState.cleanNotifications).toHaveBeenCalledTimes(2);

      timerService.stop();
    }));
  });
});
