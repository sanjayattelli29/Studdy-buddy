# PowerShell CORS Test Script for StudyBuddy Backend
Write-Host "🧪 Testing CORS Configuration for StudyBuddy Backend" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Backend URL
$BACKEND_URL = "https://studdy-buddy-uz0q.onrender.com"
# Your frontend URL  
$FRONTEND_URL = "https://studdy-buddy-29.netlify.app"

Write-Host ""
Write-Host "📍 Backend URL: $BACKEND_URL" -ForegroundColor Yellow
Write-Host "📍 Frontend URL: $FRONTEND_URL" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣ Testing Health Endpoint OPTIONS..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -Method OPTIONS -Headers @{
        "Origin" = $FRONTEND_URL
        "Access-Control-Request-Method" = "GET"
    } -UseBasicParsing
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Headers:" -ForegroundColor White
    $response.Headers | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2️⃣ Testing Notifications Endpoint OPTIONS..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/notifications/send-mention" -Method OPTIONS -Headers @{
        "Origin" = $FRONTEND_URL
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    } -UseBasicParsing
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Headers:" -ForegroundColor White
    $response.Headers | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "3️⃣ Testing R2 Upload Endpoint OPTIONS..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/r2/upload" -Method OPTIONS -Headers @{
        "Origin" = $FRONTEND_URL
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    } -UseBasicParsing
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Headers:" -ForegroundColor White
    $response.Headers | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4️⃣ Testing Actual POST Request..." -ForegroundColor Green
try {
    $body = @{
        recipientEmail = "test@example.com"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/notifications/test" -Method POST -Headers @{
        "Origin" = $FRONTEND_URL
        "Content-Type" = "application/json"
    } -Body $body -UseBasicParsing
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body Preview:" -ForegroundColor White
    Write-Host $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)) -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ CORS Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Look for these headers in the responses above:" -ForegroundColor Yellow
Write-Host "- Access-Control-Allow-Origin: *" -ForegroundColor Cyan
Write-Host "- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS" -ForegroundColor Cyan
Write-Host "- Access-Control-Allow-Headers: [various headers]" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you see Status: 200 and the Access-Control headers, CORS is working! 🎉" -ForegroundColor Green
