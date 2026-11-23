# copiar-marco-normativo.ps1
#
# Copia los assets de Marco Normativo desde el frontend público al backend,
# para que luego viajen por git (carpeta public/ SÍ está versionada).
#
# USO (en PowerShell, desde cualquier ruta):
#   powershell -ExecutionPolicy Bypass -File D:\cms-senado\backend\scripts\copiar-marco-normativo.ps1
#
# NO borra nada: solo copia. Vuelve a ejecutarlo cuando quieras y sobrescribe.

$ErrorActionPreference = 'Stop'

$origen  = 'D:\cms-senado\frontend-publico-oficial2\public'
$destino = 'D:\cms-senado\backend\public\marco-normativo'

if (-not (Test-Path $origen)) {
    Write-Host "ERROR: no existe el origen: $origen" -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------
# 1. Crear estructura de carpetas
# ---------------------------------------------------------------
$carpetas = @(
    "$destino\pdfs\legislativa",
    "$destino\pdfs\administrativa",
    "$destino\pdfs\interna",
    "$destino\pdfs\transparencia",
    "$destino\portadas"
)

foreach ($c in $carpetas) {
    New-Item -ItemType Directory -Force -Path $c | Out-Null
}

Write-Host ""
Write-Host "=== Copiando Marco Normativo ===" -ForegroundColor Cyan

# ---------------------------------------------------------------
# 2. PDFs, agrupados por bloque
# ---------------------------------------------------------------
$grupos = @(
    @{ nombre = 'legislativa';   origen = "$origen\pdfs\Constitución Política del Estado" },
    @{ nombre = 'legislativa';   origen = "$origen\pdfs\Norma General de Área Legislativa" },
    @{ nombre = 'administrativa';origen = "$origen\pdfs\Norma General de Área Administrativa" },
    @{ nombre = 'interna';       origen = "$origen\pdfs\Normativa Interna" },
    @{ nombre = 'transparencia'; origen = "$origen\pdfs\trasparencia" }
)

$totalPDF = 0

foreach ($g in $grupos) {
    if (-not (Test-Path $g.origen)) {
        Write-Host "  AVISO: no existe $($g.origen)" -ForegroundColor Yellow
        continue
    }

    $archivos = Get-ChildItem -Path $g.origen -Filter *.pdf -File
    foreach ($a in $archivos) {
        Copy-Item -Path $a.FullName -Destination "$destino\pdfs\$($g.nombre)\$($a.Name)" -Force
    }

    $totalPDF += $archivos.Count
    Write-Host ("  {0,-16} {1,3} PDFs" -f $g.nombre, $archivos.Count) -ForegroundColor Green
}

# ---------------------------------------------------------------
# 3. Portadas de las tarjetas destacadas
# ---------------------------------------------------------------
$origenPortadas = "$origen\marco normativo"
$totalPortadas = 0

if (Test-Path $origenPortadas) {
    $imgs = Get-ChildItem -Path $origenPortadas -Filter *.jpg -File
    foreach ($i in $imgs) {
        Copy-Item -Path $i.FullName -Destination "$destino\portadas\$($i.Name)" -Force
    }
    $totalPortadas = $imgs.Count
    Write-Host ("  {0,-16} {1,3} portadas" -f 'portadas', $totalPortadas) -ForegroundColor Green
} else {
    Write-Host "  AVISO: no existe la carpeta de portadas: $origenPortadas" -ForegroundColor Yellow
}

# ---------------------------------------------------------------
# 4. Verificación
# ---------------------------------------------------------------
Write-Host ""
Write-Host "=== Verificación ===" -ForegroundColor Cyan

$enDestinoPDF = @(Get-ChildItem -Path "$destino\pdfs" -Filter *.pdf -File -Recurse)
$enDestinoJPG = @(Get-ChildItem -Path "$destino\portadas" -Filter *.jpg -File)

Write-Host ("  PDFs en destino     : {0}" -f $enDestinoPDF.Count)
Write-Host ("  Portadas en destino : {0}" -f $enDestinoJPG.Count)

$peso = ($enDestinoPDF | Measure-Object Length -Sum).Sum
$pesoJPG = ($enDestinoJPG | Measure-Object Length -Sum).Sum
Write-Host ("  Peso PDFs           : {0:N1} MB" -f ($peso / 1MB))
Write-Host ("  Peso portadas       : {0:N1} MB" -f ($pesoJPG / 1MB))
Write-Host ""

if ($enDestinoPDF.Count -eq 43 -and $enDestinoJPG.Count -eq 6) {
    Write-Host "OK: 43 PDFs y 6 portadas copiados." -ForegroundColor Green
} else {
    Write-Host "REVISAR: se esperaban 43 PDFs y 6 portadas." -ForegroundColor Yellow
    Write-Host "Listado de PDFs encontrados en el origen:" -ForegroundColor Yellow
    Get-ChildItem -Path "$origen\pdfs" -Filter *.pdf -File -Recurse |
        Group-Object { $_.Directory.Name } |
        ForEach-Object { Write-Host ("   - {0}: {1}" -f $_.Name, $_.Count) }
}

Write-Host ""
Write-Host "Siguiente paso (git):" -ForegroundColor Cyan
Write-Host "  cd D:\cms-senado\backend"
Write-Host "  git add public/marco-normativo"
Write-Host "  git commit -m 'feat(marco-normativo): assets PDF y portadas'"
Write-Host "  git push"
Write-Host ""
