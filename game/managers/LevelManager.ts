

import { DataManager, SimpleEventEmitter } from '../DataManager';
import { UnitPool } from '../Unit';
import { ObstacleDef, Faction, UnitType } from '../../types';
import { TERRAIN_CHUNKS } from '../../config/terrain';
import { STAGE_WIDTH } from '../../constants';
import { FlowField } from '../FlowField';

// 只有两种状态：
// LOCKED: 存在必须消灭的敌人或建筑，摄像机锁定，流场指向目标。
// UNLOCKED: 目标已清除，摄像机自动向右平移，流场指向右侧，直到遇到下一关触发线。
type LevelState = 'LOCKED' | 'UNLOCKED';

export class LevelManager {
    public activeRegionId: number = 0;
    public currentStageIndex: number = 0;
    
    // 摄像机目标位置
    public cameraX: number = 0;
    private targetCameraX: number = 0;
    
    public activeObstacles: ObstacleDef[] = [];
    public currentState: LevelState = 'UNLOCKED';
    
    // 阻碍推进的关键目标集合（通常是墙，也可以扩展为特定单位）
    private blockers: Set<ObstacleDef> = new Set();

    private unitPool: UnitPool;
    private events: SimpleEventEmitter;
    private lastGeneratedStage: number = -1;
    public flowField: FlowField;

    constructor(unitPool: UnitPool, events: SimpleEventEmitter) {
        this.unitPool = unitPool;
        this.events = events;
        this.flowField = new FlowField();
    }

    public loadRegion(regionId: number) {
        this.activeRegionId = regionId;
        const saved = DataManager.instance.state.world.regions[regionId];
        this.currentStageIndex = Math.floor(saved ? saved.devourProgress : 0);
        
        // 重置位置
        this.cameraX = this.currentStageIndex * STAGE_WIDTH;
        this.targetCameraX = this.cameraX;
        
        // 清理旧状态
        this.activeObstacles = [];
        this.blockers.clear();
        this.lastGeneratedStage = -1;
        this.currentState = 'UNLOCKED';

        // 初始生成
        this.generateChunk(this.currentStageIndex);
        this.generateChunk(this.currentStageIndex + 1);
        
        // 强制更新一次流场
        this.updateFlowField();
    }

    public update(dt: number, activeUnits: any[]) {
        // --- 1. 状态检测与转换 ---
        
        if (this.currentState === 'LOCKED') {
            // 检查阻挡者是否被全部消灭
            // (注意：这里需要在 damageObstacle 中维护 blockers 集合)
            if (this.blockers.size === 0) {
                this.unlockStage();
            }
        } 
        
        if (this.currentState === 'UNLOCKED') {
            // 自动推进摄像机
            // 速度可以根据游戏节奏调整，或者根据虫群领头位置动态调整
            const advanceSpeed = 200; 
            this.targetCameraX += advanceSpeed * dt;
            
            // 检查是否到达了下一个“关卡触发线”
            // 假设每个 Stage 的中心或末尾是战斗点
            const nextStageX = (this.currentStageIndex + 1) * STAGE_WIDTH;
            
            // 如果摄像机推到了下一关的范围，尝试生成并锁定
            if (this.targetCameraX >= nextStageX - 200) { // 提前一点锁定
                this.currentStageIndex++;
                this.generateChunk(this.currentStageIndex + 1); // 预生成再下一关
                this.tryLockStage(this.currentStageIndex);
            }
        }

        // --- 2. 摄像机平滑移动 ---
        // 简单的线性插值
        this.cameraX += (this.targetCameraX - this.cameraX) * 0.1;

        // --- 3. 流场更新 (频率优化：可以每几帧更新一次) ---
        this.updateFlowField();
        
        // --- 4. 清理视野外物体 ---
        this.cullOldObstacles();
    }

