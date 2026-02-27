import { Component, inject, OnInit, OnDestroy, signal, computed, viewChild, HostListener, ElementRef } from '@angular/core';
import { GameStateService } from '../../core/services/game-state.service';
import { TimerService } from '../../core/services/timer.service';
import { SaveService } from '../../core/services/save.service';
import { QueueTarget, TaskCategory, Task } from '../../core/models/task.model';
import { Minion } from '../../core/models/minion.model';
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
    <div class="h-screen flex flex-col overflow-hidden">
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
              [unlockedDepartments]="gameState.unlockedDepartmentList()"
              [departments]="gameState.departments()"
              (missionAccepted)="onAcceptMission($event)"
              (missionRouteRequested)="onMissionRouteRequested($event)" />
          </div>

          <!-- Center: Kanban work area -->
          <div class="flex-1 overflow-auto p-3">
            <app-kanban-board
              [departmentQueues]="gameState.departmentQueues()"
              [playerQueue]="gameState.playerQueue()"
              [departments]="gameState.departments()"
              [minions]="gameState.minions()"
              [clickPower]="gameState.clickPower()"
              [unlockedDepartments]="gameState.unlockedDepartmentList()"
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
            [unlockedDepartments]="gameState.unlockedDepartments()"
            (bribeClicked)="onBribe()"
            (defendClicked)="onDefendRaid()"
            (recruitClicked)="onRecruitMinion()"
            (hireChosenClicked)="onHireChosenMinion($event)"
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
                [dragDisabled]="true"
                [unlockedDepartments]="gameState.unlockedDepartmentList()"
                [departments]="gameState.departments()"
                (missionAccepted)="onAcceptMission($event)"
                (missionRouteRequested)="onMissionRouteRequested($event)" />
            }
            @case ('work') {
              <!-- Swipeable department columns -->
              @if (gameState.unlockedDepartmentList().length === 0) {
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                  <span class="text-4xl mb-3 opacity-40">🔒</span>
                  <p class="text-sm text-text-muted">No departments unlocked yet.</p>
                  <p class="text-xs text-text-muted mt-1">Hire a minion to open your first department!</p>
                </div>
              } @else {
                <div class="flex flex-col gap-2 h-full -mx-3">
                  <!-- Scroll-snap container -->
                  <div
                    #deptSwipeContainer
                    class="flex-1 flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                    style="scrollbar-width: none; -ms-overflow-style: none;"
                    (scroll)="onDeptScroll()">
                    @for (cat of gameState.unlockedDepartmentList(); track cat; let i = $index) {
                      <div class="w-full shrink-0 snap-center px-3 overflow-y-auto">
                        <app-department-column
                          [category]="cat"
                          [tasks]="gameState.departmentQueues()[cat]"
                          [department]="gameState.departments()[cat]"
                          [assignedMinions]="getDeptMinions(cat)"
                          [connectedDropLists]="[]"
                          [dragDisabled]="true"
                          [fullWidth]="true"
                          (taskMoveRequested)="onTaskMoveRequested($event)" />
                      </div>
                    }
                  </div>

                  <!-- Dot indicators -->
                  <div class="flex items-center justify-center gap-2 py-2 px-3 shrink-0">
                    @for (cat of gameState.unlockedDepartmentList(); track cat; let i = $index) {
                      <button
                        (click)="scrollToDepartment(i)"
                        class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
                        [class]="mobileDeptIndex() === i
                          ? 'bg-accent scale-125'
                          : 'bg-text-muted/30 hover:bg-text-muted/50'"
                        [attr.aria-label]="getCategoryLabel(cat)">
                      </button>
                    }
                    @if (gameState.unlockedDepartmentList().length > 0) {
                      <span class="ml-2 text-xs text-text-muted">
                        {{ getCategoryIcon(gameState.unlockedDepartmentList()[mobileDeptIndex()]) }} {{ getCategoryLabel(gameState.unlockedDepartmentList()[mobileDeptIndex()]) }}
                      </span>
                    }
                  </div>
                </div>
              }
            }
            @case ('click') {
              <app-player-workbench
                [tasks]="gameState.playerQueue()"
                [clickPower]="gameState.clickPower()"
                [connectedDropLists]="[]"
                [dragDisabled]="true"
                [fullWidth]="true"
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
                        #mobileHirePanel
                        [gold]="gameState.gold()"
                        [cost]="gameState.nextMinionCost()"
                        [minionCount]="gameState.minions().length"
                        [canHire]="gameState.canHireMinion()"
                        [unlockedDepartments]="gameState.unlockedDepartments()"
                        (recruit)="onRecruitMinion('mobile')"
                        (hireChosen)="onHireChosenMinion($event)" />
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
        [unlockedDepartments]="gameState.unlockedDepartmentList()"
        (queueSelected)="onQueueSelected($event)"
        (closed)="routerMission.set(null); pendingMove.set(null)" />

      <!-- Notifications -->
      <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm pointer-events-none"
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
  readonly deptSwipeContainer = viewChild<ElementRef>('deptSwipeContainer');
  readonly mobileHirePanel = viewChild<HireMinionPanelComponent>('mobileHirePanel');

  readonly currentTime = signal(Date.now());
  readonly isMobile = signal(false);
  readonly mobileTab = signal<MobileTab>('missions');
  readonly mobileDeptTab = signal<TaskCategory>('schemes');
  readonly mobileDeptIndex = signal(0);
  readonly moreSection = signal<string | null>(null);
  readonly routerMission = signal<Task | null>(null);
  readonly pendingMove = signal<{ taskId: string; fromQueue: string } | null>(null);

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
    const move = this.pendingMove();
    if (move) {
      // Moving an existing task between queues
      this.gameState.moveTaskToQueue(move.taskId, move.fromQueue as QueueTarget, event.target);
      this.pendingMove.set(null);
    } else {
      // Routing a new mission from the board
      this.gameState.routeMission(event.missionId, event.target);
    }
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

  onTaskMoveRequested(event: { taskId: string; fromQueue: string }): void {
    this.pendingMove.set(event);
    // Create a minimal task stub for the router (it only reads .id)
    this.routerMission.set({ id: event.taskId } as Task);
    this.missionRouter()?.open();
  }

  onHireMinion(): void {
    this.gameState.hireMinion();
  }

  onRecruitMinion(source?: string): void {
    const candidates = this.gameState.generateHiringCandidates();
    if (source === 'mobile') {
      this.mobileHirePanel()?.showCandidates(candidates);
    } else {
      this.drawerPanel()?.hirePanel()?.showCandidates(candidates);
    }
  }

  onHireChosenMinion(minion: Minion): void {
    this.gameState.hireChosenMinion(minion);
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

  getDeptMinions(cat: TaskCategory) {
    return this.gameState.minions().filter(m => m.assignedDepartment === cat);
  }

  getMobileMinions() {
    const cat = this.mobileDeptTab();
    return this.gameState.minions().filter(m => m.assignedDepartment === cat);
  }

  onDeptScroll(): void {
    const el = this.deptSwipeContainer()?.nativeElement;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    this.mobileDeptIndex.set(Math.max(0, Math.min(index, this.allCategories.length - 1)));
  }

  scrollToDepartment(index: number): void {
    const el = this.deptSwipeContainer()?.nativeElement;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  }
}
