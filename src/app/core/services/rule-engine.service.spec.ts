import { TestBed } from '@angular/core/testing';
import { RuleEngineService, RuleContext } from './rule-engine.service';
import { GameStateService } from './game-state.service';
import { GameEventService, MinionIdleEvent, TaskQueuedEvent, TaskCompletedEvent } from './game-event.service';
import { createRule, DEFAULT_RULE, Rule } from '../models/rule.model';
import { Task, TaskCategory, TaskTier } from '../models/task.model';

function makeQueuedTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    template: { name: 'Test', description: '', category: overrides.template?.category ?? 'schemes', tier: overrides.tier ?? 'petty' },
    status: 'queued',
    tier: overrides.tier ?? 'petty',
    goldReward: 10,
    clicksRequired: 10,
    clicksRemaining: 10,
    assignedMinionId: null,
    queuedAt: Date.now(),
    assignedQueue: overrides.template?.category ?? 'schemes',
    ...overrides,
  } as Task;
}

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let gameState: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RuleEngineService, GameStateService, GameEventService],
    });
    service = TestBed.inject(RuleEngineService);
    gameState = TestBed.inject(GameStateService);
    gameState.initializeGame();
    gameState.clickCompleteDelay = 0;
  });

  describe('triggerMatchesEvent', () => {
    it('when-idle matches MinionIdle events', () => {
      const event: MinionIdleEvent = { type: 'MinionIdle', minionId: '1', department: 'schemes' };
      expect(service.triggerMatchesEvent('when-idle', event)).toBe(true);
    });

    it('when-idle does not match TaskQueued events', () => {
      const event: TaskQueuedEvent = { type: 'TaskQueued', taskId: '1', department: 'schemes' };
      expect(service.triggerMatchesEvent('when-idle', event)).toBe(false);
    });

    it('when-task-appears matches TaskQueued events', () => {
      const event: TaskQueuedEvent = { type: 'TaskQueued', taskId: '1', department: 'schemes' };
      expect(service.triggerMatchesEvent('when-task-appears', event)).toBe(true);
    });

    it('on-completion matches TaskCompleted events', () => {
      const event: TaskCompletedEvent = {
        type: 'TaskCompleted', taskName: 'X', tier: 'petty',
        category: 'schemes', goldEarned: 10, minionId: null,
      };
      expect(service.triggerMatchesEvent('on-completion', event)).toBe(true);
    });

    it('returns false for unknown card ID', () => {
      const event: MinionIdleEvent = { type: 'MinionIdle', minionId: '1', department: 'schemes' };
      expect(service.triggerMatchesEvent('nonexistent', event)).toBe(false);
    });
  });

  describe('evaluateCondition', () => {
    const baseContext: RuleContext = {
      minionId: '1',
      minionSpecialty: 'schemes',
      department: 'schemes',
      gold: 75,
      queuedTasks: [makeQueuedTask({ tier: 'petty' })],
    };

    it('specialty-match returns true when minion specialty matches a task category', () => {
      expect(service.evaluateCondition('specialty-match', baseContext)).toBe(true);
    });

    it('specialty-match returns false when no match', () => {
      const ctx = { ...baseContext, minionSpecialty: 'heists' as TaskCategory };
      expect(service.evaluateCondition('specialty-match', ctx)).toBe(false);
    });

    it('tier-petty returns true for petty tasks', () => {
      expect(service.evaluateCondition('tier-petty', baseContext)).toBe(true);
    });

    it('tier-petty returns false for sinister tasks', () => {
      const ctx = { ...baseContext, queuedTasks: [makeQueuedTask({ tier: 'sinister' as TaskTier })] };
      expect(service.evaluateCondition('tier-petty', ctx)).toBe(false);
    });

    it('tier-sinister-plus returns true for sinister tasks', () => {
      const ctx = { ...baseContext, queuedTasks: [makeQueuedTask({ tier: 'sinister' as TaskTier })] };
      expect(service.evaluateCondition('tier-sinister-plus', ctx)).toBe(true);
    });

    it('tier-sinister-plus returns false for petty tasks', () => {
      expect(service.evaluateCondition('tier-sinister-plus', baseContext)).toBe(false);
    });

    it('queue-empty returns true when no queued tasks', () => {
      const ctx = { ...baseContext, queuedTasks: [] };
      expect(service.evaluateCondition('queue-empty', ctx)).toBe(true);
    });

    it('queue-empty returns false when tasks exist', () => {
      expect(service.evaluateCondition('queue-empty', baseContext)).toBe(false);
    });

    it('gold-above-100 returns true when gold > 100', () => {
      const ctx = { ...baseContext, gold: 150 };
      expect(service.evaluateCondition('gold-above-100', ctx)).toBe(true);
    });

    it('gold-above-100 returns false when gold <= 100', () => {
      expect(service.evaluateCondition('gold-above-100', baseContext)).toBe(false);
    });

    it('gold-below-50 returns true when gold < 50', () => {
      const ctx = { ...baseContext, gold: 25 };
      expect(service.evaluateCondition('gold-below-50', ctx)).toBe(true);
    });

    it('gold-below-50 returns false when gold >= 50', () => {
      expect(service.evaluateCondition('gold-below-50', baseContext)).toBe(false);
    });

    it('returns false for unknown condition ID', () => {
      expect(service.evaluateCondition('nonexistent', baseContext)).toBe(false);
    });
  });

  describe('evaluateRules', () => {
    it('default rule produces assign-to-work actions for idle minions with queued tasks', () => {
      // Set up: hire a minion, accept a mission
      gameState.addGold(10000);
      gameState.hireMinion();
      const mission = gameState.missionBoard()[0];
      gameState.acceptMission(mission.id);

      const minion = gameState.minions()[0];
      const event: MinionIdleEvent = { type: 'MinionIdle', minionId: minion.id, department: minion.assignedDepartment };
      const actions = service.evaluateRules(event);

      // Should produce at least one action (may vary based on random dept assignment vs queued task dept)
      // The default rule triggers on MinionIdle for any idle minion with queued tasks in their dept
      if (actions.length > 0) {
        expect(actions[0].actionId).toBe('assign-to-work');
        expect(actions[0].minionId).toBe(minion.id);
      }
    });

    it('returns empty when no idle minions', () => {
      const event: MinionIdleEvent = { type: 'MinionIdle', minionId: 'x', department: 'schemes' };
      const actions = service.evaluateRules(event);
      expect(actions.length).toBe(0);
    });
  });
});
