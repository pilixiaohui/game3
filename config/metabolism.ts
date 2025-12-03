export const METABOLISM_FACILITIES = {
    // TIER I: Matter (Low Growth to encourage stacking 1.15 - 1.30)
    VILLI: { NAME: "菌毯绒毛 (Villi)", DESC: "基础吸收。每100个提供 x1.25 全局乘区。", BASE_COST: 15, GROWTH: 1.08, BASE_RATE: 1.0, CLUSTER_THRESHOLD: 100, COST_RESOURCE: 'biomass' },
    TAPROOT: { NAME: "深钻根须 (Taproot)", DESC: "深层供养。使绒毛基础产出 +0.1。", BASE_COST: 500, GROWTH: 1.10, BASE_RATE: 0, BONUS_TO_VILLI: 0.1, COST_RESOURCE: 'biomass' },
    GEYSER: { NAME: "酸蚀喷泉 (Acid Geyser)", DESC: "工业基石。提供稳定的生物质流。", BASE_COST: 12000, GROWTH: 1.12, BASE_RATE: 85.0, COST_RESOURCE: 'biomass' },
    BREAKER: { NAME: "地壳破碎机 (Crust Breaker)", DESC: "过载开采。产出极高，每秒流失 0.05% 库存。", BASE_COST: 150000, GROWTH: 1.15, BASE_RATE: 3500.0, LOSS_RATE: 0.0005, COST_RESOURCE: 'biomass' },
    
    // TIER II: Energy (Standard Growth 1.15)
    SAC: { NAME: "发酵囊 (Fermentation Sac)", DESC: "基础转化：100 Bio -> 1 Enz。", BASE_COST: 10000, GROWTH: 1.15, INPUT: 100, OUTPUT: 1, COST_RESOURCE: 'biomass' },
    PUMP: { NAME: "回流泵 (Reflux Pump)", DESC: "效率优化：减少发酵囊 2 消耗 (Min 50)。", BASE_COST: 2500, GROWTH: 1.25, COST_REDUCTION: 2, MIN_COST: 50, COST_RESOURCE: 'enzymes' },
    CRACKER: { NAME: "热能裂解堆 (Thermal Cracker)", DESC: "高压裂变：500 Bio -> 15 Enz (产生热量)。", BASE_COST: 25000, GROWTH: 1.20, INPUT: 500, OUTPUT: 15, HEAT_GEN: 5, COOL_RATE: 8, COST_RESOURCE: 'enzymes' },
    BOILER: { NAME: "血肉锅炉 (Flesh Boiler)", DESC: "回收利用：1 幼虫 -> 500 Enz。", BASE_COST: 100000, GROWTH: 1.30, INPUT_LARVA: 1, OUTPUT_ENZ: 500, COST_RESOURCE: 'enzymes' },
    
    // TIER I EXOTIC (High Growth)
    NECRO_SIPHON: { NAME: "尸骸转化冢 (Necro Siphon)", DESC: "战争红利。产出 = 基础值 + 累计击杀数 * 10。", BASE_COST: 1500000, GROWTH: 1.40, BASE_RATE: 500.0, KILL_SCALAR: 10.0, COST_RESOURCE: 'biomass' },
    RED_TIDE: { NAME: "红潮藻井 (Red Tide Silo)", DESC: "生态协同。产出 = 基础值 * (1 + 绒毛数量/50)。", BASE_COST: 50000000, GROWTH: 1.60, BASE_RATE: 15000.0, COST_RESOURCE: 'biomass' },
    GAIA_DIGESTER: { NAME: "盖亚消化池 (Gaia Digester)", DESC: "星球吞噬。产出 = 50 * (当前库存)^0.8。", BASE_COST: 5000000000, GROWTH: 2.00, POW_FACTOR: 0.8, COEFF: 50.0, COST_RESOURCE: 'biomass' },
    
    // TIER II EXOTIC
    BLOOD_FUSION: { NAME: "鲜血聚变堆 (Blood Fusion)", DESC: "内循环。每秒吞噬 1 只近战兵种 -> 转化 2000 Enz。", BASE_COST: 500000, GROWTH: 1.50, INPUT_UNIT: 'MELEE', OUTPUT_ENZ: 2000, COST_RESOURCE: 'enzymes' },
    RESONATOR: { NAME: "突触谐振塔 (Synaptic Resonator)", DESC: "大数定律。产出 = √总人口 * 500。", BASE_COST: 10000000, GROWTH: 1.45, POP_SCALAR: 500, COST_RESOURCE: 'enzymes' },
    ENTROPY_VENT: { NAME: "熵增排放口 (Entropy Vent)", DESC: "双曲贴现。每秒燃烧 1% Bio库存 -> 5x 等价 Enz。", BASE_COST: 1000000000, GROWTH: 2.50, BURN_RATE: 0.01, CONVERT_RATIO: 5.0, COST_RESOURCE: 'enzymes' },

    // TIER III: Data (High Growth 1.25+)
    SPIRE: { NAME: "神经尖塔 (Neural Spire)", DESC: "基础解析：产生微量 DNA (0.005/s)。", BASE_COST: 5000, GROWTH: 1.25, BASE_RATE: 0.005, COST_RESOURCE: 'enzymes' },
    HIVE_MIND: { NAME: "虫群意识网 (Hive Mind)", DESC: "思维共鸣：产出 = 0.001 * √总兵力。", BASE_COST: 50000, GROWTH: 1.40, SCALAR: 0.001, COST_RESOURCE: 'enzymes' },
    RECORDER: { NAME: "阿卡西记录 (Akashic Recorder)", DESC: "概率跃迁：15% 概率复制 1% DNA。", BASE_COST: 250000, GROWTH: 1.50, CHANCE: 0.15, PERCENT: 0.01, COST_RESOURCE: 'enzymes' },
    COMBAT_CORTEX: { NAME: "前线皮质 (Combat Cortex)", DESC: "战意解析。基于当前交战单位数产出 DNA。", BASE_COST: 1000000, GROWTH: 1.50, BASE_RATE: 0.5, COST_RESOURCE: 'enzymes' },
    GENE_ARCHIVE: { NAME: "基因档案馆 (Gene Archive)", DESC: "代际传承。解锁元进度折扣 (暂未实装)。", BASE_COST: 10000000, GROWTH: 2.00, COST_RESOURCE: 'enzymes' },
    OMEGA_POINT: { NAME: "欧米茄演算机 (Omega Point)", DESC: "终局计算。重置获取系数 10 -> 15。", BASE_COST: 500000000, GROWTH: 5.00, COST_RESOURCE: 'enzymes' },

    STORAGE: { NAME: "能量泵 (Storage)", DESC: "扩充资源上限。", BASE_COST: 100, GROWTH: 1.5, CAP_PER_LEVEL: 10000, COST_RESOURCE: 'biomass' },
    SUPPLY: { NAME: "突触网络 (Supply)", DESC: "扩充兵力上限。", BASE_COST: 250, GROWTH: 1.5, CAP_PER_LEVEL: 50, COST_RESOURCE: 'biomass' }
};
