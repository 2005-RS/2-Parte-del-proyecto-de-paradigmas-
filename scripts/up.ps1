$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Instala Docker y Docker Compose, y vuelve a ejecutar este script.'
}

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host 'Se creó .env desde .env.example. Revisa las contraseñas antes de un despliegue público.'
}

docker compose --env-file .env up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

function Read-EnvValue([string]$name, [string]$fallback) {
  $line = Select-String -Path .env -Pattern "^$name=" | Select-Object -Last 1
  if (-not $line) { return $fallback }
  return ($line.Line -split '=', 2)[1]
}

$web = Read-EnvValue 'WEB_PORT' '8080'
$demo = Read-EnvValue 'DEMO_PORT' '8081'
$auth = Read-EnvValue 'AUTH_PORT' '3001'
$activities = Read-EnvValue 'ACTIVITIES_PORT' '3002'
$grafana = Read-EnvValue 'GRAFANA_PORT' '3000'

Write-Host ''
Write-Host "Aula:              http://localhost:$web"
Write-Host "Cliente adicional: http://localhost:$demo"
Write-Host "Docs de identidad: http://localhost:$auth/docs"
Write-Host "Docs de actividades: http://localhost:$activities/docs"
Write-Host "Grafana:           http://localhost:$grafana"
Write-Host 'Cuenta demo:       demo@profelink.dev / Demo1234!'
Write-Host 'Para detener sin borrar datos: .\scripts\down.ps1'
