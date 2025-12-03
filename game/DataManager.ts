

import { GameSaveData, UnitType, UnitRuntimeStats, Resources, GameModifiers, BioPluginConfig, PluginInstance, ElementType } from '../types';
import { INITIAL_GAME_STATE, UNIT_CONFIGS, UNIT_UPGRADE_COST_BASE, RECYCLE_REFUND_RATE, METABOLISM_FACILITIES, MAX_RESOURCES_BASE, BIO_PLUGINS, CAP_UPGRADE_BASE, EFFICIENCY_UPGRADE_BASE, QUEEN_UPGRADE_BASE, INITIAL_LARVA_CAP, CLICK_CONFIG, INITIAL_REGIONS_CONFIG } from '../constants';
import { MetabolismSystem } from './systems/MetabolismSystem';

export type Listener = (data: any) => void;

export class SimpleEventEmitter {
    private listeners: Record<string, Listener[]> = {};
    
    on(event: string, fn: Listener) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
    }
    
    off(event: string, fn: Listener) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== fn);
    }
    
    emit(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(fn => fn(data));
        }
    }
}

export class DataManager {
    private static _instance: DataManager;
    
    public state: GameSaveData;
    public events: SimpleEventEmitter;
    private autoSaveInterval: any;
    
    public rates: Resources = { biomass: 0, enzymes: 0, larva: 0, dna: 0, mutagen: 0 };
    
    public modifiers: GameModifiers = {
        damageMultiplier: 1.0,
        maxHpMultiplier: 1.0,
        resourceRateMultiplier: 1.0,
        explodeOnDeath: false,
        doubleSpawnChance: 0.0,
    };

    private metabolismSystem: MetabolismSystem;

    private constructor() {
        this.events = new SimpleEventEmitter();
        this.state = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
        this.metabolismSystem = new MetabolismSystem();
        this.loadGame();
        this.autoSaveInterval = setInterval(() => this.saveGame(), 30000);
    }

    public static get instance(): DataManager {
        if (!this._instance) {
            this._instance = new DataManager();
        }
        return this._instance;
    }

    // Called externally by the Authority GameEngine
    public updateTick(dt: number) {
        const safeDt = Math.min(dt, 1.0);
        this.metabolismSystem.update(safeDt * this.modifiers.resourceRateMultiplier, this); 
        this.updateQueen(safeDt);      
        const queenStats = this.getQueenStats();
        const queenCount = this.state.hive.unitStockpile[UnitType.QUEEN] || 0;
        this.rates.larva = (queenCount > 0) ? (queenCount * queenStats.amount) / queenStats.interval : 0;
        this.updateHatchery(safeDt);
    }

    public saveGame() {
        this.state.player.lastSaveTime = Date.now();
        const json = JSON.stringify(this.state);
        try {
            localStorage.setItem('HIVE_SAVE_DATA', json);
        } catch (e) {
            console.warn("Save failed", e);
        }
    }

    public loadGame() {
        try {
            const json = localStorage.getItem('HIVE_SAVE_DATA');
            if (json) {
                const loaded = JSON.parse(json);
                this.state = { ...INITIAL_GAME_STATE, ...loaded };
                if (!this.state.hive.metabolism.crackerHeat) {
                    this.state.hive.metabolism = JSON.parse(JSON.stringify(INITIAL_GAME_STATE.hive.metabolism));
                }
                if (!this.state.hive.production.queenIntervalLevel) {
                    this.state.hive.production.queenIntervalLevel = 1;
                    this.state.hive.production.queenAmountLevel = 1;
                    this.state.hive.production.larvaCapBase = INITIAL_LARVA_CAP;
                    this.state.resources.larva = INITIAL_LARVA_CAP;
                }
                // Init new Prestige fields
                if (this.state.player.mutationUpgrades === undefined) {
                    this.state.player.mutationUpgrades = {
                        metabolicSurge: 0,
                        larvaFission: 0,
                        geneticMemory: false
                    };
                    this.state.player.lifetimeDna = 0;
                }

                if (this.state.player.totalKills === undefined) this.state.player.totalKills = 0;
                Object.values(UnitType).forEach(uType => {
                    const u = uType as UnitType;
                    if (!this.state.hive.unlockedUnits[u]) {
                        this.state.hive.unlockedUnits[u] = JSON.parse(JSON.stringify(INITIAL_GAME_STATE.hive.unlockedUnits[u] || {id:u}));
                    }
                    if (this.state.hive.unlockedUnits[u].isProducing === undefined) {
                         this.state.hive.unlockedUnits[u].isProducing = false;
                    }
                });
                this.calculateOfflineProgress();
            }
        } catch (e) {
            this.state = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
        }
    }

