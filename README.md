# Color Extractor

A fast, lightweight TypeScript library for extracting dominant colors from images using perceptual color analysis.

## Features

- 🎨 Extract dominant colors from image data
- 🧠 Perceptual color analysis using LAB color space
- ⚡ Optimized performance with caching
- 📦 Zero dependencies
- 🔧 TypeScript support with full type definitions
- 🎯 Small bundle size

## Installation

```bash
npm install color-extractor
```

## Quick Start

```typescript
import { ImageDecoder, Palette, ColorExtractor, Color } from 'color-extractor';

// Create test image data
const imageData = ImageDecoder.createTestImage(100, 100);

// Create color palette from image
const palette = Palette.fromImageData(imageData);

// Extract dominant colors
const extractor = new ColorExtractor(palette);
const colors = await extractor.extract(5);

// Convert to hex colors
const hexColors = colors.map(color => Color.toHex(color));
console.log(hexColors); // ['#FF0000', '#00FF00', ...]
```

## API Reference

### Color

Utility class for color format conversions.

```typescript
Color.toHex(color: number): string
Color.fromHex(hex: string): number
Color.toRgb(color: number): RgbColor
Color.fromRgb(rgb: RgbColor): number
```

### ImageDecoder

Create ImageData objects from various sources.

```typescript
ImageDecoder.fromRawData(width: number, height: number, data: Uint8Array): ImageData
ImageDecoder.createTestImage(width: number, height: number): ImageData
ImageDecoder.createSolidImage(width: number, height: number, r: number, g: number, b: number): ImageData
```

### Palette

Represents a collection of colors from an image.

```typescript
Palette.fromImageData(imageData: ImageData, backgroundColor?: number): Palette
palette.getMostUsedColors(limit?: number): PaletteEntry[]
palette.length: number
```

### ColorExtractor

Extract dominant colors using perceptual analysis.

```typescript
new ColorExtractor(palette: Palette, options?: ExtractorOptions)
extractor.extract(colorCount: number): Promise<number[]>
extractor.clearCache(): void
```

## Options

```typescript
interface ExtractorOptions {
  useCache?: boolean;      // Enable color conversion caching (default: true)
  maxCacheSize?: number;   // Maximum cache size (default: 10000)
  batchSize?: number;      // Processing batch size (default: 1000)
}
```

## Examples

### Extract Colors from Custom Image Data

```typescript
// Create image data (RGBA format)
const width = 100;
const height = 100;
const data = new Uint8Array(width * height * 4);

// Fill with your image data...
for (let i = 0; i < data.length; i += 4) {
  data[i] = 255;     // Red
  data[i + 1] = 0;   // Green  
  data[i + 2] = 0;   // Blue
  data[i + 3] = 255; // Alpha
}

const imageData = ImageDecoder.fromRawData(width, height, data);
const palette = Palette.fromImageData(imageData);
const extractor = new ColorExtractor(palette);
const colors = await extractor.extract(3);
```

### Handle Transparency

```typescript
const palette = Palette.fromImageData(imageData, 0xFFFFFF); // White background
```

### Performance Optimization

```typescript
const extractor = new ColorExtractor(palette, {
  useCache: true,
  maxCacheSize: 5000,
  batchSize: 500
});

// First extraction (slower - initializes cache)
const colors1 = await extractor.extract(5);

// Subsequent extractions (faster - uses cache)
const colors2 = await extractor.extract(3);

// Clean up when done
extractor.clearCache();
```

## TypeScript

Full TypeScript support with included type definitions:

```typescript
import type { ImageData, RgbColor, ExtractorOptions } from 'color-extractor';
```

## Performance

- Small images (< 10K pixels): ~1-10ms
- Medium images (100K pixels): ~50-200ms  
- Large images (1M+ pixels): ~200ms-1s
- Caching provides 50-80% performance improvement for repeated operations

## License

MIT

## Contributing

Contributions are welcome! Please ensure all tests pass:

```bash
npm test
npm run test:coverage
``` 