import { ImageData, PaletteEntry } from '../types';

const RGBA_CHANNELS = 4;
const RGB_SHIFT_VALUES = { RED: 16, GREEN: 8, BLUE: 0 };
const ALPHA_OPAQUE = 255;
const RGB_MAX = 255;

export class Palette implements Iterable<[number, number]> {
  private colors = new Map<number, number>();

  get length(): number {
    return this.colors.size;
  }

  static async fromFilename(filename: string, backgroundColor?: number): Promise<Palette> {
    // Dynamic import to avoid bundling sharp in production
    const sharp = await import('sharp');
    
    try {
      const image = sharp.default(filename);
      const { width, height } = await image.metadata();
      
      if (!width || !height) {
        throw new Error(`Could not determine dimensions of ${filename}`);
      }
      
      // Convert to RGBA buffer
      const { data } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const imageData: ImageData = {
        width,
        height,
        data: new Uint8Array(data)
      };
      
      return this.fromImageData(imageData, backgroundColor);
    } catch (error) {
      throw new Error(`Failed to load image ${filename}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static fromImageData(imageData: ImageData, backgroundColor?: number): Palette {
    const palette = new Palette();
    
    for (let i = 0; i < imageData.data.length; i += RGBA_CHANNELS) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      
      if (a === 0) {
        if (backgroundColor === undefined) {
          continue;
        }
        const bgR = (backgroundColor >> RGB_SHIFT_VALUES.RED) & RGB_MAX;
        const bgG = (backgroundColor >> RGB_SHIFT_VALUES.GREEN) & RGB_MAX;
        const bgB = backgroundColor & RGB_MAX;
        const color = (bgR << RGB_SHIFT_VALUES.RED) | (bgG << RGB_SHIFT_VALUES.GREEN) | bgB;
        palette.colors.set(color, (palette.colors.get(color) || 0) + 1);
        continue;
      }

      const color = (r << RGB_SHIFT_VALUES.RED) | (g << RGB_SHIFT_VALUES.GREEN) | b;
      palette.colors.set(color, (palette.colors.get(color) || 0) + 1);
    }

    return palette;
  }

  getMostUsedColors(limit?: number): PaletteEntry[] {
    const entries = Array.from(this.colors.entries()).map(([color, count]) => ({ color, count }));
    entries.sort((a, b) => b.count - a.count);
    return limit ? entries.slice(0, limit) : entries;
  }

  getColorCount(color: number): number {
    return this.colors.get(color) || 0;
  }

  hasColor(color: number): boolean {
    return this.colors.has(color);
  }

  getAllColors(): number[] {
    return Array.from(this.colors.keys());
  }

  *[Symbol.iterator](): Iterator<[number, number]> {
    // Sort by count (descending) when iterating
    const sortedEntries = Array.from(this.colors.entries()).sort((a, b) => b[1] - a[1]);
    yield* sortedEntries;
  }
} 