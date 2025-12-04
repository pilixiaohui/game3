import { Assets, Texture } from 'pixi.js';
import { UnitType } from '../types';

export class AssetManager {
    private static _instance: AssetManager;
    private textures: Map<string, Texture> = new Map();
    
    private manifest: Partial<Record<UnitType, string>> = {
        // [UnitType.MELEE]: '/assets/zergling.png',
    };

    private constructor() {}

    public static get instance(): AssetManager {
        if (!this._instance) this._instance = new AssetManager();
        return this._instance;
    }

    public async loadResources() {
        // 检查 bundle 是否已存在
        if (Assets.resolver.hasBundle('units')) {
            // 如果 bundle 还在，直接返回，不要重复添加
            return;
        }

        const bundles: any = {
            units: {}
        };

        let hasAssets = false;
        for (const [type, url] of Object.entries(this.manifest)) {
            if (url) {
                bundles.units[type] = url;
                hasAssets = true;
            }
        }

        if (hasAssets) {
            try {
                Assets.addBundle('units', bundles.units);
                const loaded = await Assets.loadBundle('units');
                
                for (const [key, tex] of Object.entries(loaded)) {
                    this.textures.set(key, tex as Texture);
                }
                console.log("AssetManager: Loaded units bundle");
            } catch (e) {
                console.error("AssetManager: Failed to load resources", e);
            }
        }
    }

    public getTexture(type: UnitType): Texture | undefined {
        return this.textures.get(type);
    }
}