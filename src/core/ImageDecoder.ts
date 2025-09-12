import { ImageData } from '../types';

const RGBA_CHANNELS = 4;
const MAX_RGB_VALUE = 255;

export class ImageDecoder {
  static fromRawData(width: number, height: number, data: Uint8Array): ImageData {
    const expectedLength = width * height * RGBA_CHANNELS;
    if (data.length !== expectedLength) {
      throw new Error(`Invalid data length: expected ${expectedLength}, got ${data.length}`);
    }
    return { width, height, data };
  }

  static createTestImage(width: number, height: number): ImageData {
    const data = new Uint8Array(width * height * RGBA_CHANNELS);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * RGBA_CHANNELS;
        data[index] = Math.floor((x / width) * MAX_RGB_VALUE);
        data[index + 1] = Math.floor((y / height) * MAX_RGB_VALUE);
        data[index + 2] = Math.floor(((x + y) / (width + height)) * MAX_RGB_VALUE);
        data[index + 3] = MAX_RGB_VALUE;
      }
    }
    
    return { width, height, data };
  }

  static createSolidImage(width: number, height: number, r: number, g: number, b: number, a = MAX_RGB_VALUE): ImageData {
    const data = new Uint8Array(width * height * RGBA_CHANNELS);
    
    for (let i = 0; i < data.length; i += RGBA_CHANNELS) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
    
    return { width, height, data };
  }

  static getPixel(imageData: ImageData, x: number, y: number): [number, number, number, number] {
    if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
      throw new Error(`Coordinates out of bounds: (${x}, ${y})`);
    }
    
    const index = (y * imageData.width + x) * RGBA_CHANNELS;
    return [
      imageData.data[index],
      imageData.data[index + 1],
      imageData.data[index + 2],
      imageData.data[index + 3],
    ];
  }
} 