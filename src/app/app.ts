import { Component } from '@angular/core';
import { GameContainerComponent } from './features/game/game-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameContainerComponent],
  template: `<app-game-container />`,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
  `,
})
export class App {}
