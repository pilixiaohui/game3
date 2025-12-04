
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

    // 1. Safe Initialization
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isMounted = true;
        let engineInstance: GameEngine | null = null;

        const initGame = async () => {
            // Clean up any potential lingering engine from double-fire
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }

            // Create Engine
            const newEngine = new GameEngine(isSimulationAuthority);
            engineInstance = newEngine;
            
            try {
                await newEngine.init(container);
                
                // Critical Check: If component unmounted during async init, destroy immediately
                if (!isMounted) {
                    newEngine.destroy();
                    return;
                }

                engineRef.current = newEngine;
                
                // Set initial state
                if (activeRegion) {
                    newEngine.activeRegionId = activeRegion.id;
                    newEngine.humanDifficultyMultiplier = activeRegion.difficultyMultiplier;
                }
                const initialMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
                newEngine.setMode(initialMode);
                
                onEngineInit(newEngine);

            } catch (err) {
                console.error("GameEngine init failed:", err);
                newEngine.destroy();
                engineRef.current = null;
            }
        };

        initGame();

        return () => {
            isMounted = false;
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
            // Also cleanup instance if it was created but not yet assigned to ref
            if (engineInstance && engineInstance !== engineRef.current) {
                engineInstance.destroy();
            }
            // DOM Cleanup
            if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
            }
        };
    }, []); // Run once on mount

    // 2. React to State Changes (Safe Updates)
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;

        // Update Region Data
        if (activeRegion) {
            engine.humanDifficultyMultiplier = activeRegion.difficultyMultiplier;
            // Only update activeRegionId if it changed to avoid reloading logic inside engine
            if (engine.activeRegionId !== activeRegion.id) {
                engine.activeRegionId = activeRegion.id;
            }
        }

        // Update Mode
        const targetMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
        engine.setMode(targetMode);

    }, [activeRegion, mode]);

    return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />;
});