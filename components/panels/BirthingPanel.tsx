
import React from 'react';
import { DataManager } from '../../game/DataManager';
import { PLAYABLE_UNITS, UNIT_CONFIGS } from '../../constants';
import { GameSaveData, UnitType } from '../../types';

export const BirthingPanel: React.FC<{ globalState: GameSaveData }> = ({ globalState }) => {
    
    // 1. Categorize units based on NON_COMBAT tag
    const utilityUnits = PLAYABLE_UNITS.filter(type => {
        const config = UNIT_CONFIGS[type];
        return config.tags?.includes('NON_COMBAT');
    });

    const combatUnits = PLAYABLE_UNITS.filter(type => {
        const config = UNIT_CONFIGS[type];
        return !config.tags?.includes('NON_COMBAT');
    });

    // 2. Extract common rendering logic
    const renderUnitRow = (type: UnitType) => {
        const u = globalState.hive.unlockedUnits[type];
        // If DataManager fix works, u should not be null.
        if (!u) return null; 

        const config = UNIT_CONFIGS[type];
        const currentCount = globalState.hive.unitStockpile[type] || 0;
        const isUtility = config.tags?.includes('NON_COMBAT');
        
        return (
            <div key={type} className={`bg-gray-900/80 border ${u.isProducing ? (isUtility ? 'border-purple-500/50' : 'border-green-500/30') : 'border-gray-800'} p-2 rounded flex items-center justify-between group hover:border-gray-600 transition-all`}>
                <div className="flex items-center gap-3">
                    {/* Icon color distinction: Support=Purple, Combat=Green/Gray */}
                    <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs shadow-inner ${
                        isUtility ? 'bg-purple-900/50 text-purple-300' : 
                        u.isProducing ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                        {config.name[0]}
                    </div>
                    <div>
                        <div className={`text-xs font-bold ${u.isProducing ? (isUtility ? 'text-purple-300' : 'text-green-400') : 'text-gray-300'}`}>
                            {config.name}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <span className={currentCount >= u.cap ? 'text-red-500' : 'text-gray-400'}>{currentCount}</span>
                            <span className="text-gray-700">/</span>
                            <span>{u.cap}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 items-center">
                     {/* Production Toggle */}
                     <button
                        onClick={() => DataManager.instance.toggleProduction(type)}
                        className={`h-7 px-3 rounded flex items-center justify-center border transition-all ${
                            u.isProducing 
                            ? (isUtility ? 'bg-purple-500/20 border-purple-500 text-purple-300 hover:bg-purple-500/30' : 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30')
                            : 'bg-black border-gray-700 text-gray-600 hover:border-gray-500 hover:text-gray-400'
                        }`}
                        title={u.isProducing ? "Stop Hatching" : "Start Hatching"}
                     >
                         <div className={`w-2 h-2 rounded-full ${u.isProducing ? (isUtility ? 'bg-purple-400 animate-pulse' : 'bg-green-400 animate-pulse') : 'bg-current'}`} />
                         <span className="ml-2 text-[10px] font-bold uppercase">{u.isProducing ? 'ON' : 'OFF'}</span>
                     </button>
                     
                     {/* Cap Upgrade */}
                     <button
                        onClick={() => DataManager.instance.upgradeUnitCap(type)}
                        className="h-7 w-10 bg-gray-800 border border-gray-700 text-[10px] text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex flex-col items-center justify-center leading-none"
                        title="Increase Cap"
                    >
                         <span>+CAP</span>
                     </button>
                </div>
            </div>
        );
    };

    return (
      <div className="p-4 h-full overflow-y-auto bg-black/90 backdrop-blur-xl border-t border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-300 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        
        {/* Top Control: Larva Production */}
        <div className="mb-6 flex justify-between items-center sticky top-0 bg-black/95 pb-4 border-b border-gray-800 z-10 pt-2">
            <div>
                <h3 className="text-lg font-black text-orange-500 uppercase tracking-widest">Hatchery</h3>
                <p className="text-[10px] text-gray-500 font-mono">Larva Management</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => DataManager.instance.upgradeQueen('INTERVAL')}
                    className="flex flex-col items-center px-3 py-1 bg-pink-900/20 border border-pink-900/50 hover:border-pink-500 text-pink-500 rounded transition-all group"
                >
                    <span className="text-[9px] font-bold uppercase tracking-wider">Speed</span>
                    <span className="text-[8px] opacity-60 group-hover:opacity-100">+Rate</span>
                </button>
                 <button 
                    onClick={() => DataManager.instance.upgradeQueen('AMOUNT')}
                    className="flex flex-col items-center px-3 py-1 bg-blue-900/20 border border-blue-900/50 hover:border-blue-500 text-blue-500 rounded transition-all group"
                >
                    <span className="text-[9px] font-bold uppercase tracking-wider">Yield</span>
                    <span className="text-[8px] opacity-60 group-hover:opacity-100">+Amt</span>
                </button>
            </div>
        </div>

        <div className="space-y-6 pb-8">
            {/* 3. Render Support Caste Section */}
            {utilityUnits.length > 0 && (
                <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-500/10">
                        <div className="text-lg">👑</div>
                        <div>
                            <div className="text-[10px] text-purple-400 uppercase font-black tracking-widest">Support Caste</div>
                            <div className="text-[8px] text-purple-300/50 uppercase tracking-wider">Hive Management • Non-Combat</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {utilityUnits.map(renderUnitRow)}
                    </div>
                </div>
            )}

            {/* 4. Render Combat Swarm Section */}
            <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-1 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                    <div>
                        <div className="text-[10px] text-red-500 uppercase font-black tracking-widest">Combat Swarm</div>
                        <div className="text-[8px] text-gray-600 uppercase tracking-wider">Frontline Units • Auto-Deploy</div>
                    </div>
                </div>
                <div className="space-y-2">
                    {combatUnits.map(renderUnitRow)}
                </div>
            </div>
        </div>
      </div>
    );
};
