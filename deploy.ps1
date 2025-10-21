# Deploy Script for Windows PowerShell
# This script will prepare and upload the project to server

Write-Host "=== FRD Fund Deployment Script ===" -ForegroundColor Green
Write-Host "Target Server: 210.1.58.138" -ForegroundColor Yellow
Write-Host "User: tom" -ForegroundColor Yellow
Write-Host ""

# 1. Clean up old zip
Write-Host "Step 1: Cleaning up old deployment files..." -ForegroundColor Cyan
if (Test-Path "c:\frdfund-deploy.zip") {
    Remove-Item "c:\frdfund-deploy.zip" -Force
    Write-Host "Removed old zip file" -ForegroundColor Green
}

# 2. Create deployment zip (exclude node_modules, .git, uploads)
Write-Host ""
Write-Host "Step 2: Creating deployment package..." -ForegroundColor Cyan
$source = "c:\frdfund"
$destination = "c:\frdfund-deploy.zip"

# Get all files except excluded directories
$files = Get-ChildItem -Path $source -Recurse -File | 
    Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.git\\|\\uploads\\' }

# Create zip
Compress-Archive -Path $files.FullName -DestinationPath $destination -Force
Write-Host "Created deployment package: $destination" -ForegroundColor Green

# 3. Show package info
$zipSize = (Get-Item $destination).Length / 1MB
Write-Host "Package size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

# 4. Upload instructions
Write-Host ""
Write-Host "Step 3: Upload to server" -ForegroundColor Cyan
Write-Host "Run this command to upload:" -ForegroundColor Yellow
Write-Host "scp c:\frdfund-deploy.zip tom@210.1.58.138:/home/tom/" -ForegroundColor White
Write-Host ""
Write-Host "Step 4: SSH to server and deploy" -ForegroundColor Cyan
Write-Host "ssh tom@210.1.58.138" -ForegroundColor White
Write-Host ""
Write-Host "Then run these commands on the server:" -ForegroundColor Yellow
Write-Host "cd /home/tom" -ForegroundColor White
Write-Host "unzip -o frdfund-deploy.zip -d frdfund" -ForegroundColor White
Write-Host "cd frdfund" -ForegroundColor White
Write-Host "sudo docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "sudo docker-compose -f docker-compose.prod.yml build" -ForegroundColor White
Write-Host "sudo docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor White

Write-Host ""
Write-Host "=== Deployment package ready! ===" -ForegroundColor Green
