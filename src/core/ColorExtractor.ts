import { Palette } from './Palette';
import { LabColor, ExtractorOptions } from '../types';

const RGB_MAX = 255;
const SRGB_THRESHOLD = 0.03928;
const SRGB_FACTOR = 12.92;
const XYZ_CONSTANTS = {
  WHITE_POINT: { X: 0.95047, Y: 1, Z: 1.08883 },
  THRESHOLD: 216 / 24389,
  FACTOR: 841 / 108,
  OFFSET: 4 / 29,
};
const LAB_CONVERSION_MATRIX = {
  X: [0.4124564, 0.3575761, 0.1804375],
  Y: [0.2126729, 0.7151522, 0.0721750],
  Z: [0.0193339, 0.1191920, 0.9503041],
};
const DEFAULT_OPTIONS: Required<ExtractorOptions> = {
  useCache: true,
  maxCacheSize: 10000,
  batchSize: 1000,
};

export class ColorExtractor {
  private palette: Palette;
  private sortedColors: number[] | null = null;
  private labCache = new Map<number, LabColor>();
  private options: Required<ExtractorOptions>;

  constructor(palette: Palette, options: ExtractorOptions = {}) {
    this.palette = palette;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async extract(colorCount = 1): Promise<number[]> {
    if (colorCount === 0) return [];
    
    if (!this.sortedColors) {
      await this.initialize();
    }
    
    return this.mergeColors(this.sortedColors!, colorCount, 100 / colorCount);
  }

  private async initialize(): Promise<void> {
    const entries = Array.from(this.palette);
    if (entries.length === 0) {
      this.sortedColors = [];
      return;
    }

    const priorities = new Array(entries.length);
    let index = 0;

    for (const [color, count] of entries) {
      const labColor = this.getLabColor(color);
      const chromaDistance = Math.sqrt(labColor.a * labColor.a + labColor.b * labColor.b) || 1;
      const lightnessWeight = 1 - labColor.L * 0.005;
      const frequencyWeight = Math.sqrt(count);
      
      priorities[index++] = {
        color,
        priority: chromaDistance * lightnessWeight * frequencyWeight,
      };

      if (index % this.options.batchSize === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    priorities.sort((a, b) => b.priority - a.priority);
    this.sortedColors = priorities.map(item => item.color);
  }

  private mergeColors(colors: number[], limit: number, maxDelta: number): number[] {
    const actualLimit = Math.min(colors.length, limit);
    if (actualLimit <= 1) return colors.slice(0, actualLimit);

    const result: number[] = [];
    const labColors: LabColor[] = [];
    const spatialGrid = new Map<string, number[]>();
    const gridSize = 20;

    for (const color of colors) {
      if (result.length >= actualLimit) break;

      const colorLab = this.getLabColor(color);
      const gridKey = this.getGridKey(colorLab, gridSize);
      const nearbyIndices = spatialGrid.get(gridKey) || [];
      
      let merged = false;
      for (const nearbyIndex of nearbyIndices) {
        if (this.calculateDeltaE(colorLab, labColors[nearbyIndex]) < maxDelta) {
          merged = true;
          break;
        }
      }

      if (!merged) {
        const resultIndex = result.length;
        result.push(color);
        labColors.push(colorLab);
        
        if (!spatialGrid.has(gridKey)) {
          spatialGrid.set(gridKey, []);
        }
        spatialGrid.get(gridKey)!.push(resultIndex);
      }
    }

    return result;
  }

  private getLabColor(color: number): LabColor {
    if (!this.options.useCache) {
      return this.convertToLab(color);
    }

    let labColor = this.labCache.get(color);
    if (!labColor) {
      if (this.labCache.size >= this.options.maxCacheSize) {
        this.labCache.clear();
      }
      labColor = this.convertToLab(color);
      this.labCache.set(color, labColor);
    }
    return labColor;
  }

  private convertToLab(color: number): LabColor {
    const r = (color >> 16) & RGB_MAX;
    const g = (color >> 8) & RGB_MAX;
    const b = color & RGB_MAX;

    const sR = this.rgbToSrgb(r / RGB_MAX);
    const sG = this.rgbToSrgb(g / RGB_MAX);
    const sB = this.rgbToSrgb(b / RGB_MAX);

    const x = LAB_CONVERSION_MATRIX.X[0] * sR + LAB_CONVERSION_MATRIX.X[1] * sG + LAB_CONVERSION_MATRIX.X[2] * sB;
    const y = LAB_CONVERSION_MATRIX.Y[0] * sR + LAB_CONVERSION_MATRIX.Y[1] * sG + LAB_CONVERSION_MATRIX.Y[2] * sB;
    const z = LAB_CONVERSION_MATRIX.Z[0] * sR + LAB_CONVERSION_MATRIX.Z[1] * sG + LAB_CONVERSION_MATRIX.Z[2] * sB;

    return this.xyzToLab(x, y, z);
  }

  private rgbToSrgb(value: number): number {
    return value <= SRGB_THRESHOLD 
      ? value / SRGB_FACTOR
      : Math.pow((value + 0.055) / 1.055, 2.4);
  }

  private xyzToLab(x: number, y: number, z: number): LabColor {
    const fx = this.xyzToLabStep(x / XYZ_CONSTANTS.WHITE_POINT.X);
    const fy = this.xyzToLabStep(y / XYZ_CONSTANTS.WHITE_POINT.Y);
    const fz = this.xyzToLabStep(z / XYZ_CONSTANTS.WHITE_POINT.Z);

    return {
      L: 116 * fy - 16,
      a: 500 * (fx - fy),
      b: 200 * (fy - fz),
    };
  }

  private xyzToLabStep(value: number): number {
    return value > XYZ_CONSTANTS.THRESHOLD 
      ? Math.pow(value, 1 / 3) 
      : XYZ_CONSTANTS.FACTOR * value + XYZ_CONSTANTS.OFFSET;
  }

  private calculateDeltaE(lab1: LabColor, lab2: LabColor): number {
    const deltaL = lab2.L - lab1.L;
    const deltaA = lab2.a - lab1.a;
    const deltaB = lab2.b - lab1.b;
    
    if (Math.abs(deltaL) > 50) return 100;
    
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  private getGridKey(labColor: LabColor, gridSize: number): string {
    const lKey = Math.floor(labColor.L / gridSize);
    const aKey = Math.floor((labColor.a + 128) / gridSize);
    const bKey = Math.floor((labColor.b + 128) / gridSize);
    return `${lKey},${aKey},${bKey}`;
  }

  clearCache(): void {
    this.labCache.clear();
    this.sortedColors = null;
  }
} 