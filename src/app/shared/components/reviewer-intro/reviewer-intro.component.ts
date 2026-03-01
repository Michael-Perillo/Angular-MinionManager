import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Reviewer, Modifier, getModifier } from '../../../core/models/reviewer.model';
import { ModifierBadgeComponent } from '../modifier-badge/modifier-badge.component';

@Component({
  selector: 'app-reviewer-intro',
  standalone: true,
  imports: [ModifierBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <!-- Card -->
      <div class="bg-bg-secondary border border-red-500/30 rounded-2xl p-6 max-w-md w-full
                  shadow-2xl shadow-red-500/20 animate-slide-up">
        <!-- Year-End Review banner -->
        <div class="text-center mb-4">
          <span class="text-[10px] uppercase tracking-[0.3em] text-red-400 font-bold">Year-End Review</span>
        </div>

        <!-- Reviewer identity -->
        <div class="text-center mb-5">
          <h2 class="text-xl font-display font-black text-text-primary uppercase tracking-wider">
            {{ reviewer().name }}
          </h2>
          <p class="text-xs text-text-muted mt-0.5">{{ reviewer().title }}</p>
        </div>

        <!-- Base challenge -->
        <div class="mb-4">
          <h3 class="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-2">Base Challenge</h3>
          @if (baseModifier(); as baseMod) {
            <div class="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <div class="flex items-center gap-2 mb-1">
                <app-modifier-badge [modifier]="baseMod" />
              </div>
              <p class="text-xs text-text-secondary mt-1">{{ baseMod.description }}</p>
            </div>
          }
        </div>

        <!-- Extra modifiers (from missed quarters) -->
        @if (extraModifiers().length > 0) {
          <div class="mb-4">
            <h3 class="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-2">
              Penalties ({{ extraModifiers().length }} missed quarter{{ extraModifiers().length > 1 ? 's' : '' }})
            </h3>
            <div class="flex flex-col gap-2">
              @for (mod of extraModifiers(); track mod.id) {
                <div class="p-2 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div class="flex items-center gap-2 mb-0.5">
                    <app-modifier-badge [modifier]="mod" />
                  </div>
                  <p class="text-xs text-text-muted">{{ mod.description }}</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Gold target -->
        <div class="text-center mb-5 px-3 py-2 rounded-lg border border-gold/20 bg-gold/5">
          <span class="text-xs text-text-muted">Gold Target</span>
          <span class="text-lg font-bold text-gold ml-2">{{ goldTarget() }}g</span>
        </div>

        <!-- Begin Review button -->
        <button
          (click)="beginReview.emit()"
          class="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider
                 bg-red-500/20 text-red-400 border border-red-500/30
                 hover:bg-red-500/30 active:scale-95
                 transition-all cursor-pointer min-h-[48px]">
          Begin Review
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
export class ReviewerIntroComponent {
  reviewer = input.required<Reviewer>();
  modifiers = input.required<Modifier[]>();
  goldTarget = input.required<number>();

  beginReview = output<void>();

  baseModifier = () => {
    return getModifier(this.reviewer().baseModifier) ?? null;
  };

  extraModifiers = () => {
    const baseId = this.reviewer().baseModifier;
    return this.modifiers().filter(m => m.id !== baseId);
  };
}
