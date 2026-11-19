$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot '../../open-slide-deck'
$bundledNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin'
if (Test-Path (Join-Path $bundledNode 'node.exe')) { $env:Path = $bundledNode + ';' + $env:Path }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22 or newer first.' }
$major = [int]((& node -p 'process.versions.node.split(".")[0]') | Select-Object -Last 1)
if ($major -lt 22) { throw 'Node.js 22 or newer is required.' }
Set-Location -LiteralPath $project
if (-not (Test-Path 'node_modules/@open-slide/core')) { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' } }
try { $response = Invoke-WebRequest 'http://127.0.0.1:5173/' -TimeoutSec 2 -UseBasicParsing } catch { $response = $null }
if ($response -and $response.Content -match 'open-slide') { Start-Process 'http://127.0.0.1:5173/s/pocketkb-edge'; exit }
Write-Host 'Open http://127.0.0.1:5173/s/pocketkb-edge after the server is ready. Keep this window open.'
& npm.cmd run dev -- --host 127.0.0.1 --port 5173
