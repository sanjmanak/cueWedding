import { useRef, useState } from 'react';
import Avatar from './Avatar';
import { compressCouplePhoto, PhotoUploadError } from '../../lib/photoUpload';

/**
 * Couple profile photo uploader. Drag-drop or click. Compresses client-side
 * to a JPEG data URL, then calls onUploaded with the photo descriptor.
 *
 * Props:
 *  - photo: existing photo descriptor { dataUrl, ... } | null
 *  - brideName / groomName: used for the avatar fallback
 *  - onUploaded(photo): called when compression succeeds
 *  - onRemove(): called when the user clicks Remove
 *  - variant: 'card' (default, big drop zone) or 'compact' (small inline)
 */
export default function PhotoUpload({
  photo,
  brideName = '',
  groomName = '',
  onUploaded,
  onRemove,
  variant = 'card',
}) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const descriptor = await compressCouplePhoto(file);
      onUploaded?.(descriptor);
    } catch (err) {
      const message =
        err instanceof PhotoUploadError
          ? err.message
          : 'Could not process this image. Please try again.';
      console.error('Photo processing error:', err);
      setError(message);
    } finally {
      setProcessing(false);
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
  const hasPhoto = Boolean(photo?.dataUrl);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <Avatar
          photoUrl={photo?.dataUrl}
          brideName={brideName}
          groomName={groomName}
          size={48}
        />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={pickFile}
            disabled={processing}
            className="text-xs font-medium text-stone-700 hover:text-stone-900 underline underline-offset-2 disabled:opacity-50 cursor-pointer"
          >
            {processing ? 'Processing…' : hasPhoto ? 'Replace photo' : 'Add couple photo'}
          </button>
          {hasPhoto && (
            <button
              type="button"
              onClick={onRemove}
              disabled={processing}
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
          photoUrl={photo?.dataUrl}
          brideName={brideName}
          groomName={groomName}
          size={80}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800">
            {hasPhoto ? 'Looking great!' : 'Add a photo of the two of you'}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            {processing
              ? 'Processing…'
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
            disabled={processing}
            className="px-3 py-1.5 rounded-md bg-white border border-stone-300 text-stone-700 font-medium hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={processing}
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
