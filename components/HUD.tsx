

import React from 'react';
import { GameStateSnapshot, UnitType, RegionData } from '../types';
import { PLAYABLE_UNITS } from '../constants';

interface HUDProps {
    gameState: GameStateSnapshot;
    onEvacuate: () => void;
    activeRegion: RegionData | null;
}

// Helper for icon/color configuration
const getUnitIcon = (type: string) => {
    switch(type) {
        case UnitType.MELEE: return { char: 'Z', color: 'text-blue-400' };
        case UnitType.RANGED: return { char: 'H', color: 'text-purple-400' };
        case UnitType.PYROVORE: return { char: 'P', color: 'text-red-400' };
        case UnitType.CRYOLISK: return { char: 'C', color: 'text-cyan-400' };
        case UnitType.OMEGALIS: return { char: 'O', color: 'text-yellow-400' };
        case UnitType.QUEEN: return { char: 'Q', color: 'text-pink-400' };
        default: return { char: '?', color: 'text-gray-400' };
    }
};

export const HUD: React.FC<HUDProps> = ({ gameState, onEvacuate, activeRegion }) => {
    const maxStages = activeRegion ? activeRegion.totalStages : 100;
    const progressPercent = Math.min(100, (gameState.distance / maxStages) * 100);

    return (
        <div className="absolute top-8 left-0 w-full pointer-events-none flex flex-col justify-between p-4 z-10">
            {/* Top Bar: Stats */}
            <div className="flex justify-between items-start w-full pointer-events-auto">
                
                {/* Left: Progression Metre */}
                <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded border-l-2 border-red-500 pointer-events-none flex flex-col min-w-[140px]">
                    <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1">Sector Progress</div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-black font-mono text-white leading-none">
                            {gameState.distance}
                        </div>
                        <span className="text-xs text-gray-500">/ {maxStages} STAGES</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-1 bg-gray-800 mt-2 overflow-hidden rounded-full">
                        <div 
                            className="h-full bg-red-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }} 
                        />
                    </div>
                </div>
                
                {/* Right: Controls & Counts */}
                 <div className="flex gap-2">
                     <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded text-xs text-gray-300 font-mono flex gap-4 border-r-2 border-gray-600 pointer-events-none items-center">
                        {/* Zerg Unit Breakdown */}
                        <div className="flex gap-3">
                            {PLAYABLE_UNITS.map(type => {
                                 const count = (gameState.activeZergCounts && gameState.activeZergCounts[type]) || 0;
                                 const icon = getUnitIcon(type);
                                 if (count <= 0) return null;
                                 
                                 return (
                                     <div key={type} className="flex items-center gap-1">
                                         <span className={`font-bold ${icon.color}`}>{icon.char}</span>
                                         <span>{count}</span>
                                     </div>
                                 );
                            })}
                            {/* Fallback if no units active */}
                            {(!gameState.activeZergCounts || Object.values(gameState.activeZergCounts).every(c => c === 0)) && (
                                <span className="text-gray-500 text-[10px]">NO SIGNAL</span>
                            )}
                        </div>

                        <div className="w-px bg-gray-600 h-4"></div>
                        
                        <div>
                            <span className="text-red-400 mr-2">HOSTILE</span>
                            {gameState.unitCountHuman}
                        </div>
                    </div>
                    
                    <button 
                        onClick={onEvacuate}
                        className="bg-red-900/80 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border border-red-500 transition-colors pointer-events-auto shadow-lg"
                    >
                        撤离 (Evac)
                    </button>
                </div>
            </div>
            
        </div>
    );
};