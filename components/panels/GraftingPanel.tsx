
import React, { useState } from 'react';
import { DataManager } from '../../game/DataManager';
import { BIO_PLUGINS, PLAYABLE_UNITS, UNIT_CONFIGS } from '../../constants';
import { GameSaveData, Polarity, UnitType } from '../../types';

const PolarityIcon = ({ type }: { type: Polarity }) => {
    switch(type) {
        case 'ATTACK': return <span className="text-red-500 font-bold">▲</span>;
        case 'DEFENSE': return <span className="text-blue-500 font-bold">🛡️</span>;
        case 'FUNCTION': return <span className="text-yellow-500 font-bold">⚡</span>;
        default: return <span className="text-white font-bold">⚪</span>;
    }
}

export const GraftingPanel: React.FC<{ globalState: GameSaveData }> = ({ globalState }) => {
    const [graftingUnit, setGraftingUnit] = useState<UnitType>(UnitType.MELEE);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

    const unit = globalState.hive.unlockedUnits[graftingUnit];
    const config = UNIT_CONFIGS[graftingUnit];
    const inventory = globalState.hive.inventory.plugins;
    const upgradeCost = DataManager.instance.getUpgradeCost(graftingUnit);
    const canAffordUpgrade = globalState.resources.biomass >= upgradeCost;

    return (
        <div className="flex flex-col h-full p-4 bg-black/60 backdrop-blur-md border-t border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
             <div className="flex justify-between items-end mb-2">
                <h3 className="text-sm font-black text-purple-500 uppercase tracking-widest">Grafting</h3>
                 <button
                    onClick={() => DataManager.instance.upgradeUnit(graftingUnit)}
                    disabled={!canAffordUpgrade}
                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase border ${canAffordUpgrade ? 'bg-purple-900/40 text-purple-300 border-purple-500' : 'bg-gray-900 text-gray-600 border-gray-700'}`}
                >
                    Evolve (Lv.{unit.level})
                </button>
            </div>

            {/* Unit Selector */}
            <div className="flex overflow-x-auto gap-1 mb-2 pb-1 scrollbar-thin">
                {PLAYABLE_UNITS.map(t => (
                    <button 
                        key={t}
                        onClick={() => { setGraftingUnit(t); setSelectedSlot(null); }}
                        className={`px-2 py-1 text-[8px] font-bold uppercase rounded whitespace-nowrap transition-colors ${graftingUnit === t ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                    >
                        {UNIT_CONFIGS[t].name.split(' ')[0]}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 h-full overflow-hidden">
                <div className="w-1/3 flex flex-col gap-1">
                     {config.slots.map((slot, idx) => {
                        const equippedId = unit.loadout[idx];
                        const equippedInstance = equippedId ? inventory.find(p => p.instanceId === equippedId) : null;
                        const equippedTemplate = equippedInstance ? BIO_PLUGINS[equippedInstance.templateId] : null;

                        return (
                            <button 
                                key={idx}
                                onClick={() => setSelectedSlot(selectedSlot === idx ? null : idx)}
                                className={`aspect-square rounded border flex flex-col items-center justify-center relative transition-all ${
                                    selectedSlot === idx 
                                    ? 'border-white bg-gray-700' 
                                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                                }`}
                            >
                                <div className="absolute top-0.5 right-0.5 text-[6px] opacity-50">
                                    <PolarityIcon type={slot.polarity} />
                                </div>
                                {equippedTemplate ? (
                                    <div className="text-sm">{equippedTemplate.polarity === 'ATTACK' ? '⚔️' : equippedTemplate.polarity === 'DEFENSE' ? '🛡️' : '⚡'}</div>
                                ) : (
                                    <div className="text-gray-800 text-[10px]">+</div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 bg-gray-900/50 rounded border border-gray-800 p-1 overflow-y-auto">
                    {selectedSlot !== null ? (
                        <div className="grid grid-cols-1 gap-1">
                            <button onClick={() => DataManager.instance.equipPlugin(graftingUnit, selectedSlot!, null)} className="p-1 text-center text-[8px] text-red-500 bg-red-900/10 border border-red-900/30 rounded uppercase font-bold">Unequip</button>
                            {inventory.map(inst => {
                                const t = BIO_PLUGINS[inst.templateId];
                                return (
                                    <button 
                                        key={inst.instanceId}
                                        onClick={() => DataManager.instance.equipPlugin(graftingUnit, selectedSlot!, inst.instanceId)}
                                        className="bg-black border border-gray-700 p-1 rounded text-left"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-gray-200">{t.name}</span>
                                            <div className="scale-75"><PolarityIcon type={t.polarity} /></div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-[8px] text-gray-600 text-center">
                            Select Slot
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
