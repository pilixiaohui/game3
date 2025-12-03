import { BioPluginConfig } from '../types';

export const BIO_PLUGINS: Record<string, BioPluginConfig> = {
    'chitin_growth': { id: 'chitin_growth', name: '几丁质增生', description: '硬化甲壳', polarity: 'DEFENSE', baseCost: 6, costPerRank: 1, maxRank: 5, rarity: 'COMMON', stats: [{ stat: 'hp', value: 0.2 }], statGrowth: 1 },
    'toxin_sac': { id: 'toxin_sac', name: '腐蚀腺体', description: '攻击附带剧毒', polarity: 'ATTACK', baseCost: 8, costPerRank: 2, maxRank: 5, rarity: 'COMMON', stats: [{ stat: 'elementalDmg', value: 5, element: 'TOXIN', isFlat: true }], statGrowth: 0.5 },
    'pyro_gland': { id: 'pyro_gland', name: '放热腺体', description: '攻击附带热能灼烧', polarity: 'ATTACK', baseCost: 12, costPerRank: 2, maxRank: 5, rarity: 'RARE', stats: [{ stat: 'elementalDmg', value: 3, element: 'THERMAL', isFlat: true }], statGrowth: 0.5 },
    'metabolic_boost': { id: 'metabolic_boost', name: '代谢加速', description: '移动速度提升', polarity: 'FUNCTION', baseCost: 5, costPerRank: 1, maxRank: 3, rarity: 'COMMON', stats: [{ stat: 'speed', value: 0.15 }], statGrowth: 0.5 },
    'adrenal_surge': { id: 'adrenal_surge', name: '肾上腺激增', description: '攻速大幅提升，但降低防御', polarity: 'ATTACK', baseCost: 15, costPerRank: 3, maxRank: 5, rarity: 'RARE', stats: [{ stat: 'attackSpeed', value: 0.25 }, { stat: 'hp', value: -0.1 }], statGrowth: 0.2 }
};
