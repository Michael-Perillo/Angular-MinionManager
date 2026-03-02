import { Component, ChangeDetectionStrategy, input, computed, effect, viewChild, ElementRef } from '@angular/core';
import { TaskTier } from '../../../core/models';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-3 rounded-full overflow-hidden" [class]="trackClasses()">
      <div
        #fill
        class="h-full rounded-full relative"
        [class]="fillClasses()">
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

  private fill = viewChild<ElementRef<HTMLDivElement>>('fill');

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

  constructor() {
    let prevPct = -1;

    effect(() => {
      const pct = this.percentage();
      const el = this.fill()?.nativeElement;
      if (!el) {
        prevPct = pct;
        return;
      }

      if (prevPct < 0 || pct < prevPct) {
        // First render or new task (percentage decreased) — snap immediately
        el.style.transition = 'none';
        el.style.width = `${pct}%`;
        el.getBoundingClientRect(); // force reflow
        el.style.transition = 'width 1s linear';
      } else {
        // Normal progress — smooth linear transition matching tick interval
        el.style.width = `${pct}%`;
      }

      prevPct = pct;
    });
  }
}
