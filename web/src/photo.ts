import { MAX_PHOTO_BYTES } from './api/types';

/** Longest side of an uploaded photo, in pixels: enough to see the problem, small enough for village networks. */
const MAX_SIDE = 1280;

/**
 * Shrinks a photo picked from the phone or computer to a JPEG data: URL under MAX_PHOTO_BYTES.
 * Phone photos are often 3–8 MB; this brings them to roughly 100–300 KB. Rejects with 'unreadable'
 * when the browser cannot decode the file (e.g. HEIC on some browsers) and 'too_large' if it cannot
 * get it small enough.
 */
export async function compressPhoto(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    // Respects the photo's EXIF orientation, so pictures taken sideways come out upright.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('unreadable');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.75, 0.6, 0.45]) {
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= MAX_PHOTO_BYTES) return url;
  }
  throw new Error('too_large');
}
