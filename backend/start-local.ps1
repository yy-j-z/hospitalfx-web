param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

function Resolve-JavaCommand {
    if (-not [string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
        $javaHomeCandidate = Join-Path $env:JAVA_HOME "bin\java.exe"
        if (Test-Path $javaHomeCandidate) {
            return $javaHomeCandidate
        }
    }

    $stableJdk = "C:\Users\jyy\tools\jdk-21.0.10\bin\java.exe"
    if (Test-Path $stableJdk) {
        return $stableJdk
    }

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
$jarPath = Join-Path $backendRoot "target\rongchengyishu-backend-1.0.0.jar"
$javaExe = Resolve-JavaCommand

function Resolve-MavenCommand {
    if (Test-Path $mavenWrapper) {
        return $mavenWrapper
    }

    $mavenCommand = Get-Command mvn.cmd -ErrorAction SilentlyContinue
    if ($mavenCommand) {
        return $mavenCommand.Source
    }

    $mavenCommand = Get-Command mvn -ErrorAction SilentlyContinue
    if ($mavenCommand) {
        return $mavenCommand.Source
    }

    throw "Maven was not found. Please install Maven or restore backend/mvnw.cmd."
}

function Get-LatestSourceWriteTime {
    $watchPaths = @(
        (Join-Path $backendRoot "src"),
        (Join-Path $backendRoot "pom.xml"),
        (Join-Path $backendRoot ".env.local"),
        (Join-Path $backendRoot "src\main\resources")
    ) | Where-Object { Test-Path $_ }

    $latest = Get-Date "2000-01-01"
    foreach ($path in $watchPaths) {
        if ((Get-Item $path) -is [System.IO.DirectoryInfo]) {
            $candidate = Get-ChildItem -Path $path -Recurse -File |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($candidate -and $candidate.LastWriteTime -gt $latest) {
                $latest = $candidate.LastWriteTime
            }
        } else {
            $candidate = Get-Item $path
            if ($candidate.LastWriteTime -gt $latest) {
                $latest = $candidate.LastWriteTime
            }
        }
    }

    return $latest
}

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "Created backend/.env.local. Please review it if you need different database settings." -ForegroundColor Yellow
}

& $envLoader -Path $envFile
$env:DB_URL = [Environment]::GetEnvironmentVariable("DB_URL", "Process")
$env:DB_DRIVER_CLASS_NAME = [Environment]::GetEnvironmentVariable("DB_DRIVER_CLASS_NAME", "Process")
$env:DB_USERNAME = [Environment]::GetEnvironmentVariable("DB_USERNAME", "Process")
$env:DB_PASSWORD = [Environment]::GetEnvironmentVariable("DB_PASSWORD", "Process")
$env:SQL_INIT_MODE = [Environment]::GetEnvironmentVariable("SQL_INIT_MODE", "Process")
$env:APP_CORS_ALLOWED_ORIGIN_PATTERNS = [Environment]::GetEnvironmentVariable("APP_CORS_ALLOWED_ORIGIN_PATTERNS", "Process")
$env:DEEPSEEK_API_KEY = [Environment]::GetEnvironmentVariable("DEEPSEEK_API_KEY", "Process")

if ([string]::IsNullOrWhiteSpace($env:DB_USERNAME)) {
    $env:DB_USERNAME = "root"
}

if ([string]::IsNullOrWhiteSpace($env:SQL_INIT_MODE)) {
    $env:SQL_INIT_MODE = "always"
}

$env:PORT = "$Port"

Set-Location $backendRoot

if (-not (Test-Path $jarPath) -or (Get-LatestSourceWriteTime) -gt (Get-Item $jarPath).LastWriteTime) {
    Write-Host "Backend source changed. Rebuilding jar..." -ForegroundColor Yellow
    $mavenCmd = Resolve-MavenCommand
    & $mavenCmd -q -DskipTests package
}

if (-not (Test-Path $jarPath)) {
    throw "Backend jar build failed: $jarPath"
}

Write-Host "Starting backend at http://localhost:$Port" -ForegroundColor Green
& $javaExe -jar $jarPath
