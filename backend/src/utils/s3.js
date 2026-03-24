const AWS = require('aws-sdk');
const path = require('path');

const s3 = new AWS.S3({
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region:          process.env.AWS_S3_REGION || 'ap-south-1',
});

const BUCKET = process.env.AWS_S3_BUCKET || 'vinsup-edutech-files';
const REGION = process.env.AWS_S3_REGION  || 'ap-south-1';

/**
 * Upload a file buffer to S3 and return the public URL.
 * @param {Buffer} buffer       - File contents
 * @param {string} originalName - Original file name (used for extension)
 * @param {string} mimetype     - MIME type
 * @param {string} [folder]     - S3 folder prefix (default: 'content')
 * @returns {Promise<string>}   - Public S3 URL
 */
const uploadToS3 = async (buffer, originalName, mimetype, folder = 'content') => {
    const ext      = path.extname(originalName) || '';
    const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const key      = `${folder}/${safeName}`;

    await s3.putObject({
        Bucket:      BUCKET,
        Key:         key,
        Body:        buffer,
        ContentType: mimetype,
    }).promise();

    // Construct the public URL (bucket policy allows GetObject for *)
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
};

module.exports = { uploadToS3, s3, BUCKET };
