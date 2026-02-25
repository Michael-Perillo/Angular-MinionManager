import { GameStateService } from '../../app/core/services/game-state.service';

/** Click a task until it completes (or until maxClicks to prevent infinite loops). */
export function completeTaskByClicking(service: GameStateService, taskId: string, maxClicks = 200): void {
  for (let i = 0; i < maxClicks; i++) {
    const task = service.activeMissions().find(t => t.id === taskId);
    if (!task || task.status === 'complete') break;
    service.clickTask(taskId);
  }
}

/** Call tickTime N times. */
export function tickUntilComplete(service: GameStateService, n: number): void {
  for (let i = 0; i < n; i++) {
    service.tickTime();
  }
}

/** Add gold and hire N minions, returning the service for chaining. */
export function setupGameWithMinions(service: GameStateService, count: number, gold = 10_000): GameStateService {
  service.addGold(gold);
  for (let i = 0; i < count; i++) {
    service.hireMinion();
  }
  return service;
}

/** Accept the first mission from the board and return it. */
export function acceptFirstMission(service: GameStateService) {
  const mission = service.missionBoard()[0];
  if (!mission) throw new Error('No missions on board');
  service.acceptMission(mission.id);
  return service.activeMissions().find(t => t.id === mission.id)!;
}
