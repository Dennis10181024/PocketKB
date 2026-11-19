$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:ANDROID_SDK_ROOT = Join-Path $Root ".tooling\android-sdk"
$env:ANDROID_HOME = $env:ANDROID_SDK_ROOT
$env:ANDROID_USER_HOME = Join-Path $Root ".tooling\android-user"
$env:GRADLE_USER_HOME = Join-Path $Root ".tooling\gradle-home"

$SdkDir = $env:ANDROID_SDK_ROOT.Replace("\", "/")
Set-Content -Path (Join-Path $Root "local.properties") -Value "sdk.dir=$SdkDir" -Encoding UTF8

& (Join-Path $Root ".tooling\gradle\gradle-8.13\bin\gradle.bat") assembleDebug --no-daemon
