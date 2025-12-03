
import { DataManager } from '../DataManager';
import { UnitType } from '../../types';
import { UNIT_CONFIGS, INITIAL_LARVA_CAP } from '../../constants';

export class ProductionSystem {
    
    public update(dt: number, manager: DataManager) {
        this.updateQueen(dt, manager);
        this.updateHatchery(dt, manager);
    }

    private updateQueen(dt: number, manager: DataManager) {
        const prod = manager.state.hive.production;
        const queenCount = manager.state.hive.unitStockpile[UnitType.QUEEN] || 0;
        
        // Update Larva Rate for UI
        const queenStats = manager.getQueenStats();
        manager.rates.larva = (queenCount > 0) ? (queenCount * queenStats.amount) / queenStats.interval : 0;

        if (queenCount < 1) return;
        
        // Prestige Bonus: Larva Fission
        const fissionLevel = manager.state.player.mutationUpgrades?.larvaFission || 0;
        const intervalMult = 1 / (1 + fissionLevel); // +100% speed = 0.5x interval

        const interval = (5.0 * Math.pow(0.9, prod.queenIntervalLevel - 1)) * intervalMult;
        prod.queenTimer = (prod.queenTimer || 0) + dt;
        
        if (prod.queenTimer >= interval) {
            prod.queenTimer = 0;
            const amount = 1 * prod.queenAmountLevel * queenCount;
            manager.modifyResource('larva', amount);
        }
    }

    private updateHatchery(dt: number, manager: DataManager) {
        const units = manager.state.hive.unlockedUnits;
        const stockpile = manager.state.hive.unitStockpile;
        const resources = manager.state.resources;

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
                    manager.modifyResource('biomass', -bioCost);
                    manager.modifyResource('dna', -dnaCost);
                    manager.modifyResource('larva', -larvaCost);
                    stockpile[unit.id] = (stockpile[unit.id] || 0) + 1;
                    unit.productionProgress = 0;
                    manager.events.emit('STOCKPILE_CHANGED', stockpile);
                }
            }
        });

        manager.rates.biomass -= totalBioDrain;
        manager.rates.dna -= totalDnaDrain;
        manager.rates.larva -= totalLarvaDrain;
    }
}
