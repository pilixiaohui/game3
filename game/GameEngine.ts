
import { Graphics, Text, TextStyle } from 'pixi.js';
import { Faction, GameModifiers, UnitType, GameStateSnapshot, IUnit, IGameEngine, StatusType, ElementType, ObstacleDef } from '../types';
import { ELEMENT_COLORS, UNIT_SCREEN_CAPS } from '../constants';
import { DataManager, SimpleEventEmitter } from './DataManager';
import { SpatialHash } from './SpatialHash';
import { WorldRenderer } from './renderers/WorldRenderer';
import { UnitPool } from './Unit';

// Systems
import { CombatSystem } from './systems/CombatSystem';
import { HarvestSystem } from './systems/HarvestSystem';
import { HiveVisualSystem } from './systems/HiveVisualSystem';
import { DeploymentSystem } from './systems/DeploymentSystem';
import { LevelManager } from './managers/LevelManager';

export class GameEngine implements IGameEngine {
  public renderer: WorldRenderer | null = null;
  public unitPool: UnitPool | null = null;
  public spatialHash: SpatialHash;
  public _sharedQueryBuffer: IUnit[] = [];
  public events: SimpleEventEmitter;
  
  // Authority: If true, this engine instance is responsible for updating the DataManager (Game Heartbeat/Economy)
  // If false, it only runs visual simulation and local combat prediction (Surface View)
  public isSimulationAuthority: boolean = false;
  
  public set activeRegionId(id: number) { this.levelManager.activeRegionId = id; }
  public get activeRegionId() { return this.levelManager.activeRegionId; }
  public set humanDifficultyMultiplier(val: number) { /* handled in spawning */ }

  public get activeObstacles(): ObstacleDef[] {
      return this.levelManager ? this.levelManager.activeObstacles : [];
  }
  
  public cameraX: number = 0; 
  private userZoom: number = 1.0;
  public isPaused: boolean = false;
  
  // Combat State
  public combatEnabled: boolean = true;
  
  public mode: 'COMBAT_VIEW' | 'HIVE' | 'HARVEST_VIEW' = 'HIVE';

  // Systems
  private combatSystem!: CombatSystem;
  private harvestSystem!: HarvestSystem;
  private hiveVisualSystem!: HiveVisualSystem;
  private deploymentSystem!: DeploymentSystem;
  private levelManager!: LevelManager;

  constructor(isAuthority: boolean = false) {
    this.spatialHash = new SpatialHash(100);
    this.events = new SimpleEventEmitter();
    this.isSimulationAuthority = isAuthority;

    // Listen to Spawn Requests
    this.events.on('REQUEST_SPAWN', (data: any) => {
        this.spawnUnit(data.faction, data.type, data.x);
    });
  }

  async init(element: HTMLElement) {
    this.renderer = new WorldRenderer(element, this.events);
    this.unitPool = new UnitPool(1500, this.renderer);
    
    // Initialize Systems
    this.levelManager = new LevelManager(this.unitPool, this.events);
    this.combatSystem = new CombatSystem(this, this.unitPool, this.spatialHash, this.levelManager);
    this.harvestSystem = new HarvestSystem(this.unitPool, this.events);
    this.hiveVisualSystem = new HiveVisualSystem(this.unitPool, this.renderer);
    this.deploymentSystem = new DeploymentSystem(this.unitPool, this.levelManager, this.events);

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
      // Sync camera immediately on resize
      this.renderer.resize(scaleFactor, this.levelManager.cameraX, this.mode);
  }

  public setMode(mode: 'COMBAT_VIEW' | 'HIVE' | 'HARVEST_VIEW') {
      if (this.mode === mode) return;
      this.mode = mode;
      this.applyModeSettings();
  }

  private applyModeSettings() {
      if (!this.renderer) return;
      
      this.renderer.clear();
      this.renderer.hiveLayer.removeChildren();
      this.harvestSystem.cleanup();
      this.hiveVisualSystem.cleanup();

      if (this.mode === 'HIVE') {
          this.hiveVisualSystem.init();
      } else if (this.mode === 'COMBAT_VIEW') {
          this.levelManager.loadRegion(this.activeRegionId);
      } else if (this.mode === 'HARVEST_VIEW') {
          this.harvestSystem.init(this.activeRegionId);
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

    // --- 1. GLOBAL ECONOMY AUTHORITY ---
    // Only the designated authority (UndergroundView) drives the global data store tick.
    if (this.isSimulationAuthority) {
        DataManager.instance.updateTick(dt);
    }

    // --- 2. LOCAL SIMULATION LOOP ---
    // These run REGARDLESS of authority. If we are in SurfaceView (non-authority),
    // we still need to run the combat physics so the user sees the battle happening.
    
    if (this.mode === 'HIVE') {
        this.hiveVisualSystem.update(dt);
        this.renderer.updateParticles(dt);
        return;
    } else if (this.mode === 'HARVEST_VIEW') {
        this.harvestSystem.update(dt);
        this.renderer.updateParticles(dt);
        return;
    } else if (this.mode === 'COMBAT_VIEW') {
        // [CRITICAL FIX] Combat & Deployment run on SurfaceView
        this.deploymentSystem.isEnabled = this.combatEnabled;
        this.deploymentSystem.update(dt);
        
        this.combatSystem.update(dt);
        this.levelManager.update(dt, this.unitPool?.getActiveUnits() || []);
        
        // SYNC CAMERA: Logic calculates it, Engine applies it to Renderer
        if (this.renderer) {
             this.renderer.resize(this.renderer.world.scale.x, this.levelManager.cameraX, this.mode);
        }
    }

    // Visual Updates (Run on both engines)
    const allUnits = this.unitPool?.getActiveUnits() || [];
    for (const u of allUnits) {
        this.renderer.updateUnitVisuals(u, this.mode);
    }
    this.renderer.updateParticles(dt);
  }

  // --- INTERNAL LOGIC ---
  
  private spawnUnit(faction: Faction, type: UnitType, x: number): IUnit | null {
      const level = (faction === Faction.HUMAN) ? (this.levelManager.currentStageIndex + 1) : 1;
      return this.unitPool ? this.unitPool.spawn(faction, type, x, DataManager.instance.modifiers, level) : null;
  }
  
  public getSnapshot(): GameStateSnapshot {
      const activeUnits = this.unitPool ? this.unitPool.getActiveUnits() : [];
      const zerg = activeUnits.filter(u => u.faction === Faction.ZERG && !u.isDead);
      const counts: Record<string, number> = {};
      zerg.forEach(u => counts[u.type] = (counts[u.type] || 0) + 1);
      return {
          resources: 0, distance: this.levelManager.currentStageIndex,
          unitCountZerg: zerg.length,
          unitCountHuman: activeUnits.filter(u => u.faction === Faction.HUMAN && !u.isDead).length,
          isPaused: this.isPaused, stockpileMelee: 0, stockpileRanged: 0, stockpileTotal: 0, populationCap: 0,
          activeZergCounts: counts
      };
  }
  
  public destroy() { this.renderer?.destroy(); }
}
