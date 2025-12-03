

import { GeneTrait, IUnit, ElementType, IGameEngine, StatusType, Faction, UnitType } from '../types';
import { ELEMENT_COLORS, STATUS_CONFIG, UNIT_CONFIGS } from '../constants';

// --- STATUS REGISTRY ---
type StatusHandler = (target: IUnit, dt: number, engine: IGameEngine, stacks: number) => void;

export class StatusRegistry {
    private static tickHandlers: Partial<Record<StatusType, StatusHandler>> = {};
    private static visualTints: Partial<Record<StatusType, number>> = {};

    static registerTick(type: StatusType, handler: StatusHandler) {
        this.tickHandlers[type] = handler;
    }
    
    static registerVisual(type: StatusType, tint: number) {
        this.visualTints[type] = tint;
    }

    static onTick(target: IUnit, type: StatusType, dt: number, engine: IGameEngine) {
        const effect = target.statuses[type];
        if (!effect) return;
        if (this.tickHandlers[type]) {
            this.tickHandlers[type]!(target, dt, engine, effect.stacks);
        }
    }
    
    static getVisual(target: IUnit): number | null {
        // Iterate statuses to find highest priority visual?
        // Simple first-match for now
        for(const type in target.statuses) {
            if (this.visualTints[type as StatusType]) {
                return this.visualTints[type as StatusType]!;
            }
        }
        return null;
    }
}

StatusRegistry.registerTick('BURNING', (target, dt, engine, stacks) => {
    engine.dealTrueDamage(target, stacks * 0.5 * dt);
});
StatusRegistry.registerVisual('BURNING', 0xff4500);

StatusRegistry.registerTick('POISONED', (target, dt, engine, stacks) => {
    engine.dealTrueDamage(target, stacks * 0.3 * dt);
});
StatusRegistry.registerVisual('POISONED', 0x4ade80);

StatusRegistry.registerVisual('FROZEN', 0x60a5fa);
StatusRegistry.registerVisual('SHOCKED', 0xfacc15);

// New Status Visuals
StatusRegistry.registerVisual('FRENZY', 0xff00ff); // Magenta for Zerg Rage
StatusRegistry.registerVisual('SLOWED', 0x555555); // Grey for Fear/Slow

// --- ELEMENTAL REACTION REGISTRY ---
type ReactionHandler = (target: IUnit, engine: IGameEngine, damage: number) => void;

export class ReactionRegistry {
    private static reactions: Record<string, ReactionHandler> = {};

    static register(statusType: string, elementType: string, handler: ReactionHandler) {
        this.reactions[`${statusType}_${elementType}`] = handler;
    }

    static handle(target: IUnit, element: ElementType, engine: IGameEngine, damage: number) {
        for (const status in target.statuses) {
            const key = `${status}_${element}`;
            if (this.reactions[key]) {
                this.reactions[key](target, engine, damage);
            }
        }
    }
}

ReactionRegistry.register('FROZEN', 'THERMAL', (target, engine) => {
    if (target.statuses['FROZEN'] && target.statuses['FROZEN']!.stacks >= STATUS_CONFIG.REACTION_THRESHOLD_MINOR) {
        delete target.statuses['FROZEN'];
        engine.createFloatingText(target.x, target.y - 50, "THERMAL SHOCK!", 0xffaa00, 16);
        engine.createExplosion(target.x, target.y, 40, 0xffaa00);
        engine.dealTrueDamage(target, target.stats.maxHp * 0.2); 
    }
});

ReactionRegistry.register('FROZEN', 'PHYSICAL', (target, engine) => {
    if (target.statuses['FROZEN'] && target.statuses['FROZEN']!.stacks >= STATUS_CONFIG.REACTION_THRESHOLD_MAJOR) {
        delete target.statuses['FROZEN'];
        engine.createFloatingText(target.x, target.y - 50, "SHATTER!", 0xa5f3fc, 16);
        engine.createDamagePop(target.x, target.y - 40, Math.floor(target.stats.maxHp * 0.15), 'CRYO');
        engine.dealTrueDamage(target, target.stats.maxHp * 0.15);
    }
});

ReactionRegistry.register('POISONED', 'VOLTAIC', (target, engine) => {
    engine.applyStatus(target, 'ARMOR_BROKEN', 1, 10);
    engine.createFloatingText(target.x, target.y - 50, "CORRODED!", 0x4ade80, 16);
});

