param(
  [Parameter(Mandatory=$true)][string]$ManifestJson,
  [Parameter(Mandatory=$true)][string]$OutJson
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await-WinRT($AsyncOp, [Type]$ResultType) {
  $m = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $m.Invoke($null, @($AsyncOp))
  $netTask.GetAwaiter().GetResult()
}

$lang = [Windows.Globalization.Language]::new('ja')
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $engine) {
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}
if (-not $engine) {
  throw 'Failed to create Japanese Windows OcrEngine'
}

$items = Get-Content -LiteralPath $ManifestJson -Raw -Encoding UTF8 | ConvertFrom-Json
$results = @()

foreach ($item in $items) {
  $imgPath = (Resolve-Path -LiteralPath $item.pngPath).Path
  $storageFile = Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imgPath)) ([Windows.Storage.StorageFile])
  $stream = Await-WinRT ($storageFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $ocrRes = Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
  $stream.Dispose()
  $bitmap.Dispose()

  $lines = @()
  foreach ($ln in $ocrRes.Lines) {
    $words = @()
    $minX = [double]::MaxValue
    $minY = [double]::MaxValue
    $maxX = 0.0
    $maxY = 0.0
    foreach ($w in $ln.Words) {
      $r = $w.BoundingRect
      if ($r.X -lt $minX) { $minX = $r.X }
      if ($r.Y -lt $minY) { $minY = $r.Y }
      if (($r.X + $r.Width) -gt $maxX) { $maxX = $r.X + $r.Width }
      if (($r.Y + $r.Height) -gt $maxY) { $maxY = $r.Y + $r.Height }
      $words += @{
        text = $w.Text
        x = [math]::Round($r.X, 1)
        y = [math]::Round($r.Y, 1)
        w = [math]::Round($r.Width, 1)
        h = [math]::Round($r.Height, 1)
      }
    }
    if ($ln.Words.Count -eq 0) {
      $minX = 0.0; $minY = 0.0
    }
    $lines += @{
      text = $ln.Text
      x = [math]::Round($minX, 1)
      y = [math]::Round($minY, 1)
      x2 = [math]::Round($maxX, 1)
      y2 = [math]::Round($maxY, 1)
      words = $words
    }
  }

  $results += @{
    key = $item.key
    examId = $item.examId
    page = $item.page
    dpi = $item.dpi
    lines = $lines
  }
}

$json = $results | ConvertTo-Json -Depth 6 -Compress
[System.IO.File]::WriteAllText($OutJson, $json, [System.Text.UTF8Encoding]::new($false))
Write-Output ("OCR completed: " + $results.Count + " images -> " + $OutJson)
