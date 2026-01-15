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
      code: 'VALIDATION_ERROR'
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
    res.status(500).json({
      error: 'Failed to upload image to R2',
      message: error.message,
      details: 'Please check R2 configuration and credentials'
    });
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
