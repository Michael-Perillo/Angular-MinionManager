import { Injectable, computed, signal } from '@angular/core';
import {
  Task, TaskStatus, TaskTier, TaskCategory, TIER_CONFIG, TaskTemplate, GOLD_SCALE_PER_LEVEL,
} from '../models/task.model';
import {
  Minion, MinionAppearance, MinionStats, MINION_NAMES, MINION_COLORS, MINION_ACCESSORIES,
  SPECIALTY_CATEGORIES, SPECIALTY_BONUS, levelFromXp, xpForLevel,
} from '../models/minion.model';
import { GameNotification } from '../models/game-state.model';
import { TASK_POOL } from '../models/task-pool';
import {
  Department, DEPT_TIER_XP, deptLevelFromXp, deptXpForLevel, availableTiersForDeptLevel,
} from '../models/department.model';
import { Upgrade, upgradeCost, createDefaultUpgrades } from '../models/upgrade.model';
import {
  NOTORIETY_PER_TIER, MAX_NOTORIETY, getThreatLevel, notorietyGoldPenalty,
  bribeCost, COVER_TRACKS_REDUCTION, ThreatLevel,
} from '../models/notoriety.model';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  // ─── State signals ─────────────────────────
  private readonly _gold = signal(0);
  private readonly _minions = signal<Minion[]>([]);
  private readonly _missionBoard = signal<Task[]>([]);   // Available missions to choose from
  private readonly _activeMissions = signal<Task[]>([]);  // Accepted & in-progress missions
  private readonly _completedCount = signal(0);
  private readonly _totalGoldEarned = signal(0);
  private readonly _notifications = signal<GameNotification[]>([]);
  private readonly _departments = signal<Record<TaskCategory, Department>>({
    schemes: { category: 'schemes', xp: 0, level: 1 },
    heists: { category: 'heists', xp: 0, level: 1 },
    research: { category: 'research', xp: 0, level: 1 },
    mayhem: { category: 'mayhem', xp: 0, level: 1 },
  });

  private readonly _upgrades = signal<Upgrade[]>(createDefaultUpgrades());
  private readonly _notoriety = signal(0);
  private readonly _raidActive = signal(false);
  private readonly _raidTimer = signal(0); // seconds to defend

  // ─── Public read-only signals ──────────────
  readonly gold = this._gold.asReadonly();
  readonly minions = this._minions.asReadonly();
  readonly missionBoard = this._missionBoard.asReadonly();
  readonly activeMissions = this._activeMissions.asReadonly();
  readonly completedCount = this._completedCount.asReadonly();
  readonly totalGoldEarned = this._totalGoldEarned.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly departments = this._departments.asReadonly();
  readonly upgrades = this._upgrades.asReadonly();
  readonly notoriety = this._notoriety.asReadonly();
  readonly raidActive = this._raidActive.asReadonly();
  readonly raidTimer = this._raidTimer.asReadonly();

  readonly threatLevel = computed(() => getThreatLevel(this._notoriety()));

  readonly notorietyGoldPenaltyPercent = computed(() =>
    Math.round(notorietyGoldPenalty(this._notoriety()) * 100)
  );

  // Backwards-compat: taskQueue = activeMissions (for components that still use it)
  readonly taskQueue = this._activeMissions.asReadonly();

  // ─── Villain level (Phase 1) ─────────────
  readonly villainLevel = computed(() => {
    const completed = this._completedCount();
    return Math.min(20, Math.floor(Math.sqrt(completed / 2.5)) + 1);
  });

  readonly villainTitle = computed(() => {
    const level = this.villainLevel();
    if (level <= 2) return 'Petty Troublemaker';
    if (level <= 4) return 'Aspiring Villain';
    if (level <= 6) return 'Notorious Scoundrel';
    if (level <= 8) return 'Criminal Mastermind';
    if (level <= 10) return 'Arch-Villain';
    if (level <= 14) return 'Dark Overlord';
    return 'Supreme Evil Genius';
  });

  // ─── Computed signals ──────────────────────
  readonly idleMinions = computed(() =>
    this._minions().filter(m => m.status === 'idle')
  );

  readonly workingMinions = computed(() =>
    this._minions().filter(m => m.status === 'working')
  );

  readonly nextMinionCost = computed(() => {
    const base = Math.floor(50 * Math.pow(1.5, this._minions().length));
    const discount = this.getUpgradeLevel('hire-discount') * 0.08;
    return Math.floor(base * (1 - discount));
  });

  readonly canHireMinion = computed(() =>
    this._gold() >= this.nextMinionCost()
  );

  readonly queuedTasks = computed(() =>
    this._activeMissions().filter(t => t.status === 'queued')
  );

  readonly inProgressTasks = computed(() =>
    this._activeMissions().filter(t => t.status === 'in-progress')
  );

  /** Mission board capacity: base 12, scales with minions + upgrades */
  readonly boardCapacity = computed(() => {
    const base = 12;
    const minionBonus = Math.min(8, this._minions().length * 2);
    const upgradeBonus = this.getUpgradeLevel('board-slots') * 3;
    return base + minionBonus + upgradeBonus;
  });

  /** Active mission slots: base 3 + 1 per minion + upgrades */
  readonly activeSlots = computed(() =>
    3 + this._minions().length + this.getUpgradeLevel('active-slots')
  );

  /** Click power: 1 + upgrade level */
  readonly clickPower = computed(() =>
    1 + this.getUpgradeLevel('click-power')
  );

  // ─── Constants ─────────────────────────────
  private readonly BOARD_REFRESH_INTERVAL = 3_000;
  private readonly SPECIAL_OP_CHANCE = 0.15;
  private readonly SPECIAL_OP_DURATION = 30_000;
  private readonly RAID_CHANCE_PER_TICK = 0.02; // 2% per tick when notoriety >= 60
  private readonly RAID_DURATION = 10; // 10 seconds to defend
  private readonly COVER_TRACKS_CHANCE = 0.12; // 12% chance a board mission is "Cover Your Tracks"

  /** XP earned per task tier */
  private readonly TIER_XP: Record<TaskTier, number> = {
    petty: 3,
    sinister: 8,
    diabolical: 15,
    legendary: 25,
  };

  private lastBoardRefresh = 0;
  private usedNameIndices = new Set<number>();

  // ─── Game lifecycle ────────────────────────
  initializeGame(): void {
    this._gold.set(0);
    this._minions.set([]);
    this._missionBoard.set([]);
    this._activeMissions.set([]);
    this._completedCount.set(0);
    this._totalGoldEarned.set(0);
    this._notifications.set([]);
    this._departments.set({
      schemes: { category: 'schemes', xp: 0, level: 1 },
      heists: { category: 'heists', xp: 0, level: 1 },
      research: { category: 'research', xp: 0, level: 1 },
      mayhem: { category: 'mayhem', xp: 0, level: 1 },
    });
    this._upgrades.set(createDefaultUpgrades());
    this._notoriety.set(0);
    this._raidActive.set(false);
    this._raidTimer.set(0);
    this.usedNameIndices.clear();
    this.lastBoardRefresh = 0;

    // Fill the board immediately
    this.fillBoard();
  }

  resetGame(): void {
    this.initializeGame();
  }

  addGold(amount: number): void {
    this._gold.update(g => g + amount);
  }

  // ─── Upgrades ──────────────────────────────
  purchaseUpgrade(upgradeId: string): void {
    const upgrade = this._upgrades().find(u => u.id === upgradeId);
    if (!upgrade) return;
    if (upgrade.currentLevel >= upgrade.maxLevel) return;

    const cost = upgradeCost(upgrade);
    if (this._gold() < cost) return;

    this._gold.update(g => g - cost);
    this._upgrades.update(list =>
      list.map(u =>
        u.id === upgradeId
          ? { ...u, currentLevel: u.currentLevel + 1 }
          : u
      )
    );
    this.addNotification(`Upgraded ${upgrade.name} to level ${upgrade.currentLevel + 1}!`, 'task');
  }

  /** Get the current level of an upgrade by ID */
  getUpgradeLevel(id: string): number {
    return this._upgrades().find(u => u.id === id)?.currentLevel ?? 0;
  }

  // ─── Notoriety actions ──────────────────────
  /** Pay gold to reduce notoriety by 10 */
  payBribe(): void {
    const cost = bribeCost(this._notoriety());
    if (this._gold() < cost) return;
    if (this._notoriety() <= 0) return;

    this._gold.update(g => g - cost);
    this._notoriety.update(n => Math.max(0, n - 10));
    this.addNotification(`Bribed officials (-10 notoriety, -${cost}g)`, 'task');
  }

  /** Click to defend during a hero raid */
  defendRaid(): void {
    if (!this._raidActive()) return;
    this._raidTimer.update(t => t - 1);
    if (this._raidTimer() <= 0) {
      this._raidActive.set(false);
      this._notoriety.update(n => Math.max(0, n - 20));
      this.addNotification('Hero raid repelled! (-20 notoriety)', 'task');
    }
  }

  // ─── Mission Board actions ─────────────────
  /** Player accepts a mission from the board */
  acceptMission(missionId: string): void {
    const active = this._activeMissions();
    if (active.length >= this.activeSlots()) return; // no room

    const mission = this._missionBoard().find(m => m.id === missionId);
    if (!mission) return;

    // Remove from board, add to active
    this._missionBoard.update(board => board.filter(m => m.id !== missionId));
    this._activeMissions.update(list => [...list, { ...mission, status: 'queued' as TaskStatus }]);
  }

  // ─── Manual work (clicking) ────────────────
  clickTask(taskId: string): void {
    const power = this.clickPower();
    const clickGoldBonus = 1 + this.getUpgradeLevel('click-gold') * 0.15;

    this._activeMissions.update(queue =>
      queue.map(task => {
        if (task.id !== taskId) return task;
        if (task.status === 'complete') return task;
        if (task.assignedMinionId) return task;

        const newClicks = task.clicksRemaining - power;
        if (newClicks <= 0) {
          if (task.isCoverOp) {
            this.completeCoverOp(task.template.name);
          } else {
            const bonusGold = Math.round(task.goldReward * clickGoldBonus);
            this.awardGold(bonusGold, task.template.name, task.tier, task.template.category);
          }
          return { ...task, status: 'complete' as TaskStatus, clicksRemaining: 0 };
        }
        return {
          ...task,
          status: 'in-progress' as TaskStatus,
          clicksRemaining: newClicks,
        };
      })
    );
    this.cleanCompletedTasks();
  }

  // ─── Hire minion ───────────────────────────
  hireMinion(): void {
    const cost = this.nextMinionCost();
    if (this._gold() < cost) return;

    this._gold.update(g => g - cost);
    const minion = this.createMinion();
    this._minions.update(list => [...list, minion]);

    const specialtyLabel = minion.specialty.charAt(0).toUpperCase() + minion.specialty.slice(1);
    this.addNotification(
      `${minion.name} joined! Spd:${minion.stats.speed.toFixed(1)} Eff:${minion.stats.efficiency.toFixed(1)} [${specialtyLabel}]`,
      'minion'
    );
  }

  // ─── Tick (called every 1s) ────────────────
  tickTime(): void {
    const now = Date.now();

    // 1. Decrement timers for minion-worked active missions
    this._activeMissions.update(queue =>
      queue.map(task => {
        if (task.status !== 'in-progress' || !task.assignedMinionId) return task;

        const minion = this._minions().find(m => m.id === task.assignedMinionId);
        const speedMult = minion ? this.getMinionSpeedMultiplier(minion, task.template.category) : 1;
        const newTime = task.timeRemaining - speedMult;

        if (newTime <= 0) {
          if (task.isCoverOp) {
            this.completeCoverOp(task.template.name);
          } else {
            const effMult = minion ? this.getMinionEfficiencyMultiplier(minion, task.template.category) : 1;
            const bonusGold = Math.round(task.goldReward * effMult);
            this.awardGold(bonusGold, task.template.name, task.tier, task.template.category);
          }
          this.freeMinionFromTask(task.assignedMinionId, task.tier, task.template.category);
          return { ...task, status: 'complete' as TaskStatus, timeRemaining: 0 };
        }
        return { ...task, timeRemaining: newTime };
      })
    );

    // 2. Remove completed active missions
    this.cleanCompletedTasks();

    // 3. Expire Special Ops from the board that have timed out
    this._missionBoard.update(board =>
      board.filter(m => {
        if (!m.isSpecialOp || !m.specialOpExpiry) return true;
        return now < m.specialOpExpiry;
      })
    );

    // 4. Refill mission board continuously (refresh speed affected by upgrade)
    const refreshSpeedMult = 1 - this.getUpgradeLevel('board-refresh') * 0.20;
    const effectiveRefresh = this.BOARD_REFRESH_INTERVAL * Math.max(0.2, refreshSpeedMult);
    if (now - this.lastBoardRefresh >= effectiveRefresh) {
      this.fillBoard();
      this.lastBoardRefresh = now;
    }

    // 5. Auto-assign idle minions to queued active missions
    this.autoAssignMinions();

    // 6. Hero raid events: chance per tick when notoriety >= 60
    if (!this._raidActive() && this._notoriety() >= 60) {
      if (Math.random() < this.RAID_CHANCE_PER_TICK) {
        this._raidActive.set(true);
        this._raidTimer.set(this.RAID_DURATION);
        this.addNotification('HERO RAID! Click to defend or lose a minion!', 'task');
      }
    }

    // 7. Raid countdown: if not defended in time, lose a minion
    if (this._raidActive()) {
      this._raidTimer.update(t => t - 1);
      if (this._raidTimer() <= 0) {
        this._raidActive.set(false);
        // Lose a random idle minion (or any minion if none idle)
        const minions = this._minions();
        if (minions.length > 0) {
          const idle = minions.filter(m => m.status === 'idle');
          const target = idle.length > 0
            ? idle[Math.floor(Math.random() * idle.length)]
            : minions[Math.floor(Math.random() * minions.length)];

          // If the target was working, free the task
          if (target.assignedTaskId) {
            this._activeMissions.update(queue =>
              queue.map(t =>
                t.assignedMinionId === target.id
                  ? { ...t, status: 'queued' as TaskStatus, assignedMinionId: null }
                  : t
              )
            );
          }

          this._minions.update(list => list.filter(m => m.id !== target.id));
          this.addNotification(`Heroes captured ${target.name}! (-1 minion)`, 'minion');
        }
        this._notoriety.update(n => Math.max(0, n - 15));
      }
    }

    // 8. Clean old notifications
    this._notifications.update(list =>
      list.filter(n => now - n.timestamp < 4000)
    );
  }

  dismissNotification(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  // ─── Minion stat helpers ───────────────────
  private getMinionSpeedMultiplier(minion: Minion, taskCategory: TaskCategory): number {
    let speed = minion.stats.speed;
    speed += (minion.level - 1) * 0.02;
    if (minion.specialty === taskCategory) {
      speed += SPECIALTY_BONUS;
    }
    // Global speed upgrade: +8% per level
    speed *= 1 + this.getUpgradeLevel('minion-speed') * 0.08;
    return speed;
  }

  private getMinionEfficiencyMultiplier(minion: Minion, taskCategory: TaskCategory): number {
    let eff = minion.stats.efficiency;
    eff += (minion.level - 1) * 0.03;
    if (minion.specialty === taskCategory) {
      eff += SPECIALTY_BONUS;
    }
    // Global efficiency upgrade: +8% per level
    eff *= 1 + this.getUpgradeLevel('minion-efficiency') * 0.08;
    return eff;
  }

  // ─── Board management ─────────────────────
  /** Fill the mission board up to capacity */
  private fillBoard(): void {
    const capacity = this.boardCapacity();
    const current = this._missionBoard().length;
    const toSpawn = capacity - current;

    if (toSpawn <= 0) return;

    const newMissions: Task[] = [];
    for (let i = 0; i < toSpawn; i++) {
      newMissions.push(this.createBoardMission());
    }
    this._missionBoard.update(board => [...board, ...newMissions]);
  }

  private createBoardMission(): Task {
    // Chance to spawn "Cover Your Tracks" mission when notoriety > 20
    if (this._notoriety() > 20 && Math.random() < this.COVER_TRACKS_CHANCE) {
      return this.createCoverTracksMission();
    }

    const template = this.pickRandomTemplate();
    const config = TIER_CONFIG[template.tier];

    const levelBonus = 1 + (this.villainLevel() - 1) * GOLD_SCALE_PER_LEVEL;
    let scaledGold = Math.round(config.gold * levelBonus);

    const isSpecialOp = Math.random() < this.SPECIAL_OP_CHANCE;
    if (isSpecialOp) {
      scaledGold = Math.round(scaledGold * 1.5);
    }

    return {
      id: crypto.randomUUID(),
      template,
      status: 'queued',
      tier: template.tier,
      goldReward: scaledGold,
      timeToComplete: config.time,
      timeRemaining: config.time,
      clicksRequired: config.clicks,
      clicksRemaining: config.clicks,
      assignedMinionId: null,
      queuedAt: Date.now(),
      isSpecialOp,
      specialOpExpiry: isSpecialOp ? Date.now() + this.SPECIAL_OP_DURATION : undefined,
    };
  }

  private createCoverTracksMission(): Task {
    const coverTracksTemplates: TaskTemplate[] = [
      { name: 'Bribe the Witnesses', description: 'Pay off everyone who saw anything. Reduces notoriety.', category: 'schemes', tier: 'petty' },
      { name: 'Destroy the Evidence', description: 'Shred documents and wipe security footage. Reduces notoriety.', category: 'mayhem', tier: 'petty' },
      { name: 'Forge Alibis', description: 'Create airtight cover stories for your minions. Reduces notoriety.', category: 'schemes', tier: 'sinister' },
      { name: 'Hack Police Database', description: 'Delete your criminal records digitally. Reduces notoriety.', category: 'research', tier: 'sinister' },
    ];
    const template = coverTracksTemplates[Math.floor(Math.random() * coverTracksTemplates.length)];
    const config = TIER_CONFIG[template.tier];

    return {
      id: crypto.randomUUID(),
      template,
      status: 'queued',
      tier: template.tier,
      goldReward: 0, // No gold, but reduces notoriety
      timeToComplete: Math.floor(config.time * 0.6), // Faster than normal
      timeRemaining: Math.floor(config.time * 0.6),
      clicksRequired: Math.floor(config.clicks * 0.5),
      clicksRemaining: Math.floor(config.clicks * 0.5),
      assignedMinionId: null,
      queuedAt: Date.now(),
      isCoverOp: true,
    };
  }

  private pickRandomTemplate(): TaskTemplate {
    const level = this.villainLevel();

    // Determine desired tier based on villain level weights
    const pettyWeight = Math.max(10, 70 - (level - 1) * 5);
    const legendaryWeight = level >= 8 ? Math.min(25, (level - 7) * 4) : 0;
    const diabolicalWeight = Math.min(40, 5 + (level - 1) * 4);
    const sinisterWeight = 100 - pettyWeight - diabolicalWeight - legendaryWeight;

    const roll = Math.random() * 100;
    let desiredTier: TaskTier;
    if (roll < pettyWeight) desiredTier = 'petty';
    else if (roll < pettyWeight + sinisterWeight) desiredTier = 'sinister';
    else if (roll < pettyWeight + sinisterWeight + diabolicalWeight) desiredTier = 'diabolical';
    else desiredTier = 'legendary';

    // Pick a random category, then check department gating
    const categories: TaskCategory[] = ['schemes', 'heists', 'research', 'mayhem'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const depts = this._departments();
    const deptLevel = depts[category].level;
    const allowedTiers = availableTiersForDeptLevel(deptLevel);

    // If desired tier isn't unlocked for this dept, fall back to the highest available
    let tier = desiredTier;
    if (!allowedTiers.includes(tier)) {
      tier = allowedTiers[allowedTiers.length - 1];
    }

    // Get candidates from the pool matching category + tier
    let candidates = TASK_POOL.filter(t => t.category === category && t.tier === tier);
    // Fallback: if no candidates (e.g., legendary with no legendary templates for this category),
    // try any template of this tier, then fall to any in category
    if (candidates.length === 0) {
      candidates = TASK_POOL.filter(t => t.tier === tier);
    }
    if (candidates.length === 0) {
      candidates = TASK_POOL.filter(t => t.category === category);
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /** Smart auto-assign: considers specialty matching */
  private autoAssignMinions(): void {
    const idle = [...this.idleMinions()];
    if (idle.length === 0) return;

    const queued = this._activeMissions().filter(t => t.status === 'queued');
    if (queued.length === 0) return;

    const tierPriority: Record<TaskTier, number> = {
      legendary: 4,
      diabolical: 3,
      sinister: 2,
      petty: 1,
    };
    const sorted = [...queued].sort((a, b) => tierPriority[b.tier] - tierPriority[a.tier]);

    const assignedMinionIds = new Set<string>();

    for (const task of sorted) {
      if (assignedMinionIds.size >= idle.length) break;

      const available = idle.filter(m => !assignedMinionIds.has(m.id));
      if (available.length === 0) break;

      const specialtyMatch = available.find(m => m.specialty === task.template.category);
      const chosen = specialtyMatch || available[0];

      assignedMinionIds.add(chosen.id);
      this.assignMinionToTask(chosen.id, task.id);
    }
  }

  private assignMinionToTask(minionId: string, taskId: string): void {
    this._activeMissions.update(queue =>
      queue.map(t =>
        t.id === taskId
          ? { ...t, status: 'in-progress' as TaskStatus, assignedMinionId: minionId }
          : t
      )
    );
    this._minions.update(list =>
      list.map(m =>
        m.id === minionId
          ? { ...m, status: 'working' as const, assignedTaskId: taskId }
          : m
      )
    );
  }

  private freeMinionFromTask(minionId: string, taskTier: TaskTier, taskCategory: TaskCategory): void {
    const baseXp = this.TIER_XP[taskTier];
    const xpBonus = 1 + this.getUpgradeLevel('minion-xp') * 0.20;
    const xpGain = Math.round(baseXp * xpBonus);

    this._minions.update(list =>
      list.map(m => {
        if (m.id !== minionId) return m;
        const newXp = m.xp + xpGain;
        const newLevel = levelFromXp(newXp);
        const didLevelUp = newLevel > m.level;

        if (didLevelUp) {
          this.addNotification(`${m.name} reached level ${newLevel}!`, 'minion');
        }

        return {
          ...m,
          status: 'idle' as const,
          assignedTaskId: null,
          xp: newXp,
          level: newLevel,
        };
      })
    );
  }

  /** Call when a cover-op mission completes */
  private completeCoverOp(taskName: string): void {
    this._notoriety.update(n => Math.max(0, n - COVER_TRACKS_REDUCTION));
    this._completedCount.update(c => c + 1);
    this.addNotification(`"${taskName}" — notoriety reduced by ${COVER_TRACKS_REDUCTION}!`, 'task');
  }

  private awardGold(amount: number, taskName: string, taskTier?: TaskTier, taskCategory?: TaskCategory): void {
    // Apply notoriety gold penalty
    const penalty = notorietyGoldPenalty(this._notoriety());
    const finalAmount = Math.round(amount * (1 - penalty));

    this._gold.update(g => g + finalAmount);
    this._totalGoldEarned.update(g => g + finalAmount);
    this._completedCount.update(c => c + 1);

    const penaltyNote = penalty > 0 ? ` (${Math.round(penalty * 100)}% heat penalty)` : '';
    this.addNotification(`+${finalAmount}g from "${taskName}"${penaltyNote}`, 'gold');

    // Award department XP
    if (taskTier && taskCategory) {
      this.awardDeptXp(taskCategory, taskTier);
    }

    // Increase notoriety
    if (taskTier) {
      const notGain = NOTORIETY_PER_TIER[taskTier];
      // Research dept reduces notoriety gain: -5% per dept level above 1
      const researchLevel = this._departments().research.level;
      const researchReduction = Math.max(0, (researchLevel - 1) * 0.05);
      const reducedGain = Math.max(1, Math.round(notGain * (1 - researchReduction)));
      this._notoriety.update(n => Math.min(MAX_NOTORIETY, n + reducedGain));
    }
  }

  private awardDeptXp(category: TaskCategory, tier: TaskTier): void {
    const baseXp = DEPT_TIER_XP[tier];
    const deptBonus = 1 + this.getUpgradeLevel('dept-xp-boost') * 0.15;
    const xpGain = Math.round(baseXp * deptBonus);
    this._departments.update(depts => {
      const dept = depts[category];
      const newXp = dept.xp + xpGain;
      const newLevel = deptLevelFromXp(newXp);
      const didLevelUp = newLevel > dept.level;

      if (didLevelUp) {
        const unlocked = availableTiersForDeptLevel(newLevel);
        const highest = unlocked[unlocked.length - 1];
        this.addNotification(
          `${category.charAt(0).toUpperCase() + category.slice(1)} dept reached level ${newLevel}! (${highest} unlocked)`,
          'task'
        );
      }

      return {
        ...depts,
        [category]: { ...dept, xp: newXp, level: newLevel },
      };
    });
  }

  private cleanCompletedTasks(): void {
    this._activeMissions.update(queue =>
      queue.filter(t => t.status !== 'complete')
    );
  }

  private createMinion(): Minion {
    const name = this.pickMinionName();
    const color = MINION_COLORS[Math.floor(Math.random() * MINION_COLORS.length)];
    const accessory = MINION_ACCESSORIES[Math.floor(Math.random() * MINION_ACCESSORIES.length)];
    const specialty = SPECIALTY_CATEGORIES[Math.floor(Math.random() * SPECIALTY_CATEGORIES.length)];

    const randStat = () => {
      const r = (Math.random() + Math.random()) / 2;
      return Math.round((0.7 + r * 0.6) * 100) / 100;
    };

    return {
      id: crypto.randomUUID(),
      name,
      appearance: { color, accessory } as MinionAppearance,
      status: 'idle',
      assignedTaskId: null,
      stats: { speed: randStat(), efficiency: randStat() },
      specialty,
      xp: 0,
      level: 1,
    };
  }

  private pickMinionName(): string {
    if (this.usedNameIndices.size >= MINION_NAMES.length) {
      this.usedNameIndices.clear();
    }
    let idx: number;
    do {
      idx = Math.floor(Math.random() * MINION_NAMES.length);
    } while (this.usedNameIndices.has(idx));
    this.usedNameIndices.add(idx);
    return MINION_NAMES[idx];
  }

  private addNotification(message: string, type: GameNotification['type']): void {
    const notification: GameNotification = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: Date.now(),
    };
    this._notifications.update(list => [...list, notification]);
  }
}
