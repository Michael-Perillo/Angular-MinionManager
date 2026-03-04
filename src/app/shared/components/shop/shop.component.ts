import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import {
  VoucherId, VoucherDefinition, VOUCHERS, UNLOCK_VOUCHER_IDS, UPGRADE_VOUCHER_IDS, ALL_VOUCHER_IDS,
  getVoucherCost, getVoucherEffect,
} from '../../../core/models/voucher.model';
import { TaskCategory } from '../../../core/models/task.model';
import {
  Department, DEPARTMENT_LABELS,
  getDeptLevelCost, getWorkerSlotCost, MANAGER_SLOT_COST, getDeptMult,
} from '../../../core/models/department.model';
import { MinionArchetype, MinionRarity, getRarityColor, getRarityBorderColor } from '../../../core/models/minion.model';

type ShopTab = 'departments' | 'hire' | 'upgrades';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <!-- Modal card -->
      <div class="bg-bg-secondary border border-accent/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col
                  shadow-2xl shadow-accent/10 animate-slide-up">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 class="text-lg font-display font-black text-text-primary uppercase tracking-wider">Shop</h2>
            <span class="text-xs text-text-muted">Expand your operation between quarters</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm font-bold text-gold">{{ gold() }} 🪙</span>
            <button
              (click)="continue.emit()"
              class="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider
                     bg-accent/20 text-accent border border-accent/30
                     hover:bg-accent/30 active:scale-95
                     transition-all cursor-pointer min-h-[40px]"
              data-testid="shop-continue">
              Continue ▶
            </button>
          </div>
        </div>

        <!-- Tab bar -->
        <div class="flex border-b border-border shrink-0">
          @for (tab of shopTabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="flex-1 py-2 px-3 text-xs font-semibold transition-colors cursor-pointer border-b-2"
              [class]="activeTab() === tab.id
                ? 'text-gold border-gold'
                : 'text-text-muted border-transparent hover:text-text-secondary'"
              [attr.data-testid]="'shop-tab-' + tab.id">
              {{ tab.icon }} {{ tab.label }}
            </button>
          }
        </div>

        <!-- Tab content -->
        <div class="flex-1 overflow-y-auto p-4">
          @switch (activeTab()) {
            @case ('departments') {
              <p class="text-xs text-text-muted mb-3">Upgrade departments, buy worker slots, and unlock managers.</p>

              <!-- Locked department unlocks (vouchers) -->
              @if (deptVoucherList().length > 0) {
                <div class="mb-4">
                  <h4 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Unlock Departments</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    @for (v of deptVoucherList(); track v.def.id) {
                      @if (!v.isMaxed) {
                        <button
                          (click)="purchase.emit(v.def.id)"
                          [disabled]="!v.canAfford"
                          class="flex items-center gap-2 p-3 rounded-lg text-left transition-all cursor-pointer min-h-[48px]"
                          [class]="v.canAfford
                            ? 'bg-gold/10 hover:bg-gold/20 border border-gold/30 active:scale-95'
                            : 'opacity-50 cursor-not-allowed bg-white/5 border border-white/10'"
                          [attr.data-testid]="'buy-' + v.def.id">
                          <span class="text-xl">{{ v.def.icon }}</span>
                          <div class="flex-1 min-w-0">
                            <div class="text-xs font-bold text-text-primary">{{ v.def.name }}</div>
                            <div class="text-[10px] text-gold font-semibold">{{ v.nextCost }} 🪙</div>
                          </div>
                        </button>
                      }
                    }
                  </div>
                </div>
              }

              <!-- Per-department upgrade cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (dept of deptUpgradeList(); track dept.category) {
                  <div class="rounded-lg border border-white/10 bg-surface-dark p-4"
                       [attr.data-testid]="'dept-card-' + dept.category">
                    <!-- Dept header -->
                    <div class="flex items-center gap-2 mb-3">
                      <span class="text-xl">{{ dept.icon }}</span>
                      <div class="flex-1">
                        <h3 class="text-sm font-bold text-text-primary">{{ dept.label }}</h3>
                        <span class="text-xs text-text-muted">
                          Lv.{{ dept.level }}
                          <span class="text-green-400 font-semibold">&times;{{ dept.mult }}</span>
                        </span>
                      </div>
                    </div>

                    <!-- Level up -->
                    @if (dept.canLevelUp) {
                      <button
                        (click)="purchaseDeptLevel.emit(dept.category)"
                        [disabled]="!dept.canAffordLevel"
                        class="w-full py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider
                               transition-all cursor-pointer mb-2 min-h-[32px]"
                        [class]="dept.canAffordLevel
                          ? 'bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 active:scale-95'
                          : 'opacity-50 cursor-not-allowed bg-white/5 text-text-muted border border-white/10'"
                        [attr.data-testid]="'level-up-' + dept.category">
                        Level Up → Lv.{{ dept.level + 1 }}
                        <span class="ml-1">({{ dept.levelCost }} 🪙)</span>
                      </button>
                    } @else {
                      <div class="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-2">MAX LEVEL</div>
                    }

                    <!-- Worker slots -->
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-xs text-text-muted">⚒️ Workers:</span>
                      <div class="flex items-center gap-0.5">
                        @for (pip of getSlotPips(4); track $index) {
                          <div class="w-2.5 h-2.5 rounded-full border"
                               [class]="pip <= dept.workerSlots
                                 ? 'bg-accent border-accent'
                                 : 'bg-transparent border-white/20'">
                          </div>
                        }
                      </div>
                      @if (dept.workerSlots < 4) {
                        <button
                          (click)="purchaseWorkerSlot.emit(dept.category)"
                          [disabled]="!dept.canAffordWorker"
                          class="ml-auto text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer min-h-[24px]"
                          [class]="dept.canAffordWorker
                            ? 'bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 active:scale-95'
                            : 'opacity-50 cursor-not-allowed bg-white/5 text-text-muted border border-white/10'"
                          [attr.data-testid]="'worker-slot-' + dept.category">
                          +Slot {{ dept.workerCost }} 🪙
                        </button>
                      } @else {
                        <span class="ml-auto text-[10px] text-green-400 font-bold">FULL</span>
                      }
                    </div>

                    <!-- Manager slot -->
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-text-muted">👔 Manager:</span>
                      @if (dept.hasManager) {
                        <span class="text-[10px] text-green-400 font-bold uppercase">Unlocked</span>
                      } @else {
                        <button
                          (click)="purchaseManagerSlot.emit(dept.category)"
                          [disabled]="!dept.canAffordManager"
                          class="ml-auto text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer min-h-[24px]"
                          [class]="dept.canAffordManager
                            ? 'bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 active:scale-95'
                            : 'opacity-50 cursor-not-allowed bg-white/5 text-text-muted border border-white/10'"
                          [attr.data-testid]="'manager-slot-' + dept.category">
                          Unlock {{ managerSlotCost }} 🪙
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            @case ('hire') {
              <div class="max-w-md mx-auto">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <div class="text-xs text-text-muted">Next minion cost</div>
                    <div class="text-lg font-bold text-gold">{{ hireCost() }}g</div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-text-muted">Your gold</div>
                    <div class="text-lg font-bold text-gold">{{ gold() }}g</div>
                  </div>
                </div>

                <!-- Draft pick cards -->
                <div class="grid grid-cols-3 gap-2 mb-3">
                  @for (option of hireOptions(); track option.id) {
                    <button
                      (click)="hire.emit(option.id)"
                      [disabled]="!canHire()"
                      class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-pointer
                             bg-bg-card hover:bg-bg-secondary"
                      [class]="getHireCardClasses(option)"
                      [attr.data-testid]="'hire-' + option.id">
                      <span class="text-2xl">{{ option.icon }}</span>
                      <span class="text-xs font-bold text-text-primary text-center leading-tight">{{ option.name }}</span>
                      <span class="text-[9px] font-bold uppercase tracking-wider" [class]="getRarityColor(option.rarity)">
                        {{ option.rarity }}
                      </span>
                      <span class="text-[9px] text-text-muted text-center leading-tight">{{ option.description }}</span>
                    </button>
                  }
                </div>

                <!-- Reroll button -->
                <button
                  (click)="reroll.emit()"
                  [disabled]="gold() < rerollCost()"
                  class="w-full py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider
                         transition-all cursor-pointer border mb-3"
                  [class]="gold() >= rerollCost()
                    ? 'bg-white/5 text-text-secondary border-border hover:bg-white/10'
                    : 'bg-white/5 text-text-muted border-border/50 cursor-not-allowed'"
                  data-testid="shop-reroll">
                  🎲 Reroll ({{ rerollCost() }}g)
                </button>

                <div class="text-xs text-text-muted text-center">
                  Minions: {{ minionCount() }} | Cost scales with each hire
                </div>
              </div>
            }

            @case ('upgrades') {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                @for (v of upgradeVoucherList(); track v.def.id) {
                  <div
                    class="rounded-lg p-4 transition-all"
                    [class]="v.isMaxed
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-surface-dark border border-white/10 hover:border-white/20'"
                    [attr.data-testid]="'voucher-' + v.def.id">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-2xl">{{ v.def.icon }}</span>
                      <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-bold text-text-primary truncate">{{ v.def.name }}</h3>
                        <p class="text-[10px] text-text-muted">{{ v.def.description }}</p>
                      </div>
                    </div>

                    <!-- Level pips (dynamic based on maxLevel) -->
                    <div class="flex items-center gap-1 mb-2">
                      @for (pip of getLevelPips(v.def.maxLevel); track $index) {
                        <div
                          class="w-3 h-3 rounded-full border"
                          [class]="pip <= v.level
                            ? 'bg-gold border-gold'
                            : 'bg-transparent border-white/20'">
                        </div>
                      }
                      @if (v.isMaxed) {
                        <span class="ml-auto text-[10px] font-bold text-green-400 uppercase tracking-wider">MAX</span>
                      }
                    </div>

                    @if (v.level > 0) {
                      <p class="text-xs text-text-secondary mb-2">
                        Current: <span class="text-gold font-semibold">{{ formatEffect(v.def, v.level) }}</span>
                      </p>
                    }
                    @if (!v.isMaxed) {
                      <p class="text-xs text-text-muted mb-3">
                        Next: <span class="text-text-secondary">{{ formatEffect(v.def, v.level + 1) }}</span>
                      </p>
                    }

                    @if (!v.isMaxed) {
                      <button
                        (click)="purchase.emit(v.def.id)"
                        [disabled]="!v.canAfford"
                        class="w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider
                               transition-all cursor-pointer min-h-[36px]"
                        [class]="v.canAfford
                          ? 'bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 active:scale-95'
                          : 'opacity-50 cursor-not-allowed bg-white/5 text-text-muted border border-white/10'"
                        [attr.data-testid]="'buy-' + v.def.id">
                        {{ v.nextCost }} 🪙
                      </button>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- Footer: summary of owned effects -->
        @if (hasAnyVoucher()) {
          <div class="px-6 py-3 border-t border-border shrink-0">
            <div class="flex flex-wrap gap-x-4 gap-y-1">
              @for (v of ownedSummary(); track v.id) {
                <span class="text-xs text-text-secondary">
                  {{ v.icon }} {{ v.name }}: <span class="text-gold font-semibold">{{ v.effectText }}</span>
                </span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class ShopComponent {
  // Existing inputs
  vouchers = input.required<Record<VoucherId, number>>();
  gold = input.required<number>();

  // Department inputs
  departments = input.required<Record<TaskCategory, Department>>();
  unlockedDepartments = input<TaskCategory[]>([]);

  // Hire inputs
  hireOptions = input<MinionArchetype[]>([]);
  hireCost = input<number>(0);
  canHire = input<boolean>(false);
  rerollCost = input<number>(0);
  minionCount = input<number>(0);

  // Existing outputs
  continue = output<void>();
  purchase = output<VoucherId>();

  // New outputs
  purchaseDeptLevel = output<TaskCategory>();
  purchaseWorkerSlot = output<TaskCategory>();
  purchaseManagerSlot = output<TaskCategory>();
  hire = output<string>();
  reroll = output<void>();

  activeTab = signal<ShopTab>('departments');

  readonly managerSlotCost = MANAGER_SLOT_COST;

  readonly shopTabs: { id: ShopTab; label: string; icon: string }[] = [
    { id: 'departments', label: 'Departments', icon: '🏛️' },
    { id: 'hire', label: 'Hire', icon: '👾' },
    { id: 'upgrades', label: 'Upgrades', icon: '🎫' },
  ];

  /** Department unlock vouchers (only show unowned ones) */
  readonly deptVoucherList = computed(() => {
    const levels = this.vouchers();
    const g = this.gold();
    return UNLOCK_VOUCHER_IDS.map(id => {
      const def = VOUCHERS[id];
      const level = levels[id];
      const isMaxed = level >= def.maxLevel;
      const nextCost = isMaxed ? 0 : getVoucherCost(id, level + 1);
      const canAfford = !isMaxed && g >= nextCost;
      return { def, level, isMaxed, nextCost, canAfford };
    });
  });

  /** Per-department upgrade data for unlocked departments */
  readonly deptUpgradeList = computed(() => {
    const depts = this.departments();
    const g = this.gold();
    const unlocked = this.unlockedDepartments();

    return unlocked.map(cat => {
      const dept = depts[cat];
      const label = DEPARTMENT_LABELS[cat];
      const canLevelUp = dept.level < 8;
      const levelCost = canLevelUp ? getDeptLevelCost(dept.level) : 0;
      const canAffordLevel = canLevelUp && g >= levelCost;
      const workerCost = dept.workerSlots < 4 ? getWorkerSlotCost(dept.workerSlots) : 0;
      const canAffordWorker = dept.workerSlots < 4 && g >= workerCost;
      const canAffordManager = !dept.hasManager && g >= MANAGER_SLOT_COST;

      return {
        category: cat,
        icon: label.icon,
        label: label.label,
        level: dept.level,
        mult: getDeptMult(dept.level),
        workerSlots: dept.workerSlots,
        hasManager: dept.hasManager,
        canLevelUp,
        levelCost,
        canAffordLevel,
        workerCost,
        canAffordWorker,
        canAffordManager,
      };
    });
  });

  readonly upgradeVoucherList = computed(() => {
    const levels = this.vouchers();
    const g = this.gold();
    return UPGRADE_VOUCHER_IDS.map(id => {
      const def = VOUCHERS[id];
      const level = levels[id];
      const isMaxed = level >= def.maxLevel;
      const nextCost = isMaxed ? 0 : getVoucherCost(id, level + 1);
      const canAfford = !isMaxed && g >= nextCost;
      return { def, level, isMaxed, nextCost, canAfford };
    });
  });

  readonly hasAnyVoucher = computed(() =>
    ALL_VOUCHER_IDS.some(id => this.vouchers()[id] > 0)
  );

  readonly ownedSummary = computed(() => {
    const levels = this.vouchers();
    return ALL_VOUCHER_IDS
      .filter(id => levels[id] > 0)
      .map(id => {
        const def = VOUCHERS[id];
        const level = levels[id];
        return {
          id,
          icon: def.icon,
          name: def.name,
          effectText: this.formatEffect(def, level),
        };
      });
  });

  getLevelPips(maxLevel: number): number[] {
    return Array.from({ length: maxLevel }, (_, i) => i + 1);
  }

  getSlotPips(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  formatEffect(def: VoucherDefinition, level: number): string {
    const value = getVoucherEffect(def.id, level);
    if (def.id === 'hire-discount') return `${Math.round(value * 100)}% discount`;
    if (UNLOCK_VOUCHER_IDS.includes(def.id)) return 'Unlocked';
    return `+${value} ${def.effectLabel}`;
  }

  getRarityColor(rarity: MinionRarity): string {
    return getRarityColor(rarity);
  }

  getHireCardClasses(option: MinionArchetype): string {
    const base = getRarityBorderColor(option.rarity);
    if (!this.canHire()) return `${base} opacity-60`;
    return `${base} hover:scale-105 active:scale-95`;
  }
}
