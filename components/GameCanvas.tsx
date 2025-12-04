
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

    // 1. One-time Initialization
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let engineInstance: GameEngine | null = null;
        let isMounted = true; // 🔒 Guard variable

        const initGame = async () => {
            // Cleanup any existing children first
            while (container.firstChild) container.removeChild(container.firstChild);

            // Create Engine
            const engine = new GameEngine(isSimulationAuthority);
            engineInstance = engine;
            
            try {
                // Async Init
                await engine.init(container);
                
                // If unmounted during await, destroy immediately and bail
                if (!isMounted) {
                    console.log("GameCanvas: Unmounted during init, destroying engine");
                    engine.destroy();
                    return;
                }

                // Success
                engineRef.current = engine;
                onEngineInit(engine);
                
                // Set initial state
                if (activeRegion) {
                    engine.activeRegionId = activeRegion.id;
                    engine.humanDifficultyMultiplier = activeRegion.difficultyMultiplier;
                }
                const initialMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
                engine.setMode(initialMode);

            } catch (err) {
                console.error("GameEngine init failed:", err);
                if (isMounted) {
                    engine.destroy();
                    engineRef.current = null;
                }
            }
        };

        initGame();

        return () => {
            isMounted = false;
            // Destroy the specific instance created in this effect
            if (engineInstance) {
                engineInstance.destroy();
                engineInstance = null;
            }
            engineRef.current = null;
            
            // Clean DOM
            if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
            }
        };
    }, []); // Run once on mount

    // 2. React to State Changes
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;

        // Update Region Data
        if (activeRegion) {
            engine.humanDifficultyMultiplier = activeRegion.difficultyMultiplier;
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
