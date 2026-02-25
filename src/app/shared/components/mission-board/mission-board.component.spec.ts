import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MissionBoardComponent } from './mission-board.component';
import {
  makeTask,
  makeCoverOpTask,
  makeBreakoutTask,
  makeSpecialOpTask,
} from '../../../../testing/factories/task.factory';

describe('MissionBoardComponent', () => {
  let fixture: ComponentFixture<MissionBoardComponent>;
  let component: MissionBoardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionBoardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MissionBoardComponent);
    component = fixture.componentInstance;
  });

  function setInputs(
    missions = [makeTask()],
    activeCount = 0,
    activeSlots = 3,
  ): void {
    fixture.componentRef.setInput('missions', missions);
    fixture.componentRef.setInput('activeCount', activeCount);
    fixture.componentRef.setInput('activeSlots', activeSlots);
    fixture.detectChanges();
  }

  it('renders mission cards from input', () => {
    const tasks = [
      makeTask({ template: { name: 'Task A', description: 'd', category: 'schemes', tier: 'petty' } }),
      makeTask({ template: { name: 'Task B', description: 'd', category: 'heists', tier: 'petty' } }),
      makeTask({ template: { name: 'Task C', description: 'd', category: 'mayhem', tier: 'petty' } }),
    ];
    setInputs(tasks);

    const cards = fixture.nativeElement.querySelectorAll('.game-card');
    expect(cards.length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Task A');
    expect(fixture.nativeElement.textContent).toContain('Task B');
    expect(fixture.nativeElement.textContent).toContain('Task C');
  });

  it('category filter tabs filter missions', () => {
    const tasks = [
      makeTask({ template: { name: 'Scheme1', description: 'd', category: 'schemes', tier: 'petty' } }),
      makeTask({ template: { name: 'Heist1', description: 'd', category: 'heists', tier: 'petty' } }),
    ];
    setInputs(tasks);

    // Click "Schemes" tab
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const schemesBtn = buttons.find((b: HTMLButtonElement) => b.textContent?.includes('Schemes'))!;
    schemesBtn.click();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.game-card');
    expect(cards.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Scheme1');
    expect(fixture.nativeElement.textContent).not.toContain('Heist1');
  });

  it('categoryCount returns correct counts', () => {
    const tasks = [
      makeTask({ template: { name: 'S1', description: 'd', category: 'schemes', tier: 'petty' } }),
      makeTask({ template: { name: 'S2', description: 'd', category: 'schemes', tier: 'petty' } }),
      makeTask({ template: { name: 'H1', description: 'd', category: 'heists', tier: 'petty' } }),
    ];
    setInputs(tasks);

    expect(component.categoryCount('schemes')).toBe(2);
    expect(component.categoryCount('heists')).toBe(1);
    expect(component.categoryCount('research')).toBe(0);
  });

  it('canAccept false when slots full', () => {
    setInputs([makeTask()], 3, 3);
    expect(component.canAccept()).toBe(false);
  });

  it('shows "Active slots full" text when slots full', () => {
    setInputs([makeTask()], 3, 3);
    expect(fixture.nativeElement.textContent).toContain('Active slots full');
  });

  it('click emits missionAccepted', () => {
    const task = makeTask();
    setInputs([task], 0, 3);

    const spy = jasmine.createSpy('missionAccepted');
    component.missionAccepted.subscribe(spy);

    const card: HTMLElement = fixture.nativeElement.querySelector('.game-card');
    card.click();

    expect(spy).toHaveBeenCalledWith(task.id);
  });

  it('does NOT emit when slots full', () => {
    const task = makeTask();
    setInputs([task], 3, 3);

    const spy = jasmine.createSpy('missionAccepted');
    component.missionAccepted.subscribe(spy);

    const card: HTMLElement = fixture.nativeElement.querySelector('.game-card');
    card.click();

    expect(spy).not.toHaveBeenCalled();
  });

  it('empty state when no missions', () => {
    setInputs([], 0, 3);
    expect(fixture.nativeElement.textContent).toContain('the underworld is quiet');
  });

  it('getMissionCardClass returns correct classes', () => {
    const breakout = makeBreakoutTask('m1');
    const special = makeSpecialOpTask();
    const cover = makeCoverOpTask();
    const normal = makeTask();

    expect(component.getMissionCardClass(breakout)).toContain('border-orange');
    expect(component.getMissionCardClass(breakout)).toContain('animate-card-glow');
    expect(component.getMissionCardClass(special)).toContain('border-gold');
    expect(component.getMissionCardClass(special)).toContain('animate-card-glow');
    expect(component.getMissionCardClass(cover)).toContain('border-green');
    expect(component.getMissionCardClass(normal)).toBe('');
  });

  it('getCategoryIcon maps correctly', () => {
    expect(component.getCategoryIcon('schemes')).toBe('\u{1F5DD}\uFE0F');
    expect(component.getCategoryIcon('heists')).toBe('\u{1F48E}');
    expect(component.getCategoryIcon('research')).toBe('\u{1F9EA}');
    expect(component.getCategoryIcon('mayhem')).toBe('\u{1F4A5}');
    expect(component.getCategoryIcon('other')).toBe('?');
  });
});
