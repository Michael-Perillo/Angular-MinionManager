import { Component, inject, OnInit, OnDestroy, signal, computed, viewChild, HostListener, ElementRef, effect } from '@angular/core';
import { GameStateService } from '../../core/services/game-state.service';
import { GameTimerService } from '../../core/services/game-timer.service';
import { SaveService } from '../../core/services/save.service';
import { DevConsoleService } from '../../core/services/dev-console.service';
import { QueueTarget, TaskCategory } from '../../core/models/task.model';
import { Minion, MinionRole, MinionArchetype, MINION_ARCHETYPES, getMinionDisplay } from '../../core/models/minion.model';
import { VoucherId } from '../../core/models/voucher.model';
import { getBreakthroughThreshold } from '../../core/models/department.model';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MissionBoardComponent } from '../../shared/components/mission-board/mission-board.component';
import { KanbanBoardComponent } from '../../shared/components/kanban-board/kanban-board.component';
import { MobileBottomNavComponent, MobileTab } from '../../shared/components/mobile-bottom-nav/mobile-bottom-nav.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';
import { ShopComponent } from '../../shared/components/shop/shop.component';
import { DepartmentPanelComponent } from '../../shared/components/department-panel/department-panel.component';
import { DepartmentColumnComponent } from '../../shared/components/department-column/department-column.component';
import { QuarterReviewComponent } from '../../shared/components/quarter-review/quarter-review.component';
import { ReviewerIntroComponent } from '../../shared/components/reviewer-intro/reviewer-intro.component';
import { RunOverComponent } from '../../shared/components/run-over/run-over.component';

