
import { DataManager, SimpleEventEmitter } from '../DataManager';
import { UnitPool } from '../Unit';
import { ObstacleDef, Faction, UnitType } from '../../types';
import { TERRAIN_CHUNKS } from '../../config/terrain';
import { STAGE_WIDTH } from '../../constants';
import { FlowField } from '../FlowField';

type LevelState = 'BATTLE' | 'TRANSITION';

export class LevelManager {
    public activeRegionId: number = 0;
    public currentStageIndex: number = 0;
    
    // Camera Position
    public cameraX: number = 0;
    private targetCameraX: number = 0;
    
    public activeObstacles: ObstacleDef[] = [];
    public currentState: LevelState = 'BATTLE';
    
    private unitPool: UnitPool;
    private events: SimpleEventEmitter;
    public flowField: FlowField;

    constructor(unitPool: UnitPool, events: SimpleEventEmitter) {
        this.unitPool = unitPool;
        this.events = events;
        this.flowField = new FlowField();
    }

    public loadRegion(regionId: number) {
        this.activeRegionId = regionId;
        const saved = DataManager.instance.state.world.regions[regionId];
        this.currentStageIndex = Math.floor(saved ? saved.devourProgress : 0);
        
        // Reset State
        this.activeObstacles = [];
        this.currentState = 'BATTLE';
        
        // Immediate Camera Lock
        this.updateCameraTarget();
        this.cameraX = this.targetCameraX;

        // Generate Current Stage
        this.generateStage(this.currentStageIndex);
        
        // Force Flow Field Update
        this.updateFlowField();
    }

    public update(dt: number, activeUnits: any[]) {
        // 1. Camera Logic: Smooth damp towards target center
        if (Math.abs(this.targetCameraX - this.cameraX) > 1) {
            this.cameraX += (this.targetCameraX - this.cameraX) * 0.05; 
        } else {
            this.cameraX = this.targetCameraX;
            // If transition finished, start next battle
            if (this.currentState === 'TRANSITION') {
                this.startNextStageBattle();
            }
        }

        // 2. Win Condition Check (Only during Battle)
        if (this.currentState === 'BATTLE') {
            this.checkWinCondition(activeUnits);
        }

        // 3. Flow Field Update
        this.updateFlowField();
    }

    private updateCameraTarget() {
        // Camera centers on current stage: (StageIndex * Width) + Half Width
        this.targetCameraX = (this.currentStageIndex * STAGE_WIDTH) + (STAGE_WIDTH / 2);
    }

    private checkWinCondition(activeUnits: any[]) {
        // Win if:
        // 1. No active human units
        // 2. No active WALL obstacles (Rocks don't count)
        
        const hasHumanUnits = activeUnits.some(u => u.faction === Faction.HUMAN && !u.isDead);
        
        const hasHumanBuildings = this.activeObstacles.some(obs => {
            return obs.type === 'WALL' && (obs.health || 0) > 0;
        });

        if (!hasHumanUnits && !hasHumanBuildings) {
            this.triggerStageComplete();
        }
    }

    private triggerStageComplete() {
        this.currentState = 'TRANSITION';
        
        this.events.emit('FX', { 
            type: 'TEXT', 
            x: this.cameraX, 
            y: -100, 
            text: "SECTOR CLEARED", 
            color: 0x00ff00, 
            fontSize: 40 
        });
        
        // Save Progress
        DataManager.instance.updateRegionProgress(this.activeRegionId, 1);
        
        // Advance Stage Index
        this.currentStageIndex++;
        this.updateCameraTarget(); 
        
        // Generate Next Stage Terrain immediately so we see it coming
        this.generateStage(this.currentStageIndex);
    }

    private startNextStageBattle() {
        this.currentState = 'BATTLE';
        this.cullOldObstacles();
    }

    public generateStage(stageIndex: number) {
        const templates = TERRAIN_CHUNKS['DEFAULT'] || [];
        const template = templates[stageIndex % templates.length];
        const stageOffsetX = stageIndex * STAGE_WIDTH;
        
        // Terrain
        const newObstacles = template.obstacles.map(def => ({ 
            ...def, 
            x: def.x + stageOffsetX, 
            maxHealth: def.health, 
            health: def.health,
            chunkId: `${stageIndex}_${template.id}`
        }));
        
        this.activeObstacles.push(...newObstacles);
        this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
        
        // Enemies
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
            return true;
        }
        return false;
    }

    private cullOldObstacles() {
        // Remove obstacles from previous stages
        const currentStageStart = this.currentStageIndex * STAGE_WIDTH;
        const count = this.activeObstacles.length;
        this.activeObstacles = this.activeObstacles.filter(o => o.x >= currentStageStart);
        
        if (this.activeObstacles.length !== count) {
             this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
        }
    }

    private updateFlowField() {
        // Flow field only covers current stage to save performance
        const startX = this.currentStageIndex * STAGE_WIDTH;
        const endX = startX + STAGE_WIDTH;
        
        // Targets logic:
        // In this simplified model, if there are no walls, flow field defaults right.
        // We pass empty targets because FlowField handles obstacles automatically.
        const targets: ObstacleDef[] = []; 
        
        this.flowField.update(this.activeObstacles, targets, startX, endX);
    }
    
    public getFlowVector(x: number, y: number) {
        return this.flowField.getVector(x, y);
    }
}
