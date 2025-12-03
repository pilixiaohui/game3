
import { IGameEngine, IUnit, Faction, StatusType, ObstacleDef } from '../../types';
import { UnitPool, Unit } from '../Unit';
import { SpatialHash } from '../SpatialHash';
import { LevelManager } from '../managers/LevelManager';
import { DataManager } from '../DataManager';
import { GeneLibrary, ReactionRegistry, StatusRegistry } from '../GeneSystem';
import { LANE_Y, DECAY_TIME, STATUS_CONFIG, ELEMENT_COLORS } from '../../constants';

export class CombatSystem {
    private engine: IGameEngine;
    private unitPool: UnitPool;
    private spatialHash: SpatialHash;
    private levelManager: LevelManager;

    constructor(engine: IGameEngine, unitPool: UnitPool, spatialHash: SpatialHash, levelManager: LevelManager) {
        this.engine = engine;
        this.unitPool = unitPool;
        this.spatialHash = spatialHash;
        this.levelManager = levelManager;

        // --- REGISTER EVENT LISTENERS FOR DECOUPLED LOGIC ---
        this.engine.events.on('REQUEST_TRUE_DAMAGE', (d: any) => this.dealTrueDamage(d.target, d.amount));
        this.engine.events.on('REQUEST_KILL', (d: any) => this.killUnit(d.target));
        this.engine.events.on('REQUEST_STATUS', (d: any) => this.applyStatus(d.target, d.type, d.stacks, d.duration));
        this.engine.events.on('REQUEST_DAMAGE_PIPELINE', (d: any) => this.processDamagePipeline(d.source, d.target));
        this.engine.events.on('REQUEST_ATTACK', (d: any) => this.performAttack(d.source, d.target));
    }

    public update(dt: number) {
        const allUnits = this.unitPool.getActiveUnits();
        
        // Rebuild Spatial Hash
        this.spatialHash.clear();
        for (const u of allUnits) {
            if (!u.isDead) this.spatialHash.insert(u);
        }

        for (const u of allUnits) {
            this.updateUnitLogic(u, dt);
        }
    }

    private updateUnitLogic(u: Unit, dt: number) {
        if (u.isDead) {
            u.decayTimer += dt;
            if (u.decayTimer > DECAY_TIME) this.unitPool.recycle(u);
            return;
        }

        // Status Effects
        for (const type in u.statuses) {
            const statusKey = type as StatusType;
            const effect = u.statuses[statusKey];
            if (effect) {
                effect.duration -= dt;
                StatusRegistry.onTick(u, statusKey, dt, this.engine);
                if (effect.duration <= 0) delete u.statuses[statusKey];
            }
        }

        // Genes & Movement
        const velocity = { x: 0, y: 0 };
        for (const gene of u.geneConfig) {
            const trait = GeneLibrary.get(gene.id);
            if (trait) {
                if (trait.onTick) trait.onTick(u, dt, this.engine, gene.params || {});
                // Hacky throttle for target updates
                if (trait.onUpdateTarget && (Math.random() < 0.1)) {
                   trait.onUpdateTarget(u, dt, this.engine, gene.params || {});
                }
                if (trait.onMove) trait.onMove(u, velocity, dt, this.engine, gene.params || {});
            }
        }
        
        let nextX = u.x + velocity.x;
        let nextY = u.y + velocity.y;
        
        // Wall Collision
        const wallHit = this.checkWallCollision(nextX, nextY, u.radius);
        if (wallHit) {
            nextX = u.x; 
            if (u.faction === Faction.ZERG) {
                 u.attackCooldown -= dt;
                 if (u.attackCooldown <= 0) {
                     u.attackCooldown = u.stats.attackSpeed;
                     const destroyed = this.levelManager.damageObstacle(wallHit, u.stats.damage);
                     if (destroyed) {
                         this.engine.events.emit('FX', { type: 'EXPLOSION', x: wallHit.x, y: LANE_Y + wallHit.y - wallHit.height/2, radius: 100, color: 0x555555 });
                     }
                     this.engine.events.emit('FX', { type: 'SLASH', x: wallHit.x - 20, y: u.y, targetX: wallHit.x, targetY: u.y, color: 0xff0000 });
                 }
            }
        }

        // Clamp Y
        if (nextY < -200) nextY = -200;
        if (nextY > 200) nextY = 200;
        
        u.x = nextX;
        u.y = nextY;
    }

