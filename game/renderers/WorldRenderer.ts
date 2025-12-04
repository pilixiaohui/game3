import { Application, Container, Graphics, TilingSprite, Text, TextStyle, Texture, Sprite, RenderTexture, Assets } from 'pixi.js';
import { IUnit, ObstacleDef, UnitType, Faction, IFxEvent, HarvestNodeDef } from '../../types';
import { LANE_Y, UNIT_CONFIGS, ELEMENT_COLORS } from '../../constants';
import { SimpleEventEmitter } from '../DataManager';
import { AssetManager } from '../AssetManager';

export class WorldRenderer {
    public app: Application | null = null;
    public world!: Container;
    
    private bgLayer!: TilingSprite;
    private groundLayer!: TilingSprite;
    public unitLayer!: Container; 
    private unitLayerBack!: Container;
    private unitLayerMid!: Container;
    private unitLayerFront!: Container;
    public terrainLayer!: Container;
    public particleLayer!: Container;
    public hiveLayer!: Container;
    public uiLayer!: Container;
    
    private obstacleGraphics: Graphics[] = [];
    private harvestNodeGraphics: Graphics[] = [];
    private unitTextures: Map<UnitType, Texture> = new Map();
    private decalContainer!: Container;
    private decalRenderTexture!: RenderTexture;
    private decalSprite!: Sprite;
    private sharedStampSprite!: Sprite; 
    private hpBarGraphics!: Graphics;
    
    private element: HTMLElement;
    private events: SimpleEventEmitter;
    public activeParticles: any[] = [];
    private isDestroyed: boolean = false;

    constructor(element: HTMLElement, events: SimpleEventEmitter) {
        this.element = element;
        this.events = events;
    }

    public async init() {
        if (this.isDestroyed) return;

        // 0. Preload
        await AssetManager.instance.loadResources();
        if (this.isDestroyed) return;

        // 1. Create App
        this.app = new Application();

        // 2. Init Pixi
        try {
            await this.app.init({ 
                resizeTo: this.element, 
                backgroundColor: 0x0a0a0a, 
                antialias: false, 
                resolution: window.devicePixelRatio || 1, 
                autoDensity: true,
                preference: 'webgl', // Force WebGL to avoid WebGPU compatibility issues
                hello: true 
            });
        } catch (e) {
            console.error("Pixi init failed", e);
            this.destroy(); // Clean up any partial state
            throw e; // CRITICAL: Re-throw so GameEngine knows init failed and doesn't try to use null app
        }
        
        if (this.isDestroyed) {
            this.destroy(); 
            return;
        }

        // 3. Append Canvas
        // @ts-ignore
        if (this.app.canvas) {
             // @ts-ignore
            this.element.appendChild(this.app.canvas);
        }

        this.loadUnitTextures();
        this.sharedStampSprite = new Sprite(Texture.EMPTY);

        // --- Setup Layers ---
        const bgGfx = new Graphics().rect(0, 0, 512, 512).fill(0x111111);
        const bgTex = this.app.renderer.generateTexture(bgGfx);
        this.bgLayer = new TilingSprite({ texture: bgTex, width: this.app.screen.width, height: this.app.screen.height });
        this.app.stage.addChild(this.bgLayer);

        const floorGfx = new Graphics().rect(0, 0, 256, 256).fill(0x181818).stroke({ width: 2, color: 0x2a2a2a, alpha: 0.5 });
        // Draw lines manually if needed, but simple rect is fine for floor tile
        const floorTex = this.app.renderer.generateTexture(floorGfx);
        this.groundLayer = new TilingSprite({ texture: floorTex, width: this.app.screen.width, height: this.app.screen.height / 2 + 200 });
        this.groundLayer.anchor.set(0, 0);
        this.app.stage.addChild(this.groundLayer);

        this.world = new Container();
        this.world.sortableChildren = true;
        this.app.stage.addChild(this.world);

        this.terrainLayer = new Container(); this.terrainLayer.zIndex = 5;
        this.world.addChild(this.terrainLayer);

        this.decalContainer = new Container(); 
        this.terrainLayer.addChild(this.decalContainer); 
        
        this.decalRenderTexture = RenderTexture.create({ width: 4096, height: 1024 }); 
        this.decalSprite = new Sprite(this.decalRenderTexture);
        this.decalSprite.anchor.set(0, 0.5); 
        this.decalSprite.y = LANE_Y;
        this.decalContainer.addChild(this.decalSprite);

        this.hiveLayer = new Container(); this.hiveLayer.zIndex = 6;
        this.world.addChild(this.hiveLayer);
        
        this.unitLayer = new Container(); this.unitLayer.zIndex = 10;
        this.world.addChild(this.unitLayer);
        this.unitLayerBack = new Container();
        this.unitLayerMid = new Container();
        this.unitLayerFront = new Container();
        this.unitLayer.addChild(this.unitLayerBack, this.unitLayerMid, this.unitLayerFront);
        
        this.particleLayer = new Container(); this.particleLayer.zIndex = 20;
        this.world.addChild(this.particleLayer);

        this.uiLayer = new Container(); this.uiLayer.zIndex = 30;
        this.world.addChild(this.uiLayer);
        this.hpBarGraphics = new Graphics();
        this.uiLayer.addChild(this.hpBarGraphics);

        // Bind Events
        this.events.on('FX', this.handleFxEvent.bind(this));
        this.events.on('STAMP_DECAL', this.stampDecal.bind(this));
        this.events.on('TERRAIN_UPDATE', (obstacles: ObstacleDef[]) => this.drawTerrain(obstacles));
        this.events.on('HARVEST_NODES_UPDATED', (nodes: HarvestNodeDef[]) => this.drawHarvestNodes(nodes));
    }

