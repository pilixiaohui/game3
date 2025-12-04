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

// GLOBAL MUTEX
let initializationQueue = Promise.resolve();

export const GameCanvas = forwardRef<HTMLDivElement, GameCanvasProps>(({ 
    activeRegion, isCombat = true, mode, onEngineInit, isSimulationAuthority = false 
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<GameEngine | null>(null);

    useImperativeHandle(ref, () => containerRef.current!);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isMounted = true;
        let engineInstance: GameEngine | null = null;

        const runSequence = async () => {
            await initializationQueue;
            if (!isMounted) return;

            let releaseLock: () => void;
            const newLock = new Promise<void>((resolve) => { releaseLock = resolve; });
            initializationQueue = initializationQueue.then(() => newLock);

            try {
                if (engineRef.current) { releaseLock!(); return; }

                while (container.firstChild) container.removeChild(container.firstChild);

                // 关键修改：给 Pixi v8 更多时间清理全局状态
                await new Promise(resolve => setTimeout(resolve, 50));
                
                if (!isMounted) return;

                const newEngine = new GameEngine(isSimulationAuthority);
                engineInstance = newEngine;

                await newEngine.init(container);

                if (!isMounted) {
                    newEngine.destroy();
                } else {
                    engineRef.current = newEngine;
                    onEngineInit(newEngine);
                    
                    if (activeRegion) {
                        newEngine.activeRegionId = activeRegion.id;
                        newEngine.humanDifficultyMultiplier = activeRegion.difficultyMultiplier;
                    }
                    const initialMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
                    newEngine.setMode(initialMode);
                }
            } catch (err) {
                console.error("GameEngine init failed:", err);
                // 安全清理
                try { engineInstance?.destroy(); } catch (e) {}
                engineRef.current = null;
            } finally {
                releaseLock!();
            }
        };

        runSequence();

        return () => {
            isMounted = false;
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
        };
    }, []); // Empty deps

    useEffect(() => {
        // ... React to props changes (activeRegion/mode) ...
        // 保持之前的逻辑不变
        const engine = engineRef.current;
        if (!engine) return;
        if (activeRegion && engine.activeRegionId !== activeRegion.id) {
             engine.activeRegionId = activeRegion.id;
        }
        const targetMode = mode ? mode : (activeRegion ? 'COMBAT_VIEW' : 'HIVE');
        engine.setMode(targetMode);
    }, [activeRegion, mode]);

    return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />;
});