# StudyBuddy Backend API

Production backend server for StudyBuddy application, designed for deployment on Render.com.

## Features

- 📁 **R2 Storage API**: Upload, delete, list files using Cloudflare R2
- 📧 **Email Notifications**: Send mention notifications and general emails via Gmail SMTP
- 🔒 **CORS Configuration**: Properly configured for frontend communication
- 📊 **Health Monitoring**: Health check and status endpoints
- 🚀 **Production Ready**: Optimized for Render deployment

## API Endpoints

### R2 Storage Endpoints
- `POST /api/r2/upload` - Upload file to R2 storage
- `DELETE /api/r2/delete/:filePath` - Delete file from R2 storage
- `GET /api/r2/list/:folder` - List files in R2 folder
- `GET /api/r2/info/:filePath` - Get file information

### Notification Endpoints
- `POST /api/notifications/send-mention` - Send mention notification email
- `POST /api/notifications/send-notification` - Send general notification email
- `POST /api/notifications/test` - Test email configuration

### Health Endpoints
- `GET /health` - Health check
- `GET /api/test-r2` - Test R2 configuration

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:8081

# Cloudflare R2 Storage Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key

# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your R2 and email credentials

3. **Start the server:**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Test the API:**
   - Health check: `http://localhost:3001/health`
   - R2 test: `http://localhost:3001/api/test-r2`

## Deployment on Render

### 1. Prepare Repository
- Push this backend-render folder to your GitHub repository
- Ensure all files are committed

### 2. Create New Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - **Name**: `studybuddy-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend-render`

   **Build & Deploy:**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Environment Variables
Add the following environment variables in Render dashboard:

```
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Deploy
- Click "Create Web Service"
- Render will automatically build and deploy your application
- Your API will be available at: `https://your-service-name.onrender.com`

### 5. Update Frontend
Update your frontend `r2Storage.ts` to use the deployed API URL:

```typescript
const API_BASE_URL = 'https://your-service-name.onrender.com/api';
```

## Testing the Deployment

After deployment, test your endpoints:

1. **Health Check:**
   ```bash
   curl https://your-service-name.onrender.com/health
   ```

2. **R2 Configuration Test:**
   ```bash
   curl https://your-service-name.onrender.com/api/test-r2
   ```

3. **Email Test:**
   ```bash
   curl -X POST https://your-service-name.onrender.com/api/notifications/test \
     -H "Content-Type: application/json" \
     -d '{"recipientEmail": "your-email@example.com"}'
   ```

## Monitoring

- **Logs**: Check Render dashboard for application logs
- **Health**: Monitor `/health` endpoint
- **Performance**: Use Render's built-in metrics

## File Upload Limits

- Maximum file size: 50MB
- Supported formats: PDF, images, documents
- Files are stored in Cloudflare R2 with public access

## Security Features

- CORS protection for frontend domains
- File size limits to prevent abuse
- Environment variable protection
- Error message sanitization in production

## Troubleshooting

### Common Issues:

1. **R2 Upload Fails:**
   - Check R2 credentials in environment variables
   - Verify bucket name and endpoint URL
   - Ensure R2 bucket has proper permissions

2. **Email Not Sending:**
   - Verify Gmail app password (not regular password)
   - Check email credentials
   - Ensure Gmail account has 2FA enabled

3. **CORS Errors:**
   - Update `FRONTEND_URL` environment variable
   - Add additional origins to CORS configuration if needed

4. **File Upload Errors:**
   - Check file size (max 50MB)
   - Verify multipart/form-data content type
   - Ensure R2 bucket has sufficient storage

## Support

For issues or questions:
1. Check the logs in Render dashboard
2. Test individual endpoints with curl
3. Verify environment variables are set correctly
4. Check network connectivity and DNS resolution

---

**Note**: This backend is specifically designed for the StudyBuddy application and includes optimizations for PDF file handling and mention notification systems.
