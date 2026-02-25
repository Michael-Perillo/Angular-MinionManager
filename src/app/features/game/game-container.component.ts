import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { GameStateService } from '../../core/services/game-state.service';
import { TimerService } from '../../core/services/timer.service';
import { SaveService } from '../../core/services/save.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { TaskQueueComponent } from '../../shared/components/task-queue/task-queue.component';
import { MissionBoardComponent } from '../../shared/components/mission-board/mission-board.component';
import { MinionRosterComponent } from '../../shared/components/minion-roster/minion-roster.component';
import { HireMinionPanelComponent } from '../../shared/components/hire-minion-panel/hire-minion-panel.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';
import { DepartmentPanelComponent } from '../../shared/components/department-panel/department-panel.component';
import { UpgradeShopComponent } from '../../shared/components/upgrade-shop/upgrade-shop.component';
import { NotorietyBarComponent } from '../../shared/components/notoriety-bar/notoriety-bar.component';
import { PrisonPanelComponent } from '../../shared/components/prison-panel/prison-panel.component';

@Component({
  selector: 'app-game-container',
  standalone: true,
  imports: [
    HeaderComponent,
    TaskQueueComponent,
    MissionBoardComponent,
    MinionRosterComponent,
    HireMinionPanelComponent,
    NotificationToastComponent,
    DepartmentPanelComponent,
    UpgradeShopComponent,
    NotorietyBarComponent,
    PrisonPanelComponent,
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <app-header
        [gold]="gameState.gold()"
        [completedCount]="gameState.completedCount()"
        [minionCount]="gameState.minions().length"
        [villainLevel]="gameState.villainLevel()"
        [villainTitle]="gameState.villainTitle()"
        [lastSaved]="gameState.lastSaved()"
        (reset)="onReset()" />

      <!-- Main content -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main area: Active Missions + Mission Board -->
          <div class="lg:col-span-2 flex flex-col gap-6">
            <!-- Active Missions (accepted, in-progress) -->
            <app-task-queue
              [tasks]="gameState.activeMissions()"
              [capacity]="gameState.activeSlots()"
              (taskClicked)="onTaskClick($event)" />

            <!-- Mission Board (choose from abundant options) -->
            <app-mission-board
              [missions]="gameState.missionBoard()"
              [activeCount]="gameState.activeMissions().length"
              [activeSlots]="gameState.activeSlots()"
              (missionAccepted)="onAcceptMission($event)" />
          </div>

          <!-- Sidebar -->
          <div class="flex flex-col gap-4">
            <!-- Tab bar -->
            <div class="flex border-b border-white/10">
              @for (tab of visibleTabs(); track tab.id) {
                <button
                  (click)="activeTab.set(tab.id)"
                  class="flex-1 py-2 px-1 text-sm font-semibold transition-colors duration-150 cursor-pointer border-b-2"
                  [class]="activeTab() === tab.id
                    ? 'text-gold border-gold'
                    : 'text-text-secondary border-transparent hover:text-text-primary'">
                  {{ tab.label }}
                </button>
              }
            </div>

            <!-- Tab content -->
            @switch (activeTab()) {
              @case ('status') {
                <app-notoriety-bar
                  [notoriety]="gameState.notoriety()"
                  [threatLevel]="gameState.threatLevel()"
                  [goldPenalty]="gameState.notorietyGoldPenaltyPercent()"
                  [gold]="gameState.gold()"
                  [raidActive]="gameState.raidActive()"
                  [raidTimer]="gameState.raidTimer()"
                  (bribeClicked)="onBribe()"
                  (defendClicked)="onDefendRaid()" />
              }
              @case ('minions') {
                <app-hire-minion-panel
                  [gold]="gameState.gold()"
                  [cost]="gameState.nextMinionCost()"
                  [minionCount]="gameState.minions().length"
                  [canHire]="gameState.canHireMinion()"
                  (hire)="onHireMinion()" />
                <app-minion-roster
                  [minions]="gameState.minions()" />
              }
              @case ('upgrades') {
                <app-upgrade-shop
                  [upgrades]="gameState.upgrades()"
                  [gold]="gameState.gold()"
                  (purchaseClicked)="onPurchaseUpgrade($event)" />
              }
              @case ('departments') {
                <app-department-panel
                  [departments]="gameState.departments()" />
              }
              @case ('prison') {
                <app-prison-panel
                  [capturedMinions]="gameState.capturedMinions()"
                  [currentTime]="currentTime()" />
              }
            }
          </div>
        </div>
      </main>

      <!-- Notifications -->
      <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm">
        @for (notification of gameState.notifications(); track notification.id) {
          <app-notification-toast
            [notification]="notification"
            (dismiss)="gameState.dismissNotification($event)" />
        }
      </div>
    </div>
  `,
})
export class GameContainerComponent implements OnInit, OnDestroy {
  readonly gameState = inject(GameStateService);
  private readonly timer = inject(TimerService);
  private readonly saveService = inject(SaveService);

  readonly activeTab = signal('minions');
  readonly currentTime = signal(Date.now());
  private currentTimeInterval: ReturnType<typeof setInterval> | null = null;

  private readonly allTabs = [
    { id: 'status', label: 'Status', alwaysShow: true },
    { id: 'minions', label: 'Minions', alwaysShow: true },
    { id: 'upgrades', label: 'Upgrades', alwaysShow: true },
    { id: 'departments', label: 'Depts', alwaysShow: true },
    { id: 'prison', label: 'Prison', alwaysShow: false },
  ];

  readonly visibleTabs = computed(() => {
    const hasPrisoners = this.gameState.capturedMinions().length > 0;
    return this.allTabs.filter(t => t.alwaysShow || (t.id === 'prison' && hasPrisoners));
  });

  ngOnInit(): void {
    if (!this.saveService.load()) {
      this.gameState.initializeGame();
    }

    // Wire up auto-save callback
    this.gameState.onAutoSave = () => this.saveService.save();

    this.timer.start();

    // Tick currentTime every second for prison countdowns
    this.currentTimeInterval = setInterval(() => this.currentTime.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    this.timer.stop();
    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval);
    }
  }

  onTaskClick(taskId: string): void {
    this.gameState.clickTask(taskId);
  }

  onAcceptMission(missionId: string): void {
    this.gameState.acceptMission(missionId);
  }

  onBribe(): void {
    this.gameState.payBribe();
  }

  onDefendRaid(): void {
    this.gameState.defendRaid();
  }

  onPurchaseUpgrade(upgradeId: string): void {
    this.gameState.purchaseUpgrade(upgradeId);
  }

  onHireMinion(): void {
    this.gameState.hireMinion();
  }

  onReset(): void {
    this.gameState.resetGame();
    this.saveService.clearSave();
  }
}
