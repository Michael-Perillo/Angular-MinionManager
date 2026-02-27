import { HeaderPage } from './header.page';
import { MissionBoardPage } from './mission-board.page';
import { WorkbenchPage } from './workbench.page';

export class GameActions {
  constructor(
    private header: HeaderPage,
    private missionBoard: MissionBoardPage,
    private workbench: WorkbenchPage,
  ) {}

  /** Accept a mission, route it to the workbench, click to completion, return gold. */
  async earnGold(): Promise<number> {
    await this.missionBoard.sendFirstMissionToQueue();
    await this.missionBoard.routeToWorkbench();
    await this.workbench.clickUntilTaskComplete();
    return this.header.gold;
  }

  /** Repeat earnGold until gold >= target (max 20 attempts). */
  async earnGoldUntil(target: number): Promise<number> {
    let gold = await this.header.gold;
    let attempts = 0;
    while (gold < target && attempts < 20) {
      gold = await this.earnGold();
      attempts++;
    }
    return gold;
  }
}