    public calculateOfflineProgress() {
        this.state.player.lastSaveTime = Date.now();
    }
    
    public recordKill() {
        if (this.state.player.totalKills === undefined) this.state.player.totalKills = 0;
        this.state.player.totalKills++;
    }

    public modifyResource(type: keyof Resources, amount: number) {
        this.state.resources[type] += amount;
        
        // Track Lifetime DNA for Prestige
        if (type === 'dna' && amount > 0) {
            this.state.player.lifetimeDna = (this.state.player.lifetimeDna || 0) + amount;
        }

        if (type === 'larva') {
            const max = this.state.hive.production.larvaCapBase;
            if (this.state.resources.larva > max) this.state.resources.larva = max;
        } else if (type === 'biomass' || type === 'enzymes') {
            const cap = this.getMaxResourceCap();
            if (this.state.resources[type] > cap) {
                this.state.resources[type] = cap;
            }
        }
        if (this.state.resources[type] < 0) this.state.resources[type] = 0;
        this.events.emit('RESOURCE_CHANGED', { type, value: this.state.resources[type] });
    }
    
    public getMaxResourceCap(): number {
        const count = this.state.hive.metabolism.storageCount || 0;
        return MAX_RESOURCES_BASE + (count * METABOLISM_FACILITIES.STORAGE.CAP_PER_LEVEL);
    }
    
    public getMaxPopulationCap(): number {
        let total = 0;
        Object.values(this.state.hive.unlockedUnits).forEach(u => { total += u.cap || 0; });
        const supplyBonus = (this.state.hive.metabolism.supplyCount || 0) * METABOLISM_FACILITIES.SUPPLY.CAP_PER_LEVEL;
        return total + supplyBonus;
    }

    public getRecycleRate(): number { return 0.5; }
    
    private updateQueen(dt: number) {
        const prod = this.state.hive.production;
        const queenCount = this.state.hive.unitStockpile[UnitType.QUEEN] || 0;
        if (queenCount < 1) return;
        
        // Prestige Bonus: Larva Fission
        const fissionLevel = this.state.player.mutationUpgrades?.larvaFission || 0;
        const intervalMult = 1 / (1 + fissionLevel); // +100% speed = 0.5x interval

        const interval = (5.0 * Math.pow(0.9, prod.queenIntervalLevel - 1)) * intervalMult;
        prod.queenTimer = (prod.queenTimer || 0) + dt;
        if (prod.queenTimer >= interval) {
            prod.queenTimer = 0;
            const amount = 1 * prod.queenAmountLevel * queenCount;
            this.modifyResource('larva', amount);
        }
    }

    private updateHatchery(dt: number) {
        const units = this.state.hive.unlockedUnits;
        const stockpile = this.state.hive.unitStockpile;
        const resources = this.state.resources;

        let totalBioDrain = 0;
        let totalDnaDrain = 0;
        let totalLarvaDrain = 0;

        Object.values(units).forEach(unit => {
            if (!unit.isProducing) return;
            if ((stockpile[unit.id] || 0) >= unit.cap) return;

            const config = UNIT_CONFIGS[unit.id];
            const discount = Math.pow(0.95, unit.efficiencyLevel - 1);
            const bioCost = config.baseCost.biomass * discount;
            const dnaCost = config.baseCost.dna * discount;
            const larvaCost = config.baseCost.larva;
            const timeCost = config.baseCost.time * discount;

            if (timeCost > 0) {
                totalBioDrain += bioCost / timeCost;
                totalDnaDrain += dnaCost / timeCost;
                totalLarvaDrain += larvaCost / timeCost;
            }

            if (resources.biomass >= bioCost && resources.dna >= dnaCost && resources.larva >= larvaCost) {
                unit.productionProgress += dt;
                if (unit.productionProgress >= timeCost) {
                    this.modifyResource('biomass', -bioCost);
                    this.modifyResource('dna', -dnaCost);
                    this.modifyResource('larva', -larvaCost);
                    stockpile[unit.id] = (stockpile[unit.id] || 0) + 1;
                    unit.productionProgress = 0;
                    this.events.emit('STOCKPILE_CHANGED', stockpile);
                }
            }
        });

        this.rates.biomass -= totalBioDrain;
        this.rates.dna -= totalDnaDrain;
        this.rates.larva -= totalLarvaDrain;
    }

