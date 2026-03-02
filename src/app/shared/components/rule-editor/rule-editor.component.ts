import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CardId, CARD_POOL, AnyCard, getCardsByType } from '../../../core/models/card.model';
import { Rule, DEFAULT_RULE, isDefaultRule, getCardsInUse, createRule } from '../../../core/models/rule.model';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-rule-editor',
  standalone: true,
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4">
      <div class="bg-bg-secondary border border-accent/30 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col
                  shadow-2xl shadow-accent/10 animate-slide-up">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 class="text-lg font-display font-black text-text-primary uppercase tracking-wider">
              🧠 Automation Rules
            </h2>
            <span class="text-xs text-text-muted">{{ activeRuleCount() }}/{{ maxSlots() }} slots used</span>
          </div>
          <button (click)="closed.emit()"
                  class="text-text-muted hover:text-text-primary text-lg cursor-pointer p-1"
                  data-testid="rule-editor-close">✕</button>
        </div>

        <!-- Rules list -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          @for (rule of customRules(); track rule.id) {
            <div class="rounded-lg border border-white/10 bg-surface-dark p-3"
                 [attr.data-testid]="'rule-' + rule.id">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-bold text-text-primary">{{ rule.name }}</span>
                <div class="flex items-center gap-2">
                  <button (click)="onToggle(rule.id)"
                          class="text-xs px-2 py-0.5 rounded cursor-pointer"
                          [class]="rule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                    {{ rule.enabled ? 'ON' : 'OFF' }}
                  </button>
                  <button (click)="ruleRemoved.emit(rule.id)"
                          class="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                          [attr.data-testid]="'remove-' + rule.id">✕</button>
                </div>
              </div>
              <!-- Card flow -->
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-lg" [title]="getCardName(rule.triggerId)">{{ getCardIcon(rule.triggerId) }}</span>
                <span class="text-text-muted text-xs">→</span>
                @for (condId of rule.conditionIds; track condId) {
                  <span class="text-lg" [title]="getCardName(condId)">{{ getCardIcon(condId) }}</span>
                  <span class="text-text-muted text-xs">→</span>
                }
                <span class="text-lg" [title]="getCardName(rule.actionId)">{{ getCardIcon(rule.actionId) }}</span>
              </div>
            </div>
          }

          <!-- Add rule (if slots available) -->
          @if (canAddRule()) {
            @if (!showBuilder()) {
              <button (click)="showBuilder.set(true)"
                      class="w-full py-3 rounded-lg border border-dashed border-white/20
                             text-text-muted hover:border-white/40 hover:text-text-secondary
                             transition-all cursor-pointer text-sm"
                      data-testid="add-rule-btn">
                + Add Rule
              </button>
            } @else {
              <!-- Rule builder -->
              <div class="rounded-lg border border-accent/30 bg-surface-dark p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-text-primary">New Rule</span>
                  <button (click)="cancelBuilder()"
                          class="text-xs text-text-muted cursor-pointer hover:text-text-primary">Cancel</button>
                </div>
                <!-- Trigger picker -->
                <div>
                  <label class="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Trigger</label>
                  <div class="flex gap-2 flex-wrap">
                    @for (card of availableTriggers(); track card.id) {
                      <button (click)="builderTrigger.set(card.id)" class="cursor-pointer">
                        <app-card [card]="card"
                                  [selected]="builderTrigger() === card.id"
                                  [disabled]="cardsInUse().has(card.id)" />
                      </button>
                    }
                  </div>
                </div>
                <!-- Condition picker (optional) -->
                <div>
                  <label class="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Conditions (optional)</label>
                  <div class="flex gap-2 flex-wrap">
                    @for (card of availableConditions(); track card.id) {
                      <button (click)="toggleCondition(card.id)" class="cursor-pointer">
                        <app-card [card]="card"
                                  [selected]="builderConditions().includes(card.id)"
                                  [disabled]="cardsInUse().has(card.id)" />
                      </button>
                    }
                  </div>
                </div>
                <!-- Action picker -->
                <div>
                  <label class="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Action</label>
                  <div class="flex gap-2 flex-wrap">
                    @for (card of availableActions(); track card.id) {
                      <button (click)="builderAction.set(card.id)" class="cursor-pointer">
                        <app-card [card]="card"
                                  [selected]="builderAction() === card.id"
                                  [disabled]="cardsInUse().has(card.id)" />
                      </button>
                    }
                  </div>
                </div>
                <!-- Create button -->
                <button (click)="onCreateRule()"
                        [disabled]="!canCreate()"
                        class="w-full py-2 rounded-lg text-sm font-bold uppercase tracking-wider
                               transition-all cursor-pointer"
                        [class]="canCreate()
                          ? 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 active:scale-95'
                          : 'opacity-50 cursor-not-allowed bg-white/5 text-text-muted border border-white/10'"
                        data-testid="create-rule-btn">
                  Create Rule
                </button>
              </div>
            }
          }

          <!-- Default rule (always shown, not editable) -->
          <div class="rounded-lg border border-white/5 bg-white/5 p-3 opacity-60" data-testid="default-rule">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-text-muted">{{ defaultRule.name }}</span>
              <span class="text-[10px] text-text-muted uppercase">Always Active</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-lg">💤</span>
              <span class="text-text-muted text-xs">→</span>
              <span class="text-lg">⚒️</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `:host { display: contents; }`,
})
export class RuleEditorComponent {
  rules = input.required<Rule[]>();
  ownedCards = input.required<Set<CardId>>();
  maxSlots = input.required<number>();

