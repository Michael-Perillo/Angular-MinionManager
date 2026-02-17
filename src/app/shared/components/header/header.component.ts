import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4
                    border-b border-border bg-bg-secondary/50 backdrop-blur-sm">
      <div>
        <h1 class="text-2xl sm:text-3xl font-display font-black text-text-primary uppercase tracking-widest">
          Minion Manager
        </h1>
        <p class="text-xs text-text-muted mt-0.5">
          Lvl {{ villainLevel() }} — {{ villainTitle() }}
        </p>
      </div>

      <div class="flex items-center gap-6">
        <!-- Gold -->
        <div class="flex items-center gap-2">
          <span class="text-xl">🪙</span>
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wider">Gold</div>
            <div class="text-xl font-bold text-gold tabular-nums">{{ gold() }}</div>
          </div>
        </div>

        <!-- Tasks completed -->
        <div class="flex items-center gap-2">
          <span class="text-xl">✅</span>
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wider">Completed</div>
            <div class="text-xl font-bold text-text-primary tabular-nums">{{ completedCount() }}</div>
          </div>
        </div>

        <!-- Minions -->
        <div class="flex items-center gap-2">
          <span class="text-xl">👾</span>
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wider">Minions</div>
            <div class="text-xl font-bold text-text-primary tabular-nums">{{ minionCount() }}</div>
          </div>
        </div>

        <!-- Reset button -->
        <button
          (click)="reset.emit()"
          class="text-xs text-text-muted hover:text-accent transition-colors
                 px-2 py-1 rounded border border-transparent hover:border-accent/30 cursor-pointer">
          Reset
        </button>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class HeaderComponent {
  gold = input.required<number>();
  completedCount = input.required<number>();
  minionCount = input.required<number>();
  villainLevel = input.required<number>();
  villainTitle = input.required<string>();
  reset = output<void>();
}
