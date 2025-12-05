
import { Renderer, Texture, Graphics, Container, Rectangle } from 'pixi.js';
import { UnitType } from '../types';
import { UNIT_CONFIGS } from '../constants';

export class TextureFactory {
    private static _cache: Map<UnitType, Texture> = new Map();
    private static _renderer: Renderer;
    private static _atlasTexture: Texture | null = null;

    public static init(renderer: Renderer) {
        this._renderer = renderer;
    }

    public static getTexture(type: UnitType): Texture {
        if (this._cache.has(type)) {
            return this._cache.get(type)!;
        }
        return Texture.EMPTY; 
    }

    public static generateAtlas() {
        if (!this._renderer) return;

        // Cleanup old atlas/cache to prevent leaks or context mismatch
        if (this._atlasTexture) {
            try {
                this._atlasTexture.destroy(true);
            } catch (e) {
                console.warn("Failed to destroy old atlas texture", e);
            }
            this._atlasTexture = null;
        }
        this._cache.clear();

        const container = new Container();
        const mapping: Record<string, { rect: Rectangle, anchor: {x: number, y: number} }> = {};
        
        let currentX = 2;
        let currentY = 2;
        let rowHeight = 0;
        const PADDING = 2;
        const ATLAS_WIDTH = 2048;

        // Track used dimensions to ensure texture region is large enough
        let maxUsedX = 0;
        let maxUsedY = 0;

        const types = Object.values(UnitType) as UnitType[];

        for (const type of types) {
            const config = UNIT_CONFIGS[type];
            if (!config) continue;

            const g = this.createUnitGraphic(type);
            const bounds = g.getLocalBounds(); 
            const w = Math.ceil(bounds.width);
            const h = Math.ceil(bounds.height);

            if (currentX + w > ATLAS_WIDTH) {
                currentX = 2;
                currentY += rowHeight + PADDING;
                rowHeight = 0;
            }

            g.position.set(currentX - bounds.x, currentY - bounds.y);
            container.addChild(g);

            mapping[type] = {
                rect: new Rectangle(currentX, currentY, w, h),
                anchor: {
                    x: -bounds.x / w,
                    y: -bounds.y / h
                }
            };

            // Update bounds tracking
            if (currentX + w > maxUsedX) maxUsedX = currentX + w;
            if (currentY + h > maxUsedY) maxUsedY = currentY + h;

            currentX += w + PADDING;
            rowHeight = Math.max(rowHeight, h);
        }
        
        // Final update for the last row's height
        if (currentY + rowHeight > maxUsedY) maxUsedY = currentY + rowHeight;
        
        // Add padding to total size to prevent any rounding errors at the edge
        maxUsedX += PADDING;
        maxUsedY += PADDING;

        try {
            // PixiJS v7 generateTexture signature
            // Explicitly providing 'region' is critical to avoid mismatch between
            // Math.ceil'd frame sizes and Pixi's auto-detected float bounds.
            this._atlasTexture = this._renderer.generateTexture(container, {
                resolution: 2,
                scaleMode: 1, // LINEAR
                region: new Rectangle(0, 0, maxUsedX, maxUsedY)
            });
        } catch (e) {
            console.error("Texture baking failed:", e);
            container.destroy({ children: true });
            return;
        }

        for (const [type, data] of Object.entries(mapping)) {
            // PixiJS v7 Texture constructor
            const texture = new Texture(this._atlasTexture.baseTexture, data.rect);
            
            // Default anchor
            (texture as any).defaultAnchor = { x: data.anchor.x, y: data.anchor.y };
            
            this._cache.set(type as UnitType, texture);
        }
        
        container.destroy({ children: true });
    }

    private static createUnitGraphic(type: UnitType): Graphics {
        const config = UNIT_CONFIGS[type];
        const g = new Graphics();
        
        if (!config) return g;

        const width = config.baseStats.width;
        const height = config.baseStats.height;
        const color = config.baseStats.color;
        
        const visual = config.visual;
        const sScale = visual?.shadowScale || 1.0;
        
        g.beginFill(0x000000, 0.4);
        g.drawEllipse(0, 0, (width / 1.8) * sScale, (width / 4) * sScale);
        g.endFill();

        if (visual && visual.shapes && visual.shapes.length > 0) {
            for (const shape of visual.shapes) {
                const shapeColor = shape.color !== undefined ? shape.color : color;
                
                const w = width * (shape.widthPct ?? 1.0);
                const h = height * (shape.heightPct ?? 1.0);
                const cx = width * (shape.xOffPct ?? 0);
                const cy = -height/2 + (height * (shape.yOffPct ?? 0)); 

                g.beginFill(shapeColor);
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
        
        g.beginFill(0xffffff, 0.8);
        g.drawCircle(width * 0.2, -height + (height * 0.2), 2);
        g.endFill();

        return g;
    }
}