ReactionRegistry.register('SHOCKED', 'CRYO', (target, engine) => {
    engine.applyStatus(target, 'FROZEN', 20, 10);
    engine.createFloatingText(target.x, target.y - 50, "SUPERCONDUCT!", 0x60a5fa, 16);
});

export class GeneLibrary {
    private static genes: Record<string, GeneTrait> = {};

    static register(gene: GeneTrait) {
        this.genes[gene.id] = gene;
    }

    static get(id: string): GeneTrait | undefined {
        return this.genes[id];
    }
}

// ==========================================
// A. 攻击增强类 (Attack Modifiers)
// ==========================================

GeneLibrary.register({
    id: 'GENE_VAMPIRIC',
    name: '吸血',
    onHit: (self, target, damage, engine, params) => {
        const ratio = params.ratio || 0.3; // Default 30%
        if (self.stats.hp < self.stats.maxHp && !self.isDead) {
            const heal = damage * ratio;
            self.stats.hp = Math.min(self.stats.maxHp, self.stats.hp + heal);
            if (Math.random() < 0.2) engine.createHealEffect(self.x, self.y);
        }
    }
});

GeneLibrary.register({
    id: 'GENE_EXECUTE',
    name: '斩杀',
    onHit: (self, target, damage, engine, params) => {
        const threshold = params.threshold || 0.3; // 30% HP
        const mult = params.multiplier || 2.0;
        
        if ((target.stats.hp / target.stats.maxHp) < threshold) {
            const extra = damage * (mult - 1);
            engine.dealTrueDamage(target, extra);
            engine.createFloatingText(target.x, target.y - 40, "CRUSH!", 0xff0000, 14);
        }
    }
});

GeneLibrary.register({
    id: 'GENE_GIANT_SLAYER',
    name: '巨人杀手',
    onHit: (self, target, damage, engine, params) => {
        const diff = target.stats.maxHp / self.stats.maxHp;
        if (diff > 2.0) {
            const extraPct = params.extraPct || 0.05;
            engine.dealTrueDamage(target, target.stats.maxHp * extraPct);
            if (Math.random() < 0.3) engine.createFloatingText(target.x, target.y - 40, "SLAYER", 0xffaa00, 10);
        }
    }
});

GeneLibrary.register({
    id: 'GENE_SPLASH_ZONE',
    name: '腐蚀溅射',
    onHit: (self, target, damage, engine, params) => {
        if (self.context.isSplashing) return;
        self.context.isSplashing = true;

        const range = params.range || 50;
        const ratio = params.ratio || 0.3;
        
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(target.x, target.y, range, neighbors);
        
        // Preserve original damage to prevent mutation
        const originalDmg = self.stats.damage;
        self.stats.damage = originalDmg * ratio;
        
        for(let i=0; i<count; i++) {
            const u = neighbors[i];
            if (u !== target && u !== self && u.faction !== self.faction && !u.isDead) {
                // Use pipeline to apply status effects
                engine.processDamagePipeline(self, u);
            }
        }
        
        self.stats.damage = originalDmg;
        self.context.isSplashing = false;
    }
});

GeneLibrary.register({
    id: 'GENE_CHAIN_ARC',
    name: '连锁电弧',
    onHit: (self, target, damage, engine, params) => {
        // Multi-bounce Logic
        const currentDepth = self.context.chainDepth || 0;
        const maxDepth = params.maxDepth || 3; // Bounce up to 3 times

        if (currentDepth >= maxDepth) return;

        const range = params.range || 180;
        const decay = params.decay || 0.7; // Damage decays by 30% per bounce
        
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(target.x, target.y, range, neighbors);
        
        let nextTarget: IUnit | null = null;
        let minDist = 999999;
        
        for(let i=0; i<count; i++) {
            const u = neighbors[i];
            // Valid Target: Not self, not current target, enemy faction, alive
            if (u !== target && u !== self && u.faction !== self.faction && !u.isDead) {
                // Prevent bouncing back to the immediate previous target to avoid A<->B infinite loop
                if (u.id === self.context.prevChainTargetId) continue;

                const d = (u.x - target.x)**2 + (u.y - target.y)**2;
                if (d < minDist) { minDist = d; nextTarget = u; }
            }
        }
        
        if (nextTarget) {
            // Visuals
            engine.createProjectile(target.x, target.y, nextTarget.x, nextTarget.y, 0xfacc15);
            
            // State Management for Recursion
            self.context.chainDepth = currentDepth + 1;
            const prevId = self.context.prevChainTargetId;
            self.context.prevChainTargetId = target.id;

            const originalDmg = self.stats.damage;
            self.stats.damage = originalDmg * decay;
            
            // Recursively trigger pipeline (which calls onHit -> GENE_CHAIN_ARC again)
            engine.processDamagePipeline(self, nextTarget);
            
            // Restore State
            self.stats.damage = originalDmg;
            self.context.chainDepth = currentDepth;
            self.context.prevChainTargetId = prevId;
        } else {
            // End of chain cleanup (optional, context is per-unit but transient enough in logic)
            self.context.chainDepth = 0;
            self.context.prevChainTargetId = -1;
        }
    }
});

