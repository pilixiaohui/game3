

import { ObstacleDef } from '../types';
import { LANE_Y, MAP_PLAYABLE_HEIGHT } from '../../constants';

export class FlowField {
    private cellSize: number = 10;
    private cols: number = 0;
    private rows: number = 0;
    private field: Float32Array; 
    private offset: { x: number, y: number } = { x: 0, y: 0 };
    private width: number = 0;

    constructor() {
        this.field = new Float32Array(0);
    }

    /**
     * 统一更新逻辑：
     * @param obstacles 所有障碍物（用于避障）
     * @param targets 当前阶段必须摧毁的目标（作为流场的“终点/吸引子”）
     * @param startX 计算区域起点
     * @param endX 计算区域终点
     */
    public update(obstacles: ObstacleDef[], targets: ObstacleDef[], startX: number, endX: number) {
        // 动态计算覆盖范围，确保覆盖 expanded height
        this.offset.x = Math.floor(startX / this.cellSize) * this.cellSize;
        // Y轴范围覆盖整个可玩区域 + 缓冲区
        const totalHeight = MAP_PLAYABLE_HEIGHT * 2 + 200; 
        this.offset.y = -MAP_PLAYABLE_HEIGHT - 100; 

        this.width = endX - startX + 400;

        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(totalHeight / this.cellSize);
        
        const size = this.cols * this.rows * 2;
        if (this.field.length < size) {
            this.field = new Float32Array(size);
        }
        
        // 0 = 空地/目标, 1 = 阻挡
        const gridObstacles = new Uint8Array(this.cols * this.rows);
        const distanceField = new Float32Array(this.cols * this.rows).fill(9999);
        const queue: number[] = [];

        // 1. 标记障碍物 (Mark Obstacles)
        // 注意：目标(Targets)虽然是障碍物，但对流场来说它是“目的地”，不能标记为阻挡(1)
        for (const obs of obstacles) {
             if (targets.includes(obs)) continue; // 目标不是阻挡，是吸引点

             const ox = obs.x - this.offset.x;
             const oy = (LANE_Y + obs.y) - this.offset.y;
             
             const minCx = Math.floor((ox - obs.width/2) / this.cellSize);
             const maxCx = Math.floor((ox + obs.width/2) / this.cellSize);
             const minCy = Math.floor((oy - obs.height) / this.cellSize); 
             const maxCy = Math.floor(oy / this.cellSize);

             for (let cy = minCy; cy <= maxCy; cy++) {
                 for (let cx = minCx; cx <= maxCx; cx++) {
                     if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
                         gridObstacles[cy * this.cols + cx] = 1;
                     }
                 }
             }
        }

        // 2. 播种目标 (Seed Goals)
        // 逻辑：如果存在目标，流场指向目标。如果目标全灭，流场指向右边界。
        if (targets.length > 0) {
            for (const target of targets) {
                 const ox = target.x - this.offset.x;
                 const oy = (LANE_Y + target.y) - this.offset.y;
                 
                 // 将目标占据的格子设为距离 0
                 const minCx = Math.floor((ox - target.width/2) / this.cellSize);
                 const maxCx = Math.floor((ox + target.width/2) / this.cellSize);
                 const minCy = Math.floor((oy - target.height) / this.cellSize);
                 const maxCy = Math.floor(oy / this.cellSize);

                 for (let cy = minCy; cy <= maxCy; cy++) {
                     for (let cx = minCx; cx <= maxCx; cx++) {
                         if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
                             const idx = cy * this.cols + cx;
                             gridObstacles[idx] = 0; // 确保可通行
                             distanceField[idx] = 0; // 距离为0
                             queue.push(idx);
                         }
                     }
                 }
            }
        } else {
            // 没有目标（清场状态）：目标是向右推进
            for (let y = 0; y < this.rows; y++) {
                const idx = y * this.cols + (this.cols - 1);
                if (gridObstacles[idx] === 0) {
                    distanceField[idx] = 0;
                    queue.push(idx);
                }
            }
        }

        // 3. 泛洪计算 (Dijkstra)
        let head = 0;
        const updateNeighbor = (nIdx: number, dist: number) => {
            if (gridObstacles[nIdx] === 0 && distanceField[nIdx] > dist + 1) {
                distanceField[nIdx] = dist + 1;
                queue.push(nIdx);
            }
        };

        while(head < queue.length) {
            const idx = queue[head++];
            const dist = distanceField[idx];
            const cx = idx % this.cols;
            const cy = Math.floor(idx / this.cols);
            
            if (cx > 0) updateNeighbor(idx - 1, dist);
            if (cx < this.cols - 1) updateNeighbor(idx + 1, dist);
            if (cy > 0) updateNeighbor(idx - this.cols, dist);
            if (cy < this.rows - 1) updateNeighbor(idx + this.cols, dist);
        }

        // 4. 生成向量 (Generate Vectors)
        for (let i = 0; i < this.cols * this.rows; i++) {
            const fIdx = i * 2;
            if (gridObstacles[i] === 1) {
                this.field[fIdx] = 0; 
                this.field[fIdx + 1] = 0;
                continue;
            }

            const cx = i % this.cols;
            const cy = Math.floor(i / this.cols);
            let minDist = distanceField[i];
            let vx = 0, vy = 0;

            // 检查上下左右，寻找更小的 distance
            if (cx > 0 && distanceField[i-1] < minDist) { vx = -1; vy = 0; minDist = distanceField[i-1]; }
            if (cx < this.cols-1 && distanceField[i+1] < minDist) { vx = 1; vy = 0; minDist = distanceField[i+1]; }
            if (cy > 0 && distanceField[i-this.cols] < minDist) { vx = 0; vy = -1; minDist = distanceField[i-this.cols]; }
            if (cy < this.rows-1 && distanceField[i+this.cols] < minDist) { vx = 0; vy = 1; minDist = distanceField[i+this.cols]; }

            if (vx !== 0 || vy !== 0) {
                const len = Math.sqrt(vx*vx + vy*vy);
                this.field[fIdx] = vx / len;
                this.field[fIdx + 1] = vy / len;
            } else if (targets.length === 0 && distanceField[i] < 9999) {
                // 如果没有特定目标且没被卡住，默认向右流（防止死水区）
                this.field[fIdx] = 1;
                this.field[fIdx+1] = 0;
            }
        }
    }

    public getVector(x: number, y: number) {
        const cx = Math.floor((x - this.offset.x) / this.cellSize);
        const cy = Math.floor(((LANE_Y + y) - this.offset.y) / this.cellSize);
        
        if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
            const idx = (cy * this.cols + cx) * 2;
            return { x: this.field[idx], y: this.field[idx+1] };
        }
        // 超出范围，默认向右引导回正轨
        return { x: 1, y: 0 }; 
    }
}