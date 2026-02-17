import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TaskTier } from '../../../core/models';

@Component({
  selector: 'app-tier-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
      [class]="badgeClasses()">
      {{ tier() }}
    </span>
  `,
})
export class TierBadgeComponent {
  tier = input.required<TaskTier>();

  badgeClasses = computed(() => {
    switch (this.tier()) {
      case 'petty':
        return 'bg-tier-petty/20 text-tier-petty border border-tier-petty/30';
      case 'sinister':
        return 'bg-tier-sinister/20 text-tier-sinister border border-tier-sinister/30';
      case 'diabolical':
        return 'bg-tier-diabolical/20 text-tier-diabolical border border-tier-diabolical/30';
      case 'legendary':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    }
  });
}