    private checkWallCollision(x: number, y: number, r: number): ObstacleDef | null {
        for (const obs of this.levelManager.activeObstacles) {
            if (obs.type === 'WALL') {
               if (x + r > obs.x - obs.width/2 && x - r < obs.x + obs.width/2 &&
                   y > LANE_Y + obs.y - obs.height && y < LANE_Y + obs.y) return obs;
            }
        }
        return null;
    }

    // --- Internal Logic ---

    private dealTrueDamage(target: IUnit, amount: number) {
        if (target.isDead) return;
        target.stats.hp -= amount;
        if (target.stats.hp <= 0) { target.stats.hp = 0; this.killUnit(target); }
    }

    private killUnit(u: IUnit) {
        if (u.isDead) return;
        u.isDead = true;
        if (u.faction === Faction.HUMAN) {
            DataManager.instance.modifyResource('biomass', 5 * u.level);
            DataManager.instance.recordKill();
            if (Math.random() < 0.2) DataManager.instance.modifyResource('dna', 1);
            if (u.id % 5 === 0) DataManager.instance.updateRegionProgress(this.levelManager.activeRegionId, 1);
        }
        for (const gene of u.geneConfig) {
            const trait = GeneLibrary.get(gene.id);
            if (trait && trait.onDeath) trait.onDeath(u, this.engine, gene.params || {});
        }
    }

    private applyStatus(target: IUnit, type: StatusType, stacks: number, duration: number) {
        if (target.isDead) return;
        if (!target.statuses[type]) target.statuses[type] = { type, stacks: 0, duration: 0 };
        const s = target.statuses[type]!;
        s.stacks = Math.min(s.stacks + stacks, STATUS_CONFIG.MAX_STACKS);
        s.duration = Math.max(s.duration, duration);
    }

    private processDamagePipeline(source: IUnit, target: IUnit) {
        if (target.isDead || source.isDead) return;
        let damage = source.stats.damage;
        
        // 1. Source Modifiers
        if (Math.random() < source.stats.critChance) { 
            damage *= source.stats.critDamage; 
            this.engine.events.emit('FX', { type: 'TEXT', x: target.x, y: target.y - 30, text: "CRIT!", color: 0xff0000, fontSize: 16 });
        }
        if (source.statuses['FRENZY']) damage *= 1.25;
        for (const gene of source.geneConfig) { 
            const trait = GeneLibrary.get(gene.id); 
            if (trait && trait.onHit) trait.onHit(source, target, damage, this.engine, gene.params || {}); 
        }

        // 2. Mitigation
        let damageTaken = damage;
        if (source.stats.element === 'PHYSICAL') {
            let armor = target.stats.armor;
            if (target.statuses['ARMOR_BROKEN']) armor *= 0.5;
            damageTaken = damage * (100 / (100 + armor));
        }
        for (const gene of target.geneConfig) { 
            const trait = GeneLibrary.get(gene.id); 
            if (trait && trait.onWasHit) damageTaken = trait.onWasHit(target, source, damageTaken, this.engine, gene.params || {}); 
        }

        // 3. Application
        target.stats.hp -= damageTaken;
        this.engine.events.emit('FX', { 
            type: 'DAMAGE_POP', 
            x: target.x, y: target.y - 10, 
            text: Math.floor(damageTaken).toString(), 
            color: ELEMENT_COLORS[source.stats.element as keyof typeof ELEMENT_COLORS] || 0xffffff,
            fontSize: 14
        });
        
        ReactionRegistry.handle(target, source.stats.element, this.engine, damageTaken);

        if (target.stats.hp <= 0) { 
            target.stats.hp = 0; 
            this.killUnit(target); 
            for (const gene of source.geneConfig) { 
                const trait = GeneLibrary.get(gene.id); 
                if (trait && trait.onKill) trait.onKill(source, target, this.engine, gene.params || {}); 
            } 
        }
    }

    private performAttack(source: IUnit, target: IUnit) {
        if (source.isDead || target.isDead) return;
        let proceed = true;
        for (const gene of source.geneConfig) { 
            const trait = GeneLibrary.get(gene.id); 
            if (trait && trait.onPreAttack) { 
                const result = trait.onPreAttack(source, target, this.engine, gene.params || {}); 
                if (result === false) proceed = false; 
            } 
        }
        if (proceed) this.processDamagePipeline(source, target);
    }
}
