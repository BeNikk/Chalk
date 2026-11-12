// Saving and deleting profile photos. On the live site they go to Cloudinary, which crops them
// square and strips hidden photo data (like where the photo was taken).
// On your laptop (no CLOUDINARY_URL) they're saved, unchanged, in the uploads/ folder instead.
// New to uploads? See docs/help/uploads.md

import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config.js';

export const UPLOADS_FOLDER = path.join(import.meta.dirname, '..', '..', 'uploads');
const AVATARS_FOLDER = path.join(UPLOADS_FOLDER, 'avatars');

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const options = {
      folder: 'chalk/avatars',
      // Crop to a 400×400 square, centred on a face if there is one, saved as a JPG.
      // strip_profile removes the photo's hidden data (EXIF), including any GPS location.
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', flags: 'strip_profile' }],
      format: 'jpg',
    };
    const upload = cloudinary.uploader.upload_stream(options, (error, result) =>
      error ? reject(error) : resolve({ url: result.secure_url, id: result.public_id }),
    );
    upload.end(file.buffer);
  });
}

async function saveOnThisComputer(file, userId) {
  await mkdir(AVATARS_FOLDER, { recursive: true });
  const fileName = `${userId}-${Date.now()}.${EXTENSIONS[file.mimetype]}`;
  await writeFile(path.join(AVATARS_FOLDER, fileName), file.buffer);
  return { url: `/uploads/avatars/${fileName}`, id: fileName };
}

// Returns { url, id }: the url to show the photo, and the id needed to delete it later.
export function savePhoto(file, userId) {
  return config.cloudinaryUrl ? uploadToCloudinary(file) : saveOnThisComputer(file, userId);
}

export async function deletePhoto(id) {
  if (config.cloudinaryUrl) {
    await cloudinary.uploader.destroy(id);
  } else {
    await rm(path.join(AVATARS_FOLDER, path.basename(id)), { force: true });
  }
}
