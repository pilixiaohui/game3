
import { Application, Container, Graphics, TilingSprite, Text, TextStyle } from 'pixi.js';
import { IUnit, ObstacleDef, UnitType, Faction, IFxEvent, HarvestNodeDef } from '../../types';
import { LANE_Y, UNIT_CONFIGS, ELEMENT_COLORS } from '../../constants';
import { SimpleEventEmitter } from '../DataManager';

export class WorldRenderer {
    public app: Application;
    public world: Container;
    
    private bgLayer: TilingSprite;
    private groundLayer: TilingSprite;
    public unitLayer: Container;
    public terrainLayer: Container;
    public particleLayer: Container;
    public hiveLayer: Container;
    
    private obstacleGraphics: Graphics[] = [];
    private harvestNodeGraphics: Graphics[] = [];

    constructor(element: HTMLElement, events: SimpleEventEmitter) {
        this.app = new Application({ 
            resizeTo: element, 
            backgroundColor: 0x0a0a0a, 
            antialias: true, 
            resolution: window.devicePixelRatio || 1, 
            autoDensity: true 
        });
        // @ts-ignore
        element.appendChild(this.app.view);

        // Layers
        const bgGfx = new Graphics();
        bgGfx.beginFill(0x111111);
        bgGfx.drawRect(0, 0, 512, 512);
        bgGfx.endFill();
        const bgTex = this.app.renderer.generateTexture(bgGfx);
        this.bgLayer = new TilingSprite(bgTex, this.app.screen.width, this.app.screen.height);
        this.app.stage.addChild(this.bgLayer);

        const floorGfx = new Graphics();
        floorGfx.beginFill(0x181818);
        floorGfx.drawRect(0, 0, 256, 256);
        floorGfx.lineStyle(2, 0x2a2a2a, 0.5);
        floorGfx.moveTo(0, 0); floorGfx.lineTo(0, 256);
        floorGfx.moveTo(0, 0); floorGfx.lineTo(256, 0);
        floorGfx.endFill();
        const floorTex = this.app.renderer.generateTexture(floorGfx);
        this.groundLayer = new TilingSprite(floorTex, this.app.screen.width, this.app.screen.height / 2 + 200);
        this.groundLayer.anchor.set(0, 0);
        this.app.stage.addChild(this.groundLayer);

        this.world = new Container();
        this.world.sortableChildren = true;
        this.app.stage.addChild(this.world);

        this.terrainLayer = new Container(); this.terrainLayer.zIndex = 5;
        this.hiveLayer = new Container(); this.hiveLayer.zIndex = 6;
        this.unitLayer = new Container(); this.unitLayer.zIndex = 10; this.unitLayer.sortableChildren = true;
        this.particleLayer = new Container(); this.particleLayer.zIndex = 20;

        this.world.addChild(this.terrainLayer);
        this.world.addChild(this.hiveLayer);
        this.world.addChild(this.unitLayer);
        this.world.addChild(this.particleLayer);

        // Listen for FX Events
        events.on('FX', this.handleFxEvent.bind(this));
        // Renamed event listener to match LevelManager
        events.on('TERRAIN_UPDATED', (obstacles: ObstacleDef[]) => this.drawTerrain(obstacles));
        events.on('HARVEST_NODES_UPDATED', (nodes: HarvestNodeDef[]) => this.drawHarvestNodes(nodes));
    }

