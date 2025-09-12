import { RgbColor } from '../types';

const HEX_RADIX = 16;
const RGB_MAX = 255;
const RED_SHIFT = 16;
const GREEN_SHIFT = 8;
const HEX_PAD_LENGTH = 6;

export class Color {
  static toHex(color: number, includeHash = true): string {
    const hex = color.toString(HEX_RADIX).toUpperCase().padStart(HEX_PAD_LENGTH, '0');
    return includeHash ? `#${hex}` : hex;
  }

  static fromHex(hex: string): number {
    const cleanHex = hex.replace('#', '');
    return parseInt(cleanHex, HEX_RADIX);
  }

  static toRgb(color: number): RgbColor {
    return {
      r: (color >> RED_SHIFT) & RGB_MAX,
      g: (color >> GREEN_SHIFT) & RGB_MAX,
      b: color & RGB_MAX,
    };
  }

  static fromRgb({ r, g, b }: RgbColor): number {
    return (r << RED_SHIFT) | (g << GREEN_SHIFT) | b;
  }
} 