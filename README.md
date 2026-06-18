# FutureBoss

**Version 1.3.0**

FutureBoss 是一套「單人專屬」的 AI Agent 控制台 —— 你的 AI 數位分身。提供精簡、溫暖的儀表板介面，整合 Telegram 等通道、排程提醒、記憶與知識庫，讓 AI 助理像貼身特助一樣為你工作。

repo 收錄**完整原始碼**（後端全部 Rust crates + 前端），可直接 fork 本專案自行編譯，無須另外取得任何外部 binary。`target/`、`node_modules/`、build 產物與密鑰（`.env`）不納入版控，請依下方步驟自行建置。

兩種使用方式：
- **A. 換膚模式（最快）**：沿用既有的後端 gateway，只建置前端 + 跑 `futureboss-skin/proxy.js` 換上客製前端，不必編譯 Rust。
- **B. 自編後端（完整）**：直接編譯 `futureboss-fork/` 的 Rust gateway（含 Telegram 去 Markdown + typing indicator 等客製），取得完整可獨立運作的後端。

---

## 內容結構

```
furtureboss/
├── futureboss-skin/                # 本機反向代理 + 樣式注入層
│   ├── proxy.js                  # 供應前端 + 轉發 gateway + 注入 skin/文字替換 + 強制 light + 貓圖路由
│   ├── skin.css                  # genspark 風格主題 + 側欄隱藏/排序 + Tab/彈窗樣式（即時生效）
│   ├── text-replace.json         # 介面文字替換（品牌名、標籤…，即時生效）
│   ├── cat.png / cat-laptop.png  # 貓老闆 logo 圖
└── futureboss-fork/                # 完整後端 + 前端原始碼（Apache 2.0，見 NOTICE）
    ├── crates/                   # 後端：21 個 Rust crates（gateway / agent / memory / security …）
    ├── web/                      # 前端原始碼（含原生新增頁面）
    ├── python/ · docs/ · tests/  # Python 工具、文件、測試
    ├── run-fork-gateway.sh       # 自編 gateway 啟停/回滾腳本
    └── Cargo.toml · LICENSE …    # 原專案檔
```

> `target/`、`node_modules/`、build 產物（`dist/`）與密鑰（`.env`）不納入版控，請依下方步驟自行建置。

---

## 主要客製內容

- **視覺**：genspark 風格配色（近白主畫面 + 略深選單）、貓老闆 logo、移除粗線/分隔線、icon hover 放大、Tab 底線化、彈窗置中＋全寬按鈕。
- **品牌/文字**：全介面品牌為 **FutureBoss**、預設助理名稱為 **「AI 首席特助」**、副標與招呼語客製、favicon 為原生 paw 圖示（`futureboss-skin/text-replace.json`）。
- **外觀模式**：預設強制 **light**（由 `proxy.js` 在前端啟動前注入），並隱藏外觀切換鈕。
- **單人化**：隱藏多用戶/企業項目（使用者管理、帳號預算、合作夥伴、組織架構、共享 Wiki、帳務、授權、Odoo、Skill 市場、應用市集、任務看板、安全設定、Wiki Trust、MCP、審計日誌、Agent 管理、分析報表…），側欄重新排序。
- **原生新增頁面（前端）**：
  - **AI 首席特助設定** (`/boss`)：把 agent 編輯設定整頁化（`web/src/pages/BossSettingsPage.tsx` + `web/src/components/AgentSettingsForm.tsx`）。
  - **排程任務** (`/cron`)：把系統設定裡的 Cron 分頁拉成獨立頁（`web/src/pages/CronPage.tsx`），並支援**時區**設定（預設 Asia/Taipei）。

---

## 建置與啟動

前置：Node.js；自編後端另需 Rust（edition 2024，需 ≥1.85）。

### A. 換膚模式（沿用既有 gateway，不編譯 Rust）

前置：後端 gateway 已跑在 `127.0.0.1:18789`。

```bash
# 1) 建置前端
cd futureboss-fork/web
npm install
npm run build        # 若 tsc 嚴格型檢擋住，可改用：npx vite build
                     # 產物輸出到 futureboss-fork/crates/duduclaw-dashboard/dist

# 2) 啟動反向代理（供應客製前端 + 轉發 gateway）
cd ../../futureboss-skin
node proxy.js        # 預設 http://localhost:18790
```

開瀏覽器進 **http://localhost:18790**。

### B. 自編後端 gateway（含 Telegram 客製）

```bash
cd futureboss-fork
cargo build --release -p duduclaw-cli --bin duduclaw
# 啟停/回滾（沿用 ~/.duduclaw 設定，port 127.0.0.1:18789）
./run-fork-gateway.sh start    # 其他：stop | rollback | build | status
```

首次啟動會引導建立預設助理（預設名稱「AI 首席特助」）。

### 環境變數（proxy.js）
- `DUDU_UPSTREAM_HOST` / `DUDU_UPSTREAM_PORT`：gateway 位址（預設 `127.0.0.1:18789`）
- `DUDU_SKIN_PORT`：代理埠（預設 `18790`）

後端所需 API 金鑰／channel token 見 `futureboss-fork/.env.example`。

---

## 更新紀錄

### v1.3.0
- **預設助理改名**：onboard 預設助理名稱由舊名改為 **「AI 首席特助」**（`crates/duduclaw-cli`），全介面品牌統一為 FutureBoss。
- **排程任務支援時區**：排程表單新增「時區」欄位（預設 Asia/Taipei），修正先前未指定時區時以 UTC 判讀、導致排程時間不符的問題。
- **強制 light 模式**：`proxy.js` 在前端啟動前注入，預設淺色主題並隱藏外觀切換鈕。
- **介面精簡**：再隱藏「分析報表」「應用市集」等項目；favicon 還原為 paw 圖示。
- 同步本版完整前後端原始碼。

### v1.2.0
- **收錄完整 fork 原始碼**：`futureboss-fork/` 從「僅前端 web」擴充為完整後端 crates + 前端 + Python 工具 + 文件，fork 本專案即可取得可自行編譯的完整程式。
- 新增自編後端 gateway 的建置/啟停說明（含 `run-fork-gateway.sh`）。
- `.gitignore` 調整：改以排除 `target/` 等 build 產物，不再排除後端 `crates/`。

### v1.1.0
- **連線錯誤處理**：gateway 未啟動/無法連線時，登入與記憶等頁面改為顯示清楚的中文提示（HTTP 狀態），不再出現難以理解的 `Unexpected token` 解析錯誤。
- 對應更新 `LoginPage` / `MemoryPage` / `BossSettingsPage` 與三語（zh-TW / en / ja-JP）介面字串。

### v1.0.0
- 首版：genspark 風格客製、貓老闆品牌、單人化精簡介面。

---

## 授權

本專案包含以 **Apache License 2.0** 授權的第三方開源元件，完整授權條款與第三方著作權標示請見 [`LICENSE`](LICENSE) 與 [`NOTICE`](NOTICE)。
