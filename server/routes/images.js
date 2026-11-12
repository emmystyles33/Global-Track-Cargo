import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { requireAdmin } from '../authStore.js';

const router = Router();

function wrapAsync(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  };
}

// Memory storage is fine here: files are capped at 1MB each, max 5 — a
// few megabytes at worst, well within reach on a 4GB machine, and never
// written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 }, // 1MB
});

// POST /api/images/upload  (multipart/form-data, field name "file")
router.post(
  '/upload',
  requireAdmin,
  upload.single('file'),
  wrapAsync(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    const ext = req.file.originalname.split('.').pop();
    const filename = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('shipment-images')
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    const { data } = supabaseAdmin.storage.from('shipment-images').getPublicUrl(filename);
    res.json({ url: data.publicUrl });
  })
);

// Friendlier error for files over the 1MB limit
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image exceeds 1MB limit' });
  }
  next(err);
});

export default router;
