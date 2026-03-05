import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-options-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-bg-primary z-[80] flex flex-col overflow-hidden"
         data-testid="options-menu">
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-secondary/50">
        <button
          (click)="back.emit()"
          data-testid="options-back"
          class="text-sm text-text-muted hover:text-text-primary cursor-pointer transition-colors min-h-[44px] px-2">
          ← Back
        </button>
        <h1 class="text-lg font-display font-black text-text-primary uppercase tracking-widest">Options</h1>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="max-w-md mx-auto space-y-4">
          <!-- Sound toggle -->
          <div class="flex items-center justify-between p-4 rounded-lg bg-bg-card/50 border border-border">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ soundEnabled() ? '🔊' : '🔇' }}</span>
              <span class="text-sm font-bold text-text-primary">Sound</span>
            </div>
            <button
              (click)="toggleSound.emit()"
              data-testid="options-sound-toggle"
              class="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider
                     border cursor-pointer transition-all min-h-[36px]"
              [class]="soundEnabled()
                ? 'bg-accent/20 text-accent border-accent/30 hover:bg-accent/30'
                : 'bg-bg-card text-text-muted border-border hover:bg-bg-card/80'">
              {{ soundEnabled() ? 'On' : 'Off' }}
            </button>
          </div>

          <!-- Abandon Run -->
          @if (hasActiveSave()) {
            <div class="p-4 rounded-lg bg-bg-card/50 border border-border">
              @if (!confirmAbandon()) {
                <button
                  (click)="confirmAbandon.set(true)"
                  data-testid="options-abandon"
                  class="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider
                         bg-red-500/10 text-red-400 border border-red-500/30
                         hover:bg-red-500/20 active:scale-95
                         transition-all cursor-pointer min-h-[44px]">
                  Abandon Run
                </button>
              } @else {
                <div class="text-center">
                  <p class="text-xs text-red-400 mb-3">Are you sure? Current run progress will be lost.</p>
                  <div class="flex gap-2">
                    <button
                      (click)="confirmAbandon.set(false)"
                      class="flex-1 py-2 rounded text-xs font-bold uppercase
                             bg-bg-card text-text-muted border border-border
                             hover:bg-bg-card/80 cursor-pointer min-h-[36px]">
                      Cancel
                    </button>
                    <button
                      (click)="abandonRun.emit(); confirmAbandon.set(false)"
                      data-testid="options-abandon-confirm"
                      class="flex-1 py-2 rounded text-xs font-bold uppercase
                             bg-red-500/20 text-red-400 border border-red-500/30
                             hover:bg-red-500/30 cursor-pointer min-h-[36px]">
                      Confirm
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Reset All Progress -->
          <div class="p-4 rounded-lg bg-bg-card/50 border border-red-500/20">
            @if (!confirmReset()) {
              <button
                (click)="confirmReset.set(true)"
                data-testid="options-reset-all"
                class="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider
                       bg-red-500/10 text-red-400 border border-red-500/30
                       hover:bg-red-500/20 active:scale-95
                       transition-all cursor-pointer min-h-[44px]">
                Reset All Progress
              </button>
            } @else {
              <div class="text-center">
                <p class="text-xs text-red-400 font-bold mb-1">This cannot be undone!</p>
                <p class="text-[10px] text-text-muted mb-3">All runs, Infamy, and Compendium data will be permanently deleted.</p>
                <div class="flex gap-2">
                  <button
                    (click)="confirmReset.set(false)"
                    class="flex-1 py-2 rounded text-xs font-bold uppercase
                           bg-bg-card text-text-muted border border-border
                           hover:bg-bg-card/80 cursor-pointer min-h-[36px]">
                    Cancel
                  </button>
                  <button
                    (click)="resetAll.emit(); confirmReset.set(false)"
                    data-testid="options-reset-confirm"
                    class="flex-1 py-2 rounded text-xs font-bold uppercase
                           bg-red-500/30 text-red-300 border border-red-500/40
                           hover:bg-red-500/40 cursor-pointer min-h-[36px]">
                    Delete Everything
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: contents; }
  `,
})
export class OptionsMenuComponent {
  soundEnabled = input(true);
  hasActiveSave = input(false);

  back = output<void>();
  toggleSound = output<void>();
  abandonRun = output<void>();
  resetAll = output<void>();

  confirmAbandon = signal(false);
  confirmReset = signal(false);
}
