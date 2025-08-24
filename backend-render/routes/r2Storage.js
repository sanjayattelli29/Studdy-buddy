const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// R2 configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

// Initialize S3 client for R2
const s3 = new AWS.S3({
  endpoint: R2_ENDPOINT,
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
  s3ForcePathStyle: true,
});

console.log("R2 Storage configuration:", {
  endpoint: R2_ENDPOINT ? 'configured' : 'missing',
  bucket: R2_BUCKET_NAME ? 'configured' : 'missing',
  accessKeyAvailable: !!R2_ACCESS_KEY_ID
});

// Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { folder } = req.body;
    
    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // Create the full path with folder structure
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    console.log(`Uploading to R2: ${filePath}`);
    
    // Upload to R2
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ContentLength: req.file.size,
      Metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    };
    
    const result = await s3.upload(uploadParams).promise();
    
    // Generate public URL
    const publicUrl = `${R2_ENDPOINT}/${filePath}`;
    
    console.log("R2 upload successful:", filePath);
    
    res.json({
      url: publicUrl,
      public_id: filePath,
      size: req.file.size,
      originalName: req.file.originalname,
      etag: result.ETag
    });
  } catch (error) {
    console.error('Error uploading to R2:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete endpoint
router.delete('/delete/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    console.log(`Deleting from R2: ${filePath}`);
    
    const deleteParams = {
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
    };
    
    await s3.deleteObject(deleteParams).promise();
    
    console.log("R2 delete successful:", filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      filePath: filePath
    });
  } catch (error) {
    console.error('Error deleting from R2:', error);
    res.status(500).json({ 
      error: 'Delete failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// List files endpoint (optional)
router.get('/list/:folder(*)?', async (req, res) => {
  try {
    const folder = req.params.folder || '';
    
    console.log(`Listing files in R2 folder: ${folder}`);
    
    const listParams = {
      Bucket: R2_BUCKET_NAME,
      Prefix: folder,
      MaxKeys: 100
    };
    
    const result = await s3.listObjectsV2(listParams).promise();
    
    const files = result.Contents?.map(file => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      url: `${R2_ENDPOINT}/${file.Key}`
    })) || [];
    
    res.json({
      success: true,
      files: files,
      folder: folder,
      count: files.length
    });
  } catch (error) {
    console.error('Error listing R2 files:', error);
    res.status(500).json({ 
      error: 'List failed', 
      message: error.message 
    });
  }
});

// Get file info endpoint
router.get('/info/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    console.log(`Getting R2 file info: ${filePath}`);
    
    const headParams = {
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
    };
    
    const result = await s3.headObject(headParams).promise();
    
    res.json({
      success: true,
      file: {
        key: filePath,
        size: result.ContentLength,
        contentType: result.ContentType,
        lastModified: result.LastModified,
        metadata: result.Metadata,
        url: `${R2_ENDPOINT}/${filePath}`
      }
    });
  } catch (error) {
    if (error.code === 'NotFound') {
      res.status(404).json({ 
        error: 'File not found', 
        filePath: req.params.filePath 
      });
    } else {
      console.error('Error getting R2 file info:', error);
      res.status(500).json({ 
        error: 'Get file info failed', 
        message: error.message 
      });
    }
  }
});

module.exports = router;
