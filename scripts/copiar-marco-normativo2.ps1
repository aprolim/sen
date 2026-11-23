# copiar-marco-normativo2.ps1
#
# Version 2: NO usa literales con tildes en el codigo.
# Localiza las carpetas por patron (regex) en vez de por nombre exacto,
# asi no depende del encoding del archivo .ps1.
#
# USO:
#   powershell -ExecutionPolicy Bypass -File D:\cms-senado\backend\scripts\copiar-marco-normativo2.ps1

$ErrorActionPreference = 'Stop'

$origen  = 'D:\cms-senado\frontend-publico-oficial2\public\pdfs'
$destino = 'D:\cms-senado\backend\public\marco-normativo'
$portadasOrigen = 'D:\cms-senado\frontend-publico-oficial2\public\marco normativo'

if (-not (Test-Path $origen)) {
    Write-Host "ERROR: no existe el origen: $origen" -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------
# 1. Estructura de destino
# ---------------------------------------------------------------
$carpetas = @(
    "$destino\pdfs\legislativa",
    "$destino\pdfs\administrativa",
    "$destino\pdfs\interna",
    "$destino\pdfs\transparencia",
    "$destino\portadas"
)
foreach ($c in $carpetas) { New-Item -ItemType Directory -Force -Path $c | Out-Null }

# ---------------------------------------------------------------
# 2. Localizar carpetas de origen por patron (sin tildes en el codigo)
# ---------------------------------------------------------------
$todas = Get-ChildItem -Path $origen -Directory -Recurse

function Buscar-Carpeta {
    param([string]$patron)
    $hit = $todas | Where-Object { $_.Name -match $patron } | Select-Object -First 1
    return $hit
}

# "Constituci..n Pol..tica del Estado"
$dirConstitucion = Buscar-Carpeta '^Constituci.n Pol.tica del Estado$'
# "Norma General de ..rea Legislativa"
$dirLegislativa  = Buscar-Carpeta '^Norma General de .rea Legislativa$'
# "Norma General de ..rea Administrativa"
$dirAdmin        = Buscar-Carpeta '^Norma General de .rea Administrativa$'
# "Normativa Interna"
$dirInterna      = Buscar-Carpeta '^Normativa Interna$'
# "trasparencia" (asi esta escrito en el proyecto)
$dirTransp       = Buscar-Carpeta '^trasparencia$'

Write-Host ""
Write-Host "=== Detectando carpetas de origen ===" -ForegroundColor Cyan
foreach ($p in @(
    @{ n='Constitucion'; d=$dirConstitucion },
    @{ n='Legislativa '; d=$dirLegislativa },
    @{ n='Administrati'; d=$dirAdmin },
    @{ n='Interna     '; d=$dirInterna },
    @{ n='Transparenci'; d=$dirTransp }
)) {
    if ($p.d) {
        $n = (Get-ChildItem -Path $p.d.FullName -Filter *.pdf -File).Count
        Write-Host ("  {0} -> {1,3} PDFs  [{2}]" -f $p.n, $n, $p.d.FullName) -ForegroundColor Green
    } else {
        Write-Host ("  {0} -> NO ENCONTRADA" -f $p.n) -ForegroundColor Red
    }
}

# ---------------------------------------------------------------
# 3. Copiar
# ---------------------------------------------------------------
Write-Host ""
Write-Host "=== Copiando ===" -ForegroundColor Cyan

function Copiar-Grupo {
    param($dir, [string]$subcarpeta, [string]$etiqueta)
    if (-not $dir) { return 0 }
    $archivos = Get-ChildItem -Path $dir.FullName -Filter *.pdf -File
    foreach ($a in $archivos) {
        Copy-Item -Path $a.FullName -Destination (Join-Path "$destino\pdfs\$subcarpeta" $a.Name) -Force
    }
    Write-Host ("  {0,-16} {1,3} PDFs" -f $etiqueta, $archivos.Count)
    return $archivos.Count
}

$t = 0
$t += Copiar-Grupo $dirConstitucion 'legislativa'   'legislativa(1)'
$t += Copiar-Grupo $dirLegislativa  'legislativa'   'legislativa(2)'
$t += Copiar-Grupo $dirAdmin        'administrativa' 'administrativa'
$t += Copiar-Grupo $dirInterna      'interna'       'interna'
$t += Copiar-Grupo $dirTransp       'transparencia' 'transparencia'

# Portadas
$tPort = 0
if (Test-Path $portadasOrigen) {
    $imgs = Get-ChildItem -Path $portadasOrigen -Filter *.jpg -File
    foreach ($i in $imgs) {
        Copy-Item -Path $i.FullName -Destination (Join-Path "$destino\portadas" $i.Name) -Force
    }
    $tPort = $imgs.Count
    Write-Host ("  {0,-16} {1,3} portadas" -f 'portadas', $tPort)
}

# ---------------------------------------------------------------
# 4. Verificacion
# ---------------------------------------------------------------
Write-Host ""
Write-Host "=== Verificacion ===" -ForegroundColor Cyan

$pdfDest = @(Get-ChildItem -Path "$destino\pdfs" -Filter *.pdf -File -Recurse)
$jpgDest = @(Get-ChildItem -Path "$destino\portadas" -Filter *.jpg -File)

$pesoPDF = ($pdfDest | Measure-Object Length -Sum).Sum
$pesoJPG = ($jpgDest | Measure-Object Length -Sum).Sum

Write-Host ("  PDFs en destino     : {0}" -f $pdfDest.Count)
Write-Host ("  Portadas en destino : {0}" -f $jpgDest.Count)
Write-Host ("  Peso PDFs           : {0:N1} MB" -f ($pesoPDF / 1MB))
Write-Host ("  Peso portadas       : {0:N1} MB" -f ($pesoJPG / 1MB))
Write-Host ""
Write-Host "  Desglose por subcarpeta:" -ForegroundColor Cyan
foreach ($sub in @('legislativa','administrativa','interna','transparencia')) {
    $n = @(Get-ChildItem -Path "$destino\pdfs\$sub" -Filter *.pdf -File -ErrorAction SilentlyContinue).Count
    Write-Host ("    {0,-16} {1,3}" -f $sub, $n)
}

Write-Host ""
if ($pdfDest.Count -eq 41 -and $jpgDest.Count -eq 6) {
    Write-Host "OK: 41 PDFs y 6 portadas." -ForegroundColor Green
} else {
    Write-Host ("REVISAR: esperados 41 / 6 -- obtenidos {0} / {1}" -f $pdfDest.Count, $jpgDest.Count) -ForegroundColor Yellow
}
Write-Host ""
