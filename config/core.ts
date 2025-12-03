

import { UnitType, ElementType } from '../types';

export const SCREEN_PADDING = 100;
export const LANE_Y = 0; 
export const FLOOR_Y = 100;
export const LANE_HEIGHT = 180; 
export const DECAY_TIME = 2.0; 
export const COLLISION_BUFFER = 10;
export const MILESTONE_DISTANCE = 1500;

export const STAGE_WIDTH = 1200;
export const STAGE_TRANSITION_COOLDOWN = 2.0;

export const MAX_RESOURCES_BASE = 2000000; 
export const INITIAL_LARVA_CAP = 1000;
export const RESOURCE_TICK_RATE_BASE = 15; 
export const UNIT_UPGRADE_COST_BASE = 100;
export const RECYCLE_REFUND_RATE = 0.8; 

export const CLICK_CONFIG = {
    BASE: 10.0,
    SCALING: 0.05
};

export const UNIT_SCREEN_CAPS: Partial<Record<UnitType, number>> = {
    [UnitType.MELEE]: 50,      
    [UnitType.RANGED]: 30,     
    [UnitType.PYROVORE]: 15,   
    [UnitType.CRYOLISK]: 15,   
    [UnitType.OMEGALIS]: 5,    
    [UnitType.QUEEN]: 5,
    
    // Tier 1
    [UnitType.ZERGLING_RAPTOR]: 60,
    [UnitType.EMBER_MITE]: 60,
    [UnitType.SPARK_FLY]: 40,
    [UnitType.FROST_WEEVIL]: 40,
    [UnitType.ACID_MAGGOT]: 50,
    [UnitType.BONE_BLADE]: 60,
    [UnitType.ACID_SPITTER]: 50,
    [UnitType.STATIC_ORB]: 40,
    [UnitType.CINDER_LING]: 60,
    [UnitType.FROST_SHARD]: 40,

    // Tier 2
    [UnitType.LIGHTNING_SKINK]: 20,
    [UnitType.SPINE_HURLER]: 25,
    [UnitType.MAGMA_GOLEM]: 10,
    [UnitType.PLAGUE_BEARER]: 15,
    [UnitType.SIEGE_BEETLE]: 15,
    [UnitType.FROST_WARD]: 10,
    [UnitType.MAGMA_SPRAYER]: 20,
    [UnitType.SHOCK_ROACH]: 20,
    [UnitType.VILE_CRAWLER]: 15,

    // Tier 3
    [UnitType.WINTER_WITCH]: 8,
    [UnitType.PULSE_BEAST]: 8,
    [UnitType.CORRUPTOR]: 8,
    [UnitType.PHANTOM_ASSASSIN]: 8,
    [UnitType.INFERNO_JUDGE]: 6,
    [UnitType.CRYSTAL_WEAVER]: 6,

    // Tier 4
    [UnitType.TYRANT_REX]: 3,
    [UnitType.TEMPEST_LEVIATHAN]: 2,
    [UnitType.STAR_EATER]: 2,
    [UnitType.ETERNAL_GLACIER]: 2,
    [UnitType.STORM_BRINGER]: 2,
    [UnitType.ABYSSAL_MAW]: 2,
    [UnitType.PESTILENCE_LORD]: 2,

    // Human Infantry
    [UnitType.HUMAN_MARINE]: 30,
    [UnitType.HUMAN_MILITIA]: 40,
    [UnitType.HUMAN_K9_UNIT]: 20,
    [UnitType.HUMAN_SCOUT]: 20,
    [UnitType.HUMAN_MEDIC]: 10,
    [UnitType.HUMAN_ENGINEER]: 10,
    [UnitType.HUMAN_RIOT]: 15,
    [UnitType.HUMAN_RECON_DRONE]: 20,

    // Human Special
    [UnitType.HUMAN_PYRO]: 10,
    [UnitType.HUMAN_GRENADIER]: 15,
    [UnitType.HUMAN_SHOCK_TROOPER]: 15,
    [UnitType.HUMAN_SNIPER]: 10,
    [UnitType.HUMAN_CRYO_TROOPER]: 15,
    [UnitType.HUMAN_CHEM_TROOPER]: 15,
    [UnitType.HUMAN_ROCKET_TROOPER]: 15,
    [UnitType.HUMAN_GHOST]: 5,

    // Human Vehicles
    [UnitType.HUMAN_ASSAULT_BIKE]: 10,
    [UnitType.HUMAN_TECHNICAL]: 10,
    [UnitType.HUMAN_APC]: 5,
    [UnitType.HUMAN_VULTURE]: 10,
    [UnitType.HUMAN_FLAME_TANK]: 5,
    [UnitType.HUMAN_TESLA_TANK]: 5,

    // Human Heavy
    [UnitType.HUMAN_TANK]: 5,
    [UnitType.HUMAN_SIEGE_TANK]: 5,
    [UnitType.HUMAN_GOLIATH]: 8,
    [UnitType.HUMAN_RAILGUN_MECH]: 5,
    [UnitType.HUMAN_TITAN_WALKER]: 1,
    
    // Human Air
    [UnitType.HUMAN_HELICOPTER]: 10,
    [UnitType.HUMAN_FIGHTER_JET]: 10,
    [UnitType.HUMAN_BOMBER]: 3,
    [UnitType.HUMAN_GUNSHIP]: 3,
    [UnitType.HUMAN_BATTLECRUISER]: 1,

    // Human Static
    [UnitType.HUMAN_BUNKER]: 5,
    [UnitType.HUMAN_TURRET_MG]: 10,
    [UnitType.HUMAN_TURRET_CANNON]: 10,
    [UnitType.HUMAN_TURRET_MISSILE]: 10,
    [UnitType.HUMAN_TURRET_LASER]: 5,
    [UnitType.HUMAN_TESLA_COIL]: 5,
};

export const CAP_UPGRADE_BASE = 50;
export const EFFICIENCY_UPGRADE_BASE = 100;
export const QUEEN_UPGRADE_BASE = 200;

export const STATUS_CONFIG = {
    MAX_STACKS: 100,
    DECAY_RATE: 15,
    THRESHOLD_BURNING: 100,
    THRESHOLD_FROZEN: 100,
    THRESHOLD_SHOCK: 50,
    DOT_INTERVAL: 0.5,
    ARMOR_BREAK_DURATION: 999,
    REACTION_THRESHOLD_MINOR: 50,
    REACTION_THRESHOLD_MAJOR: 80,
};

export const STRONGHOLDS = [400, 900, 1400];

export const OBSTACLES = [
    { x: 250, y: 0, radius: 35 },     
    { x: 600, y: -40, radius: 30 },   
    { x: 600, y: 40, radius: 30 },    
    { x: 1100, y: 0, radius: 50 },    
];

export const ELEMENT_COLORS: Record<ElementType, number> = {
    PHYSICAL: 0xffffff,
    TOXIN: 0x4ade80,   // Green
    THERMAL: 0xf87171, // Red/Orange
    CRYO: 0x60a5fa,    // Blue
    VOLTAIC: 0xfacc15  // Yellow
};
