
import { DataManager, SimpleEventEmitter } from '../DataManager';
import { UnitPool } from '../Unit';
import { ObstacleDef, RegionData, Faction, UnitType } from '../../types';
import { TERRAIN_CHUNKS } from '../../config/terrain';
import { STAGE_WIDTH, LANE_Y } from '../../constants';

export class LevelManager {
    public activeRegionId: number = 0;
    public currentStageIndex: number = 0;
    public cameraX: number = 0;
    public activeObstacles: ObstacleDef[] = [];
    
    private unitPool: UnitPool;
    private events: SimpleEventEmitter;

    constructor(unitPool: UnitPool, events: SimpleEventEmitter) {
        this.unitPool = unitPool;
        this.events = events;
    }

    public loadRegion(regionId: number) {
        this.activeRegionId = regionId;
        const saved = DataManager.instance.state.world.regions[regionId];
        this.currentStageIndex = Math.floor(saved ? saved.devourProgress : 0);
        this.cameraX = this.currentStageIndex * STAGE_WIDTH;
        this.generateTerrain(this.currentStageIndex);
    }

    public update(dt: number, activeUnits: any[]) {
        // Camera Follow Logic (Logic only, used by Engine to set Renderer prop)
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
    }

    public generateTerrain(stageIndex: number) {
        const templates = TERRAIN_CHUNKS['DEFAULT'] || [];
        const template = templates[stageIndex % templates.length];
        const stageOffsetX = stageIndex * STAGE_WIDTH;
        
        this.activeObstacles = template.obstacles.map(def => ({ 
            ...def, 
            x: def.x + stageOffsetX, 
            maxHealth: def.health, 
            health: def.health 
        }));
        
        // Strictly event-driven update (TERRAIN_UPDATED)
        this.events.emit('TERRAIN_UPDATED', this.activeObstacles);
        
        // Spawn Enemies
        template.spawnPoints.forEach(sp => {
            this.unitPool.spawn(
                Faction.HUMAN, 
                sp.type as UnitType, 
                sp.x + stageOffsetX, 
                DataManager.instance.modifiers, 
                stageIndex + 5
            );
        });
    }

    public damageObstacle(obs: ObstacleDef, dmg: number): boolean {
        if (!obs.health) return false;
        obs.health -= dmg;
        if (obs.health <= 0) {
            this.activeObstacles = this.activeObstacles.filter(o => o !== obs);
            this.events.emit('TERRAIN_UPDATED', this.activeObstacles);
            return true;
        }
        return false;
    }
}