  ruleAdded = output<Rule>();
  ruleRemoved = output<string>();
  ruleToggled = output<string>();
  closed = output<void>();

  showBuilder = signal(false);
  builderTrigger = signal<CardId | null>(null);
  builderConditions = signal<CardId[]>([]);
  builderAction = signal<CardId | null>(null);

  readonly defaultRule = DEFAULT_RULE;

  readonly customRules = computed(() =>
    this.rules().filter(r => !isDefaultRule(r))
  );

  readonly activeRuleCount = computed(() => this.customRules().length);

  readonly canAddRule = computed(() =>
    this.activeRuleCount() < this.maxSlots()
  );

  readonly cardsInUse = computed(() => getCardsInUse(this.rules()));

  readonly availableTriggers = computed(() => {
    const owned = this.ownedCards();
    return getCardsByType('trigger').filter(c => owned.has(c.id));
  });

  readonly availableConditions = computed(() => {
    const owned = this.ownedCards();
    return getCardsByType('condition').filter(c => owned.has(c.id));
  });

  readonly availableActions = computed(() => {
    const owned = this.ownedCards();
    return getCardsByType('action').filter(c => owned.has(c.id));
  });

  readonly canCreate = computed(() =>
    this.builderTrigger() !== null && this.builderAction() !== null
  );

  getCardIcon(id: CardId): string {
    return CARD_POOL[id]?.icon ?? '?';
  }

  getCardName(id: CardId): string {
    return CARD_POOL[id]?.name ?? id;
  }

  toggleCondition(cardId: CardId): void {
    this.builderConditions.update(list => {
      if (list.includes(cardId)) return list.filter(id => id !== cardId);
      if (list.length >= 3) return list;
      return [...list, cardId];
    });
  }

  onToggle(ruleId: string): void {
    this.ruleToggled.emit(ruleId);
  }

  onCreateRule(): void {
    const trigger = this.builderTrigger();
    const action = this.builderAction();
    if (!trigger || !action) return;

    const rule = createRule(trigger, action, this.builderConditions());
    this.ruleAdded.emit(rule);
    this.cancelBuilder();
  }

  cancelBuilder(): void {
    this.showBuilder.set(false);
    this.builderTrigger.set(null);
    this.builderConditions.set([]);
    this.builderAction.set(null);
  }
}
