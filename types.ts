

export enum Faction {
  ZERG = 'ZERG',
  HUMAN = 'HUMAN',
}

export enum UnitType {
  // --- ORIGINAL ---
  MELEE = 'MELEE',
  RANGED = 'RANGED',
  QUEEN = 'QUEEN',
  PYROVORE = 'PYROVORE', 
  CRYOLISK = 'CRYOLISK', 
  OMEGALIS = 'OMEGALIS', 
  
  // --- TIER 1: SWARM ---
  ZERGLING_RAPTOR = 'ZERGLING_RAPTOR',
  EMBER_MITE = 'EMBER_MITE',
  SPARK_FLY = 'SPARK_FLY',
  FROST_WEEVIL = 'FROST_WEEVIL',
  ACID_MAGGOT = 'ACID_MAGGOT',
  
  // New T1
  BONE_BLADE = 'BONE_BLADE',
  ACID_SPITTER = 'ACID_SPITTER',
  STATIC_ORB = 'STATIC_ORB',
  CINDER_LING = 'CINDER_LING',
  FROST_SHARD = 'FROST_SHARD',

  // --- TIER 2: SPECIALIST ---
  LIGHTNING_SKINK = 'LIGHTNING_SKINK',
  SPINE_HURLER = 'SPINE_HURLER',
  MAGMA_GOLEM = 'MAGMA_GOLEM',
  PLAGUE_BEARER = 'PLAGUE_BEARER',

  // New T2
  SIEGE_BEETLE = 'SIEGE_BEETLE',
  FROST_WARD = 'FROST_WARD',
  MAGMA_SPRAYER = 'MAGMA_SPRAYER',
  SHOCK_ROACH = 'SHOCK_ROACH',
  VILE_CRAWLER = 'VILE_CRAWLER',

  // --- TIER 3: ELITE ---
  WINTER_WITCH = 'WINTER_WITCH',

  // New T3
  PULSE_BEAST = 'PULSE_BEAST',
  CORRUPTOR = 'CORRUPTOR',
  PHANTOM_ASSASSIN = 'PHANTOM_ASSASSIN',
  INFERNO_JUDGE = 'INFERNO_JUDGE',
  CRYSTAL_WEAVER = 'CRYSTAL_WEAVER',

  // --- TIER 4: TITAN ---
  TYRANT_REX = 'TYRANT_REX',
  TEMPEST_LEVIATHAN = 'TEMPEST_LEVIATHAN',

  // New T4
  STAR_EATER = 'STAR_EATER',
  ETERNAL_GLACIER = 'ETERNAL_GLACIER',
  STORM_BRINGER = 'STORM_BRINGER',
  ABYSSAL_MAW = 'ABYSSAL_MAW',
  PESTILENCE_LORD = 'PESTILENCE_LORD',

  // --- HUMAN TIER 1: INFANTRY & SECURITY (轻步兵) ---
  HUMAN_MARINE = 'HUMAN_MARINE',         // [Existing] 基础步枪兵
  HUMAN_MILITIA = 'HUMAN_MILITIA',       // 民兵 (炮灰)
  HUMAN_K9_UNIT = 'HUMAN_K9_UNIT',       // 军犬 (快速近战)
  HUMAN_SCOUT = 'HUMAN_SCOUT',           // 侦察兵 (高移速)
  HUMAN_MEDIC = 'HUMAN_MEDIC',           // 战地医生 (治疗光环)
  HUMAN_ENGINEER = 'HUMAN_ENGINEER',     // 工程师 (亡语造塔)
  HUMAN_RIOT = 'HUMAN_RIOT',             // [Existing] 防暴盾卫 (物理肉盾)
  HUMAN_RECON_DRONE = 'HUMAN_RECON_DRONE', // 侦查无人机 (飞行)

  // --- HUMAN TIER 2: SPECIAL FORCES (特种兵) ---
  HUMAN_PYRO = 'HUMAN_PYRO',             // [Existing] 火焰兵 (AOE)
  HUMAN_SNIPER = 'HUMAN_SNIPER',         // [Existing] 狙击手 (斩杀)
  HUMAN_GRENADIER = 'HUMAN_GRENADIER',   // 掷弹兵 (曲射AOE)
  HUMAN_SHOCK_TROOPER = 'HUMAN_SHOCK_TROOPER', // 磁暴步兵 (连锁闪电)
  HUMAN_CRYO_TROOPER = 'HUMAN_CRYO_TROOPER',   // 冷冻兵 (减速)
  HUMAN_CHEM_TROOPER = 'HUMAN_CHEM_TROOPER',   // 化学兵 (毒素)
  HUMAN_ROCKET_TROOPER = 'HUMAN_ROCKET_TROOPER', // 火箭兵 (破甲)
  HUMAN_GHOST = 'HUMAN_GHOST',           // 幽灵特工 (隐形/核弹引导)

