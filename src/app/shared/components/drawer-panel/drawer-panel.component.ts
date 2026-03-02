import { Component, ChangeDetectionStrategy, input, output, signal, OnInit, viewChild, computed } from '@angular/core';
import { TaskCategory } from '../../../core/models/task.model';
import { Department } from '../../../core/models/department.model';
import { Minion } from '../../../core/models/minion.model';
import { CardId, CARD_POOL } from '../../../core/models/card.model';
import { JokerId } from '../../../core/models/joker.model';
import { Rule, isDefaultRule } from '../../../core/models/rule.model';
import { DepartmentPanelComponent } from '../department-panel/department-panel.component';
import { HireMinionPanelComponent } from '../hire-minion-panel/hire-minion-panel.component';
import { MinionRosterComponent } from '../minion-roster/minion-roster.component';
import { JokerSlotsComponent } from '../joker-slots/joker-slots.component';

type DrawerTab = 'hire' | 'departments' | 'rules';

@Component({
  selector: 'app-drawer-panel',
  standalone: true,
  imports: [
    DepartmentPanelComponent,
    HireMinionPanelComponent,
    MinionRosterComponent,
    JokerSlotsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <aside class="flex flex-col h-full border-l border-border bg-bg-secondary/90 w-[260px] overflow-hidden">
        <!-- Drawer header -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Lair</h3>
          <button
            (click)="toggle()"
            class="text-text-muted hover:text-text-primary text-sm cursor-pointer p-1">
            ✕
          </button>
        </div>

        <!-- Tab bar -->
        <div class="flex border-b border-border shrink-0 overflow-x-auto">
          @for (tab of allTabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="flex-1 py-1.5 px-1 text-xs font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap"
              [class]="activeTab() === tab.id
                ? 'text-gold border-gold'
                : 'text-text-muted border-transparent hover:text-text-secondary'">
              {{ tab.icon }} {{ tab.label }}
            </button>
          }
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-3">
          @switch (activeTab()) {
            @case ('hire') {
              <app-hire-minion-panel
                #hirePanel
                [gold]="gold()"
                [cost]="nextMinionCost()"
                [minionCount]="minions().length"
                [canHire]="canHireMinion()"
                [unlockedDepartments]="unlockedDepartments()"
                [hiringDisabled]="hiringDisabled()"
                (recruit)="recruitClicked.emit()"
                (hireChosen)="hireChosenClicked.emit($event)" />
              <div class="mt-3">
                <app-minion-roster
                  [minions]="minions()" />
              </div>
            }
            @case ('departments') {
              <app-department-panel
                [departments]="departments()" />
            }
            @case ('rules') {
              <!-- Joker slots -->
              <app-joker-slots
                [equippedJokers]="equippedJokers()"
                [ownedJokers]="ownedJokers()"
                (jokerEquipped)="jokerEquipped.emit($event)"
                (jokerUnequipped)="jokerUnequipped.emit($event)" />

              <!-- Rule summary -->
              <div class="mt-4 space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Rules <span class="text-text-muted">({{ customRules().length }}/{{ maxRuleSlots() }})</span>
                  </h4>
                  <button
                    (click)="editRulesClicked.emit()"
                    class="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent
                           hover:bg-accent/30 cursor-pointer uppercase tracking-wider font-bold"
                    data-testid="edit-rules-btn">
                    Edit
                  </button>
                </div>
                @for (rule of customRules(); track rule.id) {
                  <div class="rounded-lg border border-white/10 bg-surface-dark p-2"
                       [attr.data-testid]="'rule-summary-' + rule.id">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-semibold text-text-primary truncate">{{ rule.name }}</span>
                      <span class="text-[10px] px-1.5 py-0.5 rounded"
                            [class]="rule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                        {{ rule.enabled ? 'ON' : 'OFF' }}
                      </span>
                    </div>
                    <div class="flex items-center gap-0.5 mt-1">
                      <span class="text-sm">{{ getCardIcon(rule.triggerId) }}</span>
                      <span class="text-text-muted text-[10px]">→</span>
                      @for (condId of rule.conditionIds; track condId) {
                        <span class="text-sm">{{ getCardIcon(condId) }}</span>
                        <span class="text-text-muted text-[10px]">→</span>
                      }
                      <span class="text-sm">{{ getCardIcon(rule.actionId) }}</span>
                    </div>
                  </div>
                }
                @if (customRules().length === 0) {
                  <p class="text-xs text-text-muted">No custom rules yet. Click Edit to create one.</p>
                }
                <!-- Default rule -->
                <div class="rounded-lg border border-white/5 bg-white/5 p-2 opacity-60">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-semibold text-text-muted">Default: Auto-Assign</span>
                    <span class="text-[9px] text-text-muted uppercase">Always</span>
                  </div>
                  <div class="flex items-center gap-0.5 mt-1">
                    <span class="text-sm">💤</span>
                    <span class="text-text-muted text-[10px]">→</span>
                    <span class="text-sm">⚒️</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </aside>
    }
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class DrawerPanelComponent implements OnInit {
  // General inputs
  gold = input.required<number>();
  minions = input.required<Minion[]>();
  departments = input.required<Record<TaskCategory, Department>>();
  nextMinionCost = input.required<number>();
  canHireMinion = input.required<boolean>();

  unlockedDepartments = input<Set<TaskCategory>>(new Set());
  hiringDisabled = input<boolean>(false);

  // Rules tab inputs
  equippedJokers = input<JokerId[]>([]);
  ownedJokers = input<Set<JokerId>>(new Set());
  rules = input<Rule[]>([]);
  maxRuleSlots = input<number>(1);

  // Outputs
  hireClicked = output<void>();
  recruitClicked = output<void>();
  hireChosenClicked = output<Minion>();
  drawerToggled = output<boolean>();
  jokerEquipped = output<JokerId>();
  jokerUnequipped = output<JokerId>();
  editRulesClicked = output<void>();

  initiallyOpen = input(false);
  initialTab = input<DrawerTab | null>(null);

  readonly hirePanel = viewChild<HireMinionPanelComponent>('hirePanel');

  isOpen = signal(false);
  activeTab = signal<DrawerTab>('hire');

  ngOnInit(): void {
    if (this.initiallyOpen()) this.isOpen.set(true);
    const tab = this.initialTab();
    if (tab) this.activeTab.set(tab);
  }

  readonly allTabs: { id: DrawerTab; label: string; icon: string }[] = [
    { id: 'hire', label: 'Minions', icon: '👾' },
    { id: 'departments', label: 'Depts', icon: '🏛️' },
    { id: 'rules', label: 'Rules', icon: '🧠' },
  ];

  readonly customRules = computed(() =>
    this.rules().filter(r => !isDefaultRule(r))
  );

  getCardIcon(id: CardId): string {
    return CARD_POOL[id]?.icon ?? '?';
  }

  toggle(): void {
    this.isOpen.update(v => !v);
    this.drawerToggled.emit(this.isOpen());
  }

  open(): void {
    this.isOpen.set(true);
    this.drawerToggled.emit(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.drawerToggled.emit(false);
  }
}
