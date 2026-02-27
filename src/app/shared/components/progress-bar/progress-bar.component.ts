import { Component, ChangeDetectionStrategy, input, computed, signal, effect, untracked, OnDestroy } from '@angular/core';
import { TaskTier } from '../../../core/models';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-3 rounded-full overflow-hidden" [class]="trackClasses()">
      <div
        class="h-full rounded-full relative"
        [class]="fillClasses()"
        [style.width.%]="_widthPercent()"
        [style.transition]="_transition()">
        @if (_widthPercent() > 0) {
          <div class="absolute inset-0 progress-bar-shimmer"></div>
        }
      </div>
    </div>
  `,
})
export class ProgressBarComponent implements OnDestroy {
  progress = input.required<number>();
  total = input.required<number>();
  tier = input<TaskTier>('petty');

  /** Timestamp when minion started working (stable — set once per task assignment) */
  assignedAt = input<number | null>(null);
  /** Timestamp when task will complete (stable — set once per task assignment) */
  completesAt = input<number | null>(null);

  percentage = computed(() => {
    const t = this.total();
    if (t <= 0) return 0;
    return Math.min(100, Math.max(0, ((t - this.progress()) / t) * 100));
  });

  _widthPercent = signal(0);
  _transition = signal('width 300ms ease-out');
  private _rafId: number | null = null;

  constructor() {
    effect(() => {
      const at = this.assignedAt();
      const ct = this.completesAt();

      if (at !== null && ct !== null) {
        const totalMs = ct - at;
        const elapsed = Date.now() - at;
        const startPct = totalMs > 0
          ? Math.min(100, Math.max(0, (elapsed / totalMs) * 100))
          : 100;
        const remainingMs = Math.max(0, ct - Date.now());

        // Phase 1: jump to start position instantly
        untracked(() => {
          this._transition.set('none');
          this._widthPercent.set(startPct);
        });

        // Phase 2: double rAF ensures the browser paints the reset (0%) state
        // before we apply the transition. A single rAF can coalesce with the
        // synchronous signal writes into one paint frame on fresh components.
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = requestAnimationFrame(() => {
          this._rafId = requestAnimationFrame(() => {
            this._transition.set(`width ${remainingMs}ms linear`);
            this._widthPercent.set(100);
            this._rafId = null;
          });
        });
      } else {
        // Fallback: use progress/total for non-timed progress bars (click-based)
        // Read percentage() outside untracked() so progress/total changes are tracked
        const pct = this.percentage();
        untracked(() => {
          this._transition.set('width 300ms ease-out');
          this._widthPercent.set(pct);
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
  }

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
