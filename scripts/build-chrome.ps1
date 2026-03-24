$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $root "dist\\chrome"

if (Test-Path $distDir) {
    Remove-Item -Path $distDir -Recurse -Force
}

New-Item -ItemType Directory -Path $distDir | Out-Null
Copy-Item -Path (Join-Path $root "src") -Destination (Join-Path $distDir "src") -Recurse

$manifestPath = Join-Path $root "manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

if ($manifest.PSObject.Properties.Name -contains "browser_specific_settings") {
    $manifest.PSObject.Properties.Remove("browser_specific_settings")
}

if ($manifest.PSObject.Properties.Name -contains "chrome_settings_overrides") {
    $manifest.PSObject.Properties.Remove("chrome_settings_overrides")
}

$manifest | ConvertTo-Json -Depth 10 | Set-Content -Path (Join-Path $distDir "manifest.json") -Encoding utf8
