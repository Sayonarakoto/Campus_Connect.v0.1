const multer = require("multer");
const path = require("path");

// ==========================================
// STORAGE - Memory Storage for GridFS
// ==========================================
const storage = multer.memoryStorage();

// ==========================================
// FILE FILTER
// ==========================================
const fileFilter = (req, file, cb) => {
  const mediaType = req.body.mediaType || '';
  const fieldName = file.fieldname;
  
  // Allowed types
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  const allowedVideoTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm", "video/ogg"];
  const allowedDocumentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/rtf"
  ];

  // For profile photos - stricter validation
  if (fieldName === "profilePhoto") {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Profile photo must be an image. Received: ${file.mimetype}`), false);
    }
    return;
  }

  // Check based on field name or media type
  if (fieldName === "coverImage" || fieldName === "image" || mediaType === "cover" || mediaType === "gallery") {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only images are allowed. Received: ${file.mimetype}`), false);
    }
  } else if (fieldName === "video" || mediaType === "video") {
    if (allowedVideoTypes.includes(file.mimetype) || file.originalname.match(/\.(mp4|mpeg|mov|avi|webm|ogg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only videos are allowed. Received: ${file.mimetype}`), false);
    }
  } else if (fieldName === "document" || fieldName === "documents" || mediaType === "document") {
    if (allowedDocumentTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only documents are allowed. Received: ${file.mimetype}`), false);
    }
  } else if (fieldName === "file") {
    // For generic 'file' field, check based on mediaType
    if (mediaType === 'video' && allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (mediaType === 'document' && allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if ((mediaType === 'gallery' || mediaType === 'cover') && allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Auto-detect by mimetype
      if (allowedImageTypes.includes(file.mimetype) || 
          allowedVideoTypes.includes(file.mimetype) || 
          allowedDocumentTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Received: ${file.mimetype}`), false);
      }
    }
  } else {
    // Default: accept if it matches any allowed type
    if (allowedImageTypes.includes(file.mimetype) ||
        allowedVideoTypes.includes(file.mimetype) ||
        allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Received: ${file.mimetype}`), false);
    }
  }
};

// ==========================================
// MULTER CONFIGURATION
// ==========================================
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for general uploads
    files: 10
  }
});

// Profile photo specific configuration (stricter limits)
const profilePhotoUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Profile photo must be an image. Received: ${file.mimetype}`), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for profile photos
    files: 1
  }
});

// ==========================================
// EXPORT
// ==========================================
module.exports = {
  // Single file upload with specific field name
  single: (fieldName) => upload.single(fieldName),
  
  // Multiple files upload
  array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
  
  // Fields upload (for multiple different fields)
  fields: (fields) => upload.fields(fields),
  
  // Generic upload middleware
  upload,
  
  // For cover image uploads
  uploadCover: upload.single('coverImage'),
  
  // For gallery images
  uploadGallery: upload.array('gallery', 10),
  
  // For videos
  uploadVideo: upload.single('video'),
  
  // For documents
  uploadDocument: upload.single('document'),
  
  // For multiple media types
  uploadMedia: upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'video', maxCount: 5 },
    { name: 'document', maxCount: 5 }
  ]),
  
  // For profile photos (specific)
  uploadProfilePhoto: profilePhotoUpload.single('profilePhoto'),
  
  // Helper to get file URL for GridFS
  getFileUrl: (fileId) => {
    return `/api/events/file/${fileId}`;
  },
  
  // Helper to get profile photo URL
  getProfilePhotoUrl: (fileId) => {
    return `/api/auth/photo/${fileId}`;
  },
  
  // Helper to get download URL for GridFS
  getDownloadUrl: (fileId, filename) => {
    return `/api/events/file/download/${fileId}?filename=${encodeURIComponent(filename)}`;
  }
};