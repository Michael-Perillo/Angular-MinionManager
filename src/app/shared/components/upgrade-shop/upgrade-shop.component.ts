import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { Upgrade, upgradeCost, upgradeEffectAtLevel, UpgradeCategory } from '../../../core/models/upgrade.model';
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
                  Lv.{{ upgrade.currentLevel }}
                </span>
              </div>
              <p class="text-xs text-text-secondary mt-0.5">{{ upgrade.description }}</p>
              @if (upgrade.currentLevel > 0) {
                <p class="text-xs text-accent mt-0.5">
                  Current: {{ getCurrentEffect(upgrade) }} | Next: {{ getNextEffect(upgrade) }}
                </p>
              }
            </div>

            <button
              (click)="purchaseClicked.emit(upgrade.id)"
              [disabled]="gold() < getCost(upgrade)"
              class="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              [class]="gold() >= getCost(upgrade)
                ? 'bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 active:scale-95'
                : 'bg-white/5 text-text-muted cursor-not-allowed'">
              {{ getCost(upgrade) }}g
            </button>
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
    { key: 'notoriety' as UpgradeCategory, label: 'Notoriety' },
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
    return this.formatEffect(upgrade, upgrade.currentLevel);
  }

  getNextEffect(upgrade: Upgrade): string {
    return this.formatEffect(upgrade, upgrade.currentLevel + 1);
  }

  getEffectTooltip(upgrade: Upgrade): string {
    if (upgrade.currentLevel === 0) return upgrade.description;
    const current = this.getCurrentEffect(upgrade);
    return `${upgrade.name}: ${current} (next: ${this.getNextEffect(upgrade)})`;
  }

  private formatEffect(upgrade: Upgrade, level: number): string {
    const effect = upgradeEffectAtLevel(upgrade, level);
    switch (upgrade.id) {
      case 'click-power':
        return `+${effect} click power`;
      case 'click-gold':
        return `+${Math.round(effect * 100)}% gold from clicks`;
      case 'minion-speed':
        return `+${Math.round(effect * 100)}% minion speed`;
      case 'minion-efficiency':
        return `+${Math.round(effect * 100)}% minion efficiency`;
      case 'minion-xp':
        return `+${Math.round(effect * 100)}% minion XP`;
      case 'board-slots':
        return `+${effect} board slots`;
      case 'active-slots':
        return `+${effect} active slots`;
      case 'board-refresh':
        return `-${Math.round((1 - effect) * 100)}% refresh time`;
      case 'dept-xp-boost':
        return `+${Math.round(effect * 100)}% dept XP`;
      case 'hire-discount':
        return `-${Math.round(effect * 100)}% hire cost`;
      case 'bribe-network':
        return `-${Math.round(effect * 100)}% bribe cost`;
      case 'shadow-ops':
        return `-${Math.round(effect * 100)}% notoriety gain`;
      case 'cover-spawn':
        return `+${Math.round(effect * 100)}% cover spawn rate`;
      case 'lay-low':
        return `-${effect.toFixed(2)}/tick notoriety decay`;
      default:
        return `Level ${level}`;
    }
  }
}
