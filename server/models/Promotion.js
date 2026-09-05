const mongoose = require("mongoose");

// ===========================================================
// PROMOTION SCHEMA - SIMPLIFIED GRIDFS VERSION
// ===========================================================

const PromotionSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: "",
        trim: true
    },

    // =========================================================
    // GRIDFS MEDIA STORAGE
    // =========================================================
    
    mediaFileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "fs.files",
        required: true
    },

    mediaFileName: {
        type: String,
        required: true
    },

    mediaType: {
        type: String,
        enum: ["image", "video"],
        required: true
    },

    mimeType: {
        type: String,
        required: true
    },

    fileSize: {
        type: Number,
        required: true
    },

    // =========================================================
    // DISPLAY SETTINGS
    // =========================================================

    destinationUrl: {
        type: String,
        default: ""
    },

    placement: {
        type: String,
        enum: [
            "FLOATING_CORNER",
            "FORM_TOP",
            "FORM_BOTTOM",
            "LEFT_MARGIN",
            "RIGHT_MARGIN",
            "DASHBOARD_CARD"
        ],
        default: "FLOATING_CORNER"
    },

    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },

    // =========================================================
    // AUDIENCE TARGETING
    // =========================================================

    audienceRole: {
        type: String,
        default: "ALL"
    },

    department: {
        type: String,
        default: "ALL"
    },

    semester: {
        type: Number,
        default: 0
    },

    // =========================================================
    // PUBLISHING CONTROLS
    // =========================================================

    published: {
        type: Boolean,
        default: false
    },

    active: {
        type: Boolean,
        default: true
    },

    startDate: {
        type: Date,
        default: Date.now
    },

    endDate: {
        type: Date,
        default: null
    },

    // =========================================================
    // ANALYTICS
    // =========================================================

    views: {
        type: Number,
        default: 0
    },

    clicks: {
        type: Number,
        default: 0
    },

    // =========================================================
    // CREATOR INFO
    // =========================================================

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

},
{
    timestamps: true
});

// =========================================================
// INDEXES
// =========================================================

PromotionSchema.index({ published: 1, active: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ placement: 1 });

// =========================================================
// VIRTUAL PROPERTIES
// =========================================================

PromotionSchema.virtual('isActive').get(function() {
    if (!this.active || !this.published) return false;
    
    const now = new Date();
    if (this.startDate && this.startDate > now) return false;
    if (this.endDate && this.endDate < now) return false;
    
    return true;
});

PromotionSchema.virtual('mediaUrl').get(function() {
    return `/api/promotions/media/${this.mediaFileId}`;
});

// =========================================================
// METHODS
// =========================================================

// Record a view
PromotionSchema.methods.recordView = async function() {
    this.views += 1;
    await this.save();
};

// Record a click
PromotionSchema.methods.recordClick = async function() {
    this.clicks += 1;
    await this.save();
};

// =========================================================
// STATIC METHODS
// =========================================================

// Get active promotions for a user
PromotionSchema.statics.getActivePromotions = async function(user, placement = null) {
    const now = new Date();
    const query = {
        published: true,
        active: true,
        startDate: { $lte: now },
        $or: [
            { endDate: null },
            { endDate: { $gte: now } }
        ]
    };
    
    if (user) {
        query.$or = [
            { audienceRole: 'ALL' },
            { audienceRole: user.role }
        ];
        
        if (user.department) {
            query.department = { $in: ['ALL', user.department] };
        }
    }
    
    if (placement) {
        query.placement = placement;
    }
    
    return this.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .limit(10);
};



module.exports = mongoose.models.Promotion || mongoose.model("Promotion", PromotionSchema);