    private handleFxEvent(e: IFxEvent) {
        if (e.type === 'EXPLOSION') {
            this.createParticles(e.x, e.y, e.color, 10);
            this.createShockwave(e.x, e.y, e.radius, e.color);
        } else if (e.type === 'FLASH') {
            const g = new Graphics(); g.beginFill(e.color); g.drawCircle(0, 0, 20); g.endFill(); g.position.set(e.x, e.y);
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'PROJECTILE') {
            const g = new Graphics(); g.lineStyle(2, e.color); g.moveTo(0,0); g.lineTo(e.x2-e.x, e.y2-e.y); g.position.set(e.x, e.y);
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'TEXT') {
            const t = new Text(e.text, new TextStyle({ fontSize: e.fontSize || 12, fill: e.color, fontWeight: 'bold' })); t.anchor.set(0.5); t.position.set(e.x, e.y);
            this.addParticle({ view: t, type: 'TEXT', life: 0.8, maxLife: 0.8, update: (p:any, dt:number) => { p.life -= dt; p.view.y -= 20 * dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'SLASH') {
            const g = new Graphics(); g.lineStyle(2, e.color); g.moveTo(e.x - 10, e.y - 10); g.lineTo(e.targetX + 10, e.targetY + 10); g.moveTo(e.x + 10, e.y - 10); g.lineTo(e.targetX - 10, e.targetY + 10);
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life; return p.life > 0; } });
        } else if (e.type === 'SHOCKWAVE') {
             this.createShockwave(e.x, e.y, e.radius, e.color);
        } else if (e.type === 'PARTICLES') {
            this.createParticles(e.x, e.y, e.color, e.count);
        } else if (e.type === 'HEAL') {
             this.handleFxEvent({ type: 'TEXT', x: e.x, y: e.y - 10, text: '+', color: 0x00ff00, fontSize: 14 });
        } else if (e.type === 'DAMAGE_POP') {
             this.handleFxEvent({ type: 'TEXT', x: e.x, y: e.y - 10, text: e.text, color: e.color, fontSize: e.fontSize });
        }
    }