GeneLibrary.register({
    id: 'GENE_POISON_TOUCH',
    name: '剧毒触碰',
    onHit: (self, target, damage, engine, params) => {
        engine.applyStatus(target, 'POISONED', params.stacks || 2, 5);
    }
});

GeneLibrary.register({
    id: 'GENE_RAMPAGE',
    name: '杀戮盛宴',
    onKill: (self, victim, engine, params) => {
        const healPct = params.heal || 0.1;
        self.stats.hp = Math.min(self.stats.maxHp, self.stats.hp + self.stats.maxHp * healPct);
        
        // Reset attack cooldown for immediate strike
        self.attackCooldown = 0;
        engine.createFloatingText(self.x, self.y - 40, "RAMPAGE!", 0xff00ff, 16);
    }
});

// ==========================================
// B. 生存与防御类 (Survival & Defense)
// ==========================================

GeneLibrary.register({
    id: 'GENE_THORNS',
    name: '反伤甲壳',
    onWasHit: (self, attacker, damage, engine, params) => {
        const reflect = params.ratio || 0.3;
        const distSq = (self.x - attacker.x)**2 + (self.y - attacker.y)**2;
        if (distSq < 100*100) {
            engine.dealTrueDamage(attacker, damage * reflect);
            engine.createFlash(self.x, self.y, 0x88ff88);
        }
        return damage;
    }
});

GeneLibrary.register({
    id: 'GENE_HARDENED_SKIN',
    name: '硬化皮肤',
    onWasHit: (self, attacker, damage, engine, params) => {
        const flatBlock = params.amount || 5;
        const reduced = Math.max(1, damage - flatBlock);
        if (damage > reduced) {
             if (Math.random() < 0.2) engine.createFloatingText(self.x, self.y - 20, "BLOCK", 0xaaaaaa, 10);
        }
        return reduced;
    }
});

GeneLibrary.register({
    id: 'GENE_MARTYR',
    name: '殉道者',
    onDeath: (self, engine, params) => {
        const range = params.range || 100;
        const heal = self.stats.maxHp * 0.5;
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(self.x, self.y, range, neighbors);
        
        engine.createShockwave(self.x, self.y, range, 0x00ff00);
        
        for(let i=0; i<count; i++) {
            const u = neighbors[i];
            if (u.faction === self.faction && !u.isDead) {
                u.stats.hp = Math.min(u.stats.maxHp, u.stats.hp + heal);
                engine.createHealEffect(u.x, u.y);
            }
        }
    }
});

GeneLibrary.register({
    id: 'GENE_PHASE_SHIFT',
    name: '相位护盾',
    onTick: (self, dt, engine, params) => {
        self.context.phaseCharge = (self.context.phaseCharge || 0) + dt;
        if (self.context.phaseCharge >= 10 && !self.context.phaseReady) {
            self.context.phaseReady = true;
            engine.createFloatingText(self.x, self.y - 20, "SHIELD UP", 0x60a5fa, 10);
        }
    },
    onWasHit: (self, attacker, damage, engine, params) => {
        if (self.context.phaseReady) {
            self.context.phaseReady = false;
            self.context.phaseCharge = 0;
            engine.createShockwave(self.x, self.y, 20, 0x60a5fa);
            engine.createFloatingText(self.x, self.y - 20, "PHASED", 0x60a5fa, 10);
            return 0; // Negate damage
        }
        return damage;
    }
});

GeneLibrary.register({
    id: 'GENE_BERSERKER_BLOOD',
    name: '狂战之血',
    onTick: (self, dt, engine, params) => {
        if (!self.context.baseDmg) self.context.baseDmg = self.stats.damage;
        
        const missingPct = 1 - (self.stats.hp / self.stats.maxHp);
        self.stats.damage = self.context.baseDmg * (1 + missingPct);
    }
});

