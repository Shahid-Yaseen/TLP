/**
 * S3/R2 Storage Service
 * 
 * Handles file uploads to Cloudflare R2 (S3 compatible)
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const path = require('path');

// Validate R2 configuration
function validateR2Config() {
    const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required R2 configuration: ${missing.join(', ')}`);
    }

    console.log('✓ R2 Configuration validated');
    console.log(`  Account ID: ${process.env.R2_ACCOUNT_ID}`);
    console.log(`  Bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log(`  Public URL: ${process.env.R2_PUBLIC_URL}`);
}

// Validate on module load
validateR2Config();

// Configure S3 Client for Cloudflare R2
const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
    // Add timeout and retry configuration
    requestHandler: {
        connectionTimeout: 30000,
        socketTimeout: 30000,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Test R2 connection
 */
async function testConnection() {
    try {
        const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
        await r2Client.send(command);
        console.log('✓ R2 connection successful');
        return true;
    } catch (error) {
        console.error('✗ R2 connection failed:', error.message);
        throw new Error(`R2 connection failed: ${error.message}`);
    }
}

/**
 * Upload a file to R2
 * @param {Object} file - Multer file object
 * @param {string} folder - Optional folder name
 * @returns {Promise<Object>} Upload result with URL
 */
async function uploadFile(file, folder = 'uploads') {
    if (!file) {
        throw new Error('No file provided');
    }

    if (!file.buffer) {
        throw new Error('File buffer is missing');
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${folder}/${sanitizedName}-${uniqueSuffix}${ext}`;

    console.log(`Uploading to R2: ${filename} (${file.size} bytes)`);

    try {
        const upload = new Upload({
            client: r2Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: filename,
                Body: file.buffer,
                ContentType: file.mimetype,
            },
        });

        await upload.done();

        // Ensure PUBLIC_URL is properly formatted (fix missing colon in https://)
        let baseUrl = PUBLIC_URL.trim();
        if (baseUrl.startsWith('https//')) {
          baseUrl = baseUrl.replace('https//', 'https://');
        } else if (baseUrl.startsWith('http//')) {
          baseUrl = baseUrl.replace('http//', 'http://');
        }
        
        // Ensure baseUrl ends with / for proper concatenation
        if (!baseUrl.endsWith('/')) {
          baseUrl += '/';
        }
        
        const fileUrl = `${baseUrl}${filename}`;

        console.log(`✓ Upload successful: ${fileUrl}`);

        return {
            url: fileUrl,
            key: filename,
            mimetype: file.mimetype,
            size: file.size
        };
    } catch (error) {
        console.error('✗ R2 upload error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            statusCode: error.$metadata?.httpStatusCode,
        });
        throw new Error(`R2 upload failed: ${error.message}`);
    }
}

/**
 * Delete a file from R2
 * @param {string} key - File key
 */
async function deleteFile(key) {
    if (!key) return;

    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        await r2Client.send(command);
        console.log(`✓ Deleted from R2: ${key}`);
    } catch (error) {
        console.error('✗ Error deleting from R2:', error);
        // Don't throw to prevent breaking the flow if delete fails
    }
}

module.exports = {
    uploadFile,
    deleteFile,
    testConnection
};
