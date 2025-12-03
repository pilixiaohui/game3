
import { ChunkTemplate } from '../types';

export const TERRAIN_CHUNKS: Record<string, ChunkTemplate[]> = {
    'DEFAULT': [
        {
            id: 'open_field',
            width: 1200,
            obstacles: [],
            spawnPoints: [
                { x: 600, y: 50, type: 'HUMAN_MARINE' },
                { x: 800, y: 150, type: 'HUMAN_MILITIA' }
            ]
        },
        {
            id: 'checkpoint_gate',
            width: 1200,
            obstacles: [
                { type: 'WALL', x: 800, y: 0, width: 30, height: 250, health: 5000, maxHealth: 5000 }, // Top Wall (Blocks y < 0)
                { type: 'WALL', x: 800, y: 350, width: 30, height: 250, health: 5000, maxHealth: 5000 }, // Bottom Wall (Blocks y > 100)
                { type: 'ROCK', x: 400, y: 100, width: 60, height: 60 }
            ],
            spawnPoints: [
                { x: 850, y: 180, type: 'HUMAN_TURRET_MG' },
                { x: 850, y: 300, type: 'HUMAN_BUNKER' }
            ]
        },
        {
            id: 'fortified_wall',
            width: 1200,
            obstacles: [
                { type: 'WALL', x: 600, y: 150, width: 40, height: 800, health: 12000, maxHealth: 12000 }, // Full Block
            ],
            spawnPoints: [
                { x: 650, y: 50, type: 'HUMAN_TURRET_CANNON' }, 
                { x: 650, y: 450, type: 'HUMAN_TURRET_MISSILE' }
            ]
        },
        {
            id: 'rubble_maze',
            width: 1200,
            obstacles: [
                { type: 'ROCK', x: 300, y: -50, width: 40, height: 40 },
                { type: 'ROCK', x: 500, y: 50, width: 50, height: 50 },
                { type: 'ROCK', x: 900, y: 0, width: 80, height: 80 },
                { type: 'WALL', x: 1100, y: 0, width: 30, height: 400, health: 3000, maxHealth: 3000 }
            ],
            spawnPoints: [{ x: 1000, y: 0, type: 'HUMAN_RIOT' }, { x: 1050, y: 100, type: 'HUMAN_RIOT' }]
        }
    ]
};
