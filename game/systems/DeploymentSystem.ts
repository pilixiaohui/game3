
import { DataManager, SimpleEventEmitter } from '../DataManager';
import { UnitPool } from '../Unit';
import { LevelManager } from '../managers/LevelManager';
import { UnitType, Faction } from '../../types';
import { UNIT_SCREEN_CAPS, UNIT_CONFIGS, STAGE_WIDTH } from '../../constants';

export class DeploymentSystem {
    private unitPool: UnitPool;
    private levelManager: LevelManager;
    private events: SimpleEventEmitter;
    
    private timer: number = 0;
    public isEnabled: boolean = true;
    private readonly CHECK_INTERVAL = 0.1; 

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

        const stockpile = DataManager.instance.state.hive.unitStockpile;
        
        const availableTypes = (Object.keys(stockpile) as UnitType[]).filter(t => {
            const count = stockpile[t] || 0;
            if (count <= 0) return false;
            const config = UNIT_CONFIGS[t];
            if (!config) return false;
            return !config.tags?.includes('NON_COMBAT');
        });
        
        if (availableTypes.length === 0) return;

        const activeUnits = this.unitPool.getActiveUnits();
        const activeZerg = activeUnits.filter(u => u.faction === Faction.ZERG && !u.isDead);
        
        const spawnableTypes = availableTypes.filter(type => {
            const currentCount = activeZerg.filter(u => u.type === type).length;
            const cap = UNIT_SCREEN_CAPS[type] || 50;
            return currentCount < cap;
        });

        if (spawnableTypes.length === 0) return;

        const selectedType = spawnableTypes[Math.floor(Math.random() * spawnableTypes.length)];
        
        if (DataManager.instance.consumeStockpile(selectedType)) {
            // FIXED: Always spawn at start of current stage with a safe buffer
            const stageStartX = this.levelManager.currentStageIndex * STAGE_WIDTH;
            const SPAWN_BUFFER = 300;
            const spawnX = stageStartX - SPAWN_BUFFER + (Math.random() * 50); 

            this.events.emit('REQUEST_SPAWN', {
                faction: Faction.ZERG,
                type: selectedType,
                x: spawnX
            });
        }
    }
}
