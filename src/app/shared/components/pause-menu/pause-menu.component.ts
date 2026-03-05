import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-pause-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-black/70 z-[75] flex items-center justify-center"
         data-testid="pause-menu">
      <div class="bg-bg-secondary rounded-xl border border-border p-6 w-full max-w-xs shadow-2xl">
        <h2 class="text-xl font-display font-black text-text-primary uppercase tracking-widest text-center mb-6">
          Paused
        </h2>

        <div class="flex flex-col gap-3">
          <!-- Resume -->
          <button
            (click)="resume.emit()"
            data-testid="pause-resume"
            class="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider
                   bg-accent/20 text-accent border border-accent/30
                   hover:bg-accent/30 active:scale-95
                   transition-all cursor-pointer min-h-[44px]">
            Resume
          </button>

          <!-- Sound toggle -->
          <div class="flex items-center justify-between p-3 rounded-lg bg-bg-card/50 border border-border">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ soundEnabled() ? '🔊' : '🔇' }}</span>
              <span class="text-sm font-bold text-text-primary">Sound</span>
            </div>
            <button
              (click)="toggleSound.emit()"
              data-testid="pause-sound-toggle"
              class="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider
                     border cursor-pointer transition-all min-h-[36px]"
              [class]="soundEnabled()
                ? 'bg-accent/20 text-accent border-accent/30 hover:bg-accent/30'
                : 'bg-bg-card text-text-muted border-border hover:bg-bg-card/80'">
              {{ soundEnabled() ? 'On' : 'Off' }}
            </button>
          </div>

          <!-- Abandon Run -->
          @if (!confirmAbandon()) {
            <button
              (click)="confirmAbandon.set(true)"
              data-testid="pause-abandon"
              class="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider
                     bg-red-500/10 text-red-400 border border-red-500/30
                     hover:bg-red-500/20 active:scale-95
                     transition-all cursor-pointer min-h-[44px]">
              Abandon Run
            </button>
          } @else {
            <div class="p-3 rounded-lg bg-bg-card/50 border border-red-500/30 text-center">
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
                  data-testid="pause-abandon-confirm"
                  class="flex-1 py-2 rounded text-xs font-bold uppercase
                         bg-red-500/20 text-red-400 border border-red-500/30
                         hover:bg-red-500/30 cursor-pointer min-h-[36px]">
                  Confirm
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: contents; }
  `,
})
export class PauseMenuComponent {
  soundEnabled = input(true);

  resume = output<void>();
  toggleSound = output<void>();
  abandonRun = output<void>();

  confirmAbandon = signal(false);
}
