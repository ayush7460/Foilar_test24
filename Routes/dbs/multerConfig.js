const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadDir = "uploads98/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); 
}

// Storage setup (Temporary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads98/"); // Temp save before uploading to Cloudinary
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
