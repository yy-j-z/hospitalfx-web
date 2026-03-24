param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

function Resolve-JavaCommand {
    $javaCommand = Get-Command java.exe -ErrorAction SilentlyContinue
    if ($javaCommand) {
        return $javaCommand.Source
    }

    $fallback = "C:\Program Files\Common Files\Oracle\Java\javapath\java.exe"
    if (Test-Path $fallback) {
        return $fallback
    }

    throw "java.exe was not found. Please install JDK 17 first."
}

$backendRoot = Split-Path -Parent $PSCommandPath
$envFile = Join-Path $backendRoot ".env.local"
$envExample = Join-Path $backendRoot ".env.example"
$envLoader = Join-Path $backendRoot "scripts\Load-EnvFile.ps1"
$mavenWrapper = Join-Path $backendRoot "mvnw.cmd"
$jarPath = Join-Path $backendRoot "target\hospitalfx-backend-1.0.0.jar"
$javaExe = Resolve-JavaCommand

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "Created backend/.env.local. Please review it if you need different database settings." -ForegroundColor Yellow
}

& $envLoader -Path $envFile
$env:PORT = "$Port"

Set-Location $backendRoot

if (-not (Test-Path $jarPath)) {
    Write-Host "Backend jar not found. Building it once..." -ForegroundColor Yellow
    & $mavenWrapper -q -DskipTests package
}

if (-not (Test-Path $jarPath)) {
    throw "Backend jar build failed: $jarPath"
}

Write-Host "Starting backend at http://localhost:$Port" -ForegroundColor Green
& $javaExe -jar $jarPath
