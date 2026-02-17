import { Injectable, OnDestroy, inject } from '@angular/core';
import { GameStateService } from './game-state.service';

@Injectable({ providedIn: 'root' })
export class TimerService implements OnDestroy {
  private readonly gameState = inject(GameStateService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.gameState.tickTime();
    }, 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
