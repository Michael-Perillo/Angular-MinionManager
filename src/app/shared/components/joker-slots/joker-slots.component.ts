import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { JokerId, JokerDefinition, JOKER_POOL, MAX_JOKER_SLOTS } from '../../../core/models/joker.model';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-joker-slots',
  standalone: true,
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2" data-testid="joker-slots">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold text-text-primary uppercase tracking-wider">
          Jokers <span class="text-text-muted">({{ equippedJokers().length }}/{{ MAX_JOKER_SLOTS }})</span>
        </h4>
      </div>

      <!-- Equipped slots -->
      <div class="flex gap-2 flex-wrap">
        @for (jokerId of equippedJokers(); track jokerId) {
          @if (getJokerDef(jokerId); as joker) {
            <button
              (click)="jokerUnequipped.emit(jokerId)"
              class="cursor-pointer"
              [attr.data-testid]="'equipped-' + jokerId">
              <app-card [card]="joker" />
            </button>
          }
        }
        @for (i of emptySlots(); track i) {
          <button
            (click)="showPicker.set(true)"
            class="w-[100px] h-[100px] rounded-lg border border-dashed border-white/20
                   flex items-center justify-center text-text-muted hover:border-white/40
                   transition-all cursor-pointer"
            data-testid="joker-empty-slot">
            <span class="text-xl">+</span>
          </button>
        }
      </div>

      <!-- Picker overlay -->
      @if (showPicker()) {
        <div class="mt-2 p-3 rounded-lg border border-accent/30 bg-bg-secondary">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-text-primary">Choose a Joker</span>
            <button (click)="showPicker.set(false)"
                    class="text-xs text-text-muted cursor-pointer hover:text-text-primary">✕</button>
          </div>
          <div class="flex gap-2 flex-wrap">
            @for (jokerId of availableJokers(); track jokerId) {
              @if (getJokerDef(jokerId); as joker) {
                <button (click)="onEquip(jokerId)" class="cursor-pointer"
                        [attr.data-testid]="'pick-' + jokerId">
                  <app-card [card]="joker" />
                </button>
              }
            }
            @if (availableJokers().length === 0) {
              <p class="text-xs text-text-muted">No jokers available to equip.</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `:host { display: block; }`,
})
export class JokerSlotsComponent {
  equippedJokers = input.required<JokerId[]>();
  ownedJokers = input.required<Set<JokerId>>();

  jokerEquipped = output<JokerId>();
  jokerUnequipped = output<JokerId>();

  showPicker = signal(false);

  readonly MAX_JOKER_SLOTS = MAX_JOKER_SLOTS;

  readonly emptySlots = computed(() => {
    const count = MAX_JOKER_SLOTS - this.equippedJokers().length;
    return Array.from({ length: Math.max(0, count) }, (_, i) => i);
  });

  readonly availableJokers = computed(() => {
    const owned = this.ownedJokers();
    const equipped = new Set(this.equippedJokers());
    return [...owned].filter(id => !equipped.has(id));
  });

  getJokerDef(id: JokerId): JokerDefinition | undefined {
    return JOKER_POOL[id];
  }

  onEquip(jokerId: JokerId): void {
    this.jokerEquipped.emit(jokerId);
    this.showPicker.set(false);
  }
}
