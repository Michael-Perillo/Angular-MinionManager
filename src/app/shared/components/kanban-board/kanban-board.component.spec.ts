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
    schemes: { category: 'schemes', level: 1, workerSlots: 1, hasManager: false },
    heists: { category: 'heists', level: 1, workerSlots: 1, hasManager: false },
    research: { category: 'research', level: 1, workerSlots: 1, hasManager: false },
    mayhem: { category: 'mayhem', level: 1, workerSlots: 1, hasManager: false },
  };

  const allCategories: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanBoardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanBoardComponent);
    component = fixture.componentInstance;
  });

  function setInputs(overrides: {
    departmentQueues?: Record<TaskCategory, Task[]>;
    departments?: Record<TaskCategory, Department>;
    minions?: any[];
    clickPower?: number;
    unlockedDepartments?: TaskCategory[];
  } = {}): void {
    fixture.componentRef.setInput('departmentQueues', overrides.departmentQueues ?? emptyQueues);
    fixture.componentRef.setInput('departments', overrides.departments ?? defaultDepartments);
    fixture.componentRef.setInput('minions', overrides.minions ?? []);
    fixture.componentRef.setInput('clickPower', overrides.clickPower ?? 1);
    fixture.componentRef.setInput('unlockedDepartments', overrides.unlockedDepartments ?? allCategories);
    fixture.detectChanges();
  }

  it('renders department columns for unlocked departments', () => {
    setInputs();
    const columns = fixture.nativeElement.querySelectorAll('app-department-column');
    expect(columns.length).toBe(4);
  });

  it('renders only unlocked department columns', () => {
    setInputs({ unlockedDepartments: ['schemes', 'heists'] });
    const columns = fixture.nativeElement.querySelectorAll('app-department-column');
    expect(columns.length).toBe(2);
  });

  it('shows locked placeholder when not all departments unlocked', () => {
    setInputs({ unlockedDepartments: ['schemes'] });
    expect(component.hasLockedDepartments()).toBeTrue();
  });

  it('taskDropListIds includes only unlocked departments', () => {
    setInputs({ unlockedDepartments: ['schemes', 'heists'] });
    const ids = component.taskDropListIds();
    expect(ids).toContain('schemes');
    expect(ids).toContain('heists');
    expect(ids as string[]).not.toContain('mission-board');
    expect(ids).not.toContain('research');
    expect(ids).not.toContain('mayhem');
  });

  it('onTaskDropped emits taskReordered when source equals target', () => {
    const task1 = makeTask({ id: 'q1', status: 'queued' });
    const task2 = makeTask({ id: 'q2', status: 'queued' });
    setInputs({
      departmentQueues: { ...emptyQueues, schemes: [task1, task2] },
    });
    const reorderedSpy = jasmine.createSpy('taskReordered');
    component.taskReordered.subscribe(reorderedSpy);

    const fakeEvent = {
      item: { data: task1 },
      previousContainer: { data: 'schemes' },
      container: { data: 'schemes' },
      previousIndex: 0,
      currentIndex: 1,
    } as any;

    component.onTaskDropped(fakeEvent, 'schemes');

    expect(reorderedSpy).toHaveBeenCalledWith({ queue: 'schemes', taskIds: ['q2', 'q1'] });
  });

  it('onTaskDropped ignores cross-queue drops', () => {
    setInputs();
    const task = makeTask();
    const reorderedSpy = jasmine.createSpy('taskReordered');
    component.taskReordered.subscribe(reorderedSpy);

    const fakeEvent = {
      item: { data: task },
      previousContainer: { data: 'schemes' },
      container: { data: 'heists' },
    } as any;

    component.onTaskDropped(fakeEvent, 'heists');

    expect(reorderedSpy).not.toHaveBeenCalled();
  });

  it('onTaskDropped does nothing when task data is missing', () => {
    setInputs();
    const reorderedSpy = jasmine.createSpy('taskReordered');
    component.taskReordered.subscribe(reorderedSpy);

    const fakeEvent = {
      item: { data: null },
      previousContainer: { data: 'schemes' },
      container: { data: 'heists' },
    } as any;

    component.onTaskDropped(fakeEvent, 'heists');

    expect(reorderedSpy).not.toHaveBeenCalled();
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
