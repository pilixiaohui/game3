
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
        for(const type in target.statuses) {
            if (this.visualTints[type as StatusType]) {
                return this.visualTints[type as StatusType]!;
            }
        }
        return null;
    }
}

StatusRegistry.registerTick('BURNING', (target, dt, engine, stacks) => {
    engine.events.emit('REQUEST_TRUE_DAMAGE', { target, amount: stacks * 0.5 * dt });
});
StatusRegistry.registerVisual('BURNING', 0xff4500);

StatusRegistry.registerTick('POISONED', (target, dt, engine, stacks) => {
    engine.events.emit('REQUEST_TRUE_DAMAGE', { target, amount: stacks * 0.3 * dt });
});
StatusRegistry.registerVisual('POISONED', 0x4ade80);

StatusRegistry.registerVisual('FROZEN', 0x60a5fa);
StatusRegistry.registerVisual('SHOCKED', 0xfacc15);
StatusRegistry.registerVisual('FRENZY', 0xff00ff);
StatusRegistry.registerVisual('SLOWED', 0x555555);

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
        engine.events.emit('FX', { type: 'TEXT', x: target.x, y: target.y - 50, text: "THERMAL SHOCK!", color: 0xffaa00, fontSize: 16 });
        engine.events.emit('FX', { type: 'EXPLOSION', x: target.x, y: target.y, radius: 40, color: 0xffaa00 });
        engine.events.emit('REQUEST_TRUE_DAMAGE', { target, amount: target.stats.maxHp * 0.2 });
    }
});

ReactionRegistry.register('FROZEN', 'PHYSICAL', (target, engine) => {
    if (target.statuses['FROZEN'] && target.statuses['FROZEN']!.stacks >= STATUS_CONFIG.REACTION_THRESHOLD_MAJOR) {
        delete target.statuses['FROZEN'];
        engine.events.emit('FX', { type: 'TEXT', x: target.x, y: target.y - 50, text: "SHATTER!", color: 0xa5f3fc, fontSize: 16 });
        engine.events.emit('FX', { type: 'DAMAGE_POP', x: target.x, y: target.y - 40, text: Math.floor(target.stats.maxHp * 0.15).toString(), color: 0x60a5fa, fontSize: 14 });
        engine.events.emit('REQUEST_TRUE_DAMAGE', { target, amount: target.stats.maxHp * 0.15 });
    }
});

ReactionRegistry.register('POISONED', 'VOLTAIC', (target, engine) => {
    engine.events.emit('REQUEST_STATUS', { target, type: 'ARMOR_BROKEN', stacks: 1, duration: 10 });
    engine.events.emit('FX', { type: 'TEXT', x: target.x, y: target.y - 50, text: "CORRODED!", color: 0x4ade80, fontSize: 16 });
});

