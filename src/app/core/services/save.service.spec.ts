import { TestBed } from '@angular/core/testing';
import { SaveService } from './save.service';
import { GameStateService } from './game-state.service';
import { STORAGE_BACKEND, StorageBackend } from './storage-backend';
import { makeSaveData } from '../../../testing/factories/game-state.factory';

const STORAGE_KEY = 'minion-manager-save';

describe('SaveService', () => {
  let saveService: SaveService;
  let gameState: GameStateService;
  let store: Record<string, string>;
  let mockBackend: StorageBackend;

  beforeEach(() => {
    store = {};
    mockBackend = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: STORAGE_BACKEND, useValue: mockBackend },
      ],
    });
    gameState = TestBed.inject(GameStateService);
    saveService = TestBed.inject(SaveService);
    gameState.initializeGame();
  });

  describe('hasSave', () => {
    it('should return false when no save exists', () => {
      expect(saveService.hasSave()).toBe(false);
    });

    it('should return true after save()', () => {
      saveService.save();
      expect(saveService.hasSave()).toBe(true);
    });
  });

  describe('save / load round-trip', () => {
    it('should restore gold after save and load', () => {
      gameState.addGold(999);
      saveService.save();

      gameState.resetGame();
      expect(gameState.gold()).toBe(0);

      const loaded = saveService.load();
      expect(loaded).toBe(true);
      expect(gameState.gold()).toBe(999);
    });

    it('should restore completedCount', () => {
      // Complete a task to increment completedCount
      const mission = gameState.missionBoard().find(m => !m.isCoverOp && !m.isBreakoutOp)!;
      gameState.acceptMission(mission.id);
      const task = gameState.activeMissions().find(t => t.id === mission.id)!;
      for (let i = 0; i < task.clicksRequired; i++) {
        gameState.clickTask(task.id);
      }
      expect(gameState.completedCount()).toBe(1);

      saveService.save();
      gameState.resetGame();

      saveService.load();
      expect(gameState.completedCount()).toBe(1);
    });

    it('should restore minions', () => {
      gameState.addGold(50);
      gameState.hireMinion();
      expect(gameState.minions().length).toBe(1);

      saveService.save();
      gameState.resetGame();

      saveService.load();
      expect(gameState.minions().length).toBe(1);
    });

    it('should restore upgrade levels', () => {
      gameState.addGold(10_000);
      gameState.purchaseUpgrade('click-power');
      gameState.purchaseUpgrade('click-power');

      saveService.save();
      gameState.resetGame();

      saveService.load();
      expect(gameState.getUpgradeLevel('click-power')).toBe(2);
    });
  });

  describe('migration', () => {
    it('should migrate v3 data (resources → influence) to v4', () => {
      const v3Data: any = {
        version: 3,
        savedAt: Date.now(),
        gold: 200,
        completedCount: 10,
        totalGoldEarned: 500,
        notoriety: 20,
        minions: [],
        departments: {
          schemes: { category: 'schemes', xp: 0, level: 1 },
          heists: { category: 'heists', xp: 0, level: 1 },
          research: { category: 'research', xp: 0, level: 1 },
          mayhem: { category: 'mayhem', xp: 0, level: 1 },
        },
        upgradeLevels: [],
        activeMissions: [],
        missionBoard: [],
        raidActive: false,
        raidTimer: 0,
        usedNameIndices: [],
        lastBoardRefresh: 0,
        capturedMinions: [],
        departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
        playerQueue: [],
        resources: { supplies: 10, intel: 5 },
      };

      store[STORAGE_KEY] = JSON.stringify(v3Data);
      const loaded = saveService.load();
      expect(loaded).toBe(true);
      expect(gameState.gold()).toBe(200);

      // Verify influence is sum of supplies + intel
      const snapshot = gameState.getSnapshot();
      expect(snapshot.influence).toBe(15);
      expect(snapshot.version).toBe(4);
      // resources field should not exist in the migrated snapshot
      expect((snapshot as any).resources).toBeUndefined();
    });

    it('should migrate v1 data (missing capturedMinions) to v2', () => {
      const v1Data: any = {
        version: 1,
        savedAt: Date.now(),
        gold: 100,
        completedCount: 5,
        totalGoldEarned: 200,
        notoriety: 10,
        minions: [],
        departments: {
          schemes: { category: 'schemes', xp: 0, level: 1 },
          heists: { category: 'heists', xp: 0, level: 1 },
          research: { category: 'research', xp: 0, level: 1 },
          mayhem: { category: 'mayhem', xp: 0, level: 1 },
        },
        upgradeLevels: [],
        activeMissions: [],
        missionBoard: [],
        raidActive: false,
        raidTimer: 0,
        usedNameIndices: [],
        lastBoardRefresh: 0,
        // Note: no capturedMinions field
      };

      store[STORAGE_KEY] = JSON.stringify(v1Data);
      const loaded = saveService.load();
      expect(loaded).toBe(true);
      expect(gameState.capturedMinions()).toEqual([]);
      expect(gameState.gold()).toBe(100);
    });
  });

  describe('corrupt data', () => {
    it('should return false for corrupt JSON', () => {
      store[STORAGE_KEY] = 'not-valid-json!!!';
      const loaded = saveService.load();
      expect(loaded).toBe(false);
    });

    it('should return false when no data exists', () => {
      const loaded = saveService.load();
      expect(loaded).toBe(false);
    });
  });

  describe('clearSave', () => {
    it('should remove save data', () => {
      saveService.save();
      expect(saveService.hasSave()).toBe(true);
      saveService.clearSave();
      expect(saveService.hasSave()).toBe(false);
    });
  });

  describe('save with storage error', () => {
    it('should not throw when storage.setItem throws', () => {
      spyOn(mockBackend, 'setItem').and.throwError('QuotaExceededError');
      expect(() => saveService.save()).not.toThrow();
    });
  });
});