// ==========================================
// C. 战术与移动类 (Tactics)
// ==========================================

GeneLibrary.register({
    id: 'GENE_BURROW_HEAL',
    name: '潜地愈合',
    onTick: (self, dt, engine, params) => {
        // Allows healing in Stockpile (WANDER) or Combat Idle
        if (self.state === 'IDLE' || self.state === 'WANDER') {
            self.context.idleTime = (self.context.idleTime || 0) + dt;
            if (self.context.idleTime > 2.0) {
                // Heal fast
                self.stats.hp = Math.min(self.stats.maxHp, self.stats.hp + self.stats.maxHp * 0.1 * dt);
                if (Math.random() < 0.05) engine.createHealEffect(self.x, self.y);
                if (self.view) self.view.alpha = 0.5; // Visual stealth
            }
        } else {
            self.context.idleTime = 0;
            if (self.view) self.view.alpha = 1.0;
        }
    }
});

GeneLibrary.register({
    id: 'GENE_DASH_CHARGE',
    name: '冲锋',
    onMove: (self, velocity, dt, engine, params) => {
        const cd = self.context['dash_cd'] || 0;
        if (cd > 0) {
            self.context['dash_cd'] = cd - dt;
        } else if (self.target && !self.target.isDead) {
            const distSq = (self.target.x - self.x)**2 + (self.target.y - self.y)**2;
            const engageRange = 300 * 300;
            
            // If out of range but close enough to charge
            if (distSq > self.stats.range * self.stats.range && distSq < engageRange) {
                const speedMult = params.speedMult || 3.0;
                velocity.x *= speedMult;
                velocity.y *= speedMult;
                self.context['dash_cd'] = 5.0;
                engine.createFloatingText(self.x, self.y - 30, "CHARGE!", 0xffffff, 12);
            }
        }
    }
});

GeneLibrary.register({
    id: 'GENE_GHOST_WALK',
    name: '幽灵漫步',
    onMove: (self, velocity, dt, engine, params) => {
        // Just purely visual flying bob, physics ignored by not having GENE_BOIDS or careful layering
        if (self.view) self.view.y += Math.sin(Date.now() / 200) * 0.5;
    }
});

// ==========================================
// D. 光环与控制类 (Auras)
// ==========================================

GeneLibrary.register({
    id: 'GENE_COMMAND_AURA',
    name: '指挥光环',
    onTick: (self, dt, engine, params) => {
        self.context.auraTimer = (self.context.auraTimer || 0) + dt;
        if (self.context.auraTimer < 0.5) return;
        self.context.auraTimer = 0;

        const range = params.range || 200;
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(self.x, self.y, range, neighbors);
        
        for(let i=0; i<count; i++) {
            const u = neighbors[i];
            if (u.faction === self.faction) {
                // Apply FRENZY Status (Handled in processDamagePipeline for +25% DMG)
                engine.applyStatus(u, 'FRENZY', 1, 0.6); // Duration covers tick interval
                if (Math.random() < 0.1) engine.createParticles(u.x, u.y, 0xff00ff, 1);
            }
        }
    }
});

GeneLibrary.register({
    id: 'GENE_TERROR_PRESENCE',
    name: '恐惧降临',
    onTick: (self, dt, engine, params) => {
        self.context.terrorTimer = (self.context.terrorTimer || 0) + dt;
        if (self.context.terrorTimer < 0.5) return;
        self.context.terrorTimer = 0;

        const range = params.range || 200;
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(self.x, self.y, range, neighbors);
        
        for(let i=0; i<count; i++) {
            const u = neighbors[i];
            if (u.faction !== self.faction && !u.isDead) {
                // Apply SLOWED Status
                engine.applyStatus(u, 'SLOWED', 1, 0.6);
                if (Math.random() < 0.1) engine.createFloatingText(u.x, u.y - 10, "FEAR", 0x880000, 8);
            }
        }
    }
});

GeneLibrary.register({
    id: 'GENE_STUN_HIT',
    name: '重击',
    onHit: (self, target, damage, engine, params) => {
        if (Math.random() < (params.chance || 0.15)) {
            engine.applyStatus(target, 'STUNNED', 1, 1.0);
            engine.createFloatingText(target.x, target.y - 20, "STUN", 0xffff00, 12);
        }
    }
});

