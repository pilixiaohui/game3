

import { Renderer, Texture, Graphics } from 'pixi.js';
import { UnitType } from '../types';
import { UNIT_CONFIGS } from '../constants';

export class TextureFactory {
    private static _cache: Map<UnitType, Texture> = new Map();
    private static _renderer: Renderer;

    public static init(renderer: Renderer) {
        this._renderer = renderer;
    }

    public static getTexture(type: UnitType): Texture {
        if (this._cache.has(type)) {
            return this._cache.get(type)!;
        }

        const config = UNIT_CONFIGS[type];
        if (!config) {
            return Texture.EMPTY;
        }

        // Bake texture
        const g = new Graphics();
        const width = config.baseStats.width;
        const height = config.baseStats.height;
        const color = config.baseStats.color;
        
        // Shadow (Base at 0,0)
        const visual = config.visual;
        const sScale = visual?.shadowScale || 1.0;
        g.beginFill(0x000000, 0.4);
        g.drawEllipse(0, 0, (width / 1.8) * sScale, (width / 4) * sScale);
        g.endFill();

        if (visual && visual.shapes) {
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
        
        // Eye
        g.beginFill(0xff00ff, 0.9);
        g.drawCircle(width * 0.2, -height + (height * 0.2), 2);
        g.endFill();

        // Generate and cache
        // Note: generateTexture creates a texture bounded by the graphics.
        // We need to ensure the anchor point remains consistent (feet at 0,0).
        // PixiJS v8 signature
        const texture = this._renderer.generateTexture({
            target: g,
            frame: g.getBounds(), // Tight fit
            resolution: 2, // High res for crispness
        });
        
        // Set default anchor based on where 0,0 (feet) is relative to bounds
        const bounds = g.getBounds();
        // Manually setting x and y to support various TS definitions
        texture.defaultAnchor.x = -bounds.x / bounds.width;
        texture.defaultAnchor.y = -bounds.y / bounds.height;

        this._cache.set(type, texture);
        g.destroy();

        return texture;
    }
}
