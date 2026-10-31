// Amplify runs Next.js API routes on Lambda, which rejects request bodies over
// 6MB - and multipart uploads are base64-encoded on the way in (~1.33x), so
// anything much past 4MB never reaches the route (CloudFront answers 413).
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// Formats a canvas can redraw losslessly enough for an attachment. GIF (may be
// animated) and SVG (vector) are left alone.
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

// Users may pick images up to this size; they're shrunk below MAX_UPLOAD_BYTES
// before upload. Other file types can't be shrunk, so they're held to
// MAX_UPLOAD_BYTES as picked.
export const MAX_IMAGE_SELECT_BYTES = 15 * 1024 * 1024;

export const isCompressibleImage = (file: File) => COMPRESSIBLE_TYPES.includes(file.type);

// Tried in order until the result fits under MAX_UPLOAD_BYTES; the first step
// is usually enough even for a 15MB phone photo.
const ATTEMPTS = [
  { maxDimension: 2000, quality: 0.8 },
  { maxDimension: 1600, quality: 0.7 },
  { maxDimension: 1200, quality: 0.6 },
];
// Small images aren't worth re-encoding (and losing quality) for.
const MIN_BYTES_TO_COMPRESS = 1024 * 1024;

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });

/**
 * Downscales and re-encodes a large photo as JPEG in the browser. Returns the
 * original file untouched when it isn't a compressible image, is already
 * small, or compressing wouldn't make it smaller.
 */
export async function compressImage(file: File): Promise<File> {
  if (!isCompressibleImage(file) || file.size < MIN_BYTES_TO_COMPRESS) {
    return file;
  }

  try {
    const img = await loadImage(file);
    let best: Blob | null = null;

    for (const { maxDimension, quality } of ATTEMPTS) {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) break;
      // JPEG has no alpha - paint transparent PNG areas white instead of black.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
      );
      if (blob && (!best || blob.size < best.size)) best = blob;
      if (best && best.size <= MAX_UPLOAD_BYTES) break;
    }

    if (!best || best.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([best], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