    private loadUnitTextures() {
        if (!this.app) return;
        Object.values(UnitType).forEach(type => {
            const unitType = type as UnitType;
            const assetTex = AssetManager.instance.getTexture(unitType);
            if (assetTex) { this.unitTextures.set(unitType, assetTex); return; }
            const config = UNIT_CONFIGS[unitType];
            if (!config) return;
            const g = new Graphics();
            const width = config.baseStats.width;
            const height = config.baseStats.height;
            const color = config.baseStats.color;
            
            // Generate Texture using Graphics
            const visual = config.visual;
            const sScale = visual?.shadowScale || 1.0;
            g.ellipse(0, 0, (width / 1.8) * sScale, (width / 4) * sScale).fill({ color: 0x000000, alpha: 0.4 }); // Shadow

            if (visual && visual.shapes) {
                for (const shape of visual.shapes) {
                    const shapeColor = shape.color !== undefined ? shape.color : color;
                    const w = width * (shape.widthPct ?? 1.0);
                    const h = height * (shape.heightPct ?? 1.0);
                    const cx = width * (shape.xOffPct ?? 0);
                    const cy = -height/2 + (height * (shape.yOffPct ?? 0)); 

                    if (shape.type === 'ROUNDED_RECT') {
                        g.roundRect(cx - w/2, cy - h/2, w, h, shape.cornerRadius || 4).fill(shapeColor);
                    } else if (shape.type === 'RECT') {
                        g.rect(cx - w/2, cy - h/2, w, h).fill(shapeColor);
                    } else if (shape.type === 'CIRCLE') {
                        const r = shape.radiusPct ? width * shape.radiusPct : w/2;
                        g.circle(cx, cy, r).fill(shapeColor);
                    }
                }
            } else {
                g.rect(-width/2, -height, width, height).fill(color); // Body
            }
            g.circle(width * 0.2, -height + (height * 0.2), 2).fill({ color: 0xff00ff, alpha: 0.9 }); // Eye
            const texture = this.app!.renderer.generateTexture(g);
            this.unitTextures.set(unitType, texture);
            g.destroy();
        });
    }
    
