const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload folder if missing
const uploadDirectory =
path.join(
    __dirname,
    "../uploads/dutyProofs"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

// Storage
const storage = multer.diskStorage({

    destination(req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename(req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9);

        cb(
            null,
            uniqueName +
            path.extname(file.originalname)
        );

    }

});

// Allowed file types
const fileFilter = (
    req,
    file,
    cb
) => {

    const allowed = [

        "application/pdf",

        "image/jpeg",

        "image/jpg",

        "image/png"

    ];

    if (
        allowed.includes(file.mimetype)
    ) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only PDF, JPG, JPEG and PNG files are allowed."
            ),
            false
        );

    }

};

// Upload middleware
const upload =
multer({

    storage,

    fileFilter,

    limits: {

        fileSize:
            5 * 1024 * 1024

    }

});

module.exports = upload;