  // --- HUMAN TIER 3: LIGHT VEHICLES (轻载具) ---
  HUMAN_ASSAULT_BIKE = 'HUMAN_ASSAULT_BIKE', // 突击摩托 (游击)
  HUMAN_TECHNICAL = 'HUMAN_TECHNICAL',       // 武装皮卡 (机枪)
  HUMAN_APC = 'HUMAN_APC',               // 装甲运兵车 (亡语出兵)
  HUMAN_VULTURE = 'HUMAN_VULTURE',       // 秃鹫战车 (地雷)
  HUMAN_FLAME_TANK = 'HUMAN_FLAME_TANK', // 喷火坦克
  HUMAN_TESLA_TANK = 'HUMAN_TESLA_TANK', // 磁暴坦克

  // --- HUMAN TIER 4: HEAVY ARMOR (重装甲) ---
  HUMAN_TANK = 'HUMAN_TANK',             // [Existing] 主战坦克
  HUMAN_SIEGE_TANK = 'HUMAN_SIEGE_TANK', // 攻城坦克 (超远AOE)
  HUMAN_GOLIATH = 'HUMAN_GOLIATH',       // 歌利亚机甲 (对空/对地)
  HUMAN_RAILGUN_MECH = 'HUMAN_RAILGUN_MECH', // 磁轨炮机甲 (穿透)
  HUMAN_TITAN_WALKER = 'HUMAN_TITAN_WALKER', // 泰坦行进者 (Boss级)
  
  // --- HUMAN TIER 5: AIRFORCE (空军) ---
  HUMAN_HELICOPTER = 'HUMAN_HELICOPTER', // 武装直升机
  HUMAN_FIGHTER_JET = 'HUMAN_FIGHTER_JET', // 喷气战机 (极快)
  HUMAN_BOMBER = 'HUMAN_BOMBER',         // 轰炸机 (地毯式轰炸)
  HUMAN_GUNSHIP = 'HUMAN_GUNSHIP',       // 炮艇机 (盘旋输出)
  HUMAN_BATTLECRUISER = 'HUMAN_BATTLECRUISER', // 战列巡洋舰 (激光)

  // --- HUMAN STATIC DEFENSE (防御塔 - Speed 0) ---
  HUMAN_BUNKER = 'HUMAN_BUNKER',         // 碉堡 (高血量)
  HUMAN_TURRET_MG = 'HUMAN_TURRET_MG',   // 机枪塔
  HUMAN_TURRET_CANNON = 'HUMAN_TURRET_CANNON', // 加农炮塔
  HUMAN_TURRET_MISSILE = 'HUMAN_TURRET_MISSILE', // 导弹塔 (对空/热能)
  HUMAN_TURRET_LASER = 'HUMAN_TURRET_LASER',   // 激光塔 (单体高伤)
  HUMAN_TESLA_COIL = 'HUMAN_TESLA_COIL',       // 磁暴线圈 (防御塔)
}

export enum HiveSection {
  INVASION = 'INVASION',
  EVOLUTION = 'EVOLUTION',
  GRAFTING = 'GRAFTING',
  SEQUENCE = 'SEQUENCE',
  METABOLISM = 'METABOLISM',
  BIRTHING = 'BIRTHING',
  GLANDULAR = 'GLANDULAR',
  PLAGUE = 'PLAGUE',
}

export type TopViewMode = 'WORLD_MAP' | 'COMBAT_VIEW' | 'HARVEST_VIEW';

export type ElementType = 'PHYSICAL' | 'THERMAL' | 'CRYO' | 'VOLTAIC' | 'TOXIN';

export type StatusType = 
    | 'BURNING'      
    | 'FROZEN'       
    | 'SHOCKED'      
    | 'POISONED'     
    | 'ARMOR_BROKEN' 
    | 'STUNNED'
    | 'FRENZY'       
    | 'SLOWED';

export interface StatusEffect {
    type: StatusType;
    stacks: number;      
    duration: number;    
    decayAccumulator?: number; 
    sourceId?: number;
}

export type Polarity = 'ATTACK' | 'DEFENSE' | 'FUNCTION' | 'UNIVERSAL';

export interface GeneConfig {
    id: string;
    params?: Record<string, any>;
}

