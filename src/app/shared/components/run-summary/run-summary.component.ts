import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RunSummary, getInfamyBreakdown } from '../../../core/models/meta.model';

@Component({
  selector: 'app-run-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
         data-testid="run-summary">
      <div class="bg-bg-secondary border border-gold/30 rounded-2xl p-6 sm:p-8 max-w-md w-full
                  shadow-2xl shadow-gold/10 animate-slide-up overflow-y-auto max-h-[90vh]">
        <!-- Title -->
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">🏴</div>
          <h1 class="text-2xl font-display font-black text-gold uppercase tracking-widest">
            Run Complete
          </h1>
        </div>

        <!-- Stats box -->
        <div class="space-y-2 mb-6 bg-bg-card/50 rounded-lg p-4 border border-border">
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Years Survived</span>
            <span class="font-bold text-text-primary tabular-nums">{{ summary().yearsSurvived }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Quarters Passed</span>
            <span class="font-bold text-text-primary tabular-nums">{{ summary().quartersPassed }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Bosses Beaten</span>
            <span class="font-bold text-text-primary tabular-nums">{{ summary().bossesBeaten }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Total Gold</span>
            <span class="font-bold text-gold tabular-nums">{{ summary().totalGoldEarned }}g</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Tasks Completed</span>
            <span class="font-bold text-text-primary tabular-nums">{{ summary().totalTasksCompleted }}</span>
          </div>
        </div>

        <!-- Infamy breakdown -->
        <div class="mb-6 bg-bg-card/50 rounded-lg p-4 border border-gold/20">
          <h2 class="text-xs font-bold text-gold uppercase tracking-wider mb-3">Infamy Earned</h2>
          <div class="space-y-1.5">
            @if (breakdown().yearBonus > 0) {
              <div class="flex justify-between text-xs">
                <span class="text-text-muted">Years Survived</span>
                <span class="text-gold tabular-nums">+{{ breakdown().yearBonus }}</span>
              </div>
            }
            @if (breakdown().quarterBonus > 0) {
              <div class="flex justify-between text-xs">
                <span class="text-text-muted">Quarters Passed</span>
                <span class="text-gold tabular-nums">+{{ breakdown().quarterBonus }}</span>
              </div>
            }
            @if (breakdown().goldBonus > 0) {
              <div class="flex justify-between text-xs">
                <span class="text-text-muted">Gold Earned</span>
                <span class="text-gold tabular-nums">+{{ breakdown().goldBonus }}</span>
              </div>
            }
            @if (breakdown().bossBonus > 0) {
              <div class="flex justify-between text-xs">
                <span class="text-text-muted">Bosses Beaten</span>
                <span class="text-gold tabular-nums">+{{ breakdown().bossBonus }}</span>
              </div>
            }
            @if (breakdown().perfectBonus > 0) {
              <div class="flex justify-between text-xs">
                <span class="text-text-muted">Perfect Quarters</span>
                <span class="text-gold tabular-nums">+{{ breakdown().perfectBonus }}</span>
              </div>
            }
            <div class="flex justify-between text-sm font-bold pt-2 border-t border-gold/20">
              <span class="text-gold">Total Infamy</span>
              <span class="text-gold tabular-nums">{{ breakdown().total }} IP</span>
            </div>
          </div>
        </div>

        <!-- New discoveries -->
        @if (hasNewDiscoveries()) {
          <div class="mb-6 bg-bg-card/50 rounded-lg p-4 border border-accent/20"
               data-testid="new-discoveries">
            <h2 class="text-xs font-bold text-accent uppercase tracking-wider mb-2">New Discoveries</h2>
            <div class="flex flex-wrap gap-2">
              @if (newDiscoveries().archetypes > 0) {
                <span class="text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                  👾 {{ newDiscoveries().archetypes }} archetype{{ newDiscoveries().archetypes > 1 ? 's' : '' }}
                </span>
              }
              @if (newDiscoveries().tasks > 0) {
                <span class="text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                  📋 {{ newDiscoveries().tasks }} task{{ newDiscoveries().tasks > 1 ? 's' : '' }}
                </span>
              }
              @if (newDiscoveries().reviewers > 0) {
                <span class="text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                  👔 {{ newDiscoveries().reviewers }} reviewer{{ newDiscoveries().reviewers > 1 ? 's' : '' }}
                </span>
              }
              @if (newDiscoveries().modifiers > 0) {
                <span class="text-xs px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                  ⚡ {{ newDiscoveries().modifiers }} modifier{{ newDiscoveries().modifiers > 1 ? 's' : '' }}
                </span>
              }
            </div>
          </div>
        }

        <!-- Return to Menu button -->
        <button
          (click)="returnToMenu.emit()"
          data-testid="return-to-menu"
          class="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider
                 bg-gold/20 text-gold border border-gold/30
                 hover:bg-gold/30 active:scale-95
                 transition-all cursor-pointer min-h-[48px]">
          Return to Menu
        </button>
      </div>
    </div>
  `,
  styles: `
    :host { display: contents; }
  `,
})
export class RunSummaryComponent {
  summary = input.required<RunSummary>();
  newDiscoveries = input<{ archetypes: number; tasks: number; reviewers: number; modifiers: number }>({
    archetypes: 0, tasks: 0, reviewers: 0, modifiers: 0,
  });

  returnToMenu = output<void>();

  breakdown = computed(() => getInfamyBreakdown(this.summary()));

  hasNewDiscoveries = computed(() => {
    const d = this.newDiscoveries();
    return d.archetypes > 0 || d.tasks > 0 || d.reviewers > 0 || d.modifiers > 0;
  });
}
