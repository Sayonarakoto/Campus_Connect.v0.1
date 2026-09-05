const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const eventController = require("../controllers/eventController");


// =======================================================
// FILE SERVING ROUTES - MUST BE BEFORE /:id ROUTE
// =======================================================
// These routes need to be at the top to avoid being caught by /:id
router.get("/file/:fileId", eventController.getFile);
router.get("/file/download/:fileId", eventController.downloadFile);

// =======================================================
// TEST ROUTE - To verify router is working
// =======================================================
router.get("/ping", (req, res) => {
  res.json({ success: true, message: "Event router is working!" });
});

// =======================================================
// PUBLIC ROUTES - Everyone can view events
// =======================================================
// These routes are accessible to any authenticated user
router.get("/", authMiddleware, eventController.getEvents);
router.get("/statistics", authMiddleware, eventController.getEventStatistics);
router.get("/:id", authMiddleware, eventController.getEvent);

// =======================================================
// STUDENT EVENT ROUTES - Everyone can view
// =======================================================
router.get(
  "/my-events/:studentId",
  authMiddleware,
  eventController.getStudentEvents
);

router.get(
  "/upcoming/:studentId",
  authMiddleware,
  eventController.getUpcomingEvents
);

router.get(
  "/completed/:studentId",
  authMiddleware,
  eventController.getCompletedEvents
);

router.get(
  "/all-student-events/:studentId",
  authMiddleware,
  eventController.getAllStudentEvents || eventController.getStudentEvents
);

// =======================================================
// FACULTY/ADMIN ONLY ROUTES - Event CRUD
// =======================================================
// Only faculty and admin can create, update, and delete events
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.single("coverImage"),
  eventController.createEvent
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.single("coverImage"),
  eventController.updateEvent
);

router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  eventController.updateEventStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  eventController.deleteEvent
);

// =======================================================
// IMAGE UPLOAD AFTER EVENT COMPLETION - Faculty/Admin only
// =======================================================
router.post(
  "/:id/upload-image",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.single("image"),
  eventController.uploadEventImages
);

// =======================================================
// GENERIC MEDIA UPLOAD - Faculty/Admin only
// =======================================================
router.post(
  "/:id/media",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.single("file"),
  eventController.uploadEventMedia
);

router.delete(
  "/:id/media/:mediaType/:mediaIndex",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  eventController.deleteEventMedia
);

// =======================================================
// VIDEO ROUTES - Faculty/Admin only
// =======================================================
router.post(
  "/:id/videos",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.single("video"),
  (req, res, next) => {
    req.body.mediaType = "video";
    next();
  },
  eventController.uploadEventMedia
);

router.delete(
  "/:id/videos/:index",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  (req, res, next) => {
    req.params.mediaType = "video";
    req.params.mediaIndex = req.params.index;
    next();
  },
  eventController.deleteEventMedia
);

// =======================================================
// DOCUMENT ROUTES - Faculty/Admin only
// =======================================================
router.post(
  "/:id/documents",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.single("document"),
  (req, res, next) => {
    req.body.mediaType = "document";
    next();
  },
  eventController.uploadEventMedia
);

router.delete(
  "/:id/documents/:index",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  (req, res, next) => {
    req.params.mediaType = "document";
    req.params.mediaIndex = req.params.index;
    next();
  },
  eventController.deleteEventMedia
);

// =======================================================
// GALLERY ROUTES - Faculty/Admin only
// =======================================================
router.post(
  "/:id/gallery",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.single("image"),
  (req, res, next) => {
    req.body.mediaType = "gallery";
    next();
  },
  eventController.uploadEventMedia
);

// Multiple gallery images upload
router.post(
  "/:id/gallery/multiple",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.array("images", 10),
  eventController.uploadMultipleGalleryImages
);

router.delete(
  "/:id/gallery/:index",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  (req, res, next) => {
    req.params.mediaType = "gallery";
    req.params.mediaIndex = req.params.index;
    next();
  },
  eventController.deleteEventMedia
);

// =======================================================
// COVER IMAGE ROUTES - Faculty/Admin only
// =======================================================
router.post(
  "/:id/cover",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.single("image"),
  (req, res, next) => {
    req.body.mediaType = "cover";
    next();
  },
  eventController.uploadEventMedia
);

router.delete(
  "/:id/cover",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  async (req, res) => {
    try {
      const Event = require("../models/Event");
      const { deleteFromGridFS } = require("../config/gridfs");
      
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }
      
      // Delete cover image from GridFS
      if (event.coverImage && event.coverImage.fileId) {
        await deleteFromGridFS(event.coverImage.fileId);
        event.coverImage = null;
        await event.save();
      }
      
      res.json({
        success: true,
        message: "Cover image deleted successfully",
        event
      });
    } catch (error) {
      console.error("DELETE COVER ERROR:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =======================================================
// BULK MEDIA OPERATIONS - Faculty/Admin only
// =======================================================
router.post(
  "/:id/media/multiple",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'video', maxCount: 5 },
    { name: 'document', maxCount: 5 }
  ]),
  eventController.uploadMultipleMedia
);

router.delete(
  "/:id/media/bulk",
  authMiddleware,
  roleMiddleware("admin", "faculty"),
  eventController.bulkDeleteMedia
);

router.get(
  "/:id/media/:mediaType",
  authMiddleware,
  eventController.getMediaByType
);


module.exports = router;