// Receives a profile photo from a form (field name "photo") and keeps it in memory as `req.file`.
// New to uploads? See docs/help/uploads.md

import multer from 'multer';

const TWO_MB = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TWO_MB, files: 1 },
  fileFilter(req, file, done) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      done(null, true);
    } else {
      done(new Error('Photos must be JPG, PNG or WebP.'));
    }
  },
});

// The browser *says* what type a file is, but anyone can lie. Real image files start with
// known bytes, so check those too: JPG starts FF D8 FF, PNG starts 89 "PNG", WebP is "RIFF....WEBP".
function isRealImage(buffer) {
  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 4).toString('latin1') === '\x89PNG';
  const isWebp =
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP';
  return isJpg || isPng || isWebp;
}

// Runs multer, and turns its errors into friendly 400 answers.
export function uploadPhoto(req, res, next) {
  multerUpload.single('photo')(req, res, (error) => {
    if (error) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'Photos can be at most 2 MB.' : error.message;
      return res.status(400).json({ error: message });
    }
    if (req.file && !isRealImage(req.file.buffer)) {
      return res.status(400).json({ error: 'That file isn’t a JPG, PNG or WebP photo.' });
    }
    next();
  });
}