@Component({
  selector: 'app-game-container',
  standalone: true,
  imports: [
    HeaderComponent,
    MissionBoardComponent,
    KanbanBoardComponent,
    MobileBottomNavComponent,
    NotificationToastComponent,
    DepartmentPanelComponent,
    DepartmentColumnComponent,
    QuarterReviewComponent,
    ReviewerIntroComponent,
    RunOverComponent,
    ShopComponent,
  ],
  template: `
    <div class="h-screen flex flex-col overflow-hidden">
      <!-- Header -->
      <app-header
        [gold]="gameState.gold()"
        [completedCount]="gameState.completedCount()"
        [minionCount]="gameState.minions().length"
        [quarterProgress]="gameState.quarterProgress()"
        [quarterGold]="gameState.quarterGold()"
        [taskBudget]="gameState.currentQuarterTarget().taskBudget"
        [goldTarget]="gameState.isInReview() ? gameState.reviewGoldTarget() : gameState.currentQuarterTarget().goldTarget"
        [dismissalsRemaining]="gameState.dismissalsRemaining()"
        [lastSaved]="gameState.lastSaved()"
        [activeModifiers]="gameState.activeModifiers()"
        (reset)="onReset()" />

      <!-- Desktop layout (>= 768px) -->
      @if (!isMobile()) {
        <main class="flex-1 flex overflow-hidden">
          <!-- Left panel: Mission Board (fixed width) -->
          <div class="w-[300px] shrink-0 border-r border-border p-3 overflow-y-auto">
            <app-mission-board
              [missions]="gameState.backlog()"
              [schemesQueueFull]="gameState.departmentQueues().schemes.length >= gameState.deptQueueCapacity().schemes"
              [unlockedDepartments]="gameState.unlockedDepartmentList()"
              [departments]="gameState.departments()"
              [boardFrozen]="gameState.backlogFrozen()"
              [dismissalsRemaining]="gameState.dismissalsRemaining()"
              [tasksCompleted]="gameState.quarterProgress().tasksCompleted"
              [taskBudget]="gameState.currentQuarterTarget().taskBudget"
              [deckRemaining]="gameState.schemeDeck().length"
              [deckTotal]="gameState.currentQuarterTarget().taskBudget + 5"
              [deckTierCounts]="gameState.schemeDeckTierCounts()"
              [comboState]="gameState.comboState()"
              (missionAccepted)="onAcceptMission($event)"
              (schemeExecuted)="onSchemeExecuted($event)"
              (schemeDismissed)="onSchemeDismissed($event)" />
          </div>

          <!-- Center: Kanban work area -->
          <div class="flex-1 overflow-auto p-3">
            <app-kanban-board
              [departmentQueues]="gameState.departmentQueues()"
              [departments]="gameState.departments()"
              [minions]="gameState.minions()"
              [clickPower]="gameState.clickPower()"
              [boardFrozen]="gameState.backlogFrozen()"
              [unlockedDepartments]="gameState.unlockedDepartmentList()"
              [unassignedMinions]="gameState.unassignedMinions()"
              [activeBreakthroughs]="gameState.activeBreakthroughs()"
              [researchCompleted]="gameState.researchCompleted()"
              [breakthroughThreshold]="breakthroughThreshold()"
              [mayhemComboCount]="gameState.mayhemComboCount()"
              [deptEffectiveMults]="gameState.deptEffectiveMults()"
              [bossPenalty]="gameState.bossPenalty()"
              [deptQueueCapacity]="gameState.deptQueueCapacity()"
              (taskClicked)="onTaskClick($event)"
              (taskReordered)="onTaskReordered($event)"
              (minionRoleChanged)="onMinionRoleChanged($event)"
              (minionAssigned)="onMinionAssigned($event)"
              (minionUnassigned)="onMinionUnassigned($event)" />
          </div>
        </main>
      }

      <!-- Mobile layout (< 768px) -->
      @if (isMobile()) {
        <main class="flex-1 overflow-y-auto pb-16 px-3 py-3">
          @switch (mobileTab()) {
            @case ('missions') {
              <app-mission-board
                [missions]="gameState.backlog()"
                [schemesQueueFull]="gameState.departmentQueues().schemes.length >= gameState.deptQueueCapacity().schemes"
                [unlockedDepartments]="gameState.unlockedDepartmentList()"
                [departments]="gameState.departments()"
                [boardFrozen]="gameState.backlogFrozen()"
                [dismissalsRemaining]="gameState.dismissalsRemaining()"
                [tasksCompleted]="gameState.quarterProgress().tasksCompleted"
                [taskBudget]="gameState.currentQuarterTarget().taskBudget"
                [deckRemaining]="gameState.schemeDeck().length"
                [deckTotal]="gameState.currentQuarterTarget().taskBudget + 5"
                [deckTierCounts]="gameState.schemeDeckTierCounts()"
                (missionAccepted)="onAcceptMission($event)"
                (schemeExecuted)="onSchemeExecuted($event)"
                (schemeDismissed)="onSchemeDismissed($event)" />
            }
            @case ('work') {
              <!-- Department columns -->
              @if (gameState.unlockedDepartmentList().length === 0) {
                <div class="flex flex-col items-center justify-center h-full text-center p-8">
                  <span class="text-4xl mb-3 opacity-40">🔒</span>
                  <p class="text-sm text-text-muted">No departments unlocked yet.</p>
                  <p class="text-xs text-text-muted mt-1">Visit the Shop between quarters to unlock departments!</p>
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
                          [minionConnectedDropLists]="[]"
                          [dragDisabled]="true"
                          [fullWidth]="true"
                          [clickPower]="gameState.clickPower()"
                          [activeBreakthroughs]="gameState.activeBreakthroughs()"
                          [researchCompleted]="gameState.researchCompleted()"
                          [breakthroughThreshold]="breakthroughThreshold()"
                          [mayhemComboCount]="gameState.mayhemComboCount()"
                          [deptEffectiveMult]="gameState.deptEffectiveMults()[cat]"
                          [bossPenalty]="gameState.bossPenalty()"
                          [queueCapacity]="gameState.deptQueueCapacity()[cat]"
                          (taskClicked)="onTaskClick($event)"
                          (taskReordered)="onDeptTaskReordered(cat, $event)"
                          (minionRoleChanged)="onMinionRoleChanged($event)"
                          (minionUnassigned)="onMinionUnassigned($event)" />
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

                  <!-- Unassigned pool (mobile) -->
                  @if (gameState.unassignedMinions().length > 0) {
                    <div class="px-3 pb-2">
                      <div class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                        👾 Unassigned Pool ({{ gameState.unassignedMinions().length }})
                      </div>
                      @for (minion of gameState.unassignedMinions(); track minion.id) {
                        <div class="flex items-center justify-between gap-2 py-1.5 px-2 rounded bg-bg-card/30 border border-border/50 mb-1">
                          <div class="flex items-center gap-1.5 text-xs">
                            <span class="text-sm">{{ getArchetypeIcon(minion) }}</span>
                            <span class="text-text-primary font-semibold">{{ getArchetypeName(minion) }}</span>
                          </div>
                          <button
                            (click)="openMobileAssignPicker(minion)"
                            class="text-[10px] text-accent hover:text-gold cursor-pointer px-2 py-1 rounded
                                   border border-accent/20 hover:border-accent/40 transition-colors">
                            Assign...
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- Mobile assignment picker -->
              @if (assigningMinion(); as minion) {
                <div class="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" (click)="assigningMinion.set(null)">
                  <div class="bg-bg-secondary rounded-t-xl border border-border p-4 w-full max-w-md" (click)="$event.stopPropagation()">
                    <h4 class="text-sm font-bold text-text-primary mb-3">
                      Assign {{ getArchetypeName(minion) }} to:
                    </h4>
                    <div class="flex flex-col gap-2">
                      @for (cat of gameState.unlockedDepartmentList(); track cat) {
                        <button
                          (click)="onMobileAssign(minion.id, cat, 'worker')"
                          class="flex items-center gap-2 p-3 rounded-lg bg-bg-card border border-border
                                 hover:border-gold/50 transition-all cursor-pointer min-h-[44px]">
                          <span>{{ getCategoryIcon(cat) }}</span>
                          <span class="text-sm text-text-primary">{{ getCategoryLabel(cat) }} — Worker</span>
                        </button>
                      }
                    </div>
                    <button
                      (click)="assigningMinion.set(null)"
                      class="w-full mt-3 py-2 text-sm text-text-muted border border-border rounded-lg cursor-pointer
                             hover:text-text-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              }
            }
            @case ('more') {
              <div class="flex flex-col gap-2">
                <button
                  (click)="moreSection.set('departments')"
                  class="w-full flex items-center gap-3 p-4 rounded-lg bg-bg-card border border-border
                         hover:border-accent/30 transition-all cursor-pointer min-h-[48px]">
                  <span class="text-xl">🏛️</span>
                  <span class="text-sm font-semibold text-text-primary">Departments</span>
                  <span class="ml-auto text-text-muted">→</span>
                </button>
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
                    @case ('departments') {
                      <app-department-panel
                        [departments]="gameState.departments()" />
                    }
                  }
                </div>
              }
            }
          }
        </main>

        <app-mobile-bottom-nav
          [activeTab]="mobileTab()"
          (tabSelected)="onMobileTabChange($event)" />
      }

      <!-- Quarter Review Modal -->
      @if (latestQuarterResult(); as result) {
        <app-quarter-review
          [result]="result"
          [missedQuarters]="gameState.quarterProgress().missedQuarters"
          (advance)="onQuarterAdvance()" />
      }

      <!-- Shop Modal (between quarters) -->
      @if (gameState.showShop()) {
        <app-shop
          [vouchers]="gameState.ownedVouchers()"
          [gold]="gameState.gold()"
          [departments]="gameState.departments()"
          [unlockedDepartments]="gameState.unlockedDepartmentList()"
          [hireOptions]="hireOptionArchetypes()"
          [hireCost]="gameState.nextMinionCost()"
          [canHire]="gameState.canHireMinion()"
          [rerollCost]="gameState.rerollCost()"
          [minionCount]="gameState.minions().length"
          (purchase)="onVoucherPurchase($event)"
          (purchaseDeptLevel)="onPurchaseDeptLevel($event)"
          (purchaseWorkerSlot)="onPurchaseWorkerSlot($event)"
          (purchaseManagerSlot)="onPurchaseManagerSlot($event)"
          (hire)="onHireMinion($event)"
          (reroll)="onRerollHireOptions()"
          (continue)="onShopContinue()" />
      }

      <!-- Run Over Screen -->
      @if (gameState.isRunOver()) {
        <app-run-over
          [quarterResults]="gameState.quarterProgress().quarterResults"
          [totalGold]="gameState.totalGoldEarned()"
          [totalTasks]="gameState.completedCount()"
          (newRun)="onNewRun()" />
      }

      <!-- Reviewer Intro Modal (shown at Q4 start) -->
      @if (gameState.showReviewerIntro() && gameState.currentReviewer(); as reviewer) {
        <app-reviewer-intro
          [reviewer]="reviewer"
          [modifiers]="gameState.activeModifiers()"
          [goldTarget]="gameState.reviewGoldTarget()"
          (beginReview)="onBeginReview()" />
      }

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
  private readonly gameTimer = inject(GameTimerService);
  private readonly saveService = inject(SaveService);
  private readonly devConsole = inject(DevConsoleService);

  readonly deptSwipeContainer = viewChild<ElementRef>('deptSwipeContainer');

  readonly isMobile = signal(false);
  readonly mobileTab = signal<MobileTab>('missions');
  readonly mobileDeptTab = signal<TaskCategory>('schemes');
  readonly mobileDeptIndex = signal(0);
  readonly moreSection = signal<string | null>(null);
  readonly assigningMinion = signal<Minion | null>(null);

  private pausedAt: number | null = null;

  readonly allCategories: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];

  readonly latestQuarterResult = computed(() => {
    const qp = this.gameState.quarterProgress();
    if (!qp.isComplete) return null;
    if (this.gameState.showShop()) return null;
    if (this.gameState.showReviewerIntro()) return null;
    if (this.gameState.isRunOver()) return null;
    const results = qp.quarterResults;
    return results.length > 0 ? results[results.length - 1] : null;
  });

  readonly breakthroughThreshold = computed(() =>
    getBreakthroughThreshold(this.gameState.departments().research.level)
  );

  /** Resolve hire option IDs to archetype objects for the hire panel */
  readonly hireOptionArchetypes = computed(() =>
    this.gameState.hireOptions()
      .map(id => MINION_ARCHETYPES[id])
      .filter((a): a is MinionArchetype => !!a)
  );

  constructor() {
    // Pause game timers when a quarter completes (modal will block gameplay)
    effect(() => {
      if (this.gameState.quarterProgress().isComplete) {
        this.gameTimer.stop();
        this.pausedAt = Date.now();
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  ngOnInit(): void {
    this.isMobile.set(window.innerWidth < 768);
    this.devConsole.install();

    if (!this.saveService.load()) {
      this.gameState.initializeGame();
    }

    // Don't start timers if loading a save with a completed quarter (modal will show)
    if (!this.gameState.quarterProgress().isComplete) {
      this.gameTimer.start();
    }
  }

  ngOnDestroy(): void {
    this.gameTimer.stop();
  }

  onTaskClick(taskId: string): void {
    this.gameState.clickTask(taskId);
  }

  onSchemeDismissed(taskId: string): void {
    this.gameState.dismissScheme(taskId);
  }

  onMinionRoleChanged(event: { minionId: string; role: MinionRole }): void {
    this.gameState.assignMinionRole(event.minionId, event.role);
  }

  onAcceptMission(missionId: string): void {
    this.gameState.acceptMission(missionId);
  }

  onSchemeExecuted(missionId: string): void {
    this.gameState.routeMission(missionId, 'schemes');
  }

  onTaskReordered(event: { queue: QueueTarget; taskIds: string[] }): void {
    this.gameState.reorderQueue(event.queue, event.taskIds);
  }

  onDeptTaskReordered(cat: TaskCategory, taskIds: string[]): void {
    this.gameState.reorderQueue(cat, taskIds);
  }

  onHireMinion(archetypeId: string): void {
    this.gameState.hireMinion(archetypeId);
  }

  onRerollHireOptions(): void {
    this.gameState.rerollHireOptions();
  }

  onMinionAssigned(event: { minionId: string; department: TaskCategory; role: MinionRole }): void {
    this.gameState.assignMinionToDepartment(event.minionId, event.department, event.role);
  }

  onMinionUnassigned(minionId: string): void {
    this.gameState.unassignMinion(minionId);
  }

  openMobileAssignPicker(minion: Minion): void {
    this.assigningMinion.set(minion);
  }

  onMobileAssign(minionId: string, dept: TaskCategory, role: MinionRole): void {
    this.gameState.assignMinionToDepartment(minionId, dept, role);
    this.assigningMinion.set(null);
  }

  getArchetypeIcon(minion: Minion): string {
    return getMinionDisplay(minion).icon;
  }

  getArchetypeName(minion: Minion): string {
    return getMinionDisplay(minion).name;
  }

  onQuarterAdvance(): void {
    this.pausedAt = null;
    this.gameState.advanceQuarter();
    if (!this.gameState.showReviewerIntro() &&
        !this.gameState.isRunOver() && !this.gameState.showShop()) {
      this.gameTimer.restartTimers();
    }
  }

  onVoucherPurchase(id: VoucherId): void {
    this.gameState.purchaseVoucher(id);
  }

  onPurchaseDeptLevel(category: TaskCategory): void {
    this.gameState.purchaseDeptLevel(category);
  }

  onPurchaseWorkerSlot(category: TaskCategory): void {
    this.gameState.purchaseWorkerSlot(category);
  }

  onPurchaseManagerSlot(category: TaskCategory): void {
    this.gameState.purchaseManagerSlot(category);
  }

  onShopContinue(): void {
    this.gameState.continueAfterShop();
    if (!this.gameState.showReviewerIntro() && !this.gameState.isRunOver()) {
      this.gameTimer.restartTimers();
    }
  }

  onBeginReview(): void {
    this.gameState.dismissReviewerIntro();
    this.gameTimer.restartTimers();
  }

  onNewRun(): void {
    this.gameState.startNewRun();
    this.saveService.clearSave();
    this.gameTimer.restartTimers();
  }

  onReset(): void {
    this.gameState.resetGame();
    this.saveService.clearSave();
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
