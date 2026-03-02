import { Injectable, inject } from '@angular/core';
import { GameStateService } from './game-state.service';
import { GameEvent } from './game-event.service';
import { TaskCategory, TaskTier, Task } from '../models/task.model';
import { CardId, CARD_POOL, TriggerCard, ConditionCard, ActionCard, TIER_ORDER } from '../models/card.model';
import { Rule, isDefaultRule, DEFAULT_RULE } from '../models/rule.model';

// ─── Rule context & action ─────────────────

export interface RuleContext {
  minionId: string;
  minionSpecialty: TaskCategory;
  department: TaskCategory;
  gold: number;
  queuedTasks: Task[];
}

export interface RuleAction {
  ruleId: string;
  actionId: string;
  minionId: string;
  taskId?: string;
  department: TaskCategory;
}

// ─── Service ───────────────────────────────

@Injectable({ providedIn: 'root' })
export class RuleEngineService {
  private readonly gameState = inject(GameStateService);

  /**
   * Evaluate all enabled rules against a game event.
   * Returns a list of actions to execute (assign minion to task, or hold).
   * Never mutates state — caller is responsible for executing actions.
   */
  evaluateRules(event: GameEvent): RuleAction[] {
    const rules = this.gameState.rules();
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
    const claimedMinionIds = new Set<string>();
    const claimedTaskIds = new Set<string>();
    const actions: RuleAction[] = [];

    for (const rule of sortedRules) {
      if (!rule.enabled) continue;

      // Default rule matches ALL events (it's the catch-all fallback)
      if (!isDefaultRule(rule) && !this.triggerMatchesEvent(rule.triggerId, event)) continue;

      // Find idle minions in departments that have queued tasks
      const minionsByDept = this.gameState.minionsByDepartment();
      const deptQueues = this.gameState.departmentQueues();
      const gold = this.gameState.gold();

      for (const cat of ['schemes', 'heists', 'research', 'mayhem'] as TaskCategory[]) {
        const deptMinions = minionsByDept[cat].filter(m =>
          m.status === 'idle' && !claimedMinionIds.has(m.id)
        );
        if (deptMinions.length === 0) continue;

        const queuedTasks = deptQueues[cat].filter(t =>
          t.status === 'queued' && !claimedTaskIds.has(t.id)
        );

        for (const minion of deptMinions) {
          if (claimedMinionIds.has(minion.id)) continue;

          const context: RuleContext = {
            minionId: minion.id,
            minionSpecialty: minion.specialty,
            department: cat,
            gold,
            queuedTasks,
          };

          // Evaluate all conditions (AND logic)
          const conditionsMet = rule.conditionIds.every(condId =>
            this.evaluateCondition(condId, context)
          );
          if (!conditionsMet) continue;

          // Resolve action
          const actionCard = CARD_POOL[rule.actionId] as ActionCard | undefined;
          if (!actionCard) continue;

          const action = this.resolveAction(actionCard, context, claimedTaskIds);
          if (action) {
            actions.push({
              ruleId: rule.id,
              actionId: rule.actionId,
              minionId: minion.id,
              taskId: action.taskId,
              department: cat,
            });
            claimedMinionIds.add(minion.id);
            if (action.taskId) claimedTaskIds.add(action.taskId);
          } else if (actionCard.action === 'hold') {
            // Hold: claim the minion but don't assign a task
            actions.push({
              ruleId: rule.id,
              actionId: rule.actionId,
              minionId: minion.id,
              department: cat,
            });
            claimedMinionIds.add(minion.id);
          }
        }
      }
    }

    return actions;
  }

  /** Check if a trigger card matches the incoming event */
  triggerMatchesEvent(triggerId: CardId, event: GameEvent): boolean {
    const card = CARD_POOL[triggerId];
    if (!card || card.type !== 'trigger') return false;
    const trigger = card as TriggerCard;
    return trigger.eventTypes.includes(event.type);
  }

  /** Evaluate a single condition card against a context */
  evaluateCondition(conditionId: CardId, context: RuleContext): boolean {
    const card = CARD_POOL[conditionId];
    if (!card || card.type !== 'condition') return false;
    const condition = card as ConditionCard;

    switch (condition.evaluate) {
      case 'specialty-match':
        return context.queuedTasks.some(t =>
          t.template.category === context.minionSpecialty
        );

      case 'tier-gte': {
        if (!condition.tierMin) return true;
        const minOrder = TIER_ORDER[condition.tierMin];
        return context.queuedTasks.some(t => TIER_ORDER[t.tier] >= minOrder);
      }

      case 'tier-eq': {
        if (!condition.tierMin) return true;
        return context.queuedTasks.some(t => t.tier === condition.tierMin);
      }

      case 'queue-empty':
        return context.queuedTasks.length === 0;

      case 'gold-above':
        return context.gold > (condition.threshold ?? 0);

      case 'gold-below':
        return context.gold < (condition.threshold ?? 0);

      default:
        return false;
    }
  }

  /** Resolve an action card into a concrete task assignment */
  private resolveAction(
    actionCard: ActionCard,
    context: RuleContext,
    claimedTaskIds: Set<string>,
  ): { taskId: string } | null {
    const available = context.queuedTasks.filter(t => !claimedTaskIds.has(t.id));
    if (available.length === 0) return null;

    switch (actionCard.action) {
      case 'assign-to-work':
        // Assign to first queued task (respects queue priority order)
        return { taskId: available[0].id };

      case 'assign-highest-tier': {
        const sorted = [...available].sort((a, b) =>
          TIER_ORDER[b.tier] - TIER_ORDER[a.tier]
        );
        return { taskId: sorted[0].id };
      }

      case 'assign-lowest-tier': {
        const sorted = [...available].sort((a, b) =>
          TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
        );
        return { taskId: sorted[0].id };
      }

      case 'hold':
        return null; // Intentionally do nothing

      default:
        return null;
    }
  }
}
