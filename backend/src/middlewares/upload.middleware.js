const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure system upload directories exist
const uploadDirectory = path.join(__dirname, '../../uploads');
const tempDirectory = path.join(__dirname, '../../uploads/temp');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}
if (!fs.existsSync(tempDirectory)) {
    fs.mkdirSync(tempDirectory, { recursive: true });
}

// Memory / Local Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Depending on context, we will route to specific sub-folders in controllers
        // Default to temp processing bin
        cb(null, tempDirectory);
    },
    filename: (req, file, cb) => {
        // Generate a secure, unique filename to prevent collisions while preserving original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Explicit Enterprise File Constraint Logic
// Allowing exactly: DOCX, XLSX, PDF, PBIX (PowerBI), TWBX (Tableau), PY, PSD, HTML, ZIP, MP4, MP3
const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/pdf', // PDF
    'application/zip', // ZIP / PBIX / TWBX are often zipped binary structures
    'application/x-zip-compressed', // ZIP Fallback
    'video/mp4', // MP4
    'audio/mpeg', // MP3
    'audio/wav', // WAV
    'text/html', // HTML
    'text/css', // CSS
    'text/javascript', // JS
    'application/javascript', // JS alt
    'text/csv', // CSV
    'application/json', // JSON
    'image/vnd.adobe.photoshop', // PSD
    'image/jpeg', // JPG
    'image/png', // PNG
    'image/gif', // GIF
    'image/svg+xml', // SVG
    'text/x-python', // PY (some browsers map it here)
    'text/plain', // PY / TXT generic fallback
    'application/octet-stream' // PBIX, TWBX, PY generic binaries
];

// Fallback regex for pure extensions to catch tricky binaries mapping to octet-streams
const strictExtensions = /\.(docx|xlsx|pptx|pdf|pbix|twbx|py|psd|html|css|js|csv|json|zip|mp4|mp3|wav|jpg|jpeg|png|gif|svg|txt)$/i;

const fileFilter = (req, file, cb) => {
    // 1. Check strict Mimetype definitions
    const isMimeValid = allowedMimes.includes(file.mimetype);
    // 2. Validate explicit file name extensions
    const isExtValid = strictExtensions.test(path.extname(file.originalname).toLowerCase());

    if (isMimeValid || isExtValid) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid File Submission Type: Only DOCX, XLSX, PDF, PBIX, TWBX, PY, PSD, HTML, ZIP, MP4, or MP3 are allowed in this portal. [Detected: ${file.mimetype}]`), false);
    }
};

// Compile final Multer instance enforcing limits
// Size Limit setup to 100MB arbitrarily to allow MP4s and large PSDs
const uploadConfigs = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB Max
    }
});

module.exports = uploadConfigs;
