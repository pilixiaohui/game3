
import { Application, Container, Graphics, TilingSprite, Text, TextStyle, Texture, Sprite, RenderTexture, ParticleContainer } from 'pixi.js';
import { IUnit, ObstacleDef, UnitType, Faction, IFxEvent, HarvestNodeDef } from '../../types';
import { LANE_Y, UNIT_CONFIGS, ELEMENT_COLORS } from '../../constants';
import { SimpleEventEmitter } from '../DataManager';
import { AssetManager } from '../AssetManager';
import { TextureFactory } from '../TextureFactory';

export class WorldRenderer {
    public app: Application | null = null;
    public world!: Container;
    
    private bgLayer!: TilingSprite;
    private groundLayer!: TilingSprite;
    public unitLayer!: ParticleContainer; // Optimized
    public terrainLayer!: Container;
    public particleLayer!: Container;
    public hiveLayer!: Container;
    public uiLayer!: Container;
    
    private obstacleGraphics: Graphics[] = [];
    private harvestNodeGraphics: Graphics[] = [];
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

        // 1. Create App (PixiJS v7 Compatibility)
        this.app = new Application({ 
            resizeTo: this.element, 
            backgroundColor: 0x0a0a0a, 
            antialias: false, 
            resolution: window.devicePixelRatio || 1, 
            autoDensity: true 
        });

        if (this.isDestroyed) {
            this.destroy(); 
            return;
        }

        // Initialize TextureFactory & Bake Atlas
        TextureFactory.init(this.app.renderer);
        TextureFactory.generateAtlas();

        // 2. Append Canvas
        this.element.appendChild(this.app.view as unknown as HTMLElement);

        this.sharedStampSprite = new Sprite(Texture.EMPTY);

        // --- Setup Layers ---
        const bgGfx = new Graphics();
        bgGfx.beginFill(0x111111);
        bgGfx.drawRect(0, 0, 512, 512);
        bgGfx.endFill();
        
        // v7 generateTexture
        const bgTex = this.app.renderer.generateTexture(bgGfx);
        this.bgLayer = new TilingSprite(
            bgTex,
            this.app.screen.width, 
            this.app.screen.height
        );
        this.app.stage.addChild(this.bgLayer);

        const floorGfx = new Graphics();
        floorGfx.beginFill(0x181818);
        floorGfx.lineStyle(2, 0x2a2a2a, 0.5);
        floorGfx.drawRect(0, 0, 256, 256);
        floorGfx.endFill();

        const floorTex = this.app.renderer.generateTexture(floorGfx);
        this.groundLayer = new TilingSprite(
            floorTex, 
            this.app.screen.width, 
            this.app.screen.height / 2 + 200
        );
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
        
        // --- OPERATION TEXTURE BAKE: High Performance Unit Layer ---
        // PixiJS v7: Use ParticleContainer for performance
        this.unitLayer = new ParticleContainer(2500, {
            position: true,
            rotation: true,
            tint: true,
            vertices: true, // For scale
            uvs: true       // For texture frame changes
        });
        
        this.unitLayer.zIndex = 10;
        this.world.addChild(this.unitLayer);
        
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
    
    public initUnitView(unit: IUnit) {
        // [Fix] ParticleContainer requires all sprites to share the same BaseTexture.
        // We use a texture from the atlas (UnitType.MELEE) as the placeholder to ensure the correct BaseTexture is set.
        // Using Texture.EMPTY would set a different BaseTexture, causing invisible units when switched to Atlas.
        const placeholderTex = TextureFactory.getTexture(UnitType.MELEE) || Texture.EMPTY;
        
        const sprite = new Sprite(placeholderTex);
        
        // Initially hide until the unit is properly spawned and activated
        sprite.visible = false; 
        sprite.alpha = 0;

        unit.view = sprite;
        this.unitLayer.addChild(sprite); 
    }

    public assignTexture(unit: IUnit) {
        if (!unit.view) return;
        const assetTex = AssetManager.instance.getTexture(unit.type);
        const texture = assetTex || TextureFactory.getTexture(unit.type);
        if (texture) (unit.view as Sprite).texture = texture;
    }

    private stampDecal(data: any) {
        if (!this.app) return;
        const assetTex = AssetManager.instance.getTexture(data.type);
        const tex = assetTex || TextureFactory.getTexture(data.type);
        if (!tex) return;
        const s = this.sharedStampSprite;
        s.texture = tex;
        const anchorX = (tex as any).defaultAnchor?.x ?? 0.5;
        const anchorY = (tex as any).defaultAnchor?.y ?? 0.5;
        s.anchor.set(anchorX, anchorY); 
        s.position.set(data.x, data.y - LANE_Y);
        s.rotation = data.rotation;
        s.scale.set(data.scaleX, 1.0);
        s.tint = 0x333333; s.alpha = 0.7;
        
        // v7 render signature
        this.app.renderer.render(s, {
            renderTexture: this.decalRenderTexture,
            clear: false
        });
    }
    
