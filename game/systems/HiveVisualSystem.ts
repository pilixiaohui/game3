
import { Graphics } from 'pixi.js';
import { UnitPool, Unit } from '../Unit';
import { WorldRenderer } from '../renderers/WorldRenderer';
import { DataManager } from '../DataManager';
import { UnitType, Faction } from '../../types';
import { UNIT_CONFIGS } from '../../constants';

export class HiveVisualSystem {
    private unitPool: UnitPool;
    private renderer: WorldRenderer;
    private hiveGraphics: Graphics | null = null;
    private eggPositions: Record<UnitType, {x: number, y: number, scale: number}> = {} as any;
    private lastStockpileCounts: Record<UnitType, number> = {} as any;

    constructor(unitPool: UnitPool, renderer: WorldRenderer) {
        this.unitPool = unitPool;
        this.renderer = renderer;
    }

    public init() {
        this.hiveGraphics = new Graphics();
        this.renderer.hiveLayer.addChild(this.hiveGraphics);
        this.generateHiveVisuals();
    }

    public cleanup() {
        if (this.hiveGraphics) {
            this.hiveGraphics.clear();
            this.hiveGraphics.destroy();
            this.hiveGraphics = null;
        }
    }

    public update(dt: number) {
        if (!this.hiveGraphics) return;
        this.updateHiveGraphics();

        // Animate Larva/Units
        const visualUnits = this.unitPool.getActiveUnits();
        for (const u of visualUnits) {
             this.updateUnitVisualLogic(u, dt);
             this.renderer.updateUnitVisuals(u, 'HIVE');
             if (u.context.isHiveVisual && Math.abs(u.x) < 20) {
                 this.unitPool.recycle(u);
             }
        }
    }

    private generateHiveVisuals() {
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

    private updateHiveGraphics() {
        if (!this.hiveGraphics) return;
        const g = this.hiveGraphics;
        g.clear();
        const time = Date.now() / 1000;

        // Central Pillar
        g.beginFill(0x1a0505); g.lineStyle(4, 0x441111);
        g.drawRect(-40, -600, 80, 1200);
        g.endFill();
        
        const unlocked = DataManager.instance.state.hive.unlockedUnits;
        const currentStockpile = DataManager.instance.state.hive.unitStockpile;
        
        for (const type of Object.keys(this.eggPositions) as UnitType[]) {
            const pos = this.eggPositions[type];
            const data = unlocked[type];
            if (!data) continue;
            
            // Pulse if producing
            if (data.isProducing) pos.scale = 1.0 + Math.sin(time * 10) * 0.05; else pos.scale = 1.0;
            
            // Draw Connection
            g.lineStyle(3, 0x331111); 
            g.moveTo(0, pos.y); 
            g.quadraticCurveTo(pos.x/2, pos.y + 20, pos.x, pos.y);
            
            // Draw Egg/Pod
            const color = UNIT_CONFIGS[type]?.baseStats.color || 0xffffff;
            g.lineStyle(2, data.isProducing ? 0x00ff00 : 0x555555);
            g.beginFill(0x111111); 
            g.drawCircle(pos.x, pos.y, 30 * pos.scale); 
            g.endFill();
            
            g.beginFill(color, data.isProducing ? 0.8 : 0.3); 
            g.drawCircle(pos.x, pos.y, 20 * pos.scale); 
            g.endFill();
            
            // Spawn Visual Unit on Stockpile Increase
            const newCount = currentStockpile[type] || 0;
            if (newCount > (this.lastStockpileCounts[type] || 0)) {
                this.spawnVisualUnit(type, pos);
            }
            this.lastStockpileCounts[type] = newCount;
        }
    }

    private spawnVisualUnit(type: UnitType, pos: {x: number, y: number}) {
        const u = this.unitPool.spawn(Faction.ZERG, type, pos.x, DataManager.instance.modifiers);
        if (u) {
            u.y = pos.y; 
            u.target = { x: 0, y: pos.y } as any; 
            u.state = 'MOVE'; 
            u.context.isHiveVisual = true; 
            u.stats.speed = 100;
            u.geneConfig = [{ id: 'GENE_COMBAT_MOVEMENT' }];
        }
    }

    private updateUnitVisualLogic(u: Unit, dt: number) {
        const velocity = { x: 0, y: 0 };
        // Simple logic for visual movement
        if (u.context.isHiveVisual) {
             const dx = 0 - u.x;
             const dy = 0 - u.y; // Move to center
             // Very simple linear move
             if (Math.abs(dx) > 5) u.x += (dx > 0 ? 1 : -1) * u.stats.speed * dt;
        }
    }
}
