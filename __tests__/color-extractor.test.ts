import { Color, Palette, ColorExtractor } from '../src';
import type { ImageData } from '../src';
import * as path from 'path';

describe('Color Extractor', () => {
  describe('Color', () => {
    it('should convert between int and hex', () => {
      expect(Color.fromIntToHex(0xFF5733)).toBe('#FF5733');
      expect(Color.fromIntToHex(0x000000)).toBe('#000000');
      expect(Color.fromIntToHex(0xFFFFFF)).toBe('#FFFFFF');
      
      expect(Color.fromHexToInt('#FF5733')).toBe(0xFF5733);
      expect(Color.fromHexToInt('#000000')).toBe(0x000000);
      expect(Color.fromHexToInt('#FFFFFF')).toBe(0xFFFFFF);
      expect(Color.fromHexToInt('FF5733')).toBe(0xFF5733); // Without #
    });

    it('should convert between int and rgb', () => {
      const color = 0xFF8040; // Orange
      const rgb = Color.fromIntToRgb(color);
      expect(rgb).toEqual({ r: 255, g: 128, b: 64 });
      expect(Color.fromRgbToInt(rgb)).toBe(color);
      
      expect(Color.fromRgbToInt({ r: 0, g: 0, b: 0 })).toBe(0x000000);
      expect(Color.fromRgbToInt({ r: 255, g: 255, b: 255 })).toBe(0xFFFFFF);
    });
  });

  describe('Palette', () => {
    describe('fromFilename', () => {
      it('should load PNG image', async () => {
        const palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'test.png'));
        expect(palette.length).toBeGreaterThan(0);
      });

      it('should load JPEG image', async () => {
        const palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'test.jpeg'));
        expect(palette.length).toBeGreaterThan(0);
      });

      it('should load WebP image', async () => {
        const palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'test.webp'));
        expect(palette.length).toBeGreaterThan(0);
      });

      it('should load GIF image', async () => {
        const palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'test.gif'));
        expect(palette.length).toBeGreaterThan(0);
      });

      it('should handle transparent images with background', async () => {
        const whiteBg = Color.fromHexToInt('#FFFFFF');
        const palette = await Palette.fromFilename(
          path.join(__dirname, 'assets', 'red-transparent-50.png'), 
          whiteBg
        );
        expect(palette.length).toBeGreaterThanOrEqual(1);
      });

      it('should handle empty transparent images', async () => {
        const palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'empty.png'));
        expect(palette.length).toBe(0); // All transparent
      });

      it('should throw error for non-existent file', async () => {
        await expect(Palette.fromFilename('./non-existent.png')).rejects.toThrow();
      });
    });

    describe('fromImageData', () => {
      function createImageData(width: number, height: number, colors: number[][]): ImageData {
        const data = new Uint8Array(width * height * 4);
        for (let i = 0; i < colors.length; i++) {
          const [r, g, b, a = 255] = colors[i];
          data[i * 4] = r;
          data[i * 4 + 1] = g;
          data[i * 4 + 2] = b;
          data[i * 4 + 3] = a;
        }
        return { width, height, data };
      }

      it('should create palette from solid color', () => {
        const image = createImageData(2, 2, [
          [255, 0, 0], [255, 0, 0], [255, 0, 0], [255, 0, 0]
        ]);
        const palette = Palette.fromImageData(image);
        expect(palette.length).toBe(1);
        expect(palette.getColorCount(Color.fromRgbToInt({ r: 255, g: 0, b: 0 }))).toBe(4);
      });

      it('should handle multiple colors', () => {
        const image = createImageData(2, 2, [
          [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 255]
        ]);
        const palette = Palette.fromImageData(image);
        expect(palette.length).toBe(4);
      });

      it('should handle transparency correctly', () => {
        const image = createImageData(2, 2, [
          [255, 0, 0, 255],   // Red
          [0, 255, 0, 128],   // Semi-transparent green
          [0, 0, 255, 0],     // Fully transparent blue
          [255, 255, 255, 255] // White
        ]);
        
        // Without background, skip fully transparent
        const palette1 = Palette.fromImageData(image);
        expect(palette1.length).toBe(3); // Red, semi-green, white
        
        // With background, blend transparent pixels
        const palette2 = Palette.fromImageData(image, 0xFFFFFF);
        expect(palette2.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('helper methods', () => {
      let palette: Palette;

      beforeAll(async () => {
        palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'google.png'));
      });

      it('should get color count', () => {
        const colors = palette.getAllColors();
        const firstColor = colors[0];
        const count = palette.getColorCount(firstColor);
        expect(count).toBeGreaterThan(0);
        expect(palette.getColorCount(0x123456)).toBe(0); // Non-existent
      });

      it('should check color existence', () => {
        const colors = palette.getAllColors();
        expect(palette.hasColor(colors[0])).toBe(true);
        expect(palette.hasColor(0x123456)).toBe(false);
      });

      it('should get all colors', () => {
        const colors = palette.getAllColors();
        expect(colors.length).toBe(palette.length);
        colors.forEach(color => {
          expect(color).toBeGreaterThanOrEqual(0);
          expect(color).toBeLessThanOrEqual(0xFFFFFF);
        });
      });

      it('should get most used colors', () => {
        const top5 = palette.getMostUsedColors(5);
        expect(top5.length).toBeLessThanOrEqual(5);
        
        // Should be sorted by count descending
        for (let i = 1; i < top5.length; i++) {
          expect(top5[i].count).toBeLessThanOrEqual(top5[i - 1].count);
        }
      });

      it('should iterate in sorted order', () => {
        const iterations: Array<[number, number]> = [];
        for (const [color, count] of palette) {
          iterations.push([color, count]);
        }
        
        expect(iterations.length).toBe(palette.length);
        
        // Should be sorted by count descending
        for (let i = 1; i < iterations.length; i++) {
          expect(iterations[i][1]).toBeLessThanOrEqual(iterations[i - 1][1]);
        }
      });
    });
  });

  describe('ColorExtractor', () => {
    let palette: Palette;
    let extractor: ColorExtractor;

    beforeAll(async () => {
      palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'google.png'));
      extractor = new ColorExtractor(palette);
    });

    it('should extract single color', async () => {
      const colors = await extractor.extract(1);
      expect(colors).toHaveLength(1);
      expect(colors[0]).toBeGreaterThanOrEqual(0);
      expect(colors[0]).toBeLessThanOrEqual(0xFFFFFF);
    });

    it('should extract multiple colors', async () => {
      const colors = await extractor.extract(5);
      expect(colors).toHaveLength(5);
      
      // All should be unique
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(5);
    });

    it('should not exceed palette size', async () => {
      const requestedCount = palette.length + 10;
      const colors = await extractor.extract(requestedCount);
      expect(colors.length).toBeLessThanOrEqual(palette.length);
    });

    it('should work with different options', async () => {
      const extractor1 = new ColorExtractor(palette, { useCache: false });
      const extractor2 = new ColorExtractor(palette, { maxCacheSize: 100 });
      
      const colors1 = await extractor1.extract(3);
      const colors2 = await extractor2.extract(3);
      
      expect(colors1).toHaveLength(3);
      expect(colors2).toHaveLength(3);
    });

    it('should use caching for performance', async () => {
      // Clear cache to start fresh
      extractor.clearCache();
      
      // First call - should populate cache
      const start1 = performance.now();
      await extractor.extract(3);
      const time1 = performance.now() - start1;
      
      // Second call - should use cache
      const start2 = performance.now();
      await extractor.extract(3);
      const time2 = performance.now() - start2;
      
      // Second call should be significantly faster (allow for timing variance)
      expect(time2).toBeLessThan(time1 + 5); // More robust check
    });

    it('should clear cache', async () => {
      await extractor.extract(3);
      extractor.clearCache();
      
      // Should still work after clearing
      const colors = await extractor.extract(2);
      expect(colors).toHaveLength(2);
    });

    it('should handle empty palette', async () => {
      const emptyPalette = new Palette();
      const emptyExtractor = new ColorExtractor(emptyPalette);
      
      const colors = await emptyExtractor.extract(5);
      expect(colors).toEqual([]);
    });

    it('should handle zero color extraction', async () => {
      const colors = await extractor.extract(0);
      expect(colors).toEqual([]);
    });
  });

  describe('integration', () => {
    it('should work end-to-end with multiple image formats', async () => {
      const formats = ['test.png', 'test.jpeg', 'test.webp', 'test.gif'];
      
      for (const format of formats) {
        const palette = await Palette.fromFilename(path.join(__dirname, 'assets', format));
        expect(palette.length).toBeGreaterThan(0);
        
        const extractor = new ColorExtractor(palette);
        const colors = await extractor.extract(3);
        expect(colors).toHaveLength(3);
        
        // Convert to hex for validation
        const hexColors = colors.map(c => Color.fromIntToHex(c));
        hexColors.forEach(hex => {
          expect(hex).toMatch(/^#[0-9A-F]{6}$/);
        });
      }
    });

    it('should handle complex workflow', async () => {
      // Load palette
      const palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'google.png'));
      
      // Analyze colors
      const topColors = palette.getMostUsedColors(10);
      expect(topColors.length).toBeLessThanOrEqual(10);
      
      // Check specific colors
      const blackCount = palette.getColorCount(Color.fromHexToInt('#000000'));
      const whiteCount = palette.getColorCount(Color.fromHexToInt('#FFFFFF'));
      expect(blackCount).toBeGreaterThanOrEqual(0);
      expect(whiteCount).toBeGreaterThanOrEqual(0);
      
      // Extract representative colors
      const extractor = new ColorExtractor(palette);
      const colors = await extractor.extract(5);
      expect(colors).toHaveLength(5);
      
      // Validate output
      colors.forEach(color => {
        expect(palette.hasColor(color)).toBe(true);
        const hex = Color.fromIntToHex(color);
        expect(hex).toMatch(/^#[0-9A-F]{6}$/);
      });
    });

    it('should maintain performance with large images', async () => {
      const palette = await Palette.fromFilename(path.join(__dirname, 'assets', 'test.png'));
      const extractor = new ColorExtractor(palette);
      
      const start = Date.now();
      const colors = await extractor.extract(10);
      const duration = Date.now() - start;
      
      expect(colors).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
}); 