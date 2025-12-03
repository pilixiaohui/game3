
import { Application, Container, Graphics, TilingSprite, Text, TextStyle } from 'pixi.js';
import { IUnit, ObstacleDef, UnitType, Faction } from '../../types';
import { LANE_Y, UNIT_CONFIGS, ELEMENT_COLORS } from '../../constants';

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

    constructor(element: HTMLElement) {
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
        
        if (unit.isDead) {
            // @ts-ignore
            view.alpha = 1.0 - (unit.decayTimer / 2.0); // Simple decay time hardcoded for now or passed in
            view.rotation = Math.PI / 2;
        } else {
            view.y += Math.sin(Date.now() / 200 + unit.id) * 2;
            if (mode === 'COMBAT_VIEW') {
               view.scale.x = (unit.faction === Faction.ZERG) ? 1 : -1;
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
    
    public clear() {
        this.obstacleGraphics.forEach(g => { g.clear(); g.destroy(); });
        this.obstacleGraphics = [];
        this.activeParticles.forEach(p => p.view.destroy());
        this.activeParticles = [];
    }

    public destroy() {
        this.app.destroy(true, { children: true });
    }

    // --- Particles ---
    // Storing particles here for simplicity of the refactor
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
