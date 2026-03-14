$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $root "dist"
$chromeDir = Join-Path $distDir "chrome"
$packageDir = Join-Path $distDir "packages"

& (Join-Path $PSScriptRoot "build-chrome.ps1")

if (-not (Test-Path $packageDir)) {
    New-Item -ItemType Directory -Path $packageDir | Out-Null
}

$packageJson = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$zipName = "omnimark-chrome-v$($packageJson.version).zip"
$zipPath = Join-Path $packageDir $zipName

if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
}

Compress-Archive -Path (Join-Path $chromeDir "*") -DestinationPath $zipPath -Force
