# Erzeugt die PWA-Icons (192/512/maskable/apple-touch) per GDI+ —
# gleiches Motiv wie public/favicon.svg: Prisma-Dreieck mit Regenbogen-Faecher.
# Aufruf:  powershell -ExecutionPolicy Bypass -File tools/gen-icons.ps1

Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\public\icons'
New-Item -ItemType Directory -Force $outDir | Out-Null

function Draw-PrismaIcon {
    param(
        [int]$Size,
        [string]$Path,
        [bool]$Maskable = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $bgColor = [System.Drawing.Color]::FromArgb(255, 28, 27, 31)   # Anthrazit #1c1b1f
    $fg = [System.Drawing.Color]::FromArgb(255, 242, 239, 233)      # Creme #f2efe9

    if ($Maskable) {
        # Maskable: Hintergrund randlos, Motiv in die sichere Zone (80 %) schrumpfen
        $g.Clear($bgColor)
        $scale = $Size / 64.0 * 0.72
        $offset = ($Size - 64.0 * $scale) / 2.0
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
        $scale = $Size / 64.0
        $offset = 0.0
        # Abgerundetes Rechteck als Kachel
        $r = 14.0 * $scale
        $rect = New-Object System.Drawing.Drawing2D.GraphicsPath
        $w = [float]($Size)
        $rect.AddArc(0, 0, $r * 2, $r * 2, 180, 90)
        $rect.AddArc($w - $r * 2, 0, $r * 2, $r * 2, 270, 90)
        $rect.AddArc($w - $r * 2, $w - $r * 2, $r * 2, $r * 2, 0, 90)
        $rect.AddArc(0, $w - $r * 2, $r * 2, $r * 2, 90, 90)
        $rect.CloseFigure()
        $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillPath($bgBrush, $rect)
        $bgBrush.Dispose(); $rect.Dispose()
    }

    function P([double]$x, [double]$y) {
        New-Object System.Drawing.PointF(($x * $scale + $offset), ($y * $scale + $offset))
    }

    # Eingehender Strahl
    $penFg = New-Object System.Drawing.Pen($fg, [float](3.0 * $scale))
    $penFg.StartCap = 'Round'; $penFg.EndCap = 'Round'
    $g.DrawLine($penFg, (P 6 33), (P 23 33))

    # Prisma-Dreieck
    $penTri = New-Object System.Drawing.Pen($fg, [float](3.5 * $scale))
    $penTri.LineJoin = 'Round'
    $g.DrawPolygon($penTri, @((P 32 11), (P 13 49), (P 51 49)))

    # Regenbogen-Faecher (Referenz-Stopps des Staerke-Spektrums)
    $rays = @(
        @(40, 29, 58, 17, 229, 72, 77),    # Rot    #e5484d
        @(41, 33, 59, 26, 247, 107, 21),   # Orange #f76b15
        @(42, 37, 60, 36, 226, 197, 65),   # Gelb   #e2c541
        @(41, 41, 59, 46, 111, 191, 59),   # Gruen  #6fbf3b
        @(40, 45, 58, 55, 122, 92, 255)    # Violett #7a5cff
    )
    foreach ($ray in $rays) {
        $color = [System.Drawing.Color]::FromArgb(255, $ray[4], $ray[5], $ray[6])
        $pen = New-Object System.Drawing.Pen($color, [float](3.4 * $scale))
        $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
        $g.DrawLine($pen, (P $ray[0] $ray[1]), (P $ray[2] $ray[3]))
        $pen.Dispose()
    }

    $penFg.Dispose(); $penTri.Dispose(); $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "OK: $Path"
}

Draw-PrismaIcon -Size 192 -Path (Join-Path $outDir 'icon-192.png')
Draw-PrismaIcon -Size 512 -Path (Join-Path $outDir 'icon-512.png')
Draw-PrismaIcon -Size 512 -Path (Join-Path $outDir 'icon-maskable-512.png') -Maskable $true
Draw-PrismaIcon -Size 180 -Path (Join-Path $outDir 'apple-touch-icon.png')
