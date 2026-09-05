// controllers/eventController.js
const Event = require("../models/Event");
const User = require("../models/User");
const Student = require("../models/Student");
const mongoose = require("mongoose");
const { uploadToGridFS, deleteFromGridFS, getFileInfo, getBucket } = require("../config/gridfs");

// =======================================================
// HELPER FUNCTIONS
// =======================================================

const determineStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start <= now && end >= now) {
    return "Ongoing";
  } else if (end < now) {
    return "Completed";
  } else {
    return "Upcoming";
  }
};

const parseSelectedStudents = (selectedStudents) => {
  if (!selectedStudents) return [];
  
  try {
    if (typeof selectedStudents === 'string') {
      return JSON.parse(selectedStudents);
    }
    return Array.isArray(selectedStudents) ? selectedStudents : [];
  } catch (e) {
    return [];
  }
};

// =======================================================
// CREATE EVENT
// =======================================================
const createEvent = async (req, res) => {
  try {
    const {
      eventName,
      eventType,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      venue,
      organizer,
      organizerEmail,
      organizerPhone,
      department,
      targetAudience,
      academicYear,
      semester,
      selectedStudents
    } = req.body;

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date"
      });
    }

    // Parse selectedStudents
    let parsedSelectedStudents = parseSelectedStudents(selectedStudents);

    // If targetAudience is "All Students" or "Both", clear selectedStudents
    if (!targetAudience || targetAudience === "All Students" || targetAudience === "Both") {
      parsedSelectedStudents = [];
    }

    let coverImageData = null;

    // Upload cover image to GridFS if provided
    if (req.file) {
      try {
        coverImageData = await uploadToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          {
            folder: 'covers',
            eventName: eventName,
            uploadedBy: req.user.id
          }
        );
      } catch (uploadError) {
        console.error('Cover image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload cover image'
        });
      }
    }

    const eventData = {
      eventName,
      eventType,
      description,
      startDate,
      endDate,
      startTime: startTime || "",
      endTime: endTime || "",
      location,
      venue: venue || location,
      organizer,
      organizerEmail: organizerEmail || "",
      organizerPhone: organizerPhone || "",
      department: department || "All",
      targetAudience: targetAudience || "All Students",
      status: determineStatus(startDate, endDate),
      academicYear,
      semester: semester || "",
      selectedStudents: parsedSelectedStudents,
      createdBy: req.user.id,
      coverImage: coverImageData
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event
    });

  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET ALL EVENTS
