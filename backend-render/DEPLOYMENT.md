# StudyBuddy Backend Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup
Make sure you have these environment variables ready for Render:

```env
NODE_ENV=production
PORT=3001

# Your frontend URL (replace with actual Netlify/Vercel URL)
FRONTEND_URL=https://your-frontend-app.netlify.app

# Cloudflare R2 Storage
R2_ENDPOINT=https://d0a1f1a7e1e06425039826c6510737e2.r2.cloudflarestorage.com
R2_BUCKET_NAME=my-datasets
R2_ACCESS_KEY_ID=b6b1ccdacca8165e7ccf3d31977bdee7
R2_SECRET_ACCESS_KEY=41b4a21e215ddff13ed22cb1f582f086b0dc7aeb8170f0c690e8f5f2a47bc9c4

# Gmail SMTP for notifications
EMAIL_USER=editwithsanjay@gmail.com
EMAIL_PASS=ojlj yifv ensn ygsg
```

### 2. Test Locally First
1. Run: `npm install` in backend-render folder
2. Start server: `npm start`
3. Open: http://localhost:3001/test-api.html
4. Test all endpoints (health, R2, email)

## 🚀 Render Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add backend-render for production deployment"
git push origin main
```

### Step 2: Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `studybuddy-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend-render`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Add Environment Variables
In Render dashboard, add these environment variables:
- `NODE_ENV` = `production`
- `FRONTEND_URL` = `https://your-frontend-domain.com`
- `R2_ENDPOINT` = `https://d0a1f1a7e1e06425039826c6510737e2.r2.cloudflarestorage.com`
- `R2_BUCKET_NAME` = `my-datasets`
- `R2_ACCESS_KEY_ID` = `b6b1ccdacca8165e7ccf3d31977bdee7`
- `R2_SECRET_ACCESS_KEY` = `41b4a21e215ddff13ed22cb1f582f086b0dc7aeb8170f0c690e8f5f2a47bc9c4`
- `EMAIL_USER` = `editwithsanjay@gmail.com`
- `EMAIL_PASS` = `ojlj yifv ensn ygsg`

### Step 4: Deploy
Click **"Create Web Service"** - Render will build and deploy automatically.

### Step 5: Get Your API URL
After deployment, you'll get a URL like:
`https://studybuddy-backend-xyz.onrender.com`

## 🔧 Update Frontend Configuration

Once deployed, update your frontend `.env` file:

```env
# Replace with your actual Render deployment URL
VITE_API_URL=https://studybuddy-backend-xyz.onrender.com/api
```

## ✅ Post-Deployment Testing

Test your deployed API:
1. Health: `https://your-backend-url.onrender.com/health`
2. Test page: `https://your-backend-url.onrender.com/test-api.html`
3. Upload test: Use the test page to upload a file
4. Email test: Send a test email notification

## 📝 Important Notes

### For Production:
- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading to paid plan for production apps

### Frontend Integration:
- Update `VITE_API_URL` in frontend `.env`
- Test mention notifications in study rooms
- Test PDF uploads in PDF Discussion section

### Monitoring:
- Check Render logs for any errors
- Monitor email delivery
- Test file upload/download functionality

## 🔍 Troubleshooting

### Common Issues:

**R2 Upload Fails:**
- Check R2 credentials in environment variables
- Verify bucket permissions

**Email Not Sending:**
- Verify Gmail app password (not regular password)
- Check 2FA is enabled on Gmail account

**CORS Errors:**
- Update `FRONTEND_URL` to match your actual frontend domain
- Add additional origins if needed

**Slow Cold Starts:**
- Expected on Render free tier
- Consider paid plan for faster startup

### Debug Commands:
```bash
# Check deployment logs
curl https://your-backend-url.onrender.com/health

# Test specific endpoints
curl -X POST https://your-backend-url.onrender.com/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail": "test@example.com"}'
```

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Test endpoints individually using the test page
3. Verify all environment variables are set correctly
4. Ensure R2 bucket and Gmail are properly configured

---

**Ready to Deploy? Follow the steps above and your StudyBuddy backend will be live! 🎉**