    private handleFxEvent(e: IFxEvent) {
        if (e.type === 'EXPLOSION') {
            this.createParticles(e.x, e.y, e.color, 10);
            this.createShockwave(e.x, e.y, e.radius, e.color);
        } else if (e.type === 'FLASH') {
            const g = new Graphics();
            g.beginFill(e.color);
            g.drawCircle(0, 0, 20);
            g.endFill();
            g.position.set(e.x, e.y);
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'PROJECTILE') {
            const g = new Graphics();
            g.lineStyle(2, e.color);
            g.moveTo(0,0);
            g.lineTo(e.x2-e.x, e.y2-e.y);
            g.position.set(e.x, e.y);
            this.addParticle({ view: g, type: 'GRAPHICS', life: 0.1, maxLife: 0.1, update: (p:any, dt:number) => { p.life -= dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'TEXT') {
            const t = new Text(e.text, { fontSize: e.fontSize || 12, fill: e.color, fontWeight: 'bold' }); 
            t.anchor.set(0.5); t.position.set(e.x, e.y);
            this.addParticle({ view: t, type: 'TEXT', life: 0.8, maxLife: 0.8, update: (p:any, dt:number) => { p.life -= dt; p.view.y -= 20 * dt; p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
        } else if (e.type === 'SLASH') {
            const g = new Graphics();
            g.lineStyle(2, e.color);
            g.moveTo(e.x - 10, e.y - 10).lineTo(e.targetX + 10, e.targetY + 10);
            g.moveTo(e.x + 10, e.y - 10).lineTo(e.targetX - 10, e.targetY + 10);
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
        const g = new Graphics();
        g.lineStyle(2, color);
        g.drawCircle(0, 0, radius);
        g.position.set(x, y);
        this.addParticle({ view: g, type: 'GRAPHICS', life: 0.3, maxLife: 0.3, update: (p:any, dt:number) => { p.life -= dt; p.view.scale.set(1 + (1 - p.life/p.maxLife)); p.view.alpha = p.life/p.maxLife; return p.life > 0; } });
    }
    private createParticles(x: number, y: number, color: number, count: number) {
        for(let i=0; i<count; i++) {
            const g = new Graphics();
            g.beginFill(color);
            g.drawRect(0,0,3,3);
            g.endFill();
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
             view.tint = 0xff0000; // Reset tint if needed, wait, 0xffffff is normal
             view.tint = 0xffffff;
        }
        view.scale.set(scaleX, scaleY);
        view.rotation = 0;
    }
    public renderHpBars(activeUnits: IUnit[]) {
        if (!this.hpBarGraphics) return;
        this.hpBarGraphics.clear();
        
        const now = Date.now();

        for (const unit of activeUnits) {
            if (!unit.active || unit.isDead || unit.stats.hp >= unit.stats.maxHp) continue;
            if (now - unit.lastHitTime > 2000) continue;

            const pct = Math.max(0, unit.stats.hp / unit.stats.maxHp);
            const barW = 20;
            const barH = 3;
            const yOff = -unit.stats.height - 8;
            
            this.hpBarGraphics.beginFill(0x550000);
            this.hpBarGraphics.drawRect(unit.x - barW/2, unit.y + yOff, barW, barH);
            this.hpBarGraphics.endFill();
            
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
    public drawTerrain(obs: ObstacleDef[]) { 
        this.obstacleGraphics.forEach(g => { g.clear(); g.destroy(); });
        this.obstacleGraphics = [];
        obs.forEach(o => {
            const g = new Graphics();
            if (o.type === 'WALL') {
                g.beginFill(0x222222);
                g.lineStyle(2, 0x555555);
                g.drawRect(o.x - o.width/2, LANE_Y + o.y - o.height, o.width, o.height);
                g.endFill();
                
                if (o.health && o.maxHealth) {
                    const pct = o.health / o.maxHealth;
                    g.beginFill(0x550000);
                    g.drawRect(o.x - o.width/2, LANE_Y + o.y - o.height - 10, o.width, 5);
                    g.endFill();
                    
                    g.beginFill(0xff0000);
                    g.drawRect(o.x - o.width/2, LANE_Y + o.y - o.height - 10, o.width * pct, 5);
                    g.endFill();
                }
            } else if (o.type === 'ROCK') {
                g.beginFill(0x222222);
                g.lineStyle(2, 0x555555);
                g.drawCircle(o.x, LANE_Y + o.y, o.width/2);
                g.endFill();
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
            hive.beginFill(0x550055);
            hive.lineStyle(2, 0xaa00aa);
            hive.drawPolygon([-30, 0, -20, -40, 0, -20, 20, -40, 30, 0, 0, 10]);
            hive.endFill();
            
            hive.lineStyle(2, 0xaa00aa);
            hive.drawCircle(0, 0, 45 + Math.sin(Date.now()/500)*5);
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
                
                g.beginFill(color, alpha);
                g.lineStyle(1, 0xccffcc, 0.8);
                g.drawPolygon([cx - w/2, cy, cx, cy - h, cx + w/2, cy]);
                g.endFill();
            }
            g.beginFill(color, alpha * 0.2);
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
        this.isDestroyed = true;

        if (this.app?.ticker) {
            this.app.ticker.stop();
        }

        if (this.decalRenderTexture) {
            try { this.decalRenderTexture.destroy(true); } catch(e) {}
        }

        if (this.app) {
            try {
                // [Fix] Do NOT destroy textures/baseTextures. 
                // TextureFactory manages the Atlas texture lifecycle globally.
                // Destroying them here corrupts the TextureFactory cache for other active renderers.
                this.app.destroy(true, { 
                    children: true, 
                    texture: false, 
                    baseTexture: false 
                });
            } catch (e) {
                // suppress
            }
            this.app = null;
        }

        this.obstacleGraphics = [];
        this.harvestNodeGraphics = [];
        this.activeParticles = [];
    }
}
