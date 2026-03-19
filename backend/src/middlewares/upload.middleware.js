const multer = require('multer');
const path = require('path');

// ── Memory storage — files stored in RAM buffer, saved to DB as LONGBLOB ──────
const storage = multer.memoryStorage();

// Allowed file types
const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4',
    'audio/mpeg',
    'audio/wav',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'text/csv',
    'application/json',
    'image/vnd.adobe.photoshop',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'text/x-python',
    'text/plain',
    'application/octet-stream'
];

const strictExtensions = /\.(docx|xlsx|pptx|pdf|pbix|twbx|py|psd|html|css|js|csv|json|zip|mp4|mp3|wav|jpg|jpeg|png|gif|svg|txt)$/i;

const fileFilter = (req, file, cb) => {
    const isMimeValid = allowedMimes.includes(file.mimetype);
    const isExtValid = strictExtensions.test(path.extname(file.originalname).toLowerCase());
    if (isMimeValid || isExtValid) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
};

const uploadConfigs = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }
});

module.exports = uploadConfigs;