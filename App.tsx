import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiveView } from './components/HiveView';
import { GameEngine } from './game/GameEngine';
import { DataManager } from './game/DataManager';
import { GameStateSnapshot, RegionData, UnitType, GameSaveData, Resources } from './types';
import { INITIAL_REGIONS_CONFIG } from './constants';

const App: React.FC = () => {
  const engineRef = useRef<GameEngine | null>(null);
  
  // Connect to DataManager (Global Store)
  const [globalState, setGlobalState] = useState<GameSaveData>(() => DataManager.instance.state);
  // Rates are transient runtime data
  const [rates, setRates] = useState<Resources>(() => DataManager.instance.rates);
  
  // Refs for high-frequency DOM updates
  const biomassRef = useRef<HTMLSpanElement>(null);
  const enzymesRef = useRef<HTMLSpanElement>(null);
  const dnaRef = useRef<HTMLSpanElement>(null);
  const larvaRef = useRef<HTMLSpanElement>(null);
  const swarmRef = useRef<HTMLDivElement>(null);

  // --- UI State ---
  const [activeRegion, setActiveRegion] = useState<RegionData | null>(null);

  // --- Battle State (HUD) ---
  const [gameState, setGameState] = useState<GameStateSnapshot>({
    resources: 0, distance: 0, unitCountZerg: 0, unitCountHuman: 0, isPaused: false,
    stockpileMelee: 0, stockpileRanged: 0, stockpileTotal: 0, populationCap: 0,
    activeZergCounts: {}
  });

  // Optimize DataManager subscriptions with throttling and direct DOM updates
  useEffect(() => {
      let lastStateUpdate = 0;
      const STATE_UPDATE_INTERVAL = 200; // 5Hz update for panels

      const handleDataChange = () => {
          const now = Date.now();

          // 1. High Frequency: Direct DOM Manipulation
          const state = DataManager.instance.state;
          if (biomassRef.current) biomassRef.current.innerText = Math.floor(state.resources.biomass).toLocaleString();
          if (enzymesRef.current) enzymesRef.current.innerText = Math.floor(state.resources.enzymes).toLocaleString();
          if (dnaRef.current) dnaRef.current.innerText = Math.floor(state.resources.dna).toLocaleString();
          if (larvaRef.current) larvaRef.current.innerText = Math.floor(state.resources.larva).toLocaleString();
          
          if (swarmRef.current) {
               const count = state.hive.unitStockpile[UnitType.MELEE] + state.hive.unitStockpile[UnitType.RANGED]; 
               swarmRef.current.innerText = `${count} / ${DataManager.instance.getMaxPopulationCap()}`;
          }

          // 2. Low Frequency: React State Update (for Panels)
          if (now - lastStateUpdate > STATE_UPDATE_INTERVAL) {
              setGlobalState(JSON.parse(JSON.stringify(state)));
              setRates({...DataManager.instance.rates}); 
              lastStateUpdate = now;
          }
      };

      const dm = DataManager.instance;
      // Hook into high frequency events
      dm.events.on('RESOURCE_CHANGED', handleDataChange);
      
      // These events should trigger immediate React updates as they change structure
      const handleStructuralChange = () => {
          setGlobalState(JSON.parse(JSON.stringify(DataManager.instance.state)));
      };

      dm.events.on('STOCKPILE_CHANGED', handleStructuralChange);
      dm.events.on('PRODUCTION_CHANGED', handleStructuralChange);
      dm.events.on('UNIT_UPGRADED', handleStructuralChange);
      dm.events.on('REGION_PROGRESS', handleStructuralChange);
      dm.events.on('REGION_UNLOCKED', handleStructuralChange);
      dm.events.on('PLUGIN_EQUIPPED', handleStructuralChange);
      dm.events.on('PLUGIN_UPGRADED', handleStructuralChange);

      return () => {
          dm.events.off('RESOURCE_CHANGED', handleDataChange);
          dm.events.off('STOCKPILE_CHANGED', handleStructuralChange);
          dm.events.off('PRODUCTION_CHANGED', handleStructuralChange);
          dm.events.off('UNIT_UPGRADED', handleStructuralChange);
          dm.events.off('REGION_PROGRESS', handleStructuralChange);
          dm.events.off('REGION_UNLOCKED', handleStructuralChange);
          dm.events.off('PLUGIN_EQUIPPED', handleStructuralChange);
          dm.events.off('PLUGIN_UPGRADED', handleStructuralChange);
      };
  }, []);

  // Battle Loop Polling
  useEffect(() => {
      let animId: number;
      const poll = () => {
          if (engineRef.current && !engineRef.current.isPaused) {
              const snapshot = engineRef.current.getSnapshot();
              setGameState(snapshot);
          }
          animId = requestAnimationFrame(poll);
      };
      animId = requestAnimationFrame(poll);
      return () => cancelAnimationFrame(animId);
  }, [activeRegion]);

  const handleEngineInit = useCallback((engine: GameEngine) => {
    engineRef.current = engine;
  }, []);

  const handleEnterRegion = (region: RegionData) => {
      setActiveRegion(region);
  };
  
  const handleEvacuate = () => {
      setActiveRegion(null);
  };

  const handleUpgradeUnit = (type: UnitType) => {
      DataManager.instance.upgradeUnit(type);
  };
  
  const handleDigest = () => {
      DataManager.instance.digestStockpile();
  };

  const handleProductionConfigChange = (type: UnitType, value: number) => {
      DataManager.instance.updateProductionConfig(type, value);
  };

  // Construct Region Data for Map View
  const mapRegions: RegionData[] = INITIAL_REGIONS_CONFIG.map(r => {
      const saved = globalState.world.regions[r.id];
      return {
          ...r,
          isUnlocked: saved ? saved.isUnlocked : false,
          devourProgress: saved ? saved.devourProgress : 0,
          isFighting: activeRegion?.id === r.id
      };
  });

  // Helper for Top Bar with Refs
  const ResourceItem = ({ label, rate, color, subColor, valRef, initialVal }: any) => (
      <div className="flex flex-col min-w-[100px]">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</span>
          <div className="flex items-baseline gap-2">
              <span ref={valRef} className={`text-lg font-mono font-bold ${color} leading-none`}>
                  {Math.floor(initialVal).toLocaleString()}
              </span>
              <span className={`text-[10px] font-mono ${subColor || 'text-gray-500'}`}>
                  {rate >= 0 ? '+' : ''}{rate.toFixed(1)}/s
              </span>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col w-full h-full bg-neutral-900 font-sans select-none overflow-hidden">
      
      {/* GLOBAL HEADER (Unified Resource Display) */}
      <div className="h-16 bg-[#050505] border-b border-gray-800 flex items-center justify-between px-6 z-50 shrink-0">
          <div className="flex items-center gap-8">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
                  <span className="text-red-600">异种</span>起源
              </h1>
              
              <div className="h-8 w-px bg-gray-800"></div>

              <div className="flex gap-8">
                  <ResourceItem 
                    label="Biomass" 
                    initialVal={globalState.resources.biomass}
                    valRef={biomassRef}
                    rate={rates.biomass} 
                    color="text-green-500" 
                    subColor="text-green-800"
                  />
                  <ResourceItem 
                    label="Enzymes" 
                    initialVal={globalState.resources.enzymes}
                    valRef={enzymesRef}
                    rate={rates.enzymes} 
                    color="text-orange-500" 
                    subColor="text-orange-900"
                  />
                  <ResourceItem 
                    label="DNA" 
                    initialVal={globalState.resources.dna}
                    valRef={dnaRef}
                    rate={rates.dna} 
                    color="text-blue-400" 
                    subColor="text-blue-900"
                  />
                   <ResourceItem 
                    label="Larva" 
                    initialVal={globalState.resources.larva}
                    valRef={larvaRef}
                    rate={rates.larva} 
                    color="text-pink-400" 
                    subColor="text-pink-900"
                  />
              </div>
          </div>

          <div className="flex items-center gap-8">
               {/* Population */}
               <div className="text-right">
                   <div className="text-[10px] text-gray-500 uppercase">Swarm Size</div>
                   <div ref={swarmRef} className="text-lg font-mono font-bold text-orange-400 leading-none">
                        {globalState.hive.unitStockpile[UnitType.MELEE] + globalState.hive.unitStockpile[UnitType.RANGED]} / {DataManager.instance.getMaxPopulationCap()}
                   </div>
               </div>
          </div>
      </div>

      {/* MAIN VIEW (The Hive Dashboard) */}
      <div className="flex-1 overflow-hidden relative">
          <HiveView 
              globalState={globalState}
              onUpgrade={handleUpgradeUnit}
              onConfigChange={handleProductionConfigChange}
              onDigest={handleDigest}
              
              // Invasion Tab Props
              gameState={gameState}
              activeRegion={activeRegion}
              mapRegions={mapRegions}
              onEnterRegion={handleEnterRegion}
              onEvacuate={handleEvacuate}
              onEngineInit={handleEngineInit}
          />
      </div>
    </div>
  );
};
export default App;