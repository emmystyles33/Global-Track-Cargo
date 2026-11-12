import { useRef, useState } from 'react';
import { api } from '../lib/api.js';

const MAX_IMAGES = 5;
const MAX_SIZE = 1024 * 1024; // 1MB

export default function ImageUploader({ urls, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(fileList) {
    setError('');
    const files = Array.from(fileList);
    const remaining = MAX_IMAGES - urls.length;

    if (files.length > remaining) {
      setError(`Only ${remaining} more image(s) allowed (max ${MAX_IMAGES} total).`);
    }

    const toUpload = files.slice(0, remaining);
    const oversized = toUpload.find((f) => f.size > MAX_SIZE);
    if (oversized) {
      setError(`"${oversized.name}" is over 1MB. Choose a smaller image.`);
      return;
    }

    setUploading(true);
    try {
      const newUrls = [];
      for (const file of toUpload) {
        const { url } = await api.uploadImage(file);
        newUrls.push(url);
      }
      onChange([...urls, ...newUrls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div
        className="image-drop"
        onClick={() => urls.length < MAX_IMAGES && inputRef.current?.click()}
        style={{ opacity: urls.length >= MAX_IMAGES ? 0.5 : 1, cursor: urls.length >= MAX_IMAGES ? 'not-allowed' : 'pointer' }}
      >
        {uploading
          ? 'Uploading…'
          : urls.length >= MAX_IMAGES
          ? 'Maximum 5 images reached'
          : `Click to choose images (${urls.length}/${MAX_IMAGES}, max 1MB each)`}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}

      {urls.length > 0 && (
        <div className="image-preview-grid">
          {urls.map((url, i) => (
            <div className="image-preview" key={url}>
              <img src={url} alt={`Upload ${i + 1}`} />
              <button type="button" className="remove-btn" onClick={() => removeAt(i)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
