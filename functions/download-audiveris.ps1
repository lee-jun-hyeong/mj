# Audiveris JAR file download script (PowerShell)

Write-Host "Downloading Audiveris..." -ForegroundColor Green

# Get latest release info
try {
    $releaseInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/Audiveris/audiveris/releases/latest"
    Write-Host "Release: $($releaseInfo.tag_name)" -ForegroundColor Cyan
    
    # Find JAR file
    $jarAsset = $releaseInfo.assets | Where-Object { $_.name -like "*audiveris*.jar" -or $_.name -like "*.jar" } | Select-Object -First 1
    
    if ($jarAsset) {
        $downloadUrl = $jarAsset.browser_download_url
        Write-Host "Found JAR: $($jarAsset.name)" -ForegroundColor Green
    } else {
        Write-Host "No JAR file in release. You may need to build from source." -ForegroundColor Yellow
        Write-Host "Alternative: Download manually from https://github.com/Audiveris/audiveris/releases" -ForegroundColor Yellow
        
        # Try direct URL
        $downloadUrl = "https://github.com/Audiveris/audiveris/releases/download/$($releaseInfo.tag_name)/audiveris-$($releaseInfo.tag_name).jar"
        Write-Host "Trying direct URL: $downloadUrl" -ForegroundColor Yellow
    }
} catch {
    Write-Host "GitHub API error: $_" -ForegroundColor Red
    Write-Host "Please download manually from https://github.com/Audiveris/audiveris/releases" -ForegroundColor Yellow
    exit 1
}

if (-not $downloadUrl) {
    Write-Host "Error: Could not find Audiveris JAR file." -ForegroundColor Red
    Write-Host "Please download manually from https://github.com/Audiveris/audiveris/releases" -ForegroundColor Yellow
    exit 1
}

Write-Host "Download URL: $downloadUrl" -ForegroundColor Cyan

# Change to functions directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Download JAR file
Write-Host "Downloading..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile "audiveris.jar" -ErrorAction Stop
    
    if (Test-Path "audiveris.jar") {
        $fileInfo = Get-Item "audiveris.jar"
        $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
        Write-Host "Download complete: audiveris.jar ($fileSizeMB MB)" -ForegroundColor Green
    } else {
        Write-Host "Download failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Download error: $_" -ForegroundColor Red
    Write-Host "Please download manually from https://github.com/Audiveris/audiveris/releases" -ForegroundColor Yellow
    exit 1
}
