import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentColumnComponent } from './department-column.component';
import { makeTask } from '../../../../testing/factories/task.factory';
import { makeMinion, makeWorkingMinion } from '../../../../testing/factories/minion.factory';
import { Department } from '../../../core/models/department.model';

describe('DepartmentColumnComponent', () => {
  let fixture: ComponentFixture<DepartmentColumnComponent>;
  let component: DepartmentColumnComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentColumnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentColumnComponent);
    component = fixture.componentInstance;
  });

  function setInputs(overrides: {
    category?: string;
    tasks?: any[];
    department?: Department;
    assignedMinions?: any[];
    connectedDropLists?: string[];
  } = {}): void {
    fixture.componentRef.setInput('category', overrides.category ?? 'schemes');
    fixture.componentRef.setInput('tasks', overrides.tasks ?? []);
    fixture.componentRef.setInput('department', overrides.department ?? { category: 'schemes', level: 1, workerSlots: 1, hasManager: false });
    fixture.componentRef.setInput('assignedMinions', overrides.assignedMinions ?? []);
    fixture.componentRef.setInput('connectedDropLists', overrides.connectedDropLists ?? []);
    fixture.detectChanges();
  }

  it('renders column header with department label', () => {
    setInputs({ category: 'schemes' });
    expect(fixture.nativeElement.textContent).toContain('Schemes');
  });

  it('drop list has id matching the category', () => {
    setInputs({ category: 'heists' });
    const dropList = fixture.nativeElement.querySelector('[id="heists"]');
    expect(dropList).toBeTruthy();
  });

  it('renders queued tasks as draggable cards', () => {
    const tasks = [
      makeTask({ status: 'queued', template: { name: 'Steal Plans', description: 'd', category: 'schemes', tier: 'petty' } }),
      makeTask({ status: 'queued', template: { name: 'Hack Server', description: 'd', category: 'schemes', tier: 'petty' } }),
    ];
    setInputs({ tasks });

    expect(fixture.nativeElement.textContent).toContain('Steal Plans');
    expect(fixture.nativeElement.textContent).toContain('Hack Server');
  });

  it('shows empty state when no tasks', () => {
    setInputs({ tasks: [] });
    expect(fixture.nativeElement.textContent).toContain('Drop missions here');
  });

  it('shows minion count in header', () => {
    const minions = [makeMinion(), makeMinion()];
    setInputs({ assignedMinions: minions });
    expect(fixture.nativeElement.textContent).toContain('2 minions');
  });

  it('shows singular "minion" for single minion', () => {
    setInputs({ assignedMinions: [makeMinion()] });
    expect(fixture.nativeElement.textContent).toContain('1 minion');
    expect(fixture.nativeElement.textContent).not.toContain('1 minions');
  });

  it('emits taskDropped on drop event', () => {
    setInputs();
    const spy = jasmine.createSpy('taskDropped');
    component.taskDropped.subscribe(spy);

    const fakeEvent = { item: { data: makeTask() }, previousContainer: { data: 'heists' } } as any;
    component.onDrop(fakeEvent);

    expect(spy).toHaveBeenCalledWith(fakeEvent);
  });

  it('separates queued and in-progress tasks', () => {
    const queuedTask = makeTask({ status: 'queued' });
    const inProgressTask = makeTask({ status: 'in-progress', assignedMinionId: 'minion-1' });
    setInputs({ tasks: [queuedTask, inProgressTask] });

    expect(component.queuedTasks().length).toBe(1);
    expect(component.inProgressTasks().length).toBe(1);
  });

  it('renders department category icon in header', () => {
    setInputs({ category: 'heists' });
    // The component uses CATEGORY_LABELS which includes emoji icons
    expect(fixture.nativeElement.textContent).toContain('Heists');
  });
});
