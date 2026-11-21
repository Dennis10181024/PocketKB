$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $env:OPENAI_API_KEY) {
    Write-Host '請輸入 OpenAI API 金鑰。輸入不會顯示，也不會存進檔案。'
    $secret = Read-Host 'OPENAI_API_KEY' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try { $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
if (-not $env:OPENAI_API_KEY) { throw '金鑰未設定。' }
if (-not $env:POCKETKB_MAX_CALLS) { $env:POCKETKB_MAX_CALLS = '100' }
if ($null -eq $env:POCKETKB_LOG_TEXT) {
    $configured = [Environment]::GetEnvironmentVariable('POCKETKB_LOG_TEXT', 'User')
    $env:POCKETKB_LOG_TEXT = if ($null -eq $configured) { '1' } else { $configured }
}
$coachPort = 5175
if ($env:POCKETKB_PORT) {
    if (-not [int]::TryParse($env:POCKETKB_PORT, [ref]$coachPort) -or $coachPort -lt 1 -or $coachPort -gt 65535) {
        throw 'POCKETKB_PORT 必須介於 1 和 65535。'
    }
}
$adbPath = Join-Path $projectRoot 'android\.tooling\android-sdk\platform-tools\adb.exe'
if (Test-Path -LiteralPath $adbPath) {
    & $adbPath reverse tcp:5175 "tcp:$coachPort"
}
Write-Host "開啟 http://127.0.0.1:$coachPort/online.html 。"
Write-Host "本次啟動最多 $env:POCKETKB_MAX_CALLS 次模型請求。Ctrl+C 可停止。"
Write-Host $(if ($env:POCKETKB_LOG_TEXT -eq '1') { '研究紀錄保存文字（開發模式）。' } else { '研究紀錄不保存文字。' })
try { & node (Join-Path $PSScriptRoot 'server.js') }
finally { Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue }
