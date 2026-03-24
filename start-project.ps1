param(
    [int]$BackendPort = 8080,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

function Wait-BackendReady {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )

    $healthUrl = "http://localhost:$Port/api/health"
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
            if ($response.status -eq "ok") {
                return $true
            }
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }

    return $false
}

$projectRoot = Split-Path -Parent $PSCommandPath
$backendScript = Join-Path $projectRoot "backend\start-local.ps1"
$frontendScript = Join-Path $projectRoot "start-frontend.ps1"

Start-Process powershell.exe -WorkingDirectory $projectRoot -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $backendScript,
    "-Port",
    $BackendPort
)

Write-Host "Starting backend window on port $BackendPort ..." -ForegroundColor Yellow
if (Wait-BackendReady -Port $BackendPort) {
    Write-Host "Backend is ready." -ForegroundColor Green
}
else {
    Write-Warning "Backend did not report healthy within 60 seconds. Frontend will still be started."
}

Start-Process powershell.exe -WorkingDirectory $projectRoot -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $frontendScript,
    "-BackendPort",
    $BackendPort,
    "-FrontendPort",
    $FrontendPort
)

Write-Host "Opened separate backend and frontend windows." -ForegroundColor Green
Write-Host "Frontend: http://localhost:$FrontendPort"
Write-Host "Backend:  http://localhost:$BackendPort"
