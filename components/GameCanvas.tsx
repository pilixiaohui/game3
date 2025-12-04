
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

// GLOBAL MUTEX: Prevents parallel PixiJS initializations in Strict Mode
let initializationQueue = Promise.resolve();

export const GameCanvas = forwardRef<HTMLDivElement, GameCanvasProps>(({ 
    activeRegion, isCombat = true, mode, onEngineInit, isSimulationAuthority = false 
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<GameEngine | null>(null);

    useImperativeHandle(ref, () => containerRef.current!);

    // 1. Lifecycle Management
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isMounted = true;
        let engineInstance: GameEngine | null = null;

        const runSequence = async () => {
            // Wait for any previous init/destroy cycles to finish completely
            await initializationQueue;

            // If component was unmounted while waiting in queue, abort
            if (!isMounted) return;

            // Start new critical section
            let releaseLock: () => void;
            const newLock = new Promise<void>((resolve) => { releaseLock = resolve; });
            // Chain this new lock to the global queue immediately
            initializationQueue = initializationQueue.then(() => newLock);

            try {
                // Double check references to avoid duplicates
                if (engineRef.current) {
                    releaseLock!();
                    return;
                }

                // 1. Cleanup DOM
                while (container.firstChild) container.removeChild(container.firstChild);

                // --- HOTFIX: Tiny delay to allow Pixi GC ---
                await new Promise(resolve => setTimeout(resolve, 10));

                // 2. Create & Init
                const newEngine = new GameEngine(isSimulationAuthority);
                engineInstance = newEngine; // Local ref for cleanup

                await newEngine.init(container);

                // 3. Post-Init Check
                if (!isMounted) {
                    // Component unmounted during init -> Destroy immediately
                    newEngine.destroy();
                } else {
                    // Success -> Bind
                    engineRef.current = newEngine;
                    onEngineInit(newEngine);

                    // Apply Initial State
                    if (activeRegion) {
                        newEngine.activeRegionId = activeRegion.id;
                        newEngine.humanDifficultyMultiplier = activeRegion.difficultyMultiplier;
                    }
                    const initialMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
                    newEngine.setMode(initialMode);
                }
            } catch (err) {
                console.error("GameEngine init failed:", err);
                // Safe cleanup on error
                try { 
                    engineInstance?.destroy(); 
                } catch (e) { /* ignore cleanup error */ }
                engineRef.current = null;
            } finally {
                // Always release lock
                releaseLock!();
            }
        };

        runSequence();

        // Cleanup
        return () => {
            isMounted = false;
            // Only destroy if the engine was fully assigned to the ref.
            // If it's still initializing (engineInstance exists but ref doesn't),
            // the 'if (!isMounted)' check inside runSequence will handle the destroy safely.
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
        };
    }, []); // Empty dependency array: Run once

    // 2. React to State Changes
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

    }, [activeRegion, mode]); // Run whenever props change

    return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />;
});
