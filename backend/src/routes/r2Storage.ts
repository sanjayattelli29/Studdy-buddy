import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// R2 configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://d0a1f1a7e1e06425039826c6510737e2.r2.cloudflarestorage.com';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'my-datasets';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'b6b1ccdacca8165e7ccf3d31977bdee7';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '41b4a21e215ddff13ed22cb1f582f086b0dc7aeb8170f0c690e8f5f2a47bc9c4';

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

console.log("R2 Storage configuration:", {
  endpoint: R2_ENDPOINT,
  bucket: R2_BUCKET_NAME,
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
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ContentLength: req.file.size,
      Metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    await r2Client.send(uploadCommand);
    
    // Generate public URL
    const publicUrl = `${R2_ENDPOINT}/${filePath}`;
    
    console.log("R2 upload successful:", filePath);
    
    res.json({
      url: publicUrl,
      public_id: filePath,
      size: req.file.size,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Error uploading to R2:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete endpoint
router.delete('/delete/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    
    console.log(`Deleting from R2: ${filePath}`);
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
    });
    
    await r2Client.send(deleteCommand);
    
    console.log("R2 delete successful:", filePath);
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting from R2:', error);
    res.status(500).json({ 
      error: 'Delete failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