ReactionRegistry.register('SHOCKED', 'CRYO', (target, engine) => {
    engine.events.emit('REQUEST_STATUS', { target, type: 'FROZEN', stacks: 20, duration: 10 });
    engine.events.emit('FX', { type: 'TEXT', x: target.x, y: target.y - 50, text: "SUPERCONDUCT!", color: 0x60a5fa, fontSize: 16 });
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
// A. ATTACK MODIFIERS
// ==========================================

GeneLibrary.register({
    id: 'GENE_VAMPIRIC',
    name: '吸血',
    onHit: (self, target, damage, engine, params) => {
        const ratio = params.ratio || 0.3;
        if (self.stats.hp < self.stats.maxHp && !self.isDead) {
            const heal = damage * ratio;
            self.stats.hp = Math.min(self.stats.maxHp, self.stats.hp + heal);
            if (Math.random() < 0.2) engine.events.emit('FX', { type: 'HEAL', x: self.x, y: self.y });
        }
    }
});

GeneLibrary.register({
    id: 'GENE_EXECUTE',
    name: '斩杀',
    onHit: (self, target, damage, engine, params) => {
        const threshold = params.threshold || 0.3;
        const mult = params.multiplier || 2.0;
        
        if ((target.stats.hp / target.stats.maxHp) < threshold) {
            const extra = damage * (mult - 1);
            engine.events.emit('REQUEST_TRUE_DAMAGE', { target, amount: extra });
            engine.events.emit('FX', { type: 'TEXT', x: target.x, y: target.y - 40, text: "CRUSH!", color: 0xff0000, fontSize: 14 });
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
            engine.events.emit('REQUEST_TRUE_DAMAGE', { target, amount: target.stats.maxHp * extraPct });
            if (Math.random() < 0.3) engine.events.emit('FX', { type: 'TEXT', x: target.x, y: target.y - 40, text: "SLAYER", color: 0xffaa00, fontSize: 10 });
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
        
        // Fix: Copy array to avoid buffer overwrite during recursive events
        const targets: IUnit[] = [];
        for(let i=0; i<count; i++) targets.push(neighbors[i]);

        const originalDmg = self.stats.damage;
        self.stats.damage = originalDmg * ratio;
        
        for(const u of targets) {
            if (u !== target && u !== self && u.faction !== self.faction && !u.isDead) {
                engine.events.emit('REQUEST_DAMAGE_PIPELINE', { source: self, target: u });
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
        const currentDepth = self.context.chainDepth || 0;
        const maxDepth = params.maxDepth || 3; 

        if (currentDepth >= maxDepth) return;

        const range = params.range || 180;
        const decay = params.decay || 0.7; 
        
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(target.x, target.y, range, neighbors);
        
        let nextTarget: IUnit | null = null;
        let minDist = 999999;
        
        for(let i=0; i<count; i++) {
            const u = neighbors[i];
            if (u !== target && u !== self && u.faction !== self.faction && !u.isDead) {
                if (u.id === self.context.prevChainTargetId) continue;
                const d = (u.x - target.x)**2 + (u.y - target.y)**2;
                if (d < minDist) { minDist = d; nextTarget = u; }
            }
        }
        
        if (nextTarget) {
            engine.events.emit('FX', { type: 'PROJECTILE', x: target.x, y: target.y, x2: nextTarget!.x, y2: nextTarget!.y, color: 0xfacc15 });
            
            self.context.chainDepth = currentDepth + 1;
            const prevId = self.context.prevChainTargetId;
            self.context.prevChainTargetId = target.id;

            const originalDmg = self.stats.damage;
            self.stats.damage = originalDmg * decay;
            
            engine.events.emit('REQUEST_DAMAGE_PIPELINE', { source: self, target: nextTarget });
            
            self.stats.damage = originalDmg;
            self.context.chainDepth = currentDepth;
            self.context.prevChainTargetId = prevId;
        } else {
            self.context.chainDepth = 0;
            self.context.prevChainTargetId = -1;
        }
    }
});

GeneLibrary.register({
    id: 'GENE_POISON_TOUCH',
    name: '剧毒触碰',
    onHit: (self, target, damage, engine, params) => {
        engine.events.emit('REQUEST_STATUS', { target, type: 'POISONED', stacks: params.stacks || 2, duration: 5 });
    }
});

GeneLibrary.register({
    id: 'GENE_RAMPAGE',
    name: '杀戮盛宴',
    onKill: (self, victim, engine, params) => {
        const healPct = params.heal || 0.1;
        self.stats.hp = Math.min(self.stats.maxHp, self.stats.hp + self.stats.maxHp * healPct);
        self.attackCooldown = 0;
        engine.events.emit('FX', { type: 'TEXT', x: self.x, y: self.y - 40, text: "RAMPAGE!", color: 0xff00ff, fontSize: 16 });
    }
});

// ==========================================
// B. SURVIVAL & DEFENSE
// ==========================================

GeneLibrary.register({
    id: 'GENE_THORNS',
    name: '反伤甲壳',
    onWasHit: (self, attacker, damage, engine, params) => {
        const reflect = params.ratio || 0.3;
        const distSq = (self.x - attacker.x)**2 + (self.y - attacker.y)**2;
        if (distSq < 100*100) {
            engine.events.emit('REQUEST_TRUE_DAMAGE', { target: attacker, amount: damage * reflect });
            engine.events.emit('FX', { type: 'FLASH', x: self.x, y: self.y, color: 0x88ff88 });
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
             if (Math.random() < 0.2) engine.events.emit('FX', { type: 'TEXT', x: self.x, y: self.y - 20, text: "BLOCK", color: 0xaaaaaa, fontSize: 10 });
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
        
        engine.events.emit('FX', { type: 'SHOCKWAVE', x: self.x, y: self.y, radius: range, color: 0x00ff00 });
        
        for(let i=0; i<count; i++) {
            const u = neighbors[i];
            if (u.faction === self.faction && !u.isDead) {
                u.stats.hp = Math.min(u.stats.maxHp, u.stats.hp + heal);
                engine.events.emit('FX', { type: 'HEAL', x: u.x, y: u.y });
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
            engine.events.emit('FX', { type: 'TEXT', x: self.x, y: self.y - 20, text: "SHIELD UP", color: 0x60a5fa, fontSize: 10 });
        }
    },
    onWasHit: (self, attacker, damage, engine, params) => {
        if (self.context.phaseReady) {
            self.context.phaseReady = false;
            self.context.phaseCharge = 0;
            engine.events.emit('FX', { type: 'SHOCKWAVE', x: self.x, y: self.y, radius: 20, color: 0x60a5fa });
            engine.events.emit('FX', { type: 'TEXT', x: self.x, y: self.y - 20, text: "PHASED", color: 0x60a5fa, fontSize: 10 });
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
// C. TACTICS & MOVEMENT
// ==========================================

GeneLibrary.register({
    id: 'GENE_BURROW_HEAL',
    name: '潜地愈合',
    onTick: (self, dt, engine, params) => {
        if (self.state === 'IDLE' || self.state === 'WANDER') {
            self.context.idleTime = (self.context.idleTime || 0) + dt;
            if (self.context.idleTime > 2.0) {
                // Heal fast
                self.stats.hp = Math.min(self.stats.maxHp, self.stats.hp + self.stats.maxHp * 0.1 * dt);
                if (Math.random() < 0.05) engine.events.emit('FX', { type: 'HEAL', x: self.x, y: self.y });
                // Logic: Mark as burrowed. Renderer will handle alpha.
                self.context.isBurrowed = true;
            }
        } else {
            self.context.idleTime = 0;
            self.context.isBurrowed = false;
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
            if (distSq > self.stats.range * self.stats.range && distSq < engageRange) {
                const speedMult = params.speedMult || 3.0;
                velocity.x *= speedMult;
                velocity.y *= speedMult;
                self.context['dash_cd'] = 5.0;
                engine.events.emit('FX', { type: 'TEXT', x: self.x, y: self.y - 30, text: "CHARGE!", color: 0xffffff, fontSize: 12 });
            }
        }
    }
});

GeneLibrary.register({
    id: 'GENE_GHOST_WALK',
    name: '幽灵漫步',
    onMove: (self, velocity, dt, engine, params) => {
        // Logic: Mark as ghosting. Renderer handles bobbing.
        self.context.isGhosting = true;
    }
});

// ==========================================
// D. AURAS & CONTROL
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
                engine.events.emit('REQUEST_STATUS', { target: u, type: 'FRENZY', stacks: 1, duration: 0.6 });
                if (Math.random() < 0.1) engine.events.emit('FX', { type: 'PARTICLES', x: u.x, y: u.y, color: 0xff00ff, count: 1 });
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
                engine.events.emit('REQUEST_STATUS', { target: u, type: 'SLOWED', stacks: 1, duration: 0.6 });
                if (Math.random() < 0.1) engine.events.emit('FX', { type: 'TEXT', x: u.x, y: u.y - 10, text: "FEAR", color: 0x880000, fontSize: 8 });
            }
        }
    }
});

GeneLibrary.register({
    id: 'GENE_STUN_HIT',
    name: '重击',
    onHit: (self, target, damage, engine, params) => {
        if (Math.random() < (params.chance || 0.15)) {
            engine.events.emit('REQUEST_STATUS', { target, type: 'STUNNED', stacks: 1, duration: 1.0 });
            engine.events.emit('FX', { type: 'TEXT', x: target.x, y: target.y - 20, text: "STUN", color: 0xffff00, fontSize: 12 });
        }
    }
});

GeneLibrary.register({
    id: 'GENE_SUPPORT',
    name: 'Medical Support',
    onTick: (self, dt, engine, params) => {
        if (self.attackCooldown > 0) {
            self.attackCooldown -= dt;
            return;
        }

        const range = params.range || 200;
        const healAmount = (params.heal || 10) * dt;
        
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(self.x, self.y, range, neighbors);
        
        let target: IUnit | null = null;
        let lowestHpPct = 1.0;

        for(let i=0; i<count; i++) {
            const u = neighbors[i];
            if (u.faction === self.faction && u !== self && !u.isDead && u.stats.hp < u.stats.maxHp) {
                const pct = u.stats.hp / u.stats.maxHp;
                if (pct < lowestHpPct) {
                    lowestHpPct = pct;
                    target = u;
                }
            }
        }

        if (target) {
            target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + healAmount);
            if (Math.random() < 0.2) {
                 engine.events.emit('FX', { type: 'HEAL', x: target.x, y: target.y });
                 engine.events.emit('FX', { type: 'PROJECTILE', x: self.x, y: self.y - 10, x2: target.x, y2: target.y - 10, color: 0x00ff00 }); 
            }
        }
    }
});

// ==========================================
// E. SPECIAL
// ==========================================

GeneLibrary.register({
    id: 'GENE_SPAWN_BROOD',
    name: '亡语：小虫',
    onDeath: (self, engine, params) => {
        const count = params.count || 2;
        const type = params.unitType || UnitType.MELEE;
        for(let i=0; i<count; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            engine.events.emit('REQUEST_SPAWN', { faction: self.faction, type, x: self.x + offsetX });
        }
        engine.events.emit('FX', { type: 'TEXT', x: self.x, y: self.y, text: "SPAWN!", color: 0x00ff00, fontSize: 20 });
    }
});

GeneLibrary.register({
    id: 'GENE_SELF_DESTRUCT',
    name: '自爆程序',
    onTick: (self, dt, engine, params) => {
        if (self.context.detonating) {
             self.context.detonateTimer = (self.context.detonateTimer || 0) + dt;
             // Logic: Just update timer. Renderer handles tint/scale based on timer.
             if (self.context.detonateTimer >= 0.5) {
                 engine.events.emit('REQUEST_KILL', { target: self });
             }
        }
    },
    onPreAttack: (self, target, engine, params) => {
        if (!self.context.detonating) {
            self.context.detonating = true;
            self.context.detonateTimer = 0;
        }
        return false;
    }
});

// --- STANDARD GENES (核心修改) ---

GeneLibrary.register({
    id: 'GENE_ACQUIRE_TARGET',
    name: 'Targeting System',
    onUpdateTarget: (self, dt, engine, params) => {
        const range = params.range || 600;
        const rangeSq = range * range;

        // FIXED: 严格丢弃身后的目标
        if (self.target) {
            const t = self.target;
            const isBehind = (self.faction === Faction.ZERG && t.x < self.x);
            if (t.isDead || !t.active || isBehind) {
                self.target = null;
            } else {
                const distSq = (t.x - self.x)**2 + (t.y - self.y)**2;
                if (distSq > rangeSq) {
                    self.target = null;
                }
            }
        }

        if (!self.target) {
             const potentialTargets = engine._sharedQueryBuffer;
             const count = engine.spatialHash.query(self.x, self.y, range, potentialTargets);
             
             let bestDist = rangeSq;
             let bestTarget: IUnit | null = null;
             
             for (let i = 0; i < count; i++) {
                 const entity = potentialTargets[i];
                 if (entity.faction === self.faction || entity.isDead) continue;
                 
                 const dx = entity.x - self.x;
                 const dy = entity.y - self.y;
                 const distSq = dx*dx + dy*dy;
                 
                 // FIXED: 更加严格的防回头机制
                 // 如果敌人坐标小于自己（在左边），完全无视，继续向右冲
                 if (self.faction === Faction.ZERG && dx < 0) continue; 

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
        if ((self.statuses['SHOCKED'] || self.statuses['STUNNED']) && Math.random() < 0.5) return;
        if (self.attackCooldown > 0) {
            self.attackCooldown -= dt;
        }

        if (self.target && !self.target.isDead) {
            // FIXED: 攻击前检测位置关系
            // 如果我是 Zerg 且已经跑到了目标右侧，禁止停下来攻击，必须继续移动
            if (self.faction === Faction.ZERG && self.target.x < self.x) {
                if (self.state === 'ATTACK') self.state = 'MOVE';
                return;
            }

            const distSq = (self.target.x - self.x)**2 + (self.target.y - self.y)**2;
            const rangeSq = self.stats.range * self.stats.range;
            
            if (distSq <= rangeSq) {
                self.state = 'ATTACK';
                if (self.attackCooldown <= 0) {
                    self.attackCooldown = self.stats.attackSpeed; 
                    engine.events.emit('REQUEST_ATTACK', { source: self, target: self.target });
                }
            } else {
                if (self.state === 'ATTACK') self.state = 'IDLE';
            }
        } else {
             if (self.state === 'ATTACK') self.state = 'IDLE';
        }
    }
});

GeneLibrary.register({
    id: 'GENE_COMBAT_MOVEMENT',
    name: 'Combat Movement',
    onMove: (self, velocity, dt, engine, params) => {
        // FIXED: 如果处于攻击状态，但目标在身后，则必须解除攻击状态并移动（双重保险）
        if (self.state === 'ATTACK') {
            if (self.faction === Faction.ZERG && self.target && self.target.x < self.x) {
                self.state = 'MOVE'; // 强制解除锁定
            } else {
                return;
            }
        }

        if ((self.statuses['SHOCKED'] || self.statuses['STUNNED']) && Math.random() < 0.05) return;

        let isMoving = false;
        const speedMult = self.statuses['SLOWED'] ? 0.5 : 1.0;
        const moveMult = params.multiplier || 1.0;

        // Flow Field Integration
        // @ts-ignore
        const lm = engine.levelManager;
        // @ts-ignore
        const isSiege = lm?.currentState === 'SIEGE';
        const flow = lm ? lm.getFlowVector(self.x, self.y) : { x: (self.faction === Faction.ZERG ? 1 : -1), y: 0 };
        
        if (self.state === 'SEEK' || self.state === 'RETURN' || self.state === 'DEPOSIT') {
             // Harvest logic...
             if (self.steeringForce.x !== 0 || self.steeringForce.y !== 0) {
                 velocity.x += self.steeringForce.x * speedMult * dt;
                 velocity.y += self.steeringForce.y * speedMult * dt;
                 isMoving = true;
             }
        } 
        else if (self.target && !self.target.isDead) {
            const distSq = (self.target.x - self.x)**2 + (self.target.y - self.y)**2;
            const dist = Math.sqrt(distSq);
            
            // FIXED: Zerg 移动逻辑大改
            const isTargetBehind = (self.faction === Faction.ZERG && self.target.x < self.x);
            
            // 如果目标在身后，强制不追踪，直接用流场向右推
            if (isTargetBehind) {
                // 完全忽略目标方向，使用 flow
                velocity.x += flow.x * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                velocity.y += flow.y * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                isMoving = true;
            } else {
                // 正常追击
                const chaseThreshold = self.stats.range * 0.9;
                if (dist > chaseThreshold) {
                    const dirX = (self.target.x - self.x) / dist;
                    const dirY = (self.target.y - self.y) / dist;
                    
                    let bias = Math.min(0.6, 100 / (dist + 0.1)); 
                    if (self.faction === Faction.ZERG) {
                        bias = Math.min(0.4, 80 / (dist + 0.1)); 
                    }
                    if (isSiege) bias *= 0.5;

                    const finalX = dirX * bias + flow.x * (1 - bias);
                    const finalY = dirY * bias + flow.y * (1 - bias);

                    velocity.x += finalX * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                    velocity.y += finalY * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                    isMoving = true;
                }
            }
        } 
        else {
            // 无目标：行军
            if (self.stats.speed > 0) {
                const finalX = (self.faction === Faction.ZERG) ? flow.x : -flow.x;
                const finalY = flow.y; 
                
                velocity.x += finalX * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                velocity.y += finalY * self.stats.speed * self.speedVar * speedMult * moveMult * dt;
                isMoving = true;
            }
        }

        if (isMoving && self.state !== 'SEEK' && self.state !== 'RETURN' && self.state !== 'DEPOSIT') {
            self.state = 'MOVE';
        } else if (self.state !== 'ATTACK' && !isMoving) {
             if (self.state === 'MOVE') self.state = 'IDLE';
        }
    }
});

GeneLibrary.register({
    id: 'GENE_BOIDS',
    name: 'Boids Physics',
    onMove: (self, velocity, dt, engine, params) => {
        if (self.state === 'ATTACK' || self.stats.speed <= 0) return;

        const frame = Math.floor(Date.now() / 32); 
        const shouldUpdate = (frame + self.id) % 3 === 0;

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
            // Small jitter for "organic" look
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
        velocity.y *= mult;
    }
});

GeneLibrary.register({
    id: 'GENE_MELEE_ATTACK',
    name: 'Melee Strike',
    onPreAttack: (self, target, engine, params) => {
        engine.events.emit('FX', { type: 'SLASH', x: self.x, y: self.y, targetX: target.x, targetY: target.y, color: ELEMENT_COLORS[self.stats.element] || 0xffffff });
        engine.events.emit('FX', { type: 'FLASH', x: target.x + (Math.random() * 10 - 5), y: target.y - 10, color: ELEMENT_COLORS[self.stats.element] || 0xffffff });
        engine.events.emit('REQUEST_DAMAGE_PIPELINE', { source: self, target });
        return false;
    }
});

GeneLibrary.register({
    id: 'GENE_RANGED_ATTACK',
    name: 'Ranged Projectile',
    onPreAttack: (self, target, engine, params) => {
        const color = params.projectileColor || ELEMENT_COLORS[self.stats.element] || 0xffffff;
        engine.events.emit('FX', { type: 'PROJECTILE', x: self.x, y: self.y - 15, x2: target.x, y2: target.y - 15, color });
        engine.events.emit('REQUEST_DAMAGE_PIPELINE', { source: self, target });
        return false;
    }
});

GeneLibrary.register({
    id: 'GENE_ARTILLERY_ATTACK',
    name: 'Lobbed Shot',
    onPreAttack: (self, target, engine, params) => {
        const color = params.color || ELEMENT_COLORS[self.stats.element] || 0xff7777;
        engine.events.emit('FX', { type: 'PROJECTILE', x: self.x, y: self.y - (params.arcHeight || 20), x2: target.x, y2: target.y, color });
        engine.events.emit('REQUEST_DAMAGE_PIPELINE', { source: self, target });
        return false;
    }
});

GeneLibrary.register({
    id: 'GENE_CLEAVE_ATTACK',
    name: 'Cleave',
    onPreAttack: (self, target, engine, params) => {
        const color = ELEMENT_COLORS[self.stats.element] || 0xffff00;
        engine.events.emit('FX', { type: 'FLASH', x: target.x, y: target.y, color });

        const radius = params.radius || 40;
        engine.events.emit('FX', { type: 'SHOCKWAVE', x: target.x, y: target.y, radius, color });
        
        engine.events.emit('REQUEST_DAMAGE_PIPELINE', { source: self, target });
        
        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(target.x, target.y, radius, neighbors);
        
        const targets: IUnit[] = [];
        for(let i=0; i<count; i++) targets.push(neighbors[i]);

        for (const n of targets) {
            if (n !== target && n.faction !== self.faction && !n.isDead) {
                engine.events.emit('REQUEST_DAMAGE_PIPELINE', { source: self, target: n });
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

        if (el === 'THERMAL') engine.events.emit('REQUEST_STATUS', { target, type: 'BURNING', stacks: amount, duration: 5 });
        if (el === 'CRYO') engine.events.emit('REQUEST_STATUS', { target, type: 'FROZEN', stacks: amount, duration: 5 });
        if (el === 'VOLTAIC') engine.events.emit('REQUEST_STATUS', { target, type: 'SHOCKED', stacks: amount, duration: 5 });
        if (el === 'TOXIN') engine.events.emit('REQUEST_STATUS', { target, type: 'POISONED', stacks: amount, duration: 5 });
        
        engine.events.emit('FX', { type: 'PARTICLES', x: target.x, y: target.y, color: ELEMENT_COLORS[el] || 0xffffff, count: 3 });
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
            if (Math.random() < 0.05) engine.events.emit('FX', { type: 'HEAL', x: self.x, y: self.y });
        }
    }
});

GeneLibrary.register({
    id: 'GENE_EXPLODE_ON_DEATH',
    name: 'Volatile',
    onDeath: (self, engine, params) => {
        const radius = params.radius || 60;
        const dmg = params.damage || 40;
        engine.events.emit('FX', { type: 'EXPLOSION', x: self.x, y: self.y, radius, color: ELEMENT_COLORS[self.stats.element] });
        engine.events.emit('FX', { type: 'SHOCKWAVE', x: self.x, y: self.y, radius, color: ELEMENT_COLORS[self.stats.element] });

        const neighbors = engine._sharedQueryBuffer;
        const count = engine.spatialHash.query(self.x, self.y, radius, neighbors);
        
        const targets: IUnit[] = [];
        for(let i=0; i<count; i++) targets.push(neighbors[i]);

        for (const n of targets) {
            if (n.faction !== self.faction && !n.isDead) {
                engine.events.emit('REQUEST_TRUE_DAMAGE', { target: n, amount: dmg });
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
        const speedMult = self.statuses['SLOWED'] ? 0.5 : 1.0;
        velocity.x += self.wanderDir * self.stats.speed * 0.3 * speedMult * dt;
        velocity.y += (Math.random() - 0.5) * 0.5;
        self.state = 'WANDER';
    }
});
