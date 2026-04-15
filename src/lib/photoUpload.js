import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.85;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024; // 8 MB hard cap on the raw upload

export class PhotoUploadError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Read a File into an HTMLImageElement via Object URL.
 */
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PhotoUploadError('decode_failed', 'Could not read this image. Try a different file.'));
    };
    img.src = url;
  });
}

/**
 * Draw image to a canvas at max 1024x1024, export as JPEG.
 * Canvas re-encode naturally strips EXIF (including any GPS data).
 */
async function compressImage(file) {
  const img = await fileToImage(file);
  const { width, height } = img;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new PhotoUploadError('encode_failed', 'Could not process this image.'))),
      'image/jpeg',
      JPEG_QUALITY
    );
  });

  return { blob, width: targetW, height: targetH };
}

/**
 * Upload a couple profile photo to Firebase Storage.
 * Stored at weddings/{weddingId}/profile/{uuid}.jpg.
 * Returns a photo descriptor suitable for meta.profile.photo.
 */
export async function uploadCouplePhoto(weddingId, file, uploaderUid) {
  if (!storage) {
    throw new PhotoUploadError('storage_unavailable', 'Photo storage is not configured.');
  }
  if (!weddingId) {
    throw new PhotoUploadError('no_wedding_id', 'Missing wedding id for upload.');
  }
  if (!file) {
    throw new PhotoUploadError('no_file', 'No file selected.');
  }
  if (!file.type?.startsWith('image/')) {
    throw new PhotoUploadError('not_image', 'That file does not look like an image.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new PhotoUploadError(
      'too_large',
      `That image is larger than 8 MB. Try a smaller photo.`
    );
  }

  const { blob, width, height } = await compressImage(file);

  const filename = `${crypto.randomUUID()}.jpg`;
  const storagePath = `weddings/${weddingId}/profile/${filename}`;
  const objectRef = ref(storage, storagePath);

  await uploadBytes(objectRef, blob, {
    contentType: 'image/jpeg',
    customMetadata: {
      weddingId,
      uploadedByUid: uploaderUid || '',
    },
  });

  const downloadUrl = await getDownloadURL(objectRef);

  return {
    storagePath,
    downloadUrl,
    width,
    height,
    uploadedByUid: uploaderUid || null,
    uploadedAt: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Best-effort delete of a previously uploaded photo. Swallows errors — if the
 * object is already gone or rules deny it, we still want the Firestore pointer
 * to clear so the UI recovers.
 */
export async function deleteCouplePhoto(storagePath) {
  if (!storage || !storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (err) {
    console.warn('Photo delete failed (non-fatal):', err);
  }
}
