
import { Graphics, Text, TextStyle } from 'pixi.js';
import { Faction, GameModifiers, UnitType, GameStateSnapshot, IUnit, UnitRuntimeStats, GeneConfig, ObstacleDef, IGameEngine, StatusType } from '../types';
import { UNIT_CONFIGS, LANE_Y, LANE_HEIGHT, DECAY_TIME, ELEMENT_COLORS, STAGE_WIDTH, STATUS_CONFIG } from '../constants';
import { TERRAIN_CHUNKS } from '../config/terrain';
import { DataManager } from './DataManager';
import { GeneLibrary, ReactionRegistry, StatusRegistry } from './GeneSystem';
import { SpatialHash } from './SpatialHash';
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

class UnitPool {
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

export class GameEngine implements IGameEngine {
  public renderer: WorldRenderer | null = null;
  public unitPool: UnitPool | null = null;
  public spatialHash: SpatialHash;
  public _sharedQueryBuffer: IUnit[] = [];
  public activeObstacles: ObstacleDef[] = [];
  
  public activeRegionId: number = 0;
  public humanDifficultyMultiplier: number = 1.0;
  public cameraX: number = 0;
  private userZoom: number = 1.0;
  public isPaused: boolean = false;
  
  public mode: 'COMBAT_VIEW' | 'HIVE' | 'HARVEST_VIEW' = 'HIVE';
  private currentStageIndex: number = 0;

  // Visuals for Hive
  private hiveGraphics: Graphics | null = null;
  private eggPositions: Record<UnitType, {x: number, y: number, scale: number}> = {} as any;
  private lastStockpileCounts: Record<UnitType, number> = {} as any;
  private harvestNodes: { x: number, y: number, amount: number, view: Graphics }[] = [];

  constructor() {
    this.spatialHash = new SpatialHash(100);
  }

  async init(element: HTMLElement) {
    this.renderer = new WorldRenderer(element);
    this.unitPool = new UnitPool(1500, this.renderer);
    
    // @ts-ignore
    this.renderer.app.view.addEventListener('wheel', this.handleWheel, { passive: false });
    this.renderer.app.renderer.on('resize', this.resize.bind(this));
    this.resize(); 

    this.renderer.app.ticker.add(this.update.bind(this));
    this.applyModeSettings();
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    this.userZoom = Math.max(0.2, Math.min(3.0, this.userZoom + delta));
    this.resize();
  }

  private resize() {
      if (!this.renderer) return;
      const w = this.renderer.app.screen.width;
      const h = this.renderer.app.screen.height;
      
      const TARGET_LOGICAL_HEIGHT = 640;
      const MIN_LOGICAL_WIDTH = 768; 
      let baseScale = h / TARGET_LOGICAL_HEIGHT;
      const logicalWidth = w / baseScale;
      if (logicalWidth < MIN_LOGICAL_WIDTH) baseScale = w / MIN_LOGICAL_WIDTH;
      
      const scaleFactor = baseScale * this.userZoom;
      this.renderer.resize(scaleFactor, this.cameraX, this.mode);
  }

  public setMode(mode: 'COMBAT_VIEW' | 'HIVE' | 'HARVEST_VIEW') {
      if (this.mode === mode) return;
      this.mode = mode;
      this.applyModeSettings();
  }

  private applyModeSettings() {
      if (!this.renderer) return;
      
      this.renderer.clear();
      this.activeObstacles = [];
      this.harvestNodes = [];
      this.hiveGraphics = null;
      this.renderer.hiveLayer.removeChildren();

      if (this.mode === 'HIVE') {
          this.generateHiveVisuals();
      } else if (this.mode === 'COMBAT_VIEW') {
          const saved = DataManager.instance.state.world.regions[this.activeRegionId];
          this.currentStageIndex = Math.floor(saved ? saved.devourProgress : 0);
          this.cameraX = this.currentStageIndex * STAGE_WIDTH;
          this.generateTerrain(this.currentStageIndex);
      } else if (this.mode === 'HARVEST_VIEW') {
          this.generateHarvestNodes();
          this.spawnHarvesters();
      }
      
      if (this.unitPool) {
          const activeUnits = this.unitPool.getActiveUnits();
          activeUnits.forEach(u => this.unitPool!.recycle(u));
      }
      this.resize();
  }

