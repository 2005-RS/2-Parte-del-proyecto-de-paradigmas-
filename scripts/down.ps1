$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
docker compose --env-file .env down
Write-Host 'Servicios detenidos. Los volúmenes de perfiles, cuestionarios, imágenes y resultados se conservan.'
Write-Host 'Para borrar también los datos: docker compose --env-file .env down -v'
