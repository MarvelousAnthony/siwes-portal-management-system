Write-Host "🚀 Starting SIWES Logbook & Report Management System..." -ForegroundColor Cyan

# Start Backend Express API Server in a separate window
Write-Host "   -> Launching Backend API Server on http://localhost:4000..." -ForegroundColor Yellow
Start-Process -FilePath "C:\Users\ICT\AppData\Local\ms-playwright-go\1.57.0\node.exe" -ArgumentList "node_modules/ts-node/dist/bin.js src/index.ts" -WorkingDirectory "$PSScriptRoot\backend" -WindowStyle Minimized

# Start Frontend React Server in a separate window
Write-Host "   -> Launching Frontend React Server on http://localhost:3001..." -ForegroundColor Yellow
Start-Process -FilePath "C:\Users\ICT\AppData\Local\ms-playwright-go\1.57.0\node.exe" -ArgumentList "node_modules/vite/bin/vite.js --port 3001 --host" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Minimized

# Wait for servers to spin up
Start-Sleep -Seconds 3

# Launch Browser
Write-Host "🎉 Launching Web Browser..." -ForegroundColor Green
Start-Process "http://localhost:3001/"
