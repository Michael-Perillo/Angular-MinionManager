import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { MinionArchetype, MinionRarity, getRarityColor, getRarityBorderColor } from '../../../core/models/minion.model';

@Component({
  selector: 'app-hire-minion-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-card p-4 flex flex-col gap-3">
      <h3 class="text-sm font-bold uppercase tracking-wider text-text-secondary">
        Hire Minion
      </h3>

      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-text-muted">Next minion cost</div>
          <div class="text-lg font-bold text-gold">{{ cost() }}g</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-text-muted">Your gold</div>
          <div class="text-lg font-bold text-gold">{{ gold() }}g</div>
        </div>
      </div>

      @if (hiringDisabled()) {
        <div class="w-full py-2.5 px-4 rounded-lg text-sm font-bold uppercase tracking-wider text-center
                    bg-red-500/10 text-red-400 border border-red-500/20">
          🚫 Hiring Frozen
        </div>
      } @else {
        <!-- Draft pick cards -->
        <div class="grid grid-cols-3 gap-2">
          @for (option of hireOptions(); track option.id) {
            <button
              (click)="onHire(option.id)"
              [disabled]="!canHire()"
              class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-pointer
                     bg-bg-card hover:bg-bg-secondary"
              [class]="getCardClasses(option)">
              <span class="text-2xl">{{ option.icon }}</span>
              <span class="text-xs font-bold text-text-primary text-center leading-tight">{{ option.name }}</span>
              <span class="text-[9px] font-bold uppercase tracking-wider" [class]="getRarityColor(option.rarity)">
                {{ option.rarity }}
              </span>
              <span class="text-[9px] text-text-muted text-center leading-tight">{{ option.description }}</span>
            </button>
          }
        </div>

        <!-- Reroll button -->
        <button
          (click)="onReroll()"
          [disabled]="gold() < rerollCost()"
          class="w-full py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider
                 transition-all cursor-pointer border"
          [class]="gold() >= rerollCost()
            ? 'bg-white/5 text-text-secondary border-border hover:bg-white/10'
            : 'bg-white/5 text-text-muted border-border/50 cursor-not-allowed'">
          🎲 Reroll ({{ rerollCost() }}g)
        </button>
      }

      <div class="text-xs text-text-muted text-center">
        Minions: {{ minionCount() }} | Cost scales with each hire
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class HireMinionPanelComponent {
  gold = input.required<number>();
  cost = input.required<number>();
  minionCount = input.required<number>();
  canHire = input.required<boolean>();
  hiringDisabled = input<boolean>(false);
  hireOptions = input.required<MinionArchetype[]>();
  rerollCost = input<number>(0);

  hire = output<string>();
  reroll = output<void>();

  onHire(archetypeId: string): void {
    this.hire.emit(archetypeId);
  }

  onReroll(): void {
    this.reroll.emit();
  }

  getRarityColor(rarity: MinionRarity): string {
    return getRarityColor(rarity);
  }

  getCardClasses(option: MinionArchetype): string {
    const base = getRarityBorderColor(option.rarity);
    if (!this.canHire()) return `${base} opacity-60`;
    return `${base} hover:scale-105 active:scale-95`;
  }
}
