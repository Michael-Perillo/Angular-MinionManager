import { Component, inject, OnInit, OnDestroy, signal, computed, viewChild, HostListener } from '@angular/core';
import { GameStateService } from '../../core/services/game-state.service';
import { TimerService } from '../../core/services/timer.service';
import { SaveService } from '../../core/services/save.service';
import { QueueTarget, TaskCategory, Task } from '../../core/models/task.model';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MissionBoardComponent } from '../../shared/components/mission-board/mission-board.component';
import { KanbanBoardComponent } from '../../shared/components/kanban-board/kanban-board.component';
import { DrawerPanelComponent } from '../../shared/components/drawer-panel/drawer-panel.component';
import { MissionRouterComponent } from '../../shared/components/mission-router/mission-router.component';
import { MobileBottomNavComponent, MobileTab } from '../../shared/components/mobile-bottom-nav/mobile-bottom-nav.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';
import { NotorietyBarComponent } from '../../shared/components/notoriety-bar/notoriety-bar.component';
import { UpgradeShopComponent } from '../../shared/components/upgrade-shop/upgrade-shop.component';
import { DepartmentPanelComponent } from '../../shared/components/department-panel/department-panel.component';
import { HireMinionPanelComponent } from '../../shared/components/hire-minion-panel/hire-minion-panel.component';
import { MinionRosterComponent } from '../../shared/components/minion-roster/minion-roster.component';
import { PrisonPanelComponent } from '../../shared/components/prison-panel/prison-panel.component';
import { PlayerWorkbenchComponent } from '../../shared/components/player-workbench/player-workbench.component';
import { DepartmentColumnComponent } from '../../shared/components/department-column/department-column.component';

