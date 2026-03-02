import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { PackType, PACK_DEFINITIONS, PackDefinition } from '../../../core/models/card-pack.model';

@Component({
  selector: 'app-card-shop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3" data-testid="card-shop">
      <p class="text-xs text-text-muted mb-2">Buy card packs to expand your collection of logic cards and jokers.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        @for (pack of packList(); track pack.def.id) {
          <div class="rounded-lg p-4 bg-surface-dark border border-white/10 hover:border-white/20 transition-all"
               [attr.data-testid]="'pack-' + pack.def.id">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">{{ pack.def.icon }}</span>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-text-primary truncate">{{ pack.def.name }}</h3>
                <p class="text-[10px] text-text-muted">{{ pack.def.totalShown }} cards shown, pick {{ pack.def.pickCount }}</p>
              </div>
            </div>
            <button
              (click)="packPurchased.emit(pack.def.id)"
              [disabled]="!pack.canAfford"
              class="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider
                     transition-all cursor-pointer min-h-[36px]"
              [class]="pack.canAfford
                ? 'bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 active:scale-95'
                : 'opacity-50 cursor-not-allowed bg-white/5 text-text-muted border border-white/10'"
              [attr.data-testid]="'buy-pack-' + pack.def.id">
              {{ pack.def.goldCost }} 🪙
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: `:host { display: block; }`,
})
export class CardShopComponent {
  gold = input.required<number>();

  packPurchased = output<PackType>();

  readonly packList = computed(() => {
    const g = this.gold();
    return (['shop-standard', 'shop-premium'] as PackType[]).map(id => ({
      def: PACK_DEFINITIONS[id],
      canAfford: g >= PACK_DEFINITIONS[id].goldCost,
    }));
  });
}
