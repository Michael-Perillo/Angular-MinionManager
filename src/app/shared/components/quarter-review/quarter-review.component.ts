import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { QuarterResult } from '../../../core/models/quarter.model';

@Component({
  selector: 'app-quarter-review',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop (no dismiss) -->
    <div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <!-- Card -->
      <div class="bg-bg-secondary border border-border rounded-2xl p-6 max-w-sm w-full
                  shadow-2xl shadow-black/50 animate-slide-up">
        <!-- Heading -->
        <h2 class="text-lg font-display font-black text-text-primary uppercase tracking-wider text-center mb-4">
          {{ heading() }}
        </h2>

        <!-- Pass/Fail badge -->
        <div class="flex justify-center mb-4">
          <span class="px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider"
                [class]="badgeClass()">
            {{ result().passed ? 'TARGET MET' : 'TARGET MISSED' }}
          </span>
        </div>

        <!-- Stats -->
        <div class="space-y-2 mb-4">
          <div class="flex justify-between items-center text-sm">
            <span class="text-text-muted">Gold Earned</span>
            <span class="font-bold tabular-nums" [class]="result().passed ? 'text-green-400' : 'text-red-400'">
              {{ result().goldEarned }}g / {{ result().target }}g
            </span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-text-muted">Tasks Completed</span>
            <span class="font-bold text-text-primary tabular-nums">{{ result().tasksCompleted }}</span>
          </div>
        </div>

        <!-- Missed quarters warning -->
        @if (missedQuarters() > 0) {
          <div class="mb-4 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-center">
            <p class="text-xs text-red-400">
              {{ missedQuarters() }} missed quarter{{ missedQuarters() > 1 ? 's' : '' }} this year — Year-End review will be harder!
            </p>
          </div>
        }

        <!-- Continue button -->
        <button
          (click)="advance.emit()"
          class="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider
                 bg-accent/20 text-accent border border-accent/30
                 hover:bg-accent/30 active:scale-95
                 transition-all cursor-pointer min-h-[48px]">
          {{ continueLabel() }}
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class QuarterReviewComponent {
  result = input.required<QuarterResult>();
  missedQuarters = input<number>(0);
  isQ4Failed = input<boolean>(false);

  advance = output<void>();

  heading = computed(() => {
    const r = this.result();
    return r.quarter === 4
      ? `Year ${r.year} Review`
      : `Q${r.quarter} Year ${r.year} Review`;
  });

  badgeClass = computed(() => {
    return this.result().passed
      ? 'text-green-400 bg-green-500/20 border border-green-500/30'
      : 'text-red-400 bg-red-500/20 border border-red-500/30';
  });

  continueLabel = computed(() => {
    const r = this.result();
    if (r.quarter === 4 && !r.passed) {
      return 'View Results';
    }
    if (r.quarter === 4) {
      return `Continue to Year ${r.year + 1}`;
    }
    return `Continue to Q${r.quarter + 1}`;
  });
}
