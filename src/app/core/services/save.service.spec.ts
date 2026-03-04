import { TestBed } from '@angular/core/testing';
import { SaveService } from './save.service';
import { GameStateService } from './game-state.service';
import { STORAGE_BACKEND, StorageBackend } from './storage-backend';
import { SAVE_VERSION } from '../models/save-data.model';

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
      // Seed the board and complete a task to increment completedCount
      const mission = gameState.createBoardMission();
      gameState.loadSnapshot({
        ...gameState.getSnapshot(),
        missionBoard: [mission],
      });
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
      gameState.openShop();
      gameState.hireMinion(gameState.hireOptions()[0]);
      expect(gameState.minions().length).toBe(1);

      saveService.save();
      gameState.resetGame();

      saveService.load();
      expect(gameState.minions().length).toBe(1);
    });

  });

  describe('migration', () => {
    it('should migrate v3 data through to current version', () => {
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
      expect(snapshot.version).toBe(SAVE_VERSION);
      // Influence, resources, and upgradeLevels should be stripped
      expect((snapshot as any).influence).toBeUndefined();
      expect((snapshot as any).resources).toBeUndefined();
      expect((snapshot as any).upgradeLevels).toBeUndefined();
    });

    it('should migrate v4 data (remove notoriety/raids/influence/upgrades) to current version', () => {
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
      expect(snapshot.version).toBe(SAVE_VERSION);
      // Notoriety and influence fields should be stripped
      expect((snapshot as any).notoriety).toBeUndefined();
      expect((snapshot as any).raidActive).toBeUndefined();
      expect((snapshot as any).raidTimer).toBeUndefined();
      expect((snapshot as any).capturedMinions).toBeUndefined();
      expect((snapshot as any).influence).toBeUndefined();
      // v15: board cleared and re-populated from starter deck
      expect(snapshot.missionBoard.length).toBeGreaterThan(0);
      // v15: scheme deck should be populated
      expect(snapshot.schemeDeck).toBeDefined();
      // upgradeLevels should be stripped entirely by v9 migration
      expect((snapshot as any).upgradeLevels).toBeUndefined();
    });

    it('should migrate v16 data (strip jokers, add hireOptions, convert minions) to current version', () => {
      const v16Data: any = {
        version: 16,
        savedAt: Date.now(),
        gold: 400,
        completedCount: 50,
        totalGoldEarned: 1200,
        minions: [
          {
            id: 'minion-1',
            name: 'Grim',
            appearance: { color: '#6c3483', accessory: 'goggles' },
            status: 'idle',
            assignedTaskId: null,
            stats: { speed: 1.0 },
            specialty: 'schemes',
            assignedDepartment: 'schemes',
            deptXp: { schemes: 50, heists: 0, research: 0, mayhem: 0 },
            xp: 100,
            level: 3,
            role: 'worker',
          },
        ],
        departments: {
          schemes: { category: 'schemes', xp: 100, level: 3 },
          heists: { category: 'heists', xp: 0, level: 1 },
          research: { category: 'research', xp: 0, level: 1 },
          mayhem: { category: 'mayhem', xp: 0, level: 1 },
        },
        activeMissions: [],
        missionBoard: [],
        usedNameIndices: [0],
        departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
        ownedJokers: ['gold-rush', 'iron-fist'],
        equippedJokers: ['gold-rush'],
        schemeDeck: [],
        dismissalsRemaining: 5,
        researchCompleted: 0,
        activeBreakthroughs: 0,
        deptTierUnlocks: {
          schemes: ['petty'],
          heists: ['petty'],
          research: ['petty'],
          mayhem: ['petty'],
        },
        ownedVouchers: {},
      };

      store[STORAGE_KEY] = JSON.stringify(v16Data);
      const loaded = saveService.load();
      expect(loaded).toBe(true);
      expect(gameState.gold()).toBe(400);

      const snapshot = gameState.getSnapshot();
      expect(snapshot.version).toBe(SAVE_VERSION);
      // Joker fields should be stripped
      expect((snapshot as any).ownedJokers).toBeUndefined();
      expect((snapshot as any).equippedJokers).toBeUndefined();
      // Minion should have archetypeId, no old fields
      expect(snapshot.minions.length).toBe(1);
      const minion = snapshot.minions[0];
      expect(minion.archetypeId).toBeTruthy();
      expect(minion.role).toBe('worker');
      expect((minion as any).name).toBeUndefined();
      expect((minion as any).appearance).toBeUndefined();
      expect((minion as any).stats).toBeUndefined();
      expect((minion as any).specialty).toBeUndefined();
      expect((minion as any).deptXp).toBeUndefined();
      expect((minion as any).xp).toBeUndefined();
      expect((minion as any).level).toBeUndefined();
      // hireOptions should be populated
      expect(snapshot.hireOptions).toBeDefined();
      expect(snapshot.hireOptions!.length).toBe(3);
    });

    it('should migrate v17 data (add comboState) to current version', () => {
      const v17Data: any = {
        version: 17,
        savedAt: Date.now(),
        gold: 100,
        completedCount: 5,
        totalGoldEarned: 200,
        minions: [],
        departments: {
          schemes: { category: 'schemes', xp: 0, level: 1 },
          heists: { category: 'heists', xp: 0, level: 1 },
          research: { category: 'research', xp: 0, level: 1 },
          mayhem: { category: 'mayhem', xp: 0, level: 1 },
        },
        activeMissions: [],
        missionBoard: [],
        usedNameIndices: [],
        departmentQueues: { schemes: [], heists: [], research: [], mayhem: [] },
        schemeDeck: [],
        deptTierUnlocks: {
          schemes: ['petty'], heists: ['petty'], research: ['petty'], mayhem: ['petty'],
        },
        ownedVouchers: {},
        hireOptions: ['bruiser', 'hacker', 'saboteur'],
      };

      store[STORAGE_KEY] = JSON.stringify(v17Data);
      const loaded = saveService.load();
      expect(loaded).toBe(true);
      expect(gameState.gold()).toBe(100);

      const snapshot = gameState.getSnapshot();
      expect(snapshot.version).toBe(SAVE_VERSION);
      // comboState should default to empty
      expect(snapshot.comboState).toBeDefined();
      expect(snapshot.comboState!.deptFocus.dept).toBeNull();
      expect(snapshot.comboState!.deptFocus.count).toBe(0);
      expect(snapshot.comboState!.tierLadder.lastTier).toBeNull();
      expect(snapshot.comboState!.tierLadder.step).toBe(0);
    });

    it('should migrate v7 data (add reviewer defaults, strip upgrades) to current version', () => {
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
        upgradeLevels: [{ id: 'click-power', currentLevel: 3 }],
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
      expect(snapshot.version).toBe(SAVE_VERSION);
      expect(snapshot.currentReviewer).toBeNull();
      expect(snapshot.activeModifiers).toEqual([]);
      expect(snapshot.isRunOver).toBe(false);
      // upgradeLevels should be stripped by v9 migration
      expect((snapshot as any).upgradeLevels).toBeUndefined();
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
