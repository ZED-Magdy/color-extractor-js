import { Color, Palette, ColorExtractor, ImageDecoder } from '../src';
import type { ImageData, RgbColor } from '../src';

describe('Color Extractor', () => {
  describe('Color utilities', () => {
    it('should convert between color formats', () => {
      const color = Color.fromRgb({ r: 255, g: 128, b: 64 });
      expect(color).toBe(16744512);
      expect(Color.toHex(color)).toBe('#FF8040');
      expect(Color.fromHex('#FF8040')).toBe(16744512);
      expect(Color.toRgb(color)).toEqual({ r: 255, g: 128, b: 64 });
    });

    it('should handle edge cases', () => {
      expect(Color.toHex(0)).toBe('#000000');
      expect(Color.toHex(16777215)).toBe('#FFFFFF');
      expect(Color.fromHex('#000000')).toBe(0);
      expect(Color.fromHex('#FFFFFF')).toBe(16777215);
    });
  });

  describe('ImageDecoder', () => {
    it('should create test images', () => {
      const image = ImageDecoder.createTestImage(2, 2);
      expect(image.width).toBe(2);
      expect(image.height).toBe(2);
      expect(image.data.length).toBe(16);
    });

    it('should create solid images', () => {
      const image = ImageDecoder.createSolidImage(2, 2, 255, 0, 0);
      expect(image.data[0]).toBe(255);
      expect(image.data[1]).toBe(0);
      expect(image.data[2]).toBe(0);
      expect(image.data[3]).toBe(255);
    });

    it('should handle pixel access', () => {
      const image = ImageDecoder.createSolidImage(2, 2, 128, 64, 32);
      const [r, g, b, a] = ImageDecoder.getPixel(image, 0, 0);
      expect([r, g, b, a]).toEqual([128, 64, 32, 255]);
    });

    it('should validate bounds', () => {
      const image = ImageDecoder.createTestImage(2, 2);
      expect(() => ImageDecoder.getPixel(image, -1, 0)).toThrow();
      expect(() => ImageDecoder.getPixel(image, 2, 0)).toThrow();
    });
  });

  describe('Palette', () => {
    it('should create from image data', () => {
      const image = ImageDecoder.createSolidImage(2, 2, 255, 0, 0);
      const palette = Palette.fromImageData(image);
      expect(palette.length).toBe(1);
      
      const colors = palette.getMostUsedColors();
      expect(colors[0].color).toBe(Color.fromRgb({ r: 255, g: 0, b: 0 }));
      expect(colors[0].count).toBe(4);
    });

    it('should handle multi-color images', () => {
      const data = new Uint8Array([
        255, 0, 0, 255,    // Red
        0, 255, 0, 255,    // Green
        0, 0, 255, 255,    // Blue
        255, 0, 0, 255,    // Red again
      ]);
      const image = ImageDecoder.fromRawData(2, 2, data);
      const palette = Palette.fromImageData(image);
      
      expect(palette.length).toBe(3);
      const colors = palette.getMostUsedColors();
      expect(colors[0].count).toBe(2); // Red appears twice
    });

    it('should handle transparency', () => {
      const data = new Uint8Array([
        255, 0, 0, 255,    // Opaque red
        0, 255, 0, 128,    // Semi-transparent green
        0, 0, 255, 0,      // Fully transparent blue
        255, 255, 255, 255, // Opaque white
      ]);
      const image = ImageDecoder.fromRawData(2, 2, data);
      
      // Without background color, transparent pixels are skipped
      const palette1 = Palette.fromImageData(image);
      expect(palette1.length).toBe(2); // Red, white (semi-transparent and fully transparent are skipped)
      
      // With white background, transparent pixels are blended
      const whiteColor = Color.fromRgb({ r: 255, g: 255, b: 255 });
      const palette2 = Palette.fromImageData(image, whiteColor);
      expect(palette2.length).toBe(3); // Red, blended green, white
    });

    it('should iterate correctly', () => {
      const image = ImageDecoder.createTestImage(2, 2);
      const palette = Palette.fromImageData(image);
      
      const entries = Array.from(palette);
      expect(entries.length).toBe(palette.length);
      expect(entries[0]).toHaveLength(2); // [color, count] pairs
    });
  });

  describe('ColorExtractor', () => {
    it('should extract colors from simple palette', async () => {
      const image = ImageDecoder.createSolidImage(3, 3, 255, 0, 0);
      const palette = Palette.fromImageData(image);
      const extractor = new ColorExtractor(palette);
      
      const colors = await extractor.extract(1);
      expect(colors).toHaveLength(1);
      expect(colors[0]).toBe(Color.fromRgb({ r: 255, g: 0, b: 0 }));
    });

    it('should handle multi-color extraction', async () => {
      const data = new Uint8Array([
        255, 0, 0, 255,    // Red
        0, 255, 0, 255,    // Green  
        0, 0, 255, 255,    // Blue
        255, 255, 0, 255,  // Yellow
      ]);
      const image = ImageDecoder.fromRawData(2, 2, data);
      const palette = Palette.fromImageData(image);
      const extractor = new ColorExtractor(palette);
      
      const colors = await extractor.extract(3);
      expect(colors).toHaveLength(3);
      expect(colors.every(c => typeof c === 'number')).toBe(true);
    });

    it('should handle edge cases', async () => {
      const palette = new Palette();
      const extractor = new ColorExtractor(palette);
      
      expect(await extractor.extract(0)).toEqual([]);
      expect(await extractor.extract(5)).toEqual([]);
    });

    it('should cache computations', async () => {
      const image = ImageDecoder.createTestImage(10, 10);
      const palette = Palette.fromImageData(image);
      const extractor = new ColorExtractor(palette);
      
      const start1 = Date.now();
      await extractor.extract(5);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      await extractor.extract(3);
      const time2 = Date.now() - start2;
      
      expect(time2).toBeLessThan(time1); // Second call should be faster
    });

    it('should work with different options', async () => {
      const image = ImageDecoder.createTestImage(5, 5);
      const palette = Palette.fromImageData(image);
      
      const extractor1 = new ColorExtractor(palette, { useCache: false });
      const extractor2 = new ColorExtractor(palette, { maxCacheSize: 100 });
      
      const colors1 = await extractor1.extract(3);
      const colors2 = await extractor2.extract(3);
      
      expect(colors1).toHaveLength(3);
      expect(colors2).toHaveLength(3);
    });

    it('should clear cache properly', async () => {
      const image = ImageDecoder.createTestImage(5, 5);
      const palette = Palette.fromImageData(image);
      const extractor = new ColorExtractor(palette);
      
      await extractor.extract(3);
      extractor.clearCache();
      
      // Should still work after clearing cache
      const colors = await extractor.extract(2);
      expect(colors).toHaveLength(2);
    });
  });

  describe('Integration tests', () => {
    it('should work end-to-end with test image', async () => {
      const image = ImageDecoder.createTestImage(20, 20);
      const palette = Palette.fromImageData(image);
      const extractor = new ColorExtractor(palette);
      const colors = await extractor.extract(5);
      
      expect(colors).toHaveLength(5);
      expect(palette.length).toBeGreaterThan(0);
      
      // Convert colors to hex for verification
      const hexColors = colors.map(c => Color.toHex(c));
      expect(hexColors.every(hex => hex.startsWith('#'))).toBe(true);
    });

    it('should handle complex scenarios', async () => {
      // Create an image with gradient colors
      const size = 10;
      const data = new Uint8Array(size * size * 4);
      
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = (y * size + x) * 4;
          data[index] = Math.floor((x / size) * 255);
          data[index + 1] = Math.floor((y / size) * 255);
          data[index + 2] = Math.floor(((x + y) / (size * 2)) * 255);
          data[index + 3] = 255;
        }
      }
      
      const image = ImageDecoder.fromRawData(size, size, data);
      const palette = Palette.fromImageData(image);
      const extractor = new ColorExtractor(palette);
      
      // Extract different numbers of colors
      const colors3 = await extractor.extract(3);
      const colors8 = await extractor.extract(8);
      
      expect(colors3).toHaveLength(3);
      expect(colors8).toHaveLength(Math.min(8, palette.length));
    });

    it('should maintain performance characteristics', async () => {
      const image = ImageDecoder.createTestImage(50, 50);
      const palette = Palette.fromImageData(image);
      const extractor = new ColorExtractor(palette);
      
      const start = Date.now();
      const colors = await extractor.extract(10);
      const duration = Date.now() - start;
      
      expect(colors).toHaveLength(10);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 