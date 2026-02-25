import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { ThreatLevel } from '../../../core/models/notoriety.model';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex items-center justify-between gap-3 px-4 py-2
                    border-b border-border bg-bg-secondary/50 backdrop-blur-sm">
      <!-- Left: Title -->
      <div class="flex items-center gap-3 shrink-0">
        <div>
          <h1 class="text-lg sm:text-xl font-display font-black text-text-primary uppercase tracking-widest leading-tight">
            Minion Manager
          </h1>
          <p class="text-[10px] text-text-muted">
            Lv.{{ villainLevel() }} {{ villainTitle() }}
          </p>
        </div>
      </div>

      <!-- Center: Stats -->
      <div class="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
        <!-- Save indicator -->
        @if (showSaveIndicator()) {
          <span class="text-[10px] text-text-muted animate-fade-in-out">Saved</span>
        }

        <!-- Gold -->
        <div class="flex items-center gap-1">
          <span>🪙</span>
          <span class="font-bold text-gold tabular-nums text-sm">{{ gold() }}</span>
        </div>

        <!-- Notoriety badge -->
        <div class="flex items-center gap-1">
          <span>🔥</span>
          <span class="tabular-nums text-sm" [class]="notorietyClasses()">{{ notoriety() }}/100</span>
        </div>

        <!-- Completed -->
        <div class="flex items-center gap-1">
          <span>✅</span>
          <span class="font-bold text-text-primary tabular-nums text-sm">{{ completedCount() }}</span>
        </div>

        <!-- Minions -->
        <div class="flex items-center gap-1">
          <span>👾</span>
          <span class="font-bold text-text-primary tabular-nums text-sm">{{ minionCount() }}</span>
        </div>

        <!-- Supplies -->
        <div class="flex items-center gap-1">
          <span>⚗️</span>
          <span class="font-bold text-text-primary tabular-nums text-sm">{{ supplies() }}</span>
        </div>

        <!-- Intel -->
        <div class="flex items-center gap-1">
          <span>🕵️</span>
          <span class="font-bold text-text-primary tabular-nums text-sm">{{ intel() }}</span>
        </div>
      </div>

      <!-- Right: Drawer toggle -->
      <div class="flex items-center gap-2 shrink-0">
        @if (raidActive()) {
          <span class="text-xs font-bold text-red-400 animate-pulse">🔴 RAID!</span>
        }
        <button
          (click)="drawerToggle.emit()"
          class="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card
                 transition-all cursor-pointer border border-transparent hover:border-border"
          [class]="hasUrgentAlert() ? 'animate-subtle-pulse text-red-400' : ''">
          ⚙️
        </button>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
    @keyframes fadeInOut {
      0% { opacity: 0; }
      15% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
    .animate-fade-in-out {
      animation: fadeInOut 2s ease-in-out forwards;
    }
  `,
})
export class HeaderComponent {
  gold = input.required<number>();
  completedCount = input.required<number>();
  minionCount = input.required<number>();
  villainLevel = input.required<number>();
  villainTitle = input.required<string>();
  notoriety = input<number>(0);
  supplies = input<number>(0);
  intel = input<number>(0);
  raidActive = input<boolean>(false);
  capturedCount = input<number>(0);
  lastSaved = input<number>(0);

  reset = output<void>();
  drawerToggle = output<void>();

  showSaveIndicator = computed(() => {
    const saved = this.lastSaved();
    if (!saved) return false;
    return Date.now() - saved < 2000;
  });

  hasUrgentAlert = computed(() =>
    this.raidActive() || this.capturedCount() > 0
  );

  notorietyClasses = computed(() => {
    const n = this.notoriety();
    if (n < 35) return 'text-green-400';
    if (n < 60) return 'text-yellow-400';
    if (n < 85) return 'text-orange-400';
    return 'text-red-400 font-bold';
  });
}
