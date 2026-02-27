import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CapturedMinion } from '../../../core/models/minion.model';

@Component({
  selector: 'app-prison-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-bold text-text-primary font-display uppercase tracking-wider">
        Prison
      </h2>

      @if (capturedMinions().length === 0) {
        <div class="game-card p-6 text-center">
          <p class="text-text-muted text-sm">No captured minions.</p>
        </div>
      } @else {
        <p class="text-xs text-text-muted">
          Break them out before time runs out or they're gone for good!
        </p>
        <div class="flex flex-col gap-2">
          @for (captured of capturedMinions(); track captured.minion.id) {
            <div
              class="game-card p-3 border-l-4 transition-colors"
              [class]="getUrgencyClasses(captured)">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    [style.background-color]="captured.minion.appearance.color">
                    {{ getAccessoryEmoji(captured.minion.appearance.accessory) }}
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-text-primary">
                      {{ captured.minion.name }}
                    </span>
                    <span class="text-xs text-text-muted ml-1">Lv.{{ captured.minion.level }}</span>
                  </div>
                  <span class="px-1 rounded text-xs" [class]="getSpecialtyClasses(captured.minion.specialty)">
                    {{ getSpecialtyLabel(captured.minion.specialty) }}
                  </span>
                </div>
              </div>

              <!-- Countdown -->
              <div class="flex items-center justify-between mt-1">
                <span class="text-xs text-text-secondary">Time remaining:</span>
                <span class="text-sm font-bold tabular-nums" [class]="getTimerTextClass(captured)">
                  {{ formatCountdown(captured) }}
                </span>
              </div>

              <!-- Timer bar -->
              <div class="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-1000"
                  [class]="getTimerBarClass(captured)"
                  [style.width.%]="getTimePercent(captured)">
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class PrisonPanelComponent {
  capturedMinions = input.required<CapturedMinion[]>();
  currentTime = input.required<number>();

  getUrgencyClasses(captured: CapturedMinion): string {
    const pct = this.getTimePercent(captured);
    if (pct > 50) return 'border-yellow-500/60';
    if (pct > 20) return 'border-orange-500/60';
    return 'border-red-500/80 animate-pulse';
  }

  getTimerTextClass(captured: CapturedMinion): string {
    const pct = this.getTimePercent(captured);
    if (pct > 50) return 'text-yellow-400';
    if (pct > 20) return 'text-orange-400';
    return 'text-red-400';
  }

  getTimerBarClass(captured: CapturedMinion): string {
    const pct = this.getTimePercent(captured);
    if (pct > 50) return 'bg-yellow-500';
    if (pct > 20) return 'bg-orange-500';
    return 'bg-red-500';
  }

  getTimePercent(captured: CapturedMinion): number {
    const total = captured.expiresAt - captured.capturedAt;
    const remaining = Math.max(0, captured.expiresAt - this.currentTime());
    return (remaining / total) * 100;
  }

  formatCountdown(captured: CapturedMinion): string {
    const remaining = Math.max(0, captured.expiresAt - this.currentTime());
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getAccessoryEmoji(accessory: string): string {
    switch (accessory) {
      case 'goggles': return '🥽';
      case 'helmet': return '⛑️';
      case 'cape': return '🦹';
      case 'horns': return '😈';
      default: return '👾';
    }
  }

  getSpecialtyClasses(specialty: string): string {
    switch (specialty) {
      case 'schemes': return 'bg-purple-500/20 text-purple-400';
      case 'heists': return 'bg-blue-500/20 text-blue-400';
      case 'research': return 'bg-green-500/20 text-green-400';
      case 'mayhem': return 'bg-red-500/20 text-red-400';
      default: return '';
    }
  }

  getSpecialtyLabel(specialty: string): string {
    return specialty.charAt(0).toUpperCase() + specialty.slice(1);
  }
}
