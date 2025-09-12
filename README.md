# Color Extractor

Extract dominant colors from images with perceptual color analysis. This package uses advanced color science (CIEDE2000, LAB color space) to identify the most representative colors in images, just like a human would perceive them.

## Features

- 🎨 **Perceptual color analysis** using LAB color space and CIEDE2000
- 🖼️ **Multiple image formats** - PNG, JPEG, WebP, GIF
- 🚀 **High performance** with intelligent caching and optimization
- 🎯 **Simple API** - load images directly from file paths
- 🔍 **Transparency support** with configurable background colors
- 📊 **Rich color information** - frequency analysis and iteration
- 💪 **TypeScript support** with full type definitions

## Installation

```bash
npm install @zedmagdy/color-extractor
```

## Quick Start

```typescript
import { Palette, ColorExtractor, Color } from '@zedmagdy/color-extractor';

// Load palette from image file
const palette = await Palette.fromFilename('./photo.jpg');

// Iterate through colors sorted by frequency
for (const [color, count] of palette) {
  console.log(`${Color.fromIntToHex(color)}: ${count} pixels`);
}

// Extract the 5 most representative colors
const extractor = new ColorExtractor(palette);
const colors = await extractor.extract(5);
console.log(colors.map(c => Color.fromIntToHex(c))); // ['#FF5733', '#33FF57', ...]
```

## Real-World Examples

### 1. Website Theme Generator

```typescript
import { Palette, ColorExtractor, Color } from '@zedmagdy/color-extractor';

async function generateTheme(logoPath: string) {
  const palette = await Palette.fromFilename(logoPath);
  const extractor = new ColorExtractor(palette);
  
  // Extract primary colors for theme
  const [primary, secondary, accent] = await extractor.extract(3);
  
  return {
    primary: Color.fromIntToHex(primary),
    secondary: Color.fromIntToHex(secondary),
    accent: Color.fromIntToHex(accent),
    // Generate variations
    light: Color.fromIntToHex(primary | 0x404040), // Lighten
    dark: Color.fromIntToHex(primary & 0xBFBFBF),  // Darken
  };
}

// Usage
const theme = await generateTheme('./company-logo.png');
console.log(theme);
// {
//   primary: '#2E86AB',
//   secondary: '#A23B72',
//   accent: '#F18F01',
//   light: '#6EAACB',
//   dark: '#0E668B'
// }
```

### 2. Product Image Analysis

```typescript
import { Palette, ColorExtractor, Color } from '@zedmagdy/color-extractor';

async function analyzeProductImage(imagePath: string) {
  const palette = await Palette.fromFilename(imagePath);
  
  // Get color statistics
  const totalPixels = Array.from(palette).reduce((sum, [, count]) => sum + count, 0);
  const dominantColors = palette.getMostUsedColors(5);
  
  // Analyze color distribution
  const colorAnalysis = dominantColors.map(({ color, count }) => ({
    hex: Color.fromIntToHex(color),
    rgb: Color.fromIntToRgb(color),
    percentage: ((count / totalPixels) * 100).toFixed(1),
    pixels: count
  }));
  
  // Extract representative colors for tags
  const extractor = new ColorExtractor(palette);
  const tags = await extractor.extract(3);
  
  return {
    totalColors: palette.length,
    totalPixels,
    distribution: colorAnalysis,
    tags: tags.map(c => Color.fromIntToHex(c))
  };
}

// Usage for e-commerce
const analysis = await analyzeProductImage('./product-shirt.jpg');
console.log(analysis);
// {
//   totalColors: 156,
//   totalPixels: 250000,
//   distribution: [
//     { hex: '#1E3A8A', rgb: { r: 30, g: 58, b: 138 }, percentage: '45.2', pixels: 113000 },
//     { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, percentage: '23.1', pixels: 57750 },
//     ...
//   ],
//   tags: ['#1E3A8A', '#FFFFFF', '#64748B']
// }
```

### 3. Art Collection Organizer

```typescript
import { Palette, ColorExtractor, Color } from '@zedmagdy/color-extractor';
import * as fs from 'fs/promises';
import * as path from 'path';

async function organizeArtCollection(artworkDir: string) {
  const files = await fs.readdir(artworkDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  
  const artworks = [];
  
  for (const file of imageFiles) {
    const filePath = path.join(artworkDir, file);
    const palette = await Palette.fromFilename(filePath);
    const extractor = new ColorExtractor(palette);
    
    // Extract dominant colors for classification
    const colors = await extractor.extract(5);
    
    // Analyze mood based on colors
    const mood = analyzeMood(colors);
    const temperature = analyzeTemperature(colors);
    
    artworks.push({
      filename: file,
      colors: colors.map(c => Color.fromIntToHex(c)),
      mood,
      temperature,
      uniqueColors: palette.length
    });
  }
  
  return groupArtworksByMood(artworks);
}

function analyzeMood(colors: number[]): string {
  const avgBrightness = colors.reduce((sum, color) => {
    const { r, g, b } = Color.fromIntToRgb(color);
    return sum + (r + g + b) / 3;
  }, 0) / colors.length;
  
  if (avgBrightness > 180) return 'bright';
  if (avgBrightness > 120) return 'moderate';
  return 'dark';
}

function analyzeTemperature(colors: number[]): string {
  const warmth = colors.reduce((sum, color) => {
    const { r, g, b } = Color.fromIntToRgb(color);
    return sum + (r - b); // Red vs Blue
  }, 0) / colors.length;
  
  return warmth > 0 ? 'warm' : 'cool';
}

function groupArtworksByMood(artworks: any[]) {
  return artworks.reduce((groups, artwork) => {
    const key = `${artwork.mood}-${artwork.temperature}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(artwork);
    return groups;
  }, {});
}
```

### 4. Photo Filter Recommendation

```typescript
import { Palette, ColorExtractor, Color } from '@zedmagdy/color-extractor';

