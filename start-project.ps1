param(
    [int]$BackendPort = 8080,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

function Test-CommandAvailable {
    param([Parameter(Mandatory = $true)][string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Wait-HttpOk {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return $true
            }
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }

    return $false
}

function Stop-PortProcess {
    param([Parameter(Mandatory = $true)][int]$Port)

    $processIds = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
        Where-Object { $_.State -eq "Listen" } |
        Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $processIds) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
        }
        catch {
            Write-Warning "Failed to stop process $processId on port ${Port}: $($_.Exception.Message)"
        }
    }
}

function Start-MySqlIfPresent {
    $services = Get-Service -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -in @("MySQL80", "mysql") -or $_.Name -like "mysql*" }

    foreach ($service in $services) {
        if ($service.Status -ne "Running") {
            try {
                Write-Host "Starting MySQL service: $($service.Name) ..." -ForegroundColor Yellow
                Start-Service -Name $service.Name -ErrorAction Stop
            }
            catch {
                Write-Warning "Could not start MySQL service $($service.Name). Please start MySQL manually if backend login fails."
            }
        }
    }
}

$projectRoot = Split-Path -Parent $PSCommandPath
$backendRoot = Join-Path $projectRoot "backend"
$backendScript = Join-Path $backendRoot "start-local.ps1"
$frontendScript = Join-Path $projectRoot "start-frontend.ps1"
$browserUrl = "http://localhost:$FrontendPort"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Rongcheng Medical Board - Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not (Test-Path $backendScript)) {
    throw "Backend start script not found: $backendScript"
}

if (-not (Test-Path $frontendScript)) {
    throw "Frontend start script not found: $frontendScript"
}

if (-not (Test-CommandAvailable "java.exe")) {
    throw "Java was not found. Please install JDK 17 first."
}

if (-not (Test-CommandAvailable "npm.cmd")) {
    throw "npm.cmd was not found. Please install Node.js first."
}

Start-MySqlIfPresent

Write-Host "Cleaning old local service ports ..." -ForegroundColor Yellow
Stop-PortProcess -Port $BackendPort
Stop-PortProcess -Port $FrontendPort
Start-Sleep -Seconds 1

Write-Host "Starting backend window: http://localhost:$BackendPort" -ForegroundColor Yellow
Start-Process powershell.exe -WorkingDirectory $backendRoot -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $backendScript,
    "-Port",
    $BackendPort
)

if (Wait-HttpOk -Url "http://localhost:$BackendPort/api/health" -TimeoutSeconds 75) {
    Write-Host "Backend is ready." -ForegroundColor Green
}
else {
    Write-Warning "Backend is not ready yet. Frontend will still start. If login fails, check the backend window."
}

Write-Host "Starting frontend window: http://localhost:$FrontendPort" -ForegroundColor Yellow
Start-Process powershell.exe -WorkingDirectory $projectRoot -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $frontendScript,
    "-BackendPort",
    $BackendPort,
    "-FrontendPort",
    $FrontendPort
)

if (Wait-HttpOk -Url $browserUrl -TimeoutSeconds 45) {
    Write-Host "Frontend is ready. Opening browser ..." -ForegroundColor Green
    Start-Process $browserUrl
}
else {
    Write-Warning "Frontend is not responding yet. Open this URL manually after a few seconds: $browserUrl"
}

Write-Host ""
Write-Host "App URL: $browserUrl" -ForegroundColor Green
Write-Host "Backend: http://localhost:$BackendPort" -ForegroundColor Green
Write-Host ""
Write-Host "You may close this window. Backend and frontend continue in their own windows."
