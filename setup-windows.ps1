$ErrorActionPreference = "Stop"

function Refresh-SessionPath {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = @($machinePath, $userPath) -join ";"
}

function Ensure-WingetPackage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandName,
        [Parameter(Mandatory = $true)]
        [string]$PackageId,
        [Parameter(Mandatory = $true)]
        [string]$DisplayName
    )

    if (Get-Command $CommandName -ErrorAction SilentlyContinue) {
        Write-Host "$DisplayName is already installed." -ForegroundColor Green
        return
    }

    if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) {
        throw "winget was not found, so $DisplayName cannot be installed automatically."
    }

    Write-Host "Installing $DisplayName ..." -ForegroundColor Yellow
    & winget.exe install --id $PackageId --exact --accept-source-agreements --accept-package-agreements

    Refresh-SessionPath

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "$DisplayName was installed, but this terminal still cannot find it. Re-open the terminal and run setup-project.bat again."
    }
}

$projectRoot = Split-Path -Parent $PSCommandPath
$frontendEnvLocal = Join-Path $projectRoot ".env.local"
$frontendEnvExample = Join-Path $projectRoot ".env.example"
$backendRoot = Join-Path $projectRoot "backend"
$backendEnvLocal = Join-Path $backendRoot ".env.local"
$backendEnvExample = Join-Path $backendRoot ".env.example"
$mavenWrapper = Join-Path $backendRoot "mvnw.cmd"

Ensure-WingetPackage -CommandName "node.exe" -PackageId "OpenJS.NodeJS.LTS" -DisplayName "Node.js LTS"
Ensure-WingetPackage -CommandName "java.exe" -PackageId "EclipseAdoptium.Temurin.17.JDK" -DisplayName "JDK 17"

if (-not (Test-Path $frontendEnvLocal)) {
    Copy-Item $frontendEnvExample $frontendEnvLocal
    Write-Host "Created .env.local" -ForegroundColor Green
}

if (-not (Test-Path $backendEnvLocal)) {
    Copy-Item $backendEnvExample $backendEnvLocal
    Write-Host "Created backend/.env.local. Please update it with your own database settings." -ForegroundColor Yellow
}

Set-Location $projectRoot
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
& npm.cmd install

Set-Location $backendRoot
Write-Host "Downloading backend dependencies..." -ForegroundColor Yellow
& $mavenWrapper -q dependency:go-offline

Write-Host ""
Write-Host "Setup completed." -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "1. Open backend/.env.local and update the database settings."
Write-Host "2. Make sure MySQL is running."
Write-Host "3. Double-click start-project.bat to start the project."
