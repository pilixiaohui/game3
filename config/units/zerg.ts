
import { UnitType, UnitConfig } from '../../types';

export const PLAYABLE_UNITS = [
    // Originals
    UnitType.MELEE, 
    UnitType.RANGED, 
    UnitType.PYROVORE,
    UnitType.CRYOLISK,
    UnitType.OMEGALIS,
    
    // Tier 1
    UnitType.ZERGLING_RAPTOR,
    UnitType.EMBER_MITE,
    UnitType.SPARK_FLY,
    UnitType.FROST_WEEVIL,
    UnitType.ACID_MAGGOT,
    UnitType.BONE_BLADE,
    UnitType.ACID_SPITTER,
    UnitType.STATIC_ORB,
    UnitType.CINDER_LING,
    UnitType.FROST_SHARD,

    // Tier 2
    UnitType.LIGHTNING_SKINK,
    UnitType.SPINE_HURLER,
    UnitType.MAGMA_GOLEM,
    UnitType.PLAGUE_BEARER,
    UnitType.SIEGE_BEETLE,
    UnitType.FROST_WARD,
    UnitType.MAGMA_SPRAYER,
    UnitType.SHOCK_ROACH,
    UnitType.VILE_CRAWLER,

    // Tier 3
    UnitType.WINTER_WITCH,
    UnitType.PULSE_BEAST,
    UnitType.CORRUPTOR,
    UnitType.PHANTOM_ASSASSIN,
    UnitType.INFERNO_JUDGE,
    UnitType.CRYSTAL_WEAVER,

    // Tier 4
    UnitType.TYRANT_REX,
    UnitType.TEMPEST_LEVIATHAN,
    UnitType.STAR_EATER,
    UnitType.ETERNAL_GLACIER,
    UnitType.STORM_BRINGER,
    UnitType.ABYSSAL_MAW,
    UnitType.PESTILENCE_LORD,

    // Utility
    UnitType.QUEEN
];