  private update(delta: number) {
    if (this.isPaused || !this.renderer) return;
    const dt = delta / 60; 

    // --- HIVE MODE ---
    if (this.mode === 'HIVE') {
        this.updateHiveVisuals(dt);
        const visualUnits = this.unitPool!.getActiveUnits();
        for (const u of visualUnits) {
            this.updateUnitLogic(u, dt);
            this.renderer.updateUnitVisuals(u, this.mode);
            if (u.context.isHiveVisual && Math.abs(u.x) < 20) {
                this.createParticles(u.x, u.y, 0x00ff00, 5);
                this.unitPool!.recycle(u);
            }
        }
        this.renderer.updateParticles(dt);
        return;
    }

    // --- COMBAT / HARVEST ---
    this.spatialHash.clear();
    const allUnits = this.unitPool!.getActiveUnits();
    for (const u of allUnits) this.spatialHash.insert(u);

    for (const u of allUnits) this.updateUnitLogic(u, dt);

    if (this.mode === 'COMBAT_VIEW') {
        let targetX = this.cameraX;
        let leadZergX = -99999;
        let zergCount = 0;
        for (const u of allUnits) {
            if (u.faction === Faction.ZERG && !u.isDead) {
                if (u.x > leadZergX) leadZergX = u.x;
                zergCount++;
            }
        }
        if (zergCount > 0) targetX = leadZergX + 300;

        let limitX = 999999;
        for (const wall of this.activeObstacles) {
            if (wall.type === 'WALL' && wall.x > this.cameraX && wall.x < limitX) limitX = wall.x;
        }
        if (targetX > limitX - 200) targetX = limitX - 200;
        this.cameraX += (targetX - this.cameraX) * 0.1;
        this.renderer.resize(this.renderer.world.scale.x, this.cameraX, this.mode); // Update camera pos
    }

    for (const u of allUnits) this.renderer.updateUnitVisuals(u, this.mode);
    this.renderer.updateParticles(dt);
  }

  private updateUnitLogic(u: Unit, dt: number) {
      if (u.isDead) {
          u.decayTimer += dt;
          if (u.decayTimer > DECAY_TIME) this.unitPool?.recycle(u);
          return;
      }

      // Statuses & Genes
      for (const type in u.statuses) {
          const statusKey = type as StatusType;
          const effect = u.statuses[statusKey];
          if (effect) {
              effect.duration -= dt;
              StatusRegistry.onTick(u, statusKey, dt, this);
              if (effect.duration <= 0) delete u.statuses[statusKey];
          }
      }

      const velocity = { x: 0, y: 0 };
      for (const gene of u.geneConfig) {
          const trait = GeneLibrary.get(gene.id);
          if (trait && trait.onTick) trait.onTick(u, dt, this, gene.params || {});
          if (trait && trait.onUpdateTarget && (this.renderer?.app.ticker.lastTime! % 10 < 1)) {
             trait.onUpdateTarget(u, dt, this, gene.params || {});
          }
          if (trait && trait.onMove) trait.onMove(u, velocity, dt, this, gene.params || {});
      }
      
      let nextX = u.x + velocity.x;
      let nextY = u.y + velocity.y;
      
      if (this.mode === 'HARVEST_VIEW' && u.faction === Faction.ZERG) {
          this.updateHarvester(u, dt, nextX, nextY);
          return;
      }

      if (this.mode === 'COMBAT_VIEW') {
        const wallHit = this.checkWallCollision(nextX, nextY, u.radius);
        if (wallHit) {
            nextX = u.x; 
            if (u.faction === Faction.ZERG) {
                 u.attackCooldown -= dt;
                 if (u.attackCooldown <= 0) {
                     u.attackCooldown = u.stats.attackSpeed;
                     this.damageObstacle(wallHit, u.stats.damage);
                     this.createSlash(wallHit.x - 20, u.y, wallHit.x, u.y, 0xff0000);
                 }
            }
        }
      }

      if (nextY < -200) nextY = -200;
      if (nextY > 200) nextY = 200;
      u.x = nextX;
      u.y = nextY;
  }

