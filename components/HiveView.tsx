
import React, { useState, useCallback, useEffect } from 'react';
import { GameSaveData, UnitType, HiveSection, GameStateSnapshot, RegionData, TopViewMode } from '../types';
import { GameEngine } from '../game/GameEngine';
import { SurfaceView } from './SurfaceView';
import { UndergroundView } from './UndergroundView';
import { BirthingPanel } from './panels/BirthingPanel';
import { MetabolismPanel } from './panels/MetabolismPanel';
import { GraftingPanel } from './panels/GraftingPanel';
import { EvolutionPanel } from './panels/EvolutionPanel';

interface HiveViewProps {
  globalState: GameSaveData;
  onUpgrade: (type: UnitType) => void;
  onConfigChange: (type: UnitType, value: number) => void;
  onDigest: () => void;
  
  // Invasion Props
  gameState: GameStateSnapshot;
  activeRegion: RegionData | null;
  mapRegions: RegionData[];
  onEnterRegion: (region: RegionData) => void;
  onEvacuate: () => void;
  onEngineInit: (engine: GameEngine) => void;
}

export const HiveView: React.FC<HiveViewProps> = ({ 
    globalState, gameState, activeRegion, mapRegions, onEnterRegion, onEvacuate, onEngineInit
}) => {
  const [activeSection, setActiveSection] = useState<HiveSection | null>(null); 
  const [activeTopMode, setActiveTopMode] = useState<TopViewMode>('WORLD_MAP');

  // Sync Top Mode with activeRegion
  useEffect(() => {
      if (activeRegion) {
          setActiveTopMode('COMBAT_VIEW');
      } else {
          setActiveTopMode('WORLD_MAP');
      }
  }, [activeRegion]);

  // Stable reference for Hive engine init
  const onHiveEngineInit = useCallback((engine: GameEngine) => {
      engine.setMode('HIVE');
  }, []);

  const getActiveOverlay = () => {
      switch(activeSection) {
          case HiveSection.BIRTHING: return <BirthingPanel globalState={globalState} />;
          case HiveSection.METABOLISM: return <MetabolismPanel globalState={globalState} />;
          case HiveSection.GRAFTING: return <GraftingPanel globalState={globalState} />;
          case HiveSection.EVOLUTION: return <EvolutionPanel />;
          default: return null;
      }
  };

  return (
    <div className="flex flex-col h-full w-full">
        {/* TOP SECTION (60%) - STRATEGY & COMBAT */}
        <div className="h-[60%] relative z-0">
            <SurfaceView 
                mode={activeTopMode}
                globalState={globalState}
                gameState={gameState}
                activeRegion={activeRegion}
                mapRegions={mapRegions}
                onEnterRegion={onEnterRegion}
                onEvacuate={onEvacuate}
                onOpenHive={() => setActiveTopMode('HARVEST_VIEW')}
                onReturnToMap={() => setActiveTopMode('WORLD_MAP')}
                onEngineInit={onEngineInit}
            />
        </div>

        {/* BOTTOM SECTION (40%) - HIVE MANAGEMENT (PERSISTENT) */}
        <div className="h-[40%] relative z-10 flex flex-col">
            <div className="flex-1 relative">
                 <UndergroundView onEngineInit={onHiveEngineInit}>
                     {activeSection && getActiveOverlay()}
                 </UndergroundView>
            </div>
            
             {/* Bottom: Horizontal Tab Navigation */}
             <div className="h-12 w-full flex items-center justify-center gap-1 shrink-0 pointer-events-auto bg-black/80 backdrop-blur-sm border-t border-gray-800 z-20">
                <TabButton 
                    icon="🥚" label="HATCH" 
                    active={activeSection === HiveSection.BIRTHING} 
                    onClick={() => setActiveSection(activeSection === HiveSection.BIRTHING ? null : HiveSection.BIRTHING)} 
                />
                <TabButton 
                    icon="🏭" label="META" 
                    active={activeSection === HiveSection.METABOLISM} 
                    onClick={() => setActiveSection(activeSection === HiveSection.METABOLISM ? null : HiveSection.METABOLISM)} 
                />
                <TabButton 
                    icon="🧬" label="GENE" 
                    active={activeSection === HiveSection.GRAFTING} 
                    onClick={() => setActiveSection(activeSection === HiveSection.GRAFTING ? null : HiveSection.GRAFTING)} 
                />
                <TabButton 
                    icon="✨" label="EVOL" 
                    active={activeSection === HiveSection.EVOLUTION} 
                    onClick={() => setActiveSection(activeSection === HiveSection.EVOLUTION ? null : HiveSection.EVOLUTION)} 
                />
            </div>
        </div>
    </div>
  );
};

const TabButton = ({ icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 border-t-2 ${active ? 'bg-gray-800 border-green-500 text-white shadow-[0_-5px_15px_rgba(34,197,94,0.1)]' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900'}`}
    >
        <div className="text-lg leading-none mb-0.5">{icon}</div>
        <div className="text-[8px] font-black uppercase tracking-wider">{label}</div>
    </button>
);
