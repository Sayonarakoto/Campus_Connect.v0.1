const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const stream = require("stream");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadPromotion");
const controller = require("../controllers/promotionController");

// ======================================
// GRIDFS SETUP
// ======================================

const conn = mongoose.connection;
let gfsBucket = null;
let isGridFSReady = false;

// Initialize GridFS when connection is ready
const initGridFS = () => {
  try {
    if (!conn.db) {
      console.error('❌ Database connection not established');
      return false;
    }
    
    gfsBucket = new GridFSBucket(conn.db, {
      bucketName: 'promotions'
    });
    
    // Set bucket in controller
    controller.setGridFSBucket(gfsBucket);
    isGridFSReady = true;
    return true;
  } catch (error) {
    console.error('❌ GridFS initialization error:', error);
    isGridFSReady = false;
    return false;
  }
};

// Initialize when connection opens
conn.once('open', () => {
  initGridFS();
});

// Also try to initialize if connection is already open
if (conn.readyState === 1) {
  initGridFS();
}

// ======================================
// GRIDFS UPLOAD MIDDLEWARE
// ======================================

const uploadToGridFS = (req, res, next) => {
  if (!req.file) {
    console.log('No file in request');
    return next();
  }

  // Check if bucket is initialized
  if (!isGridFSReady || !gfsBucket) {
    console.error('GridFS bucket not initialized');
    return res.status(500).json({
      success: false,
      message: 'Storage service not available. Please try again later.',
      details: 'GridFS bucket not initialized'
    });
  }



  try {
    // Create a readable stream from buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        uploadedBy: req.user ? req.user.id : 'unknown',
        uploadedAt: new Date(),
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

    // Pipe the buffer to GridFS
    bufferStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      req.file.id = uploadStream.id;
  
      next();
    });

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading file to storage',
        error: error.message
      });
    });

    bufferStream.on('error', (error) => {
      console.error('Buffer stream error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing file buffer',
        error: error.message
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing upload',
      error: error.message
    });
  }
};

// ======================================
// PUBLIC ROUTES (No auth required for media)
// ======================================

// Get media file from GridFS
router.get("/media/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.error('Invalid file ID:', fileId);
      return res.status(400).json({
        success: false,
        message: "Invalid file ID format"
      });
    }

    const objectId = new mongoose.Types.ObjectId(fileId);
    
    // Check if bucket is initialized
    if (!isGridFSReady || !gfsBucket) {
      console.error('GridFS bucket not initialized');
      return res.status(500).json({
        success: false,
        message: "Storage service not available"
      });
    }

    // Find file metadata
    const file = await conn.db.collection('promotions.files')
      .findOne({ _id: objectId });
    
    if (!file) {
      console.error('File not found:', fileId);
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

   

    // Set headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    
    // Stream file
    const downloadStream = gfsBucket.openDownloadStream(objectId);
    
    downloadStream.on('error', (error) => {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file',
          error: error.message
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Media fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media',
      error: error.message
    });
  }
});

// Get media info (without streaming)
router.get("/media/info/:fileId", authMiddleware, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID format"
      });
    }

    const objectId = new mongoose.Types.ObjectId(fileId);
    
    const file = await conn.db.collection('promotions.files')
      .findOne({ _id: objectId });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    res.json({
      success: true,
      fileInfo: {
        id: file._id,
        filename: file.filename,
        contentType: file.contentType,
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata || {}
      }
    });
  } catch (error) {
    console.error('Media info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media info',
      error: error.message
    });
  }
});

// ======================================
// PROMOTION ROUTES (Public/User)
// ======================================

// Get visible promotions for logged-in user
router.get(
  "/visible",
  authMiddleware,
  controller.getVisiblePromotions
);

// Get promotions by placement
router.get(
  "/placement/:placement",
  authMiddleware,
  controller.getPromotionsByPlacement
);

// Track click
router.post(
  "/click/:id",
  authMiddleware,
  controller.trackClick
);

// Track single view
router.post(
  "/view/:id",
  authMiddleware,
  controller.trackView
);

// Track multiple views (batch)
router.post(
  "/views",
  authMiddleware,
  controller.trackViews
);

// ======================================
// ADMIN ROUTES
// ======================================

// Create promotion with media upload
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("media"),
  uploadToGridFS,
  controller.createPromotion
);

// Get all promotions (admin)
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  controller.getPromotions
);

// Get single promotion
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  controller.getPromotion
);

// Update promotion
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("media"),
  uploadToGridFS,
  controller.updatePromotion
);

// Publish promotion
router.put(
  "/publish/:id",
  authMiddleware,
  roleMiddleware("admin"),
  controller.publishPromotion
);

// Unpublish promotion
router.put(
  "/unpublish/:id",
  authMiddleware,
  roleMiddleware("admin"),
  controller.unpublishPromotion
);

// Delete promotion (with GridFS cleanup)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  controller.deletePromotion
);

// Bulk delete promotions
router.delete(
  "/bulk/delete",
  authMiddleware,
  roleMiddleware("admin"),
  controller.bulkDeletePromotions
);

// Get promotion analytics
router.get(
  "/:id/analytics",
  authMiddleware,
  roleMiddleware("admin"),
  controller.getAnalytics
);

// ======================================
// DEBUG ROUTES
// ======================================

// Check GridFS files
router.get("/debug/files", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const files = await conn.db.collection('promotions.files')
      .find({})
      .sort({ uploadDate: -1 })
      .limit(10)
      .toArray();
    
    res.json({
      success: true,
      gridFSReady: isGridFSReady,
      count: files.length,
      files: files.map(f => ({
        id: f._id,
        filename: f.filename,
        contentType: f.contentType,
        length: f.length,
        uploadDate: f.uploadDate,
        metadata: f.metadata
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check database collections
router.get("/debug/collections", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const collections = await conn.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Check if promotions files collection exists
    const hasPromotionsFiles = collectionNames.includes('promotions.files');
    const hasPromotionsChunks = collectionNames.includes('promotions.chunks');
    
    res.json({
      success: true,
      collections: collectionNames,
      hasPromotionsFiles,
      hasPromotionsChunks,
      gridFSReady: isGridFSReady,
      dbName: conn.db.databaseName
    });
  } catch (error) {
    console.error('Debug collections error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ======================================
// ERROR HANDLING
// ======================================

// Handle GridFS connection errors
router.use((err, req, res, next) => {
  if (err.code === 'ENOENT' || err.message === 'File not found') {
    return res.status(404).json({
      success: false,
      message: 'File not found in GridFS'
    });
  }
  
  if (err.message === 'GridFS bucket not initialized') {
    return res.status(500).json({
      success: false,
      message: 'Storage service not available'
    });
  }
  
  next(err);
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files uploaded'
    });
  }
  
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
});

// ======================================
// HEALTH CHECK
// ======================================

router.get("/health", async (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    gridFSReady: isGridFSReady,
    dbConnected: conn.readyState === 1
  });
});

module.exports = router;