import { TestBed } from '@angular/core/testing';
import { TimerService } from './timer.service';
import { GameStateService } from './game-state.service';

describe('TimerService', () => {
  let timerService: TimerService;
  let gameState: GameStateService;

  beforeEach(() => {
    jasmine.clock().install();

    TestBed.configureTestingModule({});
    gameState = TestBed.inject(GameStateService);
    timerService = TestBed.inject(TimerService);
    gameState.initializeGame();
  });

  afterEach(() => {
    timerService.stop();
    jasmine.clock().uninstall();
  });

  describe('start', () => {
    it('should call tickTime on the game state every second', () => {
      spyOn(gameState, 'tickTime');
      timerService.start();

      jasmine.clock().tick(1000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(1);

      jasmine.clock().tick(2000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(3);
    });

    it('should be idempotent on double-call', () => {
      spyOn(gameState, 'tickTime');
      timerService.start();
      timerService.start(); // second call should be no-op

      jasmine.clock().tick(1000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('should stop the interval', () => {
      spyOn(gameState, 'tickTime');
      timerService.start();

      jasmine.clock().tick(1000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(1);

      timerService.stop();

      jasmine.clock().tick(3000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(1); // no more calls
    });

    it('should be safe to call when not started', () => {
      expect(() => timerService.stop()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      timerService.start();
      timerService.stop();
      expect(() => timerService.stop()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up the interval', () => {
      spyOn(gameState, 'tickTime');
      timerService.start();

      jasmine.clock().tick(1000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(1);

      timerService.ngOnDestroy();

      jasmine.clock().tick(3000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(1);
    });
  });

  describe('restart', () => {
    it('should work after stop + start', () => {
      spyOn(gameState, 'tickTime');
      timerService.start();
      jasmine.clock().tick(1000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(1);

      timerService.stop();
      timerService.start();

      jasmine.clock().tick(1000);
      expect(gameState.tickTime).toHaveBeenCalledTimes(2);
    });
  });
});
