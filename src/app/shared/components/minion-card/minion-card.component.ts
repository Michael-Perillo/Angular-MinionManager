import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Minion, xpForLevel } from '../../../core/models';

@Component({
  selector: 'app-minion-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-card p-3 flex items-center gap-3 min-w-0">
      <!-- Minion avatar -->
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
        [class]="avatarAnimClass()"
        [style.background-color]="minion().appearance.color">
        {{ accessoryEmoji() }}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-text-primary truncate">
            {{ minion().name }}
          </span>
          <span class="text-xs text-text-muted">Lv.{{ minion().level }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-text-muted mt-0.5">
          <span title="Speed">S:{{ minion().stats.speed.toFixed(1) }}</span>
          <span title="Efficiency">E:{{ minion().stats.efficiency.toFixed(1) }}</span>
          <span class="px-1 rounded text-xs" [class]="specialtyClasses()">
            {{ specialtyIcon() }} {{ specialtyLabel() }}
          </span>
        </div>
        <!-- XP bar -->
        <div class="mt-1 flex items-center gap-1.5">
          <div class="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              class="h-full rounded-full bg-accent/60 transition-all duration-300"
              [style.width.%]="xpPercent()">
            </div>
          </div>
          <span class="text-[10px] text-text-muted tabular-nums">{{ xpDisplay() }}</span>
        </div>
        <div class="text-xs truncate mt-0.5" [class]="statusClasses()">
          @if (minion().status === 'idle') {
            Awaiting orders...
          } @else {
            Working on task
          }
        </div>
      </div>

      <!-- Status indicator -->
      <div
        class="w-2.5 h-2.5 rounded-full shrink-0"
        [class]="dotClasses()">
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class MinionCardComponent {
  minion = input.required<Minion>();
  taskName = input<string | null>(null);

  accessoryEmoji = computed(() => {
    switch (this.minion().appearance.accessory) {
      case 'goggles': return '🥽';
      case 'helmet': return '⛑️';
      case 'cape': return '🦹';
      case 'horns': return '😈';
      case 'none': return '👾';
    }
  });

  specialtyIcon = computed(() => {
    switch (this.minion().specialty) {
      case 'schemes': return '🗝️';
      case 'heists': return '💎';
      case 'research': return '🧪';
      case 'mayhem': return '💥';
    }
  });

  specialtyLabel = computed(() => {
    const s = this.minion().specialty;
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  specialtyClasses = computed(() => {
    switch (this.minion().specialty) {
      case 'schemes': return 'bg-purple-500/20 text-purple-400';
      case 'heists': return 'bg-blue-500/20 text-blue-400';
      case 'research': return 'bg-green-500/20 text-green-400';
      case 'mayhem': return 'bg-red-500/20 text-red-400';
    }
  });

  xpPercent = computed(() => {
    const m = this.minion();
    const currentLevelXp = xpForLevel(m.level);
    const nextLevelXp = xpForLevel(m.level + 1);
    const range = nextLevelXp - currentLevelXp;
    if (range <= 0) return 100;
    return Math.min(100, ((m.xp - currentLevelXp) / range) * 100);
  });

  xpDisplay = computed(() => {
    const m = this.minion();
    const nextXp = xpForLevel(m.level + 1);
    return `${m.xp}/${nextXp}`;
  });

  avatarAnimClass = computed(() =>
    this.minion().status === 'idle' ? 'animate-minion-idle' : 'animate-minion-working'
  );

  statusClasses = computed(() =>
    this.minion().status === 'idle' ? 'text-text-muted' : 'text-tier-petty'
  );

  dotClasses = computed(() =>
    this.minion().status === 'idle'
      ? 'bg-text-muted'
      : 'bg-tier-petty animate-pulse'
  );
}
