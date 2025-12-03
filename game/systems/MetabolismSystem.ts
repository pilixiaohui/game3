
import { DataManager } from '../DataManager';
import { METABOLISM_FACILITIES } from '../../constants';
import { UnitType } from '../../types';

export class MetabolismSystem {
    
    public update(dt: number, manager: DataManager) {
        const meta: any = manager.state.hive.metabolism;
        const res = manager.state.resources;
        const conf = METABOLISM_FACILITIES;
        
        // Prestige Bonus: Metabolism Surge
        const surgeLevel = manager.state.player.mutationUpgrades?.metabolicSurge || 0;
        const globalMultiplier = 1 + (surgeLevel * 0.5); // +50% per level

        let bioRate = 0;
        let enzRate = 0;
        let dnaRate = 0;

        // --- BIOMASS GENERATION ---
        const clusterMult = Math.pow(1.25, Math.floor(meta.villiCount / 100));
        const villiBase = conf.VILLI.BASE_RATE + (meta.taprootCount * conf.TAPROOT.BONUS_TO_VILLI);
        bioRate += meta.villiCount * villiBase * clusterMult;
        bioRate += meta.geyserCount * conf.GEYSER.BASE_RATE;
        bioRate += meta.breakerCount * conf.BREAKER.BASE_RATE;

        if (res.biomass > 5000) bioRate -= res.biomass * meta.breakerCount * conf.BREAKER.LOSS_RATE;

        const kills = (manager.state.player as any).totalKills || 0; 
        bioRate += (meta.necroSiphonCount || 0) * (conf.NECRO_SIPHON.BASE_RATE + kills * conf.NECRO_SIPHON.KILL_SCALAR);
        bioRate += (meta.redTideCount || 0) * conf.RED_TIDE.BASE_RATE * (1 + (meta.villiCount / 50));

        if (meta.gaiaDigesterCount > 0) {
            bioRate += meta.gaiaDigesterCount * conf.GAIA_DIGESTER.COEFF * Math.pow(Math.max(1, res.biomass), conf.GAIA_DIGESTER.POW_FACTOR);
        }

        // Apply Global Multiplier to Bio
        bioRate *= globalMultiplier;
        manager.modifyResource('biomass', bioRate * dt);

        // --- ENZYME GENERATION & CONVERSION ---
        
        // Fermenting Sac (Bio -> Enz)
        if (meta.fermentingSacCount > 0) {
            let cost = conf.SAC.INPUT - (meta.refluxPumpCount * conf.PUMP.COST_REDUCTION);
            cost = Math.max(conf.PUMP.MIN_COST, cost);
            const maxInput = meta.fermentingSacCount * cost * dt;
            const consumed = Math.min(maxInput, res.biomass);
            if (consumed > 0) {
                const consumptionRate = consumed / dt;
                bioRate -= consumptionRate;
                const productionRate = (consumptionRate / cost) * conf.SAC.OUTPUT;
                enzRate += productionRate;
                manager.modifyResource('biomass', -consumed);
                manager.modifyResource('enzymes', productionRate * dt * globalMultiplier);
            }
        }

        // Thermal Cracker (High Pressure Bio -> Enz + Heat)
        if (meta.thermalCrackerCount > 0) {
            if (!meta.crackerOverheated) {
                 const inputNeeded = meta.thermalCrackerCount * conf.CRACKER.INPUT * dt;
                 if (res.biomass >= inputNeeded) {
                     bioRate -= inputNeeded / dt;
                     const productionRate = meta.thermalCrackerCount * conf.CRACKER.OUTPUT;
                     enzRate += productionRate;
                     manager.modifyResource('biomass', -inputNeeded);
                     manager.modifyResource('enzymes', productionRate * dt * globalMultiplier);
                     meta.crackerHeat += conf.CRACKER.HEAT_GEN * dt;
                     if (meta.crackerHeat >= 100) { meta.crackerHeat = 100; meta.crackerOverheated = true; }
                 } else {
                     meta.crackerHeat = Math.max(0, meta.crackerHeat - conf.CRACKER.COOL_RATE * dt);
                 }
            } else {
                 meta.crackerHeat -= conf.CRACKER.COOL_RATE * dt;
                 if (meta.crackerHeat <= 0) { meta.crackerHeat = 0; meta.crackerOverheated = false; }
            }
        }
        
        // Flesh Boiler (Larva -> Enz)
        if (meta.fleshBoilerCount > 0) {
            const larvaNeeded = meta.fleshBoilerCount * conf.BOILER.INPUT_LARVA * dt;
            if (res.larva >= larvaNeeded) {
                const productionRate = meta.fleshBoilerCount * conf.BOILER.OUTPUT_ENZ;
                enzRate += productionRate;
                manager.modifyResource('larva', -larvaNeeded);
                manager.modifyResource('enzymes', productionRate * dt * globalMultiplier);
            }
        }

        // Blood Fusion (Unit -> Enz)
        if ((meta.bloodFusionCount || 0) > 0) {
            const meleeStock = manager.state.hive.unitStockpile['MELEE'] || 0;
            const eatChance = (meta.bloodFusionCount || 0) * 1.0 * dt;
            if (meleeStock >= 1 && Math.random() < eatChance) {
                manager.state.hive.unitStockpile['MELEE']--;
                manager.modifyResource('enzymes', conf.BLOOD_FUSION.OUTPUT_ENZ * globalMultiplier);
                manager.events.emit('STOCKPILE_CHANGED', manager.state.hive.unitStockpile);
            }
        }

        // Synaptic Resonator (Pop -> Enz)
        if ((meta.synapticResonatorCount || 0) > 0) {
            const totalPop = manager.getTotalStockpile();
            const resGen = (meta.synapticResonatorCount || 0) * Math.sqrt(totalPop) * conf.RESONATOR.POP_SCALAR * dt;
            enzRate += resGen / dt;
            manager.modifyResource('enzymes', resGen * globalMultiplier);
        }

        // Entropy Vent (Bio Burn -> Enz)
        if ((meta.entropyVentCount || 0) > 0) {
            const burnAmount = res.biomass * conf.ENTROPY_VENT.BURN_RATE * dt;
            if (burnAmount > 0) {
                bioRate -= burnAmount / dt;
                const gainRate = (burnAmount / dt) * conf.ENTROPY_VENT.CONVERT_RATIO;
                enzRate += gainRate;
                manager.modifyResource('biomass', -burnAmount);
                manager.modifyResource('enzymes', gainRate * dt * globalMultiplier);
            }
        }

        // --- DNA GENERATION ---
        
        if (meta.thoughtSpireCount > 0) {
             const spireRate = meta.thoughtSpireCount * conf.SPIRE.BASE_RATE;
             dnaRate += spireRate;
             meta.spireAccumulator += spireRate * dt * globalMultiplier;
             if (meta.spireAccumulator >= 1) {
                 const drop = Math.floor(meta.spireAccumulator);
                 meta.spireAccumulator -= drop;
                 manager.modifyResource('dna', drop);
             }
        }
        
        if (meta.hiveMindCount > 0) {
            const totalPop = manager.getTotalStockpile();
            const hiveGen = meta.hiveMindCount * Math.sqrt(Math.max(1, totalPop)) * conf.HIVE_MIND.SCALAR * dt;
            dnaRate += hiveGen / dt;
            manager.modifyResource('dna', hiveGen * globalMultiplier);
        }

        if ((meta.combatCortexCount || 0) > 0) {
             const melee = manager.state.hive.unitStockpile['MELEE'] || 0;
             const cortexGen = (meta.combatCortexCount || 0) * (melee * 0.1) * conf.COMBAT_CORTEX.BASE_RATE * dt;
             dnaRate += cortexGen / dt;
             manager.modifyResource('dna', cortexGen * globalMultiplier);
        }

        if (meta.akashicRecorderCount > 0 && Math.random() < conf.RECORDER.CHANCE * dt) {
             const bonus = Math.floor(res.dna * conf.RECORDER.PERCENT);
             if (bonus > 0) manager.modifyResource('dna', bonus);
        }

        // Update Rates for UI
        manager.rates.biomass = bioRate;
        manager.rates.enzymes = enzRate;
        manager.rates.dna = dnaRate;
    }
}
