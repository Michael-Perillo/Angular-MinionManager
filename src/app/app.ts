import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { GameContainerComponent } from './features/game/game-container.component';
import { MainMenuComponent } from './shared/components/main-menu/main-menu.component';
import { RunSummaryComponent } from './shared/components/run-summary/run-summary.component';
import { CompendiumComponent } from './shared/components/compendium/compendium.component';
import { OptionsMenuComponent } from './shared/components/options-menu/options-menu.component';
import { MetaService } from './core/services/meta.service';
import { SaveService } from './core/services/save.service';
import { GameStateService } from './core/services/game-state.service';
import { GameTimerService } from './core/services/game-timer.service';
import { AppPhase, RunSummary, DiscoveredItems, CompendiumData } from './core/models/meta.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    GameContainerComponent,
    MainMenuComponent,
    RunSummaryComponent,
    CompendiumComponent,
    OptionsMenuComponent,
  ],
  template: `
    @switch (phase()) {
      @case ('menu') {
        <app-main-menu
          [hasSave]="hasSave()"
          [hasDiscoveries]="meta.hasDiscoveries()"
          [totalInfamy]="meta.totalInfamy()"
          (continueGame)="onContinue()"
          (newRun)="onNewRun()"
          (compendium)="menuSubView.set('compendium')"
          (options)="menuSubView.set('options')" />

        @if (menuSubView() === 'compendium') {
          <app-compendium
            [compendium]="meta.compendium()"
            (back)="menuSubView.set('none')" />
        }

        @if (menuSubView() === 'options') {
          <app-options-menu
            [soundEnabled]="meta.soundEnabled()"
            [hasActiveSave]="hasSave()"
            (back)="menuSubView.set('none')"
            (toggleSound)="meta.toggleSound()"
            (abandonRun)="onAbandonRun()"
            (resetAll)="onResetAll()" />
        }
      }

      @case ('playing') {
        <app-game-container
          (runEnded)="onRunEnded($event)"
          (abandonRun)="onAbandonRun()" />
      }

      @case ('run-summary') {
        @if (lastRunSummary(); as summary) {
          <app-run-summary
            [summary]="summary"
            [newDiscoveries]="lastNewDiscoveries()"
            (returnToMenu)="onReturnToMenu()" />
        }
      }
    }
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
  `,
})
export class App implements OnInit {
  readonly meta = inject(MetaService);
  private readonly saveService = inject(SaveService);
  private readonly gameState = inject(GameStateService);
  private readonly gameTimer = inject(GameTimerService);

  readonly phase = signal<AppPhase>('menu');
  readonly menuSubView = signal<'none' | 'compendium' | 'options'>('none');
  readonly lastRunSummary = signal<RunSummary | null>(null);
  readonly lastNewDiscoveries = signal<{ archetypes: number; tasks: number; reviewers: number; modifiers: number }>({
    archetypes: 0, tasks: 0, reviewers: 0, modifiers: 0,
  });
  readonly hasSave = signal(false);

  ngOnInit(): void {
    this.meta.load();
    this.hasSave.set(this.saveService.hasSave());
  }

  onContinue(): void {
    this.menuSubView.set('none');
    this.phase.set('playing');
  }

  onNewRun(): void {
    this.menuSubView.set('none');
    this.saveService.clearSave();
    this.gameState.initializeGame();
    this.phase.set('playing');
  }

  onRunEnded(event: { summary: RunSummary; discovered: DiscoveredItems }): void {
    // Count new discoveries (items not yet in compendium)
    const comp = this.meta.compendium();
    const newDiscoveries = {
      archetypes: event.discovered.archetypes.filter(a => !comp.seenArchetypes.includes(a)).length,
      tasks: event.discovered.tasks.filter(t => !comp.seenTasks.includes(t)).length,
      reviewers: event.discovered.reviewers.filter(r => !comp.seenReviewers.includes(r)).length,
      modifiers: event.discovered.modifiers.filter(m => !comp.seenModifiers.includes(m)).length,
    };

    // Record run in meta-progression
    this.meta.recordRun(event.summary, event.discovered);

    // Clear run save
    this.saveService.clearSave();
    this.hasSave.set(false);

    // Show run summary
    this.lastRunSummary.set(event.summary);
    this.lastNewDiscoveries.set(newDiscoveries);
    this.phase.set('run-summary');
  }

  onReturnToMenu(): void {
    this.lastRunSummary.set(null);
    this.phase.set('menu');
  }

  onAbandonRun(): void {
    this.gameTimer.stop();
    this.gameState.initializeGame();
    this.saveService.clearSave();
    this.hasSave.set(false);
    this.menuSubView.set('none');
    this.phase.set('menu');
  }

  onResetAll(): void {
    this.gameTimer.stop();
    this.gameState.initializeGame();
    this.saveService.clearSave();
    this.meta.resetAllProgress();
    this.hasSave.set(false);
    this.menuSubView.set('none');
  }
}
