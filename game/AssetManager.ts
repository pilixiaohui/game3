import { Assets, Texture } from 'pixi.js';
import { UnitType } from '../types';

export class AssetManager {
    private static _instance: AssetManager;
    private textures: Map<string, Texture> = new Map();
    
    // Mapping UnitTypes to asset URLs. 
    // Currently empty/placeholders. Add real paths here when assets are available.
    private manifest: Partial<Record<UnitType, string>> = {
        // [UnitType.MELEE]: '/assets/zergling.png',
        // [UnitType.RANGED]: '/assets/hydralisk.png',
    };

    private constructor() {}

    public static get instance(): AssetManager {
        if (!this._instance) this._instance = new AssetManager();
        return this._instance;
    }

    public async loadResources() {
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
                console.log("AssetManager: Loaded units bundle", Object.keys(loaded));
            } catch (e) {
                console.error("AssetManager: Failed to load resources", e);
            }
        }
    }

    public getTexture(type: UnitType): Texture | undefined {
        return this.textures.get(type);
    }
}