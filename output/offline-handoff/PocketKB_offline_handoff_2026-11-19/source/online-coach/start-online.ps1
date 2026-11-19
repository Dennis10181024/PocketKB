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
$adbPath = Join-Path $projectRoot 'android\.tooling\android-sdk\platform-tools\adb.exe'
if (Test-Path -LiteralPath $adbPath) {
    & $adbPath reverse tcp:5175 tcp:5175
}
Write-Host '開啟 http://127.0.0.1:5175/ ，選擇「GPT 演練」。'
Write-Host "本次啟動最多 $env:POCKETKB_MAX_CALLS 次模型請求。Ctrl+C 可停止。"
try { & node (Join-Path $PSScriptRoot 'server.js') }
finally { Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue }
