const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST before requiring routes
dotenv.config();

const r2StorageRoutes = require('./routes/r2Storage');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://localhost:8080',
    'https://study-buddy-29.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove any undefined values
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/r2', r2StorageRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve the API test page
app.get('/test-api.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-api.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'StudyBuddy Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      'Health Check': '/health',
      'API Test Page': '/test-api.html',
      'R2 Upload': 'POST /api/r2/upload',
      'R2 Delete': 'DELETE /api/r2/delete/:filePath',
      'R2 List': 'GET /api/r2/list/:folder',
      'R2 Info': 'GET /api/r2/info/:filePath',
      'R2 Serve File': 'GET /api/r2/serve/:filePath',
      'Send Mention': 'POST /api/notifications/send-mention',
      'Send Notification': 'POST /api/notifications/send-notification',
      'Test Email': 'POST /api/notifications/test',
      'Test R2': 'GET /api/test-r2'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'StudyBuddy Backend API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    testPage: '/test-api.html',
    healthCheck: '/health'
  });
});

// Test endpoint for R2 connection
app.get('/api/test-r2', (req, res) => {
  res.json({
    status: 'OK',
    message: 'R2 Storage API endpoint is ready',
    endpoint: process.env.R2_ENDPOINT ? 'configured' : 'not configured',
    bucket: process.env.R2_BUCKET_NAME ? 'configured' : 'not configured'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StudyBuddy Backend Server is running on port ${PORT}`);
  console.log(`📁 R2 Storage service is ready`);
  console.log(`📧 Email notifications service is ready`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test R2: http://localhost:${PORT}/api/test-r2`);
});

module.exports = app;