async function recommendFilters(photoPath: string) {
  const palette = await Palette.fromFilename(photoPath);
  const extractor = new ColorExtractor(palette);
  
  // Analyze the photo's color characteristics
  const dominantColors = await extractor.extract(3);
  const colorStats = analyzColorCharacteristics(dominantColors);
  
  const recommendations = [];
  
  // Recommend filters based on color analysis
  if (colorStats.isMonochromatic) {
    recommendations.push({
      filter: 'Vibrance Boost',
      reason: 'Photo appears monochromatic, adding vibrance will enhance color variety'
    });
  }
  
  if (colorStats.averageSaturation < 100) {
    recommendations.push({
      filter: 'Saturation Enhancement',
      reason: 'Colors appear muted, saturation boost will make them pop'
    });
  }
  
  if (colorStats.isWarmToned) {
    recommendations.push({
      filter: 'Cool Balance',
      reason: 'Warm-toned image, cool filter will add balance'
    });
  } else {
    recommendations.push({
      filter: 'Warm Glow',
      reason: 'Cool-toned image, warm filter will add coziness'
    });
  }
  
  return {
    analysis: colorStats,
    recommendations,
    dominantColors: dominantColors.map(c => Color.fromIntToHex(c))
  };
}

function analyzColorCharacteristics(colors: number[]) {
  const rgbColors = colors.map(c => Color.fromIntToRgb(c));
  
  // Calculate average saturation (simplified)
  const avgSaturation = rgbColors.reduce((sum, { r, g, b }) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return sum + (max - min);
  }, 0) / colors.length;
  
  // Check if warm or cool toned
  const warmth = rgbColors.reduce((sum, { r, b }) => sum + (r - b), 0) / colors.length;
  
  // Check if monochromatic (all colors similar)
  const isMonochromatic = colors.length < 3 || avgSaturation < 30;
  
  return {
    averageSaturation: avgSaturation,
    isWarmToned: warmth > 10,
    isMonochromatic,
    colorCount: colors.length
  };
}
```

## API Reference

### Palette

Load and analyze color palettes from images.

```typescript
// Load from file
Palette.fromFilename(filename: string, backgroundColor?: number): Promise<Palette>

// Load from ImageData (for custom sources)
Palette.fromImageData(imageData: ImageData, backgroundColor?: number): Palette

// Methods
palette.getMostUsedColors(limit?: number): PaletteEntry[]
palette.getColorCount(color: number): number
palette.hasColor(color: number): boolean
palette.getAllColors(): number[]
palette.length: number

// Iteration (sorted by pixel count)
for (const [color, count] of palette) { ... }
```

### ColorExtractor

Extract the most representative colors using perceptual analysis.

```typescript
new ColorExtractor(palette: Palette, options?: ExtractorOptions)
extractor.extract(colorCount: number): Promise<number[]>
extractor.clearCache(): void
```

**Options:**
```typescript
interface ExtractorOptions {
  useCache?: boolean;      // Enable LAB color caching (default: true)
  maxCacheSize?: number;   // Maximum cache entries (default: 10000)
  batchSize?: number;      // Batch processing size (default: 1000)
}
```

### Color

Utility functions for color format conversion.

```typescript
Color.fromIntToHex(color: number): string
Color.fromHexToInt(hex: string): number
Color.fromIntToRgb(color: number): RgbColor
Color.fromRgbToInt(rgb: RgbColor): number
```

## Advanced Usage

### Handle Transparency

```typescript
// For images with transparent backgrounds
const whiteBackground = Color.fromHexToInt('#FFFFFF');
const palette = await Palette.fromFilename('./logo.png', whiteBackground);
```

### Performance Optimization

```typescript
// Configure for high-performance scenarios
const extractor = new ColorExtractor(palette, {
  useCache: true,      // Enable caching for repeated extractions
  maxCacheSize: 5000,  // Reduce memory usage
  batchSize: 500       // Smaller batches for memory-constrained environments
});
```

### Error Handling

```typescript
try {
  const palette = await Palette.fromFilename('./image.jpg');
  const extractor = new ColorExtractor(palette);
  const colors = await extractor.extract(5);
} catch (error) {
  console.error('Failed to process image:', error.message);
}
```

## Technical Details

This package uses advanced color science techniques:

- **LAB Color Space**: Perceptually uniform color space for better color similarity
- **CIEDE2000**: Industry-standard color difference calculation
- **Spatial Indexing**: Grid-based optimization for faster color merging
- **Intelligent Caching**: LAB conversion caching for performance

## Supported Formats

- PNG (with transparency support)
- JPEG
- WebP
- GIF
- Any format supported by [Sharp](https://sharp.pixelplumbing.com/)

## Requirements

- Node.js >= 14.0.0
- Automatically installs [Sharp](https://sharp.pixelplumbing.com/) for image processing

## License

MIT © [ZED-Magdy](https://github.com/ZED-Magdy)

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/ZED-Magdy/color-extractor). 