@Component({
  selector: 'app-game-container',
  standalone: true,
  imports: [
    HeaderComponent,
    MissionBoardComponent,
    KanbanBoardComponent,
    DrawerPanelComponent,
    MissionRouterComponent,
    MobileBottomNavComponent,
    NotificationToastComponent,
    NotorietyBarComponent,
    UpgradeShopComponent,
    DepartmentPanelComponent,
    HireMinionPanelComponent,
    MinionRosterComponent,
    PrisonPanelComponent,
    PlayerWorkbenchComponent,
    DepartmentColumnComponent,
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
        [notoriety]="gameState.notoriety()"
        [supplies]="gameState.supplies()"
        [intel]="gameState.intel()"
        [raidActive]="gameState.raidActive()"
        [capturedCount]="gameState.capturedMinions().length"
        [lastSaved]="gameState.lastSaved()"
        (drawerToggle)="onDrawerToggle()"
        (reset)="onReset()" />

      <!-- Desktop layout (>= 768px) -->
      @if (!isMobile()) {
        <main class="flex-1 flex overflow-hidden">
          <!-- Left panel: Mission Board (fixed width) -->
          <div class="w-[300px] shrink-0 border-r border-border p-3 overflow-y-auto">
            <app-mission-board
              [missions]="gameState.missionBoard()"
              [activeCount]="gameState.activeMissions().length"
              [activeSlots]="gameState.activeSlots()"
              [connectedDropLists]="kanbanDropListIds"
              (missionAccepted)="onAcceptMission($event)"
              (missionRouteRequested)="onMissionRouteRequested($event)" />
          </div>

          <!-- Center: Kanban work area -->
          <div class="flex-1 overflow-x-auto p-3">
            <app-kanban-board
              [departmentQueues]="gameState.departmentQueues()"
              [playerQueue]="gameState.playerQueue()"
              [departments]="gameState.departments()"
              [minions]="gameState.minions()"
              [clickPower]="gameState.clickPower()"
              (taskClicked)="onTaskClick($event)"
              (taskMoved)="onTaskMoved($event)"
              (taskRouted)="onTaskRouted($event)" />
          </div>

          <!-- Right: Collapsible drawer -->
          <app-drawer-panel
            [notoriety]="gameState.notoriety()"
            [threatLevel]="gameState.threatLevel()"
            [goldPenalty]="gameState.notorietyGoldPenaltyPercent()"
            [gold]="gameState.gold()"
            [raidActive]="gameState.raidActive()"
            [raidTimer]="gameState.raidTimer()"
            [minions]="gameState.minions()"
            [departments]="gameState.departments()"
            [upgrades]="gameState.upgrades()"
            [capturedMinions]="gameState.capturedMinions()"
            [currentTime]="currentTime()"
            [nextMinionCost]="gameState.nextMinionCost()"
            [canHireMinion]="gameState.canHireMinion()"
            (bribeClicked)="onBribe()"
            (defendClicked)="onDefendRaid()"
            (hireClicked)="onHireMinion()"
            (upgradeClicked)="onPurchaseUpgrade($event)" />
        </main>
      }

      <!-- Mobile layout (< 768px) -->
      @if (isMobile()) {
        <main class="flex-1 overflow-y-auto pb-16 px-3 py-3">
          @switch (mobileTab()) {
            @case ('missions') {
              <app-mission-board
                [missions]="gameState.missionBoard()"
                [activeCount]="gameState.activeMissions().length"
                [activeSlots]="gameState.activeSlots()"
                (missionAccepted)="onAcceptMission($event)"
                (missionRouteRequested)="onMissionRouteRequested($event)" />
            }
            @case ('work') {
              <!-- Swipeable department columns -->
              <div class="flex flex-col gap-3">
                <!-- Department selector -->
                <div class="flex items-center gap-2 overflow-x-auto">
                  @for (cat of allCategories; track cat) {
                    <button
                      (click)="mobileDeptTab.set(cat)"
                      class="px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors min-h-[36px]"
                      [class]="mobileDeptTab() === cat
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'text-text-muted hover:text-text-secondary border border-transparent'">
                      {{ getCategoryIcon(cat) }} {{ getCategoryLabel(cat) }}
                    </button>
                  }
                </div>

                <!-- Show selected department -->
                <app-department-column
                  [category]="mobileDeptTab()"
                  [tasks]="gameState.departmentQueues()[mobileDeptTab()]"
                  [department]="gameState.departments()[mobileDeptTab()]"
                  [assignedMinions]="getMobileMinions()"
                  [connectedDropLists]="[]" />
              </div>
            }
            @case ('click') {
              <app-player-workbench
                [tasks]="gameState.playerQueue()"
                [clickPower]="gameState.clickPower()"
                [connectedDropLists]="[]"
                (taskClicked)="onTaskClick($event)" />
            }
            @case ('more') {
              <div class="flex flex-col gap-2">
                <button
                  (click)="moreSection.set('notoriety')"
                  class="w-full flex items-center gap-3 p-4 rounded-lg bg-bg-card border border-border
                         hover:border-accent/30 transition-all cursor-pointer min-h-[48px]">
                  <span class="text-xl">🔥</span>
                  <span class="text-sm font-semibold text-text-primary">Notoriety & Raids</span>
                  <span class="ml-auto text-text-muted">→</span>
                </button>
                <button
                  (click)="moreSection.set('hire')"
                  class="w-full flex items-center gap-3 p-4 rounded-lg bg-bg-card border border-border
                         hover:border-accent/30 transition-all cursor-pointer min-h-[48px]">
                  <span class="text-xl">👾</span>
                  <span class="text-sm font-semibold text-text-primary">Hire Minions</span>
                  <span class="ml-auto text-text-muted">→</span>
                </button>
                <button
                  (click)="moreSection.set('upgrades')"
                  class="w-full flex items-center gap-3 p-4 rounded-lg bg-bg-card border border-border
                         hover:border-accent/30 transition-all cursor-pointer min-h-[48px]">
                  <span class="text-xl">⚡</span>
                  <span class="text-sm font-semibold text-text-primary">Lair Upgrades</span>
                  <span class="ml-auto text-text-muted">→</span>
                </button>
                <button
                  (click)="moreSection.set('departments')"
                  class="w-full flex items-center gap-3 p-4 rounded-lg bg-bg-card border border-border
                         hover:border-accent/30 transition-all cursor-pointer min-h-[48px]">
                  <span class="text-xl">🏛️</span>
                  <span class="text-sm font-semibold text-text-primary">Departments</span>
                  <span class="ml-auto text-text-muted">→</span>
                </button>
                @if (gameState.capturedMinions().length > 0) {
                  <button
                    (click)="moreSection.set('prison')"
                    class="w-full flex items-center gap-3 p-4 rounded-lg bg-bg-card border border-border
                           border-orange-500/30 hover:border-orange-500/50 transition-all cursor-pointer min-h-[48px]">
                    <span class="text-xl">🔒</span>
                    <span class="text-sm font-semibold text-orange-400">Prison</span>
                    <span class="ml-auto text-orange-400">→</span>
                  </button>
                }
                <button
                  (click)="onReset()"
                  class="w-full flex items-center gap-3 p-4 rounded-lg bg-bg-card border border-border
                         hover:border-red-500/30 transition-all cursor-pointer min-h-[48px]">
                  <span class="text-xl">🔄</span>
                  <span class="text-sm font-semibold text-text-muted">Reset Game</span>
                  <span class="ml-auto text-text-muted">→</span>
                </button>
              </div>

              <!-- Expanded section -->
              @if (moreSection()) {
                <div class="mt-4">
                  <button
                    (click)="moreSection.set(null)"
                    class="text-xs text-text-muted mb-2 cursor-pointer hover:text-text-secondary">
                    ← Back
                  </button>

                  @switch (moreSection()) {
                    @case ('notoriety') {
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
                    @case ('hire') {
                      <app-hire-minion-panel
                        [gold]="gameState.gold()"
                        [cost]="gameState.nextMinionCost()"
                        [minionCount]="gameState.minions().length"
                        [canHire]="gameState.canHireMinion()"
                        (hire)="onHireMinion()" />
                      <div class="mt-3">
                        <app-minion-roster [minions]="gameState.minions()" />
                      </div>
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
              }
            }
          }
        </main>

        <app-mobile-bottom-nav
          [activeTab]="mobileTab()"
          [hasAlert]="gameState.raidActive()"
          (tabSelected)="onMobileTabChange($event)" />
      }

      <!-- Mission Router (popup for choosing queue target) -->
      <app-mission-router
        [mission]="routerMission()"
        [deptQueueCounts]="deptQueueCounts()"
        [playerQueueCount]="gameState.playerQueue().length"
        [isMobile]="isMobile()"
        (queueSelected)="onQueueSelected($event)"
        (closed)="routerMission.set(null)" />

      <!-- Notifications -->
      <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm"
           [class]="isMobile() ? 'bottom-20' : 'bottom-4'">
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

  readonly drawerPanel = viewChild(DrawerPanelComponent);
  readonly missionRouter = viewChild(MissionRouterComponent);

  readonly currentTime = signal(Date.now());
  readonly isMobile = signal(false);
  readonly mobileTab = signal<MobileTab>('missions');
  readonly mobileDeptTab = signal<TaskCategory>('schemes');
  readonly moreSection = signal<string | null>(null);
  readonly routerMission = signal<Task | null>(null);

  private currentTimeInterval: ReturnType<typeof setInterval> | null = null;

  readonly allCategories: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];
  readonly kanbanDropListIds = ['schemes', 'heists', 'research', 'mayhem', 'player'];

  readonly deptQueueCounts = computed(() => {
    const queues = this.gameState.departmentQueues();
    return {
      schemes: queues.schemes.length,
      heists: queues.heists.length,
      research: queues.research.length,
      mayhem: queues.mayhem.length,
    } as Record<TaskCategory, number>;
  });

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  ngOnInit(): void {
    this.isMobile.set(window.innerWidth < 768);

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

  onMissionRouteRequested(mission: Task): void {
    this.routerMission.set(mission);
    this.missionRouter()?.open();
  }

  onQueueSelected(event: { missionId: string; target: QueueTarget }): void {
    this.gameState.routeMission(event.missionId, event.target);
    this.routerMission.set(null);
  }

  onTaskMoved(event: { taskId: string; from: QueueTarget; to: QueueTarget }): void {
    this.gameState.moveTaskToQueue(event.taskId, event.from, event.to);
  }

  onTaskRouted(event: { taskId: string; target: QueueTarget }): void {
    this.gameState.routeMission(event.taskId, event.target);
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

  onDrawerToggle(): void {
    this.drawerPanel()?.toggle();
  }

  onMobileTabChange(tab: MobileTab): void {
    this.mobileTab.set(tab);
    this.moreSection.set(null);
  }

  getCategoryIcon(cat: TaskCategory): string {
    switch (cat) {
      case 'schemes': return '🗝️';
      case 'heists': return '💎';
      case 'research': return '🧪';
      case 'mayhem': return '💥';
    }
  }

  getCategoryLabel(cat: TaskCategory): string {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  getMobileMinions() {
    const cat = this.mobileDeptTab();
    return this.gameState.minions().filter(m => m.assignedDepartment === cat);
  }
}
