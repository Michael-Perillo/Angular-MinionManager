import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { ThreatLevel, getThreatLabel, bribeCost, MAX_NOTORIETY } from '../../../core/models/notoriety.model';

@Component({
  selector: 'app-notoriety-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-card p-4 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold uppercase tracking-wider text-text-secondary">
          Notoriety
        </h3>
        <span class="text-xs font-bold px-2 py-0.5 rounded-full" [class]="threatClasses()">
          {{ threatLabel() }}
        </span>
      </div>

      <!-- Notoriety bar -->
      <div class="w-full h-3 rounded-full bg-white/10 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          [class]="barColor()"
          [style.width.%]="notorietyPercent()">
        </div>
      </div>

      <div class="flex items-center justify-between text-[10px] text-text-muted">
        <span>{{ notoriety() }} / {{ maxNotoriety }}</span>
        @if (goldPenalty() > 0) {
          <span class="text-red-400">-{{ goldPenalty() }}% gold from missions</span>
        }
      </div>

      <!-- Raid alert -->
      @if (raidActive()) {
        <div class="mt-1 p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-center">
          <div class="text-sm font-bold text-red-400 mb-1">
            HERO RAID IN PROGRESS!
          </div>
          <div class="text-xs text-red-300 mb-2">
            {{ raidTimer() }}s remaining — Click to defend!
          </div>
          <button
            (click)="defendClicked.emit()"
            class="px-4 py-2 rounded-lg bg-red-500/30 text-red-300 font-bold text-sm
                   border border-red-500/50 hover:bg-red-500/40 active:scale-95
                   transition-all cursor-pointer">
            DEFEND!
          </button>
        </div>
      }

      <!-- Bribe button -->
      @if (!raidActive() && notoriety() > 0) {
        <button
          (click)="bribeClicked.emit()"
          [disabled]="gold() < currentBribeCost()"
          class="w-full mt-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          [class]="gold() >= currentBribeCost()
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 active:scale-95'
            : 'bg-white/5 text-text-muted cursor-not-allowed'">
          Bribe Officials ({{ currentBribeCost() }}g, -10 notoriety)
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class NotorietyBarComponent {
  notoriety = input.required<number>();
  threatLevel = input.required<ThreatLevel>();
  goldPenalty = input.required<number>();
  gold = input.required<number>();
  raidActive = input.required<boolean>();
  raidTimer = input.required<number>();

  bribeClicked = output<void>();
  defendClicked = output<void>();

  maxNotoriety = MAX_NOTORIETY;

  notorietyPercent = computed(() =>
    Math.min(100, (this.notoriety() / MAX_NOTORIETY) * 100)
  );

  threatLabel = computed(() => getThreatLabel(this.threatLevel()));

  threatClasses = computed(() => {
    switch (this.threatLevel()) {
      case 'unknown': return 'bg-green-500/20 text-green-400';
      case 'suspicious': return 'bg-yellow-500/20 text-yellow-400';
      case 'wanted': return 'bg-orange-500/20 text-orange-400';
      case 'hunted': return 'bg-red-500/20 text-red-400';
      case 'infamous': return 'bg-purple-500/20 text-purple-300 animate-pulse';
    }
  });

  barColor = computed(() => {
    const n = this.notoriety();
    if (n < 35) return 'bg-green-500';
    if (n < 60) return 'bg-yellow-500';
    if (n < 85) return 'bg-orange-500';
    return 'bg-red-500';
  });

  currentBribeCost = computed(() => bribeCost(this.notoriety()));
}
