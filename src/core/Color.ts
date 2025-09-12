import { RgbColor } from '../types';

const HEX_RADIX = 16;
const RGB_MAX = 255;
const RED_SHIFT = 16;
const GREEN_SHIFT = 8;
const HEX_PAD_LENGTH = 6;

export class Color {
  static fromIntToHex(color: number): string {
    return '#' + color.toString(HEX_RADIX).toUpperCase().padStart(HEX_PAD_LENGTH, '0');
  }

  static fromHexToInt(hex: string): number {
    const cleanHex = hex.replace('#', '');
    return parseInt(cleanHex, HEX_RADIX);
  }

  static fromIntToRgb(color: number): RgbColor {
    return {
      r: (color >> RED_SHIFT) & RGB_MAX,
      g: (color >> GREEN_SHIFT) & RGB_MAX,
      b: color & RGB_MAX,
    };
  }

  static fromRgbToInt(rgb: RgbColor): number {
    return (rgb.r << RED_SHIFT) | (rgb.g << GREEN_SHIFT) | rgb.b;
  }
} 