# FutureBoss

**Version 1.2.0**

FutureBoss 是以 [DuDuClaw](https://github.com/zhixuli0406/DuDuClaw)（v1.20.0，Apache 2.0）為基礎客製化的 AI Agent 控制台，外觀參考 [Genspark](https://www.genspark.ai)，並調整為「單人使用」的精簡介面。

自 v1.2.0 起，repo 收錄**完整 fork 原始碼**（含後端全部 crates 與前端），fork 本專案即可取得完整可自行編譯的程式，無須另外取得官方 binary。`target/`、`node_modules/`、build 產物與密鑰（`.env`）不納入版控，請依下方步驟自行建置。

兩種使用方式：
- **A. 換膚模式（最快）**：沿用官方安裝的 DuDuClaw gateway，只建置前端 + 跑 `duduclaw-skin/proxy.js` 換上客製前端，不必編譯 Rust。
- **B. 自編後端**：直接編譯 `duduclaw-fork/` 的 Rust gateway（含 Telegram 去 Markdown + typing indicator 等客製），取代官方 binary。

---

## 內容結構

```
furtureboss/
├── duduclaw-skin/                # 本機反向代理 + 樣式注入層
│   ├── proxy.js                  # 供應 fork 前端 + 轉發 gateway + 注入 skin/文字替換 + 貓圖路由
│   ├── skin.css                  # genspark 風格主題 + 側欄隱藏/排序 + Tab/彈窗樣式（即時生效）
│   ├── text-replace.json         # 介面文字替換（品牌名、標籤…，即時生效）
│   ├── cat.png / cat-laptop.png  # 貓老闆 logo 圖
└── duduclaw-fork/                # 完整 DuDuClaw fork 原始碼（Apache 2.0）
    ├── crates/                   # 後端：21 個 Rust crates（gateway / agent / memory / security …）
    ├── web/                      # 前端原始碼（含原生新增頁面）
    ├── python/ · docs/ · tests/  # Python 工具、文件、測試
    ├── run-fork-gateway.sh       # 自編 gateway 啟停/回滾腳本
    └── Cargo.toml · LICENSE …    # fork 原專案檔
```

> `target/`、`node_modules/`、build 產物（`dist/`）與密鑰（`.env`）不納入版控，請依下方步驟自行建置。

---

## 主要客製內容

- **視覺**：genspark 風格配色（近白主畫面 + 略深選單）、貓老闆 logo、移除粗線/分隔線、icon hover 放大、Tab 底線化、彈窗置中＋全寬按鈕。
- **品牌/文字**：DuDuClaw → FutureBoss、預設 agent DuDu → Boss、副標與招呼語替換、favicon 改貓臉（`duduclaw-skin/text-replace.json`）。
- **單人化**：隱藏多用戶/企業項目（使用者管理、帳號預算、合作夥伴、組織架構、共享 Wiki、帳務、授權、Odoo、Skill 市場、任務看板、安全設定、Wiki Trust、MCP、審計日誌、Agent 管理…），側欄重新排序。
- **原生新增頁面（fork 前端）**：
  - **Boss 設定** (`/boss`)：把 agent 編輯設定整頁化（`web/src/pages/BossSettingsPage.tsx` + `web/src/components/AgentSettingsForm.tsx`）。
  - **排程任務** (`/cron`)：把系統設定裡的 Cron 分頁拉成獨立頁（`web/src/pages/CronPage.tsx`，重用 `SettingsPage` 的 `CronTab`）。

---

## 建置與啟動

前置：Node.js；自編後端另需 Rust（edition 2024，需 ≥1.85）。

### A. 換膚模式（沿用官方 gateway，不編譯 Rust）

前置：已安裝並初始化 DuDuClaw（gateway 跑在 `127.0.0.1:18789`）。

```bash
# 1) 建置 fork 前端
cd duduclaw-fork/web
npm install
npm run build        # 若 tsc 嚴格型檢擋住，可改用：npx vite build
                     # 產物輸出到 duduclaw-fork/crates/duduclaw-dashboard/dist

# 2) 啟動反向代理（供應客製前端 + 轉發 gateway）
cd ../../duduclaw-skin
node proxy.js        # 預設 http://localhost:18790
```

開瀏覽器進 **http://localhost:18790**。

### B. 自編後端 gateway（含 Telegram 客製）

```bash
cd duduclaw-fork
cargo build --release -p duduclaw-cli --bin duduclaw
# 啟停/回滾（沿用 ~/.duduclaw 設定，port 127.0.0.1:18789）
./run-fork-gateway.sh start    # 其他：stop | rollback | build | status
```

### 環境變數（proxy.js）
- `DUDU_UPSTREAM_HOST` / `DUDU_UPSTREAM_PORT`：gateway 位址（預設 `127.0.0.1:18789`）
- `DUDU_SKIN_PORT`：代理埠（預設 `18790`）

後端所需 API 金鑰／channel token 見 `duduclaw-fork/.env.example`。

---

## 更新紀錄

### v1.2.0
- **收錄完整 fork 原始碼**：`duduclaw-fork/` 從「僅前端 web」擴充為完整 DuDuClaw fork（後端全部 crates + 前端 + Python 工具 + 文件），fork 本專案即可取得可自行編譯的完整程式。
- 新增自編後端 gateway 的建置/啟停說明（含 `run-fork-gateway.sh`）。
- `.gitignore` 調整：改以排除 `target/` 等 build 產物，不再排除後端 `crates/`。

### v1.1.0
- **連線錯誤處理**：gateway 未啟動/無法連線時，登入與記憶等頁面改為顯示清楚的中文提示（HTTP 狀態），不再出現難以理解的 `Unexpected token` 解析錯誤（`auth-store.ts` 新增防禦性 JSON 解析）。
- 對應更新 `LoginPage` / `MemoryPage` / `BossSettingsPage` 與三語（zh-TW / en / ja-JP）介面字串。

### v1.0.0
- 首版：genspark 風格客製、貓老闆品牌、單人化精簡介面、Boss 設定與排程任務頁。

---

## 授權

本專案含 DuDuClaw（Apache License 2.0）之衍生前端，詳見 [`LICENSE`](LICENSE) 與 [`NOTICE`](NOTICE)。
