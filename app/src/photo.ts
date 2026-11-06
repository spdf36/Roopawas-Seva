import { MAX_PHOTO_BYTES } from '@shared/api';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Longest side of an uploaded photo, in pixels: enough to see the problem, small enough for village networks. */
const MAX_SIDE = 1280;

/**
 * Lets the user pick a photo and shrinks it to a JPEG data: URL under MAX_PHOTO_BYTES, as the website does
 * (web/src/photo.ts). Resolves undefined when the user cancels; rejects with 'unreadable' or 'too_large'.
 */
export async function pickPhoto(): Promise<string | undefined> {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (picked.canceled || !picked.assets[0]) return undefined;
  const { uri, width, height } = picked.assets[0];
  try {
    const context = ImageManipulator.manipulate(uri);
    // Resize the longer side only; the other follows the aspect ratio.
    if (Math.max(width, height) > MAX_SIDE) context.resize(width >= height ? { width: MAX_SIDE, height: null } : { width: null, height: MAX_SIDE });
    const image = await context.renderAsync();
    for (const compress of [0.75, 0.6, 0.45]) {
      const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
      const url = `data:image/jpeg;base64,${saved.base64}`;
      if (url.length <= MAX_PHOTO_BYTES) return url;
    }
  } catch {
    throw new Error('unreadable');
  }
  throw new Error('too_large');
}
