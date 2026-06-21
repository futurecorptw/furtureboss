# FutureBoss

**Version 2.0.1**

FutureBoss 是一套「單人專屬」的 AI Agent 控制台 —— 你的 AI 數位分身。提供精簡、溫暖的儀表板介面，整合 Telegram 等通道、排程提醒、記憶與知識庫，讓 AI 助理像貼身特助一樣為你工作。

自 v1.4.0 起為**單一整合 app**：客製外觀（FutureBoss 品牌、genspark 風格、精簡選單、預設淺色）已直接內建於前端，後端 gateway 會把儀表板**編譯進自身**，建置後直接執行 gateway 即可，**不需額外的反向代理層、不必選擇模式**。

---

## 內容結構

```
furtureboss/
└── futureboss-fork/              # 完整後端 + 前端（單一 app，Apache 2.0，見 NOTICE）
    ├── crates/                   # 後端：21 個 Rust crates（gateway / agent / memory / security …）
    │   └── duduclaw-dashboard/   # 把前端 dist 以 rust-embed 編進 gateway binary
    ├── web/                      # 前端原始碼（已內建 FutureBoss 客製：skin / 品牌 / 預設淺色 / 貓圖）
    ├── run-fork-gateway.sh       # gateway 啟停/回滾腳本
    └── Cargo.toml · .env.example · LICENSE …
```

> `target/`、`node_modules/`、build 產物（`dist/`）與密鑰（`.env`）不納入版控，請依下方步驟自行建置。

---

## 主要客製內容（皆已內建於前端）

- **視覺**：genspark 風格配色、貓老闆 logo、Tab 底線化、彈窗置中、精簡線條。
- **品牌**：全介面為 **FutureBoss**、預設助理名稱 **「AI 首席特助」**、favicon 為 paw 圖示。
- **外觀模式**：預設**淺色**，並隱藏外觀切換鈕。
- **單人化**：隱藏多用戶/企業項目（使用者管理、帳號預算、合作夥伴、組織架構、共享 Wiki、帳務、授權、Odoo、Skill 市場、應用市集、任務看板、安全設定、Wiki Trust、審計日誌、Agent 管理、分析報表…），側欄重新排序。
- **原生新增頁面**：**AI 首席特助設定** (`/boss`)、**排程任務** (`/cron`，含時區欄位，預設 Asia/Taipei)、**整合服務** (`/mcp`，連接 Google 等外部服務)。

---

## 建置與啟動

前置：Node.js + Rust（edition 2024，需 ≥1.85）。

> ⚠️ **順序很重要**：儀表板是用 `rust-embed` 編進 gateway binary 的，所以**必須先建置前端產生 `dist/`，再編譯後端**，否則 binary 內不會有儀表板。

```bash
cd futureboss-fork

# 1) 先建置前端（產物輸出到 crates/duduclaw-dashboard/dist/）
cd web
npm install
npm run build        # 若 tsc 嚴格型檢擋住，可改用：npx vite build
cd ..

# 2) 再編譯後端 gateway（會把上一步的 dist 嵌入 binary）
cargo build --release -p duduclaw-cli --bin duduclaw

# 3) 啟動（沿用 ~/.duduclaw 設定，預設 127.0.0.1:18789）
./run-fork-gateway.sh start    # 其他：stop | rollback | build | status
```

開瀏覽器進 **http://localhost:18789** —— 直接就是 FutureBoss 介面。首次啟動會引導建立預設助理（預設名稱「AI 首席特助」）。

後端所需 API 金鑰／channel token 見 `futureboss-fork/.env.example`。

---

## 連接 Google（Gmail / Drive / Docs / Sheets / Forms / Calendar / Apps Script）

兩層設定：

1. **每個部署一次（架站者）**：提供 OAuth 用戶端憑證 —— 設定環境變數
   `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`（見 `.env.example`）。
   值可向維運者索取共用憑證，或自行在 Google Cloud 建一個「Desktop」OAuth 用戶端。
   設了之後，儀表板的 Google 連接會顯示為「已設定」。
2. **每個使用者（只要點一下）**：在儀表板「**整合服務**」頁 → Google → 點 **Authenticate**
   → Google 同意畫面 → 完成。每位使用者授權的是自己的 Google 帳號。

> 註：若該 OAuth app 尚未通過 Google 驗證，使用者會看到「Google 尚未驗證此應用程式」提示，
> 點「進階 → 繼續」即可；未驗證狀態下授權人數上限約 100 人。

---

## 更新紀錄

### v2.0.1
- 「整合服務」頁（`/mcp`）只保留 **OAuth 認證**分頁（連 Google 等服務的入口）；隱藏 Agent 設定 / Marketplace 分頁與「新增 MCP Server」按鈕。

### v2.0.0
- **大型升級：底層 fork 從上游 DuDuClaw v1.20.0 rebase 到 v1.22.1**，併入上游近期所有功能。
- **前端設計系統全面換新（Calm Glass）**：重構儀表板視覺與導覽（選單改為分組、可折疊），並保留 FutureBoss 品牌、精簡選單與「AI 首席特助 / 排程」客製頁。
- 併入上游新功能：並行分支探索（live forking）、技能自動合成排程、WebChat 檔案上傳與多模態、治理 / 推論 / MCP 金鑰等新頁面；通道修正「agent 綁定的 bot token 優先於全域」。
- 保留所有 FutureBoss 客製：Telegram typing + 去 Markdown、Google OAuth 環境變數預設、排程時區欄位、品牌與貓圖。

### v1.4.0
- **合併為單一 app**：移除獨立的反向代理層（`futureboss-skin/`），客製外觀（skin / 品牌 / 預設淺色 / 貓圖）直接內建於前端；後端以 `rust-embed` 把儀表板編進 gateway，建置後直接跑 gateway 即可，不再需要 proxy 或選擇模式。
- **Google 連接預設化**：Google OAuth 的 client_id/secret 可用 `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` 環境變數預先設定；scope 擴充涵蓋 Gmail / Drive / Docs / Sheets / Forms / Calendar / Apps Script / Slides / Tasks。
- 「MCP 工具」選單改名為「**整合服務**」並重新顯示，作為連接 Google 等服務的入口。
- 儀表板靜態檔供應修正：可正確供應根層資源（如貓圖）。

### v1.3.0
- 統一品牌 FutureBoss、預設助理改名「AI 首席特助」、資料夾改名 `futureboss-*`、排程任務新增時區欄位。

### v1.2.0
- 收錄完整 fork 原始碼（後端 + 前端），可自行編譯。

### v1.1.0 / v1.0.0
- 連線錯誤處理與 i18n；首版 genspark 風格客製、單人化精簡介面。

---

## 授權

本專案包含以 **Apache License 2.0** 授權的第三方開源元件，完整授權條款與第三方著作權標示請見 [`LICENSE`](LICENSE) 與 [`NOTICE`](NOTICE)。
