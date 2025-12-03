
import React from 'react';
import { GameCanvas } from './GameCanvas';
import { WorldMapView } from './WorldMapView';
import { HUD } from './HUD';
import { GameStateSnapshot, RegionData, TopViewMode } from '../types';
import { GameEngine } from '../game/GameEngine';

interface SurfaceViewProps {
    mode: TopViewMode;
    globalState: any; 
    gameState: GameStateSnapshot;
    activeRegion: RegionData | null;
    harvestRegion?: RegionData | null;
    mapRegions: RegionData[];
    onEnterRegion: (region: RegionData) => void;
    onEvacuate: () => void;
    onOpenHive: (region: RegionData) => void;
    onReturnToMap: () => void;
    onEngineInit: (engine: GameEngine) => void;
}

export const SurfaceView: React.FC<SurfaceViewProps> = ({ 
    mode, globalState, gameState, activeRegion, harvestRegion, mapRegions, 
    onEnterRegion, onEvacuate, onOpenHive, onReturnToMap, onEngineInit 
}) => {
    return (
        <div className="relative h-full w-full bg-[#050505] border-b border-gray-800">
            {mode === 'COMBAT_VIEW' && activeRegion ? (
                <>
                    <GameCanvas 
                        activeRegion={activeRegion}
                        mode="COMBAT_VIEW"
                        onEngineInit={onEngineInit}
                        isSimulationAuthority={false}
                    />
                    <HUD gameState={gameState} onEvacuate={onEvacuate} activeRegion={activeRegion} />
                    
                    {/* Combat Header */}
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-red-900/60 to-transparent z-20 pointer-events-none flex items-center px-4 justify-between">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 animate-pulse">
                            ● FRONTLINE // 前线战场
                        </div>
                    </div>
                </>
            ) : mode === 'HARVEST_VIEW' ? (
                <>
                    <GameCanvas 
                        activeRegion={harvestRegion || null} 
                        mode="HARVEST_VIEW" 
                        onEngineInit={onEngineInit} 
                        isSimulationAuthority={false}
                    />
                    <div className="absolute top-4 right-4 z-20">
                        <button 
                            onClick={onReturnToMap}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs border border-gray-600 shadow-lg"
                        >
                            Return to Map
                        </button>
                    </div>
                     <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-green-900/60 to-transparent z-20 pointer-events-none flex items-center px-4 justify-between">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">
                            ● HARVEST OPERATIONS // 资源采集
                        </div>
                    </div>
                </>
            ) : (
                <WorldMapView 
                    globalState={{...globalState, regions: mapRegions} as any} 
                    onEnterRegion={onEnterRegion} 
                    onOpenHive={onOpenHive} 
                    activeRegionId={activeRegion?.id}
                />
            )}
        </div>
    );
};
