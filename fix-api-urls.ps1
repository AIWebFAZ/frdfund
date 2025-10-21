# Fix API URL replacement script
$files = Get-ChildItem -Path "c:\frdfund\frontend\src" -Recurse -Filter "*.jsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix broken template literals
    $content = $content -replace '\$\{config\.API_URL(/api/[^}]+)\}', '${config.API_URL}$1'
    $content = $content -replace '`\$\{config\.API_URL(/api/[^`]+)`', '`${config.API_URL}$1`'
    $content = $content -replace "'`\$\{config\.API_URL\}", '`${config.API_URL}'
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Fixed all template literals"
