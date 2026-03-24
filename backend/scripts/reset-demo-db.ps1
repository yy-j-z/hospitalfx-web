param(
    [string]$DbHost = "localhost",
    [int]$DbPort = 3306,
    [string]$DbName = "his",
    [string]$DbUser = "root",
    [string]$DbPassword = ""
)

$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
$schemaPath = Join-Path $backendRoot "src\main\resources\schema.sql"
$dataPath = Join-Path $backendRoot "src\main\resources\data.sql"

$mysqlCandidates = @(
    (Get-Command mysql.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
) | Where-Object { $_ -and (Test-Path $_) }

$mysqlExe = $mysqlCandidates | Select-Object -First 1

if (-not (Test-Path $mysqlExe)) {
    throw "mysql.exe was not found. Install MySQL first, and make sure mysql.exe is in PATH or in the default install directory."
}

if (-not (Test-Path $schemaPath)) {
    throw "schema.sql was not found: $schemaPath"
}

if (-not (Test-Path $dataPath)) {
    throw "data.sql was not found: $dataPath"
}

$dropSql = @"
CREATE DATABASE IF NOT EXISTS $DbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE $DbName;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS tb_consult_message;
DROP TABLE IF EXISTS tb_registinfo;
DROP TABLE IF EXISTS tb_patient_profile;
DROP TABLE IF EXISTS tb_user;
DROP TABLE IF EXISTS tb_doctor;
SET FOREIGN_KEY_CHECKS = 1;
"@

$mysqlArgs = @(
    "-h", $DbHost,
    "-P", "$DbPort",
    "-u", $DbUser
)

if ($DbPassword) {
    $env:MYSQL_PWD = $DbPassword
}

try {
    $dropSql | & $mysqlExe @mysqlArgs
    Get-Content -Path $schemaPath -Raw | & $mysqlExe @mysqlArgs $DbName
    Get-Content -Path $dataPath -Raw | & $mysqlExe @mysqlArgs $DbName
    Write-Output "Database [$DbName] has been recreated and seeded."
}
finally {
    if ($DbPassword) {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}
