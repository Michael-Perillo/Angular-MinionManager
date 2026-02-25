import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KanbanBoardComponent } from './kanban-board.component';
import { makeTask } from '../../../../testing/factories/task.factory';
import { makeMinion } from '../../../../testing/factories/minion.factory';
import { Task, TaskCategory } from '../../../core/models/task.model';
import { Department } from '../../../core/models/department.model';

describe('KanbanBoardComponent', () => {
  let fixture: ComponentFixture<KanbanBoardComponent>;
  let component: KanbanBoardComponent;

  const emptyQueues: Record<TaskCategory, Task[]> = {
    schemes: [], heists: [], research: [], mayhem: [],
  };

  const defaultDepartments: Record<TaskCategory, Department> = {
    schemes: { category: 'schemes', xp: 0, level: 1 },
    heists: { category: 'heists', xp: 0, level: 1 },
    research: { category: 'research', xp: 0, level: 1 },
    mayhem: { category: 'mayhem', xp: 0, level: 1 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanBoardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanBoardComponent);
    component = fixture.componentInstance;
  });

  function setInputs(overrides: {
    departmentQueues?: Record<TaskCategory, Task[]>;
    playerQueue?: Task[];
    departments?: Record<TaskCategory, Department>;
    minions?: any[];
    clickPower?: number;
  } = {}): void {
    fixture.componentRef.setInput('departmentQueues', overrides.departmentQueues ?? emptyQueues);
    fixture.componentRef.setInput('playerQueue', overrides.playerQueue ?? []);
    fixture.componentRef.setInput('departments', overrides.departments ?? defaultDepartments);
    fixture.componentRef.setInput('minions', overrides.minions ?? []);
    fixture.componentRef.setInput('clickPower', overrides.clickPower ?? 1);
    fixture.detectChanges();
  }

  it('renders all four department columns and player workbench', () => {
    setInputs();
    const columns = fixture.nativeElement.querySelectorAll('app-department-column');
    expect(columns.length).toBe(4);
    const workbench = fixture.nativeElement.querySelector('app-player-workbench');
    expect(workbench).toBeTruthy();
  });

  it('allDropListIds includes mission-board', () => {
    expect(component.allDropListIds).toContain('mission-board');
  });

  it('allDropListIds includes all department categories and player', () => {
    expect(component.allDropListIds).toContain('schemes');
    expect(component.allDropListIds).toContain('heists');
    expect(component.allDropListIds).toContain('research');
    expect(component.allDropListIds).toContain('mayhem');
    expect(component.allDropListIds).toContain('player');
  });

  it('onTaskDropped emits taskRouted when source is mission-board', () => {
    setInputs();
    const task = makeTask();
    const routedSpy = jasmine.createSpy('taskRouted');
    component.taskRouted.subscribe(routedSpy);

    const fakeEvent = {
      item: { data: task },
      previousContainer: { data: 'mission-board' },
      container: { data: 'schemes' },
    } as any;

    component.onTaskDropped(fakeEvent, 'schemes');

    expect(routedSpy).toHaveBeenCalledWith({ taskId: task.id, target: 'schemes' });
  });

  it('onTaskDropped emits taskMoved when source is a department queue', () => {
    setInputs();
    const task = makeTask();
    const movedSpy = jasmine.createSpy('taskMoved');
    component.taskMoved.subscribe(movedSpy);

    const fakeEvent = {
      item: { data: task },
      previousContainer: { data: 'schemes' },
      container: { data: 'heists' },
    } as any;

    component.onTaskDropped(fakeEvent, 'heists');

    expect(movedSpy).toHaveBeenCalledWith({ taskId: task.id, from: 'schemes', to: 'heists' });
  });

  it('onTaskDropped does nothing when source equals target', () => {
    setInputs();
    const task = makeTask();
    const movedSpy = jasmine.createSpy('taskMoved');
    const routedSpy = jasmine.createSpy('taskRouted');
    component.taskMoved.subscribe(movedSpy);
    component.taskRouted.subscribe(routedSpy);

    const fakeEvent = {
      item: { data: task },
      previousContainer: { data: 'schemes' },
      container: { data: 'schemes' },
    } as any;

    component.onTaskDropped(fakeEvent, 'schemes');

    expect(movedSpy).not.toHaveBeenCalled();
    expect(routedSpy).not.toHaveBeenCalled();
  });

  it('onTaskDropped does nothing when task data is missing', () => {
    setInputs();
    const movedSpy = jasmine.createSpy('taskMoved');
    const routedSpy = jasmine.createSpy('taskRouted');
    component.taskMoved.subscribe(movedSpy);
    component.taskRouted.subscribe(routedSpy);

    const fakeEvent = {
      item: { data: null },
      previousContainer: { data: 'schemes' },
      container: { data: 'heists' },
    } as any;

    component.onTaskDropped(fakeEvent, 'heists');

    expect(movedSpy).not.toHaveBeenCalled();
    expect(routedSpy).not.toHaveBeenCalled();
  });

  it('minionsByDept groups minions correctly', () => {
    const minions = [
      makeMinion({ assignedDepartment: 'schemes' }),
      makeMinion({ assignedDepartment: 'schemes' }),
      makeMinion({ assignedDepartment: 'heists' }),
    ];
    setInputs({ minions });

    const grouped = component.minionsByDept();
    expect(grouped.schemes.length).toBe(2);
    expect(grouped.heists.length).toBe(1);
    expect(grouped.research.length).toBe(0);
    expect(grouped.mayhem.length).toBe(0);
  });
});
