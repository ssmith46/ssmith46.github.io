/**
 * @file lib/image.js
 * Prepares uploads in the browser: photos are resized (max 2400px on the long
 * edge) and converted to WebP so the repository and the site stay fast.
 * SVG, GIF and non-image files are uploaded untouched.
 */
import { slugify } from '../../../engine/core/utils.js';

const MAX_EDGE = 2400;
const QUALITY = 0.85;

/** Split "My Photo.JPG" → ["my-photo", "jpg"]. */
export function cleanName(name) {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  return [slugify(base) || 'file', ext];
}

/**
 * @param {File} file
 * @returns {Promise<{ blob: Blob, name: string, width?: number, height?: number }>}
 */
export async function prepareUpload(file) {
  const [base, ext] = cleanName(file.name);
  const compressible = /^image\/(jpeg|png|webp|heic|heif|avif|bmp)$/i.test(file.type);
  if (!compressible || typeof createImageBitmap !== 'function') return { blob: file, name: `${base}${ext ? `.${ext}` : ''}` };

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
    if (blob && blob.type === 'image/webp' && blob.size < file.size * 1.1) return { blob, name: `${base}.webp`, width, height };
    // Browser can't encode WebP (or it got bigger): keep the original.
    return { blob: file, name: `${base}.${ext || 'jpg'}`, width, height };
  } catch {
    return { blob: file, name: `${base}${ext ? `.${ext}` : ''}` };
  }
}

/** True for file names the browser can show as an <img>. */
export function isImage(path) {
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(path);
}
