import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { AnyCard, CardRarity } from '../../../core/models/card.model';
import { JokerDefinition, JokerRarity } from '../../../core/models/joker.model';

type CardOrJoker = AnyCard | JokerDefinition;

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative rounded-lg p-3 transition-all min-w-[100px]"
      [class]="containerClasses()"
      [attr.data-testid]="'card-' + card().id">
      <!-- Icon -->
      <div class="text-2xl text-center mb-1">{{ card().icon }}</div>
      <!-- Name -->
      <h4 class="text-xs font-bold text-text-primary text-center truncate">{{ card().name }}</h4>
      <!-- Description -->
      <p class="text-[10px] text-text-muted text-center mt-0.5 line-clamp-2">{{ card().description }}</p>
      <!-- Rarity badge -->
      <div class="text-[9px] text-center mt-1 uppercase tracking-wider"
           [class]="rarityColor()">
        {{ card().rarity }}
      </div>
      <!-- Type badge -->
      @if (showType()) {
        <div class="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded bg-white/10 text-text-muted uppercase">
          {{ cardType() }}
        </div>
      }
      <!-- In-use badge -->
      @if (inUse()) {
        <div class="absolute top-1 left-1 text-[8px] px-1 py-0.5 rounded bg-accent/20 text-accent uppercase">
          In Use
        </div>
      }
      <!-- Selected overlay -->
      @if (selected()) {
        <div class="absolute inset-0 rounded-lg border-2 border-accent bg-accent/10 pointer-events-none"></div>
      }
      <!-- Disabled overlay -->
      @if (disabled()) {
        <div class="absolute inset-0 rounded-lg bg-black/50 pointer-events-none"></div>
      }
    </div>
  `,
  styles: `
    :host { display: inline-block; }
  `,
})
export class CardComponent {
  card = input.required<CardOrJoker>();
  selected = input(false);
  disabled = input(false);
  inUse = input(false);

  readonly showType = computed(() => {
    const c = this.card();
    return 'type' in c && (c as AnyCard).type !== undefined;
  });

  readonly cardType = computed(() => {
    const c = this.card();
    return 'type' in c ? (c as AnyCard).type : 'joker';
  });

  readonly containerClasses = computed(() => {
    const rarity = this.card().rarity as CardRarity;
    const base = 'border cursor-pointer';
    const rarityBorder = {
      common: 'border-white/10 bg-surface-dark',
      uncommon: 'border-green-500/30 bg-green-500/5',
      rare: 'border-blue-500/30 bg-blue-500/5',
      legendary: 'border-gold/30 bg-gold/5',
    }[rarity] ?? 'border-white/10 bg-surface-dark';
    const hover = this.disabled() ? 'opacity-60' : 'hover:border-white/30';
    return `${base} ${rarityBorder} ${hover}`;
  });

  readonly rarityColor = computed(() => {
    const rarity = this.card().rarity as CardRarity;
    return {
      common: 'text-text-muted',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      legendary: 'text-gold',
    }[rarity] ?? 'text-text-muted';
  });
}
