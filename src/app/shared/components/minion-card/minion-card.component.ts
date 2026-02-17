import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Minion } from '../../../core/models';

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
        <div class="text-sm font-semibold text-text-primary truncate">
          {{ minion().name }}
        </div>
        <div class="text-xs truncate" [class]="statusClasses()">
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