    public getClickValue(): number {
        return CLICK_CONFIG.BASE + (this.rates.biomass * CLICK_CONFIG.SCALING);
    }

    public handleManualClick() {
        const value = this.getClickValue();
        this.modifyResource('biomass', value);
    }

    public toggleProduction(type: UnitType) {
        const u = this.state.hive.unlockedUnits[type];
        if (u) {
            u.isProducing = !u.isProducing;
            this.saveGame();
            this.events.emit('PRODUCTION_CHANGED', {});
        }
    }

    public getMetabolismCost(key: string) {
        const config = METABOLISM_FACILITIES[key as keyof typeof METABOLISM_FACILITIES] as any;
        if (!config) return { resource: 'biomass', cost: 0 };
        
        const map: Record<string, string> = {
            'VILLI': 'villiCount',
            'TAPROOT': 'taprootCount',
            'GEYSER': 'geyserCount',
            'BREAKER': 'breakerCount',
            'SAC': 'fermentingSacCount',
            'PUMP': 'refluxPumpCount',
            'CRACKER': 'thermalCrackerCount',
            'BOILER': 'fleshBoilerCount',
            'NECRO_SIPHON': 'necroSiphonCount',
            'RED_TIDE': 'redTideCount',
            'GAIA_DIGESTER': 'gaiaDigesterCount',
            'BLOOD_FUSION': 'bloodFusionCount',
            'RESONATOR': 'synapticResonatorCount',
            'ENTROPY_VENT': 'entropyVentCount',
            'SPIRE': 'thoughtSpireCount',
            'HIVE_MIND': 'hiveMindCount',
            'RECORDER': 'akashicRecorderCount',
            'COMBAT_CORTEX': 'combatCortexCount',
            'GENE_ARCHIVE': 'geneArchiveCount',
            'OMEGA_POINT': 'omegaPointCount',
            'STORAGE': 'storageCount',
            'SUPPLY': 'supplyCount'
        };

        const prop = map[key];
        const count = prop ? (this.state.hive.metabolism as any)[prop] || 0 : 0;
        
        const cost = Math.floor(config.BASE_COST * Math.pow(config.GROWTH, count));
        return { resource: config.COST_RESOURCE, cost };
    }

    public upgradeMetabolism(key: string) {
        const { resource, cost } = this.getMetabolismCost(key);
        // @ts-ignore
        if (this.state.resources[resource] >= cost) {
            // @ts-ignore
            this.modifyResource(resource, -cost);

             const map: Record<string, string> = {
                'VILLI': 'villiCount',
                'TAPROOT': 'taprootCount',
                'GEYSER': 'geyserCount',
                'BREAKER': 'breakerCount',
                'SAC': 'fermentingSacCount',
                'PUMP': 'refluxPumpCount',
                'CRACKER': 'thermalCrackerCount',
                'BOILER': 'fleshBoilerCount',
                'NECRO_SIPHON': 'necroSiphonCount',
                'RED_TIDE': 'redTideCount',
                'GAIA_DIGESTER': 'gaiaDigesterCount',
                'BLOOD_FUSION': 'bloodFusionCount',
                'RESONATOR': 'synapticResonatorCount',
                'ENTROPY_VENT': 'entropyVentCount',
                'SPIRE': 'thoughtSpireCount',
                'HIVE_MIND': 'hiveMindCount',
                'RECORDER': 'akashicRecorderCount',
                'COMBAT_CORTEX': 'combatCortexCount',
                'GENE_ARCHIVE': 'geneArchiveCount',
                'OMEGA_POINT': 'omegaPointCount',
                'STORAGE': 'storageCount',
                'SUPPLY': 'supplyCount'
            };
            const prop = map[key];
            if (prop) {
                const meta = this.state.hive.metabolism as any;
                meta[prop] = (meta[prop] || 0) + 1;
                this.saveGame();
                this.events.emit('PRODUCTION_CHANGED', {});
                if (key === 'STORAGE' || key === 'SUPPLY') {
                     this.events.emit('RESOURCE_CHANGED', {});
                }
            }
        }
    }

    public upgradeUnitCap(type: UnitType) {
        const u = this.state.hive.unlockedUnits[type];
        if (!u) return;
        const cost = Math.floor(CAP_UPGRADE_BASE * Math.pow(1.5, u.capLevel - 1));
        if (this.state.resources.biomass >= cost) {
            this.modifyResource('biomass', -cost);
            u.capLevel++;
            u.cap += (type === UnitType.MELEE ? 20 : type === UnitType.RANGED ? 10 : 1); 
            this.saveGame();
            this.events.emit('PRODUCTION_CHANGED', {});
        }
    }

