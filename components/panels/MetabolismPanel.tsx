
import React from 'react';
import { DataManager } from '../../game/DataManager';
import { METABOLISM_FACILITIES } from '../../constants';
import { GameSaveData } from '../../types';

export const MetabolismPanel: React.FC<{ globalState: GameSaveData }> = ({ globalState }) => {
    const meta = globalState.hive.metabolism;
    const groups = [
        { id: 'MATTER', name: 'Matter', color: 'text-green-400', facilities: ['VILLI', 'TAPROOT', 'GEYSER', 'BREAKER'] },
        { id: 'ENERGY', name: 'Energy', color: 'text-orange-400', facilities: ['SAC', 'PUMP', 'CRACKER', 'BOILER'] },
        { id: 'DATA', name: 'Data', color: 'text-blue-400', facilities: ['SPIRE', 'HIVE_MIND', 'RECORDER'] },
        { id: 'INFRA', name: 'Infra', color: 'text-gray-400', facilities: ['STORAGE', 'SUPPLY'] }
    ];

    const getFacilityStatus = (key: string) => {
        const cost = DataManager.instance.getMetabolismCost(key);
        let countKey = '';
        if (key === 'VILLI') countKey = 'villiCount';
        else if (key === 'TAPROOT') countKey = 'taprootCount';
        else if (key === 'GEYSER') countKey = 'geyserCount';
        else if (key === 'BREAKER') countKey = 'breakerCount';
        else if (key === 'SAC') countKey = 'fermentingSacCount';
        else if (key === 'PUMP') countKey = 'refluxPumpCount';
        else if (key === 'CRACKER') countKey = 'thermalCrackerCount';
        else if (key === 'BOILER') countKey = 'fleshBoilerCount';
        else if (key === 'SPIRE') countKey = 'thoughtSpireCount';
        else if (key === 'HIVE_MIND') countKey = 'hiveMindCount';
        else if (key === 'RECORDER') countKey = 'akashicRecorderCount';
        else if (key === 'STORAGE') countKey = 'storageCount';
        else if (key === 'SUPPLY') countKey = 'supplyCount';
        
        // @ts-ignore
        const count = meta[countKey] || 0;
        return { count, cost };
    }

    return (
        <div className="p-4 h-full overflow-y-auto bg-black/60 backdrop-blur-md border-t border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-green-500 uppercase tracking-widest">Metabolism</h3>
                <button
                    onClick={() => DataManager.instance.handleManualClick()}
                    className="px-2 py-1 bg-green-900/50 hover:bg-green-700 text-green-300 text-[10px] font-bold uppercase rounded border border-green-700 active:scale-95 transition-all"
                >
                    Harvest
                </button>
            </div>
            
            <div className="space-y-4">
                {groups.map((group) => (
                    <div key={group.id}>
                        <h4 className={`text-[9px] font-bold uppercase tracking-widest ${group.color} mb-1 pl-1 border-l border-gray-700`}>{group.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {group.facilities.map((key) => {
                                const config = METABOLISM_FACILITIES[key as keyof typeof METABOLISM_FACILITIES] as any;
                                const { count, cost } = getFacilityStatus(key);
                                const resType = cost.resource;
                                // @ts-ignore
                                const canAfford = globalState.resources[resType] >= cost.cost;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => DataManager.instance.upgradeMetabolism(key)}
                                        disabled={!canAfford}
                                        className={`text-left p-1.5 rounded border transition-all relative overflow-hidden group ${canAfford ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-gray-900 border-gray-800 opacity-60'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="text-[9px] font-bold text-gray-300 truncate w-full pr-3">{config.NAME.split('(')[0]}</span>
                                            <span className="text-[8px] font-mono text-white absolute top-1.5 right-1.5">{count}</span>
                                        </div>
                                        <div className={`text-[8px] font-mono mt-0.5 ${canAfford ? (resType === 'biomass' ? 'text-green-500' : resType === 'enzymes' ? 'text-orange-500' : 'text-blue-500') : 'text-gray-600'}`}>
                                            {cost.cost < 1000 ? cost.cost : (cost.cost/1000).toFixed(1) + 'k'} {resType.substring(0,3)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
