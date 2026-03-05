import { TestBed } from '@angular/core/testing';
import { MetaService } from './meta.service';
import { STORAGE_BACKEND, StorageBackend } from './storage-backend';
import { RunSummary, DiscoveredItems, createDefaultMetaSave } from '../models/meta.model';

class MockStorage implements StorageBackend {
  private store = new Map<string, string>();
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, value); }
  removeItem(key: string): void { this.store.delete(key); }
}

function makeSummary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    endedAt: Date.now(),
    yearsSurvived: 1,
    quartersPassed: 3,
    quartersPlayed: 3,
    totalGoldEarned: 500,
    totalTasksCompleted: 100,
    bossesBeaten: 0,
    infamyEarned: 60,
    ...overrides,
  };
}

function makeDiscovered(overrides: Partial<DiscoveredItems> = {}): DiscoveredItems {
  return {
    archetypes: [],
    tasks: [],
    reviewers: [],
    modifiers: [],
    ...overrides,
  };
}

describe('MetaService', () => {
  let service: MetaService;
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_BACKEND, useValue: storage }],
    });
    service = TestBed.inject(MetaService);
  });

  describe('load/save', () => {
    it('loads default state when no meta save exists', () => {
      service.load();
      expect(service.totalInfamy()).toBe(0);
      expect(service.hallOfFame()).toEqual([]);
      expect(service.hasHistory()).toBe(false);
    });

    it('loads previously saved state', () => {
      const meta = createDefaultMetaSave();
      meta.totalInfamy = 100;
      meta.soundEnabled = false;
      storage.setItem('minion-manager-meta', JSON.stringify(meta));

      service.load();
      expect(service.totalInfamy()).toBe(100);
      expect(service.soundEnabled()).toBe(false);
    });

    it('saves and reloads state correctly', () => {
      service.recordRun(makeSummary({ infamyEarned: 75 }), makeDiscovered());

      const service2 = TestBed.inject(MetaService);
      service2.load();
      expect(service2.totalInfamy()).toBe(75);
      expect(service2.hallOfFame().length).toBe(1);
    });

    it('handles corrupted JSON gracefully', () => {
      storage.setItem('minion-manager-meta', '{invalid json}');
      expect(() => service.load()).not.toThrow();
      expect(service.totalInfamy()).toBe(0);
    });
  });

  describe('recordRun', () => {
    it('accumulates infamy across runs', () => {
      service.recordRun(makeSummary({ infamyEarned: 50 }), makeDiscovered());
      service.recordRun(makeSummary({ infamyEarned: 75 }), makeDiscovered());
      expect(service.totalInfamy()).toBe(125);
    });

    it('adds entries to Hall of Fame', () => {
      service.recordRun(makeSummary(), makeDiscovered());
      service.recordRun(makeSummary(), makeDiscovered());
      expect(service.hallOfFame().length).toBe(2);
      expect(service.hallOfFame()[0].id).toBeTruthy();
      expect(service.hallOfFame()[1].id).toBeTruthy();
      expect(service.hallOfFame()[0].id).not.toBe(service.hallOfFame()[1].id);
    });

    it('topRuns sorts by infamy descending', () => {
      service.recordRun(makeSummary({ infamyEarned: 50 }), makeDiscovered());
      service.recordRun(makeSummary({ infamyEarned: 150 }), makeDiscovered());
      service.recordRun(makeSummary({ infamyEarned: 100 }), makeDiscovered());
      expect(service.topRuns().map(r => r.infamyEarned)).toEqual([150, 100, 50]);
    });

    it('merges new discoveries into compendium', () => {
      service.recordRun(makeSummary(), makeDiscovered({
        archetypes: ['penny-pincher', 'iron-grip'],
        tasks: ['Forge Hall Passes'],
      }));
      expect(service.compendium().seenArchetypes).toEqual(['penny-pincher', 'iron-grip']);
      expect(service.compendium().seenTasks).toEqual(['Forge Hall Passes']);
      expect(service.hasDiscoveries()).toBe(true);
    });

    it('deduplicates compendium entries across runs', () => {
      service.recordRun(makeSummary(), makeDiscovered({
        archetypes: ['penny-pincher', 'iron-grip'],
      }));
      service.recordRun(makeSummary(), makeDiscovered({
        archetypes: ['penny-pincher', 'vault-cracker'],
      }));
      expect(service.compendium().seenArchetypes).toEqual(['penny-pincher', 'iron-grip', 'vault-cracker']);
    });

    it('merges all discovery categories', () => {
      service.recordRun(makeSummary(), makeDiscovered({
        archetypes: ['penny-pincher'],
        tasks: ['Forge Hall Passes'],
        reviewers: ['thornton'],
        modifiers: ['no-hiring'],
      }));
      const c = service.compendium();
      expect(c.seenArchetypes).toEqual(['penny-pincher']);
      expect(c.seenTasks).toEqual(['Forge Hall Passes']);
      expect(c.seenReviewers).toEqual(['thornton']);
      expect(c.seenModifiers).toEqual(['no-hiring']);
    });
  });

  describe('toggleSound', () => {
    it('toggles sound and saves', () => {
      expect(service.soundEnabled()).toBe(true);
      service.toggleSound();
      expect(service.soundEnabled()).toBe(false);
      service.toggleSound();
      expect(service.soundEnabled()).toBe(true);
    });
  });

  describe('resetAllProgress', () => {
    it('clears all meta state and removes storage', () => {
      service.recordRun(makeSummary({ infamyEarned: 100 }), makeDiscovered({
        archetypes: ['penny-pincher'],
      }));
      service.toggleSound();

      service.resetAllProgress();

      expect(service.totalInfamy()).toBe(0);
      expect(service.hallOfFame()).toEqual([]);
      expect(service.compendium().seenArchetypes).toEqual([]);
      expect(service.hasHistory()).toBe(false);
      expect(service.hasDiscoveries()).toBe(false);
      expect(service.soundEnabled()).toBe(true);
      expect(storage.getItem('minion-manager-meta')).toBeNull();
    });
  });
});
