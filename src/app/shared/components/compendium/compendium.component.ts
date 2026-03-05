import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CompendiumData } from '../../../core/models/meta.model';
import { MINION_ARCHETYPES, ALL_ARCHETYPE_IDS, MinionArchetype, getRarityColor } from '../../../core/models/minion.model';
import { TASK_POOL } from '../../../core/models/task-pool';
import { TaskCategory, TaskTier } from '../../../core/models/task.model';
import { REVIEWERS, Reviewer, ALL_MODIFIERS, Modifier, ModifierCategory } from '../../../core/models/reviewer.model';

type CompendiumTab = 'minions' | 'tasks' | 'reviewers' | 'modifiers';

interface GroupedTasks {
  category: TaskCategory;
  icon: string;
  label: string;
  tiers: { tier: TaskTier; tasks: { name: string; discovered: boolean }[] }[];
}

@Component({
  selector: 'app-compendium',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-bg-primary z-[80] flex flex-col overflow-hidden"
         data-testid="compendium">
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-secondary/50">
        <button
          (click)="back.emit()"
          data-testid="compendium-back"
          class="text-sm text-text-muted hover:text-text-primary cursor-pointer transition-colors min-h-[44px] px-2">
          ← Back
        </button>
        <h1 class="text-lg font-display font-black text-gold uppercase tracking-widest">Compendium</h1>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-border bg-bg-secondary/30">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            [attr.data-testid]="'compendium-tab-' + tab.id"
            class="flex-1 py-2 px-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
                   border-b-2 min-h-[44px]"
            [class]="activeTab() === tab.id
              ? 'text-gold border-gold'
              : 'text-text-muted border-transparent hover:text-text-secondary'">
            {{ tab.label }} ({{ tab.count() }}/{{ tab.total }})
          </button>
        }
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4">
        @switch (activeTab()) {
          @case ('minions') {
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              @for (arch of allArchetypes; track arch.id) {
                @if (isArchetypeSeen(arch.id)) {
                  <div class="p-3 rounded-lg border bg-bg-card/50"
                       [class]="getRarityBorder(arch.rarity)">
                    <div class="text-2xl mb-1">{{ arch.icon }}</div>
                    <div class="text-xs font-bold text-text-primary">{{ arch.name }}</div>
                    <div class="text-[10px] mt-0.5" [class]="getRarityTextColor(arch.rarity)">
                      {{ arch.rarity }}
                    </div>
                    <div class="text-[10px] text-text-muted mt-1">{{ arch.description }}</div>
                  </div>
                } @else {
                  <div class="p-3 rounded-lg border border-border/30 bg-bg-card/20 opacity-50">
                    <div class="text-2xl mb-1 grayscale">❓</div>
                    <div class="text-xs font-bold text-text-muted">???</div>
                    <div class="text-[10px] text-text-muted/50 mt-0.5">{{ arch.rarity }}</div>
                  </div>
                }
              }
            </div>
          }
          @case ('tasks') {
            @for (group of groupedTasks(); track group.category) {
              <div class="mb-6">
                <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  {{ group.icon }} {{ group.label }}
                </h3>
                @for (tierGroup of group.tiers; track tierGroup.tier) {
                  <div class="mb-3">
                    <div class="text-[10px] font-bold uppercase tracking-wider mb-1"
                         [class]="getTierColor(tierGroup.tier)">
                      {{ tierGroup.tier }}
                    </div>
                    <div class="space-y-1">
                      @for (task of tierGroup.tasks; track task.name) {
                        <div class="flex items-center gap-2 text-xs px-2 py-1 rounded"
                             [class]="task.discovered ? 'bg-bg-card/50' : 'bg-bg-card/20 opacity-50'">
                          <span [class]="task.discovered ? 'text-text-primary' : 'text-text-muted'">
                            {{ task.discovered ? task.name : '???' }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          }
          @case ('reviewers') {
            <div class="space-y-3">
              @for (reviewer of allReviewers; track reviewer.id) {
                @if (isReviewerSeen(reviewer.id)) {
                  <div class="p-4 rounded-lg border border-red-500/30 bg-bg-card/50">
                    <div class="text-sm font-bold text-text-primary">{{ reviewer.name }}</div>
                    <div class="text-xs text-text-muted">{{ reviewer.title }}</div>
                    <div class="text-[10px] text-red-400 mt-1 uppercase">{{ reviewer.personality }}</div>
                    <div class="text-[10px] text-text-muted mt-1">Base target: {{ reviewer.goldTarget }}g</div>
                  </div>
                } @else {
                  <div class="p-4 rounded-lg border border-border/30 bg-bg-card/20 opacity-50">
                    <div class="text-sm font-bold text-text-muted">???</div>
                    <div class="text-xs text-text-muted/50">Unknown Reviewer</div>
                  </div>
                }
              }
            </div>
          }
          @case ('modifiers') {
            <div class="space-y-2">
              @for (mod of allModifiers; track mod.id) {
                @if (isModifierSeen(mod.id)) {
                  <div class="flex items-start gap-2 p-3 rounded-lg border bg-bg-card/50"
                       [class]="getModifierBorder(mod.category)">
                    <span class="text-sm shrink-0">{{ getModifierIcon(mod.category) }}</span>
                    <div>
                      <div class="text-xs font-bold text-text-primary">{{ mod.name }}</div>
                      <div class="text-[10px] text-text-muted">{{ mod.description }}</div>
                    </div>
                  </div>
                } @else {
                  <div class="flex items-start gap-2 p-3 rounded-lg border border-border/30 bg-bg-card/20 opacity-50">
                    <span class="text-sm shrink-0">{{ getModifierIcon(mod.category) }}</span>
                    <div>
                      <div class="text-xs font-bold text-text-muted">???</div>
                      <div class="text-[10px] text-text-muted/50">Undiscovered modifier</div>
                    </div>
                  </div>
                }
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: contents; }
  `,
})
export class CompendiumComponent {
  compendium = input.required<CompendiumData>();
  back = output<void>();

  activeTab = signal<CompendiumTab>('minions');

  readonly allArchetypes: MinionArchetype[] = ALL_ARCHETYPE_IDS.map(id => MINION_ARCHETYPES[id]);
  readonly allReviewers: Reviewer[] = REVIEWERS;
  readonly allModifiers: Modifier[] = ALL_MODIFIERS;

  readonly tabs = [
    { id: 'minions' as const, label: 'Minions', total: ALL_ARCHETYPE_IDS.length, count: computed(() => this.compendium().seenArchetypes.length) },
    { id: 'tasks' as const, label: 'Tasks', total: TASK_POOL.length, count: computed(() => this.compendium().seenTasks.length) },
    { id: 'reviewers' as const, label: 'Reviewers', total: REVIEWERS.length, count: computed(() => this.compendium().seenReviewers.length) },
    { id: 'modifiers' as const, label: 'Modifiers', total: ALL_MODIFIERS.length, count: computed(() => this.compendium().seenModifiers.length) },
  ];

  readonly groupedTasks = computed((): GroupedTasks[] => {
    const seenSet = new Set(this.compendium().seenTasks);
    const categories: { cat: TaskCategory; icon: string; label: string }[] = [
      { cat: 'schemes', icon: '🗝️', label: 'Schemes' },
      { cat: 'heists', icon: '💎', label: 'Heists' },
      { cat: 'research', icon: '🧪', label: 'Research' },
      { cat: 'mayhem', icon: '💥', label: 'Mayhem' },
    ];
    const tierOrder: TaskTier[] = ['petty', 'sinister', 'diabolical', 'legendary'];

    return categories.map(({ cat, icon, label }) => {
      const catTasks = TASK_POOL.filter(t => t.category === cat);
      const tiers = tierOrder
        .map(tier => ({
          tier,
          tasks: catTasks
            .filter(t => t.tier === tier)
            .map(t => ({ name: t.name, discovered: seenSet.has(t.name) })),
        }))
        .filter(g => g.tasks.length > 0);
      return { category: cat, icon, label, tiers };
    });
  });

  isArchetypeSeen(id: string): boolean {
    return this.compendium().seenArchetypes.includes(id);
  }

  isReviewerSeen(id: string): boolean {
    return this.compendium().seenReviewers.includes(id);
  }

  isModifierSeen(id: string): boolean {
    return this.compendium().seenModifiers.includes(id);
  }

  getRarityTextColor(rarity: string): string {
    return getRarityColor(rarity as any);
  }

  getRarityBorder(rarity: string): string {
    switch (rarity) {
      case 'common': return 'border-green-500/30';
      case 'uncommon': return 'border-purple-500/30';
      case 'rare': return 'border-gold/30';
      default: return 'border-border';
    }
  }

  getTierColor(tier: TaskTier): string {
    switch (tier) {
      case 'petty': return 'text-green-400';
      case 'sinister': return 'text-purple-400';
      case 'diabolical': return 'text-red-400';
      case 'legendary': return 'text-gold';
    }
  }

  getModifierIcon(category: ModifierCategory): string {
    switch (category) {
      case 'task-constraint': return '📋';
      case 'operational-constraint': return '🔒';
      case 'economic-penalty': return '💸';
    }
  }

  getModifierBorder(category: ModifierCategory): string {
    switch (category) {
      case 'task-constraint': return 'border-purple-500/30';
      case 'operational-constraint': return 'border-red-500/30';
      case 'economic-penalty': return 'border-gold/30';
    }
  }
}