  private updateHarvester(u: Unit, dt: number, nextX: number, nextY: number) {
       if (!u.context.harvestTarget) {
           let minDist = 999999;
           let target = null;
           for(const node of this.harvestNodes) {
               const d = Math.abs(node.x - u.x) + Math.abs(node.y - u.y);
               if (d < minDist) { minDist = d; target = node; }
           }
           u.context.harvestTarget = target;
           u.state = 'MOVE';
       }

       const target = u.context.harvestTarget;
       if (u.state === 'MOVE' && target) {
           const dx = target.x - u.x; const dy = target.y - u.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           if (dist < 10) { u.state = 'HARVEST'; u.context.harvestTimer = 0; } 
           else { u.x += (dx/dist) * u.stats.speed * dt; u.y += (dy/dist) * u.stats.speed * dt; }
       } else if (u.state === 'HARVEST') {
           u.context.harvestTimer += dt;
           if (u.context.harvestTimer > 1.0) {
               u.state = 'RETURN';
               this.createFloatingText(u.x, u.y - 20, "+1", 0x00ff00, 10);
               DataManager.instance.modifyResource('biomass', 1);
           }
       } else if (u.state === 'RETURN') {
           const dx = 0 - u.x; const dy = 0 - u.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           if (dist < 10) { u.state = 'IDLE'; u.context.harvestTarget = null; } 
           else { u.x += (dx/dist) * u.stats.speed * dt; u.y += (dy/dist) * u.stats.speed * dt; }
       }
  }

  private generateTerrain(stageIndex: number) {
      const templates = TERRAIN_CHUNKS['DEFAULT'] || [];
      const template = templates[stageIndex % templates.length];
      const stageOffsetX = stageIndex * STAGE_WIDTH;
      this.activeObstacles = template.obstacles.map(def => ({ ...def, x: def.x + stageOffsetX, maxHealth: def.health, health: def.health }));
      this.renderer?.drawTerrain(this.activeObstacles);
      template.spawnPoints.forEach(sp => {
          this.unitPool?.spawn(Faction.HUMAN, sp.type as UnitType, sp.x + stageOffsetX, DataManager.instance.modifiers, stageIndex + 5);
      });
  }

  private generateHiveVisuals() {
      this.hiveGraphics = new Graphics();
      this.renderer?.hiveLayer.addChild(this.hiveGraphics);
      const unlocked = DataManager.instance.state.hive.unlockedUnits;
      const types = Object.keys(unlocked) as UnitType[];
      const count = types.length;
      types.forEach((t, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const row = Math.floor(i / 2);
          const x = side * 150;
          const y = (row - count/4) * 120;
          this.eggPositions[t] = { x, y, scale: 1.0 };
          this.lastStockpileCounts[t] = DataManager.instance.state.hive.unitStockpile[t] || 0;
      });
  }

  private updateHiveVisuals(dt: number) {
      if (!this.hiveGraphics) return;
      const g = this.hiveGraphics;
      g.clear();
      const time = Date.now() / 1000;

      g.beginFill(0x1a0505); g.lineStyle(4, 0x441111);
      g.drawRect(-40, -600, 80, 1200);
      g.endFill();
      
      const unlocked = DataManager.instance.state.hive.unlockedUnits;
      const currentStockpile = DataManager.instance.state.hive.unitStockpile;
      
      for (const type of Object.keys(this.eggPositions) as UnitType[]) {
          const pos = this.eggPositions[type];
          const data = unlocked[type];
          if (!data) continue;
          if (data.isProducing) pos.scale = 1.0 + Math.sin(time * 10) * 0.05; else pos.scale = 1.0;
          
          g.lineStyle(3, 0x331111); g.moveTo(0, pos.y); g.quadraticCurveTo(pos.x/2, pos.y + 20, pos.x, pos.y);
          const color = UNIT_CONFIGS[type]?.baseStats.color || 0xffffff;
          g.lineStyle(2, data.isProducing ? 0x00ff00 : 0x555555);
          g.beginFill(0x111111); g.drawCircle(pos.x, pos.y, 30 * pos.scale); g.endFill();
          g.beginFill(color, data.isProducing ? 0.8 : 0.3); g.drawCircle(pos.x, pos.y, 20 * pos.scale); g.endFill();
          
          const newCount = currentStockpile[type] || 0;
          if (newCount > (this.lastStockpileCounts[type] || 0)) {
              const u = this.unitPool?.spawn(Faction.ZERG, type, pos.x, DataManager.instance.modifiers);
              if (u) {
                  u.y = pos.y; u.target = { x: 0, y: pos.y } as any; u.state = 'MOVE'; u.context.isHiveVisual = true; u.stats.speed = 100;
                  u.geneConfig = [{ id: 'GENE_COMBAT_MOVEMENT' }];
              }
          }
          this.lastStockpileCounts[type] = newCount;
      }
  }

