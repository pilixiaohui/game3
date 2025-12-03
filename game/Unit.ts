
import { Graphics } from 'pixi.js';
import { IUnit, UnitRuntimeStats, Faction, UnitType, GameModifiers, StatusType, GeneConfig } from '../types';
import { UNIT_CONFIGS, LANE_Y, LANE_HEIGHT } from '../constants';
import { DataManager } from './DataManager';
import { WorldRenderer } from './renderers/WorldRenderer';

export class Unit implements IUnit {
  active: boolean = false;
  id: number = 0;
  faction: Faction = Faction.ZERG;
  type: UnitType = UnitType.MELEE;
  level: number = 1;
  x: number = 0; y: number = 0; radius: number = 15;
  stats: UnitRuntimeStats;
  attackCooldown: number = 0;
  flashTimer: number = 0;
  context: Record<string, any> = {};
  state: 'MOVE' | 'ATTACK' | 'IDLE' | 'DEAD' | 'WANDER' | 'HARVEST' | 'RETURN' = 'IDLE';
  isDead: boolean = false;
  target: IUnit | null = null;
  decayTimer: number = 0;
  wanderTimer: number = 0;
  wanderDir: number = 0;
  engagedCount: number = 0; 
  speedVar: number = 1.0;   
  waveOffset: number = 0;
  frameOffset: number = 0;
  steeringForce: { x: number, y: number } = { x: 0, y: 0 };
  view: Graphics | null = null;
  hpBar: Graphics | null = null;
  statuses: Partial<Record<StatusType, any>> = {};
  geneConfig: GeneConfig[] = [];

  constructor(id: number) { 
      this.id = id; 
      this.stats = { hp: 0, maxHp: 0, damage: 0, range: 0, speed: 0, attackSpeed: 0, width: 0, height: 0, color: 0, armor: 0, critChance: 0, critDamage: 0, element: 'PHYSICAL' };
  }
}

export class UnitPool {
  private pool: Unit[] = [];
  private freeIndices: number[] = []; 
  public renderer: WorldRenderer;
  
  constructor(size: number, renderer: WorldRenderer) {
    this.renderer = renderer;
    for (let i = 0; i < size; i++) {
      const u = new Unit(i);
      u.view = new Graphics();
      u.hpBar = new Graphics();
      u.view.addChild(u.hpBar);
      this.renderer.unitLayer.addChild(u.view);
      u.view.visible = false;
      this.pool.push(u);
      this.freeIndices.push(i); 
    }
  }

  spawn(faction: Faction, type: UnitType, x: number, modifiers: GameModifiers, level: number = 1): Unit | null {
    if (this.freeIndices.length === 0) return null;
    const idx = this.freeIndices.pop()!;
    const unit = this.pool[idx];

    // Reset Unit State
    unit.active = true; unit.isDead = false; unit.faction = faction; unit.type = type; unit.x = x; unit.level = level;
    const r1 = Math.random(); const r2 = Math.random();
    const yOffset = (r1 - r2) * (LANE_HEIGHT / 2); 
    unit.y = LANE_Y + yOffset;
    unit.state = faction === Faction.ZERG ? 'MOVE' : 'IDLE';
    unit.target = null; unit.attackCooldown = 0; unit.statuses = {}; unit.context = {}; unit.flashTimer = 0;
    unit.decayTimer = 0; unit.engagedCount = 0; unit.speedVar = 0.85 + Math.random() * 0.3; unit.waveOffset = Math.random() * 100;
    unit.wanderTimer = 0; unit.wanderDir = 1; unit.frameOffset = Math.floor(Math.random() * 60); unit.steeringForce = {x:0, y:0};

    // Calculate Stats
    let stats: UnitRuntimeStats;
    const config = UNIT_CONFIGS[type];
    if (faction === Faction.ZERG) {
        stats = DataManager.instance.getUnitStats(type, modifiers);
        unit.level = DataManager.instance.state.hive.unlockedUnits[type]?.level || 1;
    } else {
        const growHp = config.growthFactors?.hp || 0.1;
        const growDmg = config.growthFactors?.damage || 0.05;
        stats = {
            hp: config.baseStats.hp * (1 + (level - 1) * growHp),
            maxHp: config.baseStats.hp * (1 + (level - 1) * growHp),
            damage: config.baseStats.damage * (1 + (level - 1) * growDmg),
            range: config.baseStats.range, speed: config.baseStats.speed, attackSpeed: config.baseStats.attackSpeed,
            width: config.baseStats.width, height: config.baseStats.height, color: config.baseStats.color,
            armor: config.baseStats.armor + (level - 1) * 0.5,
            critChance: 0.05, critDamage: 1.5, element: config.elementConfig?.type || 'PHYSICAL'
        };
    }
    unit.stats = stats;
    unit.radius = stats.width / 2;
    unit.geneConfig = config.genes ? [...config.genes] : [];

    // Init View
    if (unit.view) {
      unit.view.visible = true;
      unit.view.alpha = 1.0;
      unit.view.scale.set(1.0);
      unit.view.tint = 0xffffff;
      this.renderer.drawUnit(unit);
    }
    return unit;
  }

  recycle(unit: Unit) {
    if (!unit.active) return;
    unit.active = false;
    if (unit.view) unit.view.visible = false;
    this.freeIndices.push(unit.id);
  }
  getActiveUnits(): Unit[] { return this.pool.filter(u => u.active); }
}