    public upgradeUnitEfficiency(type: UnitType) {
        const u = this.state.hive.unlockedUnits[type];
        if (!u) return;
        const cost = Math.floor(EFFICIENCY_UPGRADE_BASE * Math.pow(1.5, u.efficiencyLevel - 1));
        if (this.state.resources.biomass >= cost) {
            this.modifyResource('biomass', -cost);
            u.efficiencyLevel++;
            this.saveGame();
            this.events.emit('PRODUCTION_CHANGED', {});
        }
    }

    public upgradeQueen(type: 'INTERVAL' | 'AMOUNT') {
        const prod = this.state.hive.production;
        if (type === 'INTERVAL') {
             const cost = Math.floor(QUEEN_UPGRADE_BASE * Math.pow(1.8, prod.queenIntervalLevel - 1));
             if (this.state.resources.biomass >= cost) {
                 this.modifyResource('biomass', -cost);
                 prod.queenIntervalLevel++;
                 this.saveGame();
                 this.events.emit('PRODUCTION_CHANGED', {});
             }
        } else {
             const cost = Math.floor(QUEEN_UPGRADE_BASE * 2 * Math.pow(2.0, prod.queenAmountLevel - 1));
             if (this.state.resources.dna >= cost) {
                 this.modifyResource('dna', -cost);
                 prod.queenAmountLevel++;
                 this.saveGame();
                 this.events.emit('PRODUCTION_CHANGED', {});
             }
        }
    }
    
    public getUnitProductionStats(type: UnitType) {
        const u = this.state.hive.unlockedUnits[type];
        const config = UNIT_CONFIGS[type];
        const discount = Math.pow(0.95, u.efficiencyLevel - 1);
        return {
            bio: config.baseCost.biomass * discount,
            dna: config.baseCost.dna * discount,
            time: config.baseCost.time * discount,
            capCost: Math.floor(CAP_UPGRADE_BASE * Math.pow(1.5, u.capLevel - 1)),
            effCost: Math.floor(EFFICIENCY_UPGRADE_BASE * Math.pow(1.5, u.efficiencyLevel - 1))
        };
    }

    public getQueenStats() {
        const prod = this.state.hive.production;
        const fissionLevel = this.state.player.mutationUpgrades?.larvaFission || 0;
        const intervalMult = 1 / (1 + fissionLevel);
        const interval = (5.0 * Math.pow(0.9, prod.queenIntervalLevel - 1)) * intervalMult;
        const amount = 1 * prod.queenAmountLevel;
        return {
            interval,
            amount,
            costInterval: Math.floor(QUEEN_UPGRADE_BASE * Math.pow(1.8, prod.queenIntervalLevel - 1)),
            costAmount: Math.floor(QUEEN_UPGRADE_BASE * 2 * Math.pow(2.0, prod.queenAmountLevel - 1))
        };
    }
    
    public digestStockpile() {
        const stockpile = this.state.hive.unitStockpile;
        let totalRefundBiomass = 0;
        for (const type of Object.values(UnitType)) {
            const count = stockpile[type] || 0;
            if (count > 0 && type !== UnitType.QUEEN) {
                const config = UNIT_CONFIGS[type];
                totalRefundBiomass += count * config.baseCost.biomass * RECYCLE_REFUND_RATE;
                stockpile[type] = 0;
            }
        }
        if (totalRefundBiomass > 0) this.modifyResource('biomass', totalRefundBiomass);
        this.events.emit('STOCKPILE_CHANGED', this.state.hive.unitStockpile);
        this.saveGame();
    }
    
    public consumeStockpile(type: UnitType): boolean {
        if (this.state.hive.unitStockpile[type] > 0) {
            this.state.hive.unitStockpile[type]--;
            this.events.emit('STOCKPILE_CHANGED', this.state.hive.unitStockpile);
            return true;
        }
        return false;
    }

    public addToStockpile(type: UnitType, amount: number) {
        this.state.hive.unitStockpile[type] = (this.state.hive.unitStockpile[type] || 0) + amount;
        this.events.emit('STOCKPILE_CHANGED', this.state.hive.unitStockpile);
    }
    
    // --- PRESTIGE SYSTEM ---
    public getPrestigeReward(): number {
        const lifetimeDna = this.state.player.lifetimeDna || 0;
        if (lifetimeDna < 1000) return 0;
        return Math.floor(Math.sqrt(lifetimeDna / 1000));
    }

