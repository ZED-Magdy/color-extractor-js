export interface ImageData {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface LabColor {
  L: number;
  a: number;
  b: number;
}

export interface XyzColor {
  X: number;
  Y: number;
  Z: number;
}

export interface PaletteEntry {
  color: number;
  count: number;
}

export interface ExtractorOptions {
  useCache?: boolean;
  maxCacheSize?: number;
  batchSize?: number;
}

export type ColorFormat = 'hex' | 'rgb' | 'int'; 