    public initUnitView(unit: IUnit) {
        const sprite = new Sprite(Texture.EMPTY);
        sprite.anchor.set(0.5, 1.0);
        unit.view = sprite;
        this.unitLayerMid.addChild(sprite);
    }
    public assignTexture(unit: IUnit) {
        if (!unit.view) return;
        const texture = this.unitTextures.get(unit.type);
        if (texture) (unit.view as Sprite).texture = texture;
    }
    private stampDecal(data: any) {
        if (!this.app) return;
        const tex = this.unitTextures.get(data.type);
        if (!tex) return;
        const s = this.sharedStampSprite;
        s.texture = tex;
        s.anchor.set(0.5, 1.0);
        s.position.set(data.x, data.y - LANE_Y);
        s.rotation = data.rotation;
        s.scale.set(data.scaleX, 1.0);
        s.tint = 0x333333; s.alpha = 0.7;
        this.app.renderer.render({ container: s, target: this.decalRenderTexture, clear: false });
    }
    private handleFxEvent(e: IFxEvent) {
        if (e.type === 'EXPLOSION') {
            this.createParticles(e.x, e.y, e.color, 10);
            this.createShockwave(e.x, e.y, e.radius, e.color);
        } else if (e.type === 'FLASH') {
            const g = new Graphics().circle(0, 0, 20).fill(e.color); 
            g.position.set(e.x, e.y);
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'PROJECTILE') {
            const g = new Graphics().moveTo(0,0).lineTo(e.x2-e.x, e.y2-e.y).stroke({ width: 2, color: e.color }); 
            g.position.set(e.x, e.y);
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'TEXT') {
            const t = new Text({ text: e.text, style: new TextStyle({ fontSize: e.fontSize || 12, fill: e.color, fontWeight: 'bold' }) }); t.anchor.set(0.5); t.position.set(e.x, e.y);
            this.addParticle({ view: t, type: 'TEXT', life: 0.8, maxLife: 0.8, update: (p:any, dt:number) => { p.life -= dt; p.view.y -= 20 * dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'SLASH') {
            const g = new Graphics()
                .moveTo(e.x - 10, e.y - 10).lineTo(e.targetX + 10, e.targetY + 10)
                .moveTo(e.x + 10, e.y - 10).lineTo(e.targetX - 10, e.targetY + 10)
                .stroke({ width: 2, color: e.color });
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life; return p.life > 0; } });
        } else if (e.type === 'SHOCKWAVE') {
             this.createShockwave(e.x, e.y, e.radius, e.color);
        } else if (e.type === 'PARTICLES') {
            this.createParticles(e.x, e.y, e.color, e.count);
        } else if (e.type === 'HEAL') {
             this.handleFxEvent({ type: 'TEXT', x: e.x, y: e.y - 10, text: '+', color: 0x00ff00, fontSize: 14 } as any);
        } else if (e.type === 'DAMAGE_POP') {
             this.handleFxEvent({ type: 'TEXT', x: e.x, y: e.y - 10, text: e.text, color: e.color, fontSize: e.fontSize } as any);
        }
    }
    private createShockwave(x: number, y: number, radius: number, color: number) {
        const g = new Graphics().circle(0, 0, radius).stroke({ width: 2, color }); 
        g.position.set(x, y);
        this.addParticle({ view: g, type: 'GRAPHICS', life: 0.3, maxLife: 0.3, update: (p:any, dt:number) => { p.life -= dt; p.view.scale.set(1 + (1 - p.life/p.maxLife)); p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
    }
    private createParticles(x: number, y: number, color: number, count: number) {
        for(let i=0; i<count; i++) {
            const g = new Graphics().rect(0,0,3,3).fill(color); 
            g.position.set(x, y);
            const vx = (Math.random() - 0.5) * 100; const vy = (Math.random() - 0.5) * 100;
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.5, maxLife: 0.5, update: (p:any, dt:number) => { p.life -= dt; p.view.x += vx * dt; p.view.y += vy * dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        }
    }
    public resize(scaleFactor: number, cameraX: number, mode: string) {
        if (!this.app) return;
        this.world.scale.set(scaleFactor);
        if (mode === 'HIVE') { this.world.position.set(this.app.screen.width / 2, this.app.screen.height / 2); this.world.pivot.set(0, 0); }
        else { this.world.position.set(this.app.screen.width / 2, this.app.screen.height * 0.6); this.world.pivot.set(0, 0); }
        this.bgLayer.width = this.app.screen.width; this.bgLayer.height = this.app.screen.height;
        this.groundLayer.width = this.app.screen.width; this.groundLayer.height = this.app.screen.height; this.groundLayer.y = this.world.y;
        this.world.pivot.x = mode === 'COMBAT_VIEW' ? cameraX : 0;
        this.groundLayer.tilePosition.x = -this.world.pivot.x * 0.5;
        this.bgLayer.tilePosition.x = -this.world.pivot.x * 0.1;
    }
    public updateUnitVisuals(unit: IUnit, mode: string) {
        if (!this.app) return;
        // @ts-ignore
        if (!unit.view) return;
        const view = unit.view as Sprite;
        if (unit.isDead || !unit.active) { view.visible = false; return; }
        view.visible = true;
        let target = this.unitLayerMid;
        if (unit.y < -30) target = this.unitLayerBack; else if (unit.y > 30) target = this.unitLayerFront;
        if (view.parent !== target) target.addChild(view);
        view.alpha = unit.context.isBurrowed ? 0.5 : 1.0;
        view.position.set(unit.x, unit.y);
        let scaleX = 1.0;
        let scaleY = 1.0;
        if (mode === 'COMBAT_VIEW') {
            const dir = (unit.faction === Faction.ZERG) ? 1 : -1;
            if (unit.velocity) {
                const speedSq = unit.velocity.x * unit.velocity.x + unit.velocity.y * unit.velocity.y;
                if (speedSq > 200) { 
                     const speed = Math.sqrt(speedSq);
                     const maxSpeed = unit.stats.speed || 1;
                     const stretch = Math.min(0.3, (speed / maxSpeed) * 0.2);
                     scaleX = dir * (1 + stretch); 
                     scaleY = 1 - stretch;         
                } else {
                     scaleX = dir;
                }
            } else {
                scaleX = dir;
            }
        } else if (mode === 'HARVEST_VIEW') {
             if (unit.steeringForce && unit.steeringForce.x !== 0) {
                 scaleX = unit.steeringForce.x > 0 ? 1 : -1;
             }
        }
        if (unit.context.detonating) {
             const t = Math.sin(Date.now() / 50); 
             view.tint = t > 0 ? 0xff0000 : 0xffffff;
        } else {
             view.tint = 0xffffff;
        }
        view.scale.set(scaleX, scaleY);
        view.rotation = 0;
    }
    public renderHpBars(activeUnits: IUnit[]) {
        if (!this.hpBarGraphics) return;
        this.hpBarGraphics.clear();
        for (const unit of activeUnits) {
            if (!unit.active || unit.isDead || unit.stats.hp >= unit.stats.maxHp) continue;
            const pct = Math.max(0, unit.stats.hp / unit.stats.maxHp);
            const barW = 20;
            const barH = 3;
            const yOff = -unit.stats.height - 8;
            this.hpBarGraphics.rect(unit.x - barW/2, unit.y + yOff, barW, barH).fill(0x550000);
            this.hpBarGraphics.rect(unit.x - barW/2, unit.y + yOff, barW * pct, barH).fill(unit.faction === Faction.HUMAN ? 0xff0000 : 0x00ff00);
        }
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
    public drawTerrain(obs: ObstacleDef[]) { 
        this.obstacleGraphics.forEach(g => { g.clear(); g.destroy(); });
        this.obstacleGraphics = [];
        obs.forEach(o => {
            const g = new Graphics();
            if (o.type === 'WALL') {
                g.rect(o.x - o.width/2, LANE_Y + o.y - o.height, o.width, o.height)
                 .fill(0x222222).stroke({ width: 2, color: 0x555555 });
                if (o.health && o.maxHealth) {
                    const pct = o.health / o.maxHealth;
                    g.rect(o.x - o.width/2, LANE_Y + o.y - o.height - 10, o.width, 5).fill(0x550000);
                    g.rect(o.x - o.width/2, LANE_Y + o.y - o.height - 10, o.width * pct, 5).fill(0xff0000);
                }
            } else if (o.type === 'ROCK') {
                g.circle(o.x, LANE_Y + o.y, o.width/2).fill(0x222222).stroke({ width: 2, color: 0x555555 });
            }
            this.obstacleGraphics.push(g);
            this.terrainLayer.addChild(g);
        });
    }
    public drawHarvestNodes(nodes: HarvestNodeDef[]) { 
        this.harvestNodeGraphics.forEach(g => { g.clear(); g.destroy(); });
        this.harvestNodeGraphics = [];
        if (nodes.length > 0) {
            const hive = new Graphics();
            hive.poly([-30, 0, -20, -40, 0, -20, 20, -40, 30, 0, 0, 10]).fill(0x550055).stroke({ width: 2, color: 0xaa00aa });
            hive.circle(0, 0, 45 + Math.sin(Date.now()/500)*5).stroke({ width: 2, color: 0xaa00aa });
            this.terrainLayer.addChild(hive);
            this.harvestNodeGraphics.push(hive);
        }
        nodes.forEach((node, idx) => {
            const multiplier = node.richness;
            const g = new Graphics(); 
            const color = 0x00ff00;
            const alpha = 0.6;
            const shards = 3 + Math.floor(Math.random() * 3);
            for(let i=0; i<shards; i++) {
                const h = 20 + Math.random() * 20 * multiplier;
                const w = 10 + Math.random() * 10;
                const angle = (Math.PI * 2 * i) / shards;
                const cx = Math.cos(angle) * 5;
                const cy = Math.sin(angle) * 5;
                g.poly([cx - w/2, cy, cx, cy - h, cx + w/2, cy]).fill({ color, alpha }).stroke({ width: 1, color: 0xccffcc, alpha: 0.8 });
            }
            g.circle(0, -10, 30 * multiplier).fill({ color, alpha: 0.2 });
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
        this.hpBarGraphics.clear();
        this.decalContainer.removeChildren();
    }
    public addParticle(p: any) { 
        this.particleLayer.addChild(p.view);
        this.activeParticles.push(p);
    }

    public destroy() {
        this.isDestroyed = true;

        // 1. Stop Ticker
        if (this.app?.ticker) {
            this.app.ticker.stop();
        }

        // 2. Destroy RenderTextures
        if (this.decalRenderTexture) {
            try { this.decalRenderTexture.destroy(true); } catch(e) {}
        }

        // 3. Destroy App
        if (this.app) {
            try {
                // Attempt to destroy regardless of renderer state to ensure global extensions (Batcher) are cleaned up.
                // This is critical for PixiJS v8 to prevent "Extension type batcher already has a handler" errors on reload.
                this.app.destroy({ removeView: true }, { 
                    children: true, 
                    texture: true,
                    textureSource: true,
                    context: true
                });
            } catch (e) {
                // It is expected that destroy might throw if init failed halfway (e.g. renderer is undefined).
                // We suppress this because the goal is just to trigger whatever cleanup IS possible.
                // console.warn("WorldRenderer: Destroy error suppressed", e);
            }
            this.app = null;
        }

        // 4. Unload Bundle
        Assets.unloadBundle('units').catch(() => {});

        this.obstacleGraphics = [];
        this.harvestNodeGraphics = [];
        this.unitTextures.clear();
        this.activeParticles = [];
    }
}