
import { Graphics, Text, TextStyle } from 'pixi.js';
import { Faction, GameModifiers, UnitType, GameStateSnapshot, IUnit, IGameEngine, StatusType, ElementType, ObstacleDef } from '../types';
import { ELEMENT_COLORS, UNIT_SCREEN_CAPS, STAGE_WIDTH } from '../constants';
import { DataManager, SimpleEventEmitter } from './DataManager';
import { SpatialHash } from './SpatialHash';
import { WorldRenderer } from './renderers/WorldRenderer';
import { UnitPool } from './Unit';

// Systems
import { CombatSystem } from './systems/CombatSystem';
import { HarvestSystem } from './systems/HarvestSystem';
import { HiveVisualSystem } from './systems/HiveVisualSystem';
import { DeploymentSystem } from './systems/DeploymentSystem';
import { MetabolismSystem } from './systems/MetabolismSystem';
import { ProductionSystem } from './systems/ProductionSystem';
import { LevelManager } from './managers/LevelManager';

export class GameEngine implements IGameEngine {
  public renderer: WorldRenderer | null = null;
  public unitPool: UnitPool | null = null;
  public spatialHash: SpatialHash;
  public _sharedQueryBuffer: IUnit[] = [];
  public events: SimpleEventEmitter;
  
  public isSimulationAuthority: boolean = false;
  
  public set activeRegionId(id: number) { this.levelManager.activeRegionId = id; }
  public get activeRegionId() { return this.levelManager.activeRegionId; }
  public set humanDifficultyMultiplier(val: number) { }

  public get activeObstacles(): ObstacleDef[] {
      return this.levelManager ? this.levelManager.activeObstacles : [];
  }
  
  public cameraX: number = 0; 
  private userZoom: number = 1.0;
  public isPaused: boolean = false;
  
  public combatEnabled: boolean = true;
  
  public mode: 'COMBAT_VIEW' | 'HIVE' | 'HARVEST_VIEW' = 'HIVE';

  private combatSystem!: CombatSystem;
  private harvestSystem!: HarvestSystem;
  private hiveVisualSystem!: HiveVisualSystem;
  private deploymentSystem!: DeploymentSystem;
  public levelManager!: LevelManager;
  
  private metabolismSystem?: MetabolismSystem;
  private productionSystem?: ProductionSystem;

  private spawnListener: (data: any) => void;

  constructor(isAuthority: boolean = false) {
    this.spatialHash = new SpatialHash(100);
    this.events = new SimpleEventEmitter();
    this.isSimulationAuthority = isAuthority;

    this.spawnListener = (data: any) => {
        this.spawnUnit(data.faction, data.type, data.x);
    };
    this.events.on('REQUEST_SPAWN', this.spawnListener);

    if (this.isSimulationAuthority) {
        this.metabolismSystem = new MetabolismSystem();
        this.productionSystem = new ProductionSystem();
    }
  }

  async init(element: HTMLElement) {
    this.renderer = new WorldRenderer(element, this.events);
    await this.renderer.init();

    this.unitPool = new UnitPool(1500, this.renderer);
    
    this.levelManager = new LevelManager(this.unitPool, this.events);
    this.combatSystem = new CombatSystem(this, this.unitPool, this.spatialHash, this.levelManager);
    this.harvestSystem = new HarvestSystem(this.unitPool, this.events);
    this.hiveVisualSystem = new HiveVisualSystem(this.unitPool, this.renderer);
    this.deploymentSystem = new DeploymentSystem(this.unitPool, this.levelManager, this.events);

    const canvas = this.renderer.app!.view as unknown as HTMLCanvasElement;
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.renderer.app!.renderer.on('resize', this.resize.bind(this));
    this.resize(); 

    this.renderer.app!.ticker.add(this.update.bind(this));
    this.applyModeSettings();
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    this.userZoom = Math.max(1.0, Math.min(3.0, this.userZoom + delta));
    this.resize();
  }

  private resize() {
      if (!this.renderer || !this.renderer.app) return;
      
      const screenWidth = this.renderer.app.screen.width;
      
      // Calculate scale to fit STAGE_WIDTH into the screen width exactly at zoom 1.0
      const fitScale = screenWidth / STAGE_WIDTH;
      const finalScale = fitScale * this.userZoom;
      
      this.renderer.resize(finalScale, this.levelManager.cameraX, this.mode);
  }

  public setMode(mode: 'COMBAT_VIEW' | 'HIVE' | 'HARVEST_VIEW') {
      if (this.mode === mode) return;
      this.cleanupCurrentMode();
      this.mode = mode;
      this.applyModeSettings();
  }

  private cleanupCurrentMode() {
      this.combatSystem?.disable();
      if (this.deploymentSystem) this.deploymentSystem.isEnabled = false;
      this.harvestSystem?.cleanup();
      this.hiveVisualSystem?.cleanup();
  }

  private applyModeSettings() {
      if (!this.renderer) return;
      
      this.renderer.clear();
      this.renderer.hiveLayer.removeChildren();

      if (this.mode === 'HIVE') {
          this.hiveVisualSystem.init();
      } else if (this.mode === 'COMBAT_VIEW') {
          this.combatSystem.enable();
          this.deploymentSystem.isEnabled = true;
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

    if (this.isSimulationAuthority) {
        this.metabolismSystem?.update(dt, DataManager.instance);
        this.productionSystem?.update(dt, DataManager.instance);
    }

    if (this.mode === 'HIVE') {
        this.hiveVisualSystem.update(dt);
        this.renderer.updateParticles(dt);
        return;
    } else if (this.mode === 'HARVEST_VIEW') {
        this.harvestSystem.update(dt);
        this.renderer.updateParticles(dt);
        return;
    } else if (this.mode === 'COMBAT_VIEW') {
        this.deploymentSystem.isEnabled = this.combatEnabled;
        this.deploymentSystem.update(dt);
        this.combatSystem.update(dt);
        this.levelManager.update(dt, this.unitPool?.getActiveUnits() || []);
        
        if (this.renderer) {
             this.resize();
        }
    }

    const allUnits = this.unitPool?.getActiveUnits() || [];
    for (const u of allUnits) {
        this.renderer.updateUnitVisuals(u, this.mode);
    }
    this.renderer.updateParticles(dt);
  }

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
  
  public destroy() { 
      this.cleanupCurrentMode();
      if (this.renderer) {
          this.renderer.destroy();
          this.renderer = null;
      }
      this.events.off('REQUEST_SPAWN', this.spawnListener);
  }
}
