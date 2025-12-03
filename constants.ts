import { ZERG_UNIT_CONFIGS, PLAYABLE_UNITS as ZERG_PLAYABLE } from './config/units/zerg';
import { HUMAN_UNIT_CONFIGS } from './config/units/human';
import { UnitConfig, UnitType } from './types';

export * from './config/core';
export * from './config/metabolism';
export * from './config/items';
export * from './config/regions';
export * from './config/state';

export const PLAYABLE_UNITS = ZERG_PLAYABLE;

export const UNIT_CONFIGS: Record<UnitType, UnitConfig> = {
    ...ZERG_UNIT_CONFIGS,
    ...HUMAN_UNIT_CONFIGS
} as Record<UnitType, UnitConfig>;
