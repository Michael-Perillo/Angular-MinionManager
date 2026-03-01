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
      const mission = gameState.missionBoard()[0];
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
      gameState.addGold(75);
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
    it('should migrate v3 data through to v6', () => {
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

      const snapshot = gameState.getSnapshot();
      expect(snapshot.version).toBe(8);
      // Influence and resources should be stripped
      expect((snapshot as any).influence).toBeUndefined();
      expect((snapshot as any).resources).toBeUndefined();
    });

    it('should migrate v4 data (remove notoriety/raids/influence) to v6', () => {
      const v4Data: any = {
        version: 4,
        savedAt: Date.now(),
        gold: 300,
        completedCount: 15,
        totalGoldEarned: 800,
        notoriety: 45,
        minions: [],
        departments: {
          schemes: { category: 'schemes', xp: 0, level: 1 },
          heists: { category: 'heists', xp: 0, level: 1 },
          research: { category: 'research', xp: 0, level: 1 },
          mayhem: { category: 'mayhem', xp: 0, level: 1 },
        },
        upgradeLevels: [
          { id: 'click-power', currentLevel: 2 },
          { id: 'bribe-network', currentLevel: 3 },
          { id: 'shadow-ops', currentLevel: 1 },
        ],
        activeMissions: [],
        missionBoard: [
          { id: 't1', isCoverOp: true, template: { name: 'Cover', description: '', category: 'schemes', tier: 'petty' }, status: 'queued', tier: 'petty', goldReward: 0, timeToComplete: 10, timeRemaining: 10, clicksRequired: 10, clicksRemaining: 10, assignedMinionId: null, queuedAt: 0, assignedQueue: null },
          { id: 't2', template: { name: 'Normal', description: '', category: 'heists', tier: 'petty' }, status: 'queued', tier: 'petty', goldReward: 5, timeToComplete: 10, timeRemaining: 10, clicksRequired: 10, clicksRemaining: 10, assignedMinionId: null, queuedAt: 0, assignedQueue: null },
        ],
        raidActive: true,
        raidTimer: 15,
        usedNameIndices: [],
        lastBoardRefresh: 0,
        capturedMinions: [],
        departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
        playerQueue: [],
        influence: 20,
      };

      store[STORAGE_KEY] = JSON.stringify(v4Data);
      const loaded = saveService.load();
      expect(loaded).toBe(true);
      expect(gameState.gold()).toBe(300);

      const snapshot = gameState.getSnapshot();
      expect(snapshot.version).toBe(8);
      // Notoriety and influence fields should be stripped
      expect((snapshot as any).notoriety).toBeUndefined();
      expect((snapshot as any).raidActive).toBeUndefined();
      expect((snapshot as any).raidTimer).toBeUndefined();
      expect((snapshot as any).capturedMinions).toBeUndefined();
      expect((snapshot as any).influence).toBeUndefined();
      // Cover-op missions should be stripped
      expect(snapshot.missionBoard.length).toBe(1);
      expect(snapshot.missionBoard[0].id).toBe('t2');
      // Notoriety upgrades should be stripped (loadSnapshot merges with defaults, so all 10 remain)
      const upgradeIds = snapshot.upgradeLevels.map(u => u.id);
      expect(upgradeIds).not.toContain('bribe-network');
      expect(upgradeIds).not.toContain('shadow-ops');
      expect(upgradeIds).not.toContain('cover-spawn');
      expect(upgradeIds).not.toContain('lay-low');
      // click-power should retain its saved level
      const clickPower = snapshot.upgradeLevels.find(u => u.id === 'click-power');
      expect(clickPower?.currentLevel).toBe(2);
    });

    it('should migrate v7 data (add reviewer defaults) to v8', () => {
      const v7Data: any = {
        version: 7,
        savedAt: Date.now(),
        gold: 500,
        completedCount: 30,
        totalGoldEarned: 1000,
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
        usedNameIndices: [],
        lastBoardRefresh: 0,
        departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
        playerQueue: [],
        quarterProgress: {
          year: 1, quarter: 2, grossGoldEarned: 200,
          tasksCompleted: 15, isComplete: false, missedQuarters: 0, quarterResults: [],
        },
      };

      store[STORAGE_KEY] = JSON.stringify(v7Data);
      const loaded = saveService.load();
      expect(loaded).toBe(true);
      expect(gameState.gold()).toBe(500);

      const snapshot = gameState.getSnapshot();
      expect(snapshot.version).toBe(8);
      expect(snapshot.currentReviewer).toBeNull();
      expect(snapshot.activeModifiers).toEqual([]);
      expect(snapshot.isRunOver).toBe(false);
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
