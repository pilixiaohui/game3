
import React from 'react';
import { DataManager } from '../../game/DataManager';

export const EvolutionPanel: React.FC = () => {
    const reward = DataManager.instance.getPrestigeReward();

    return (
    <div className="p-4 h-full overflow-y-auto bg-black/60 backdrop-blur-md border-t border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="mb-4 text-center">
            <h3 className="text-xl font-black text-yellow-500 uppercase tracking-widest mb-1">Evolution</h3>
            <p className="text-gray-500 text-[10px]">Adapt to conquer.</p>
        </div>

        <div className="space-y-4">
            {/* PRESTIGE BUTTON */}
            <div className="bg-gradient-to-r from-red-900/40 to-black border border-red-900/50 rounded-lg p-3 flex flex-col items-center text-center">
                    <div className="text-2xl mb-1">🪐</div>
                    <h2 className="text-sm font-bold text-white uppercase mb-1">Devour World</h2>
                    <p className="text-gray-500 text-[9px] mb-2">
                        Reset progress for Mutagen based on Lifetime DNA.
                    </p>
                    <div className="text-lg font-black text-yellow-500 font-mono mb-2">+{reward} Mutagen</div>
                    <button
                    onClick={() => { if (confirm("ARE YOU SURE? THIS WILL RESET YOUR PROGRESS.")) DataManager.instance.prestige(); }}
                    className={`w-full py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all ${reward > 0 ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                    disabled={reward <= 0}
                    >
                        PRESTIGE
                    </button>
            </div>
        </div>
    </div>
    );
};
