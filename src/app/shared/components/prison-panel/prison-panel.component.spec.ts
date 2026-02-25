import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrisonPanelComponent } from './prison-panel.component';
import { makeCapturedMinion } from '../../../../testing/factories/minion.factory';
import { CapturedMinion } from '../../../core/models/minion.model';

describe('PrisonPanelComponent', () => {
  let fixture: ComponentFixture<PrisonPanelComponent>;
  let component: PrisonPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrisonPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrisonPanelComponent);
    component = fixture.componentInstance;
  });

  function setInputs(capturedMinions: CapturedMinion[] = [], currentTime = Date.now()): void {
    fixture.componentRef.setInput('capturedMinions', capturedMinions);
    fixture.componentRef.setInput('currentTime', currentTime);
    fixture.detectChanges();
  }

  it('empty state when no captured minions', () => {
    setInputs([]);
    expect(fixture.nativeElement.textContent).toContain('No captured minions.');
  });

  it('renders minion card with name, level, and specialty', () => {
    const captured = makeCapturedMinion({
      minion: {
        id: 'm1',
        name: 'Skulk',
        appearance: { color: '#6c3483', accessory: 'goggles' },
        status: 'idle',
        assignedTaskId: null,
        stats: { speed: 1.0, efficiency: 1.0 },
        specialty: 'heists',
        xp: 0,
        level: 5,
      },
    });
    setInputs([captured], captured.capturedAt);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Skulk');
    expect(text).toContain('Lv.5');
    expect(text).toContain('Heists');
  });

  it('formatCountdown returns correct time string', () => {
    const captured: CapturedMinion = {
      minion: {
        id: 'm1', name: 'X', appearance: { color: '#000', accessory: 'none' },
        status: 'idle', assignedTaskId: null, stats: { speed: 1, efficiency: 1 },
        specialty: 'schemes', xp: 0, level: 1,
      },
      capturedAt: 0,
      expiresAt: 300_000,
      rescueDifficulty: 1,
    };

    // Set currentTime to 150_000 → remaining 150s → 2:30
    fixture.componentRef.setInput('capturedMinions', [captured]);
    fixture.componentRef.setInput('currentTime', 150_000);
    fixture.detectChanges();

    expect(component.formatCountdown(captured)).toBe('2:30');

    // At expiry → 0:00
    fixture.componentRef.setInput('currentTime', 300_000);
    fixture.detectChanges();

    expect(component.formatCountdown(captured)).toBe('0:00');
  });

  it('getTimePercent returns correct values', () => {
    const captured: CapturedMinion = {
      minion: {
        id: 'm1', name: 'X', appearance: { color: '#000', accessory: 'none' },
        status: 'idle', assignedTaskId: null, stats: { speed: 1, efficiency: 1 },
        specialty: 'schemes', xp: 0, level: 1,
      },
      capturedAt: 0,
      expiresAt: 300_000,
      rescueDifficulty: 1,
    };

    // Midpoint
    fixture.componentRef.setInput('capturedMinions', [captured]);
    fixture.componentRef.setInput('currentTime', 150_000);
    fixture.detectChanges();
    expect(component.getTimePercent(captured)).toBe(50);

    // Expired
    fixture.componentRef.setInput('currentTime', 300_000);
    fixture.detectChanges();
    expect(component.getTimePercent(captured)).toBe(0);

    // Start
    fixture.componentRef.setInput('currentTime', 0);
    fixture.detectChanges();
    expect(component.getTimePercent(captured)).toBe(100);
  });

  it('urgency classes at thresholds', () => {
    const captured: CapturedMinion = {
      minion: {
        id: 'm1', name: 'X', appearance: { color: '#000', accessory: 'none' },
        status: 'idle', assignedTaskId: null, stats: { speed: 1, efficiency: 1 },
        specialty: 'schemes', xp: 0, level: 1,
      },
      capturedAt: 0,
      expiresAt: 100_000,
      rescueDifficulty: 1,
    };

    // >50% → yellow
    fixture.componentRef.setInput('capturedMinions', [captured]);
    fixture.componentRef.setInput('currentTime', 40_000); // 60% remaining
    fixture.detectChanges();
    expect(component.getUrgencyClasses(captured)).toContain('yellow');

    // 20–50% → orange
    fixture.componentRef.setInput('currentTime', 65_000); // 35% remaining
    fixture.detectChanges();
    expect(component.getUrgencyClasses(captured)).toContain('orange');

    // <20% → red+pulse
    fixture.componentRef.setInput('currentTime', 90_000); // 10% remaining
    fixture.detectChanges();
    const classes = component.getUrgencyClasses(captured);
    expect(classes).toContain('red');
    expect(classes).toContain('animate-pulse');
  });

  it('getAccessoryEmoji maps correctly', () => {
    expect(component.getAccessoryEmoji('goggles')).toBe('\u{1F97D}');
    expect(component.getAccessoryEmoji('helmet')).toBe('\u26D1\uFE0F');
    expect(component.getAccessoryEmoji('cape')).toBe('\u{1F9B9}');
    expect(component.getAccessoryEmoji('horns')).toBe('\u{1F608}');
    expect(component.getAccessoryEmoji('none')).toBe('\u{1F47E}');
  });

  it('getSpecialtyLabel capitalizes first letter', () => {
    expect(component.getSpecialtyLabel('schemes')).toBe('Schemes');
    expect(component.getSpecialtyLabel('heists')).toBe('Heists');
    expect(component.getSpecialtyLabel('research')).toBe('Research');
    expect(component.getSpecialtyLabel('mayhem')).toBe('Mayhem');
  });
});
