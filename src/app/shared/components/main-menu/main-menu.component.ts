import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-bg-primary z-[80] flex items-center justify-center p-4"
         data-testid="main-menu">
      <div class="flex flex-col items-center gap-6 max-w-xs w-full">
        <!-- Title -->
        <div class="text-center">
          <h1 class="text-3xl sm:text-4xl font-display font-black text-gold uppercase tracking-widest leading-tight">
            Minion Manager
          </h1>
          <p class="text-sm text-text-muted mt-1">Corporate Villainy Simulator</p>
        </div>

        <!-- Infamy display -->
        @if (totalInfamy() > 0) {
          <div class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 bg-gold/5"
               data-testid="menu-infamy">
            <span class="text-lg">🏴</span>
            <span class="text-sm font-bold text-gold tabular-nums">{{ totalInfamy() }} Infamy</span>
          </div>
        }

        <!-- Buttons -->
        <div class="flex flex-col gap-3 w-full">
          @if (hasSave()) {
            <button
              (click)="continueGame.emit()"
              data-testid="menu-continue"
              class="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider
                     bg-accent/20 text-accent border border-accent/30
                     hover:bg-accent/30 active:scale-95
                     transition-all cursor-pointer min-h-[48px]">
              Continue Run
            </button>
          }

          <button
            (click)="newRun.emit()"
            data-testid="menu-new-run"
            class="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider
                   transition-all cursor-pointer min-h-[48px]"
            [class]="hasSave()
              ? 'bg-bg-card/50 text-text-secondary border border-border hover:bg-bg-card/80 active:scale-95'
              : 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 active:scale-95'">
            New Run
          </button>

          <button
            (click)="compendium.emit()"
            data-testid="menu-compendium"
            [disabled]="!hasDiscoveries()"
            class="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider
                   transition-all cursor-pointer min-h-[48px]
                   disabled:opacity-40 disabled:cursor-not-allowed"
            [class.bg-gold\/5]="hasDiscoveries()"
            [class.text-gold]="hasDiscoveries()"
            [class.border-gold\/30]="hasDiscoveries()"
            [class.border]="true"
            [class.hover\:bg-gold\/10]="hasDiscoveries()"
            [class.active\:scale-95]="hasDiscoveries()"
            [class.bg-bg-card\/30]="!hasDiscoveries()"
            [class.text-text-muted]="!hasDiscoveries()"
            [class.border-border]="!hasDiscoveries()">
            Compendium
          </button>

          <button
            (click)="options.emit()"
            data-testid="menu-options"
            class="w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider
                   bg-bg-card/30 text-text-muted border border-border
                   hover:bg-bg-card/50 active:scale-95
                   transition-all cursor-pointer min-h-[48px]">
            Options
          </button>
        </div>

        <!-- Version -->
        <p class="text-[10px] text-text-muted/50">v0.10</p>
      </div>
    </div>
  `,
  styles: `
    :host { display: contents; }
  `,
})
export class MainMenuComponent {
  hasSave = input(false);
  hasDiscoveries = input(false);
  totalInfamy = input(0);

  continueGame = output<void>();
  newRun = output<void>();
  compendium = output<void>();
  options = output<void>();
}