export const ZERG_UNIT_CONFIGS: Partial<Record<UnitType, UnitConfig>> = {
  // --- ORIGINALS ---
  [UnitType.MELEE]: {
    id: UnitType.MELEE,
    name: '跳虫 (Zergling)',
    baseStats: { hp: 60, damage: 15, range: 20, speed: 180, attackSpeed: 0.4, width: 24, height: 24, color: 0x3b82f6, armor: 0 },
    baseCost: { biomass: 15, larva: 1, dna: 0, time: 1.0 },
    growthFactors: { hp: 0.2, damage: 0.2 },
    baseLoadCapacity: 30,
    slots: [{ polarity: 'ATTACK' }, { polarity: 'DEFENSE' }, { polarity: 'ATTACK' }, { polarity: 'FUNCTION' }, { polarity: 'UNIVERSAL' }],
    elementConfig: { type: 'PHYSICAL' },
    visual: { shapes: [{ type: 'ROUNDED_RECT', cornerRadius: 4, widthPct: 1, heightPct: 1 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 300 } },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_MELEE_ATTACK' },
        { id: 'GENE_VAMPIRIC', params: { ratio: 0.15 } },
        { id: 'GENE_DASH_CHARGE', params: { speedMult: 2.5 } },
        { id: 'GENE_RAMPAGE', params: { heal: 0.1 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 25, separationForce: 250.0, cohesionWeight: 0.05 } }
    ]
  },
  [UnitType.RANGED]: {
    id: UnitType.RANGED,
    name: '刺蛇 (Hydralisk)',
    baseStats: { hp: 45, damage: 30, range: 220, speed: 130, attackSpeed: 1.0, width: 20, height: 30, color: 0x8b5cf6, armor: 5 },
    baseCost: { biomass: 25, larva: 1, dna: 0, time: 4.0 },
    growthFactors: { hp: 0.15, damage: 0.25 },
    baseLoadCapacity: 30,
    slots: [{ polarity: 'ATTACK' }, { polarity: 'DEFENSE' }, { polarity: 'FUNCTION' }, { polarity: 'FUNCTION' }, { polarity: 'UNIVERSAL' }],
    elementConfig: { type: 'TOXIN', statusPerHit: 10 },
    visual: { shapes: [{ type: 'ROUNDED_RECT', cornerRadius: 4, widthPct: 1, heightPct: 1 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0x00ff00 } },
        { id: 'GENE_POISON_TOUCH', params: { stacks: 2 } },
        { id: 'GENE_EXECUTE', params: { threshold: 0.2, multiplier: 3.0 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 35, separationForce: 200.0, cohesionWeight: 0.05 } }
    ]
  },
  [UnitType.PYROVORE]: {
    id: UnitType.PYROVORE,
    name: '爆裂虫 (Scourge)',
    // Slight Nerf: Reduced speed to 220 from 250 to allow interception
    baseStats: { hp: 60, damage: 50, range: 280, speed: 220, attackSpeed: 0.8, width: 28, height: 28, color: 0xf87171, armor: 0 },
    baseCost: { biomass: 60, larva: 1, dna: 0, time: 5.0 },
    growthFactors: { hp: 0.15, damage: 0.3 },
    baseLoadCapacity: 40,
    slots: [{ polarity: 'ATTACK' }, { polarity: 'ATTACK' }, { polarity: 'FUNCTION' }],
    elementConfig: { type: 'THERMAL', statusPerHit: 20 },
    visual: { shapes: [{ type: 'ROUNDED_RECT', cornerRadius: 8, widthPct: 1, heightPct: 1 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 800 } },
        { id: 'GENE_COMBAT_MOVEMENT', params: { speedMult: 2.0, multiplier: 1.5 } },
        { id: 'GENE_GHOST_WALK' },
        { id: 'GENE_SELF_DESTRUCT' },
        { id: 'GENE_EXPLODE_ON_DEATH', params: { radius: 120, damage: 150 } }
    ]
  },
  [UnitType.CRYOLISK]: {
    id: UnitType.CRYOLISK,
    name: '冰牙兽 (Cryolisk)',
    baseStats: { hp: 180, damage: 12, range: 40, speed: 220, attackSpeed: 2.5, width: 22, height: 22, color: 0x60a5fa, armor: 10 },
    baseCost: { biomass: 40, larva: 1, dna: 0, time: 3.0 },
    growthFactors: { hp: 0.2, damage: 0.1 },
    baseLoadCapacity: 35,
    slots: [{ polarity: 'FUNCTION' }, { polarity: 'FUNCTION' }, { polarity: 'DEFENSE' }],
    elementConfig: { type: 'CRYO', statusPerHit: 8 },
    visual: { shapes: [{ type: 'ROUNDED_RECT', cornerRadius: 4, widthPct: 1, heightPct: 1 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } },
        { id: 'GENE_AUTO_ATTACK', params: {} },
        { id: 'GENE_MELEE_ATTACK', params: {} },
        { id: 'GENE_ELEMENTAL_HIT', params: {} },
        { id: 'GENE_FAST_MOVEMENT', params: { multiplier: 1.3 } },
        { id: 'GENE_COMBAT_MOVEMENT', params: {} },
        { id: 'GENE_BOIDS', params: { separationRadius: 30, separationForce: 300.0, cohesionWeight: 0.05 } }
    ]
  },
  [UnitType.OMEGALIS]: {
    id: UnitType.OMEGALIS,
    name: '雷兽 (Ultralisk)',
    baseStats: { hp: 1200, damage: 45, range: 50, speed: 60, attackSpeed: 0.6, width: 50, height: 50, color: 0xfacc15, armor: 80 },
    baseCost: { biomass: 300, larva: 2, dna: 10, time: 15.0 }, 
    growthFactors: { hp: 0.4, damage: 0.1 },
    baseLoadCapacity: 80,
    slots: [{ polarity: 'DEFENSE' }, { polarity: 'DEFENSE' }, { polarity: 'UNIVERSAL' }, { polarity: 'UNIVERSAL' }],
    elementConfig: { type: 'VOLTAIC', statusPerHit: 25 },
    visual: { shapes: [{ type: 'ROUNDED_RECT', cornerRadius: 10, widthPct: 1, heightPct: 1 }, { type: 'RECT', widthPct: 0.2, heightPct: 0.5, xOffPct: -0.4, yOffPct: -0.8 }, { type: 'RECT', widthPct: 0.2, heightPct: 0.5, xOffPct: 0.4, yOffPct: -0.8 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } },
        { id: 'GENE_AUTO_ATTACK', params: {} },
        { id: 'GENE_CLEAVE_ATTACK', params: { radius: 80 } },
        { id: 'GENE_THORNS', params: { ratio: 0.5 } },
        { id: 'GENE_HARDENED_SKIN', params: { amount: 10 } }, // Reduced from 15 to 10
        { id: 'GENE_STUN_HIT', params: { chance: 0.2 } },
        { id: 'GENE_COMBAT_MOVEMENT', params: {} },
        { id: 'GENE_BOIDS', params: { separationRadius: 70, separationForce: 400.0, cohesionWeight: 0.01 } }
    ]
  },
  [UnitType.QUEEN]: {
    id: UnitType.QUEEN,
    name: '感染者 (Infestor)',
    baseStats: { hp: 250, damage: 10, range: 100, speed: 40, attackSpeed: 1.0, width: 32, height: 48, color: 0xd946ef, armor: 20 },
    baseCost: { biomass: 150, larva: 1, dna: 0, time: 10.0 }, 
    growthFactors: { hp: 0.1, damage: 0.1 },
    baseLoadCapacity: 50,
    slots: [{ polarity: 'UNIVERSAL' }, { polarity: 'FUNCTION' }, { polarity: 'DEFENSE' }],
    visual: { shapes: [{ type: 'ROUNDED_RECT', cornerRadius: 10, widthPct: 1, heightPct: 1 }, { type: 'CIRCLE', radiusPct: 0.66, yOffPct: -1.0 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET' },
        { id: 'GENE_WANDER' }, 
        { id: 'GENE_BURROW_HEAL' },
        { id: 'GENE_COMMAND_AURA', params: { range: 300 } },
        { id: 'GENE_SPAWN_BROOD', params: { count: 3 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 60, separationForce: 250.0, cohesionWeight: 0.05 } }
    ]
  },

  // --- TIER 1: SWARM ---
  [UnitType.ZERGLING_RAPTOR]: {
        id: UnitType.ZERGLING_RAPTOR,
        name: '迅猛跳虫',
        // REBALANCE: HP reduced from 40 to 35 to emphasize glass cannon nature
        baseStats: { hp: 35, damage: 10, range: 20, speed: 240, attackSpeed: 0.3, width: 20, height: 20, color: 0xcccccc, armor: 0 },
        baseCost: { biomass: 10, larva: 1, dna: 0, time: 0.8 },
        growthFactors: { hp: 0.2, damage: 0.2 },
        baseLoadCapacity: 25,
        slots: [{ polarity: 'ATTACK' }, { polarity: 'UNIVERSAL' }],
        elementConfig: { type: 'PHYSICAL' },
        visual: { shapes: [{ type: 'CIRCLE', radiusPct: 0.8, color: 0xcccccc }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_MELEE_ATTACK' },
            { id: 'GENE_DASH_CHARGE', params: { speedMult: 3.0 } },
            { id: 'GENE_BOIDS', params: { separationRadius: 20 } }
        ]
  },
  [UnitType.EMBER_MITE]: {
        id: UnitType.EMBER_MITE,
        name: '灰烬螨',
        baseStats: { hp: 30, damage: 80, range: 20, speed: 180, attackSpeed: 1.0, width: 16, height: 16, color: 0xff4500, armor: 0 },
        baseCost: { biomass: 15, larva: 1, dna: 0, time: 1.0 },
        growthFactors: { hp: 0.1, damage: 0.5 },
        baseLoadCapacity: 20,
        slots: [{ polarity: 'ATTACK' }],
        elementConfig: { type: 'THERMAL' },
        visual: { shapes: [{ type: 'CIRCLE', radiusPct: 1.0, color: 0xff4500 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET', params: { range: 600 } },
            { id: 'GENE_COMBAT_MOVEMENT', params: { speedMult: 1.5 } },
            { id: 'GENE_SELF_DESTRUCT' },
            { id: 'GENE_EXPLODE_ON_DEATH', params: { radius: 60, damage: 80 } },
            { id: 'GENE_BOIDS', params: { separationRadius: 15 } }
        ]
  },
  [UnitType.SPARK_FLY]: {
        id: UnitType.SPARK_FLY,
        name: '电火花蝇',
        baseStats: { hp: 20, damage: 5, range: 150, speed: 200, attackSpeed: 0.5, width: 12, height: 12, color: 0xffff00, armor: 0 },
        baseCost: { biomass: 12, larva: 1, dna: 0, time: 1.0 },
        growthFactors: { hp: 0.1, damage: 0.2 },
        baseLoadCapacity: 20,
        slots: [{ polarity: 'FUNCTION' }, { polarity: 'ATTACK' }],
        elementConfig: { type: 'VOLTAIC' },
        visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 0.4, yOffPct: -2.0 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET', params: { range: 500 } },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0xffff00 } },
            { id: 'GENE_GHOST_WALK' },
            { id: 'GENE_PHASE_SHIFT' }
        ]
  },
  [UnitType.FROST_WEEVIL]: {
        id: UnitType.FROST_WEEVIL,
        name: '霜象鼻虫',
        baseStats: { hp: 120, damage: 8, range: 30, speed: 80, attackSpeed: 1.2, width: 26, height: 26, color: 0xa5f3fc, armor: 10 },
        baseCost: { biomass: 25, larva: 1, dna: 0, time: 2.0 },
        growthFactors: { hp: 0.3, damage: 0.1 },
        baseLoadCapacity: 30,
        slots: [{ polarity: 'DEFENSE' }, { polarity: 'DEFENSE' }],
        elementConfig: { type: 'CRYO', statusPerHit: 15 },
        visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 1, heightPct: 0.8, cornerRadius: 5 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET' },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_MELEE_ATTACK' },
            { id: 'GENE_ELEMENTAL_HIT' },
            { id: 'GENE_HARDENED_SKIN', params: { amount: 3 } },
            { id: 'GENE_BOIDS' }
        ]
  },
  [UnitType.ACID_MAGGOT]: {
        id: UnitType.ACID_MAGGOT,
        name: '酸液蛆',
        baseStats: { hp: 60, damage: 5, range: 20, speed: 60, attackSpeed: 1.0, width: 20, height: 10, color: 0x00ff00, armor: 0 },
        baseCost: { biomass: 20, larva: 1, dna: 0, time: 1.5 },
        growthFactors: { hp: 0.2, damage: 0.1 },
        baseLoadCapacity: 25,
        slots: [{ polarity: 'FUNCTION' }],
        elementConfig: { type: 'TOXIN', statusPerHit: 20 },
        visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 1, heightPct: 0.5, cornerRadius: 10 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET' },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_MELEE_ATTACK' },
            { id: 'GENE_ELEMENTAL_HIT' },
            { id: 'GENE_EXPLODE_ON_DEATH', params: { radius: 80, damage: 10 } },
            { id: 'GENE_BOIDS' }
        ]
  },
  [UnitType.BONE_BLADE]: {
    id: UnitType.BONE_BLADE, name: '骨刃虫',
    baseStats: { hp: 50, damage: 12, range: 25, speed: 200, attackSpeed: 0.5, width: 22, height: 22, color: 0xdddddd, armor: 2 },
    baseCost: { biomass: 12, larva: 1, dna: 0, time: 1.0 },
    growthFactors: { hp: 0.2, damage: 0.2 },
    baseLoadCapacity: 20,
    slots: [{ polarity: 'ATTACK' }, { polarity: 'ATTACK' }],
    elementConfig: { type: 'PHYSICAL' },
    visual: { shapes: [{ type: 'CIRCLE', radiusPct: 0.8, color: 0xeeeeee }, { type: 'RECT', widthPct: 0.2, heightPct: 1.2, color: 0x999999 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 300 } },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_MELEE_ATTACK' },
        { id: 'GENE_VAMPIRIC', params: { ratio: 0.3 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 20 } }
    ]
  },
  [UnitType.ACID_SPITTER]: {
    id: UnitType.ACID_SPITTER, name: '喷酸者',
    baseStats: { hp: 40, damage: 5, range: 180, speed: 140, attackSpeed: 0.8, width: 20, height: 20, color: 0x00ff00, armor: 0 },
    baseCost: { biomass: 18, larva: 1, dna: 0, time: 1.2 },
    growthFactors: { hp: 0.15, damage: 0.1 },
    baseLoadCapacity: 25,
    slots: [{ polarity: 'FUNCTION' }, { polarity: 'ATTACK' }],
    elementConfig: { type: 'TOXIN', statusPerHit: 15 },
    visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 0.8, heightPct: 0.8, color: 0x00aa00 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0x00ff00 } },
        { id: 'GENE_POISON_TOUCH', params: { stacks: 3 } },
        { id: 'GENE_BOIDS' }
    ]
  },
  [UnitType.STATIC_ORB]: {
    id: UnitType.STATIC_ORB, name: '静电球',
    baseStats: { hp: 30, damage: 2, range: 120, speed: 220, attackSpeed: 0.2, width: 18, height: 18, color: 0xffff00, armor: 0 },
    baseCost: { biomass: 20, larva: 1, dna: 0, time: 1.0 },
    growthFactors: { hp: 0.1, damage: 0.1 },
    baseLoadCapacity: 20,
    slots: [{ polarity: 'FUNCTION' }],
    elementConfig: { type: 'VOLTAIC' },
    visual: { shapes: [{ type: 'CIRCLE', radiusPct: 0.9, color: 0xffffaa }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 300 } },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0xffffaa } },
        { id: 'GENE_GHOST_WALK' },
        { id: 'GENE_BOIDS' }
    ]
  },
  [UnitType.CINDER_LING]: {
      id: UnitType.CINDER_LING, name: '余烬虫',
      baseStats: { hp: 35, damage: 8, range: 20, speed: 220, attackSpeed: 0.3, width: 20, height: 20, color: 0xff6600, armor: 0 },
      baseCost: { biomass: 12, larva: 1, dna: 0, time: 0.8 },
      growthFactors: { hp: 0.15, damage: 0.2 },
      baseLoadCapacity: 20,
      slots: [{ polarity: 'ATTACK' }],
      elementConfig: { type: 'THERMAL', statusPerHit: 10 },
      visual: { shapes: [{ type: 'CIRCLE', radiusPct: 0.8, color: 0xff4500 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_MELEE_ATTACK' },
          { id: 'GENE_ELEMENTAL_HIT' },
          { id: 'GENE_BOIDS', params: { separationRadius: 15 } }
      ]
  },
  [UnitType.FROST_SHARD]: {
      id: UnitType.FROST_SHARD, name: '冰凌',
      baseStats: { hp: 40, damage: 6, range: 150, speed: 180, attackSpeed: 0.8, width: 15, height: 30, color: 0xa5f3fc, armor: 5 },
      baseCost: { biomass: 15, larva: 1, dna: 0, time: 1.0 },
      growthFactors: { hp: 0.1, damage: 0.1 },
      baseLoadCapacity: 20,
      slots: [{ polarity: 'DEFENSE' }],
      elementConfig: { type: 'CRYO', statusPerHit: 10 },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.5, heightPct: 1.5, color: 0xa5f3fc }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0xa5f3fc } },
          { id: 'GENE_ELEMENTAL_HIT' },
          { id: 'GENE_BOIDS' }
      ]
  },

  // --- TIER 2: SPECIALIST ---
  [UnitType.LIGHTNING_SKINK]: {
        id: UnitType.LIGHTNING_SKINK,
        name: '闪电刺客',
        baseStats: { hp: 150, damage: 40, range: 150, speed: 160, attackSpeed: 0.8, width: 24, height: 24, color: 0xfacc15, armor: 5 },
        baseCost: { biomass: 80, larva: 1, dna: 2, time: 4.0 },
        growthFactors: { hp: 0.2, damage: 0.4 },
        baseLoadCapacity: 40,
        slots: [{ polarity: 'ATTACK' }, { polarity: 'ATTACK' }, { polarity: 'FUNCTION' }],
        elementConfig: { type: 'VOLTAIC' },
        visual: { shapes: [{ type: 'RECT', widthPct: 0.6, heightPct: 1.2, rotation: 45 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET' },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_CHAIN_ARC', params: { range: 150, decay: 0.8, maxDepth: 3 } },
            { id: 'GENE_EXECUTE', params: { threshold: 0.3, multiplier: 2.5 } },
            { id: 'GENE_BOIDS' }
        ]
  },
  [UnitType.SPINE_HURLER]: {
        id: UnitType.SPINE_HURLER,
        name: '脊刺射手',
        baseStats: { hp: 100, damage: 60, range: 450, speed: 90, attackSpeed: 1.5, width: 22, height: 35, color: 0x888888, armor: 5 },
        baseCost: { biomass: 100, larva: 1, dna: 1, time: 5.0 },
        growthFactors: { hp: 0.15, damage: 0.3 },
        baseLoadCapacity: 35,
        slots: [{ polarity: 'ATTACK' }, { polarity: 'UNIVERSAL' }],
        elementConfig: { type: 'PHYSICAL' },
        visual: { shapes: [{ type: 'RECT', widthPct: 0.5, heightPct: 1.5 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET', params: { range: 700 } },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_RANGED_ATTACK', params: { projectileSpeed: 25 } },
            { id: 'GENE_GIANT_SLAYER', params: { extraPct: 0.08 } },
            { id: 'GENE_BOIDS' }
        ]
  },
  [UnitType.MAGMA_GOLEM]: {
        id: UnitType.MAGMA_GOLEM,
        name: '熔岩魔像',
        baseStats: { hp: 600, damage: 20, range: 40, speed: 50, attackSpeed: 1.5, width: 40, height: 40, color: 0x8b0000, armor: 30 },
        baseCost: { biomass: 200, larva: 1, dna: 5, time: 8.0 },
        growthFactors: { hp: 0.5, damage: 0.1 },
        baseLoadCapacity: 50,
        slots: [{ polarity: 'DEFENSE' }, { polarity: 'DEFENSE' }, { polarity: 'ATTACK' }],
        elementConfig: { type: 'THERMAL' },
        visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 1.2, heightPct: 1.0, cornerRadius: 8 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET' },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_MELEE_ATTACK' },
            { id: 'GENE_THORNS', params: { ratio: 0.6 } },
            { id: 'GENE_REGEN', params: { rate: 0.02 } },
            { id: 'GENE_BOIDS', params: { separationRadius: 50, separationForce: 400 } }
        ]
  },
  [UnitType.PLAGUE_BEARER]: {
        id: UnitType.PLAGUE_BEARER,
        name: '瘟疫使者',
        baseStats: { hp: 200, damage: 5, range: 300, speed: 70, attackSpeed: 0.1, width: 30, height: 30, color: 0x800080, armor: 10 },
        baseCost: { biomass: 150, larva: 1, dna: 3, time: 6.0 },
        growthFactors: { hp: 0.3, damage: 0.0 },
        baseLoadCapacity: 45,
        slots: [{ polarity: 'FUNCTION' }, { polarity: 'FUNCTION' }],
        elementConfig: { type: 'TOXIN', statusPerHit: 5 },
        visual: { shapes: [{ type: 'CIRCLE', radiusPct: 1.2, color: 0x800080 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET' },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_TERROR_PRESENCE' },
            { id: 'GENE_SPLASH_ZONE', params: { range: 150, ratio: 1.0 } },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_BOIDS' }
        ]
  },
  [UnitType.SIEGE_BEETLE]: {
    id: UnitType.SIEGE_BEETLE, name: '攻城甲虫',
    baseStats: { hp: 400, damage: 40, range: 40, speed: 60, attackSpeed: 2.0, width: 35, height: 35, color: 0x8B4513, armor: 20 },
    baseCost: { biomass: 150, larva: 1, dna: 2, time: 6.0 },
    growthFactors: { hp: 0.4, damage: 0.4 },
    baseLoadCapacity: 50,
    slots: [{ polarity: 'DEFENSE' }, { polarity: 'ATTACK' }],
    elementConfig: { type: 'PHYSICAL' },
    visual: { shapes: [{ type: 'RECT', widthPct: 1.0, heightPct: 1.2, color: 0x5c4033 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET' },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_MELEE_ATTACK' },
        { id: 'GENE_GIANT_SLAYER', params: { extraPct: 0.1 } },
        { id: 'GENE_HARDENED_SKIN', params: { amount: 10 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 40 } }
    ]
  },
  [UnitType.FROST_WARD]: {
    id: UnitType.FROST_WARD, name: '冰川守卫',
    baseStats: { hp: 600, damage: 0, range: 10, speed: 40, attackSpeed: 10.0, width: 40, height: 40, color: 0x00ffff, armor: 30 },
    baseCost: { biomass: 200, larva: 1, dna: 3, time: 8.0 },
    growthFactors: { hp: 0.5, damage: 0 },
    baseLoadCapacity: 60,
    slots: [{ polarity: 'DEFENSE' }, { polarity: 'DEFENSE' }, { polarity: 'FUNCTION' }],
    elementConfig: { type: 'CRYO' },
    visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 1.2, heightPct: 0.8, color: 0xa5f3fc }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET' },
        { id: 'GENE_COMBAT_MOVEMENT' }, 
        { id: 'GENE_TERROR_PRESENCE', params: { range: 250 } },
        { id: 'GENE_THORNS', params: { ratio: 1.0 } },
        { id: 'GENE_REGEN', params: { rate: 0.03 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 50 } }
    ]
  },
  [UnitType.MAGMA_SPRAYER]: {
    id: UnitType.MAGMA_SPRAYER, name: '熔岩喷射者',
    baseStats: { hp: 180, damage: 25, range: 120, speed: 90, attackSpeed: 1.2, width: 28, height: 28, color: 0xff4500, armor: 5 },
    baseCost: { biomass: 120, larva: 1, dna: 2, time: 5.0 },
    growthFactors: { hp: 0.2, damage: 0.3 },
    baseLoadCapacity: 40,
    slots: [{ polarity: 'ATTACK' }, { polarity: 'ATTACK' }],
    elementConfig: { type: 'THERMAL', statusPerHit: 10 },
    visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1.2, color: 0xff6600 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 400 } },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_CLEAVE_ATTACK', params: { radius: 120 } },
        { id: 'GENE_ELEMENTAL_HIT' },
        { id: 'GENE_BOIDS' }
    ]
  },
  [UnitType.SHOCK_ROACH]: {
      id: UnitType.SHOCK_ROACH, name: '电击蟑螂',
      baseStats: { hp: 250, damage: 25, range: 180, speed: 110, attackSpeed: 1.0, width: 30, height: 30, color: 0xfacc15, armor: 15 },
      baseCost: { biomass: 110, larva: 1, dna: 2, time: 5.5 },
      growthFactors: { hp: 0.25, damage: 0.2 },
      baseLoadCapacity: 45,
      slots: [{ polarity: 'DEFENSE' }, { polarity: 'ATTACK' }],
      elementConfig: { type: 'VOLTAIC' },
      visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 1, heightPct: 0.6, color: 0xfacc15 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_CHAIN_ARC', params: { range: 180, maxDepth: 2 } },
          { id: 'GENE_REGEN', params: { rate: 0.01 } },
          { id: 'GENE_BOIDS' }
      ]
  },
  [UnitType.VILE_CRAWLER]: {
      id: UnitType.VILE_CRAWLER, name: '邪恶爬行者',
      baseStats: { hp: 350, damage: 15, range: 40, speed: 70, attackSpeed: 1.5, width: 35, height: 25, color: 0x4ade80, armor: 20 },
      baseCost: { biomass: 140, larva: 1, dna: 2, time: 6.5 },
      growthFactors: { hp: 0.35, damage: 0.1 },
      baseLoadCapacity: 50,
      slots: [{ polarity: 'DEFENSE' }, { polarity: 'FUNCTION' }],
      elementConfig: { type: 'TOXIN', statusPerHit: 10 },
      visual: { shapes: [{ type: 'RECT', widthPct: 1.2, heightPct: 0.5, color: 0x339933 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_MELEE_ATTACK' },
          { id: 'GENE_THORNS', params: { ratio: 0.4 } },
          { id: 'GENE_POISON_TOUCH', params: { stacks: 3 } },
          { id: 'GENE_BOIDS' }
      ]
  },

  // --- TIER 3: ELITE ---
  [UnitType.WINTER_WITCH]: {
        id: UnitType.WINTER_WITCH,
        name: '凛冬女巫',
        baseStats: { hp: 400, damage: 40, range: 400, speed: 100, attackSpeed: 1.5, width: 28, height: 45, color: 0xffffff, armor: 15 },
        baseCost: { biomass: 400, larva: 2, dna: 20, time: 12.0 },
        growthFactors: { hp: 0.2, damage: 0.3 },
        baseLoadCapacity: 60,
        slots: [{ polarity: 'FUNCTION' }, { polarity: 'FUNCTION' }, { polarity: 'UNIVERSAL' }],
        elementConfig: { type: 'CRYO', statusPerHit: 30 },
        visual: { shapes: [{ type: 'RECT', widthPct: 0.6, heightPct: 1.5, color: 0xeeeeee }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET' },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0x00ffff } },
            { id: 'GENE_STUN_HIT', params: { chance: 0.4 } },
            { id: 'GENE_COMMAND_AURA', params: { range: 300 } },
            { id: 'GENE_BOIDS' }
        ]
  },
  [UnitType.PULSE_BEAST]: {
    id: UnitType.PULSE_BEAST, name: '脉冲雷兽',
    baseStats: { hp: 800, damage: 60, range: 60, speed: 100, attackSpeed: 1.5, width: 45, height: 45, color: 0x4B0082, armor: 25 },
    baseCost: { biomass: 500, larva: 2, dna: 15, time: 15.0 },
    growthFactors: { hp: 0.4, damage: 0.3 },
    baseLoadCapacity: 70,
    slots: [{ polarity: 'ATTACK' }, { polarity: 'DEFENSE' }, { polarity: 'UNIVERSAL' }],
    elementConfig: { type: 'VOLTAIC' },
    visual: { shapes: [{ type: 'CIRCLE', radiusPct: 1.4, color: 0x9400D3 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET' },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_CLEAVE_ATTACK', params: { radius: 100 } },
        { id: 'GENE_STUN_HIT', params: { chance: 0.3 } },
        { id: 'GENE_CHAIN_ARC', params: { range: 200, decay: 1.0, maxDepth: 2 } },
        { id: 'GENE_HARDENED_SKIN', params: { amount: 10 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 50 } }
    ]
  },
  [UnitType.CORRUPTOR]: {
    id: UnitType.CORRUPTOR, name: '腐化领主',
    baseStats: { hp: 500, damage: 30, range: 400, speed: 60, attackSpeed: 2.0, width: 40, height: 60, color: 0x800080, armor: 10 },
    baseCost: { biomass: 600, larva: 2, dna: 20, time: 18.0 },
    growthFactors: { hp: 0.3, damage: 0.2 },
    baseLoadCapacity: 60,
    slots: [{ polarity: 'FUNCTION' }, { polarity: 'ATTACK' }, { polarity: 'UNIVERSAL' }],
    elementConfig: { type: 'TOXIN', statusPerHit: 30 },
    visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 1.2, heightPct: 1.5, color: 0x4b0082, cornerRadius: 15 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 600 } },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 50, color: 0x00ff00 } },
        { id: 'GENE_POISON_TOUCH', params: { stacks: 5 } },
        { id: 'GENE_SPAWN_BROOD', params: { count: 5 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 50 } }
    ]
  },
  [UnitType.PHANTOM_ASSASSIN]: {
    id: UnitType.PHANTOM_ASSASSIN, name: '幽灵刺客',
    baseStats: { hp: 250, damage: 120, range: 30, speed: 300, attackSpeed: 1.5, width: 25, height: 25, color: 0x333333, armor: 0 },
    baseCost: { biomass: 450, larva: 1, dna: 15, time: 10.0 },
    growthFactors: { hp: 0.2, damage: 0.6 },
    baseLoadCapacity: 40,
    slots: [{ polarity: 'ATTACK' }, { polarity: 'FUNCTION' }, { polarity: 'UNIVERSAL' }],
    elementConfig: { type: 'PHYSICAL' },
    visual: { shapes: [{ type: 'CIRCLE', radiusPct: 0.8, color: 0x111111 }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET', params: { range: 800 } },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_MELEE_ATTACK' },
        { id: 'GENE_GHOST_WALK' },
        { id: 'GENE_PHASE_SHIFT' },
        { id: 'GENE_EXECUTE', params: { threshold: 0.4, multiplier: 4.0 } },
    ]
  },
  [UnitType.INFERNO_JUDGE]: {
      id: UnitType.INFERNO_JUDGE, name: '炼狱审判官',
      baseStats: { hp: 600, damage: 60, range: 350, speed: 70, attackSpeed: 1.8, width: 35, height: 50, color: 0xff3300, armor: 20 },
      baseCost: { biomass: 550, larva: 2, dna: 18, time: 16.0 },
      growthFactors: { hp: 0.3, damage: 0.35 },
      baseLoadCapacity: 65,
      slots: [{ polarity: 'ATTACK' }, { polarity: 'ATTACK' }, { polarity: 'FUNCTION' }],
      elementConfig: { type: 'THERMAL', statusPerHit: 25 },
      visual: { shapes: [{ type: 'RECT', widthPct: 0.8, heightPct: 1.4, color: 0x992200 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 40, color: 0xff3300 } },
          { id: 'GENE_SPLASH_ZONE', params: { range: 80, ratio: 0.8 } },
          { id: 'GENE_BOIDS' }
      ]
  },
  [UnitType.CRYSTAL_WEAVER]: {
      id: UnitType.CRYSTAL_WEAVER, name: '水晶编织者',
      baseStats: { hp: 450, damage: 20, range: 300, speed: 90, attackSpeed: 1.2, width: 30, height: 40, color: 0xa5f3fc, armor: 15 },
      baseCost: { biomass: 500, larva: 2, dna: 16, time: 14.0 },
      growthFactors: { hp: 0.25, damage: 0.15 },
      baseLoadCapacity: 60,
      slots: [{ polarity: 'FUNCTION' }, { polarity: 'DEFENSE' }, { polarity: 'UNIVERSAL' }],
      elementConfig: { type: 'CRYO' },
      visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 0.7, heightPct: 1.2, color: 0xccffff, cornerRadius: 5 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_RANGED_ATTACK', params: { projectileColor: 0xa5f3fc } },
          { id: 'GENE_COMMAND_AURA', params: { range: 300 } },
          { id: 'GENE_REGEN', params: { rate: 0.05 } },
          { id: 'GENE_BOIDS' }
      ]
  },

  // --- TIER 4: TITAN ---
  [UnitType.TYRANT_REX]: {
        id: UnitType.TYRANT_REX,
        name: '暴虐霸王龙',
        baseStats: { hp: 3000, damage: 250, range: 80, speed: 90, attackSpeed: 2.0, width: 60, height: 60, color: 0x550000, armor: 100 },
        baseCost: { biomass: 1500, larva: 3, dna: 100, time: 30.0 },
        growthFactors: { hp: 0.5, damage: 0.5 },
        baseLoadCapacity: 100,
        slots: [{ polarity: 'ATTACK' }, { polarity: 'ATTACK' }, { polarity: 'DEFENSE' }, { polarity: 'DEFENSE' }],
        elementConfig: { type: 'PHYSICAL' },
        visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 1.5, heightPct: 1.5, color: 0x550000 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET' },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_MELEE_ATTACK' },
            { id: 'GENE_CLEAVE_ATTACK', params: { radius: 100 } },
            { id: 'GENE_RAMPAGE', params: { heal: 0.2 } },
            { id: 'GENE_BERSERKER_BLOOD' },
            { id: 'GENE_TERROR_PRESENCE' },
            { id: 'GENE_BOIDS', params: { separationRadius: 80, separationForce: 600 } }
        ]
  },
  [UnitType.TEMPEST_LEVIATHAN]: {
        id: UnitType.TEMPEST_LEVIATHAN,
        name: '风暴利维坦',
        baseStats: { hp: 2000, damage: 80, range: 600, speed: 40, attackSpeed: 0.5, width: 80, height: 40, color: 0x4b0082, armor: 50 },
        baseCost: { biomass: 2000, larva: 3, dna: 150, time: 40.0 },
        growthFactors: { hp: 0.4, damage: 0.4 },
        baseLoadCapacity: 120,
        slots: [{ polarity: 'FUNCTION' }, { polarity: 'ATTACK' }, { polarity: 'ATTACK' }],
        elementConfig: { type: 'VOLTAIC' },
        visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 2.0, heightPct: 1.0, color: 0x4b0082 }] },
        genes: [
            { id: 'GENE_ACQUIRE_TARGET', params: { range: 800 } },
            { id: 'GENE_COMBAT_MOVEMENT' },
            { id: 'GENE_AUTO_ATTACK' },
            { id: 'GENE_CHAIN_ARC', params: { range: 300, maxDepth: 10, decay: 0.95 } },
            { id: 'GENE_GHOST_WALK' },
            { id: 'GENE_REGEN', params: { rate: 0.05 } },
            { id: 'GENE_BOIDS', params: { separationRadius: 100 } }
        ]
  },
  [UnitType.STAR_EATER]: {
    id: UnitType.STAR_EATER, name: '恒星吞噬者',
    baseStats: { hp: 5000, damage: 150, range: 100, speed: 30, attackSpeed: 3.0, width: 80, height: 80, color: 0xff0000, armor: 50 },
    baseCost: { biomass: 5000, larva: 5, dna: 200, time: 60.0 },
    growthFactors: { hp: 0.6, damage: 0.5 },
    baseLoadCapacity: 150,
    slots: [{ polarity: 'ATTACK' }, { polarity: 'ATTACK' }, { polarity: 'FUNCTION' }, { polarity: 'DEFENSE' }],
    elementConfig: { type: 'THERMAL', statusPerHit: 50 },
    visual: { shapes: [
        { type: 'CIRCLE', radiusPct: 2.0, color: 0x8b0000 }, 
        { type: 'CIRCLE', radiusPct: 1.5, color: 0xff4500 }
    ] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET' },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_CLEAVE_ATTACK', params: { radius: 150 } },
        { id: 'GENE_TERROR_PRESENCE', params: { range: 400 } },
        { id: 'GENE_THORNS', params: { ratio: 0.2 } },
        { id: 'GENE_EXPLODE_ON_DEATH', params: { radius: 300, damage: 1000 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 100, separationForce: 1000 } }
    ]
  },
  [UnitType.ETERNAL_GLACIER]: {
    id: UnitType.ETERNAL_GLACIER, name: '永恒冰川',
    baseStats: { hp: 8000, damage: 50, range: 60, speed: 20, attackSpeed: 2.0, width: 90, height: 70, color: 0xa5f3fc, armor: 200 },
    baseCost: { biomass: 6000, larva: 5, dna: 250, time: 80.0 },
    growthFactors: { hp: 1.0, damage: 0.2 },
    baseLoadCapacity: 200,
    slots: [{ polarity: 'DEFENSE' }, { polarity: 'DEFENSE' }, { polarity: 'DEFENSE' }, { polarity: 'FUNCTION' }],
    elementConfig: { type: 'CRYO' },
    visual: { shapes: [{ type: 'RECT', widthPct: 2.5, heightPct: 1.5, color: 0xffffff }] },
    genes: [
        { id: 'GENE_ACQUIRE_TARGET' },
        { id: 'GENE_COMBAT_MOVEMENT' },
        { id: 'GENE_AUTO_ATTACK' },
        { id: 'GENE_MELEE_ATTACK' },
        { id: 'GENE_HARDENED_SKIN', params: { amount: 50 } },
        { id: 'GENE_REGEN', params: { rate: 0.05 } },
        { id: 'GENE_STUN_HIT', params: { chance: 0.5 } },
        { id: 'GENE_BOIDS', params: { separationRadius: 120 } }
    ]
  },
  [UnitType.STORM_BRINGER]: {
      id: UnitType.STORM_BRINGER, name: '风暴使者',
      baseStats: { hp: 4000, damage: 100, range: 500, speed: 50, attackSpeed: 1.0, width: 70, height: 70, color: 0xffff00, armor: 40 },
      baseCost: { biomass: 4000, larva: 5, dna: 220, time: 70.0 },
      growthFactors: { hp: 0.5, damage: 0.5 },
      baseLoadCapacity: 160,
      slots: [{ polarity: 'FUNCTION' }, { polarity: 'ATTACK' }, { polarity: 'ATTACK' }, { polarity: 'UNIVERSAL' }],
      elementConfig: { type: 'VOLTAIC' },
      visual: { shapes: [{ type: 'CIRCLE', radiusPct: 1.8, color: 0xffff33 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 900 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_CHAIN_ARC', params: { range: 500, maxDepth: 15, decay: 0.98 } },
          { id: 'GENE_GHOST_WALK' },
          { id: 'GENE_COMMAND_AURA', params: { range: 600 } },
          { id: 'GENE_BOIDS', params: { separationRadius: 110 } }
      ]
  },
  [UnitType.ABYSSAL_MAW]: {
      id: UnitType.ABYSSAL_MAW, name: '深渊巨口',
      baseStats: { hp: 6000, damage: 400, range: 60, speed: 50, attackSpeed: 2.5, width: 85, height: 60, color: 0x222222, armor: 60 },
      baseCost: { biomass: 5500, larva: 5, dna: 230, time: 75.0 },
      growthFactors: { hp: 0.7, damage: 0.6 },
      baseLoadCapacity: 180,
      slots: [{ polarity: 'ATTACK' }, { polarity: 'ATTACK' }, { polarity: 'DEFENSE' }, { polarity: 'UNIVERSAL' }],
      elementConfig: { type: 'PHYSICAL' },
      visual: { shapes: [{ type: 'ROUNDED_RECT', widthPct: 2.2, heightPct: 1.2, color: 0x111111, cornerRadius: 20 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET' },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_MELEE_ATTACK' },
          { id: 'GENE_EXECUTE', params: { threshold: 0.3, multiplier: 10.0 } },
          { id: 'GENE_VAMPIRIC', params: { ratio: 0.5 } },
          { id: 'GENE_BOIDS', params: { separationRadius: 120 } }
      ]
  },
  [UnitType.PESTILENCE_LORD]: {
      id: UnitType.PESTILENCE_LORD, name: '瘟疫领主',
      baseStats: { hp: 4500, damage: 50, range: 400, speed: 40, attackSpeed: 1.5, width: 75, height: 90, color: 0x660066, armor: 30 },
      baseCost: { biomass: 4500, larva: 5, dna: 210, time: 65.0 },
      growthFactors: { hp: 0.6, damage: 0.3 },
      baseLoadCapacity: 160,
      slots: [{ polarity: 'FUNCTION' }, { polarity: 'FUNCTION' }, { polarity: 'ATTACK' }, { polarity: 'UNIVERSAL' }],
      elementConfig: { type: 'TOXIN', statusPerHit: 100 },
      visual: { shapes: [{ type: 'RECT', widthPct: 1.5, heightPct: 2.5, color: 0x440044 }] },
      genes: [
          { id: 'GENE_ACQUIRE_TARGET', params: { range: 800 } },
          { id: 'GENE_COMBAT_MOVEMENT' },
          { id: 'GENE_AUTO_ATTACK' },
          { id: 'GENE_ARTILLERY_ATTACK', params: { arcHeight: 80, color: 0x00ff00 } },
          { id: 'GENE_TERROR_PRESENCE', params: { range: 600 } },
          { id: 'GENE_SPAWN_BROOD', params: { count: 10 } },
          { id: 'GENE_BOIDS', params: { separationRadius: 100 } }
      ]
  }
};
