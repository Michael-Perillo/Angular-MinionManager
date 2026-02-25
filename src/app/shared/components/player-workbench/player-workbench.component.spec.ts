import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerWorkbenchComponent } from './player-workbench.component';
import { makeTask } from '../../../../testing/factories/task.factory';

describe('PlayerWorkbenchComponent', () => {
  let fixture: ComponentFixture<PlayerWorkbenchComponent>;
  let component: PlayerWorkbenchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerWorkbenchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerWorkbenchComponent);
    component = fixture.componentInstance;
  });

  function setInputs(overrides: {
    tasks?: any[];
    clickPower?: number;
    connectedDropLists?: string[];
  } = {}): void {
    fixture.componentRef.setInput('tasks', overrides.tasks ?? []);
    fixture.componentRef.setInput('clickPower', overrides.clickPower ?? 1);
    fixture.componentRef.setInput('connectedDropLists', overrides.connectedDropLists ?? []);
    fixture.detectChanges();
  }

  it('renders workbench header', () => {
    setInputs();
    expect(fixture.nativeElement.textContent).toContain('Your Workbench');
  });

  it('drop list has id="player"', () => {
    setInputs();
    const dropList = fixture.nativeElement.querySelector('[id="player"]');
    expect(dropList).toBeTruthy();
  });

  it('shows click power in header', () => {
    setInputs({ clickPower: 5 });
    expect(fixture.nativeElement.textContent).toContain('Click Power: 5');
  });

  it('shows empty state when no tasks', () => {
    setInputs({ tasks: [] });
    expect(fixture.nativeElement.textContent).toContain('Drop missions here for manual clicking');
  });

  it('shows active task with CLICK button', () => {
    const task = makeTask({ status: 'in-progress', clicksRemaining: 3, clicksRequired: 5 });
    setInputs({ tasks: [task] });
    expect(fixture.nativeElement.textContent).toContain('CLICK!');
    expect(fixture.nativeElement.textContent).toContain('3 left');
  });

  it('activeTask returns first task', () => {
    const tasks = [makeTask(), makeTask()];
    setInputs({ tasks });
    expect(component.activeTask()?.id).toBe(tasks[0].id);
  });

  it('remainingTasks returns all but first', () => {
    const tasks = [makeTask(), makeTask(), makeTask()];
    setInputs({ tasks });
    expect(component.remainingTasks().length).toBe(2);
  });

  it('emits taskClicked when CLICK button pressed', () => {
    const task = makeTask({ status: 'in-progress', clicksRemaining: 3, clicksRequired: 5 });
    setInputs({ tasks: [task] });

    const spy = jasmine.createSpy('taskClicked');
    component.taskClicked.subscribe(spy);

    const btn = fixture.nativeElement.querySelector('button');
    btn.click();

    expect(spy).toHaveBeenCalledWith(task.id);
  });

  it('emits taskDropped on drop event', () => {
    setInputs();
    const spy = jasmine.createSpy('taskDropped');
    component.taskDropped.subscribe(spy);

    const fakeEvent = { item: { data: makeTask() }, previousContainer: { data: 'schemes' } } as any;
    component.onDrop(fakeEvent);

    expect(spy).toHaveBeenCalledWith(fakeEvent);
  });

  it('shows task count in header', () => {
    setInputs({ tasks: [makeTask(), makeTask()] });
    expect(fixture.nativeElement.textContent).toContain('2 tasks');
  });
});
