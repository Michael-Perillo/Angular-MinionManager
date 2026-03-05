import { Injectable, inject, signal, computed } from '@angular/core';
import { STORAGE_BACKEND } from './storage-backend';
import {
  MetaSaveData, RunSummary, HallOfFameEntry, CompendiumData, DiscoveredItems,
  createDefaultMetaSave, createEmptyCompendium, META_SAVE_VERSION,
} from '../models/meta.model';

const META_STORAGE_KEY = 'minion-manager-meta';

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly storage = inject(STORAGE_BACKEND);

  // ─── State signals ─────────────────────────
  private readonly _totalInfamy = signal(0);
  private readonly _hallOfFame = signal<HallOfFameEntry[]>([]);
  private readonly _compendium = signal<CompendiumData>(createEmptyCompendium());
  private readonly _permanentUnlocks = signal<string[]>([]);
  private readonly _soundEnabled = signal(true);

  // ─── Public read-only signals ──────────────
  readonly totalInfamy = this._totalInfamy.asReadonly();
  readonly hallOfFame = this._hallOfFame.asReadonly();
  readonly compendium = this._compendium.asReadonly();
  readonly permanentUnlocks = this._permanentUnlocks.asReadonly();
  readonly soundEnabled = this._soundEnabled.asReadonly();

  // ─── Computed ──────────────────────────────
  readonly topRuns = computed(() =>
    [...this._hallOfFame()]
      .sort((a, b) => b.infamyEarned - a.infamyEarned)
      .slice(0, 20)
  );

  readonly hasHistory = computed(() => this._hallOfFame().length > 0);

  readonly hasDiscoveries = computed(() => {
    const c = this._compendium();
    return c.seenArchetypes.length > 0 || c.seenTasks.length > 0 ||
           c.seenReviewers.length > 0 || c.seenModifiers.length > 0;
  });

  // ─── Load / Save ──────────────────────────

  load(): void {
    try {
      const raw = this.storage.getItem(META_STORAGE_KEY);
      if (!raw) return;
      const data: MetaSaveData = JSON.parse(raw);
      this._totalInfamy.set(data.totalInfamy ?? 0);
      this._hallOfFame.set(data.hallOfFame ?? []);
      this._compendium.set(data.compendium ?? createEmptyCompendium());
      this._permanentUnlocks.set(data.permanentUnlocks ?? []);
      this._soundEnabled.set(data.soundEnabled ?? true);
    } catch {
      // Corrupted meta save — ignore
    }
  }

  save(): void {
    try {
      const data: MetaSaveData = {
        version: META_SAVE_VERSION,
        totalInfamy: this._totalInfamy(),
        hallOfFame: this._hallOfFame(),
        compendium: this._compendium(),
        permanentUnlocks: this._permanentUnlocks(),
        soundEnabled: this._soundEnabled(),
      };
      this.storage.setItem(META_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full — silently fail
    }
  }

  // ─── Record a completed run ────────────────

  recordRun(summary: RunSummary, discovered: DiscoveredItems): void {
    // Add infamy
    this._totalInfamy.update(i => i + summary.infamyEarned);

    // Add to Hall of Fame
    const entry: HallOfFameEntry = {
      ...summary,
      id: crypto.randomUUID(),
    };
    this._hallOfFame.update(hof => [...hof, entry]);

    // Merge discoveries into compendium (union, no duplicates)
    this._compendium.update(c => ({
      seenArchetypes: mergeUnique(c.seenArchetypes, discovered.archetypes),
      seenTasks: mergeUnique(c.seenTasks, discovered.tasks),
      seenReviewers: mergeUnique(c.seenReviewers, discovered.reviewers),
      seenModifiers: mergeUnique(c.seenModifiers, discovered.modifiers),
    }));

    this.save();
  }

  // ─── Options ───────────────────────────────

  toggleSound(): void {
    this._soundEnabled.update(s => !s);
    this.save();
  }

  resetAllProgress(): void {
    this._totalInfamy.set(0);
    this._hallOfFame.set([]);
    this._compendium.set(createEmptyCompendium());
    this._permanentUnlocks.set([]);
    this._soundEnabled.set(true);
    this.storage.removeItem(META_STORAGE_KEY);
  }
}

/** Merge two string arrays into a deduplicated array */
function mergeUnique(existing: string[], incoming: string[]): string[] {
  if (incoming.length === 0) return existing;
  const set = new Set(existing);
  let added = false;
  for (const item of incoming) {
    if (!set.has(item)) {
      set.add(item);
      added = true;
    }
  }
  return added ? [...set] : existing;
}
