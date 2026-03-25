const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { ensureDirs, UPLOAD_ROOT } = require('../services/qrService');

ensureDirs();
const profileDir = path.join(UPLOAD_ROOT, 'profiles');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `profile-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
