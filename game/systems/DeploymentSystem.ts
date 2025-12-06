
import { DataManager, SimpleEventEmitter } from '../DataManager';
import { UnitPool } from '../Unit';
import { LevelManager } from '../managers/LevelManager';
import { UnitType, Faction } from '../../types';
import { UNIT_SCREEN_CAPS } from '../../constants';

export class DeploymentSystem {
    private unitPool: UnitPool;
    private levelManager: LevelManager;
    private events: SimpleEventEmitter;
    
    private timer: number = 0;
    public isEnabled: boolean = true;
    private readonly CHECK_INTERVAL = 0.1; // Check every 100ms

    constructor(unitPool: UnitPool, levelManager: LevelManager, events: SimpleEventEmitter) {
        this.unitPool = unitPool;
        this.levelManager = levelManager;
        this.events = events;
    }

    public update(dt: number) {
        if (!this.isEnabled) return;

        this.timer += dt;
        if (this.timer < this.CHECK_INTERVAL) return;
        this.timer = 0;

        // 1. Check Stockpile
        const stockpile = DataManager.instance.state.hive.unitStockpile;
        const availableTypes = (Object.keys(stockpile) as UnitType[]).filter(t => (stockpile[t] || 0) > 0);
        
        if (availableTypes.length === 0) return;

        // 2. Check Caps (Performance & Game Balance)
        const activeUnits = this.unitPool.getActiveUnits();
        const activeZerg = activeUnits.filter(u => u.faction === Faction.ZERG && !u.isDead);
        
        const spawnableTypes = availableTypes.filter(type => {
            const currentCount = activeZerg.filter(u => u.type === type).length;
            const cap = UNIT_SCREEN_CAPS[type] || 50;
            return currentCount < cap;
        });

        if (spawnableTypes.length === 0) return;

        // 3. Select & Spawn
        const selectedType = spawnableTypes[Math.floor(Math.random() * spawnableTypes.length)];
        
        // Atomic transaction with DataManager
        if (DataManager.instance.consumeStockpile(selectedType)) {
            // Spawn logic: Reinforcements arrive from the "rear" (left of camera).
            // Camera X tracks roughly the center of the screen.
            // We spawn them sufficiently far back (-900) so they enter from off-screen left.
            const spawnX = this.levelManager.cameraX - 900 + (Math.random() * 200);

            this.events.emit('REQUEST_SPAWN', {
                faction: Faction.ZERG,
                type: selectedType,
                x: spawnX
            });
        }
    }
}
