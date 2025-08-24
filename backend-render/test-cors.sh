#!/bin/bash

echo "🧪 Testing CORS Configuration for StudyBuddy Backend"
echo "=================================================="

# Backend URL
BACKEND_URL="https://studdy-buddy-uz0q.onrender.com"
# Your frontend URL
FRONTEND_URL="https://studdy-buddy-29.netlify.app"

echo ""
echo "📍 Backend URL: $BACKEND_URL"
echo "📍 Frontend URL: $FRONTEND_URL"
echo ""

echo "1️⃣ Testing Health Endpoint..."
curl -s -H "Origin: $FRONTEND_URL" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     "$BACKEND_URL/health" \
     -v 2>&1 | grep -E "(Access-Control|HTTP/)"

echo ""
echo "2️⃣ Testing Notifications Endpoint..."
curl -s -H "Origin: $FRONTEND_URL" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     "$BACKEND_URL/api/notifications/send-mention" \
     -v 2>&1 | grep -E "(Access-Control|HTTP/)"

echo ""
echo "3️⃣ Testing R2 Upload Endpoint..."
curl -s -H "Origin: $FRONTEND_URL" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     "$BACKEND_URL/api/r2/upload" \
     -v 2>&1 | grep -E "(Access-Control|HTTP/)"

echo ""
echo "4️⃣ Testing Actual POST Request..."
curl -s -H "Origin: $FRONTEND_URL" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"recipientEmail": "test@example.com"}' \
     "$BACKEND_URL/api/notifications/test" \
     -v 2>&1 | head -20

echo ""
echo "✅ CORS Test Complete!"
echo ""
echo "Look for these headers in the responses above:"
echo "- Access-Control-Allow-Origin: *"
echo "- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"
echo "- Access-Control-Allow-Headers: [various headers]"
echo ""
echo "If you see HTTP/1.1 200 OK and the Access-Control headers, CORS is working! 🎉"
