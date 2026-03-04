import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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
    schemesQueueFull = false,
  ): void {
    fixture.componentRef.setInput('missions', missions);
    fixture.componentRef.setInput('schemesQueueFull', schemesQueueFull);
    fixture.detectChanges();
  }

  it('renders mission cards from input', () => {
    const tasks = [
      makeTask({ template: { name: 'Task A', description: 'd', category: 'schemes', tier: 'petty' }, schemeTargetDept: 'heists' }),
      makeTask({ template: { name: 'Task B', description: 'd', category: 'heists', tier: 'petty' }, schemeTargetDept: 'research' }),
      makeTask({ template: { name: 'Task C', description: 'd', category: 'mayhem', tier: 'petty' }, schemeTargetDept: 'mayhem' }),
    ];
    setInputs(tasks);

    const cards = fixture.nativeElement.querySelectorAll('.game-card');
    expect(cards.length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Task A');
    expect(fixture.nativeElement.textContent).toContain('Task B');
    expect(fixture.nativeElement.textContent).toContain('Task C');
  });

  it('category filter tabs filter by target dept', () => {
    const tasks = [
      makeTask({ template: { name: 'HeistScheme', description: 'd', category: 'schemes', tier: 'petty' }, schemeTargetDept: 'heists', schemeOperationCount: 2 }),
      makeTask({ template: { name: 'ResearchScheme', description: 'd', category: 'schemes', tier: 'petty' }, schemeTargetDept: 'research', schemeOperationCount: 1 }),
    ];
    setInputs(tasks);

    // Filter by target dept 'heists'
    component.filterCategory.set('heists');
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.game-card');
    expect(cards.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('HeistScheme');
    expect(fixture.nativeElement.textContent).not.toContain('ResearchScheme');
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

  it('canAccept false when schemes queue full', () => {
    setInputs([makeTask()], true);
    expect(component.canAccept()).toBe(false);
  });

  it('canAccept true when boardFrozen but queue not full (Intel Blackout does not block execution)', () => {
    fixture.componentRef.setInput('missions', [makeTask()]);
    fixture.componentRef.setInput('schemesQueueFull', false);
    fixture.componentRef.setInput('boardFrozen', true);
    fixture.detectChanges();
    expect(component.canAccept()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Execute');
  });

  it('shows "Schemes queue full" text when queue full', () => {
    setInputs([makeTask()], true);
    expect(fixture.nativeElement.textContent).toContain('Schemes queue full');
  });

  it('shows Execute button when queue not full', () => {
    setInputs([makeTask()], false);
    expect(fixture.nativeElement.textContent).toContain('Execute');
  });

  it('Execute button emits schemeExecuted with mission id', fakeAsync(() => {
    const task = makeTask();
    setInputs([task], false);

    const spy = jasmine.createSpy('schemeExecuted');
    component.schemeExecuted.subscribe(spy);

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const execBtn = buttons.find(b => b.textContent?.includes('Execute'));
    expect(execBtn).toBeTruthy();
    execBtn!.click();

    tick(350); // Wait for exit animation delay
    expect(spy).toHaveBeenCalledWith(task.id);
  }));

  it('does NOT show Execute when queue full', () => {
    const task = makeTask();
    setInputs([task], true);

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const execBtns = buttons.filter(b => b.textContent?.includes('Execute'));
    expect(execBtns.length).toBe(0);
  });

  it('empty state when no missions', () => {
    setInputs([], false);
    expect(fixture.nativeElement.textContent).toContain('Deck empty');
  });

  it('heading says "Backlog"', () => {
    setInputs();
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading.textContent.trim()).toBe('Backlog');
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

  it('getTargetDept reads schemeTargetDept from task', () => {
    const task = makeTask({ schemeTargetDept: 'heists' });
    expect(component.getTargetDept(task)).toBe('heists');
  });

  it('getOpCount reads schemeOperationCount from task', () => {
    const task = makeTask({ schemeOperationCount: 3 });
    expect(component.getOpCount(task)).toBe(3);
  });

  it('getTargetDeptLabel capitalizes dept name', () => {
    const task = makeTask({ schemeTargetDept: 'research' });
    expect(component.getTargetDeptLabel(task)).toBe('Research');
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
      const schemeTasks = [
        makeTask({
          tier: 'petty', goldReward: 10, clicksRequired: 30,
          template: { name: 'Heist Scheme', description: 'd', category: 'schemes', tier: 'petty' },
          schemeTargetDept: 'heists',
        }),
        makeTask({
          tier: 'legendary', goldReward: 500, clicksRequired: 5,
          template: { name: 'Research Scheme', description: 'd', category: 'schemes', tier: 'legendary' },
          schemeTargetDept: 'research',
        }),
      ];
      setInputs(schemeTasks);
      component.filterCategory.set('heists');
      component.cycleSort(); // → tier

      const result = component.filteredMissions();
      expect(result.length).toBe(1);
      expect(result[0].template.name).toBe('Heist Scheme');
    });
  });

  describe('sort button in template', () => {
    it('should render the sort button', () => {
      setInputs([makeTask()]);
      const sortBtn = fixture.nativeElement.querySelector('[title^="Sort:"]');
      expect(sortBtn).toBeTruthy();
      expect(sortBtn.textContent).toContain('Default');
    });

    it('should cycle sort on button click', () => {
      setInputs([makeTask()]);
      const sortBtn = fixture.nativeElement.querySelector('[title^="Sort:"]') as HTMLButtonElement;
      expect(sortBtn).toBeTruthy();

      sortBtn.click();
      fixture.detectChanges();

      expect(component.sortMode()).toBe('tier');
      expect(sortBtn.textContent).toContain('Tier');
    });
  });
});
