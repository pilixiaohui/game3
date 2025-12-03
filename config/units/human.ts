

import { UnitType, UnitConfig } from '../../types';

export const HUMAN_UNIT_CONFIGS: Partial<Record<UnitType, UnitConfig>> = {
  
  // ==========================================
  // TIER 1: INFANTRY (生物部队)
  // ==========================================
  
  [UnitType.HUMAN_MARINE]: { // [Existing] 标准单位
      id: UnitType.HUMAN_MARINE, name: '陆战队员 (Marine)',
      baseStats: { hp: 80, damage: 20, range: 220, speed: 80, attackSpeed: 0.8, width: 20, height: 32, color: 0x4ade80, armor: 5 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1, color: 0x333333 }, { type: 'CIRCLE', radiusPct: 0.4, yOffPct: -0.8, color: 0x4ade80 }] }, // 绿色头盔
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0xffff00 } }, // 黄色子弹
          { id: 'GENE_BOIDS', params: { separationRadius: 20 } }
      ]
  },
  [UnitType.HUMAN_MILITIA]: { // 炮灰
      id: UnitType.HUMAN_MILITIA, name: '武装平民 (Militia)',
      baseStats: { hp: 40, damage: 8, range: 180, speed: 70, attackSpeed: 1.2, width: 18, height: 28, color: 0x888888, armor: 0 },
      baseCost: {} as any, growthFactors: { hp: 0.05, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1, color: 0x777777 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK' },
          { id: 'GENE_BOIDS', params: { separationRadius: 15 } }
      ]
  },
  [UnitType.HUMAN_K9_UNIT]: { // 快速近战
      id: UnitType.HUMAN_K9_UNIT, name: '军犬 (K9)',
      baseStats: { hp: 60, damage: 20, range: 20, speed: 250, attackSpeed: 0.6, width: 20, height: 12, color: 0x8B4513, armor: 0 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 0.6, color: 0x8B4513 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_MELEE_ATTACK' },
          { id: 'GENE_DASH_CHARGE', params: { speedMult: 2.0 } },
          { id: 'GENE_BOIDS', params: { separationRadius: 15 } }
      ]
  },
  [UnitType.HUMAN_SCOUT]: {
      id: UnitType.HUMAN_SCOUT, name: '侦察兵 (Scout)',
      baseStats: { hp: 50, damage: 10, range: 200, speed: 100, attackSpeed: 0.6, width: 18, height: 28, color: 0xaaaaaa, armor: 0 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.6, heightPct: 1, color: 0x999999 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } }, { id: 'GENE_COMBAT_MOVEMENT', params: { speedMult: 1.2 } }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }, { id: 'GENE_BOIDS', params: { separationRadius: 20 } }]
  },
  [UnitType.HUMAN_MEDIC]: { // 辅助
      id: UnitType.HUMAN_MEDIC, name: '医疗兵 (Medic)',
      baseStats: { hp: 100, damage: 0, range: 200, speed: 75, attackSpeed: 1.0, width: 22, height: 30, color: 0xffffff, armor: 5 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1, color: 0xffffff }, { type: 'RECT', widthPct: 0.6, heightPct: 0.2, color: 0xff0000 }, { type: 'RECT', widthPct: 0.2, heightPct: 0.6, color: 0xff0000 }] }, // 红十字
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' }, // Follow logic handled by BOIDS mostly
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_COMMAND_AURA', params: { range: 200 } }, // 复用光环作为治疗/Buff
          { id: 'GENE_BOIDS', params: { separationRadius: 25 } }
      ]
  },
  [UnitType.HUMAN_ENGINEER]: {
      id: UnitType.HUMAN_ENGINEER, name: '工程师 (Engineer)',
      baseStats: { hp: 60, damage: 5, range: 150, speed: 60, attackSpeed: 1.0, width: 20, height: 28, color: 0xddaa00, armor: 0 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1, color: 0xccaa00 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }, { id: 'GENE_SPAWN_BROOD', params: { count: 1, unitType: UnitType.HUMAN_TURRET_MG } }, { id: 'GENE_BOIDS' }]
  },
  [UnitType.HUMAN_RIOT]: { // [Existing] 盾牌
      id: UnitType.HUMAN_RIOT, name: '防暴盾卫 (Riot)',
      baseStats: { hp: 350, damage: 15, range: 40, speed: 60, attackSpeed: 1.5, width: 30, height: 34, color: 0x1e3a8a, armor: 40 },
      baseCost: {} as any, growthFactors: { hp: 0.15, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1 }, { type: 'RECT', widthPct: 0.4, heightPct: 1.2, xOffPct: -0.6, colorDarken: 0.2 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 300 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_MELEE_ATTACK' },
          { id: 'GENE_HARDENED_SKIN', params: { amount: 5 } }, // Nerfed from 10 to 5 to allow chip damage
          { id: 'GENE_BOIDS', params: { separationRadius: 35 } }
      ]
  },
  [UnitType.HUMAN_RECON_DRONE]: {
      id: UnitType.HUMAN_RECON_DRONE, name: '侦查无人机',
      baseStats: { hp: 40, damage: 5, range: 250, speed: 120, attackSpeed: 0.5, width: 15, height: 10, color: 0xcccccc, armor: 0 },
      baseCost: {} as any, growthFactors: { hp: 0.05, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'CIRCLE', radiusPct: 1.0, color: 0xcccccc }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_GHOST_WALK' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }]
  },
  [UnitType.HUMAN_PYRO]: { // [Existing] 火焰兵
      id: UnitType.HUMAN_PYRO,
      name: '火焰兵 (Pyro)',
      baseStats: { hp: 150, damage: 25, range: 120, speed: 60, attackSpeed: 0.5, width: 24, height: 32, color: 0xea580c, armor: 20 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'THERMAL', statusPerHit: 20 }, // Increased status per hit since hits are slower
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK', params: {} },
          { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 10 } }, 
          { id: 'GENE_ELEMENTAL_HIT', params: {} },
          { id: 'GENE_BOIDS', params: { separationRadius: 30, separationForce: 200.0, cohesionWeight: 0.0 } }
      ]
  },

  // ==========================================
  // TIER 2: SPECIALISTS (特种步兵)
  // ==========================================

  [UnitType.HUMAN_GRENADIER]: { // 投弹手
      id: UnitType.HUMAN_GRENADIER, name: '掷弹兵 (Grenadier)',
      baseStats: { hp: 120, damage: 35, range: 300, speed: 70, attackSpeed: 2.0, width: 24, height: 30, color: 0x556b2f, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'THERMAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.9, heightPct: 1, color: 0x556b2f }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 30, color: 0xffaa00 } }, // 抛物线
          { id: 'GENE_SPLASH_ZONE', params: { range: 60, ratio: 0.5 } }, // 爆炸溅射
          { id: 'GENE_BOIDS' }
      ]
  },
  [UnitType.HUMAN_SHOCK_TROOPER]: { // 磁暴步兵
      id: UnitType.HUMAN_SHOCK_TROOPER, name: '磁暴步兵 (Tesla Trooper)',
      baseStats: { hp: 150, damage: 20, range: 180, speed: 60, attackSpeed: 1.0, width: 28, height: 34, color: 0x0000ff, armor: 20 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'VOLTAIC' },
      visual: { shapes: [{ type: 'CIRCLE', radiusPct: 0.8, color: 0x4444ff }, { type: 'RECT', widthPct: 1.2, heightPct: 0.6, yOffPct: -0.5, color: 0x8888ff }] }, // 肩部线圈
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_CHAIN_ARC', params: { range: 120, maxDepth: 2 } }, // 连锁攻击
          { id: 'GENE_BOIDS' }
      ]
  },
  [UnitType.HUMAN_SNIPER]: { // [Existing] 狙击
      id: UnitType.HUMAN_SNIPER, name: '幽灵狙击手 (Ghost)',
      baseStats: { hp: 60, damage: 150, range: 600, speed: 60, attackSpeed: 3.5, width: 18, height: 30, color: 0x222222, armor: 0 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.6, heightPct: 1, color: 0x222222 }, { type: 'CIRCLE', radiusPct: 0.2, yOffPct: -0.9, color: 0xff0000 }] }, // 护目镜
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 700 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK', params: { projectileSpeed: 30, projectileColor: 0xffffff } },
          { id: 'GENE_EXECUTE', params: { threshold: 0.4, multiplier: 2.5 } }, // 斩杀低血量
          { id: 'GENE_BOIDS' }
      ]
  },
  [UnitType.HUMAN_CRYO_TROOPER]: { // 冷冻兵
      id: UnitType.HUMAN_CRYO_TROOPER, name: '冷冻兵 (Cryo)',
      baseStats: { hp: 140, damage: 10, range: 150, speed: 60, attackSpeed: 0.5, width: 26, height: 32, color: 0x00ffff, armor: 15 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'CRYO' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1, color: 0xa5f3fc }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_ELEMENTAL_HIT', params: { amount: 20 } }, // 高层数冰冻
          { id: 'GENE_CLEAVE_ATTACK', params: { radius: 100 } }, // 喷射
          { id: 'GENE_BOIDS' }
      ]
  },
  [UnitType.HUMAN_CHEM_TROOPER]: {
      id: UnitType.HUMAN_CHEM_TROOPER, name: '化学兵 (Chem)',
      baseStats: { hp: 140, damage: 10, range: 150, speed: 60, attackSpeed: 0.8, width: 24, height: 32, color: 0x00ff00, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'TOXIN', statusPerHit: 15 },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1, color: 0x00aa00 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_ELEMENTAL_HIT' }, { id: 'GENE_SPLASH_ZONE', params: { range: 80, ratio: 0.5 } }, { id: 'GENE_BOIDS' }]
  },
  [UnitType.HUMAN_ROCKET_TROOPER]: {
      id: UnitType.HUMAN_ROCKET_TROOPER, name: '火箭兵 (Rocket)',
      baseStats: { hp: 100, damage: 40, range: 350, speed: 60, attackSpeed: 1.5, width: 24, height: 32, color: 0x8b0000, armor: 5 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1, color: 0x8b0000 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 20, color: 0xffff00 } }, { id: 'GENE_BOIDS' }]
  },
  [UnitType.HUMAN_GHOST]: {
      id: UnitType.HUMAN_GHOST, name: '幽灵特工 (Ghost Ops)',
      baseStats: { hp: 100, damage: 80, range: 500, speed: 70, attackSpeed: 2.0, width: 20, height: 30, color: 0x333333, armor: 0 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.6, heightPct: 1, color: 0x444444 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_GHOST_WALK' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }, { id: 'GENE_EXECUTE', params: { threshold: 0.3 } }]
  },

  // ==========================================
  // TIER 3: VEHICLES (载具)
  // ==========================================

  [UnitType.HUMAN_ASSAULT_BIKE]: { // 摩托车
      id: UnitType.HUMAN_ASSAULT_BIKE, name: '突击摩托 (Bike)',
      baseStats: { hp: 150, damage: 20, range: 150, speed: 200, attackSpeed: 0.5, width: 20, height: 40, color: 0x555555, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1.5, color: 0x333333 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } },
          { id: 'GENE_COMBAT_MOVEMENT', params: { speedMult: 1.5 } }, // 游击
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK' },
          { id: 'GENE_BOIDS', params: { separationRadius: 25 } }
      ]
  },
  [UnitType.HUMAN_TECHNICAL]: {
      id: UnitType.HUMAN_TECHNICAL, name: '武装皮卡',
      baseStats: { hp: 200, damage: 15, range: 200, speed: 150, attackSpeed: 0.3, width: 25, height: 40, color: 0x666666, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1.5, color: 0x555555 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT', params: { speedMult: 1.3 } }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }, { id: 'GENE_BOIDS' }]
  },
  [UnitType.HUMAN_VULTURE]: {
      id: UnitType.HUMAN_VULTURE, name: '秃鹫战车',
      baseStats: { hp: 180, damage: 25, range: 250, speed: 180, attackSpeed: 0.8, width: 25, height: 40, color: 0x777777, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1.5, color: 0x666666 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }, { id: 'GENE_BOIDS' }]
  },
  [UnitType.HUMAN_TANK]: { // [Existing] 主战坦克
      id: UnitType.HUMAN_TANK, name: '灰熊坦克 (Tank)',
      baseStats: { hp: 1200, damage: 80, range: 350, speed: 50, attackSpeed: 2.0, width: 45, height: 55, color: 0x4b5563, armor: 60 },
      baseCost: {} as any, growthFactors: { hp: 0.15, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1.2, color: 0x374151 }, { type: 'RECT', widthPct: 0.6, heightPct: 0.8, yOffPct: -0.2, color: 0x1f2937 }] }, // 炮塔
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK' },
          { id: 'GENE_SPLASH_ZONE', params: { range: 40, ratio: 0.5 } },
          { id: 'GENE_BOIDS', params: { separationRadius: 50, separationForce: 400 } }
      ]
  },
  [UnitType.HUMAN_FLAME_TANK]: {
      id: UnitType.HUMAN_FLAME_TANK, name: '喷火坦克',
      baseStats: { hp: 1400, damage: 40, range: 150, speed: 50, attackSpeed: 0.2, width: 45, height: 55, color: 0xaa4400, armor: 50 },
      baseCost: {} as any, growthFactors: { hp: 0.15, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'THERMAL', statusPerHit: 10 },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1.2, color: 0x883300 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_CLEAVE_ATTACK', params: { radius: 100 } }, { id: 'GENE_ELEMENTAL_HIT' }, { id: 'GENE_BOIDS' }]
  },
  [UnitType.HUMAN_TESLA_TANK]: {
      id: UnitType.HUMAN_TESLA_TANK, name: '磁暴坦克',
      baseStats: { hp: 1100, damage: 60, range: 250, speed: 50, attackSpeed: 1.5, width: 45, height: 55, color: 0x0000aa, armor: 50 },
      baseCost: {} as any, growthFactors: { hp: 0.15, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'VOLTAIC' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1.2, color: 0x000088 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_CHAIN_ARC', params: { range: 200, maxDepth: 3 } }, { id: 'GENE_BOIDS' }]
  },
  [UnitType.HUMAN_SIEGE_TANK]: { // 攻城坦克
      id: UnitType.HUMAN_SIEGE_TANK, name: '攻城坦克 (Siege)',
      baseStats: { hp: 800, damage: 150, range: 600, speed: 30, attackSpeed: 4.0, width: 50, height: 50, color: 0x78350f, armor: 40 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'THERMAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1.2, heightPct: 1.2, color: 0x78350f }, { type: 'CIRCLE', radiusPct: 0.4, color: 0x000000 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 800 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 80, color: 0xff4500 } }, // 远程火炮
          { id: 'GENE_SPLASH_ZONE', params: { range: 80, ratio: 0.8 } }, // 大范围溅射
          { id: 'GENE_BOIDS', params: { separationRadius: 55 } }
      ]
  },
  [UnitType.HUMAN_APC]: { // 运兵车
      id: UnitType.HUMAN_APC, name: '装甲运兵车 (APC)',
      baseStats: { hp: 1500, damage: 10, range: 200, speed: 60, attackSpeed: 0.5, width: 40, height: 60, color: 0x2f4f4f, armor: 50 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1.5, color: 0x2f4f4f }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK' },
          { id: 'GENE_SPAWN_BROOD', params: { count: 3, unitType: UnitType.HUMAN_MARINE } }, // 亡语：掉出 3 个机枪兵
          { id: 'GENE_BOIDS', params: { separationRadius: 50 } }
      ]
  },
  [UnitType.HUMAN_GOLIATH]: { // 歌利亚
      id: UnitType.HUMAN_GOLIATH, name: '歌利亚机甲 (Goliath)',
      baseStats: { hp: 1000, damage: 30, range: 400, speed: 50, attackSpeed: 0.5, width: 40, height: 50, color: 0x444444, armor: 40 },
      baseCost: {} as any, growthFactors: { hp: 0.15, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 0.6, yOffPct: -0.5 }, { type: 'RECT', widthPct: 0.4, heightPct: 0.8, yOffPct: 0.5, xOffPct: -0.4 }, { type: 'RECT', widthPct: 0.4, heightPct: 0.8, yOffPct: 0.5, xOffPct: 0.4 }] }, // 双足
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0xffff00 } }, // 机炮
          { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 20, color: 0xffffff } }, // 导弹 (双重攻击模拟)
          { id: 'GENE_BOIDS', params: { separationRadius: 45 } }
      ]
  },

  // ==========================================
  // TIER 4: EXPERIMENTAL & AIR (决战兵器)
  // ==========================================
  [UnitType.HUMAN_RAILGUN_MECH]: {
      id: UnitType.HUMAN_RAILGUN_MECH, name: '磁轨炮机甲',
      baseStats: { hp: 2000, damage: 300, range: 700, speed: 30, attackSpeed: 5.0, width: 50, height: 70, color: 0x333333, armor: 60 },
      baseCost: {} as any, growthFactors: { hp: 0.15, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1.5, color: 0x222222 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET', params: { range: 800 } }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK', params: { projectileSpeed: 50, projectileColor: 0x00ffff } }, { id: 'GENE_EXECUTE', params: { threshold: 0.5, multiplier: 2.0 } }, { id: 'GENE_BOIDS' }]
  },
  [UnitType.HUMAN_TITAN_WALKER]: { // 泰坦
      id: UnitType.HUMAN_TITAN_WALKER, name: '雷神泰坦 (Thor)',
      baseStats: { hp: 5000, damage: 200, range: 400, speed: 20, attackSpeed: 3.0, width: 80, height: 80, color: 0x111111, armor: 100 },
      baseCost: {} as any, growthFactors: { hp: 0.2, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'VOLTAIC' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1.5, heightPct: 1.5, color: 0x222222 }, { type: 'RECT', widthPct: 0.3, heightPct: 1.0, xOffPct: -0.8 }, { type: 'RECT', widthPct: 0.3, heightPct: 1.0, xOffPct: 0.8 }] }, // 巨型加农炮
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 600 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 50, color: 0x00ffff } }, // 离子炮
          { id: 'GENE_SPLASH_ZONE', params: { range: 100, ratio: 1.0 } },
          { id: 'GENE_TERROR_PRESENCE', params: { range: 300 } }, // 威慑
          { id: 'GENE_BOIDS', params: { separationRadius: 90, separationForce: 1000 } }
      ]
  },
  [UnitType.HUMAN_BATTLECRUISER]: { // 战巡
      id: UnitType.HUMAN_BATTLECRUISER, name: '战列巡洋舰 (BC)',
      baseStats: { hp: 4000, damage: 30, range: 300, speed: 30, attackSpeed: 0.2, width: 100, height: 60, color: 0x555555, armor: 80 }, // 高攻速激光
      baseCost: {} as any, growthFactors: { hp: 0.2, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'THERMAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 2.0, heightPct: 1.0, color: 0x444444 }, { type: 'RECT', widthPct: 0.5, heightPct: 1.2, xOffPct: 0.8 }] }, // T型船身
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 600 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_GHOST_WALK' }, // 飞行
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0xff0000 } }, // 激光弹幕
          { id: 'GENE_BOIDS', params: { separationRadius: 100 } }
      ]
  },
  [UnitType.HUMAN_HELICOPTER]: { // 直升机
      id: UnitType.HUMAN_HELICOPTER, name: '女武神直升机',
      baseStats: { hp: 300, damage: 25, range: 250, speed: 120, attackSpeed: 0.5, width: 35, height: 20, color: 0x4b5320, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1.5, heightPct: 0.5, color: 0x4b5320 }, { type: 'RECT', widthPct: 2.0, heightPct: 0.1, yOffPct: -0.5, color: 0x000000 }] }, // 旋翼
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_GHOST_WALK' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK' }
      ]
  },
  [UnitType.HUMAN_FIGHTER_JET]: {
      id: UnitType.HUMAN_FIGHTER_JET, name: '喷气战机',
      baseStats: { hp: 200, damage: 50, range: 400, speed: 300, attackSpeed: 2.0, width: 30, height: 15, color: 0x999999, armor: 0 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1.2, heightPct: 0.4, color: 0x888888 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_GHOST_WALK' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }]
  },
  [UnitType.HUMAN_GUNSHIP]: {
      id: UnitType.HUMAN_GUNSHIP, name: '炮艇机',
      baseStats: { hp: 1200, damage: 15, range: 300, speed: 60, attackSpeed: 0.1, width: 60, height: 30, color: 0x444444, armor: 30 },
      baseCost: {} as any, growthFactors: { hp: 0.15, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 2.0, heightPct: 0.8, color: 0x333333 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_GHOST_WALK' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }]
  },
  [UnitType.HUMAN_BOMBER]: {
      id: UnitType.HUMAN_BOMBER, name: '轰炸机',
      baseStats: { hp: 800, damage: 200, range: 100, speed: 80, attackSpeed: 5.0, width: 70, height: 30, color: 0x222222, armor: 20 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'THERMAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 2.5, heightPct: 0.6, color: 0x111111 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_COMBAT_MOVEMENT' }, { id: 'GENE_GHOST_WALK' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 10 } }, { id: 'GENE_SPLASH_ZONE', params: { range: 100, ratio: 1.0 } }]
  },

  // ==========================================
  // TIER 5: STATIC DEFENSE (防御塔)
  // ==========================================

  [UnitType.HUMAN_BUNKER]: { // 碉堡
      id: UnitType.HUMAN_BUNKER, name: '防御碉堡',
      baseStats: { hp: 2000, damage: 20, range: 300, speed: 0, attackSpeed: 0.5, width: 60, height: 60, color: 0x333333, armor: 30 },
      baseCost: {} as any, growthFactors: { hp: 0.15, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1.2, heightPct: 1.2, color: 0x222222 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK' }, // 模拟驻军射击
          { id: 'GENE_BOIDS', params: { separationRadius: 60, separationForce: 1000 } } // 静态物体需要极大的斥力防止穿模
      ]
  },
  [UnitType.HUMAN_TURRET_MISSILE]: { // 导弹塔
      id: UnitType.HUMAN_TURRET_MISSILE, name: '导弹塔',
      baseStats: { hp: 800, damage: 100, range: 500, speed: 0, attackSpeed: 2.5, width: 40, height: 60, color: 0x666666, armor: 20 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'THERMAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1.5, color: 0x555555 }, { type: 'CIRCLE', radiusPct: 0.6, yOffPct: -0.8, color: 0xff0000 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 600 } },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 40, color: 0xffaa00 } },
          { id: 'GENE_GIANT_SLAYER', params: { extraPct: 0.05 } }, // 对大型单位加伤
          { id: 'GENE_BOIDS', params: { separationRadius: 40, separationForce: 1000 } }
      ]
  },
  [UnitType.HUMAN_TESLA_COIL]: { // 磁暴线圈
      id: UnitType.HUMAN_TESLA_COIL, name: '磁暴线圈',
      baseStats: { hp: 600, damage: 200, range: 250, speed: 0, attackSpeed: 3.0, width: 30, height: 70, color: 0x0000aa, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.15 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'VOLTAIC' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.4, heightPct: 2.0, color: 0x4444ff }, { type: 'CIRCLE', radiusPct: 1.0, yOffPct: -1.0, color: 0xaaaaff }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 300 } },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_CHAIN_ARC', params: { range: 200, maxDepth: 5, decay: 0.9 } }, // 强力连锁
          { id: 'GENE_BOIDS', params: { separationRadius: 40, separationForce: 1000 } }
      ]
  },
  [UnitType.HUMAN_TURRET_MG]: {
      id: UnitType.HUMAN_TURRET_MG, name: '机枪塔',
      baseStats: { hp: 500, damage: 15, range: 250, speed: 0, attackSpeed: 0.2, width: 30, height: 40, color: 0x555555, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1, color: 0x444444 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK' }, { id: 'GENE_BOIDS', params: { separationRadius: 40, separationForce: 1000 } }]
  },
  [UnitType.HUMAN_TURRET_CANNON]: {
      id: UnitType.HUMAN_TURRET_CANNON, name: '加农炮塔',
      baseStats: { hp: 1000, damage: 80, range: 400, speed: 0, attackSpeed: 3.0, width: 40, height: 50, color: 0x333333, armor: 20 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.1 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 1, heightPct: 1.2, color: 0x222222 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_SPLASH_ZONE', params: { range: 60, ratio: 0.6 } }, { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 30 } }, { id: 'GENE_BOIDS', params: { separationRadius: 50, separationForce: 1000 } }]
  },
  [UnitType.HUMAN_TURRET_LASER]: {
      id: UnitType.HUMAN_TURRET_LASER, name: '激光塔',
      baseStats: { hp: 600, damage: 40, range: 350, speed: 0, attackSpeed: 0.5, width: 20, height: 60, color: 0xff0000, armor: 10 },
      baseCost: {} as any, growthFactors: { hp: 0.1, damage: 0.05 }, slots: [], baseLoadCapacity: 0,
      elementConfig: { type: 'THERMAL' },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.5, heightPct: 1.5, color: 0x990000 }] },
      genes: [{ id: 'GENE_ACQUIRE_TARGET' }, { id: 'GENE_AUTO_ATTACK' }, { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0xff0000 } }, { id: 'GENE_BOIDS', params: { separationRadius: 40, separationForce: 1000 } }]
  }
};