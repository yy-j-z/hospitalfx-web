param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ForwardArgs
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$targetScript = Join-Path $projectRoot "start-project.ps1"

if (-not (Test-Path $targetScript)) {
    throw "未找到项目启动脚本：$targetScript"
}

& powershell.exe -ExecutionPolicy Bypass -File $targetScript @ForwardArgs
