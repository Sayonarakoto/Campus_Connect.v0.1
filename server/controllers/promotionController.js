const Promotion = require("../models/Promotion");
const PromotionView = require("../models/PromotionView");
const mongoose = require("mongoose");

// GridFS bucket instance
let gfsBucket = null;

// ======================================
// SET GRIDFS BUCKET
// ======================================

const setGridFSBucket = (bucket) => {
  gfsBucket = bucket;
};

// ======================================
// CREATE PROMOTION WITH GRIDFS
// ======================================

const createPromotion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Media file is required"
      });
    }

    if (!req.file.id) {
      return res.status(500).json({
        success: false,
        message: "File was not properly uploaded to storage"
      });
    }

    const promotion = await Promotion.create({
      title: req.body.title,
      description: req.body.description || "",
      destinationUrl: req.body.destinationUrl || "",
      placement: req.body.placement || "FLOATING_CORNER",
      audienceRole: req.body.audienceRole || "ALL",
      department: req.body.department || "ALL",
      semester: Number(req.body.semester) || 0,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      mediaFileId: req.file.id,
      mediaFileName: req.file.originalname || req.file.filename,
      mediaType: req.file.mimetype && req.file.mimetype.startsWith("video") ? "video" : "image",
      mimeType: req.file.mimetype || "image/jpeg",
      fileSize: req.file.size || 0,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Promotion Created Successfully",
      promotion: {
        ...promotion.toObject(),
        mediaUrl: `/api/promotions/media/${promotion.mediaFileId}`
      }
    });
  } catch (error) {
    console.error("CREATE PROMOTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// GET ALL PROMOTIONS (ADMIN)
// ======================================

const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate("createdBy", "fullName email role")
      .sort({ createdAt: -1 });

    const promotionsWithUrls = promotions.map(promo => ({
      ...promo.toObject(),
      mediaUrl: promo.mediaFileId ? `/api/promotions/media/${promo.mediaFileId}` : null
    }));

    res.json({
      success: true,
      promotions: promotionsWithUrls
    });
  } catch (error) {
    console.error("GET PROMOTIONS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// GET SINGLE PROMOTION
// ======================================

const getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate("createdBy", "fullName email role");

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    res.json({
      success: true,
      promotion: {
        ...promotion.toObject(),
        mediaUrl: promotion.mediaFileId ? `/api/promotions/media/${promotion.mediaFileId}` : null
      }
    });
  } catch (error) {
    console.error("GET PROMOTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// DELETE PROMOTION WITH GRIDFS CLEANUP
// ======================================

const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    if (promotion.mediaFileId && gfsBucket) {
      try {
        await gfsBucket.delete(promotion.mediaFileId);
      } catch (error) {
        console.error("Error deleting GridFS file:", error);
      }
    }

    await PromotionView.deleteMany({ promotionId: req.params.id });
    await Promotion.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Promotion Deleted Successfully"
    });
  } catch (error) {
    console.error("DELETE PROMOTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// UPDATE PROMOTION
// ======================================

const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    promotion.title = req.body.title || promotion.title;
    promotion.description = req.body.description || promotion.description;
    promotion.destinationUrl = req.body.destinationUrl || promotion.destinationUrl;
    promotion.placement = req.body.placement || promotion.placement;
    promotion.audienceRole = req.body.audienceRole || promotion.audienceRole;
    promotion.department = req.body.department || promotion.department;
    promotion.semester = Number(req.body.semester) || promotion.semester;
    
    if (req.body.startDate) {
      promotion.startDate = new Date(req.body.startDate);
    }
    
    if (req.body.endDate) {
      promotion.endDate = new Date(req.body.endDate);
    }

    if (req.file && req.file.id) {
      if (promotion.mediaFileId && gfsBucket) {
        try {
          await gfsBucket.delete(promotion.mediaFileId);
        } catch (error) {
          console.error("Error deleting old GridFS file:", error);
        }
      }

      promotion.mediaFileId = req.file.id;
      promotion.mediaFileName = req.file.originalname || req.file.filename;
      promotion.mediaType = req.file.mimetype && req.file.mimetype.startsWith("video") ? "video" : "image";
      promotion.mimeType = req.file.mimetype || "image/jpeg";
      promotion.fileSize = req.file.size || 0;
    }

    await promotion.save();

    res.json({
      success: true,
      message: "Promotion Updated Successfully",
      promotion: {
        ...promotion.toObject(),
        mediaUrl: promotion.mediaFileId ? `/api/promotions/media/${promotion.mediaFileId}` : null
      }
    });
  } catch (error) {
    console.error("UPDATE PROMOTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// PUBLISH PROMOTION
// ======================================

const publishPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    promotion.published = true;
    await promotion.save();

    res.json({
      success: true,
      message: "Promotion Published Successfully",
      promotion
    });
  } catch (error) {
    console.error("PUBLISH PROMOTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// UNPUBLISH PROMOTION
// ======================================

const unpublishPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    promotion.published = false;
    await promotion.save();

    res.json({
      success: true,
      message: "Promotion Unpublished Successfully",
      promotion
    });
  } catch (error) {
    console.error("UNPUBLISH PROMOTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// GET VISIBLE PROMOTIONS
// ======================================

const getVisiblePromotions = async (req, res) => {
  try {
    const user = req.user;
    let filter = {
      published: true,
      active: true
    };

    if (user && user.role) {
      const role = user.role.toLowerCase();
      filter.$or = [
        { audienceRole: "ALL" },
        { audienceRole: role }
      ];

      if (user.department && (role === "faculty" || role === "hod")) {
        filter.department = { $in: ["ALL", user.department] };
      }

      if (user.semester && role === "student") {
        filter.$or.push(
          { semester: 0 },
          { semester: user.semester }
        );
      }
    } else {
      filter.audienceRole = "ALL";
    }

    const promotions = await Promotion.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(20);

    const promotionsWithUrls = promotions.map(promo => ({
      ...promo.toObject(),
      mediaUrl: promo.mediaFileId ? `/api/promotions/media/${promo.mediaFileId}` : null
    }));

    res.json({
      success: true,
      promotions: promotionsWithUrls
    });
  } catch (error) {
    console.error("GET VISIBLE PROMOTIONS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// GET PROMOTIONS BY PLACEMENT
// ======================================

const getPromotionsByPlacement = async (req, res) => {
  try {
    const { placement } = req.params;
    const user = req.user;

    let filter = {
      published: true,
      active: true,
      placement: placement
    };

    if (user && user.role) {
      const role = user.role.toLowerCase();
      filter.$or = [
        { audienceRole: "ALL" },
        { audienceRole: role }
      ];
    } else {
      filter.audienceRole = "ALL";
    }

    const promotions = await Promotion.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(5);

    const promotionsWithUrls = promotions.map(promo => ({
      ...promo.toObject(),
      mediaUrl: promo.mediaFileId ? `/api/promotions/media/${promo.mediaFileId}` : null
    }));

    res.json({
      success: true,
      promotions: promotionsWithUrls
    });
  } catch (error) {
    console.error("GET PROMOTIONS BY PLACEMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================



// TRACK CLICK
// ======================================

const trackClick = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { returnDocument: 'after' }
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    res.json({
      success: true,
      message: "Click tracked successfully"
    });
  } catch (error) {
    console.error("TRACK CLICK ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// TRACK SINGLE VIEW - UNIQUE PER USER
// ======================================

const trackView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user has already viewed this promotion
    const existingView = await PromotionView.findOne({
      promotionId: id,
      userId: userId
    });

    if (!existingView) {
      try {
        // Create a new view record
        await PromotionView.create({
          promotionId: id,
          userId: userId,
          viewedAt: new Date()
        });

        // Increment the view count on the promotion
        await Promotion.findByIdAndUpdate(
          id,
          { $inc: { views: 1 } },
          { returnDocument: 'after' }
        );

        res.json({
          success: true,
          message: "View tracked successfully",
          isNewView: true
        });
      } catch (createError) {

        if (createError.code === 11000) {
          res.json({
            success: true,
            message: "View already counted",
            isNewView: false
          });
        } else {
          throw createError;
        }
      }
    } else {
      // User already viewed this promotion
      res.json({
        success: true,
        message: "View already counted",
        isNewView: false
      });
    }
  } catch (error) {
    console.error("TRACK VIEW ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// TRACK MULTIPLE VIEWS - UNIQUE PER USER
// ======================================

const trackViews = async (req, res) => {
  try {
    const { promotionIds } = req.body;
    const userId = req.user.id;

    if (!promotionIds || !promotionIds.length) {
      return res.json({
        success: true,
        message: "No promotions to track"
      });
    }

    const existingViews = await PromotionView.find({
      promotionId: { $in: promotionIds },
      userId: userId
    });

    const viewedPromotionIds = existingViews.map(view => view.promotionId.toString());
    
    const newPromotionIds = promotionIds.filter(
      id => !viewedPromotionIds.includes(id)
    );

    if (newPromotionIds.length === 0) {
      return res.json({
        success: true,
        message: "All promotions already viewed",
        newViews: 0
      });
    }

    // Create view records for new promotions using insertMany with ordered: false
    const viewRecords = newPromotionIds.map(promotionId => ({
      promotionId,
      userId,
      viewedAt: new Date()
    }));

    try {
      // Use ordered: false to continue even if some duplicates exist
      await PromotionView.insertMany(viewRecords, { ordered: false });
    } catch (bulkError) {
      // Handle duplicate key errors gracefully
      if (bulkError.code === 11000) {
        // Some duplicates were ignored, count the successfully inserted ones
        console.log("Some views already exist, continuing...");
      } else {
        throw bulkError;
      }
    }

    // Count how many were actually inserted (by checking against existing views again)
    const afterInsertViews = await PromotionView.find({
      promotionId: { $in: newPromotionIds },
      userId: userId
    });

    const actuallyNewIds = afterInsertViews.map(view => view.promotionId.toString());

    // Increment view counts for all new promotions
    if (actuallyNewIds.length > 0) {
      await Promotion.updateMany(
        { _id: { $in: actuallyNewIds } },
        { $inc: { views: 1 } }
      );
    }

    res.json({
      success: true,
      message: `${actuallyNewIds.length} promotions viewed`,
      newViews: actuallyNewIds.length,
      alreadyViewed: viewedPromotionIds.length
    });
  } catch (error) {
    console.error("TRACK VIEWS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// GET UNIQUE VIEW COUNT FOR A PROMOTION
// ======================================

const getUniqueViewCount = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    const uniqueViewers = await PromotionView.distinct('userId', {
      promotionId: id
    });

    res.json({
      success: true,
      totalViews: promotion.views,
      uniqueViewers: uniqueViewers.length,
      uniqueViewerIds: uniqueViewers
    });
  } catch (error) {
    console.error("GET UNIQUE VIEW COUNT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// GET PROMOTION ANALYTICS
// ======================================

const getAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found"
      });
    }

    const uniqueViewers = await PromotionView.distinct('userId', {
      promotionId: id
    });

    const viewHistory = await PromotionView.find({
      promotionId: id
    })
    .sort({ viewedAt: -1 })
    .limit(50)
    .populate('userId', 'fullName email');

    const analytics = {
      title: promotion.title,
      views: promotion.views,
      uniqueViewers: uniqueViewers.length,
      clicks: promotion.clicks,
      ctr: promotion.views > 0 ? ((promotion.clicks / promotion.views) * 100).toFixed(2) : 0,
      engagement: {
        views: promotion.views,
        uniqueViewers: uniqueViewers.length,
        clicks: promotion.clicks,
        conversionRate: promotion.views > 0 ? ((promotion.clicks / promotion.views) * 100).toFixed(2) : 0,
        uniqueViewRate: promotion.views > 0 ? ((uniqueViewers.length / promotion.views) * 100).toFixed(2) : 0
      },
      fileInfo: {
        name: promotion.mediaFileName,
        type: promotion.mediaType,
        size: promotion.fileSize,
        mimeType: promotion.mimeType
      },
      recentViews: viewHistory.map(view => ({
        user: view.userId ? view.userId.fullName : 'Unknown',
        email: view.userId ? view.userId.email : 'Unknown',
        viewedAt: view.viewedAt
      })),
      created: promotion.createdAt,
      status: promotion.published ? "Published" : "Draft"
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error("GET ANALYTICS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// GET MEDIA INFO
// ======================================

const getMediaInfo = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID"
      });
    }

    const promotion = await Promotion.findOne({ mediaFileId: fileId });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Media file not found"
      });
    }

    res.json({
      success: true,
      mediaInfo: {
        fileId: promotion.mediaFileId,
        fileName: promotion.mediaFileName,
        fileSize: promotion.fileSize,
        mimeType: promotion.mimeType,
        mediaType: promotion.mediaType,
        promotionTitle: promotion.title
      }
    });
  } catch (error) {
    console.error("GET MEDIA INFO ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// BULK DELETE PROMOTIONS
// ======================================

const bulkDeletePromotions = async (req, res) => {
  try {
    const { promotionIds } = req.body;

    if (!promotionIds || !promotionIds.length) {
      return res.status(400).json({
        success: false,
        message: "No promotion IDs provided"
      });
    }

    const promotions = await Promotion.find({ _id: { $in: promotionIds } });

    if (gfsBucket) {
      for (const promo of promotions) {
        if (promo.mediaFileId) {
          try {
            await gfsBucket.delete(promo.mediaFileId);
          } catch (error) {
            console.error("Error deleting GridFS file:", error);
          }
        }
      }
    }

    await PromotionView.deleteMany({ promotionId: { $in: promotionIds } });
    await Promotion.deleteMany({ _id: { $in: promotionIds } });

    res.json({
      success: true,
      message: `${promotions.length} promotions deleted successfully`
    });
  } catch (error) {
    console.error("BULK DELETE PROMOTIONS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================
// EXPORT ALL CONTROLLER FUNCTIONS
// ======================================

module.exports = {
  setGridFSBucket,
  createPromotion,
  getPromotions,
  getPromotion,
  deletePromotion,
  updatePromotion,
  publishPromotion,
  unpublishPromotion,
  getVisiblePromotions,
  getPromotionsByPlacement,
  trackClick,
  trackView,
  trackViews,
  getAnalytics,
  getMediaInfo,
  bulkDeletePromotions,
  getUniqueViewCount
};