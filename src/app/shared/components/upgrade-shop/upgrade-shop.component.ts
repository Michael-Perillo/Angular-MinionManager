import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Placeholder for the Phase 2 Shop component.
 * Will be replaced with voucher/joker/pack tabs.
 */
@Component({
  selector: 'app-upgrade-shop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col items-center justify-center p-8 text-center">
      <span class="text-3xl mb-3 opacity-40">🏪</span>
      <p class="text-sm text-text-muted">Shop coming soon...</p>
      <p class="text-xs text-text-muted mt-1">Vouchers, jokers, and card packs</p>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class UpgradeShopComponent {}