// =======================================================
const getEvents = async (req, res) => {
  try {
    const {
      eventType,
      status,
      department,
      academicYear,
      semester,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    let filter = { isActive: true };

    if (eventType && eventType !== "ALL") filter.eventType = eventType;
    if (status && status !== "ALL") filter.status = status;
    if (department && department !== "ALL") filter.department = department;
    if (academicYear) filter.academicYear = academicYear;
    
    if (semester && semester !== "ALL" && semester !== "all" && semester !== "") {
      filter.semester = semester;
    }

    if (search) {
      filter.$or = [
        { eventName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { organizer: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Get total count
    const total = await Event.countDocuments(filter);

    // Get events
    const events = await Event.find(filter)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .populate("selectedStudents", "fullName admissionNo department semester")
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("GET EVENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET SINGLE EVENT
// =======================================================
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .populate("selectedStudents", "fullName admissionNo registerNumber department semester house");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.json({
      success: true,
      event
    });

  } catch (error) {
    console.error("GET EVENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// UPDATE EVENT
// =======================================================
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Parse selectedStudents if provided
    if (updates.selectedStudents) {
      updates.selectedStudents = parseSelectedStudents(updates.selectedStudents);
    }

    // If targetAudience is "All Students" or "Both", clear selectedStudents
    if (updates.targetAudience === "All Students" || updates.targetAudience === "Both") {
      updates.selectedStudents = [];
    }

    // Update status based on dates if provided
    if (updates.startDate && updates.endDate) {
      updates.status = determineStatus(updates.startDate, updates.endDate);
    }

    // Handle cover image upload
    if (req.file) {
      // Delete old cover image from GridFS
      if (event.coverImage && event.coverImage.fileId) {
        await deleteFromGridFS(event.coverImage.fileId);
      }

      // Upload new cover image
      try {
        const coverImageData = await uploadToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          {
            folder: 'covers',
            eventName: event.eventName,
            uploadedBy: req.user.id
          }
        );
        updates.coverImage = coverImageData;
      } catch (uploadError) {
        console.error('Cover image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload cover image'
        });
      }
    }

    updates.updatedBy = req.user.id;

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("selectedStudents", "fullName admissionNo department semester");

    res.json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent
    });

  } catch (error) {
    console.error("UPDATE EVENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// DELETE EVENT
// =======================================================
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Delete cover image from GridFS
    if (event.coverImage && event.coverImage.fileId) {
      await deleteFromGridFS(event.coverImage.fileId);
    }

    // Delete gallery images from GridFS
    if (event.gallery && event.gallery.length > 0) {
      for (const image of event.gallery) {
        if (image.fileId) {
          await deleteFromGridFS(image.fileId);
        }
      }
    }

    // Delete videos from GridFS
    if (event.videos && event.videos.length > 0) {
      for (const video of event.videos) {
        if (video.fileId) {
          await deleteFromGridFS(video.fileId);
        }
      }
    }

    // Delete documents from GridFS
    if (event.documents && event.documents.length > 0) {
      for (const doc of event.documents) {
        if (doc.fileId) {
          await deleteFromGridFS(doc.fileId);
        }
      }
    }

    // Delete the event
    await event.deleteOne();

    res.json({
      success: true,
      message: "Event deleted successfully"
    });

  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// UPLOAD EVENT MEDIA
// =======================================================
const uploadEventMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaType, title } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Determine media type
    let type = mediaType;
    if (!type) {
      if (req.file.mimetype.startsWith('video/')) {
        type = 'video';
      } else if (req.file.mimetype === 'application/pdf' || 
                 req.file.mimetype.includes('word') ||
                 req.file.mimetype.includes('excel') ||
                 req.file.mimetype.includes('powerpoint')) {
        type = 'document';
      } else if (req.file.mimetype.startsWith('image/')) {
        type = 'gallery';
      } else {
        type = 'document';
      }
    }

    // Upload to GridFS
    const mediaData = await uploadToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        folder: type,
        eventId: event._id,
        eventName: event.eventName,
        uploadedBy: req.user.id
      }
    );

    // Add title if provided
    if (title) {
      mediaData.title = title;
    }

    // Add to appropriate array
    switch (type) {
      case "gallery":
        if (!event.gallery) event.gallery = [];
        event.gallery.push(mediaData);
        break;
      
      case "video":
        if (!event.videos) event.videos = [];
        event.videos.push({
          title: title || req.file.originalname,
          fileId: mediaData.fileId,
          filename: mediaData.filename,
          originalName: mediaData.originalName,
          url: mediaData.url,
          mimeType: mediaData.mimeType,
          size: mediaData.size,
          thumbnail: null
        });
        break;
      
      case "document":
        if (!event.documents) event.documents = [];
        event.documents.push({
          title: title || req.file.originalname,
          fileId: mediaData.fileId,
          filename: mediaData.filename,
          originalName: mediaData.originalName,
          url: mediaData.url,
          mimeType: mediaData.mimeType,
          size: mediaData.size
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid media type"
        });
    }

    await event.save();

    // Populate the event before sending response
    const updatedEvent = await Event.findById(id)
      .populate("createdBy", "fullName email")
      .populate("selectedStudents", "fullName admissionNo");

    res.json({
      success: true,
      message: "Media uploaded successfully",
      event: updatedEvent
    });

  } catch (error) {
    console.error("UPLOAD MEDIA ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// DELETE EVENT MEDIA
// =======================================================
const deleteEventMedia = async (req, res) => {
  try {
    const { id, mediaType, mediaIndex } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    let mediaArray;
    let fileId;

    switch (mediaType) {
      case "gallery":
        mediaArray = event.gallery;
        if (mediaArray[mediaIndex]) {
          fileId = mediaArray[mediaIndex].fileId;
          mediaArray.splice(mediaIndex, 1);
        }
        break;
      
      case "video":
        mediaArray = event.videos;
        if (mediaArray[mediaIndex]) {
          fileId = mediaArray[mediaIndex].fileId;
          mediaArray.splice(mediaIndex, 1);
        }
        break;
      
      case "document":
        mediaArray = event.documents;
        if (mediaArray[mediaIndex]) {
          fileId = mediaArray[mediaIndex].fileId;
          mediaArray.splice(mediaIndex, 1);
        }
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid media type"
        });
    }

    // Delete from GridFS
    if (fileId) {
      const deleted = await deleteFromGridFS(fileId);
      if (!deleted) {
        console.warn(`File ${fileId} not found in GridFS`);
      }
    }

    await event.save();

    // Populate the event before sending response
    const updatedEvent = await Event.findById(id)
      .populate("createdBy", "fullName email")
      .populate("selectedStudents", "fullName admissionNo");

    res.json({
      success: true,
      message: "Media deleted successfully",
      event: updatedEvent
    });

  } catch (error) {
    console.error("DELETE MEDIA ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET EVENT STATISTICS
// =======================================================
const getEventStatistics = async (req, res) => {
  try {
    const { academicYear } = req.query;

    let filter = {};
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // Get all events
    const totalEvents = await Event.countDocuments(filter);
    
    // Status breakdown
    const upcoming = await Event.countDocuments({ ...filter, status: "Upcoming" });
    const ongoing = await Event.countDocuments({ ...filter, status: "Ongoing" });
    const completed = await Event.countDocuments({ ...filter, status: "Completed" });
    const cancelled = await Event.countDocuments({ ...filter, status: "Cancelled" });
    const postponed = await Event.countDocuments({ ...filter, status: "Postponed" });

    // Type breakdown
    const typeBreakdown = await Event.aggregate([
      { $match: filter },
      { $group: { _id: "$eventType", count: { $sum: 1 } } }
    ]);

    // Monthly distribution
    const monthlyBreakdown = await Event.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $month: "$startDate" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Completion percentage
    const completionRate = totalEvents > 0 
      ? Math.round((completed / totalEvents) * 100) 
      : 0;

    // Department wise events
    const departmentWise = await Event.aggregate([
      { $match: filter },
      { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);

    // Target audience breakdown
    const audienceBreakdown = await Event.aggregate([
      { $match: filter },
      { $group: { _id: "$targetAudience", count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      statistics: {
        totalEvents,
        upcoming,
        ongoing,
        completed,
        cancelled,
        postponed,
        completionRate,
        typeBreakdown,
        monthlyBreakdown,
        departmentWise,
        audienceBreakdown,
        academicYear: academicYear || `${currentYear}-${currentYear + 1}`
      }
    });

  } catch (error) {
    console.error("GET STATISTICS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// UPDATE EVENT STATUS
// =======================================================
const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Upcoming", "Ongoing", "Completed", "Cancelled", "Postponed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { 
        status,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.json({
      success: true,
      message: "Event status updated successfully",
      event
    });

  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// UPLOAD EVENT IMAGES AFTER COMPLETION
// =======================================================
const uploadEventImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageType } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if event is completed
    if (event.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Images can only be uploaded after the event is completed"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    let fileData;
    if (imageType === "cover") {
      // Delete old cover image if exists
      if (event.coverImage && event.coverImage.fileId) {
        await deleteFromGridFS(event.coverImage.fileId);
      }

      // Upload new cover image
      fileData = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        {
          folder: 'covers',
          eventId: event._id,
          eventName: event.eventName,
          uploadedBy: req.user.id
        }
      );
      event.coverImage = fileData;
    } else {
      // Add to gallery
      fileData = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        {
          folder: 'gallery',
          eventId: event._id,
          eventName: event.eventName,
          uploadedBy: req.user.id
        }
      );
      if (!event.gallery) event.gallery = [];
      event.gallery.push(fileData);
    }

    await event.save();

    // Populate the event before sending response
    const updatedEvent = await Event.findById(id)
      .populate("createdBy", "fullName email")
      .populate("selectedStudents", "fullName admissionNo");

    res.json({
      success: true,
      message: "Image uploaded successfully",
      event: updatedEvent
    });

  } catch (error) {
    console.error("UPLOAD EVENT IMAGES ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET STUDENT EVENTS
// =======================================================
const getStudentEvents = async (req, res) => {
  try {
    const { studentId } = req.params;

    const events = await Event.find({
      isActive: true,
      $or: [
        { targetAudience: "All Students" },
        { targetAudience: "Both" },
        { 
          targetAudience: "Specific Students",
          selectedStudents: { $in: [studentId] }
        }
      ]
    })
    .populate("createdBy", "fullName email")
    .populate("selectedStudents", "fullName admissionNo")
    .sort({ startDate: -1 });

    const eventsWithProgress = events.map(event => ({
      ...event.toObject(),
      progress: event.progress || 0
    }));

    res.json({
      success: true,
      events: eventsWithProgress
    });

  } catch (error) {
    console.error("GET STUDENT EVENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET UPCOMING EVENTS
// =======================================================
const getUpcomingEvents = async (req, res) => {
  try {
    const { studentId } = req.params;

    const now = new Date();
    const events = await Event.find({
      isActive: true,
      status: { $in: ["Upcoming", "Ongoing"] },
      $or: [
        { targetAudience: "All Students" },
        { targetAudience: "Both" },
        { 
          targetAudience: "Specific Students",
          selectedStudents: { $in: [studentId] }
        }
      ]
    })
    .populate("createdBy", "fullName email")
    .sort({ startDate: 1 });

    res.json({
      success: true,
      events
    });

  } catch (error) {
    console.error("GET UPCOMING EVENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET COMPLETED EVENTS
// =======================================================
const getCompletedEvents = async (req, res) => {
  try {
    const { studentId } = req.params;

    const events = await Event.find({
      isActive: true,
      status: "Completed",
      $or: [
        { targetAudience: "All Students" },
        { targetAudience: "Both" },
        { 
          targetAudience: "Specific Students",
          selectedStudents: { $in: [studentId] }
        }
      ]
    })
    .populate("createdBy", "fullName email")
    .sort({ endDate: -1 });

    res.json({
      success: true,
      events
    });

  } catch (error) {
    console.error("GET COMPLETED EVENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET ALL STUDENT EVENTS
// =======================================================
const getAllStudentEvents = async (req, res) => {
  try {
    const { studentId } = req.params;

    const events = await Event.find({
      isActive: true,
      $or: [
        { targetAudience: "All Students" },
        { targetAudience: "Both" },
        { 
          targetAudience: "Specific Students",
          selectedStudents: { $in: [studentId] }
        }
      ]
    })
    .populate("createdBy", "fullName email")
    .populate("selectedStudents", "fullName admissionNo")
    .sort({ startDate: -1 });

    res.json({
      success: true,
      events
    });

  } catch (error) {
    console.error("GET ALL STUDENT EVENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET FILE FROM GRIDFS
// =======================================================
const getFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Validate fileId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID"
      });
    }

    const bucket = getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    // Check if file exists
    const fileInfo = await bucket.find({ _id: objectId }).toArray();

    if (fileInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    // Set response headers
    res.set('Content-Type', fileInfo[0].contentType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${fileInfo[0].metadata?.originalName || fileInfo[0].filename}"`);
    res.set('Cache-Control', 'public, max-age=31536000');

    // Stream file to response
    const downloadStream = bucket.openDownloadStream(objectId);
    
    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error("GET FILE ERROR:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

// =======================================================
// DOWNLOAD FILE
// =======================================================
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Validate fileId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID"
      });
    }

    const bucket = getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    // Check if file exists
    const fileInfo = await bucket.find({ _id: objectId }).toArray();

    if (fileInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const originalName = fileInfo[0].metadata?.originalName || fileInfo[0].filename;
    
    // Set response headers for download
    res.set('Content-Type', fileInfo[0].contentType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.set('Content-Length', fileInfo[0].length);
    res.set('Cache-Control', 'public, max-age=31536000');

    // Stream file to response
    const downloadStream = bucket.openDownloadStream(objectId);
    
    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error downloading file'
        });
      }
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error("DOWNLOAD FILE ERROR:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

// =======================================================
// UPLOAD MULTIPLE GALLERY IMAGES
// =======================================================
const uploadMultipleGalleryImages = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    if (!event.gallery) event.gallery = [];

    const uploadPromises = req.files.map(file => 
      uploadToGridFS(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          folder: 'gallery',
          eventId: event._id,
          eventName: event.eventName,
          uploadedBy: req.user.id
        }
      )
    );

    const uploadedFiles = await Promise.all(uploadPromises);
    event.gallery.push(...uploadedFiles);
    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate("createdBy", "fullName email")
      .populate("selectedStudents", "fullName admissionNo");

    res.json({
      success: true,
      message: `${uploadedFiles.length} gallery images uploaded successfully`,
      event: updatedEvent
    });

  } catch (error) {
    console.error("UPLOAD MULTIPLE GALLERY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// UPLOAD MULTIPLE MEDIA
// =======================================================
const uploadMultipleMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (!req.files) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const results = {
      coverImage: null,
      gallery: [],
      videos: [],
      documents: []
    };

    // Process cover image
    if (req.files.coverImage && req.files.coverImage.length > 0) {
      const file = req.files.coverImage[0];
      const uploadResult = await uploadToGridFS(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          folder: 'covers',
          eventId: event._id,
          eventName: event.eventName,
          uploadedBy: req.user.id
        }
      );
      
      if (event.coverImage && event.coverImage.fileId) {
        await deleteFromGridFS(event.coverImage.fileId);
      }
      
      event.coverImage = uploadResult;
      results.coverImage = uploadResult;
    }

    // Process gallery images
    if (req.files.gallery && req.files.gallery.length > 0) {
      if (!event.gallery) event.gallery = [];
      
      const uploadPromises = req.files.gallery.map(file => 
        uploadToGridFS(
          file.buffer,
          file.originalname,
          file.mimetype,
          {
            folder: 'gallery',
            eventId: event._id,
            eventName: event.eventName,
            uploadedBy: req.user.id
          }
        )
      );
      
      const uploadedGallery = await Promise.all(uploadPromises);
      event.gallery.push(...uploadedGallery);
      results.gallery = uploadedGallery;
    }

    // Process videos
    if (req.files.video && req.files.video.length > 0) {
      if (!event.videos) event.videos = [];
      
      const uploadPromises = req.files.video.map(file => 
        uploadToGridFS(
          file.buffer,
          file.originalname,
          file.mimetype,
          {
            folder: 'videos',
            eventId: event._id,
            eventName: event.eventName,
            uploadedBy: req.user.id
          }
        ).then(result => ({
          ...result,
          title: file.originalname,
          thumbnail: null
        }))
      );
      
      const uploadedVideos = await Promise.all(uploadPromises);
      event.videos.push(...uploadedVideos);
      results.videos = uploadedVideos;
    }

    // Process documents
    if (req.files.document && req.files.document.length > 0) {
      if (!event.documents) event.documents = [];
      
      const uploadPromises = req.files.document.map(file => 
        uploadToGridFS(
          file.buffer,
          file.originalname,
          file.mimetype,
          {
            folder: 'documents',
            eventId: event._id,
            eventName: event.eventName,
            uploadedBy: req.user.id
          }
        ).then(result => ({
          ...result,
          title: file.originalname
        }))
      );
      
      const uploadedDocuments = await Promise.all(uploadPromises);
      event.documents.push(...uploadedDocuments);
      results.documents = uploadedDocuments;
    }

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate("createdBy", "fullName email")
      .populate("selectedStudents", "fullName admissionNo");

    res.json({
      success: true,
      message: "Media uploaded successfully",
      results,
      event: updatedEvent
    });

  } catch (error) {
    console.error("UPLOAD MULTIPLE MEDIA ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// BULK DELETE MEDIA
// =======================================================
const bulkDeleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaType, indices } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    let mediaArray;
    switch (mediaType) {
      case "gallery":
        mediaArray = event.gallery;
        break;
      case "video":
        mediaArray = event.videos;
        break;
      case "document":
        mediaArray = event.documents;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid media type"
        });
    }

    if (!mediaArray || mediaArray.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No media found to delete"
      });
    }

    const sortedIndices = indices.sort((a, b) => b - a);
    const deletedFiles = [];

    for (const index of sortedIndices) {
      if (index < mediaArray.length) {
        const fileId = mediaArray[index].fileId;
        if (fileId) {
          await deleteFromGridFS(fileId);
          deletedFiles.push(mediaArray[index].filename || mediaArray[index].originalName);
        }
        mediaArray.splice(index, 1);
      }
    }

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate("createdBy", "fullName email")
      .populate("selectedStudents", "fullName admissionNo");

    res.json({
      success: true,
      message: `${deletedFiles.length} media files deleted successfully`,
      deletedFiles,
      event: updatedEvent
    });

  } catch (error) {
    console.error("BULK DELETE MEDIA ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET MEDIA BY TYPE
// =======================================================
const getMediaByType = async (req, res) => {
  try {
    const { id, mediaType } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    let media = [];
    switch (mediaType) {
      case "cover":
        media = event.coverImage ? [event.coverImage] : [];
        break;
      case "gallery":
        media = event.gallery || [];
        break;
      case "video":
        media = event.videos || [];
        break;
      case "document":
        media = event.documents || [];
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid media type"
        });
    }

    res.json({
      success: true,
      mediaType,
      media,
      count: media.length
    });

  } catch (error) {
    console.error("GET MEDIA BY TYPE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// EXPORT ALL FUNCTIONS
// =======================================================
module.exports = {
  // Core CRUD functions
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  
  // Media functions
  uploadEventMedia,
  deleteEventMedia,
  uploadEventImages,
  
  // Statistics and status
  getEventStatistics,
  updateEventStatus,
  
  // Student functions
  getStudentEvents,
  getUpcomingEvents,
  getCompletedEvents,
  getAllStudentEvents,
  
  // GridFS file functions
  getFile,
  downloadFile,
  
  // New bulk operations
  uploadMultipleGalleryImages,
  uploadMultipleMedia,
  bulkDeleteMedia,
  getMediaByType
};