// ==========================================
// E. 召唤与特殊类 (Special)
// ==========================================

GeneLibrary.register({
    id: 'GENE_SPAWN_BROOD',
    name: '亡语：小虫',
    onDeath: (self, engine, params) => {
        const count = params.count || 2;
        const type = params.unitType || UnitType.MELEE;
        for(let i=0; i<count; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            engine.spawnUnit(self.faction, type, self.x + offsetX);
        }
        engine.createFloatingText(self.x, self.y, "SPAWN!", 0x00ff00, 20);
    }
});

GeneLibrary.register({
    id: 'GENE_SELF_DESTRUCT',
    name: '自爆程序',
    onTick: (self, dt, engine, params) => {
        if (self.context.detonating) {
             self.context.detonateTimer = (self.context.detonateTimer || 0) + dt;
             if (self.view) {
                 const t = Math.sin(Date.now() / 50); // Fast pulse
                 self.view.tint = t > 0 ? 0xff0000 : 0xffffff;
                 self.view.scale.set(1.0 + self.context.detonateTimer); // Swell
             }
             if (self.context.detonateTimer >= 0.5) {
                 engine.killUnit(self);
             }
        }
    },
    onPreAttack: (self, target, engine, params) => {
        if (!self.context.detonating) {
            self.context.detonating = true;
            self.context.detonateTimer = 0;
        }
        return false; // Cancel attack
    }
});

// --- STANDARD GENES (Existing) ---

GeneLibrary.register({
    id: 'GENE_ACQUIRE_TARGET',
    name: 'Targeting System',
    // Refactored to handle its own validation and spatial query
    onUpdateTarget: (self, dt, engine, params) => {
        const range = params.range || 600;
        const rangeSq = range * range;

        // 1. Validation
        if (self.target) {
            const t = self.target;
            if (t.isDead || !t.active) {
                self.target = null;
            } else {
                const distSq = (t.x - self.x)**2 + (t.y - self.y)**2;
                if (distSq > rangeSq) {
                    self.target = null;
                }
            }
        }

        // 2. Acquisition
        if (!self.target) {
             const potentialTargets = engine._sharedQueryBuffer;
             // Query spatial hash directly from Gene
             const count = engine.spatialHash.query(self.x, self.y, range, potentialTargets);
             
             let bestDist = rangeSq;
             let bestTarget: IUnit | null = null;
             
             for (let i = 0; i < count; i++) {
                 const entity = potentialTargets[i];
                 if (entity.faction === self.faction || entity.isDead) continue;
                 
                 const dx = entity.x - self.x;
                 const dy = entity.y - self.y;
                 const distSq = dx*dx + dy*dy;
                 
                 if (distSq < bestDist) {
                     bestDist = distSq;
                     bestTarget = entity;
                 }
             }
             self.target = bestTarget;
        }
    }
});

GeneLibrary.register({
    id: 'GENE_AUTO_ATTACK',
    name: 'Auto Attack Trigger',
    onTick: (self, dt, engine, params) => {
        // Status Check: Stunned/Shocked
        if ((self.statuses['SHOCKED'] || self.statuses['STUNNED']) && Math.random() < 0.5) return;

        if (self.attackCooldown > 0) {
            self.attackCooldown -= dt;
        }

        if (self.target && !self.target.isDead) {
            const distSq = (self.target.x - self.x)**2 + (self.target.y - self.y)**2;
            const rangeSq = self.stats.range * self.stats.range;
            
            // Check Range
            if (distSq <= rangeSq) {
                self.state = 'ATTACK';
                
                // Trigger Attack
                if (self.attackCooldown <= 0) {
                    // Reset cooldown (attackSpeed is actually Cooldown Time in current data model)
                    self.attackCooldown = self.stats.attackSpeed; 
                    engine.performAttack(self, self.target);
                }
            } else {
                // Out of range, return to IDLE (so Movement gene can pick it up)
                if (self.state === 'ATTACK') self.state = 'IDLE';
            }
        } else {
             if (self.state === 'ATTACK') self.state = 'IDLE';
        }
    }
});

GeneLibrary.register({
    id: 'GENE_MELEE_ATTACK',
    name: 'Melee Strike',
    onPreAttack: (self, target, engine, params) => {
        engine.createSlash(self.x, self.y, target.x, target.y, ELEMENT_COLORS[self.stats.element] || 0xffffff);
        engine.createFlash(target.x + (Math.random() * 10 - 5), target.y - 10, ELEMENT_COLORS[self.stats.element] || 0xffffff);
        engine.processDamagePipeline(self, target);
        return false; 
    }
});

