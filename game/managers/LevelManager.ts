import { DataManager, SimpleEventEmitter } from '../DataManager';
import { UnitPool } from '../Unit';
import { ObstacleDef, RegionData, Faction, UnitType } from '../../types';
import { TERRAIN_CHUNKS } from '../../config/terrain';
import { STAGE_WIDTH, LANE_Y } from '../../constants';
import { FlowField } from '../FlowField';

export class LevelManager {
    public activeRegionId: number = 0;
    public loadedRegionId: number = -1; // Track currently loaded region
    public currentStageIndex: number = 0;
    public cameraX: number = 0;
    public activeObstacles: ObstacleDef[] = [];
    
    private unitPool: UnitPool;
    private events: SimpleEventEmitter;
    private lastGeneratedStage: number = -1;
    public flowField: FlowField;

    constructor(unitPool: UnitPool, events: SimpleEventEmitter) {
        this.unitPool = unitPool;
        this.events = events;
        this.flowField = new FlowField();
    }

    public loadRegion(regionId: number) {
        // Persistence Check: If we are just switching back to view the battle, don't reset everything.
        if (this.loadedRegionId === regionId) {
             // Just ensure activeRegionId is synced, but don't regenerate
             this.activeRegionId = regionId;
             return;
        }

        this.activeRegionId = regionId;
        this.loadedRegionId = regionId;
        
        const saved = DataManager.instance.state.world.regions[regionId];
        this.currentStageIndex = Math.floor(saved ? saved.devourProgress : 0);
        this.cameraX = this.currentStageIndex * STAGE_WIDTH;
        
        // Cleanup old enemies before generating new ones
        const activeUnits = this.unitPool.getActiveUnits();
        activeUnits.forEach(u => {
            if (u.faction === Faction.HUMAN) this.unitPool.recycle(u);
        });

        // Reset Terrain State for the new region
        this.activeObstacles = [];
        this.lastGeneratedStage = -1;

        // Pre-generate current and next stage to ensure visibility
        this.generateChunk(this.currentStageIndex);
        this.generateChunk(this.currentStageIndex + 1);
        
        this.updateFlowField();
    }

    public update(dt: number, activeUnits: any[]) {
        // Camera Follow Logic (Calculates data, doesn't render)
        let targetX = this.cameraX;
        let leadZergX = -99999;
        let zergCount = 0;
        
        for (const u of activeUnits) {
            if (u.faction === Faction.ZERG && !u.isDead) {
                if (u.x > leadZergX) leadZergX = u.x;
                zergCount++;
            }
        }
        
        if (zergCount > 0) targetX = leadZergX + 300;

        // Wall Limiter
        let limitX = 999999;
        for (const wall of this.activeObstacles) {
            if (wall.type === 'WALL' && wall.x > this.cameraX && wall.x < limitX) limitX = wall.x;
        }
        
        if (targetX > limitX - 200) targetX = limitX - 200;
        
        this.cameraX += (targetX - this.cameraX) * 0.1;

        // --- ENDLESS GENERATION LOGIC ---
        // Determine the stage index at the right edge of the screen (approx cameraX + width)
        const lookAheadStage = Math.floor((this.cameraX + STAGE_WIDTH) / STAGE_WIDTH);
        
        // If we are looking into a stage that hasn't been generated yet, generate it.
        // We typically generate one step ahead of the last generated one to keep continuity.
        if (lookAheadStage > this.lastGeneratedStage) {
            this.generateChunk(this.lastGeneratedStage + 1);
            this.updateFlowField();
            this.cullOldObstacles();
        }
    }

    private cullOldObstacles() {
        // Remove obstacles 2 stages behind
        const thresholdX = this.cameraX - (STAGE_WIDTH * 2);
        const originalCount = this.activeObstacles.length;
        this.activeObstacles = this.activeObstacles.filter(o => o.x > thresholdX);
        
        if (this.activeObstacles.length !== originalCount) {
             this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
        }
    }

    public generateChunk(stageIndex: number) {
        // Prevent duplicate generation
        if (stageIndex <= this.lastGeneratedStage && this.lastGeneratedStage !== -1) return;
        
        this.lastGeneratedStage = stageIndex;

        const templates = TERRAIN_CHUNKS['DEFAULT'] || [];
        const template = templates[stageIndex % templates.length];
        const stageOffsetX = stageIndex * STAGE_WIDTH;
        
        // Create new obstacles with offset
        const newObstacles = template.obstacles.map(def => ({ 
            ...def, 
            x: def.x + stageOffsetX, 
            maxHealth: def.health, 
            health: def.health 
        }));
        
        // Append to active obstacles (Endless)
        this.activeObstacles.push(...newObstacles);
        
        // Notify renderer via event
        this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
        
        // Spawn Enemies
        // Calculate dynamic difficulty: Base for region + distance scaling
        const difficultyLevel = (this.activeRegionId * 5) + stageIndex;

        template.spawnPoints.forEach(sp => {
            this.unitPool.spawn(
                Faction.HUMAN, 
                sp.type as UnitType, 
                sp.x + stageOffsetX, 
                DataManager.instance.modifiers, 
                difficultyLevel
            );
        });
    }

    public damageObstacle(obs: ObstacleDef, dmg: number): boolean {
        if (!obs.health) return false;
        obs.health -= dmg;
        if (obs.health <= 0) {
            this.activeObstacles = this.activeObstacles.filter(o => o !== obs);
            this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
            this.updateFlowField();
            return true;
        }
        return false;
    }

    private updateFlowField() {
        const startX = Math.max(0, this.cameraX - 500);
        const endX = this.cameraX + 2000;
        this.flowField.update(this.activeObstacles, startX, endX);
    }
    
    public getFlowVector(x: number, y: number) {
        return this.flowField.getVector(x, y);
    }
}