param(
    [int]$BackendPort = 8080,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

function Resolve-NpmCommand {
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($npmCommand) {
        return $npmCommand.Source
    }

    $fallback = "C:\Program Files\nodejs\npm.cmd"
    if (Test-Path $fallback) {
        return $fallback
    }

    throw "npm.cmd was not found. Please install Node.js first."
}

function Resolve-NodeBinDirectory {
    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        return Split-Path -Parent $nodeCommand.Source
    }

    $fallback = "C:\Program Files\nodejs\node.exe"
    if (Test-Path $fallback) {
        return Split-Path -Parent $fallback
    }

    throw "node.exe was not found. Please install Node.js first."
}

$projectRoot = Split-Path -Parent $PSCommandPath
$envFile = Join-Path $projectRoot ".env.local"
$envExample = Join-Path $projectRoot ".env.example"
$npmCmd = Resolve-NpmCommand
$nodeBinDirectory = Resolve-NodeBinDirectory

if (-not (($env:Path -split ";") -contains $nodeBinDirectory)) {
    $env:Path = "$nodeBinDirectory;$env:Path"
}

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
}

Set-Location $projectRoot

if (-not (Test-Path (Join-Path $projectRoot "node_modules"))) {
    Write-Host "Installing frontend dependencies for the first run..." -ForegroundColor Yellow
    & $npmCmd install
}

$env:BACKEND_PORT = "$BackendPort"
$env:VITE_PORT = "$FrontendPort"

Write-Host "Starting frontend at http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "Proxying /api to http://localhost:$BackendPort" -ForegroundColor Green
& $npmCmd run dev -- --host 0.0.0.0 --port $FrontendPort