export type VisualShapeType = 'CIRCLE' | 'RECT' | 'ROUNDED_RECT' | 'MODEL_QUEEN';

export interface VisualShapeDef {
    type: VisualShapeType;
    color?: number;     
    colorDarken?: number; 
    widthPct?: number;  
    heightPct?: number; 
    radiusPct?: number; 
    xOffPct?: number;   
    yOffPct?: number;   
    cornerRadius?: number;
    rotation?: number; 
}

export interface UnitVisualConfig {
    shadowScale?: number;
    shapes: VisualShapeDef[];
}

export interface UnitConfig {
    id: UnitType;
    name: string;
    baseStats: {
        hp: number;
        damage: number;
        range: number;
        speed: number;
        attackSpeed: number;
        width: number;
        height: number;
        color: number;
        armor: number;
    };
    baseCost: {
        biomass: number;
        larva: number;
        dna: number;
        time: number;
    };
    growthFactors: {
        hp: number;
        damage: number;
    };
    slots: {
        polarity: Polarity;
    }[];
    baseLoadCapacity: number;
    elementConfig?: {
        type: ElementType;
        statusPerHit?: number;
    };
    genes?: GeneConfig[];
    visual?: UnitVisualConfig;
    tags?: string[];
}

export interface PluginStatModifier {
    stat: 'hp' | 'damage' | 'speed' | 'attackSpeed' | 'critChance' | 'critDamage' | 'elementalDmg';
    value: number; 
    isFlat?: boolean; 
    element?: ElementType;
}

export interface BioPluginConfig {
    id: string;
    name: string;
    description: string;
    polarity: Polarity;
    baseCost: number; 
    costPerRank: number;
    maxRank: number;
    rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
    stats: PluginStatModifier[];
    statGrowth: number; 
}

export interface Resources {
    biomass: number;
    enzymes: number; 
    larva: number;    
    dna: number;     
    mutagen: number;
}

export interface PluginInstance {
    instanceId: string;
    templateId: string;
    rank: number;
}

export interface UnitState {
    id: UnitType;
    level: number;
    loadout: (string | null)[];
    cap: number;
    capLevel: number;
    efficiencyLevel: number;
    isProducing: boolean;
    productionProgress: number;
}

export interface HiveState {
    unlockedUnits: Record<UnitType, UnitState>; 
    unitStockpile: Record<UnitType, number>;
    production: {
        larvaCapBase: number;      
        queenIntervalLevel: number;
        queenAmountLevel: number; 
        queenTimer: number;
    };
    metabolism: {
        villiCount: number;
        taprootCount: number;
        geyserCount: number;
        breakerCount: number;
        fermentingSacCount: number;
        refluxPumpCount: number;
        thermalCrackerCount: number;
        fleshBoilerCount: number;
        crackerHeat: number; 
        crackerOverheated: boolean;
        necroSiphonCount?: number;
        bloodFusionCount?: number;
        combatCortexCount?: number;
        redTideCount?: number;
        synapticResonatorCount?: number;
        geneArchiveCount?: number;
        gaiaDigesterCount?: number;
        entropyVentCount?: number;
        omegaPointCount?: number;
        thoughtSpireCount: number;
        hiveMindCount: number;
        akashicRecorderCount: number;
        spireAccumulator: number;
        storageCount: number;
        supplyCount: number;
    };
    inventory: {
        consumables: Record<string, number>;
        plugins: PluginInstance[];
    };
    globalBuffs: string[];
}

export interface RegionState {
    id: number;
    isUnlocked: boolean;
    devourProgress: number; 
}

export interface WorldState {
    currentRegionId: number;
    regions: Record<number, RegionState>;
}

export interface PlayerProfile {
    lastSaveTime: number;
    prestigeLevel: number;
    totalKills?: number;
    lifetimeDna?: number;
    mutationUpgrades?: {
        metabolicSurge: number;
        larvaFission: number;
        geneticMemory: boolean;
    };
    settings: {
        bgmVolume: number;
        sfxVolume: number;
    };
}

export interface GameSaveData {
    resources: Resources;
    hive: HiveState;
    world: WorldState;
    player: PlayerProfile;
}

export interface UnitRuntimeStats {
    hp: number;
    maxHp: number;
    damage: number;
    range: number;
    speed: number;
    attackSpeed: number;
    width: number;
    height: number;
    color: number;
    armor: number; 
    critChance: number;
    critDamage: number;
    element: ElementType;
}

export interface RoguelikeCard {
    id: string;
    name: string;
    description: string;
    rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
    apply: (mods: GameModifiers) => void;
}

