import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Minion, getMinionDisplay, getRarityBorderColor } from '../../../core/models/minion.model';

@Component({
  selector: 'app-minion-chip',
  standalone: true,
  imports: [CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-card border-2 transition-all text-xs cursor-grab active:cursor-grabbing select-none"
      [class]="chipBorderClass()"
      cdkDrag
      [cdkDragData]="minion()"
      [cdkDragDisabled]="dragDisabled()"
      cdkDragHandle>
      <!-- Archetype icon -->
      <span class="text-sm shrink-0" [class]="minion().status === 'idle' ? 'animate-minion-idle' : ''">
        {{ archetype().icon }}
      </span>

      <!-- Name + passive -->
      <div class="min-w-0">
        <span class="font-semibold text-text-primary truncate block">{{ archetype().name }}</span>
        <span class="text-text-muted text-[10px]">
          {{ archetype().description }}
        </span>
      </div>
    </div>
  `,
  styles: `
    :host { display: inline-block; }
    .cdk-drag-preview { z-index: 1000; opacity: 0.9; }
    .cdk-drag-placeholder { opacity: 0.3; }
  `,
})
export class MinionChipComponent {
  minion = input.required<Minion>();
  dragDisabled = input<boolean>(false);

  archetype = computed(() => getMinionDisplay(this.minion()));
  chipBorderClass = computed(() => getRarityBorderColor(this.archetype().rarity));
}
