

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { RegionData } from '../types';

interface GameCanvasProps {
    activeRegion: RegionData | null;
    isCombat?: boolean;
    mode?: 'COMBAT_VIEW' | 'HARVEST_VIEW' | 'HIVE';
    onEngineInit: (engine: GameEngine) => void;
    isSimulationAuthority?: boolean;
}

export const GameCanvas = forwardRef<HTMLDivElement, GameCanvasProps>(({ 
    activeRegion, isCombat = true, mode, onEngineInit, isSimulationAuthority = false 
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<GameEngine | null>(null);

    useImperativeHandle(ref, () => containerRef.current!);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let canceled = false;
        let engine: GameEngine | undefined;

        const initGame = async () => {
            // Clean up previous children
            while (container.firstChild) container.removeChild(container.firstChild);

            // Pass authority flag here
            engine = new GameEngine(isSimulationAuthority);
            
            try {
                // Configure Engine
                if (activeRegion) {
                    engine.humanDifficultyMultiplier = activeRegion.difficultyMultiplier;
                    engine.activeRegionId = activeRegion.id;
                }
                
                // Set Mode
                const targetMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
                engine.setMode(targetMode);
                
                await engine.init(container);
                
                if (canceled) {
                    engine.destroy();
                    return;
                }
                
                if (engineRef.current && engineRef.current !== engine) {
                    engineRef.current.destroy();
                }

                engineRef.current = engine;
                onEngineInit(engine);
            } catch (err) {
                console.error("GameEngine init failed:", err);
                if (engine) engine.destroy();
            }
        };

        initGame();

        return () => {
            canceled = true;
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
            if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
            }
        };
    }, [onEngineInit, activeRegion, mode, isSimulationAuthority]); 

    return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />;
});
