/**
 * File Upload Routes
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Ensure uploads directory exists (keep for backward compatibility or local fallback)
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import R2 storage service
const r2Storage = require('../services/r2Storage');

// Configure multer storage - use memory storage for R2
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * POST /api/upload/crew
 * Upload crew member profile image (Admin only)
 * Integrated with Cloudflare R2
 */
router.post('/crew', authenticate, role('admin'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE',
      message: 'Please select an image file to upload'
    });
  }

  // Validate file size (already handled by multer, but add explicit check)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      error: 'File too large',
      code: 'FILE_TOO_LARGE',
      message: 'Image must be less than 5MB',
      details: `File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`
    });
  }

  try {
    // Always upload to Cloudflare R2
    const result = await r2Storage.uploadFile(req.file, 'crew');

    return res.json({
      url: result.url,
      key: result.key,
      filename: path.basename(result.key),
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      provider: 'r2'
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Provide specific error messages based on error type
    let errorResponse = {
      error: 'Upload failed',
      code: 'UPLOAD_ERROR',
      message: error.message
    };

    // Check for specific error types
    if (error.message.includes('R2 configuration')) {
      errorResponse = {
        error: 'R2 configuration error',
        code: 'R2_CONFIG_ERROR',
        message: 'Server storage configuration is invalid. Please contact administrator.',
        details: 'R2 credentials or bucket configuration is missing or incorrect'
      };
    } else if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      errorResponse = {
        error: 'Upload timeout',
        code: 'TIMEOUT',
        message: 'Upload took too long. Please try again with a smaller file.',
        details: error.message
      };
    } else if (error.message.includes('network') || error.code === 'ECONNREFUSED') {
      errorResponse = {
        error: 'Network error',
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to storage service. Please check your internet connection.',
        details: error.message
      };
    } else if (error.code === 'NoSuchBucket') {
      errorResponse = {
        error: 'Storage bucket not found',
        code: 'BUCKET_NOT_FOUND',
        message: 'Storage bucket does not exist. Please contact administrator.',
        details: 'R2 bucket configuration is incorrect'
      };
    } else if (error.code === 'AccessDenied') {
      errorResponse = {
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        message: 'Server does not have permission to upload files. Please contact administrator.',
        details: 'R2 access credentials are invalid or insufficient'
      };
    }

    res.status(500).json(errorResponse);
  }
}));

/**
 * POST /api/upload/mission
 * Upload mission page images (Admin only)
 * Integrated with Cloudflare R2
 */
router.post('/mission', authenticate, role('admin'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    // Always upload to Cloudflare R2
    const result = await r2Storage.uploadFile(req.file, 'mission');

    return res.json({
      url: result.url,
      key: result.key,
      filename: path.basename(result.key),
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      provider: 'r2'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload image to R2',
      message: error.message,
      details: 'Please check R2 configuration and credentials'
    });
  }
}));

/**
 * POST /api/upload/article
 * Upload article images (hero_image_url, featured_image_url) (Admin only)
 * Integrated with Cloudflare R2
 */
router.post('/article', authenticate, role('admin'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    // Always upload to Cloudflare R2
    const result = await r2Storage.uploadFile(req.file, 'articles');

    return res.json({
      url: result.url,
      key: result.key,
      filename: path.basename(result.key),
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      provider: 'r2'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload image to R2',
      message: error.message,
      details: 'Please check R2 configuration and credentials'
    });
  }
}));

/**
 * POST /api/upload
 * Generic upload endpoint (Admin only)
 */
router.post('/', authenticate, role('admin'), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    // Always upload to Cloudflare R2
    const result = await r2Storage.uploadFile(req.file, 'uploads');
    return res.json({
      url: result.url,
      key: result.key,
      provider: 'r2'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload to R2',
      message: error.message
    });
  }
}));

module.exports = router;
