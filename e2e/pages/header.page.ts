import { Page } from '@playwright/test';

const EMOJI_MAP: Record<string, string> = {
  gold: '🪙',
  completed: '✅',
  minions: '👾',
  notoriety: '🔥',
  supplies: '⚗️',
  intel: '🕵️',
};

export class HeaderPage {
  constructor(private page: Page) {}

  async getStat(label: string): Promise<number> {
    const emoji = EMOJI_MAP[label.toLowerCase()];
    if (!emoji) return 0;

    const value = await this.page.locator('app-header').evaluate((header, e) => {
      const spans = header.querySelectorAll('span');
      for (let i = 0; i < spans.length; i++) {
        if (spans[i].textContent?.trim() === e) {
          const valueSpan = spans[i].nextElementSibling;
          if (valueSpan) {
            const text = valueSpan.textContent?.trim() ?? '0';
            return text.split('/')[0];
          }
        }
      }
      return '0';
    }, emoji);

    return parseInt(value, 10);
  }

  get gold(): Promise<number> {
    return this.getStat('Gold');
  }

  get minions(): Promise<number> {
    return this.getStat('Minions');
  }

  get notoriety(): Promise<number> {
    return this.getStat('Notoriety');
  }

  get completed(): Promise<number> {
    return this.getStat('Completed');
  }
}
