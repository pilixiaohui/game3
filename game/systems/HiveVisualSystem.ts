
import { Graphics, Container } from 'pixi.js';
import { UnitPool, Unit } from '../Unit';
import { WorldRenderer } from '../renderers/WorldRenderer';
import { DataManager } from '../DataManager';
import { UnitType, Faction } from '../../types';
import { UNIT_CONFIGS } from '../../constants';

export class HiveVisualSystem {
    private unitPool: UnitPool;
    private renderer: WorldRenderer;
    private rootContainer: Container | null = null;
    private eggNodes: Record<UnitType, Container> = {} as any;
    private lastStockpileCounts: Record<UnitType, number> = {} as any;

    constructor(unitPool: UnitPool, renderer: WorldRenderer) {
        this.unitPool = unitPool;
        this.renderer = renderer;
    }

    public init() {
        this.rootContainer = new Container();
        this.renderer.hiveLayer.addChild(this.rootContainer);
        
        // Draw Static Central Pillar Once
        const pillar = new Graphics();
        pillar.beginFill(0x1a0505); 
        pillar.lineStyle(4, 0x441111);
        pillar.drawRect(-40, -600, 80, 1200);
        pillar.endFill();
        this.rootContainer.addChild(pillar);

        this.createEggNodes();
    }

    public cleanup() {
        if (this.rootContainer) {
            this.rootContainer.destroy({ children: true });
            this.rootContainer = null;
            this.eggNodes = {} as any;
        }
    }

    public update(dt: number) {
        if (!this.rootContainer) return;

        const time = Date.now() / 1000;
        const unlocked = DataManager.instance.state.hive.unlockedUnits;
        const currentStockpile = DataManager.instance.state.hive.unitStockpile;

        // Update Dynamic Eggs
        for (const type of Object.keys(this.eggNodes) as UnitType[]) {
            const node = this.eggNodes[type];
            const data = unlocked[type];
            if (!data) continue;

            // Pulse Animation
            if (data.isProducing) {
                const scale = 1.0 + Math.sin(time * 10) * 0.05;
                node.scale.set(scale);
                // Update tint or connecting line color if possible (simple scale for now)
            } else {
                node.scale.set(1.0);
            }

            // Spawn Visual Unit on Stockpile Increase
            const newCount = currentStockpile[type] || 0;
            if (newCount > (this.lastStockpileCounts[type] || 0)) {
                this.spawnVisualUnit(type, { x: node.x, y: node.y });
            }
            this.lastStockpileCounts[type] = newCount;
        }

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

    private createEggNodes() {
        const unlocked = DataManager.instance.state.hive.unlockedUnits;
        const types = Object.keys(unlocked) as UnitType[];
        const count = types.length;

        types.forEach((t, i) => {
            const side = i % 2 === 0 ? -1 : 1;
            const row = Math.floor(i / 2);
            const x = side * 150;
            const y = (row - count/4) * 120;
            
            const nodeContainer = new Container();
            nodeContainer.position.set(x, y);

            // Draw Connection Line (Static relative to egg)
            const line = new Graphics();
            line.lineStyle(3, 0x331111);
            // Draw from egg center (0,0 in local space) towards pillar (inverse of egg pos)
            // Pillar is at 0,0 world, so local vector to pillar is (-x, -y)
            // We want a curve.
            line.moveTo(0, 0);
            line.quadraticCurveTo(-x/2, 20, -x, -y + (Math.random()*20-10)); // Curve towards center
            nodeContainer.addChild(line);
            // Move line to back
            nodeContainer.setChildIndex(line, 0);

            // Draw Egg
            const egg = new Graphics();
            const color = UNIT_CONFIGS[t]?.baseStats.color || 0xffffff;
            
            // Outer Shell
            egg.lineStyle(2, 0x555555);
            egg.beginFill(0x111111); 
            egg.drawCircle(0, 0, 30); 
            egg.endFill();
            
            // Inner Mass
            egg.beginFill(color, 0.5); 
            egg.drawCircle(0, 0, 20); 
            egg.endFill();
            
            nodeContainer.addChild(egg);
            this.rootContainer!.addChild(nodeContainer);
            this.eggNodes[t] = nodeContainer;
            
            this.lastStockpileCounts[t] = DataManager.instance.state.hive.unitStockpile[t] || 0;
        });
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
        // Simple logic for visual movement
        if (u.context.isHiveVisual) {
             const dx = 0 - u.x;
             // Very simple linear move
             if (Math.abs(dx) > 5) u.x += (dx > 0 ? 1 : -1) * u.stats.speed * dt;
        }
    }
}