    private createShockwave(x: number, y: number, radius: number, color: number) {
        const g = new Graphics(); g.lineStyle(2, color); g.drawCircle(0, 0, radius); g.position.set(x, y);
        this.addParticle({ view: g, type: 'GRAPHICS', life: 0.3, maxLife: 0.3, update: (p:any, dt:number) => { p.life -= dt; p.view.scale.set(1 + (1 - p.life/p.maxLife)); p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
    }

    private createParticles(x: number, y: number, color: number, count: number) {
        for(let i=0; i<count; i++) {
            const g = new Graphics(); g.beginFill(color); g.drawRect(0,0,3,3); g.endFill(); g.position.set(x, y);
            const vx = (Math.random() - 0.5) * 100; const vy = (Math.random() - 0.5) * 100;
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.5, maxLife: 0.5, update: (p:any, dt:number) => { p.life -= dt; p.view.x += vx * dt; p.view.y += vy * dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        }
    }

    public resize(scaleFactor: number, cameraX: number, mode: string) {
        const w = this.app.screen.width;
        const h = this.app.screen.height;

        this.world.scale.set(scaleFactor);

        if (mode === 'HIVE') {
            this.world.position.set(w / 2, h / 2);
            this.world.pivot.set(0, 0);
        } else {
            this.world.position.set(w / 2, h * 0.6);
            this.world.pivot.set(0, 0);
        }

        this.bgLayer.width = w; this.bgLayer.height = h;
        this.groundLayer.width = w; this.groundLayer.height = h;
        this.groundLayer.y = this.world.y;

        // Camera Update
        this.world.pivot.x = mode === 'COMBAT_VIEW' ? cameraX : 0;
        this.groundLayer.tilePosition.x = -this.world.pivot.x * 0.5;
        this.bgLayer.tilePosition.x = -this.world.pivot.x * 0.1;
    }

    public drawUnit(unit: IUnit) {
        // @ts-ignore
        if (!unit.view) return;
        // @ts-ignore
        const view = unit.view as Graphics;
        
        view.clear();
        const width = unit.stats.width;
        const height = unit.stats.height;
        const color = unit.stats.color;

        const config = UNIT_CONFIGS[unit.type];
        const visual = config.visual;

        // Shadow
        view.beginFill(0x000000, 0.4);
        const sScale = visual?.shadowScale || 1.0;
        view.drawEllipse(0, 0, (width / 1.8) * sScale, (width / 4) * sScale);
        view.endFill();
        
        // Shapes
        if (visual && visual.shapes) {
            for (const shape of visual.shapes) {
                const shapeColor = shape.color !== undefined ? shape.color : color;
                view.beginFill(shapeColor);
                const w = width * (shape.widthPct ?? 1.0);
                const h = height * (shape.heightPct ?? 1.0);
                const cx = width * (shape.xOffPct ?? 0);
                const cy = -height + (height * (shape.yOffPct ?? 0));

                if (shape.type === 'ROUNDED_RECT') {
                    view.drawRoundedRect(cx - w/2, cy, w, h, shape.cornerRadius || 4);
                } else if (shape.type === 'RECT') {
                    view.drawRect(cx - w/2, cy, w, h);
                } else if (shape.type === 'CIRCLE') {
                    const r = shape.radiusPct ? width * shape.radiusPct : w/2;
                    view.drawCircle(cx, cy, r);
                }
                view.endFill();
            }
        } else {
            view.beginFill(color);
            view.drawRect(-width/2, -height, width, height);
            view.endFill();
        }
        
        // Eye
        view.beginFill(0xff00ff, 0.9);
        view.drawCircle(width * 0.2, -height + 8, 2);
        view.endFill();

        // Carry Bag (for Harvesters)
        // @ts-ignore
        if (unit.context.carryAmount > 0) {
             view.beginFill(0x00ff00);
             view.drawCircle(0, -height/2, 5);
             view.endFill();
        }
    }

    public updateUnitVisuals(unit: IUnit, mode: string) {
        // @ts-ignore
        if (!unit.view) return;
        // @ts-ignore
        const view = unit.view as Graphics;
        // @ts-ignore
        const hpBar = unit.hpBar as Graphics;

        view.position.set(unit.x, unit.y);
        view.zIndex = unit.y;
        
        // HP Bar
        hpBar.clear();
        if (unit.stats.hp < unit.stats.maxHp && !unit.isDead) {
            const pct = Math.max(0, unit.stats.hp / unit.stats.maxHp);
            hpBar.beginFill(0x550000);
            hpBar.drawRect(-10, -unit.stats.height - 8, 20, 3);
            hpBar.beginFill(unit.faction === Faction.HUMAN ? 0xff0000 : 0x00ff00);
            hpBar.drawRect(-10, -unit.stats.height - 8, 20 * pct, 3);
            hpBar.endFill();
        }

        // --- Visual Context Handling (Replaced Direct Gene Logic) ---
        
        // 1. Burrowing (Alpha)
        if (unit.context.isBurrowed) {
             view.alpha = 0.5;
        } else if (!unit.isDead) {
             view.alpha = 1.0;
        }
        
        // 2. Ghosting (Bobbing)
        if (unit.context.isGhosting && !unit.isDead) {
             view.y += Math.sin(Date.now() / 200) * 0.5;
        }
        
        // 3. Detonating (Pulsing)
        if (unit.context.detonating && !unit.isDead) {
             const t = Math.sin(Date.now() / 50); 
             view.tint = t > 0 ? 0xff0000 : 0xffffff;
             view.scale.set(1.0 + (unit.context.detonateTimer || 0));
        } else {
             view.tint = 0xffffff;
        }

        // Draw Carry Bag dynamic update
        // @ts-ignore
        if (unit.context.carryAmount > 0 && !unit.context.visualHasBag) {
            // @ts-ignore
             unit.context.visualHasBag = true;
             this.drawUnit(unit);
        } else if (!unit.context.carryAmount && unit.context.visualHasBag) {
             // @ts-ignore
             unit.context.visualHasBag = false;
             this.drawUnit(unit);
        }
        
        if (unit.isDead) {
            // @ts-ignore
            view.alpha = 1.0 - (unit.decayTimer / 2.0); 
            view.rotation = Math.PI / 2;
        } else if (!unit.context.detonating) {
            // Default breathing animation if not special
            view.y += Math.sin(Date.now() / 200 + unit.id) * 2;
            if (mode === 'COMBAT_VIEW') {
               view.scale.x = (unit.faction === Faction.ZERG) ? 1 : -1;
            } else if (mode === 'HARVEST_VIEW') {
                // @ts-ignore
                 if (unit.steeringForce && unit.steeringForce.x !== 0) {
                     // @ts-ignore
                     view.scale.x = unit.steeringForce.x > 0 ? 1 : -1;
                 }
            }
        }
    }

    public drawTerrain(obstacles: ObstacleDef[]) {
        this.obstacleGraphics.forEach(g => { g.clear(); g.destroy(); });
        this.obstacleGraphics = [];
        obstacles.forEach(obs => {
            const g = new Graphics();
            g.beginFill(0x222222);
            g.lineStyle(2, 0x555555);
            if (obs.type === 'WALL') {
                g.drawRect(obs.x - obs.width/2, LANE_Y + obs.y - obs.height, obs.width, obs.height);
                if (obs.health && obs.maxHealth) {
                    const pct = obs.health / obs.maxHealth;
                    g.beginFill(0x550000); g.drawRect(obs.x - obs.width/2, LANE_Y + obs.y - obs.height - 10, obs.width, 5);
                    g.beginFill(0xff0000); g.drawRect(obs.x - obs.width/2, LANE_Y + obs.y - obs.height - 10, obs.width * pct, 5);
                }
            } else if (obs.type === 'ROCK') {
                g.drawCircle(obs.x, LANE_Y + obs.y, obs.width/2);
            }
            g.endFill();
            this.obstacleGraphics.push(g);
            this.terrainLayer.addChild(g);
        });
    }

    public drawHarvestNodes(nodes: HarvestNodeDef[]) {
        this.harvestNodeGraphics.forEach(g => { g.clear(); g.destroy(); });
        this.harvestNodeGraphics = [];
        
        if (nodes.length > 0) {
            const hive = new Graphics();
            hive.beginFill(0x550055);
            hive.drawCircle(0, 0, 40);
            hive.lineStyle(2, 0xaa00aa);
            hive.drawCircle(0, 0, 45 + Math.sin(Date.now()/500)*5);
            hive.endFill();
            this.terrainLayer.addChild(hive);
            this.harvestNodeGraphics.push(hive);
        }

        nodes.forEach(node => {
            const multiplier = node.richness;
            const g = new Graphics(); 
            const alpha = Math.min(1.0, 0.4 * multiplier);
            g.beginFill(0x00ff00, alpha); 
            g.drawCircle(0, 0, 15 + (multiplier * 2)); 
            g.beginFill(0x004400, 0.8);
            g.drawCircle(0, 0, 5);
            g.endFill(); 
            g.position.set(node.x, node.y);
            
            this.terrainLayer.addChild(g);
            this.harvestNodeGraphics.push(g);
        });
    }
    
    public clear() {
        this.obstacleGraphics.forEach(g => { g.clear(); g.destroy(); });
        this.obstacleGraphics = [];
        this.harvestNodeGraphics.forEach(g => { g.clear(); g.destroy(); });
        this.harvestNodeGraphics = [];
        this.activeParticles.forEach(p => p.view.destroy());
        this.activeParticles = [];
    }

    public destroy() {
        this.app.destroy(true, { children: true });
    }

    public activeParticles: any[] = [];
    
    public addParticle(p: any) {
        this.particleLayer.addChild(p.view);
        this.activeParticles.push(p);
    }

    public updateParticles(dt: number) {
        let i = this.activeParticles.length;
        while (i--) {
            const p = this.activeParticles[i];
            if (!p.update(p, dt)) {
                p.view.destroy();
                this.activeParticles.splice(i, 1);
            }
        }
    }
}
