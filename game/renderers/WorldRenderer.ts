import { Application, Container, Graphics, TilingSprite, Text, TextStyle, Texture, Sprite, RenderTexture, Rectangle } from 'pixi.js';
import { IUnit, ObstacleDef, UnitType, Faction, IFxEvent, HarvestNodeDef } from '../../types';
import { LANE_Y, UNIT_CONFIGS, ELEMENT_COLORS } from '../../constants';
import { SimpleEventEmitter } from '../DataManager';

export class WorldRenderer {
    public app: Application;
    public world: Container;
    
    private bgLayer!: TilingSprite;
    private groundLayer!: TilingSprite;
    public unitLayer!: Container; 
    public terrainLayer!: Container;
    public particleLayer!: Container;
    public hiveLayer!: Container;
    public uiLayer!: Container;
    
    private obstacleGraphics: Graphics[] = [];
    private harvestNodeGraphics: Graphics[] = [];
    private unitTextures: Map<UnitType, Texture> = new Map();
    
    // Decal System
    private decalContainer!: Container;
    private decalRenderTexture!: RenderTexture;
    private decalSprite!: Sprite;
    private sharedStampSprite!: Sprite; // Shared sprite for stamping
    
    // HP Bar Batching
    private hpBarGraphics!: Graphics;
    
    private element: HTMLElement;
    private events: SimpleEventEmitter;

    public activeParticles: any[] = [];

    constructor(element: HTMLElement, events: SimpleEventEmitter) {
        this.element = element;
        this.events = events;
        
        // Initialize lightweight containers
        // Note: Application is created in init() for v8 async support
        this.obstacleGraphics = [];
        this.harvestNodeGraphics = [];
        this.unitTextures = new Map();
        this.activeParticles = [];
    }

    public async init() {
        // 1. Create Application Instance
        this.app = new Application();

        // 2. Asynchronous PixiJS v8 Initialization
        await this.app.init({ 
            resizeTo: this.element, 
            backgroundColor: 0x0a0a0a, 
            antialias: false, 
            resolution: window.devicePixelRatio || 1, 
            autoDensity: true 
        });
        
        // 3. Append Canvas (v8 uses app.canvas)
        // @ts-ignore
        this.element.appendChild(this.app.canvas);

        this.bakeUnitTextures();
        this.sharedStampSprite = new Sprite(Texture.EMPTY);

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
        this.decalContainer = new Container(); this.terrainLayer.addChild(this.decalContainer); 
        
        // Decal System Init
        // Use a large render texture to stamp dead units
        this.decalRenderTexture = RenderTexture.create({ width: 4096, height: 1024 }); // Wide enough for a few stages
        this.decalSprite = new Sprite(this.decalRenderTexture);
        this.decalSprite.anchor.set(0, 0.5); // Center vertically on lane
        this.decalSprite.y = LANE_Y;
        this.decalContainer.addChild(this.decalSprite);

        this.hiveLayer = new Container(); this.hiveLayer.zIndex = 6;
        
        // High Performance Unit Layer
        // PixiJS v8 Container is optimized for batching. ParticleContainer is removed/separate.
        this.unitLayer = new Container();
        // Mimic sorting behavior if needed, but for performance avoid sortableChildren if possible.
        // For now, enabling it as units need Y-sorting.
        this.unitLayer.sortableChildren = true;
        this.unitLayer.zIndex = 10;
        
        this.particleLayer = new Container(); this.particleLayer.zIndex = 20;
        this.uiLayer = new Container(); this.uiLayer.zIndex = 30;

        this.world.addChild(this.terrainLayer);
        this.world.addChild(this.hiveLayer);
        this.world.addChild(this.unitLayer);
        this.world.addChild(this.particleLayer);
        this.world.addChild(this.uiLayer);
        
        this.hpBarGraphics = new Graphics();
        this.uiLayer.addChild(this.hpBarGraphics);

        // Listen for FX Events
        this.events.on('FX', this.handleFxEvent.bind(this));
        this.events.on('STAMP_DECAL', this.stampDecal.bind(this));
        
        this.events.on('TERRAIN_UPDATE', (obstacles: ObstacleDef[]) => this.drawTerrain(obstacles));
        this.events.on('HARVEST_NODES_UPDATED', (nodes: HarvestNodeDef[]) => this.drawHarvestNodes(nodes));
    }

    private bakeUnitTextures() {
        Object.values(UnitType).forEach(type => {
            const unitType = type as UnitType;
            const config = UNIT_CONFIGS[unitType];
            if (!config) return;

            const g = new Graphics();
            const width = config.baseStats.width;
            const height = config.baseStats.height;
            const color = config.baseStats.color;
            const visual = config.visual;

            // Shadow
            g.beginFill(0x000000, 0.4);
            const sScale = visual?.shadowScale || 1.0;
            g.drawEllipse(0, 0, (width / 1.8) * sScale, (width / 4) * sScale);
            g.endFill();

            if (visual && visual.shapes) {
                for (const shape of visual.shapes) {
                    const shapeColor = shape.color !== undefined ? shape.color : color;
                    g.beginFill(shapeColor);
                    const w = width * (shape.widthPct ?? 1.0);
                    const h = height * (shape.heightPct ?? 1.0);
                    const cx = width * (shape.xOffPct ?? 0);
                    const cy = -height/2 + (height * (shape.yOffPct ?? 0)); 

                    if (shape.type === 'ROUNDED_RECT') {
                        g.drawRoundedRect(cx - w/2, cy - h/2, w, h, shape.cornerRadius || 4);
                    } else if (shape.type === 'RECT') {
                        g.drawRect(cx - w/2, cy - h/2, w, h);
                    } else if (shape.type === 'CIRCLE') {
                        const r = shape.radiusPct ? width * shape.radiusPct : w/2;
                        g.drawCircle(cx, cy, r);
                    }
                    g.endFill();
                }
            } else {
                g.beginFill(color);
                g.drawRect(-width/2, -height, width, height);
                g.endFill();
            }
            
            // Eye
            g.beginFill(0xff00ff, 0.9);
            g.drawCircle(width * 0.2, -height/2, 2);
            g.endFill();

            const texture = this.app.renderer.generateTexture(g);
            this.unitTextures.set(unitType, texture);
        });
    }

