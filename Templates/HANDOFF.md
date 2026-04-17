# Templates 交接說明

> 專案：InstaVoxel 紙本文件（Paperwork）模板系統
> 讀者：React 18 + TypeScript 5 + Tailwind 3 + Vite 5 熟手
> 目的：工程師 clone 後讀這一份能上手；細節到 git log 和 DemoIndex

---

## 1. 一分鐘定位

**做什麼**：靜態文件模板（Quotation / Invoice / Traveler / CoC 等 13 類），React 組件產 HTML → 列印為 PDF 或 email 內嵌。**非互動 web app**，Quote Proposal Builder 是例外（有編輯介面）。

**為何多版本**：所有 document 都歷經 v0~vN 迭代。正式版已挑出（見 `DemoIndex`），其餘保留在 `_archive/` 供歷史參考，不會再維護。

**入口**：`Templates/demo/` 是一個 Vite 應用，`npm run dev` 後在 `http://localhost:5173/` 看到 DemoIndex，逐一預覽所有模板。

---

## 2. 架構速覽

```
Templates/
├── HANDOFF.md                      ← 你在這裡
├── components/                     ← 共享 document 元件庫
│   ├── _assets.ts                  ← 圖片資產 re-export（唯一進出點）
│   ├── Design_Sys_style.css        ← 設計系統 tokens（色、間距、字級）
│   ├── documents.css               ← document 專用 tokens + 列印樣式
│   ├── index.ts                    ← 對外統一 export（目前僅給 portable 用）
│   ├── {Invoice,Traveler,...}Document*.tsx   ← 各 document 組件（含 _v1~_vN）
│   └── {DocumentHeader,PartBlock,SignatureRow,...}.tsx  ← 共享 primitives
├── Design_Src_Pics_Specs/          ← 設計來源圖片（3D 縮圖、CoC 樣本、etc.）
│                                     唯一 import 點是 components/_assets.ts
└── demo/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx                ← hash-based router
        ├── DemoIndex.tsx           ← 首頁（Current + Archive 兩區）
        ├── DownloadPdfButton.tsx   ← 前端觸發 PDF 下載
        ├── downloadPdf.ts          ← PDF 下載邏輯（呼叫後端 pdf-server）
        ├── scripts/
        │   └── pdf-server.ts       ← Puppeteer PDF 渲染 server
        ├── {Invoice,Traveler,...}Demo*.tsx  ← 各 document 的 demo 頁
        ├── __tests__/              ← 單元測試（目前僅 factoryBom）
        └── _archive/               ← 不再採用的歷史版本（demos + quote-builder v0~v5）
```

**關鍵關係**：
- 一個 document = 一個 `XxxDocument.tsx` 組件 + 一個 `XxxDemo.tsx` 頁面 + 一條 main.tsx route
- Demo 餵假資料給 Document 組件渲染 → 預覽頁 → 可列印 / 下載 PDF
- 共享 primitives（header、meta、signature row 等）放 `components/`，跨 document 複用
- **sharp / dated 變體不是獨立組件**，是對 base document 套 CSS 變數主題（見第 6 節）

---

## 3. 執行指令

```bash
cd Templates/demo
npm install

npm run dev                                    # localhost:5173
npx tsc --noEmit                               # 型別檢查
npx vitest run src/_archive/quote-builder-v3/__tests__/   # 舊測試（155+ 案）
npx vitest run src/__tests__/factoryBom.test.ts           # Factory BOM 邏輯測試
```

**PDF 產生**（任何 demo 頁）：點右下 `Download PDF` 按鈕 → 觸發 `downloadPdf.ts` → 呼叫 `scripts/pdf-server.ts` → Puppeteer 渲染 → 下載。開 `node Templates/demo/scripts/pdf-server.ts` 先啟 PDF server。

---

## 4. 路由總覽

**權威來源是 `DemoIndex.tsx`**，這裡摘要：

### Current（7 項，依工作流順序）

| # | 路由 | Document |
|---|---|---|
| 1 | `#/invoice-v3` | Invoice |
| 2 | `#/traveler-v3` | Traveler |
| 3 | `#/factory-bom-dated` | Factory BOM |
| 4 | `#/summary-sharp` | Summary（含 QC 空表） |
| 5 | `#/qc-package-sharp` | QC Package |
| 6 | `#/packing-slip-v13` | Packing Slip |
| 7 | `#/coc-v4` | CoC |

### Archive（按分類折疊於 DemoIndex）

Quote Proposal Builder（v0~v5）· BOM · Quotation · Invoice（v1~v2）· Traveler（v1, v2, v2-sharp, v4）· Factory BOM（v1, v2, sharp, base）· PO · Summary（base）· QC Package（base）· Packing Slip（base, v1~v12）· CoC（v1~v3）· Receipt · Eval（v1~v3）

**工作流順序依據**：`Document_Analysis/Order_Workflow_Paths.html`（雙路徑圖，Path A = 可自估；Path B = 需詢價）。

---

## 5. 設計 token 與主題機制

**Token 層級**：
- `components/Design_Sys_style.css` — 通用（顏色、間距、字級）
- `components/documents.css` — document 專用（列印色板、margin、page break hints）

**兩層都必須 import**（`main.tsx` 已經做了，任何新 demo 不用再引）。

**Sharp / Dated 變體怎麼做到的**：demo 頁在外層包一個 `<div style={{ '--color-primary': '#111', '--font': '...' }}>`，就地覆蓋 CSS custom property。Document 組件本身不知道當前是 sharp 還是 brand 版 — 它只讀 `var(--color-primary)`。

