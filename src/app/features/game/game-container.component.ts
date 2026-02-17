import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { GameStateService } from '../../core/services/game-state.service';
import { TimerService } from '../../core/services/timer.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { TaskQueueComponent } from '../../shared/components/task-queue/task-queue.component';
import { MinionRosterComponent } from '../../shared/components/minion-roster/minion-roster.component';
import { HireMinionPanelComponent } from '../../shared/components/hire-minion-panel/hire-minion-panel.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-game-container',
  standalone: true,
  imports: [
    HeaderComponent,
    TaskQueueComponent,
    MinionRosterComponent,
    HireMinionPanelComponent,
    NotificationToastComponent,
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <app-header
        [gold]="gameState.gold()"
        [completedCount]="gameState.completedCount()"
        [minionCount]="gameState.minions().length"
        (reset)="onReset()" />

      <!-- Main content -->
      <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Task Queue (main area) -->
          <div class="lg:col-span-2">
            <app-task-queue
              [tasks]="gameState.taskQueue()"
              (taskClicked)="onTaskClick($event)" />
          </div>

          <!-- Sidebar -->
          <div class="flex flex-col gap-6">
            <app-hire-minion-panel
              [gold]="gameState.gold()"
              [cost]="gameState.nextMinionCost()"
              [minionCount]="gameState.minions().length"
              [canHire]="gameState.canHireMinion()"
              (hire)="onHireMinion()" />

            <app-minion-roster
              [minions]="gameState.minions()" />
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

  ngOnInit(): void {
    this.gameState.initializeGame();
    this.timer.start();
  }

  ngOnDestroy(): void {
    this.timer.stop();
  }

  onTaskClick(taskId: string): void {
    this.gameState.clickTask(taskId);
  }

  onHireMinion(): void {
    this.gameState.hireMinion();
  }

  onReset(): void {
    this.gameState.resetGame();
  }
}
