# SpryVibe Rebranding Script
# This script replaces all OpenCut references with SpryVibe Video Editor

Write-Host "Starting SpryVibe rebranding process..." -ForegroundColor Green

# Define replacement pairs
$replacements = @{
    "OpenCut" = "SpryVibe Video Editor"
    "opencut" = "spryvibe"
    "OPENCUT" = "SPRYVIBE"
    "OpenCut-app/OpenCut" = "JKS137/Spryvibe"
    "OpenCutApp" = "SpryVibeApp"
    "opencutapp" = "spryvibeapp"
    "opencut.app" = "spryvibe.app"
    "oss@opencut.app" = "oss@spryvibe.app"
    "security@opencut.app" = "security@spryvibe.app"
}

# Files to process (with specific patterns)
$filesToProcess = @(
    "README.md",
    "CLAUDE.md",
    "LICENSE",
    "netlify.toml",
    "export-email.txt",
    ".github\CONTRIBUTING.md",
    ".github\SUPPORT.md",
    ".github\SECURITY.md",
    ".github\ISSUE_TEMPLATE\feature_request.yml"
)

# Process each file
foreach ($file in $filesToProcess) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        $content = Get-Content $fullPath -Raw
        
        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            $content = $content -replace [regex]::Escape($old), $new
        }
        
        Set-Content $fullPath $content -NoNewline
        Write-Host "  ✓ Completed" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nRebranding script completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'bun install' to update dependencies"
Write-Host "2. Update database connection strings in docker-compose.yaml"
Write-Host "3. Review and test the application"
