const functions = require("firebase-functions");
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const cors = require("cors");

const app = express();

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Setup R2 (S3-compatible) - using environment config
const s3 = new AWS.S3({
  endpoint:
    "https://d0a1f1a7e1e06425039826c6510737e2.r2.cloudflarestorage.com",
  accessKeyId: "b6b1ccdacca8165e7ccf3d31977bdee7",
  secretAccessKey:
    "41b4a21e215ddff13ed22cb1f582f086b0dc7aeb8170f0c690e8f5f2a47bc9c4",
  region: "auto",
  signatureVersion: "v4",
  s3ForcePathStyle: true,
});

const BUCKET_NAME = "my-datasets";
const R2_ENDPOINT =
  "https://d0a1f1a7e1e06425039826c6510737e2.r2.cloudflarestorage.com";

// Upload route
app.post("/r2/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({error: "No file provided"});
    }

    console.log(`Uploading file: ${req.file.originalname}`);

    const {folder} = req.body;

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = req.file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${sanitizedFileName}`;

    // Create the full path with folder structure
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const params = {
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ContentLength: req.file.size,
      Metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    };

    await s3.upload(params).promise();

    // Generate public URL
    const fileUrl = `${R2_ENDPOINT}/${filePath}`;

    console.log("R2 upload successful:", filePath);

    res.json({
      url: fileUrl,
      public_id: filePath,
      size: req.file.size,
      originalName: req.file.originalname,
    });
  } catch (err) {
    console.error("R2 upload error:", err);
    res.status(500).json({
      error: "Upload failed",
      message: err.message,
    });
  }
});

// Delete route
app.delete("/r2/delete/:filePath(*)", async (req, res) => {
  try {
    const filePath = req.params.filePath;

    console.log(`Deleting file: ${filePath}`);

    const params = {
      Bucket: BUCKET_NAME,
      Key: filePath,
    };

    await s3.deleteObject(params).promise();

    console.log("R2 delete successful:", filePath);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    console.error("R2 delete error:", err);
    res.status(500).json({
      error: "Delete failed",
      message: err.message,
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "R2 Storage API is running",
    timestamp: new Date().toISOString(),
  });
});

// Expose as Firebase Function
exports.api = functions.https.onRequest(app);
