

import { ObstacleDef } from '../types';
import { LANE_Y } from '../../constants';

export class FlowField {
    private cellSize: number = 40;
    private cols: number = 0;
    private rows: number = 0;
    private field: Float32Array; // x, y interleaved
    private offset: { x: number, y: number } = { x: 0, y: 0 };
    private width: number = 0;

    constructor() {
        this.field = new Float32Array(0);
    }

    public update(obstacles: ObstacleDef[], startX: number, endX: number) {
        this.offset.x = Math.floor(startX / this.cellSize) * this.cellSize;
        this.offset.y = -200; // Fixed vertical range covering lanes
        this.width = endX - startX + 400; // Buffer
        const height = 500; // -200 to +300

        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(height / this.cellSize);
        
        const size = this.cols * this.rows * 2;
        if (this.field.length < size) {
            this.field = new Float32Array(size);
        }
        
        const gridObstacles = new Uint8Array(this.cols * this.rows);
        const distanceField = new Float32Array(this.cols * this.rows).fill(9999);
        const queue: number[] = [];

        // 1. Mark Obstacles
        for (const obs of obstacles) {
             const ox = obs.x - this.offset.x;
             const oy = (LANE_Y + obs.y) - this.offset.y;
             
             // Convert obstacle bounds to grid coords
             const minCx = Math.floor((ox - obs.width/2) / this.cellSize);
             const maxCx = Math.floor((ox + obs.width/2) / this.cellSize);
             const minCy = Math.floor((oy - obs.height) / this.cellSize); // Obstacle y is bottom
             const maxCy = Math.floor(oy / this.cellSize);

             for (let cy = minCy; cy <= maxCy; cy++) {
                 for (let cx = minCx; cx <= maxCx; cx++) {
                     if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
                         gridObstacles[cy * this.cols + cx] = 1;
                     }
                 }
             }
        }

        // 2. Seed Goal (Right Edge)
        for (let y = 0; y < this.rows; y++) {
            const idx = y * this.cols + (this.cols - 1);
            if (gridObstacles[idx] === 0) {
                distanceField[idx] = 0;
                queue.push(idx);
            }
        }

        // 3. Flood Fill (Dijkstra)
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

        // 4. Generate Vectors
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const idx = y * this.cols + x;
                const fIdx = idx * 2;

                if (gridObstacles[idx] === 1) {
                    this.field[fIdx] = 0;
                    this.field[fIdx + 1] = 0;
                    continue;
                }
                
                let minDist = distanceField[idx];
                let vx = 0;
                let vy = 0;
                
                // Left
                if (x > 0 && distanceField[idx - 1] < minDist) { vx = -1; vy = 0; minDist = distanceField[idx-1]; }
                // Right
                if (x < this.cols - 1 && distanceField[idx + 1] < minDist) { vx = 1; vy = 0; minDist = distanceField[idx+1]; }
                // Up
                if (y > 0 && distanceField[idx - this.cols] < minDist) { vx = 0; vy = -1; minDist = distanceField[idx-this.cols]; }
                // Down
                if (y < this.rows - 1 && distanceField[idx + this.cols] < minDist) { vx = 0; vy = 1; minDist = distanceField[idx+this.cols]; }

                // Normalize if moving diagonally (simple check)
                if (vx !== 0 && vy !== 0) {
                    const len = Math.sqrt(vx*vx + vy*vy);
                    vx /= len;
                    vy /= len;
                }

                if (vx === 0 && vy === 0 && distanceField[idx] < 9999) {
                     // Fallback for local minima or end: point right
                     vx = 1;
                }

                this.field[fIdx] = vx;
                this.field[fIdx + 1] = vy;
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
        return { x: 1, y: 0 }; // Default forward
    }
}