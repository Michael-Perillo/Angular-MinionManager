import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { STORAGE_BACKEND, StorageBackend } from './core/services/storage-backend';

class MockStorage implements StorageBackend {
  private store = new Map<string, string>();
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, value); }
  removeItem(key: string): void { this.store.delete(key); }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: STORAGE_BACKEND, useValue: new MockStorage() }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the main menu on boot', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="main-menu"]')).toBeTruthy();
  });

  it('should show game container after clicking New Run', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // Click New Run
    const newRunBtn = compiled.querySelector('[data-testid="menu-new-run"]') as HTMLButtonElement;
    expect(newRunBtn).toBeTruthy();
    newRunBtn.click();
    fixture.detectChanges();

    expect(compiled.querySelector('app-game-container')).toBeTruthy();
  });
});
