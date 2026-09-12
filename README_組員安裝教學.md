# PocketKB 組員安裝與編譯教學

> 2026-09-12 更新：只想在手機試玩，請閱讀 [Android 安裝說明](ANDROID_INSTALL.md)，直接下載 Release 的 APK，不必安裝 Android Studio 或下載模型。本次宿舍火災採不限時學習模式，LLM尚未啟用。
>
> 以下保留的是早期原始碼編譯／模型實驗筆記，不是目前測試版的一般安裝流程。若需移除不同簽章的舊版，請先保留重要演練紀錄；解除安裝會刪除 App 本機資料。

這份壓縮檔是乾淨版專案，已排除本機 build cache、Android SDK、Gradle cache、NDK/CMake 編譯產物。組員需要用自己的電腦安裝 Android Studio 後重新編譯。

## 一、解壓縮

1. 建議不要直接在「下載」資料夾內編譯。
2. 將壓縮檔解壓縮到路徑短一點的位置，例如：

```text
C:\PocketKB_final
```

不要放在太深的資料夾，避免 Windows 長路徑問題。

## 二、安裝 Android Studio

1. 安裝 Android Studio。
2. 開啟 Android Studio。
3. 進入 `Settings > Languages & Frameworks > Android SDK`，安裝：
   - Android SDK Platform 36
   - Android SDK Build-Tools 36.0.0 或 35.0.0
   - Android SDK Platform-Tools
   - NDK Side by side：27.0.12077973
   - CMake：3.22.1

如果 Android Studio 顯示缺少 SDK / NDK / CMake，依照提示安裝即可。

## 三、開啟 Android 專案

請用 Android Studio 開啟這個資料夾：

```text
PocketKB_final\android
```

不是開啟最外層 `PocketKB_final`，也不是開啟 `app`。

如果 Android Studio 提示 `local.properties` 的 SDK 路徑不存在，請刪除：

```text
PocketKB_final\android\local.properties
```

然後重新開啟 Android Studio，讓它自動產生新的 SDK 路徑。

## 四、編譯 APK

Android Studio 完成 Gradle Sync 後：

1. 點選 `Build`
2. 點選 `Build Bundle(s) / APK(s)`
3. 點選 `Build APK(s)`

編譯完成後 APK 會在：

```text
PocketKB_final\android\app\build\outputs\apk\debug\app-debug.apk
```

## 五、安裝到 Redmi Note 13 Pro+ 5G

1. 手機開啟「開發人員選項」。
2. 開啟「USB 偵錯」。
3. 用 USB 線連接手機與電腦。
4. 手機跳出授權視窗時，選擇允許。
5. Android Studio 上方選擇 Redmi 手機，按 Run。

也可以用命令列安裝：

```powershell
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

如果 `adb` 找不到，請使用 Android Studio 內建的 Terminal，或把 Android SDK 的 `platform-tools` 加到 PATH。

## 六、放入本地 Qwen 模型

模型檔必須是 `.gguf`。

請先下載其中一個模型到電腦。Redmi Note 13 Pro+ 5G 建議先用 0.5B 版本確認可以穩定載入，再測 1.5B。

推薦模型：

- 優先測試： [Qwen2.5-0.5B-Instruct Q4_K_M GGUF](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true)
- 進階測試： [Qwen2.5-1.5B-Instruct Q4_K_M GGUF](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true)

官方模型頁面：

- <https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF>
- <https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF>

Redmi Note 13 Pro+ 5G 的 8GB RAM 版本，請先使用 1.6GB 以下模型，避免本地推論當機。

下載後不要改副檔名，檔名應該類似：

```text
qwen2.5-0.5b-instruct-q4_k_m.gguf
```

建議在 `PocketKB_final\android` 資料夾底下建立 `models` 資料夾，並把下載好的 `.gguf` 放進去：

```text
PocketKB_final\android\models\qwen2.5-0.5b-instruct-q4_k_m.gguf
```

接著先把 APK 安裝到手機，並打開 App 一次，讓 Android 建立 App 的資料夾。然後在 `PocketKB_final\android` 資料夾用 adb 放入模型。

如果是用 Android Studio 安裝 SDK，請使用：

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices
& $adb shell mkdir -p /sdcard/Android/data/com.pocketkb.android/files/models
& $adb push .\models\qwen2.5-0.5b-instruct-q4_k_m.gguf /sdcard/Android/data/com.pocketkb.android/files/models/
& $adb shell ls -lh /sdcard/Android/data/com.pocketkb.android/files/models
```

重新開啟 App 後，App 會自動掃描並嘗試載入第一個 GGUF 模型。成功時首頁的模型狀態不應再顯示「模型載入失敗」。

## 七、常見問題

### 1. 解壓縮失敗或顯示壓縮檔無效

請確認收到的是乾淨版：

```text
PocketKB_final_clean.zip
```

不要使用包含 `.tooling` 和 build cache 的舊版大壓縮檔。

### 2. Gradle Sync 失敗

常見原因是 SDK 路徑不正確。刪除：

```text
android\local.properties
```

再用 Android Studio 重新開啟 `android` 資料夾。

### 3. 找不到 NDK 或 CMake

到 Android Studio 的 SDK Manager 安裝：

```text
NDK 27.0.12077973
CMake 3.22.1
```

### 4. 手機安裝失敗

如果出現 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`，代表手機上有不同簽章舊版，先移除：

```powershell
adb uninstall com.pocketkb.android
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

### 5. 模型載入失敗

如果首頁顯示「模型載入失敗，錯誤碼 12」，通常是模型檔不完整、格式不對、或 App 掃到錯誤的 `.gguf`。

- 確認副檔名是 `.gguf`
- 確認模型放在 `/sdcard/Android/data/com.pocketkb.android/files/models`
- 確認下載的是完整 GGUF 檔，不是瀏覽器另存的 HTML 網頁
- 檔案大小不能是 0 KB，也不能只有幾 KB；太小通常代表下載失敗
- Redmi 8GB 版本先用 Qwen2.5 0.5B Q4_K_M
- 先不要開 GPU 加速，目前 Android 版預設 CPU-only 是為了穩定
- 不建議只用手機檔案管理器搬到 `Android/data`，新版 Android 常會限制權限；用 adb 最穩

## 八、目前 Android 版重點

- Kotlin + Jetpack Compose
- Room/SQLite 保存演練紀錄
- BM25 本地 RAG
- llama.cpp GGUF 本地模型推論
- 30 秒演練倒數
- 嚴格裁判：錯誤或模糊回答不會自動推進
