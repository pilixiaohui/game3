

import { UnitPool, Unit } from '../Unit';
import { DataManager, SimpleEventEmitter } from '../DataManager';
import { Faction, UnitType, HarvestNodeDef } from '../../types';

export class HarvestSystem {
    private unitPool: UnitPool;
    private events: SimpleEventEmitter;
    private harvestNodes: HarvestNodeDef[] = [];

    constructor(unitPool: UnitPool, events: SimpleEventEmitter) {
        this.unitPool = unitPool;
        this.events = events;
    }

    public init(regionId: number) {
        this.cleanup();
        
        // Determine richness based on region data
        const region = DataManager.instance.state.world.regions[regionId];
        const richnessMultiplier = region ? (1 + (region.devourProgress / 100)) : 1.0;
        
        this.generateHarvestNodes(richnessMultiplier);
        this.spawnHarvesters();
    }

    public cleanup() {
         this.harvestNodes = [];
         this.events.emit('HARVEST_NODES_UPDATED', []);
    }

    public update(dt: number) {
        const units = this.unitPool.getActiveUnits();
        for (const u of units) {
            if (u.faction === Faction.ZERG) {
                this.updateHarvester(u, dt);
            }
        }
    }

    private generateHarvestNodes(multiplier: number) {
        const baseNodes = 6;
        const count = Math.floor(baseNodes * Math.sqrt(multiplier));
        this.harvestNodes = [];

        for(let i=0; i<count; i++) {
            // Scatter nodes around center
            const dist = 200 + Math.random() * 400;
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * dist; 
            const y = Math.sin(angle) * dist * 0.5; // Elliptical distribution
            
            this.harvestNodes.push({
                id: `node_${i}_${Date.now()}`,
                x, y, 
                amount: 9999, // Infinite for now
                richness: multiplier
            });
        }
        
        this.events.emit('HARVEST_NODES_UPDATED', this.harvestNodes);
    }
    
    private spawnHarvesters() {
        // Spawn count based on stockpile or upgrades
        const count = 15;
        
        for(let i=0; i<count; i++) {
            const u = this.unitPool.spawn(Faction.ZERG, UnitType.MELEE, 0, DataManager.instance.modifiers);
            if (u) { 
                u.x = (Math.random() - 0.5) * 50;
                u.y = (Math.random() - 0.5) * 50;
                u.stats.speed = 180; 
                u.state = 'IDLE';
                u.context.carryAmount = 0;
                u.context.capacity = 10;
            }
        }
    }

    private updateHarvester(u: Unit, dt: number) {
         // --- STATE MACHINE ---
         
         if (u.state === 'IDLE') {
             // Find nearest node
             let minDist = 999999;
             let target = null;
             for(const node of this.harvestNodes) {
                 const d = (node.x - u.x)**2 + (node.y - u.y)**2;
                 if (d < minDist) { minDist = d; target = node; }
             }
             if (target) {
                 u.context.harvestTarget = target;
                 u.state = 'SEEK';
             }
         }
         
         else if (u.state === 'SEEK') {
             const target = u.context.harvestTarget;
             if (target) {
                 const dx = target.x - u.x;
                 const dy = target.y - u.y;
                 const distSq = dx*dx + dy*dy;
                 
                 if (distSq < 400) { // Reached node (20px radius)
                     u.state = 'HARVEST';
                     u.context.harvestTimer = 0;
                 } else {
                     const dist = Math.sqrt(distSq);
                     u.x += (dx/dist) * u.stats.speed * dt;
                     u.y += (dy/dist) * u.stats.speed * dt;
                     u.steeringForce.x = dx; // For visual facing
                 }
             } else {
                 u.state = 'IDLE';
             }
         }
         
         else if (u.state === 'HARVEST') {
             u.context.harvestTimer += dt;
             // Harvest takes 1.0 seconds
             if (u.context.harvestTimer > 1.0) {
                 u.context.carryAmount = u.context.capacity;
                 u.state = 'RETURN';
             }
         }
         
         else if (u.state === 'RETURN') {
             const dx = 0 - u.x; // Return to (0,0)
             const dy = 0 - u.y;
             const distSq = dx*dx + dy*dy;
             
             if (distSq < 400) { // Reached Hive
                 u.state = 'DEPOSIT';
             } else {
                 const dist = Math.sqrt(distSq);
                 u.x += (dx/dist) * u.stats.speed * dt;
                 u.y += (dy/dist) * u.stats.speed * dt;
                 u.steeringForce.x = dx;
             }
         }
         
         else if (u.state === 'DEPOSIT') {
             // Instant deposit
             DataManager.instance.modifyResource('biomass', u.context.carryAmount);
             
             // Visual Feedback
             this.events.emit('FX', { 
                 type: 'TEXT', 
                 x: u.x, 
                 y: u.y - 30, 
                 text: '+' + Math.floor(u.context.carryAmount), 
                 color: 0x4ade80, // Green
                 fontSize: 14 // Larger font for deposits
             });

             u.context.carryAmount = 0;
             u.state = 'IDLE'; // Loop back to seek
         }
    }
}