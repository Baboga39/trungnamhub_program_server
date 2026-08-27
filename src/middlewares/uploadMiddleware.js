const multer = require("multer");

// Store upload files in memory buffer before streaming to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allowed file extensions/mimetypes
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/csv",
      "application/csv",
      "application/x-csv",
      "text/x-csv",
      "text/comma-separated-values",
      "text/x-comma-separated-values",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ];

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".xlsm",
      ".csv",
      ".ppt",
      ".pptx",
      ".txt",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".zip",
    ];

    const ext = file.originalname ? require("path").extname(file.originalname).toLowerCase() : "";

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not supported`), false);
    }
  },
});

module.exports = upload;
