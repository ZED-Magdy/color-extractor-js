import { ImageData, PaletteEntry } from '../types';
import { ImageDecoder } from './ImageDecoder';

const RGBA_CHANNELS = 4;
const RGB_SHIFT_VALUES = { RED: 16, GREEN: 8, BLUE: 0 };
const ALPHA_OPAQUE = 255;
const RGB_MAX = 255;

export class Palette implements Iterable<[number, number]> {
  private colors = new Map<number, number>();

  get length(): number {
    return this.colors.size;
  }

  static fromImageData(imageData: ImageData, backgroundColor?: number): Palette {
    const palette = new Palette();
    if (imageData.width === 0 || imageData.height === 0) return palette;

    const { data } = imageData;
    const pixelCount = imageData.width * imageData.height;

    let bgR = 0, bgG = 0, bgB = 0;
    if (backgroundColor !== undefined) {
      bgR = (backgroundColor >> RGB_SHIFT_VALUES.RED) & RGB_MAX;
      bgG = (backgroundColor >> RGB_SHIFT_VALUES.GREEN) & RGB_MAX;
      bgB = backgroundColor & RGB_MAX;
    }

    for (let i = 0; i < pixelCount; i++) {
      const pixelIndex = i * RGBA_CHANNELS;
      let r = data[pixelIndex];
      let g = data[pixelIndex + 1];
      let b = data[pixelIndex + 2];
      const alpha = data[pixelIndex + 3];

      if (alpha === 0 && backgroundColor === undefined) continue;

      if (alpha < ALPHA_OPAQUE && backgroundColor !== undefined) {
        const alphaRatio = alpha / RGB_MAX;
        const invAlphaRatio = 1 - alphaRatio;
        r = Math.floor(r * alphaRatio + bgR * invAlphaRatio);
        g = Math.floor(g * alphaRatio + bgG * invAlphaRatio);
        b = Math.floor(b * alphaRatio + bgB * invAlphaRatio);
      } else if (alpha < ALPHA_OPAQUE) {
        continue;
      }

      const color = (r << RGB_SHIFT_VALUES.RED) | (g << RGB_SHIFT_VALUES.GREEN) | b;
      palette.colors.set(color, (palette.colors.get(color) || 0) + 1);
    }

    return palette;
  }

  static async fromTestImage(width = 10, height = 10, backgroundColor?: number): Promise<Palette> {
    const imageData = ImageDecoder.createTestImage(width, height);
    return this.fromImageData(imageData, backgroundColor);
  }

  static async fromSolidColor(width: number, height: number, r: number, g: number, b: number, a = ALPHA_OPAQUE): Promise<Palette> {
    const imageData = ImageDecoder.createSolidImage(width, height, r, g, b, a);
    return this.fromImageData(imageData);
  }

  getMostUsedColors(limit?: number): PaletteEntry[] {
    const entries = Array.from(this.colors.entries()).map(([color, count]) => ({ color, count }));
    entries.sort((a, b) => b.count - a.count);
    return limit ? entries.slice(0, limit) : entries;
  }

  *[Symbol.iterator](): Iterator<[number, number]> {
    yield* this.colors.entries();
  }
} 