    public prestige() {
        const reward = this.getPrestigeReward();
        if (reward <= 0 && this.state.player.prestigeLevel === 0) return;
        
        const newMutagen = this.state.resources.mutagen + reward;
        const newPrestigeLevel = this.state.player.prestigeLevel + 1;
        
        // Persist Mutations & Upgrades
        const keptPlugins = this.state.hive.inventory.plugins;
        const keptUpgrades = this.state.player.mutationUpgrades || {
            metabolicSurge: 0,
            larvaFission: 0,
            geneticMemory: false
        };

        // Reset
        this.state = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
        
        // Restore
        this.state.resources.mutagen = newMutagen;
        this.state.hive.inventory.plugins = keptPlugins;
        this.state.player.prestigeLevel = newPrestigeLevel;
        this.state.player.mutationUpgrades = keptUpgrades;
        this.state.player.lifetimeDna = 0; 

        // Genetic Memory: Start with Sac
        if (keptUpgrades.geneticMemory) {
             this.state.hive.metabolism.fermentingSacCount = 1;
        }

        this.saveGame();
        this.events.emit('RESOURCE_CHANGED', {});
        window.location.reload(); 
    }

    public buyMutationUpgrade(type: 'SURGE' | 'FISSION' | 'MEMORY') {
        const upgrades = this.state.player.mutationUpgrades!;
        if (type === 'SURGE') {
            if (this.state.resources.mutagen >= 1) {
                this.state.resources.mutagen -= 1;
                upgrades.metabolicSurge++;
                this.saveGame();
                this.events.emit('RESOURCE_CHANGED', {});
            }
        } else if (type === 'FISSION') {
            if (this.state.resources.mutagen >= 3) {
                this.state.resources.mutagen -= 3;
                upgrades.larvaFission++;
                this.saveGame();
                this.events.emit('RESOURCE_CHANGED', {});
            }
        } else if (type === 'MEMORY') {
            if (!upgrades.geneticMemory && this.state.resources.mutagen >= 10) {
                this.state.resources.mutagen -= 10;
                upgrades.geneticMemory = true;
                this.saveGame();
                this.events.emit('RESOURCE_CHANGED', {});
            }
        }
    }
    
    public upgradeUnit(type: UnitType): boolean {
        const u = this.state.hive.unlockedUnits[type];
        if (!u) return false;
        const cost = this.getUpgradeCost(type);
        if (this.state.resources.biomass >= cost) {
            this.modifyResource('biomass', -cost);
            u.level++;
            this.saveGame();
            this.events.emit('UNIT_UPGRADED', type);
            return true;
        }
        return false;
    }

    public updateProductionConfig(type: UnitType, weight: number) { }
    
    public getTotalStockpile(): number {
         const s = this.state.hive.unitStockpile;
         return Object.values(s).reduce((a, b) => a + b, 0);
    }
    
    public calculateLoad(unitType: UnitType, loadout: (string | null)[]): number {
        let total = 0;
        const slots = UNIT_CONFIGS[unitType].slots;
        loadout.forEach((instanceId, idx) => {
            if (!instanceId) return;
            const instance = this.state.hive.inventory.plugins.find(p => p.instanceId === instanceId);
            if (!instance) return;
            const t = BIO_PLUGINS[instance.templateId];
            let cost = t.baseCost + (instance.rank * t.costPerRank);
            const slotPolarity = slots[idx]?.polarity || 'UNIVERSAL';
            if (slotPolarity === t.polarity || slotPolarity === 'UNIVERSAL') {
                cost = Math.ceil(cost/2);
            }
            total += cost;
        });
        return total;
    }

    public getUpgradeCost(type: UnitType): number {
         const save = this.state.hive.unlockedUnits[type];
         if (!save) return 999999;
         return Math.floor(UNIT_UPGRADE_COST_BASE * Math.pow(1.5, save.level - 1));
    }

