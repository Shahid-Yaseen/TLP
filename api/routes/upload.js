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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

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
 */
router.post('/crew', authenticate, role('admin'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'VALIDATION_ERROR'
    });
  }

  // Generate public URL
  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
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

  // Generate public URL
  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
}));

module.exports = router;

