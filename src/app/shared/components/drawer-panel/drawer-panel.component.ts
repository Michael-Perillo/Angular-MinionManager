import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit } from '@angular/core';
import { TaskCategory } from '../../../core/models/task.model';
import { Department } from '../../../core/models/department.model';
import { Upgrade } from '../../../core/models/upgrade.model';
import { Minion, CapturedMinion } from '../../../core/models/minion.model';
import { ThreatLevel } from '../../../core/models/notoriety.model';
import { NotorietyBarComponent } from '../notoriety-bar/notoriety-bar.component';
import { UpgradeShopComponent } from '../upgrade-shop/upgrade-shop.component';
import { DepartmentPanelComponent } from '../department-panel/department-panel.component';
import { HireMinionPanelComponent } from '../hire-minion-panel/hire-minion-panel.component';
import { MinionRosterComponent } from '../minion-roster/minion-roster.component';
import { PrisonPanelComponent } from '../prison-panel/prison-panel.component';

type DrawerTab = 'notoriety' | 'hire' | 'upgrades' | 'departments' | 'prison';

@Component({
  selector: 'app-drawer-panel',
  standalone: true,
  imports: [
    NotorietyBarComponent,
    UpgradeShopComponent,
    DepartmentPanelComponent,
    HireMinionPanelComponent,
    MinionRosterComponent,
    PrisonPanelComponent,
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
          @for (tab of visibleTabs(); track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="flex-1 py-1.5 px-1 text-[10px] font-semibold transition-colors cursor-pointer border-b-2 whitespace-nowrap"
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
            @case ('notoriety') {
              <app-notoriety-bar
                [notoriety]="notoriety()"
                [threatLevel]="threatLevel()"
                [goldPenalty]="goldPenalty()"
                [gold]="gold()"
                [raidActive]="raidActive()"
                [raidTimer]="raidTimer()"
                (bribeClicked)="bribeClicked.emit()"
                (defendClicked)="defendClicked.emit()" />
            }
            @case ('hire') {
              <app-hire-minion-panel
                [gold]="gold()"
                [cost]="nextMinionCost()"
                [minionCount]="minions().length"
                [canHire]="canHireMinion()"
                (hire)="hireClicked.emit()" />
              <div class="mt-3">
                <app-minion-roster
                  [minions]="minions()" />
              </div>
            }
            @case ('upgrades') {
              <app-upgrade-shop
                [upgrades]="upgrades()"
                [gold]="gold()"
                (purchaseClicked)="upgradeClicked.emit($event)" />
            }
            @case ('departments') {
              <app-department-panel
                [departments]="departments()" />
            }
            @case ('prison') {
              <app-prison-panel
                [capturedMinions]="capturedMinions()"
                [currentTime]="currentTime()" />
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
  // Notoriety inputs
  notoriety = input.required<number>();
  threatLevel = input.required<ThreatLevel>();
  goldPenalty = input.required<number>();
  raidActive = input.required<boolean>();
  raidTimer = input.required<number>();

  // General inputs
  gold = input.required<number>();
  minions = input.required<Minion[]>();
  departments = input.required<Record<TaskCategory, Department>>();
  upgrades = input.required<Upgrade[]>();
  capturedMinions = input.required<CapturedMinion[]>();
  currentTime = input.required<number>();
  nextMinionCost = input.required<number>();
  canHireMinion = input.required<boolean>();

  // Outputs
  bribeClicked = output<void>();
  defendClicked = output<void>();
  hireClicked = output<void>();
  upgradeClicked = output<string>();
  drawerToggled = output<boolean>();

  initiallyOpen = input(false);
  initialTab = input<DrawerTab | null>(null);

  isOpen = signal(false);
  activeTab = signal<DrawerTab>('notoriety');

  ngOnInit(): void {
    if (this.initiallyOpen()) this.isOpen.set(true);
    const tab = this.initialTab();
    if (tab) this.activeTab.set(tab);
  }

  private readonly allTabs: { id: DrawerTab; label: string; icon: string; alwaysShow: boolean }[] = [
    { id: 'notoriety', label: 'Notoriety', icon: '🔥', alwaysShow: true },
    { id: 'hire', label: 'Minions', icon: '👾', alwaysShow: true },
    { id: 'upgrades', label: 'Upgrades', icon: '⚡', alwaysShow: true },
    { id: 'departments', label: 'Depts', icon: '🏛️', alwaysShow: true },
    { id: 'prison', label: 'Prison', icon: '🔒', alwaysShow: false },
  ];

  visibleTabs = computed(() => {
    const hasPrisoners = this.capturedMinions().length > 0;
    return this.allTabs.filter(t => t.alwaysShow || (t.id === 'prison' && hasPrisoners));
  });

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
