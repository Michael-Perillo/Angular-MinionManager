import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { QuarterProgress } from '../../../core/models/quarter.model';
import { Modifier } from '../../../core/models/reviewer.model';
import { ModifierBadgeComponent } from '../modifier-badge/modifier-badge.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ModifierBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex items-center justify-between gap-3 px-4 py-2
                    border-b border-border bg-bg-secondary/50 backdrop-blur-sm">
      <!-- Left: Title -->
      <div class="flex items-center gap-3 shrink-0">
        <div>
          <h1 class="text-lg sm:text-xl font-display font-black text-text-primary uppercase tracking-widest leading-tight">
            Minion Manager
          </h1>
          <p class="text-xs text-text-muted">
            Evil Empire
          </p>
        </div>
      </div>

      <!-- Center: Stats -->
      <div class="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
        <!-- Save indicator -->
        @if (showSaveIndicator()) {
          <span class="text-[10px] text-text-muted animate-fade-in-out">Saved</span>
        }

        <!-- Gold -->
        <div class="flex items-center gap-1">
          <span>🪙</span>
          <span class="font-bold text-gold tabular-nums text-sm">{{ gold() }}</span>
        </div>

        <!-- Completed -->
        <div class="flex items-center gap-1">
          <span>✅</span>
          <span class="font-bold text-text-primary tabular-nums text-sm">{{ completedCount() }}</span>
        </div>

        <!-- Minions -->
        <div class="flex items-center gap-1">
          <span>👾</span>
          <span class="font-bold text-text-primary tabular-nums text-sm">{{ minionCount() }}</span>
        </div>

        <!-- Quarter progress -->
        @if (quarterProgress(); as qp) {
          <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border"
               [class]="quarterStatusClass()">
            <span class="text-xs font-bold">Y{{ qp.year }}Q{{ qp.quarter }}</span>
            <span class="text-[10px] tabular-nums">{{ qp.tasksCompleted }}/{{ taskBudget() }}</span>
            <span class="text-[10px] tabular-nums"
                  [class]="quarterGold() >= goldTarget() ? 'text-green-400' : 'text-text-muted'">
              {{ quarterGold() }}g/{{ goldTarget() }}g
            </span>
            <span class="text-[10px] text-text-muted tabular-nums" title="Dismissals remaining">
              ✂️{{ dismissalsRemaining() }}
            </span>
          </div>
        }
      </div>

      <!-- Active modifiers (Q4 review) -->
      @if (activeModifiers().length > 0) {
        <div class="flex items-center gap-1 flex-wrap">
          @for (mod of activeModifiers(); track mod.id) {
            <app-modifier-badge [modifier]="mod" />
          }
        </div>
      }

      <!-- Pause button -->
      <button (click)="pause.emit()"
              data-testid="header-pause"
              aria-label="Pause"
              class="text-lg cursor-pointer hover:scale-110 transition-transform min-h-[44px] px-1 shrink-0">
        ⏸️
      </button>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
    @keyframes fadeInOut {
      0% { opacity: 0; }
      15% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
    .animate-fade-in-out {
      animation: fadeInOut 2s ease-in-out forwards;
    }
  `,
})
export class HeaderComponent {
  gold = input.required<number>();
  completedCount = input.required<number>();
  minionCount = input.required<number>();
  quarterProgress = input<QuarterProgress | null>(null);
  quarterGold = input<number>(0);
  taskBudget = input<number>(0);
  goldTarget = input<number>(0);
  dismissalsRemaining = input<number>(5);
  lastSaved = input<number>(0);
  activeModifiers = input<Modifier[]>([]);

  pause = output<void>();

  showSaveIndicator = computed(() => {
    const saved = this.lastSaved();
    if (!saved) return false;
    return Date.now() - saved < 2000;
  });

  quarterStatusClass = computed(() => {
    const qp = this.quarterProgress();
    if (!qp) return 'border-border';
    if (qp.isComplete) return 'border-accent/30 bg-accent/10';
    return this.quarterGold() >= this.goldTarget()
      ? 'border-green-500/30 bg-green-500/10'
      : 'border-border bg-bg-card/50';
  });
}
