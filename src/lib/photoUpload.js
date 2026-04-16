const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.8;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024; // 8 MB hard cap on the source file

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
 * Compress a photo to a JPEG data URL (max 800px, quality 0.8).
 * Canvas re-encode naturally strips EXIF (including GPS data).
 * Returns a descriptor suitable for storing in meta.profile.photo.
 */
export async function compressCouplePhoto(file) {
  if (!file) {
    throw new PhotoUploadError('no_file', 'No file selected.');
  }
  if (!file.type?.startsWith('image/')) {
    throw new PhotoUploadError('not_image', 'That file does not look like an image.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new PhotoUploadError(
      'too_large',
      'That image is larger than 8 MB. Try a smaller photo.'
    );
  }

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

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  return {
    dataUrl,
    width: targetW,
    height: targetH,
    uploadedAt: new Date().toISOString(),
  };
}