    public getUnitStats(type: UnitType, runtimeModifiers?: GameModifiers): UnitRuntimeStats {
        const config = UNIT_CONFIGS[type];
        if (!config || !config.baseStats) {
            return { hp: 0, maxHp: 0, damage: 0, range: 0, speed: 0, attackSpeed: 1, width: 0, height: 0, color: 0, critChance: 0, critDamage: 0, element: 'PHYSICAL', armor: 0 };
        }
        const save = this.state.hive.unlockedUnits[type];
        const mods = runtimeModifiers || this.modifiers;
        const lvlMultHp = 1 + (save.level - 1) * config.growthFactors.hp;
        const lvlMultDmg = 1 + (save.level - 1) * config.growthFactors.damage;
        const runMultHp = mods.maxHpMultiplier;
        const runMultDmg = mods.damageMultiplier;
        const mutagenMult = 1; 
        
        let pluginMultHp = 0, pluginMultDmg = 0, pluginMultSpeed = 0, pluginMultAttackSpeed = 0, pluginFlatCritChance = 0, pluginMultCritChance = 0, pluginMultCritDmg = 0;
        let element: ElementType = config.elementConfig?.type || 'PHYSICAL'; 
        
        if (save.loadout) {
            save.loadout.forEach(instanceId => {
                if (!instanceId) return;
                const instance = this.state.hive.inventory.plugins.find(p => p.instanceId === instanceId);
                if (!instance) return;
                const template = BIO_PLUGINS[instance.templateId];
                if (!template) return;
                const rankMult = 1 + (instance.rank * template.statGrowth);
                template.stats.forEach(mod => {
                    const val = mod.value * rankMult;
                    if (mod.stat === 'hp') pluginMultHp += val;
                    if (mod.stat === 'damage') pluginMultDmg += val;
                    if (mod.stat === 'speed') pluginMultSpeed += val;
                    if (mod.stat === 'attackSpeed') pluginMultAttackSpeed += val;
                    if (mod.stat === 'critChance') { if (mod.isFlat) pluginFlatCritChance += val; else pluginMultCritChance += val; }
                    if (mod.stat === 'critDamage') pluginMultCritDmg += val;
                    if (mod.stat === 'elementalDmg' && mod.element) { element = mod.element; pluginMultDmg += val; }
                });
            });
        }
        return {
            hp: config.baseStats.hp * lvlMultHp * runMultHp * (1 + pluginMultHp) * mutagenMult,
            maxHp: config.baseStats.hp * lvlMultHp * runMultHp * (1 + pluginMultHp) * mutagenMult,
            damage: config.baseStats.damage * lvlMultDmg * runMultDmg * (1 + pluginMultDmg) * mutagenMult,
            range: config.baseStats.range,
            speed: config.baseStats.speed * (1 + pluginMultSpeed),
            attackSpeed: Math.max(0.1, config.baseStats.attackSpeed / (1 + pluginMultAttackSpeed)), 
            width: config.baseStats.width, height: config.baseStats.height, color: config.baseStats.color,
            critChance: (0.05 + pluginFlatCritChance) * (1 + pluginMultCritChance), 
            critDamage: 1.5 + pluginMultCritDmg, element: element,
            armor: config.baseStats.armor
        };
    }
    
    public equipPlugin(unitType: UnitType, slotIndex: number, instanceId: string | null) {
        const unit = this.state.hive.unlockedUnits[unitType];
        if (instanceId) {
            const existingIdx = unit.loadout.indexOf(instanceId);
            if (existingIdx !== -1 && existingIdx !== slotIndex) unit.loadout[existingIdx] = null;
        }
        const old = unit.loadout[slotIndex];
        unit.loadout[slotIndex] = instanceId;
        const load = this.calculateLoad(unitType, unit.loadout);
        if (load > UNIT_CONFIGS[unitType].baseLoadCapacity) {
            unit.loadout[slotIndex] = old;
            return false;
        }
        this.saveGame();
        this.events.emit('PLUGIN_EQUIPPED', { unitType });
        return true;
    }
    public fusePlugin(instanceId: string): boolean {
         const instance = this.state.hive.inventory.plugins.find(p => p.instanceId === instanceId);
         if (!instance) return false;
         const cost = 50 * (instance.rank + 1);
         if (this.state.resources.biomass >= cost) {
             this.modifyResource('biomass', -cost);
             instance.rank++;
             this.saveGame();
             this.events.emit('PLUGIN_UPGRADED', instanceId);
             return true;
         }
         return false;
    }
    public addPlugin(templateId: string) { }
    public unlockRegion(id: number) { 
        if (!this.state.world.regions[id]) { this.state.world.regions[id] = {id, isUnlocked:true, devourProgress:0}; this.events.emit('REGION_UNLOCKED', id); this.saveGame(); } 
    }
    public updateRegionProgress(id: number, delta: number) {
        if (!this.state.world.regions[id]) return;
        const regionConfig = INITIAL_REGIONS_CONFIG.find(r => r.id === id);
        // ... (truncated in original file, keeping as is)
    }
}