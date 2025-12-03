
import React from 'react';
import { DataManager } from '../../game/DataManager';
import { PLAYABLE_UNITS, UNIT_CONFIGS } from '../../constants';
import { GameSaveData, UnitType } from '../../types';

export const BirthingPanel: React.FC<{ globalState: GameSaveData }> = ({ globalState }) => {
    return (
      <div className="p-4 h-full overflow-y-auto bg-black/60 backdrop-blur-md border-t border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="mb-4 flex justify-between items-center">
            <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest">Hatchery</h3>
            <div className="flex gap-2">
                <button 
                    onClick={() => DataManager.instance.upgradeQueen('INTERVAL')}
                    className="px-2 py-0.5 bg-pink-900/30 border border-pink-700 text-[9px] text-pink-300 rounded uppercase hover:bg-pink-900/50"
                >
                    +Speed
                </button>
                 <button 
                    onClick={() => DataManager.instance.upgradeQueen('AMOUNT')}
                    className="px-2 py-0.5 bg-blue-900/30 border border-blue-700 text-[9px] text-blue-300 rounded uppercase hover:bg-blue-900/50"
                >
                    +Amt
                </button>
            </div>
        </div>

        <div className="space-y-1.5">
            {PLAYABLE_UNITS.map(type => {
                const u = globalState.hive.unlockedUnits[type];
                const config = UNIT_CONFIGS[type];
                const currentCount = globalState.hive.unitStockpile[type] || 0;
                
                return (
                    <div key={type} className={`bg-gray-900/80 border ${u.isProducing ? 'border-green-500/30' : 'border-gray-800'} p-1.5 rounded flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[9px] ${type === UnitType.MELEE ? 'bg-blue-900 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>
                                {config.name[0]}
                            </div>
                            <div>
                                <div className="text-[9px] font-bold text-gray-300">{config.name}</div>
                                <div className="text-[8px] text-gray-500 font-mono">{currentCount}/{u.cap}</div>
                            </div>
                        </div>
                        
                        <div className="flex gap-1">
                             <button
                                onClick={() => DataManager.instance.toggleProduction(type)}
                                className={`w-5 h-5 rounded flex items-center justify-center border ${u.isProducing ? 'bg-green-500 border-green-400 text-black' : 'bg-black border-gray-600 text-gray-600'}`}
                             >
                                 <div className="w-1.5 h-1.5 rounded-full bg-current" />
                             </button>
                             <button
                                onClick={() => DataManager.instance.upgradeUnitCap(type)}
                                className="px-1.5 bg-gray-800 border border-gray-700 text-[8px] text-gray-400 hover:text-white rounded"
                             >
                                 +Cap
                             </button>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
};
