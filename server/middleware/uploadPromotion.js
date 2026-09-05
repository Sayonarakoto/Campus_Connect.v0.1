const multer = require("multer");

// ======================================
// GRIDFS STORAGE - Memory storage
// ======================================

const storage = multer.memoryStorage();

// ======================================
// FILE FILTER
// ======================================

const fileFilter = (req, file, cb) => {
  // Allowed file types for promotions
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Videos
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/mpeg",
    "video/x-msvideo"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only JPG, PNG, GIF, WEBP, MP4, WEBM and MOV files are allowed.`
      ),
      false
    );
  }
};

// ======================================
// MULTER CONFIGURATION
// ======================================

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only 1 file per request
  }
});

// Export the configured multer instance
module.exports = upload;