
import { IUnit } from '../types';

export class SpatialHash {
    private cellSize: number;
    private grid: Map<number, IUnit[]>;

    constructor(cellSize: number = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    private getKey(x: number, y: number): number {
        // Bitwise packing: 16 bits for X, 16 bits for Y.
        // Range: -32768 to 32767 cells.
        // At 100px cell size, this covers +/- 3,276,800 pixels.
        const cx = Math.floor(x / this.cellSize) & 0xFFFF;
        const cy = Math.floor(y / this.cellSize) & 0xFFFF;
        return cx | (cy << 16);
    }

    /**
     * Optimized clear: Reuses arrays by setting length to 0.
     * Reduces GC pressure significantly by avoiding array reallocation.
     */
    public clear() {
        for (const cell of this.grid.values()) {
            cell.length = 0;
        }
    }

    public insert(unit: IUnit) {
        const key = this.getKey(unit.x, unit.y);
        let cell = this.grid.get(key);
        if (!cell) {
            cell = [];
            this.grid.set(key, cell);
        }
        cell.push(unit);
    }

    /**
     * Optimized query that populates an output array to avoid Garbage Collection pressure.
     * @param x Center X
     * @param y Center Y
     * @param radius Search Radius
     * @param out Output array (will be cleared/reused)
     * @returns number of items found
     */
    public query(x: number, y: number, radius: number, out: IUnit[]): number {
        out.length = 0; // Clear without deallocating
        const radiusSq = radius * radius;
        
        const startX = Math.floor((x - radius) / this.cellSize);
        const endX = Math.floor((x + radius) / this.cellSize);
        const startY = Math.floor((y - radius) / this.cellSize);
        const endY = Math.floor((y + radius) / this.cellSize);

        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                // Manually pack key to match getKey
                const key = (cx & 0xFFFF) | ((cy & 0xFFFF) << 16);
                const cell = this.grid.get(key);
                if (cell) {
                    const len = cell.length;
                    for (let i = 0; i < len; i++) {
                        const unit = cell[i];
                        if (!unit.active || unit.isDead) continue;
                        
                        const dx = unit.x - x;
                        const dy = unit.y - y;
                        if ((dx * dx + dy * dy) <= radiusSq) {
                            out.push(unit);
                        }
                    }
                }
            }
        }
        return out.length;
    }
}
