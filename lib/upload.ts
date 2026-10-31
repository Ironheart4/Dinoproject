import multer from "multer";

export const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) callback(null, true);
    else callback(new Error("Only image files allowed (jpeg, jpg, png, webp, gif)"));
  },
});

export function getStoredProfilePath(profilePic: string, bucket = "profile-pictures"): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  return profilePic.startsWith(marker) ? profilePic.slice(marker.length) : null;
}
