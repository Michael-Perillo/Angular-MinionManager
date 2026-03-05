import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { QuarterResult } from '../../../core/models/quarter.model';

@Component({
  selector: 'app-run-over',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
      <!-- Card -->
      <div class="bg-bg-secondary border border-red-500/40 rounded-2xl p-8 max-w-md w-full
                  shadow-2xl shadow-red-500/30 animate-slide-up text-center">
        <!-- Failure icon -->
        <div class="text-5xl mb-4">💀</div>

        <!-- Title -->
        <h1 class="text-2xl font-display font-black text-red-400 uppercase tracking-widest mb-2">
          Performance Review Failed
        </h1>
        <p class="text-sm text-text-muted mb-6">
          Your evil organization has been shut down by corporate oversight.
        </p>

        <!-- Run stats -->
        <div class="space-y-2 mb-6 text-left bg-bg-card/50 rounded-lg p-4 border border-border">
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Years Survived</span>
            <span class="font-bold text-text-primary tabular-nums">{{ yearsSurvived() }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Quarters Passed</span>
            <span class="font-bold text-text-primary tabular-nums">{{ quartersPassed() }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Total Gold Earned</span>
            <span class="font-bold text-gold tabular-nums">{{ totalGold() }}g</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Tasks Completed</span>
            <span class="font-bold text-text-primary tabular-nums">{{ totalTasks() }}</span>
          </div>
        </div>

        <!-- View Summary button -->
        <button
          (click)="newRun.emit()"
          data-testid="view-summary"
          class="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider
                 bg-accent/20 text-accent border border-accent/30
                 hover:bg-accent/30 active:scale-95
                 transition-all cursor-pointer min-h-[48px]">
          View Summary
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
export class RunOverComponent {
  quarterResults = input.required<QuarterResult[]>();
  totalGold = input.required<number>();
  totalTasks = input.required<number>();

  newRun = output<void>();

  yearsSurvived = computed(() => {
    const results = this.quarterResults();
    if (results.length === 0) return 0;
    return results[results.length - 1].year;
  });

  quartersPassed = computed(() => {
    return this.quarterResults().filter(r => r.passed).length;
  });
}