  private generateHarvestNodes() {
      for(let i=0; i<5; i++) {
          const x = (Math.random() - 0.5) * 600; const y = (Math.random() - 0.5) * 400;
          const g = new Graphics(); g.beginFill(0x00ff00, 0.5); g.drawCircle(0, 0, 15); g.endFill(); g.position.set(x, y);
          this.renderer?.terrainLayer.addChild(g);
          this.harvestNodes.push({ x, y, amount: 9999, view: g });
      }
  }
  
  private spawnHarvesters() {
      for(let i=0; i<10; i++) {
          const u = this.unitPool?.spawn(Faction.ZERG, UnitType.MELEE, 0, DataManager.instance.modifiers);
          if (u) { u.y = 0; u.stats.speed = 150; }
      }
  }

  private checkWallCollision(x: number, y: number, r: number): ObstacleDef | null {
      for (const obs of this.activeObstacles) {
          if (obs.type === 'WALL') {
             if (x + r > obs.x - obs.width/2 && x - r < obs.x + obs.width/2 &&
                 y > LANE_Y + obs.y - obs.height && y < LANE_Y + obs.y) return obs;
          }
      }
      return null;
  }
  
  private damageObstacle(obs: ObstacleDef, dmg: number) {
      if (!obs.health) return;
      obs.health -= dmg;
      if (obs.health <= 0) {
          this.activeObstacles = this.activeObstacles.filter(o => o !== obs);
          this.renderer?.drawTerrain(this.activeObstacles);
          this.createExplosion(obs.x, LANE_Y + obs.y - obs.height/2, 100, 0x555555);
      }
  }

  // --- IGameEngine Implementations (Proxy to Render or Logic) ---
  public spawnUnit(faction: Faction, type: UnitType, x: number): IUnit | null {
      const level = (faction === Faction.HUMAN) ? (this.currentStageIndex + 1) : 1;
      return this.unitPool ? this.unitPool.spawn(faction, type, x, DataManager.instance.modifiers, level) : null;
  }
  
  public getSnapshot(): GameStateSnapshot {
      const activeUnits = this.unitPool ? this.unitPool.getActiveUnits() : [];
      const zerg = activeUnits.filter(u => u.faction === Faction.ZERG && !u.isDead);
      const counts: Record<string, number> = {};
      zerg.forEach(u => counts[u.type] = (counts[u.type] || 0) + 1);
      return {
          resources: 0, distance: this.currentStageIndex,
          unitCountZerg: zerg.length,
          unitCountHuman: activeUnits.filter(u => u.faction === Faction.HUMAN && !u.isDead).length,
          isPaused: this.isPaused, stockpileMelee: 0, stockpileRanged: 0, stockpileTotal: 0, populationCap: 0,
          activeZergCounts: counts
      };
  }
  
