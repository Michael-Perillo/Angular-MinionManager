import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { AnyCard } from '../../../core/models/card.model';
import { JokerDefinition } from '../../../core/models/joker.model';
import { PackItem } from '../../../core/models/card-pack.model';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-card-pack-opener',
  standalone: true,
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4">
      <div class="bg-bg-secondary border border-accent/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col
                  shadow-2xl shadow-accent/10 animate-slide-up">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border shrink-0 text-center">
          <h2 class="text-lg font-display font-black text-text-primary uppercase tracking-wider">
            {{ packName() }}
          </h2>
          <span class="text-xs text-text-muted">
            Pick {{ pickCount() }} {{ pickCount() === 1 ? 'card' : 'cards' }}
            <span class="text-text-secondary">({{ selectedIds().size }}/{{ pickCount() }} selected)</span>
          </span>
        </div>

        <!-- Cards display -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex gap-3 flex-wrap justify-center">
            @for (item of cards(); track item.id) {
              <button
                (click)="toggleSelection(item.id)"
                class="cursor-pointer transition-transform"
                [class]="selectedIds().has(item.id) ? 'scale-105' : 'hover:scale-105'"
                [attr.data-testid]="'pack-card-' + item.id">
                <app-card
                  [card]="item"
                  [selected]="selectedIds().has(item.id)"
                  [disabled]="!selectedIds().has(item.id) && selectedIds().size >= pickCount()" />
                <!-- Item type badge -->
                <div class="text-center mt-1">
                  <span class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                        [class]="isJoker(item) ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'">
                    {{ isJoker(item) ? 'Joker' : getCardType(item) }}
                  </span>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- Confirm button -->
        <div class="px-6 py-4 border-t border-border shrink-0">
          <button
            (click)="onConfirm()"
            [disabled]="!canConfirm()"
            class="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider
                   transition-all cursor-pointer"
            [class]="canConfirm()
              ? 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 active:scale-95'
              : 'opacity-50 cursor-not-allowed bg-white/5 text-text-muted border border-white/10'"
            data-testid="pack-confirm-btn">
            {{ canConfirm() ? 'Confirm Selection' : 'Select ' + pickCount() + ' card' + (pickCount() === 1 ? '' : 's') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `:host { display: contents; }`,
})
export class CardPackOpenerComponent {
  cards = input.required<PackItem[]>();
  pickCount = input.required<number>();
  packName = input<string>('Card Pack');

  cardsPicked = output<string[]>();

  selectedIds = signal<Set<string>>(new Set());

  readonly canConfirm = computed(() =>
    this.selectedIds().size === this.pickCount()
  );

  toggleSelection(itemId: string): void {
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else if (next.size < this.pickCount()) {
        next.add(itemId);
      }
      return next;
    });
  }

  onConfirm(): void {
    if (!this.canConfirm()) return;
    this.cardsPicked.emit([...this.selectedIds()]);
  }

  isJoker(item: AnyCard | JokerDefinition): boolean {
    return '_itemType' in item && (item as PackItem)._itemType === 'joker';
  }

  getCardType(item: AnyCard | JokerDefinition): string {
    return 'type' in item ? (item as AnyCard).type : 'joker';
  }
}
