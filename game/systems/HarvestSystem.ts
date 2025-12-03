
import { Graphics } from 'pixi.js';
import { UnitPool, Unit } from '../Unit';
import { WorldRenderer } from '../renderers/WorldRenderer';
import { DataManager } from '../DataManager';
import { Faction, UnitType } from '../../types';

export class HarvestSystem {
    private unitPool: UnitPool;
    private renderer: WorldRenderer;
    private harvestNodes: { x: number, y: number, amount: number, view: Graphics }[] = [];

    constructor(unitPool: UnitPool, renderer: WorldRenderer) {
        this.unitPool = unitPool;
        this.renderer = renderer;
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
         this.harvestNodes.forEach(n => n.view.destroy());
         this.harvestNodes = [];
    }

    public update(dt: number) {
        const units = this.unitPool.getActiveUnits();
        for (const u of units) {
            if (u.faction === Faction.ZERG) {
                this.updateHarvester(u, dt);
                
                // Visual Sync
                if (u.view) {
                     u.view.position.set(u.x, u.y);
                     // Very simple rotation to face movement
                     if (u.steeringForce.x !== 0) {
                         u.view.scale.x = u.steeringForce.x > 0 ? 1 : -1;
                     }
                }
            }
        }
    }

    private generateHarvestNodes(multiplier: number) {
        const baseNodes = 6;
        const count = Math.floor(baseNodes * Math.sqrt(multiplier));
        
        for(let i=0; i<count; i++) {
            // Scatter nodes around center
            const dist = 200 + Math.random() * 400;
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * dist; 
            const y = Math.sin(angle) * dist * 0.5; // Elliptical distribution

            const g = new Graphics(); 
            // Richer nodes are brighter
            const alpha = Math.min(1.0, 0.4 * multiplier);
            g.beginFill(0x00ff00, alpha); 
            g.drawCircle(0, 0, 15 + (multiplier * 2)); 
            g.beginFill(0x004400, 0.8);
            g.drawCircle(0, 0, 5);
            g.endFill(); 
            g.position.set(x, y);
            
            this.renderer.terrainLayer.addChild(g);
            this.harvestNodes.push({ x, y, amount: 9999, view: g });
        }
        
        // Draw Central Hive Depot
        const hive = new Graphics();
        hive.beginFill(0x550055);
        hive.drawCircle(0, 0, 40);
        hive.lineStyle(2, 0xaa00aa);
        hive.drawCircle(0, 0, 45 + Math.sin(Date.now()/500)*5);
        hive.endFill();
        this.renderer.terrainLayer.addChild(hive);
    }
    
    private spawnHarvesters() {
        // Spawn count based on stockpile or upgrades could go here
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
             u.context.carryAmount = 0;
             u.state = 'IDLE'; // Loop back to seek
         }
    }
}