  public createExplosion(x: number, y: number, radius: number, color: number = 0xffaa00) { this.createParticles(x, y, color, 10); this.createShockwave(x, y, radius, color); }
  public createFlash(x: number, y: number, color: number) {
      const g = new Graphics(); g.beginFill(color); g.drawCircle(0, 0, 20); g.endFill(); g.position.set(x, y);
      this.renderer?.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
  }
  public createProjectile(x1: number, y1: number, x2: number, y2: number, color: number) {
      const g = new Graphics(); g.lineStyle(2, color); g.moveTo(0,0); g.lineTo(x2-x1, y2-y1); g.position.set(x1, y1);
      this.renderer?.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
  }
  public createFloatingText(x: number, y: number, text: string, color: number, fontSize: number = 12) {
      const t = new Text(text, new TextStyle({ fontSize, fill: color, fontWeight: 'bold' })); t.anchor.set(0.5); t.position.set(x, y);
      this.renderer?.addParticle({ view: t, type: 'TEXT', life: 0.8, maxLife: 0.8, update: (p:any, dt:number) => { p.life -= dt; p.view.y -= 20 * dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
  }
  public createDamagePop(x: number, y: number, value: number, element: string) { this.createFloatingText(x, y, Math.floor(value).toString(), ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS] || 0xffffff, 14); }
  public createSlash(x: number, y: number, targetX: number, targetY: number, color: number) {
      const g = new Graphics(); g.lineStyle(2, color); g.moveTo(x - 10, y - 10); g.lineTo(targetX + 10, targetY + 10); g.moveTo(x + 10, y - 10); g.lineTo(targetX - 10, targetY + 10);
      this.renderer?.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life; return p.life > 0; } });
  }
  public createShockwave(x: number, y: number, radius: number, color: number) {
      const g = new Graphics(); g.lineStyle(2, color); g.drawCircle(0, 0, radius); g.position.set(x, y);
      this.renderer?.addParticle({ view: g, type: 'GRAPHICS', life: 0.3, maxLife: 0.3, update: (p:any, dt:number) => { p.life -= dt; p.view.scale.set(1 + (1 - p.life/p.maxLife)); p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
  }
  public createParticles(x: number, y: number, color: number, count: number) {
      for(let i=0; i<count; i++) {
          const g = new Graphics(); g.beginFill(color); g.drawRect(0,0,3,3); g.endFill(); g.position.set(x, y);
          const vx = (Math.random() - 0.5) * 100; const vy = (Math.random() - 0.5) * 100;
          this.renderer?.addParticle({ view: g, type: 'GRAPHICS', life: 0.5, maxLife: 0.5, update: (p:any, dt:number) => { p.life -= dt; p.view.x += vx * dt; p.view.y += vy * dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
      }
  }
  public createHealEffect(x: number, y: number) { this.createFloatingText(x, y - 10, "+", 0x00ff00, 14); }
  
  public dealTrueDamage(target: IUnit, amount: number) {
      if (target.isDead) return;
      target.stats.hp -= amount;
      if (target.stats.hp <= 0) { target.stats.hp = 0; this.killUnit(target); }
  }
  public killUnit(u: IUnit) {
      if (u.isDead) return;
      u.isDead = true;
      if (u.faction === Faction.HUMAN) {
          DataManager.instance.modifyResource('biomass', 5 * u.level);
          DataManager.instance.recordKill();
          if (Math.random() < 0.2) DataManager.instance.modifyResource('dna', 1);
          if (u.id % 5 === 0) DataManager.instance.updateRegionProgress(this.activeRegionId, 1);
      }
      for (const gene of u.geneConfig) {
          const trait = GeneLibrary.get(gene.id);
          if (trait && trait.onDeath) trait.onDeath(u, this, gene.params || {});
      }
  }
  public applyStatus(target: IUnit, type: StatusType, stacks: number, duration: number) {
      if (target.isDead) return;
      if (!target.statuses[type]) target.statuses[type] = { type, stacks: 0, duration: 0 };
      const s = target.statuses[type]!;
      s.stacks = Math.min(s.stacks + stacks, STATUS_CONFIG.MAX_STACKS);
      s.duration = Math.max(s.duration, duration);
  }
  public processDamagePipeline(source: IUnit, target: IUnit) {
      if (target.isDead || source.isDead) return;
      let damage = source.stats.damage;
      if (Math.random() < source.stats.critChance) { damage *= source.stats.critDamage; this.createFloatingText(target.x, target.y - 30, "CRIT!", 0xff0000, 16); }
      if (source.statuses['FRENZY']) damage *= 1.25;
      for (const gene of source.geneConfig) { const trait = GeneLibrary.get(gene.id); if (trait && trait.onHit) trait.onHit(source, target, damage, this, gene.params || {}); }
      let damageTaken = damage;
      if (source.stats.element === 'PHYSICAL') {
          let armor = target.stats.armor;
          if (target.statuses['ARMOR_BROKEN']) armor *= 0.5;
          damageTaken = damage * (100 / (100 + armor));
      }
      for (const gene of target.geneConfig) { const trait = GeneLibrary.get(gene.id); if (trait && trait.onWasHit) damageTaken = trait.onWasHit(target, source, damageTaken, this, gene.params || {}); }
      target.stats.hp -= damageTaken;
      this.createDamagePop(target.x, target.y - 10, damageTaken, source.stats.element);
      ReactionRegistry.handle(target, source.stats.element, this, damageTaken);
      if (target.stats.hp <= 0) { target.stats.hp = 0; this.killUnit(target); for (const gene of source.geneConfig) { const trait = GeneLibrary.get(gene.id); if (trait && trait.onKill) trait.onKill(source, target, this, gene.params || {}); } }
  }
  public performAttack(source: IUnit, target: IUnit) {
      if (source.isDead || target.isDead) return;
      let proceed = true;
      for (const gene of source.geneConfig) { const trait = GeneLibrary.get(gene.id); if (trait && trait.onPreAttack) { const result = trait.onPreAttack(source, target, this, gene.params || {}); if (result === false) proceed = false; } }
      if (proceed) this.processDamagePipeline(source, target);
  }
  public destroy() { this.renderer?.destroy(); }
}
