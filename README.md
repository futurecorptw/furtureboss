# FutureBoss

**Version 1.0.0**

FutureBoss 是以 [DuDuClaw](https://github.com/zhixuli0406/DuDuClaw)（v1.20.0，Apache 2.0）為基礎客製化的 AI Agent 控制台，外觀參考 [Genspark](https://www.genspark.ai)，並調整為「單人使用」的精簡介面。

後端 gateway 沿用官方安裝的 DuDuClaw v1.20.0；本專案只重建**前端**並透過一個本機反向代理把客製前端「換上去」，不需重新編譯 Rust binary。

---

## 內容結構

```
furtureboss/
├── duduclaw-skin/                # 本機反向代理 + 樣式注入層
│   ├── proxy.js                  # 供應 fork 前端 + 轉發 gateway + 注入 skin/文字替換 + 貓圖路由
│   ├── skin.css                  # genspark 風格主題 + 側欄隱藏/排序 + Tab/彈窗樣式（即時生效）
│   ├── text-replace.json         # 介面文字替換（品牌名、標籤…，即時生效）
│   ├── cat.png / cat-laptop.png  # 貓老闆 logo 圖
└── duduclaw-fork/
    └── web/                      # fork 的前端原始碼（含原生新增頁面）
```

> `node_modules/` 與 build 產物（`duduclaw-fork/crates/`、`dist/`）不納入版控，請依下方步驟自行建置。

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

前置：已安裝並初始化 DuDuClaw（gateway 跑在 `127.0.0.1:18789`）、Node.js。

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

### 環境變數（proxy.js）
- `DUDU_UPSTREAM_HOST` / `DUDU_UPSTREAM_PORT`：gateway 位址（預設 `127.0.0.1:18789`）
- `DUDU_SKIN_PORT`：代理埠（預設 `18790`）

---

## 授權

本專案含 DuDuClaw（Apache License 2.0）之衍生前端，詳見 [`LICENSE`](LICENSE) 與 [`NOTICE`](NOTICE)。