    public initUnitView(unit: IUnit) {
        // v8 Adaptation: Use Sprite instead of Particle (Particle class removed in v8)
        const sprite = new Sprite(Texture.EMPTY);
        sprite.anchor.set(0.5, 1.0); // Standard anchor for ground units
        sprite.position.set(0, 0);
        
        unit.view = sprite;
        this.unitLayer.addChild(sprite);
    }

    public assignTexture(unit: IUnit) {
        if (!unit.view) return;
        const texture = this.unitTextures.get(unit.type);
        if (texture) {
            (unit.view as Sprite).texture = texture;
        }
    }

    private stampDecal(data: { x: number, y: number, type: UnitType, rotation: number, scaleX: number }) {
        const tex = this.unitTextures.get(data.type);
        if (!tex) return;

        // Use shared sprite to avoid GC
        const s = this.sharedStampSprite;
        s.texture = tex;
        s.anchor.set(0.5, 1.0);
        s.position.set(data.x, data.y - LANE_Y); // Relative to decalRenderTexture center
        s.rotation = data.rotation;
        s.scale.set(data.scaleX, 1.0); // Maintain squash status
        s.tint = 0x333333; // Dark corpse
        s.alpha = 0.7;
        
        // Stamp onto the render texture
        this.app.renderer.render({ container: s, target: this.decalRenderTexture, clear: false });
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
            const t = new Text({ text: e.text, style: new TextStyle({ fontSize: e.fontSize || 12, fill: e.color, fontWeight: 'bold' }) }); t.anchor.set(0.5); t.position.set(e.x, e.y);
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

    public updateUnitVisuals(unit: IUnit, mode: string) {
        // @ts-ignore
        if (!unit.view) return;
        const view = unit.view as Sprite;

        if (unit.isDead || !unit.active) {
             view.visible = false; 
             return;
        }
        view.visible = true;

        view.alpha = unit.context.isBurrowed ? 0.5 : 1.0;
        view.x = unit.x;
        view.y = unit.y;
        view.zIndex = unit.y; // For sorting
        
        let scaleX = 1.0;
        let scaleY = 1.0;
        
        if (mode === 'COMBAT_VIEW') {
            const dir = (unit.faction === Faction.ZERG) ? 1 : -1;
            
            // JUICINESS: Squash and Stretch based on real-time velocity
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
        
        // Detonation Flash
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
        this.hpBarGraphics.clear();
        for (const unit of activeUnits) {
            if (!unit.active || unit.isDead || unit.stats.hp >= unit.stats.maxHp) continue;
            
            const pct = Math.max(0, unit.stats.hp / unit.stats.maxHp);
            const barW = 20;
            const barH = 3;
            const yOff = -unit.stats.height - 8;
            
            this.hpBarGraphics.beginFill(0x550000);
            this.hpBarGraphics.drawRect(unit.x - barW/2, unit.y + yOff, barW, barH);
            this.hpBarGraphics.beginFill(unit.faction === Faction.HUMAN ? 0xff0000 : 0x00ff00);
            this.hpBarGraphics.drawRect(unit.x - barW/2, unit.y + yOff, barW * pct, barH);
            this.hpBarGraphics.endFill();
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
            hive.drawPolygon([-30, 0, -20, -40, 0, -20, 20, -40, 30, 0, 0, 10]);
            hive.lineStyle(2, 0xaa00aa);
            hive.drawCircle(0, 0, 45 + Math.sin(Date.now()/500)*5);
            hive.endFill();
            this.terrainLayer.addChild(hive);
            this.harvestNodeGraphics.push(hive);
        }

        nodes.forEach((node, idx) => {
            const multiplier = node.richness;
            const g = new Graphics(); 
            const color = 0x00ff00;
            const alpha = 0.6;
            
            g.beginFill(color, alpha);
            g.lineStyle(1, 0xccffcc, 0.8);
            
            const shards = 3 + Math.floor(Math.random() * 3);
            for(let i=0; i<shards; i++) {
                const h = 20 + Math.random() * 20 * multiplier;
                const w = 10 + Math.random() * 10;
                const angle = (Math.PI * 2 * i) / shards;
                const cx = Math.cos(angle) * 5;
                const cy = Math.sin(angle) * 5;
                
                g.drawPolygon([cx - w/2, cy, cx, cy - h, cx + w/2, cy]);
            }
            g.endFill();
            
            g.beginFill(color, 0.2);
            g.drawCircle(0, -10, 30 * multiplier);
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
        this.hpBarGraphics.clear();
        this.decalContainer.removeChildren();
    }

    public addParticle(p: any) {
        this.particleLayer.addChild(p.view);
        this.activeParticles.push(p);
    }

    public destroy() {
        // Safe destroy check using optional chaining
        this.app?.destroy(true, { children: true });
    }
}