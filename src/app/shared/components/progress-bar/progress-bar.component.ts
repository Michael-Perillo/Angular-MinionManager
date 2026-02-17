import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TaskTier } from '../../../core/models';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-3 rounded-full overflow-hidden" [class]="trackClasses()">
      <div
        class="h-full rounded-full transition-all duration-300 ease-out relative"
        [class]="fillClasses()"
        [style.width.%]="percentage()">
        @if (percentage() > 0) {
          <div class="absolute inset-0 progress-bar-shimmer"></div>
        }
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  progress = input.required<number>();
  total = input.required<number>();
  tier = input<TaskTier>('petty');

  percentage = computed(() => {
    const t = this.total();
    if (t <= 0) return 0;
    return Math.min(100, Math.max(0, ((t - this.progress()) / t) * 100));
  });

  trackClasses = computed(() => 'bg-white/5');

  fillClasses = computed(() => {
    switch (this.tier()) {
      case 'petty': return 'bg-tier-petty';
      case 'sinister': return 'bg-tier-sinister';
      case 'diabolical': return 'bg-tier-diabolical';
      case 'legendary': return 'bg-amber-400';
    }
  });
}
