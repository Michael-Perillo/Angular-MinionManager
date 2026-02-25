import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { Upgrade, upgradeCost, UpgradeCategory } from '../../../core/models/upgrade.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-upgrade-shop',
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-text-primary font-display uppercase tracking-wider">
          Lair Upgrades
        </h2>
        <span class="text-xs text-gold font-bold">{{ gold() }}g available</span>
      </div>

      <!-- Category tabs -->
      <div class="flex gap-1 flex-wrap">
        @for (cat of categoryTabs; track cat.key) {
          <button
            (click)="selectedCategory.set(cat.key)"
            class="px-2 py-1 text-xs rounded cursor-pointer transition-colors"
            [class]="selectedCategory() === cat.key ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:text-text-secondary'">
            {{ cat.label }}
          </button>
        }
      </div>

      <div class="flex flex-col gap-2">
        @for (upgrade of filteredUpgrades(); track upgrade.id) {
          <div
            class="game-card p-3 flex items-center gap-3"
            [appTooltip]="getEffectTooltip(upgrade)"
            [appTooltipPosition]="'left'">
            <span class="text-xl shrink-0">{{ upgrade.icon }}</span>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-text-primary">{{ upgrade.name }}</span>
                <span class="text-xs text-text-muted">
                  {{ upgrade.currentLevel }}/{{ upgrade.maxLevel }}
                </span>
              </div>
              <p class="text-[10px] text-text-secondary mt-0.5">{{ upgrade.description }}</p>
              @if (upgrade.currentLevel > 0) {
                <p class="text-[10px] text-accent mt-0.5">
                  Current: {{ getCurrentEffect(upgrade) }}
                  @if (upgrade.currentLevel < upgrade.maxLevel) {
                    | Next: {{ getNextEffect(upgrade) }}
                  }
                </p>
              }
            </div>

            @if (upgrade.currentLevel < upgrade.maxLevel) {
              <button
                (click)="purchaseClicked.emit(upgrade.id)"
                [disabled]="gold() < getCost(upgrade)"
                class="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                [class]="gold() >= getCost(upgrade)
                  ? 'bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 active:scale-95'
                  : 'bg-white/5 text-text-muted cursor-not-allowed'">
                {{ getCost(upgrade) }}g
              </button>
            } @else {
              <span class="text-xs text-tier-petty font-bold shrink-0 px-3 py-1.5">MAX</span>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class UpgradeShopComponent {
  upgrades = input.required<Upgrade[]>();
  gold = input.required<number>();
  purchaseClicked = output<string>();

  selectedCategory = signal<UpgradeCategory | null>(null);

  categoryTabs = [
    { key: null as UpgradeCategory | null, label: 'All' },
    { key: 'click' as UpgradeCategory, label: 'Click Power' },
    { key: 'minion' as UpgradeCategory, label: 'Minion Training' },
    { key: 'war-room' as UpgradeCategory, label: 'War Room' },
    { key: 'department' as UpgradeCategory, label: 'Departments' },
  ];

  filteredUpgrades = computed(() => {
    const all = this.upgrades();
    if (!this.selectedCategory()) return all;
    return all.filter(u => u.category === this.selectedCategory());
  });

  getCost(upgrade: Upgrade): number {
    return upgradeCost(upgrade);
  }

  getCurrentEffect(upgrade: Upgrade): string {
    return this.computeEffect(upgrade, upgrade.currentLevel);
  }

  getNextEffect(upgrade: Upgrade): string {
    return this.computeEffect(upgrade, upgrade.currentLevel + 1);
  }

  getEffectTooltip(upgrade: Upgrade): string {
    if (upgrade.currentLevel === 0) return upgrade.description;
    const current = this.getCurrentEffect(upgrade);
    if (upgrade.currentLevel >= upgrade.maxLevel) return `${upgrade.name}: ${current} (MAX)`;
    return `${upgrade.name}: ${current} (next: ${this.getNextEffect(upgrade)})`;
  }

  private computeEffect(upgrade: Upgrade, level: number): string {
    switch (upgrade.id) {
      case 'click-power':
        return `+${level} click power`;
      case 'click-gold':
        return `+${level * 15}% gold from clicks`;
      case 'minion-speed':
        return `+${level * 8}% minion speed`;
      case 'minion-efficiency':
        return `+${level * 8}% minion efficiency`;
      case 'minion-xp':
        return `+${level * 20}% minion XP`;
      case 'board-slots':
        return `+${level * 3} board slots`;
      case 'active-slots':
        return `+${level} active slots`;
      case 'board-refresh':
        return `-${level * 20}% refresh time`;
      case 'dept-xp-boost':
        return `+${level * 15}% dept XP`;
      case 'hire-discount':
        return `-${level * 8}% hire cost`;
      default:
        return `Level ${level}`;
    }
  }
}
