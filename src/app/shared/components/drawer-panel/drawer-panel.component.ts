import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit, viewChild } from '@angular/core';
import { TaskCategory } from '../../../core/models/task.model';
import { Department } from '../../../core/models/department.model';
import { Upgrade } from '../../../core/models/upgrade.model';
import { Minion } from '../../../core/models/minion.model';
import { UpgradeShopComponent } from '../upgrade-shop/upgrade-shop.component';
import { DepartmentPanelComponent } from '../department-panel/department-panel.component';
import { HireMinionPanelComponent } from '../hire-minion-panel/hire-minion-panel.component';
import { MinionRosterComponent } from '../minion-roster/minion-roster.component';

type DrawerTab = 'hire' | 'upgrades' | 'departments';

@Component({
  selector: 'app-drawer-panel',
  standalone: true,
  imports: [
    UpgradeShopComponent,
    DepartmentPanelComponent,
    HireMinionPanelComponent,
    MinionRosterComponent,
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
            @case ('upgrades') {
              <app-upgrade-shop
                [upgrades]="upgrades()"
                [gold]="gold()"
                [upgradesDisabled]="upgradesDisabled()"
                (purchaseClicked)="upgradeClicked.emit($event)" />
            }
            @case ('departments') {
              <app-department-panel
                [departments]="departments()" />
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
  upgrades = input.required<Upgrade[]>();
  nextMinionCost = input.required<number>();
  canHireMinion = input.required<boolean>();

  unlockedDepartments = input<Set<TaskCategory>>(new Set());
  hiringDisabled = input<boolean>(false);
  upgradesDisabled = input<boolean>(false);

  // Outputs
  hireClicked = output<void>();
  recruitClicked = output<void>();
  hireChosenClicked = output<Minion>();
  upgradeClicked = output<string>();
  drawerToggled = output<boolean>();

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
    { id: 'upgrades', label: 'Upgrades', icon: '⚡' },
    { id: 'departments', label: 'Depts', icon: '🏛️' },
  ];

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