GeneLibrary.register({
    id: 'GENE_RANGED_ATTACK',
    name: 'Ranged Projectile',
    onPreAttack: (self, target, engine, params) => {
        const color = params.projectileColor || ELEMENT_COLORS[self.stats.element] || 0xffffff;
        engine.createProjectile(self.x, self.y - 15, target.x, target.y - 15, color);
        // Instant damage for responsiveness, projectile is visual
        engine.processDamagePipeline(self, target);
        return false; 
    }
});

GeneLibrary.register({
    id: 'GENE_ARTILLERY_ATTACK',
    name: 'Lobbed Shot',
    onPreAttack: (self, target, engine, params) => {
        const color = params.color || ELEMENT_COLORS[self.stats.element] || 0xff7777;
        engine.createProjectile(self.x, self.y - (params.arcHeight || 20), target.x, target.y, color); 
        // Instant damage, arc is visual
        engine.processDamagePipeline(self, target);
        return false;
    }
});

GeneLibrary.register({
    id: 'GENE_CLEAVE_ATTACK',
    name: 'Cleave',
    onPreAttack: (self, target, engine, params) => {
        const color = ELEMENT_COLORS[self.stats.element] || 0xffff00;
        engine.createFlash(target.x, target.y, color);
        
        const radius = params.radius || 40;
        engine.createShockwave(target.x, target.y, radius, color);
        
        engine.processDamagePipeline(self, target);
        
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(target.x, target.y, radius, neighbors);
        
        for (let i = 0; i < count; i++) {
            const n = neighbors[i];
            if (n !== target && n.faction !== self.faction && !n.isDead) {
                engine.processDamagePipeline(self, n);
            }
        }
        return false;
    }
});

GeneLibrary.register({
    id: 'GENE_ELEMENTAL_HIT',
    name: 'Elemental Application',
    onHit: (self, target, damage, engine, params) => {
        const el = self.stats.element;
        const amount = params.amount || UNIT_CONFIGS[self.type].elementConfig?.statusPerHit || 10;
        
        if (el === 'THERMAL') engine.applyStatus(target, 'BURNING', amount, 5);
        if (el === 'CRYO') engine.applyStatus(target, 'FROZEN', amount, 5);
        if (el === 'VOLTAIC') engine.applyStatus(target, 'SHOCKED', amount, 5);
        if (el === 'TOXIN') engine.applyStatus(target, 'POISONED', amount, 5);
        
        engine.createParticles(target.x, target.y, ELEMENT_COLORS[el] || 0xffffff, 3);
    }
});

GeneLibrary.register({
    id: 'GENE_REGEN',
    name: 'Regeneration',
    onTick: (self, dt, engine, params) => {
        const rate = params.rate || 0.05;
        if (self.stats.hp < self.stats.maxHp && !self.isDead) {
            self.stats.hp += self.stats.maxHp * rate * dt; 
            if (self.stats.hp > self.stats.maxHp) self.stats.hp = self.stats.maxHp;
            
            // Visual
            if (Math.random() < 0.05) engine.createHealEffect(self.x, self.y);
        }
    }
});

GeneLibrary.register({
    id: 'GENE_EXPLODE_ON_DEATH',
    name: 'Volatile',
    onDeath: (self, engine, params) => {
        const radius = params.radius || 60;
        const dmg = params.damage || 40;
        engine.createExplosion(self.x, self.y, radius, ELEMENT_COLORS[self.stats.element]);
        engine.createShockwave(self.x, self.y, radius, ELEMENT_COLORS[self.stats.element]);
        
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(self.x, self.y, radius, neighbors);
        for (let i=0; i<count; i++) {
            const n = neighbors[i];
            if (n.faction !== self.faction && !n.isDead) {
                engine.dealTrueDamage(n, dmg);
            }
        }
    }
});

