import multer from "multer";

export const MAX_PROFILE_PIC_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Multer instance for profile pictures: memory storage, images only, 5 MB limit. */
export const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROFILE_PIC_BYTES },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) callback(null, true);
    else callback(new Error("Only image files allowed (jpeg, jpg, png, webp, gif)"));
  },
});
