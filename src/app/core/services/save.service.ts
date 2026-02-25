import { Injectable, inject } from '@angular/core';
import { GameStateService } from './game-state.service';
import { SaveData } from '../models/save-data.model';

const STORAGE_KEY = 'minion-manager-save';
const CURRENT_VERSION = 2;

@Injectable({ providedIn: 'root' })
export class SaveService {
  private readonly gameState = inject(GameStateService);

  constructor() {
    window.addEventListener('beforeunload', () => this.save());
  }

  save(): void {
    try {
      const snapshot = this.gameState.getSnapshot();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // localStorage full or unavailable — silently fail
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      let data: SaveData = JSON.parse(raw);
      data = this.migrate(data);
      this.gameState.loadSnapshot(data);
      return true;
    } catch {
      return false;
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  clearSave(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private migrate(data: SaveData): SaveData {
    if (data.version < 2) {
      data.capturedMinions = data.capturedMinions ?? [];
      data.version = 2;
    }
    // Future migrations: if (data.version < 3) { ... data.version = 3; }
    return data;
  }
}
