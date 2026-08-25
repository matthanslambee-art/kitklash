param(
    [int]$Port = 8080
)

$root = $PSScriptRoot
$prefix = "http://localhost:$Port/"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Failed to start server on $prefix. $_"
    exit 1
}

Write-Host "KITKLASH dev server running at $prefix (root: $root)"
Write-Host "Press Ctrl+C to stop."

$rootFull = (Resolve-Path $root).Path

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
    } catch {
        break
    }

    $request = $context.Request
    $response = $context.Response

    try {
        $localPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($localPath -eq "/") { $localPath = "/index.html" }

        $relative = $localPath.TrimStart("/") -replace "/", "\"
        $fullPath = Join-Path $rootFull $relative
        $fullPathResolved = [System.IO.Path]::GetFullPath($fullPath)

        if (-not $fullPathResolved.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        if (-not (Test-Path $fullPathResolved -PathType Leaf)) {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $localPath")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        $ext = [System.IO.Path]::GetExtension($fullPathResolved).ToLowerInvariant()
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }

        $bytes = [System.IO.File]::ReadAllBytes($fullPathResolved)
        $response.ContentType = $contentType
        $response.Headers.Add("Cache-Control", "no-cache")
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.Close()
    } catch {
        try {
            $response.StatusCode = 500
            $response.Close()
        } catch {}
    }
}

$listener.Stop()
$listener.Close()