    private tryLockStage(stageIndex: number) {
        // 检查当前 Stage 区域内是否有阻挡物（墙）
        const stageStartX = stageIndex * STAGE_WIDTH;
        const stageEndX = stageStartX + STAGE_WIDTH;
        
        const newBlockers = this.activeObstacles.filter(obs => {
            // 在当前关卡范围内 & 是墙 & 活着
            return obs.x >= stageStartX && obs.x < stageEndX && obs.type === 'WALL' && (obs.health || 0) > 0;
        });

        if (newBlockers.length > 0) {
            // 发现阻挡物，锁定战斗！
            newBlockers.forEach(b => this.blockers.add(b));
            this.currentState = 'LOCKED';
            this.events.emit('FX', { type: 'TEXT', x: this.cameraX + 600, y: 0, text: "SIEGE START", color: 0xff0000, fontSize: 30 });
            
            // 锁定摄像机目标，使其不再自动前移，专注于当前战场
            // 这里可以设为阻挡物的中心位置
            this.targetCameraX = stageStartX; 
        } else {
            // 如果这一关没有墙（比如纯兵线），就不锁定，直接冲过去
            // 或者你可以选择检测“敌方单位数量”来锁定
            // 目前只实现基于墙的攻坚逻辑
        }
    }

    private unlockStage() {
        this.currentState = 'UNLOCKED';
        this.events.emit('FX', { type: 'TEXT', x: this.cameraX + 600, y: 0, text: "BREACHED!", color: 0x00ff00, fontSize: 30 });
        
        // 记录进度
        DataManager.instance.updateRegionProgress(this.activeRegionId, 1);
    }

    public generateChunk(stageIndex: number) {
        if (stageIndex <= this.lastGeneratedStage && this.lastGeneratedStage !== -1) return;
        this.lastGeneratedStage = stageIndex;

        const templates = TERRAIN_CHUNKS['DEFAULT'] || [];
        const template = templates[stageIndex % templates.length];
        const stageOffsetX = stageIndex * STAGE_WIDTH;
        
        const newObstacles = template.obstacles.map(def => ({ 
            ...def, 
            x: def.x + stageOffsetX, 
            maxHealth: def.health, 
            health: def.health,
            chunkId: `${stageIndex}_${template.id}`
        }));
        
        this.activeObstacles.push(...newObstacles);
        this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
        
        // 生成敌人
        const difficultyLevel = (this.activeRegionId * 5) + stageIndex;
        template.spawnPoints.forEach(sp => {
            this.unitPool.spawn(
                Faction.HUMAN, 
                sp.type as UnitType, 
                sp.x + stageOffsetX, 
                DataManager.instance.modifiers, 
                difficultyLevel
            );
        });
    }

    public damageObstacle(obs: ObstacleDef, dmg: number): boolean {
        if (!obs.health) return false;
        obs.health -= dmg;
        if (obs.health <= 0) {
            // 移除障碍物
            this.activeObstacles = this.activeObstacles.filter(o => o !== obs);
            
            // 从阻挡列表中移除
            if (this.blockers.has(obs)) {
                this.blockers.delete(obs);
            }
            
            this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
            // 此时不用手动调用 unlock，下一帧 update 会检测 blockers.size === 0 自动解锁
            return true;
        }
        return false;
    }

    private cullOldObstacles() {
        const thresholdX = this.cameraX - STAGE_WIDTH;
        const count = this.activeObstacles.length;
        this.activeObstacles = this.activeObstacles.filter(o => o.x > thresholdX);
        if (this.activeObstacles.length !== count) {
             this.events.emit('TERRAIN_UPDATE', this.activeObstacles);
        }
    }

    private updateFlowField() {
        // 只计算当前屏幕附近的流场
        const startX = Math.max(0, this.cameraX - 200);
        const endX = this.cameraX + STAGE_WIDTH + 200;
        
        // 如果处于锁定状态，Blockers 就是流场的目标（吸引子）
        // 如果处于解锁状态，没有目标，流场自然向右
        const targets = Array.from(this.blockers);
        
        this.flowField.update(this.activeObstacles, targets, startX, endX);
    }
    
    public getFlowVector(x: number, y: number) {
        return this.flowField.getVector(x, y);
    }
}