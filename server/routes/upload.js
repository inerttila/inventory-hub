const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');

// Upload image for component
router.post('/component-image', (req, res) => {
  upload.single('image')(req, res, (err) => {
    // Handle multer errors
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Verify file was actually saved
      const filePath = path.join(req.file.destination, req.file.filename);
      if (!fs.existsSync(filePath)) {
        console.error('File was not saved:', filePath);
        return res.status(500).json({ message: 'File upload failed - file not found on disk' });
      }

      const fileStats = fs.statSync(filePath);
      console.log('File uploaded successfully:', {
        filename: req.file.filename,
        path: filePath,
        size: fileStats.size,
        destination: req.file.destination
      });

      // Return the file path relative to the uploads directory
      const relativePath = `/uploads/${req.file.filename}`;
      res.json({ 
        message: 'Image uploaded successfully',
        imagePath: relativePath,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: error.message });
    }
  });
});

module.exports = router;

