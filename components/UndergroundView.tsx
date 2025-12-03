
import React from 'react';
import { GameCanvas } from './GameCanvas';
import { GameEngine } from '../game/GameEngine';

interface UndergroundViewProps {
    onEngineInit: (engine: GameEngine) => void;
    children: React.ReactNode; // Overlay Panels
}

export const UndergroundView: React.FC<UndergroundViewProps> = ({ onEngineInit, children }) => {
    return (
        <div className="h-full relative bg-[#080808] border-t border-gray-800 overflow-hidden">
             {/* Persistent Hive Visuals */}
             <div className="absolute inset-0 z-0">
                  <GameCanvas 
                      activeRegion={null}
                      mode="HIVE"
                      onEngineInit={onEngineInit}
                      isSimulationAuthority={true}
                  />
                  {/* Atmospheric Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-transparent to-black/90 pointer-events-none" />
             </div>

             {/* UI Layer Overlay */}
             <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
                  {/* Content Area (Panels) */}
                  <div className="flex-1 overflow-hidden pointer-events-none">
                      <div className="w-full h-full max-w-xl mx-auto pointer-events-auto shadow-2xl">
                           {children}
                      </div>
                  </div>
             </div>
        </div>
    );
};
