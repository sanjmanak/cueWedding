import { useRef, useState } from 'react';
import Avatar from './Avatar';
import { uploadCouplePhoto, PhotoUploadError } from '../../lib/photoUpload';
import { useAuth } from '../../context/AuthContext';

/**
 * Couple profile photo uploader. Drag-drop or click. Compresses client-side,
 * uploads to Firebase Storage, then calls onUploaded with the photo descriptor.
 *
 * Props:
 *  - weddingId: string (required to upload)
 *  - photo: existing photo descriptor { downloadUrl, storagePath, ... } | null
 *  - brideName / groomName: used for the avatar fallback
 *  - onUploaded(photo): called when a new upload succeeds
 *  - onRemove(): called when the user clicks Remove
 *  - variant: 'card' (default, big drop zone) or 'compact' (small inline)
 */
export default function PhotoUpload({
  weddingId,
  photo,
  brideName = '',
  groomName = '',
  onUploaded,
  onRemove,
  variant = 'card',
}) {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (!weddingId) {
      setError('Save your wedding first, then try uploading.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const descriptor = await uploadCouplePhoto(weddingId, file, user?.uid);
      onUploaded?.(descriptor);
    } catch (err) {
      const message =
        err instanceof PhotoUploadError
          ? err.message
          : 'Upload failed. Please try again.';
      console.error('Photo upload error:', err);
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    // Reset so picking the same file twice still fires change.
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const pickFile = () => inputRef.current?.click();
  const hasPhoto = Boolean(photo?.downloadUrl);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <Avatar
          photoUrl={photo?.downloadUrl}
          brideName={brideName}
          groomName={groomName}
          size={48}
        />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={pickFile}
            disabled={uploading}
            className="text-xs font-medium text-stone-700 hover:text-stone-900 underline underline-offset-2 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? 'Uploading…' : hasPhoto ? 'Replace photo' : 'Add couple photo'}
          </button>
          {hasPhoto && (
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="text-xs text-stone-400 hover:text-red-600 disabled:opacity-50 cursor-pointer text-left"
            >
              Remove
            </button>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={pickFile}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pickFile();
          }
        }}
        className={`flex items-center gap-5 p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          dragOver
            ? 'border-gold-500 bg-gold-50'
            : 'border-stone-300 bg-stone-50 hover:border-gold-400 hover:bg-white'
        }`}
      >
        <Avatar
          photoUrl={photo?.downloadUrl}
          brideName={brideName}
          groomName={groomName}
          size={80}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800">
            {hasPhoto ? 'Looking great!' : 'Add a photo of the two of you'}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            {uploading
              ? 'Uploading…'
              : hasPhoto
              ? 'Click or drop a new image to replace.'
              : 'Drag-and-drop or click to upload. JPEG or PNG, up to 8 MB.'}
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>

      {hasPhoto && (
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={pickFile}
            disabled={uploading}
            className="px-3 py-1.5 rounded-md bg-white border border-stone-300 text-stone-700 font-medium hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="px-3 py-1.5 rounded-md bg-white border border-stone-300 text-stone-500 font-medium hover:text-red-600 hover:border-red-300 disabled:opacity-50 cursor-pointer"
          >
            Remove
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
