const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const File = require('../models/file');
const router = express.Router();

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../Uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Only .pdf and .mp4 files allowed!'));
    cb(null, true);
  }
});

// Upload file
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { privacy } = req.body;
    const newFile = new File({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      privacy,
      uploaded_by: req.user.id
    });
    await newFile.save();
    res.json({ message: 'File uploaded successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get all public files
router.get('/public-files', async (req, res) => {
  const files = await File.find({ privacy: 'public' });
  res.json(files);
});

// Get user's own files
router.get('/my-files', verifyToken, async (req, res) => {
  const files = await File.find({ uploaded_by: req.user.id });
  res.json(files);
});
// DELETE file
// DELETE file
router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Only uploader can delete their file
    if (file.uploaded_by.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    // Remove file from local storage
    const fs = require('fs');
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Remove from database
    await file.deleteOne();

    res.json({ message: 'File deleted successfully!' });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ message: 'Error deleting file' });
  }
});


module.exports = router;
