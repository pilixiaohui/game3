
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

    public init() {
        // Clear old nodes if any (simplified)
        this.harvestNodes = [];
        this.generateHarvestNodes();
        this.spawnHarvesters();
    }

    public cleanup() {
         // Cleanup logic if needed (e.g. remove node graphics)
         this.harvestNodes.forEach(n => n.view.destroy());
         this.harvestNodes = [];
    }

    public update(dt: number) {
        const units = this.unitPool.getActiveUnits();
        for (const u of units) {
            if (u.faction === Faction.ZERG) {
                this.updateHarvester(u, dt);
                // Simple visual update, ideally delegated to renderer but doing here for simplicity of system isolation
                if (u.view) {
                     u.view.position.set(u.x, u.y);
                     u.view.rotation = Math.atan2(u.y, u.x) || 0; // Look at center or target
                }
            }
        }
    }

    private generateHarvestNodes() {
        for(let i=0; i<5; i++) {
            const x = (Math.random() - 0.5) * 600; 
            const y = (Math.random() - 0.5) * 400;
            const g = new Graphics(); 
            g.beginFill(0x00ff00, 0.5); 
            g.drawCircle(0, 0, 15); 
            g.endFill(); 
            g.position.set(x, y);
            this.renderer.terrainLayer.addChild(g);
            this.harvestNodes.push({ x, y, amount: 9999, view: g });
        }
    }
    
    private spawnHarvesters() {
        for(let i=0; i<10; i++) {
            const u = this.unitPool.spawn(Faction.ZERG, UnitType.MELEE, 0, DataManager.instance.modifiers);
            if (u) { u.y = 0; u.stats.speed = 150; }
        }
    }

    private updateHarvester(u: Unit, dt: number) {
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
                 // Visual popup handled by main engine or passed in, assuming engine global for now or just skip
                 DataManager.instance.modifyResource('biomass', 1);
             }
         } else if (u.state === 'RETURN') {
             const dx = 0 - u.x; const dy = 0 - u.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist < 10) { u.state = 'IDLE'; u.context.harvestTarget = null; } 
             else { u.x += (dx/dist) * u.stats.speed * dt; u.y += (dy/dist) * u.stats.speed * dt; }
         }
    }
}