export interface GameModifiers {
    damageMultiplier: number;
    maxHpMultiplier: number;
    resourceRateMultiplier: number;
    explodeOnDeath: boolean;
    doubleSpawnChance: number;
}

export interface GameStateSnapshot {
    resources: number; 
    distance: number;
    unitCountZerg: number;
    unitCountHuman: number;
    stockpileMelee: number;
    stockpileRanged: number;
    stockpileTotal: number;
    populationCap: number; 
    activeZergCounts: Record<string, number>;
    isPaused: boolean;
}

export interface EnemySpawnConfig {
    type: UnitType;
    weight: number; 
}

export interface RegionData {
  id: number;
  name: string;
  x: number; 
  y: number; 
  difficultyMultiplier: number;
  totalStages: number;
  spawnTable?: EnemySpawnConfig[]; 
  
  levelConfig?: {
      startLevel: number;
      levelsPerStage: number;
  };
  waveConfig?: {
      baseCountMin: number;
      baseCountMax: number;
      spawnInterval?: number;
  };
  
  devourProgress: number;
  isUnlocked: boolean;
  isFighting: boolean;
}

export interface ObstacleDef {
    type: 'WALL' | 'ROCK' | 'WATER';
    x: number; y: number; width: number; height: number;
    health?: number;
    maxHealth?: number;
}

export interface ChunkTemplate {
    id: string;
    width: number;
    obstacles: ObstacleDef[];
    spawnPoints: { x: number, y: number, type: string }[];
}

export interface IGameEngine {
    spatialHash: {
        query: (x: number, y: number, radius: number, out: IUnit[]) => number;
    };
    _sharedQueryBuffer: IUnit[]; 
    activeObstacles: ObstacleDef[];
    
    setMode(mode: 'COMBAT_VIEW' | 'HARVEST_VIEW' | 'HIVE', params?: any): void;

    createExplosion: (x: number, y: number, radius: number, color?: number) => void;
    createFlash: (x: number, y: number, color: number) => void;
    createProjectile: (x1: number, y1: number, x2: number, y2: number, color: number) => void;
    createFloatingText: (x: number, y: number, text: string, color: number, fontSize?: number) => void;
    createDamagePop: (x: number, y: number, value: number, element: string) => void;
    
    createSlash: (x: number, y: number, targetX: number, targetY: number, color: number) => void;
    createShockwave: (x: number, y: number, radius: number, color: number) => void;
    createParticles: (x: number, y: number, color: number, count: number) => void;
    createHealEffect: (x: number, y: number) => void;
    
    dealTrueDamage: (target: IUnit, amount: number) => void;
    killUnit: (u: IUnit) => void;
    applyStatus: (target: IUnit, type: StatusType, stacks: number, duration: number) => void;
    processDamagePipeline: (source: IUnit, target: IUnit) => void;
    performAttack: (source: IUnit, target: IUnit) => void;
    
    spawnUnit: (faction: Faction, type: UnitType, x: number) => IUnit | null;
}

export interface GeneTrait {
    id: string;
    name: string;
    onTick?: (self: IUnit, dt: number, engine: IGameEngine, params: any) => void;
    onMove?: (self: IUnit, velocity: {x:number, y:number}, dt: number, engine: IGameEngine, params: any) => void; 
    onUpdateTarget?: (self: IUnit, dt: number, engine: IGameEngine, params: any) => void;
    onPreAttack?: (self: IUnit, target: IUnit, engine: IGameEngine, params: any) => boolean; 
    onHit?: (self: IUnit, target: IUnit, damage: number, engine: IGameEngine, params: any) => void;
    onDeath?: (self: IUnit, engine: IGameEngine, params: any) => void;
    onWasHit?: (self: IUnit, attacker: IUnit, damage: number, engine: IGameEngine, params: any) => number;
    onKill?: (self: IUnit, victim: IUnit, engine: IGameEngine, params: any) => void;
}

export interface IUnit {
    id: number;
    level: number;
    active: boolean;
    isDead: boolean;
    type: UnitType;
    faction: Faction;
    x: number;
    y: number;
    radius: number;
    stats: UnitRuntimeStats;
    statuses: Partial<Record<StatusType, StatusEffect>>;
    context: Record<string, any>;
    attackCooldown: number;
    target: IUnit | null;
    flashTimer: number;
    decayTimer: number;
    wanderTimer: number;
    wanderDir: number;
    engagedCount: number;
    speedVar: number;
    waveOffset: number;
    frameOffset: number; 
    steeringForce: { x: number, y: number };
    view: any; 
    geneConfig: GeneConfig[];
    state: string;
}