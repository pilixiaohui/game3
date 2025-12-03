

import { DataManager, SimpleEventEmitter } from '../DataManager';
import { UnitPool } from '../Unit';
import { ObstacleDef, RegionData, Faction, UnitType } from '../../types';
import { TERRAIN_CHUNKS } from '../../config/terrain';
import { STAGE_WIDTH, LANE_Y } from '../../constants';
import { FlowField } from '../FlowField';

type GameState = 'MARCH' | 'SIEGE';

export class LevelManager {
    public activeRegionId: number = 0;
    public loadedRegionId: number = -1; // Track currently loaded region
    public currentStageIndex: number = 0;
    public cameraX: number = 0;
    public activeObstacles: ObstacleDef[] = [];
    public currentState: GameState = 'MARCH';
    
    private unitPool: UnitPool;
    private events: SimpleEventEmitter;
    private lastGeneratedStage: number = -1;
    public flowField: FlowField;

    // Siege Logic
    private currentSiegeTargetX: number = 0;
    private activeSiegeObstacleIds: Set<ObstacleDef> = new Set();

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
        this.currentState = 'MARCH';
        
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
        this.activeSiegeObstacleIds.clear();
        this.lastGeneratedStage = -1;

        // Pre-generate current and next stage to ensure visibility
        this.generateChunk(this.currentStageIndex);
        this.generateChunk(this.currentStageIndex + 1);
        
        this.updateFlowField();
    }

    public update(dt: number, activeUnits: any[]) {
        let targetX = this.cameraX;

        // --- STATE MACHINE: MARCH vs SIEGE ---

        if (this.currentState === 'SIEGE') {
             // Check victory condition: Are all active siege obstacles destroyed?
             if (this.activeSiegeObstacleIds.size === 0) {
                 this.currentState = 'MARCH';
                 this.events.emit('FX', { type: 'TEXT', x: this.cameraX + 400, y: 0, text: "BREACH!", color: 0x00ff00, fontSize: 30 });
             } else {
                 // Lock camera to siege target
                 targetX = this.currentSiegeTargetX;
                 
                 // Verify obstacles are still alive (double check)
                 this.activeSiegeObstacleIds.forEach(obs => {
                     if (!this.activeObstacles.includes(obs)) {
                         this.activeSiegeObstacleIds.delete(obs);
                     }
                 });
             }
        } 
        
        if (this.currentState === 'MARCH') {
            // Camera Follow Logic (Lead Zerg)
            let leadZergX = -99999;
            let zergCount = 0;
            
            for (const u of activeUnits) {
                if (u.faction === Faction.ZERG && !u.isDead) {
                    if (u.x > leadZergX) leadZergX = u.x;
                    zergCount++;
                }
            }
            
            if (zergCount > 0) targetX = leadZergX + 300;

            // Fallback: drift forward slowly if no zergs, to show enemies
            if (zergCount === 0) targetX += 50 * dt;

            // Prevent back-tracking
            if (targetX < this.cameraX) targetX = this.cameraX;
        }

        // Apply Camera Smoothing
        this.cameraX += (targetX - this.cameraX) * 0.08;

        // --- ENDLESS GENERATION LOGIC ---
        const lookAheadStage = Math.floor((this.cameraX + STAGE_WIDTH) / STAGE_WIDTH);
        
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
            health: def.health,
            chunkId: `${stageIndex}_${template.id}`
        }));
        
        // Append to active obstacles (Endless)
        this.activeObstacles.push(...newObstacles);
        
        // SIEGE TRIGGER LOGIC
        if (template.isStronghold && this.currentState !== 'SIEGE') {
             // Look for major walls to be the "Lock Target"
             const walls = newObstacles.filter(o => o.type === 'WALL' && (o.health || 0) > 2000);
             if (walls.length > 0) {
                 // Determine lock position (average x of walls - offset)
                 const avgX = walls.reduce((sum, w) => sum + w.x, 0) / walls.length;
                 
                 // If this is the *immediate* next chunk (or close), engage Siege
                 // Note: generateChunk runs ahead. We set logic to trigger siege when camera gets close?
                 // For simplicity in this flow, we set up the siege data, and update loop engages it if near.
                 // Actually, simpler: Since we generate ahead, let's just mark these obstacles.
                 
                 // Logic change: We just add them to a tracking set. 
                 // If the camera gets close to them in Update, we switch state.
                 // Wait, Update loop uses state to determine camera.
                 // Let's force siege if we generated a siege chunk and we are close? 
                 // Better: "Trigger" lines.
             }
        }

        // Notify renderer via event
        this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
        
        // Spawn Enemies
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

        // Trigger Siege State Check immediately if relevant
        if (template.isStronghold) {
            // Find key obstacles to lock onto
            const fortressObstacles = newObstacles.filter(o => o.type === 'WALL' || o.type === 'WATER');
            if (fortressObstacles.length > 0) {
                 // We simply switch to siege mode when we generate it? 
                 // No, that would snap camera.
                 // We will let the update loop detect "Approaching Siege".
                 // For now, let's just set the Siege Target and allow camera to drift to it, then lock.
                 
                 const targetX = (stageOffsetX + template.width / 2) - 400; // Center screen on stronghold
                 this.currentSiegeTargetX = targetX;
                 
                 // Register obstacles that must be destroyed
                 fortressObstacles.forEach(o => {
                     if (o.type === 'WALL') this.activeSiegeObstacleIds.add(o);
                 });

                 // If we have valid targets, engage siege mode logic in next update frames
                 if (this.activeSiegeObstacleIds.size > 0) {
                      this.currentState = 'SIEGE';
                      this.events.emit('FX', { type: 'TEXT', x: this.cameraX + 400, y: 0, text: "SIEGE DETECTED", color: 0xff0000, fontSize: 24 });
                 }
            }
        }
    }

    public damageObstacle(obs: ObstacleDef, dmg: number): boolean {
        if (!obs.health) return false;
        obs.health -= dmg;
        if (obs.health <= 0) {
            this.activeObstacles = this.activeObstacles.filter(o => o !== obs);
            
            if (this.activeSiegeObstacleIds.has(obs)) {
                this.activeSiegeObstacleIds.delete(obs);
            }
            
            this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
            this.updateFlowField();
            return true;
        }
        return false;
    }

    private updateFlowField() {
        // Optimize: Only update for visible range + buffer
        const startX = Math.max(0, this.cameraX - 500);
        const endX = this.cameraX + 2000;
        this.flowField.update(this.activeObstacles, startX, endX);
    }
    
    public getFlowVector(x: number, y: number) {
        return this.flowField.getVector(x, y);
    }
}
