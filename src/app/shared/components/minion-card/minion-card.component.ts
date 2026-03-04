import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Minion, getMinionDisplay, getRarityColor, getRarityBorderColor } from '../../../core/models/minion.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-minion-card',
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-card p-3 flex items-center gap-3 min-w-0 border-2"
         [class]="rarityBorderClass()">
      <!-- Archetype icon -->
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
        [class]="avatarAnimClass()"
        [style.background-color]="archetype().color">
        {{ archetype().icon }}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-text-primary truncate">
            {{ archetype().name }}
          </span>
          <span class="text-xs font-bold uppercase" [class]="rarityColorClass()">
            {{ archetype().rarity }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-xs text-text-muted mt-0.5">
          <span
            [appTooltip]="archetype().description"
            [appTooltipPosition]="'bottom'"
            class="px-1 rounded bg-white/5">
            {{ archetype().description }}
          </span>
          @if (deptLabel(); as dept) {
            <span class="text-[10px] text-text-muted">📍 {{ dept }}</span>
          } @else {
            <span class="text-[10px] text-text-muted">📍 Pool</span>
          }
        </div>
        <!-- Role badge -->
        <div class="text-xs truncate mt-0.5" [class]="statusClasses()">
          @if (minion().role === 'manager') {
            👔 Managing
          } @else if (minion().status === 'idle') {
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

  archetype = computed(() => getMinionDisplay(this.minion()));

  rarityColorClass = computed(() => getRarityColor(this.archetype().rarity));
  rarityBorderClass = computed(() => getRarityBorderColor(this.archetype().rarity));

  deptLabel = computed(() => {
    const dept = this.minion().assignedDepartment;
    if (!dept) return null;
    return dept.charAt(0).toUpperCase() + dept.slice(1);
  });

  avatarAnimClass = computed(() =>
    this.minion().status === 'idle' ? 'animate-minion-idle' : 'animate-minion-working'
  );

  statusClasses = computed(() =>
    this.minion().role === 'manager' ? 'text-gold' :
    this.minion().status === 'idle' ? 'text-text-muted' : 'text-tier-petty'
  );

  dotClasses = computed(() =>
    this.minion().role === 'manager'
      ? 'bg-gold'
      : this.minion().status === 'idle'
        ? 'bg-text-muted'
        : 'bg-tier-petty animate-pulse'
  );
}