**PDF 下載如何保留主題**：`downloadPdf.ts` 會向上走 DOM，把所有 `--*` 自訂屬性複製到 `.doc-page` 上，再送給 Puppeteer 抓，所以 sharp 的黑色主題能原樣印出。

---

## 6. 慣例與陷阱

### 6.1 `_archive/` = 不再採用，不是 staging

Archive 裡的 demo 仍可透過路由預覽（供歷史比對），但不會再接新改動。新功能進 Current 版；想保留舊版當 snapshot → 複製到 `_archive/` + 在 DemoIndex 加入對應分組。

### 6.2 `_assets.ts` 是唯一進出點

任何 demo / document 要用圖片（3D 縮圖、樣本 PDF），**只能**從 `components/_assets.ts` import。_assets.ts 內部指向 `Templates/Design_Src_Pics_Specs/`，若圖片搬移只改這一個檔。

### 6.3 `components/index.ts` 有 re-export

`index.ts` re-export 大部分 document 組件（給 portable 套件用）。**新增 document 時別忘了補 export**，否則 portable 抓不到。

### 6.4 Sharp / Dated 變體無獨立 Document 組件

改 Document layout 時記得：它同時影響 brand 版和 sharp/dated 版。視覺修改請在 Document 組件用 `var(--color-primary)` 等 token，別寫死顏色。

### 6.5 Portable 資料夾

有些 demo 依賴 `portable/` 資料夾（已被 `tsconfig.json` 排除於編譯），那是為了輸出成獨立 package 預留的。暫時不影響 dev，但拆封 portable 前先讀 `sync: portable folder ...` commit。

### 6.6 PaperWork_Design_Src/ 已搬入 Templates/

原本 `PaperWork_Design_Src/Design_Src_Pics_Specs/` 在 repo 根目錄且被 `.gitignore` 排除，導致 fresh clone 圖片破圖。已搬到 `Templates/Design_Src_Pics_Specs/` 納管。**別再恢復舊路徑**。

---

## 7. 加新 document 的標準流程（3 步）

1. **建組件**：`Templates/components/XxxDocument.tsx`
   - 呼叫 `DocumentHeader` / `DocumentMeta` / 其他 shared primitives
   - 顏色用 `var(--color-primary)` 等 token
   - 如需圖片，透過 `_assets.ts` 增加新 export

2. **建 demo**：`Templates/demo/src/XxxDemo.tsx`
   - Import `XxxDocument` 餵假資料
   - 加上 `<DownloadPdfButton />`

3. **註冊路由**：
   - `main.tsx` 加 `lazy(() => import('./XxxDemo'))` + switch case
   - `DemoIndex.tsx` 的 `current` 或對應 `archiveGroups` 加一筆

**加新迭代**（例如 Invoice 要做 v4）：
1. 新 `InvoiceDocument_v4.tsx` + `InvoiceDemo_v4.tsx`
2. `main.tsx` 加 `#/invoice-v4` case
3. 若 v4 成為新正式版 → 把 v3 從 `current` 移到 `archiveGroups`、搬檔進 `_archive/`
4. `index.ts` 補 export

---

## 8. 目前 Loose Ends / TODOs

- **Quote Proposal Builder 沒正式版**：v5 是最新但未上線，全系列在 `_archive/quote-builder-v*/`。工程師接手若要推進，從 v5 開始即可。
- **BOM / Quotation / PO / Receipt / Eval 沒正式版**：只有 base 或實驗版。若要導入這幾類的正式模板，需重新設計。
- **`_archive/` 內含 pagination 相關測試**（`__tests__/pagination.test.ts` 等），搬進 archive 後仍可跑但不再為產品保證。
- **`scripts/pdf-server.ts` 依賴 Puppeteer + 本機 Chrome**：`pdf-server.ts` 開頭 hardcode 了 Chrome 路徑；跨平台請先檢查。
- **`DocDesignChecklist.md` 與 `PaperWork_Design_Src/Archive/`**：不在此 repo（設計內部文件），如需請另索取。

---

## 9. Git 是主要交接文件

`git log --oneline` 從 `062f3c6 chore: cleanup for handoff` 起，是交接前的整理 commits：

```
bcd043d feat: bring design source assets into repo under Templates/Design_Src_Pics_Specs/
4bfb9cf feat: DemoIndex + main.tsx reorganised by workflow order with Current/Archive split
5565a53 feat: centralise shared image assets in components/_assets
cfa8bb5 refactor: fix import paths in archived demos after _archive/ move
d3c91d0 chore: delete orphan demos never wired to any route
4c11557 chore: accumulated updates to shared components + existing demos
b706970 feat: quote-builder v4 + v5 (WIP)
36a86b6 feat: PDF download tooling (client + server + debug scripts)
33193e3 feat: shared pagination utilities in components/
d45c88a feat: Traveler, QC, PO, Summary + additional document variants
ed7b098 feat: Packing Slip document v1-v13 iterations
d661a1b feat: CoC document (Certificate of Conformance) v1-v4
062f3c6 chore: cleanup for handoff
```

上面以前的 commits 是開發期原始歷程。有疑問先 `git log --follow <file>` 或 `git blame` 查上下文。

---

## 10. CLAUDE.md 與本檔分工

- `CLAUDE.md`（repo 根）— AI coding assistant 讀的 bug fix 方法論與執行指令
- `HANDOFF.md`（本檔）— 工程師讀的專案總覽

兩份可並行閱讀。
