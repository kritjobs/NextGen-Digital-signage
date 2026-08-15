/**
 * Image Optimizer Service
 * - Converts images to WebP (50-70% smaller, same quality)
 * - Resizes to max 3840px width (4K) for full-screen display
 * - Generates thumbnail (400px) for admin UI
 * - Preserves original file as backup
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface OptimizeResult {
  optimizedPath: string;
  thumbnailPath: string;
  originalSize: number;
  optimizedSize: number;
  thumbnailSize: number;
  width: number;
  height: number;
  format: string;
  savings: string; // e.g. "67% smaller"
}

const MAX_WIDTH = 3840; // 4K
const JPEG_QUALITY = 85;
const WEBP_QUALITY = 82;
const THUMBNAIL_WIDTH = 400;

export async function optimizeImage(filePath: string): Promise<OptimizeResult | null> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext);
    if (!isImage) return null;

    const originalSize = fs.statSync(filePath).size;
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, ext);

    // Read image metadata
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width || 1920;
    const height = metadata.height || 1080;

    // Optimized version (WebP, max 4K width)
    const optimizedFilename = `${baseName}_optimized.webp`;
    const optimizedPath = path.join(dir, optimizedFilename);

    let pipeline = sharp(filePath);

    // Resize if larger than 4K
    if (width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: 'inside' });
    }

    // Convert to WebP with high quality
    await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(optimizedPath);

    const optimizedSize = fs.statSync(optimizedPath).size;

    // Thumbnail (400px width, WebP)
    const thumbnailFilename = `${baseName}_thumb.webp`;
    const thumbnailPath = path.join(dir, thumbnailFilename);

    await sharp(filePath)
      .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 75, effort: 3 })
      .toFile(thumbnailPath);

    const thumbnailSize = fs.statSync(thumbnailPath).size;

    // Calculate savings
    const savingsPercent = Math.round((1 - optimizedSize / originalSize) * 100);
    const savings = savingsPercent > 0 ? `${savingsPercent}% smaller` : 'no change';

    return {
      optimizedPath,
      thumbnailPath,
      originalSize,
      optimizedSize,
      thumbnailSize,
      width: Math.min(width, MAX_WIDTH),
      height: width > MAX_WIDTH ? Math.round(height * (MAX_WIDTH / width)) : height,
      format: 'webp',
      savings,
    };
  } catch (err) {
    console.error('[ImageOptimizer] Failed:', err);
    return null;
  }
}

/**
 * Get the URL path from a filesystem path
 */
export function getOptimizedUrl(filePath: string, uploadDir: string): string {
  const relative = path.relative(uploadDir, filePath).replace(/\\/g, '/');
  return `/uploads/${relative}`;
}