GeneLibrary.register({
    id: 'GENE_WANDER',
    name: 'Idle Wander',
    onMove: (self, velocity, dt, engine, params) => {
        if ((self.statuses['SHOCKED'] || self.statuses['STUNNED']) && Math.random() < 0.05) return;

        self.wanderTimer -= dt;
        if (self.wanderTimer <= 0) { 
            self.wanderTimer = 1 + Math.random() * 2; 
            self.wanderDir = Math.random() > 0.5 ? 1 : -1; 
        }

        // Apply SLOWED effect
        const speedMult = self.statuses['SLOWED'] ? 0.5 : 1.0;
        
        velocity.x += self.wanderDir * self.stats.speed * 0.3 * speedMult * dt;
        velocity.y += (Math.random() - 0.5) * 0.5;
        
        self.state = 'WANDER';
    }
});

GeneLibrary.register({
    id: 'GENE_COMBAT_MOVEMENT',
    name: 'Combat Movement (Chase/March)',
    onMove: (self, velocity, dt, engine, params) => {
        if (self.state === 'ATTACK') return;
        if ((self.statuses['SHOCKED'] || self.statuses['STUNNED']) && Math.random() < 0.05) return;

        let isMoving = false;
        // Apply SLOWED effect
        const speedMult = self.statuses['SLOWED'] ? 0.5 : 1.0;
        const moveMult = params.multiplier || 1.0;

        if (self.target && !self.target.isDead) {
            const distSq = (self.target.x - self.x)**2 + (self.target.y - self.y)**2;
            const dist = Math.sqrt(distSq);
            if (dist > self.stats.range * 0.9) {
                const dirX = (self.target.x - self.x) / dist;
                const dirY = (self.target.y - self.y) / dist;
                velocity.x += dirX * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                velocity.y += dirY * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                isMoving = true;
            }
        } 
        else {
            const moveDir = self.faction === Faction.ZERG ? 1 : -1;
            if (self.stats.speed > 0) {
                velocity.x += moveDir * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                velocity.y += Math.sin(Date.now()/1000 + self.waveOffset) * 20 * dt; 
                isMoving = true;
            }
        }

        if (isMoving) self.state = 'MOVE';
        else if (self.state !== 'ATTACK') self.state = 'IDLE';
    }
});

GeneLibrary.register({
    id: 'GENE_BOIDS',
    name: 'Boids Physics',
    onMove: (self, velocity, dt, engine, params) => {
        if (self.state === 'ATTACK' || self.stats.speed <= 0) return;

        const frame = Math.floor(Date.now() / 32); 
        const shouldUpdate = (frame + self.frameOffset) % 3 === 0;

        if (shouldUpdate) {
            const sepRadius = params.separationRadius || 40;
            const sepForceConfig = params.separationForce || 1.5;
            const cohWeight = params.cohesionWeight || 0.1;
            const aliWeight = params.alignmentWeight || 0.1;
            
            const neighbors = engine._sharedQueryBuffer;
            const count = engine.spatialHash.query(self.x, self.y, sepRadius, neighbors);
            
            let forceX = 0;
            let forceY = 0;
            
            let centerX = 0;
            let centerY = 0;
            let neighborCount = 0;

            for (let i = 0; i < count; i++) {
                const friend = neighbors[i];
                if (friend === self || friend.faction !== self.faction) continue;
                
                const dx = self.x - friend.x;
                const dy = self.y - friend.y;
                const distSq = dx*dx + dy*dy;
                
                if (distSq < sepRadius * sepRadius && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    const repulsionStrength = Math.min(500, 1000 / (dist + 0.1));
                    
                    forceX += (dx / dist) * repulsionStrength * sepForceConfig * 0.01;
                    forceY += (dy / dist) * repulsionStrength * sepForceConfig * 0.01;
                }

                centerX += friend.x;
                centerY += friend.y;
                neighborCount++;
            }

            if (neighborCount > 0) {
                centerX /= neighborCount;
                centerY /= neighborCount;
                forceX += (centerX - self.x) * cohWeight;
                forceY += (centerY - self.y) * cohWeight;
                
                if (self.faction === Faction.ZERG) {
                     forceX += aliWeight * 2.0; 
                }
            }
            
            forceX += (Math.random() - 0.5) * 5.0;
            forceY += (Math.random() - 0.5) * 5.0;

            self.steeringForce.x = forceX;
            self.steeringForce.y = forceY;
        }

        velocity.x += (self.steeringForce.x * dt);
        velocity.y += (self.steeringForce.y * dt);
    }
});

GeneLibrary.register({
    id: 'GENE_FAST_MOVEMENT',
    name: 'Fast',
    onMove: (self, velocity, dt, engine, params) => {
        const mult = params.multiplier || 1.2;
        velocity.x *= mult;
    }
});