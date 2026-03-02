import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import {
  VoucherId, VoucherDefinition, VOUCHERS, ALL_VOUCHER_IDS,
  getVoucherCost, getVoucherEffect,
} from '../../../core/models/voucher.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <!-- Modal card -->
      <div class="bg-bg-secondary border border-accent/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col
                  shadow-2xl shadow-accent/10 animate-slide-up">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 class="text-lg font-display font-black text-text-primary uppercase tracking-wider">Shop</h2>
            <span class="text-xs text-text-muted">Permanent upgrades for your operation</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm font-bold text-gold">{{ gold() }} 🪙</span>
            <button
              (click)="continue.emit()"
              class="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider
                     bg-accent/20 text-accent border border-accent/30
                     hover:bg-accent/30 active:scale-95
                     transition-all cursor-pointer min-h-[40px]"
              data-testid="shop-continue">
              Continue ▶
            </button>
          </div>
        </div>

        <!-- Voucher grid -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (v of voucherList(); track v.def.id) {
              <div
                class="rounded-lg p-4 transition-all"
                [class]="v.isMaxed
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-surface-dark border border-white/10 hover:border-white/20'"
                [attr.data-testid]="'voucher-' + v.def.id">
                <!-- Icon + Name -->
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ v.def.icon }}</span>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold text-text-primary truncate">{{ v.def.name }}</h3>
                    <p class="text-[10px] text-text-muted">{{ v.def.description }}</p>
                  </div>
                </div>

                <!-- Level pips -->
                <div class="flex items-center gap-1 mb-2">
                  @for (pip of [1,2,3]; track pip) {
                    <div
                      class="w-3 h-3 rounded-full border"
                      [class]="pip <= v.level
                        ? 'bg-gold border-gold'
                        : 'bg-transparent border-white/20'">
                    </div>
                  }
                  @if (v.isMaxed) {
                    <span class="ml-auto text-[10px] font-bold text-green-400 uppercase tracking-wider">MAX</span>
                  }
                </div>

                <!-- Current effect / Next level info -->
                @if (v.level > 0) {
                  <p class="text-xs text-text-secondary mb-2">
                    Current: <span class="text-gold font-semibold">{{ formatEffect(v.def, v.level) }}</span>
                  </p>
                }
                @if (!v.isMaxed) {
                  <p class="text-xs text-text-muted mb-3">
                    Next: <span class="text-text-secondary">{{ formatEffect(v.def, v.level + 1) }}</span>
                  </p>
                }

                <!-- Buy button -->
                @if (!v.isMaxed) {
                  <button
                    (click)="purchase.emit(v.def.id)"
                    [disabled]="!v.canAfford"
                    class="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider
                           transition-all cursor-pointer min-h-[36px]"
                    [class]="v.canAfford
                      ? 'bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 active:scale-95'
                      : 'opacity-50 cursor-not-allowed bg-white/5 text-text-muted border border-white/10'"
                    [attr.data-testid]="'buy-' + v.def.id">
                    {{ v.nextCost }} 🪙
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <!-- Footer: summary of owned effects -->
        @if (hasAnyVoucher()) {
          <div class="px-6 py-3 border-t border-border shrink-0">
            <div class="flex flex-wrap gap-x-4 gap-y-1">
              @for (v of ownedSummary(); track v.id) {
                <span class="text-xs text-text-secondary">
                  {{ v.icon }} {{ v.name }}: <span class="text-gold font-semibold">{{ v.effectText }}</span>
                </span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class ShopComponent {
  vouchers = input.required<Record<VoucherId, number>>();
  gold = input.required<number>();

  continue = output<void>();
  purchase = output<VoucherId>();

  readonly voucherList = computed(() => {
    const levels = this.vouchers();
    const g = this.gold();
    return ALL_VOUCHER_IDS.map(id => {
      const def = VOUCHERS[id];
      const level = levels[id];
      const isMaxed = level >= def.maxLevel;
      const nextCost = isMaxed ? 0 : getVoucherCost(id, level + 1);
      const canAfford = !isMaxed && g >= nextCost;
      return { def, level, isMaxed, nextCost, canAfford };
    });
  });

  readonly hasAnyVoucher = computed(() =>
    ALL_VOUCHER_IDS.some(id => this.vouchers()[id] > 0)
  );

  readonly ownedSummary = computed(() => {
    const levels = this.vouchers();
    return ALL_VOUCHER_IDS
      .filter(id => levels[id] > 0)
      .map(id => {
        const def = VOUCHERS[id];
        const level = levels[id];
        return {
          id,
          icon: def.icon,
          name: def.name,
          effectText: this.formatEffect(def, level),
        };
      });
  });

  formatEffect(def: VoucherDefinition, level: number): string {
    const value = getVoucherEffect(def.id, level);
    if (def.id === 'rapid-intel') return `${value}\u00D7 refresh`;
    if (def.id === 'hire-discount') return `${Math.round(value * 100)}% discount`;
    if (def.id === 'dept-funding') return `+${Math.round(value * 100)}% XP`;
    return `+${value} ${def.effectLabel}`;
  }
}
