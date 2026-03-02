import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MissionBoardComponent } from './mission-board.component';
import {
  makeTask,
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

    // Click the schemes icon filter button
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    // The filter buttons have emoji icons; find the one that sets filter to 'schemes'
    component.filterCategory.set('schemes');
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

  it('shows "Queue slots full" text when slots full', () => {
    setInputs([makeTask()], 3, 3);
    expect(fixture.nativeElement.textContent).toContain('Queue slots full');
  });

  it('shows Send to Queue button when slots available', () => {
    setInputs([makeTask()], 0, 3);
    expect(fixture.nativeElement.textContent).toContain('Send to Queue');
  });

  it('Send to Queue button emits missionRouteRequested', () => {
    const task = makeTask();
    setInputs([task], 0, 3);

    const spy = jasmine.createSpy('missionRouteRequested');
    component.missionRouteRequested.subscribe(spy);

    // Find the "Send to Queue" button by text content
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const sendBtn = buttons.find(b => b.textContent?.includes('Send to Queue'));
    expect(sendBtn).toBeTruthy();
    sendBtn!.click();

    expect(spy).toHaveBeenCalledWith(task);
  });

  it('does NOT show Send to Queue when slots full', () => {
    const task = makeTask();
    setInputs([task], 3, 3);

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const sendBtns = buttons.filter(b => b.textContent?.includes('Send to Queue'));
    expect(sendBtns.length).toBe(0);
  });

  it('empty state when no missions', () => {
    setInputs([], 0, 3);
    expect(fixture.nativeElement.textContent).toContain('No missions available');
  });

  it('getMissionCardClass returns correct classes', () => {
    const special = makeSpecialOpTask();
    const normal = makeTask();

    expect(component.getMissionCardClass(special)).toContain('border-gold');
    expect(component.getMissionCardClass(special)).toContain('animate-card-glow');
    expect(component.getMissionCardClass(normal)).toBe('');
  });

  it('getCategoryIcon maps correctly', () => {
    expect(component.getCategoryIcon('schemes')).toBe('\u{1F5DD}\uFE0F');
    expect(component.getCategoryIcon('heists')).toBe('\u{1F48E}');
    expect(component.getCategoryIcon('research')).toBe('\u{1F9EA}');
    expect(component.getCategoryIcon('mayhem')).toBe('\u{1F4A5}');
    expect(component.getCategoryIcon('other')).toBe('?');
  });

  it('has cdkDropList with id="mission-board"', () => {
    setInputs();
    const dropList = fixture.nativeElement.querySelector('[id="mission-board"]');
    expect(dropList).toBeTruthy();
  });

  it('mission cards have cdkDrag attribute', () => {
    setInputs([makeTask()]);
    const dragItems = fixture.nativeElement.querySelectorAll('[cdkDrag]');
    expect(dragItems.length).toBeGreaterThanOrEqual(1);
  });

  it('accepts connectedDropLists input', () => {
    fixture.componentRef.setInput('missions', [makeTask()]);
    fixture.componentRef.setInput('activeCount', 0);
    fixture.componentRef.setInput('activeSlots', 3);
    fixture.componentRef.setInput('connectedDropLists', ['schemes', 'heists', 'player']);
    fixture.detectChanges();

    expect(component.connectedDropLists()).toEqual(['schemes', 'heists', 'player']);
  });

  it('defaults connectedDropLists to empty array', () => {
    setInputs();
    expect(component.connectedDropLists()).toEqual([]);
  });

  // ─── Phase 3A: Mission Board Sorting ──────────

  describe('sort mode cycling', () => {
    it('should start with default sort mode', () => {
      setInputs();
      expect(component.sortMode()).toBe('default');
    });

    it('should cycle through all 4 sort modes', () => {
      setInputs();
      expect(component.sortMode()).toBe('default');

      component.cycleSort();
      expect(component.sortMode()).toBe('tier');

      component.cycleSort();
      expect(component.sortMode()).toBe('gold');

      component.cycleSort();
      expect(component.sortMode()).toBe('clicks');

      component.cycleSort();
      expect(component.sortMode()).toBe('default'); // wraps around
    });

    it('should return correct sort labels', () => {
      setInputs();
      expect(component.sortLabel()).toBe('Default');

      component.cycleSort();
      expect(component.sortLabel()).toBe('Tier');

      component.cycleSort();
      expect(component.sortLabel()).toBe('Gold');

      component.cycleSort();
      expect(component.sortLabel()).toBe('Clicks');
    });

    it('should return correct sort icons', () => {
      setInputs();
      expect(component.sortIcon()).toBe('↕');

      component.cycleSort();
      expect(component.sortIcon()).toBe('⭐');

      component.cycleSort();
      expect(component.sortIcon()).toBe('🪙');

      component.cycleSort();
      expect(component.sortIcon()).toBe('👆');
    });
  });

  describe('filteredMissions sorting', () => {
    const sortTasks = [
      makeTask({
        tier: 'petty',
        goldReward: 10,
        clicksRequired: 30,
        template: { name: 'Petty Task', description: 'd', category: 'schemes', tier: 'petty' },
      }),
      makeTask({
        tier: 'legendary',
        goldReward: 500,
        clicksRequired: 5,
        template: { name: 'Legend Task', description: 'd', category: 'heists', tier: 'legendary' },
      }),
      makeTask({
        tier: 'sinister',
        goldReward: 50,
        clicksRequired: 15,
        template: { name: 'Sinister Task', description: 'd', category: 'research', tier: 'sinister' },
      }),
      makeTask({
        tier: 'diabolical',
        goldReward: 200,
        clicksRequired: 10,
        template: { name: 'Diabolical Task', description: 'd', category: 'mayhem', tier: 'diabolical' },
      }),
    ];

    it('should not sort in default mode (preserve original order)', () => {
      setInputs(sortTasks);
      expect(component.sortMode()).toBe('default');
      const result = component.filteredMissions();
      expect(result[0].template.name).toBe('Petty Task');
      expect(result[1].template.name).toBe('Legend Task');
      expect(result[2].template.name).toBe('Sinister Task');
      expect(result[3].template.name).toBe('Diabolical Task');
    });

    it('should sort by tier descending (legendary first)', () => {
      setInputs(sortTasks);
      component.cycleSort(); // → tier
      expect(component.sortMode()).toBe('tier');

      const result = component.filteredMissions();
      expect(result[0].tier).toBe('legendary');
      expect(result[1].tier).toBe('diabolical');
      expect(result[2].tier).toBe('sinister');
      expect(result[3].tier).toBe('petty');
    });

    it('should sort by gold descending (highest first)', () => {
      setInputs(sortTasks);
      component.cycleSort(); // → tier
      component.cycleSort(); // → gold
      expect(component.sortMode()).toBe('gold');

      const result = component.filteredMissions();
      expect(result[0].goldReward).toBe(500);
      expect(result[1].goldReward).toBe(200);
      expect(result[2].goldReward).toBe(50);
      expect(result[3].goldReward).toBe(10);
    });

    it('should sort by clicks ascending (fewest first)', () => {
      setInputs(sortTasks);
      component.cycleSort(); // → tier
      component.cycleSort(); // → gold
      component.cycleSort(); // → clicks
      expect(component.sortMode()).toBe('clicks');

      const result = component.filteredMissions();
      expect(result[0].clicksRequired).toBe(5);
      expect(result[1].clicksRequired).toBe(10);
      expect(result[2].clicksRequired).toBe(15);
      expect(result[3].clicksRequired).toBe(30);
    });

    it('should combine filter and sort correctly', () => {
      setInputs(sortTasks);
      component.filterCategory.set('schemes');
      component.cycleSort(); // → tier

      const result = component.filteredMissions();
      expect(result.length).toBe(1);
      expect(result[0].template.category).toBe('schemes');
    });
  });

  describe('sort button in template', () => {
    it('should render the sort button', () => {
      setInputs([makeTask()]);
      const buttons: HTMLButtonElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('button')
      );
      const sortBtn = buttons.find(b => b.textContent?.includes('Default'));
      expect(sortBtn).toBeTruthy();
    });

    it('should cycle sort on button click', () => {
      setInputs([makeTask()]);
      const buttons: HTMLButtonElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('button')
      );
      const sortBtn = buttons.find(b => b.textContent?.includes('Default'));
      expect(sortBtn).toBeTruthy();

      sortBtn!.click();
      fixture.detectChanges();

      expect(component.sortMode()).toBe('tier');
      const updatedBtns: HTMLButtonElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('button')
      );
      const tierBtn = updatedBtns.find(b => b.textContent?.includes('Tier'));
      expect(tierBtn).toBeTruthy();
    });
  });
});
