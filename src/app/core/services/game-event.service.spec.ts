import { TestBed } from '@angular/core/testing';
import {
  GameEventService, GameEvent, TaskCompletedEvent, MinionIdleEvent,
  TaskQueuedEvent, TaskAssignedEvent, MinionHiredEvent, MinionReassignedEvent,
  UpgradePurchasedEvent, BreakoutCompletedEvent, SpecialOpSpawnedEvent, LevelUpEvent,
} from './game-event.service';

describe('GameEventService', () => {
  let service: GameEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit events to subscribers', () => {
    const received: GameEvent[] = [];
    service.events$.subscribe(e => received.push(e));

    service.emit({ type: 'RaidStarted' });
    expect(received.length).toBe(1);
    expect(received[0].type).toBe('RaidStarted');
  });

  it('should filter events by type with on()', () => {
    const taskEvents: TaskCompletedEvent[] = [];
    const minionEvents: MinionIdleEvent[] = [];

    service.on('TaskCompleted').subscribe(e => taskEvents.push(e));
    service.on('MinionIdle').subscribe(e => minionEvents.push(e));

    service.emit({
      type: 'TaskCompleted',
      taskName: 'Heist',
      tier: 'petty',
      category: 'heists',
      goldEarned: 10,
      minionId: null,
      isCoverOp: false,
      isBreakoutOp: false,
    });

    service.emit({
      type: 'MinionIdle',
      minionId: 'm1',
      department: 'schemes',
    });

    service.emit({ type: 'RaidStarted' });

    expect(taskEvents.length).toBe(1);
    expect(minionEvents.length).toBe(1);
    expect(taskEvents[0].taskName).toBe('Heist');
    expect(minionEvents[0].minionId).toBe('m1');
  });

  it('should not receive events after unsubscribing', () => {
    const received: GameEvent[] = [];
    const sub = service.events$.subscribe(e => received.push(e));

    service.emit({ type: 'RaidStarted' });
    expect(received.length).toBe(1);

    sub.unsubscribe();
    service.emit({ type: 'RaidStarted' });
    expect(received.length).toBe(1);
  });

  describe('new event types', () => {
    it('should emit and filter TaskQueued events', () => {
      const received: TaskQueuedEvent[] = [];
      service.on('TaskQueued').subscribe(e => received.push(e));

      service.emit({ type: 'TaskQueued', taskId: 't1', department: 'schemes' });
      expect(received.length).toBe(1);
      expect(received[0].taskId).toBe('t1');
      expect(received[0].department).toBe('schemes');
    });

    it('should emit and filter TaskAssigned events', () => {
      const received: TaskAssignedEvent[] = [];
      service.on('TaskAssigned').subscribe(e => received.push(e));

      service.emit({ type: 'TaskAssigned', taskId: 't1', minionId: 'm1', department: 'heists', durationMs: 5000 });
      expect(received.length).toBe(1);
      expect(received[0].durationMs).toBe(5000);
    });

    it('should emit and filter MinionHired events', () => {
      const received: MinionHiredEvent[] = [];
      service.on('MinionHired').subscribe(e => received.push(e));

      service.emit({ type: 'MinionHired', minionId: 'm1', department: 'research' });
      expect(received.length).toBe(1);
      expect(received[0].department).toBe('research');
    });

    it('should emit and filter MinionReassigned events', () => {
      const received: MinionReassignedEvent[] = [];
      service.on('MinionReassigned').subscribe(e => received.push(e));

      service.emit({ type: 'MinionReassigned', minionId: 'm1', fromDepartment: 'schemes', toDepartment: 'heists' });
      expect(received.length).toBe(1);
      expect(received[0].fromDepartment).toBe('schemes');
      expect(received[0].toDepartment).toBe('heists');
    });

    it('should emit and filter UpgradePurchased events', () => {
      const received: UpgradePurchasedEvent[] = [];
      service.on('UpgradePurchased').subscribe(e => received.push(e));

      service.emit({ type: 'UpgradePurchased', upgradeId: 'bribe-network', newLevel: 2 });
      expect(received.length).toBe(1);
      expect(received[0].upgradeId).toBe('bribe-network');
    });

    it('should emit and filter BreakoutCompleted events', () => {
      const received: BreakoutCompletedEvent[] = [];
      service.on('BreakoutCompleted').subscribe(e => received.push(e));

      service.emit({ type: 'BreakoutCompleted', minionId: 'm1', department: 'mayhem' });
      expect(received.length).toBe(1);
      expect(received[0].department).toBe('mayhem');
    });

    it('should emit and filter SpecialOpSpawned events', () => {
      const received: SpecialOpSpawnedEvent[] = [];
      service.on('SpecialOpSpawned').subscribe(e => received.push(e));

      service.emit({ type: 'SpecialOpSpawned', missionId: 'sp1', tier: 'sinister' });
      expect(received.length).toBe(1);
      expect(received[0].tier).toBe('sinister');
    });

    it('should emit and filter LevelUp events', () => {
      const received: LevelUpEvent[] = [];
      service.on('LevelUp').subscribe(e => received.push(e));

      service.emit({ type: 'LevelUp', target: 'villain', targetId: 'player', newLevel: 3 });
      expect(received.length).toBe(1);
      expect(received[0].target).toBe('villain');
      expect(received[0].newLevel).toBe(3);
    });
  });
});
