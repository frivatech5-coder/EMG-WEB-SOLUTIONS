import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, hasStorage, explainError } from '../firebase';

/** Downscale to max 1600px and re-encode as WebP/JPEG in the browser before uploading. */
async function optimise(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Image conversion failed'))), 'image/webp', 0.85));
}

/** Uploads an image to Firebase Storage and returns its public download URL. Images are never stored in Firestore. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!hasStorage || !storage) throw new Error('Firebase Storage is not configured. Paste an image URL instead.');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Image is too large (max 12 MB).');
  try {
    const blob = await optimise(file);
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40) || 'image';
    const r = ref(storage, `site-images/${folder}/${Date.now()}-${name}.webp`);
    await uploadBytes(r, blob, { contentType: 'image/webp', cacheControl: 'public,max-age=31536000' });
    return await getDownloadURL(r);
  } catch (e) { throw new Error(explainError(e)); }
}
