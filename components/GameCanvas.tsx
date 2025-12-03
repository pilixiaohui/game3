
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

        let engine: GameEngine | undefined;

        const initGame = async () => {
             // Clean up previous children
            while (container.firstChild) container.removeChild(container.firstChild);

            // Create Engine
            engine = new GameEngine(isSimulationAuthority);
            engineRef.current = engine;
            
            try {
                await engine.init(container);
                onEngineInit(engine);
                
                // Trigger initial update manually once to ensure state is synced
                if (activeRegion) engine.activeRegionId = activeRegion.id;
                const targetMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
                engine.setMode(targetMode);

            } catch (err) {
                console.error("GameEngine init failed:", err);
                engine.destroy();
            }
        };

        initGame();

        return () => {
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
             if (container) {
                while (container.firstChild) container.removeChild(container.firstChild);
            }
        };
    }, []); // Empty dependency array: Run once

    // 2. React to State Changes
    useEffect(() => {
        const engine = engineRef.current;
        if (!engine) return;

        // Update Region
        if (activeRegion) {
            engine.humanDifficultyMultiplier = activeRegion.difficultyMultiplier;
            engine.activeRegionId = activeRegion.id;
        }

        // Update Mode
        const targetMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
        engine.setMode(targetMode);

    }, [activeRegion, mode]); // Run whenever props change

    return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />;
});
