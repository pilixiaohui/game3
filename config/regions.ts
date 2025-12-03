

import { RegionData, UnitType } from '../types';

export const INITIAL_REGIONS_CONFIG: RegionData[] = [
    // ---------------------------------------------------------
    // 第一阶段：外围废墟 (轻步兵)
    // ---------------------------------------------------------
    { 
        id: 1, name: "第7区贫民窟 (Slums)", 
        x: 5, y: 80, difficultyMultiplier: 1.0, totalStages: 100,
        levelConfig: { startLevel: 1, levelsPerStage: 1 },
        waveConfig: { baseCountMin: 3, baseCountMax: 6, spawnInterval: 4.0 },
        spawnTable: [
            { type: UnitType.HUMAN_MILITIA, weight: 60 },
            { type: UnitType.HUMAN_MARINE, weight: 30 },
            { type: UnitType.HUMAN_K9_UNIT, weight: 10 }
        ],
        isUnlocked: true, devourProgress: 0, isFighting: false
    },
    { 
        id: 2, name: "废弃工业区 (Industrial Ruins)", 
        x: 15, y: 65, difficultyMultiplier: 2.0, totalStages: 100,
        levelConfig: { startLevel: 20, levelsPerStage: 1.5 },
        waveConfig: { baseCountMin: 5, baseCountMax: 8, spawnInterval: 3.5 },
        spawnTable: [
            { type: UnitType.HUMAN_MARINE, weight: 40 },
            { type: UnitType.HUMAN_RIOT, weight: 20 },
            { type: UnitType.HUMAN_SCOUT, weight: 20 },
            { type: UnitType.HUMAN_ENGINEER, weight: 20 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    },

    // ---------------------------------------------------------
    // 第二阶段：城市与治安 (特种步兵)
    // ---------------------------------------------------------
    { 
        id: 3, name: "商业枢纽 (Commerce Hub)", 
        x: 25, y: 50, difficultyMultiplier: 5.0, totalStages: 100,
        levelConfig: { startLevel: 50, levelsPerStage: 2.0 },
        waveConfig: { baseCountMin: 6, baseCountMax: 10, spawnInterval: 3.0 },
        spawnTable: [
            { type: UnitType.HUMAN_RIOT, weight: 30 },
            { type: UnitType.HUMAN_SNIPER, weight: 20 },
            { type: UnitType.HUMAN_MEDIC, weight: 20 },
            { type: UnitType.HUMAN_PYRO, weight: 15 },
            { type: UnitType.HUMAN_RECON_DRONE, weight: 15 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    },
    { 
        id: 4, name: "行政特区 (Administrative Zone)", 
        x: 35, y: 40, difficultyMultiplier: 12.0, totalStages: 100,
        levelConfig: { startLevel: 100, levelsPerStage: 2.5 },
        waveConfig: { baseCountMin: 8, baseCountMax: 12, spawnInterval: 2.5 },
        spawnTable: [
            { type: UnitType.HUMAN_GRENADIER, weight: 25 },
            { type: UnitType.HUMAN_SHOCK_TROOPER, weight: 25 },
            { type: UnitType.HUMAN_CHEM_TROOPER, weight: 20 },
            { type: UnitType.HUMAN_BUNKER, weight: 10 },
            { type: UnitType.HUMAN_MARINE, weight: 20 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    },

    // ---------------------------------------------------------
    // 第三阶段：军事化区域 (轻载具)
    // ---------------------------------------------------------
    { 
        id: 5, name: "军事缓冲区 (Military Buffer)", 
        x: 45, y: 30, difficultyMultiplier: 30.0, totalStages: 100,
        levelConfig: { startLevel: 200, levelsPerStage: 3.0 },
        waveConfig: { baseCountMin: 10, baseCountMax: 15, spawnInterval: 2.0 },
        spawnTable: [
            { type: UnitType.HUMAN_ASSAULT_BIKE, weight: 30 },
            { type: UnitType.HUMAN_TECHNICAL, weight: 25 },
            { type: UnitType.HUMAN_ROCKET_TROOPER, weight: 25 },
            { type: UnitType.HUMAN_TURRET_MG, weight: 20 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    },
    { 
        id: 6, name: "机械化兵团驻地 (Mech Garrison)", 
        x: 55, y: 25, difficultyMultiplier: 80.0, totalStages: 100,
        levelConfig: { startLevel: 400, levelsPerStage: 4.0 },
        waveConfig: { baseCountMin: 12, baseCountMax: 18, spawnInterval: 1.5 },
        spawnTable: [
            { type: UnitType.HUMAN_APC, weight: 20 },
            { type: UnitType.HUMAN_VULTURE, weight: 25 },
            { type: UnitType.HUMAN_FLAME_TANK, weight: 15 },
            { type: UnitType.HUMAN_TESLA_TANK, weight: 15 },
            { type: UnitType.HUMAN_TURRET_CANNON, weight: 25 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    },

    // ---------------------------------------------------------
    // 第四阶段：重装甲防线 (重型载具)
    // ---------------------------------------------------------
    { 
        id: 7, name: "轨道电梯基座 (Orbital Base)", 
        x: 65, y: 35, difficultyMultiplier: 200.0, totalStages: 100,
        levelConfig: { startLevel: 800, levelsPerStage: 5.0 },
        waveConfig: { baseCountMin: 15, baseCountMax: 20, spawnInterval: 1.0 },
        spawnTable: [
            { type: UnitType.HUMAN_TANK, weight: 30 },
            { type: UnitType.HUMAN_SIEGE_TANK, weight: 20 },
            { type: UnitType.HUMAN_GOLIATH, weight: 25 },
            { type: UnitType.HUMAN_GHOST, weight: 10 },
            { type: UnitType.HUMAN_TURRET_MISSILE, weight: 15 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    },
    { 
        id: 8, name: "高能实验室 (High-Energy Lab)", 
        x: 75, y: 50, difficultyMultiplier: 500.0, totalStages: 100,
        levelConfig: { startLevel: 1500, levelsPerStage: 6.0 },
        waveConfig: { baseCountMin: 18, baseCountMax: 25, spawnInterval: 0.8 },
        spawnTable: [
            { type: UnitType.HUMAN_RAILGUN_MECH, weight: 20 },
            { type: UnitType.HUMAN_CRYO_TROOPER, weight: 20 },
            { type: UnitType.HUMAN_TITAN_WALKER, weight: 5 },
            { type: UnitType.HUMAN_TESLA_COIL, weight: 25 },
            { type: UnitType.HUMAN_TURRET_LASER, weight: 30 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    },

    // ---------------------------------------------------------
    // 第五阶段：决战 (空军与超级武器)
    // ---------------------------------------------------------
    { 
        id: 9, name: "平流层空港 (Stratosphere Airfield)", 
        x: 85, y: 65, difficultyMultiplier: 1500.0, totalStages: 100,
        levelConfig: { startLevel: 3000, levelsPerStage: 8.0 },
        waveConfig: { baseCountMin: 20, baseCountMax: 30, spawnInterval: 0.6 },
        spawnTable: [
            { type: UnitType.HUMAN_HELICOPTER, weight: 30 },
            { type: UnitType.HUMAN_FIGHTER_JET, weight: 25 },
            { type: UnitType.HUMAN_GUNSHIP, weight: 20 },
            { type: UnitType.HUMAN_BOMBER, weight: 10 },
            { type: UnitType.HUMAN_TURRET_MISSILE, weight: 15 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    },
    { 
        id: 10, name: "人类最后堡垒 (The Last Bastion)", 
        x: 95, y: 80, difficultyMultiplier: 5000.0, totalStages: 100,
        levelConfig: { startLevel: 5000, levelsPerStage: 10.0 },
        waveConfig: { baseCountMin: 25, baseCountMax: 40, spawnInterval: 0.5 },
        spawnTable: [
            { type: UnitType.HUMAN_BATTLECRUISER, weight: 15 },
            { type: UnitType.HUMAN_TITAN_WALKER, weight: 15 },
            { type: UnitType.HUMAN_SIEGE_TANK, weight: 20 },
            { type: UnitType.HUMAN_GOLIATH, weight: 20 },
            { type: UnitType.HUMAN_BUNKER, weight: 30 }
        ],
        isUnlocked: false, devourProgress: 0, isFighting: false
    }
];