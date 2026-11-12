# Uploading profile photos

## From the browser

The settings page has `<input type="file">`. When you click "Upload photo", `public/js/api.js` puts the file in a **FormData** object and sends it to `PUT /api/me/avatar`. FormData is how browsers send files: it's not JSON, so the browser sets the `Content-Type` itself.

## On the server: Multer

Express can't read files on its own. [Multer](https://github.com/expressjs/multer) (`server/middleware/upload.js`) reads the upload and gives the controller `req.file`, with the file's bytes in `req.file.buffer`. Chalk then refuses:

- anything over 2 MB,
- files the browser doesn't call JPG, PNG or WebP, and
- files that *say* they're images but aren't. Anyone can lie about a file's type, so Chalk also checks the first few bytes: every real JPG, PNG and WebP file starts with a known pattern.

## Where photos are kept

`server/services/photos.js` decides:

| Where | Photos go to | Why |
|---|---|---|
| Your laptop (no `CLOUDINARY_URL`) | the `uploads/` folder, served at `/uploads/...` | No account needed to work on Chalk |
| The live site | [Cloudinary](https://cloudinary.com) | Vercel can't keep files, and Cloudinary resizes images for us |

On Cloudinary, every photo is cropped to a 400×400 square (centred on a face if it finds one) and saved as a JPG.

## Hidden data in photos

Photos from phones often carry hidden **metadata** (EXIF): the phone model, and sometimes the **exact location** where the photo was taken. On the live site, Chalk asks Cloudinary to strip it (the `strip_profile` flag), so nobody can find out where you live from your profile picture.

Photos saved on your laptop (in `uploads/`) are kept exactly as uploaded, metadata and all. That's fine for testing, since nobody else sees them.

When a new photo is saved, the old one is deleted, so photos don't pile up.

## Learn more

- [Using FormData objects (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects)
- [Multer](https://github.com/expressjs/multer#readme)
- [Cloudinary: upload images with Node.js](https://cloudinary.com/documentation/node_image_and_video_upload)
