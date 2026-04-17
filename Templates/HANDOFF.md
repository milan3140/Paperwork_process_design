# Templates 交接說明

> 專案：InstaVoxel 紙本文件（Paperwork）模板系統
> 讀者：React 18 + TypeScript 5 + Tailwind 3 + Vite 5 熟手
> 目的：工程師 clone 後讀這一份能上手；細節到 git log 和 DemoIndex

---

## 1. 一分鐘定位

**做什麼**：靜態文件模板（Quotation / Invoice / Traveler / CoC 等 13 類），React 組件產 HTML → 列印為 PDF 或 email 內嵌。**非互動 web app**，Quote Proposal Builder 是例外（有編輯介面，目前在 archive）。

**為何多版本**：所有 document 都歷經 v0~vN 迭代。正式版已挑出（見 DemoIndex 的 Current 區），其餘保留在 `_archive/` 供歷史參考，不再維護。

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
│   ├── index.ts                    ← 對外統一 export（給 portable 套件用）
│   ├── {Invoice,Traveler,...}Document*.tsx   ← 各 document 組件（含 _v1~_vN）
│   ├── pagination.ts               ← 分頁演算法核心
│   ├── useDocumentPagination.ts    ← 分頁 React hook
│   ├── PaginatedDocument.tsx       ← 分頁高階組件
│   └── {DocumentHeader,PartBlock,SignatureRow,...}.tsx  ← 共享 primitives
├── Design_Src_Pics_Specs/          ← 設計來源圖片（3D 縮圖、CoC 樣本等）
│                                     唯一 import 點是 components/_assets.ts
└── demo/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx                ← hash-based router
        ├── DemoIndex.tsx           ← 首頁（Current + Archive 兩區）
        ├── DownloadPdfButton.tsx   ← 前端觸發 PDF 下載
        ├── downloadPdf.ts          ← PDF 下載邏輯（呼叫 pdf-server）
        ├── scripts/pdf-server.ts   ← Puppeteer PDF 渲染 server
        ├── __tests__/              ← current 單元測試（factoryBom）
        ├── {Invoice,Traveler,...}Demo*.tsx  ← 各 document 的 demo 頁
        └── _archive/               ← 不再採用的歷史版本
```

**關鍵關係**：
- 一個 document = 一個 `XxxDocument.tsx` 組件 + 一個 `XxxDemo.tsx` 頁面 + 一條 main.tsx route
- Demo 餵假資料給 Document 組件渲染 → 預覽頁 → 可列印 / 下載 PDF
- 共享 primitives（header、meta、signature row 等）放 `components/`，跨 document 複用
- **sharp / dated 變體不是獨立組件**，是對 base document 套 CSS 變數主題（見 § 5）

---

## 3. 執行指令

**Node 版本**：20（見 repo 根的 `.nvmrc`）。Vite 5 需 Node 18+。

```bash
cd Templates/demo
npm install

npm run dev                           # 同時啟 Vite + PDF server（concurrently）
npm run dev:vite                      # 只跑 Vite（parallel session 共用同一 pdf-server 時用）
npm run dev:pdf                       # 只跑 PDF server

npm run build                         # 型別檢查 + production build
npm run typecheck                     # 只型別檢查（= tsc --noEmit）
npm run test                          # 只跑 current 測試（src/__tests__/）
npm run test:bom                      # 只跑 Factory BOM 測試
npm run test:archive                  # 跑 archive 測試（src/_archive/，不再維護）
npm run test:routes                   # Puppeteer 跑過所有 50 條 route（需 dev server 已啟）
```

**Port 使用**：
- `5173` — Vite dev server（所有 demo 頁）；若已被佔用會自動 `5174` / `5175`...
- `3001` — PDF server（`/api/pdf` 端點，`/api/health` 健康檢查）；**不會 auto-increment**，同時只能有一個

**PDF 產生**：任何 demo 頁點右下 `Download PDF` 按鈕即可（`npm run dev` 已經把 PDF server 一併啟起來）。詳細 pipeline 見 § 8。

**整合到其他環境 / production**：`downloadPdf.ts` 的 PDF server URL 可透過 Vite 環境變數覆寫：
```bash
# .env.local 或 .env.production
VITE_PDF_SERVER=https://pdf.instavoxel.com
```
不設則 fallback 到 `http://localhost:3001`。

---

## 4. 路由總覽

**權威來源是 `DemoIndex.tsx`**，這裡摘要：

### Current 正式版（依工作流順序）

| # | 路由 | Document | 備註 |
|---|---|---|---|
| 1 | `#/invoice-v3` | Invoice | |
| 2 | `#/traveler-v3` | Traveler | |
| 3 | `#/factory-bom-dated` | Factory BOM | |
| 3b | `#/factory-bom-date-only` | Factory BOM | `[new]` — issueDate 不帶「2026 年」字樣 |
| 4 | `#/summary-sharp` | Summary（含 QC 空表） | |
| 5 | `#/qc-package-sharp` | QC Package | |
| 6 | `#/packing-slip-v13` | Packing Slip | |
| 7 | `#/coc-v4` | CoC | |

**`[new]` badge**：DemoIndex 的 Route type 有 `badge?: 'new'` 欄位。Current 區同類型可並列現役 + 新迭代，新的那筆掛 `[new]` pill（語意：仍在開發、待升格）。升格流程見 § 10。

### Archive（DemoIndex 折疊區，點分類標題展開）

Quote Proposal Builder（v0~v5）· BOM · Quotation · Invoice（v1~v2）· Traveler（v1, v2, v2-sharp, v4）· Factory BOM（v1, v2, sharp, base）· PO · Summary（base）· QC Package（base）· Packing Slip（base, v1~v12）· CoC（v1~v3）· Receipt · Eval（v1~v3）

**工作流順序依據**：`Design_Src_Pics_Specs/Order_Workflow_Paths.html`（雙路徑圖，Path A = 可自估；Path B = 需詢價）。

---

## 5. 設計 token 與主題變體

### Token 層級

- `components/Design_Sys_style.css` — 通用（色、間距、字級、字體 stack）
- `components/documents.css` — document 專用（列印色板、margin、page break hints）

兩層都必須 import（`main.tsx` 已經做了，任何新 demo 不用再引）。

**慣例**：視覺數值請用 `var(--token-name)`，**不要寫死** `#...` 顏色。現有 components 有 ~80 處 hardcoded 違規是歷史債，不要再增加。

### Sharp / Dated / Date-only 等變體

**機制**：demo 頁在外層包一個 `<div style={{ '--color-primary': '#111', '--font': '...' }}>`，就地覆蓋 CSS custom property。Document 組件本身不知道當前是 sharp 還是 brand 版 — 它只讀 `var(--color-primary)` 等 token。

### Theming Guide — 加一個新變體（例：`Invoice sharp`）

假設 `InvoiceDemo_v3` 是 brand 版，想加一個高對比 `InvoiceDemo_v3_sharp`：

1. **複製 demo 檔**：`InvoiceDemo_v3.tsx` → `InvoiceDemo_v3_sharp.tsx`
2. **在 return 最外層包主題 div**：
   ```tsx
   const sharpTheme: CSSProperties = {
     '--color-primary': '#111',
     '--color-primary-light': '#333',
     '--font': "'Geist', 'Inter', system-ui, sans-serif",
   } as CSSProperties;

   return (
     <div style={sharpTheme}>
       <InvoiceDocumentV3 data={...} />
       <DownloadPdfButton ... />
     </div>
   );
   ```
3. **掛路由**：`main.tsx` 加 lazy import + case；`DemoIndex` current array 加一筆（若同類已有現役，新變體掛 `badge: 'new'`）
4. **驗證 PDF 也套用主題**：`downloadPdf.ts` 會向上走 DOM 把 `--*` 自訂屬性複製到 `.doc-page`，Puppeteer 抓到時主題會保留。確認列印預覽顏色正確。

**不要新建 `InvoiceDocument_sharp.tsx` 組件** — 主題純靠 CSS 變數覆蓋，組件不分叉。

---

## 6. Data Model 速查（Current 7 份）

每個 Document 組件 export 自己的 TS type，命名通常是 `{Doc}Data`。Demo 檔 import 該 type + 提供 sample 資料。

| Document | 組件檔 | Data type | 大致欄位 |
|---|---|---|---|
| Invoice (v3) | `InvoiceDocument_v3.tsx` | `InvoiceData`（從 `InvoiceDocument.tsx` 共用） | `invoiceId`, `variant`('net' / 'pia'), `date`, `dueDate`, `from/billTo/shipTo`, `items`, `payment`, `bankAccounts` |
| Traveler (v3) | `TravelerDocument_v3.tsx` | `TravelerData` | `travelerId`, `orderRef`, `partMeta`, `qtyStages`, `materialSpec`, `qualitySpec`, `thumbUrl` |
| Factory BOM | `FactoryBomDocument.tsx` | `FactoryBomData` | `orderCode`, `orderName`, `issueDate`, `replyDeadline`, `parts`（含 qtyTiers / 多層報價）, `orderNote` |
| Summary | `SummaryDocument.tsx` | `SummaryData` | `orderId`, `stages`（時程）, `orderSummary`, `qcChecklist`（空表用） |
| QC Package | `QCPackageDemo_sharp.tsx`（demo 直接組 3 個 sub-page） | — | 3-page checklist：驗收 / 供應商確認 / 尺寸檢驗 |
| Packing Slip (v13) | `PackingSlipDocument_v13.tsx` | `PackingSlipData` | `slipId`, `shipDate`, `carrier`, `parties`, `items`, `partDocs`（per-part 附件 checklist） |
| CoC (v4) | `CoCDocument_v4.tsx` | `CoCDataV4` | `cocId`, `date`, `orderId`, `customer`, `parts`, `complianceItems`, `certifiedBy` |

**要看完整 shape 直接開 Document 檔**，type 一般在檔頭下方 `export interface {Doc}Data { ... }`。

**跨版本 type 共享範例**：`InvoiceDemo_v3` 只 import `InvoiceDocumentV3` 組件，但 `InvoiceData` type 借自舊 `InvoiceDocument.tsx`。若將來搬 `InvoiceDocument.tsx` 進 archive，要先把 type 搬到 shared 位置再動。

---

## 7. Pagination 設計

三個檔案合作完成分頁：

```
components/pagination.ts          ← 純演算法：SectionMeta[] → PageLayout[]
components/useDocumentPagination.ts ← React hook：量測 DOM → 吐出頁數 + 對應 sections
components/PaginatedDocument.tsx   ← 高階組件：包住 sections，渲染 A4 page
```

**演算法概念**：
1. Document 宣告自己有哪些 section（header, meta, itemRows × N, footer, signatureBlock 等）
2. Hook 先渲染到**隱藏 sandbox** `[data-sandbox]` 量測每個 section 的 px 高度
3. `pagination.ts` 根據 A4 可用高度裝箱，產生 `PageLayout[]`（哪些 section 放第幾頁、page break 在哪）
4. `PaginatedDocument` 根據 layout 重渲染成正式可列印版

**為什麼需要 sandbox 量測**：CSS `@media print` 的 page break 不夠精準（尤其有彩色背景 / 跨行表格），自己算 height 才能控制每頁塞哪些元素、避免 orphan / widow。

**PDF 下載時機**：`downloadPdf.ts` 會等 `[data-sandbox]` 元素被隱藏（表示 pagination 量測結束）才送給 Puppeteer。這是避免拿到量測中途的 DOM。

**已知注意事項**：
- `src/__tests__/factoryBom.test.ts` 的 `paginateParts` describe 塊目前 `.skip`（見 § 12），因為 `5+7` 格式實作與測試不同步，待 triage
- Archive 裡的 `_archive/quote-builder-*/pagination.ts` 是 Quote Proposal Builder 專用的另一套分頁，不影響 current 文件

---

## 8. PDF Pipeline

```
┌────────────────────┐       ┌──────────────────────┐
│  demo 頁 + PDF btn │       │  pdf-server (3001)   │
│   :5173 (Vite)     │       │   Puppeteer + Chrome │
└──────────┬─────────┘       └──────────┬───────────┘
           │                            │
           │ 1. 點 Download PDF         │
           │ 2. downloadPdf.ts 擷取 DOM │
           │    - 找最近 .doc-page      │
           │    - 向上走 ancestors 取   │
           │      CSS custom properties │
           │    - 等 [data-sandbox]     │
           │      隱藏（分頁完成）      │
           │                            │
           │ 3. POST html + styles      │
           │────────────────────────>   │
           │                            │
           │                            │ 4. launch Chrome (CHROME_PATH)
           │                            │ 5. set content + wait fonts
           │                            │ 6. page.pdf({ format: 'A4' })
           │                            │
           │ 7. 回傳 PDF bytes           │
           │<────────────────────────   │
           │                            │
           │ 8. 觸發 browser download   │
           ▼                            ▼
    {filename}.pdf 下載到本機
```

**失敗時的 fallback**：若 pdf-server 沒回應（沒啟 / 連不到），`downloadPdf.ts` 會退而呼叫 `window.print()` — 會開瀏覽器列印對話框、用戶自己選「Save as PDF」。品質略差但不會 crash。

**關鍵細節**：
- **擷取 DOM 而非跳 URL**：Puppeteer 若從 URL 重跑 React，會遇到 hash route / 字體 race / 主題覆蓋 race → 跟螢幕上不一樣。所以 default 是 `useHtmlMode: true`
- **rawHtml 模式**：有 iframe 自含 HTML 的 demo（如 QC Package），傳 `rawHtml: ...` 繞過 DOM 擷取
- **主題保留**：downloadPdf.ts 把 `--color-primary` 等 CSS 變數直接寫到 `.doc-page` 的 inline style，確保 Puppeteer 抓到已解析後的主題

---

## 9. 慣例與陷阱

### 9.1 `_archive/` = 不再採用，不是 staging

Archive 裡的 demo 仍可透過路由預覽（供歷史比對），但不會再接新改動。新功能進 Current 版；想保留舊版當 snapshot → 複製到 `_archive/` + 在 DemoIndex 加入對應分組。

### 9.2 `_assets.ts` 是唯一進出點

任何 demo / document 要用圖片，**只能**從 `components/_assets.ts` import。`_assets.ts` 內部指向 `Templates/Design_Src_Pics_Specs/`，圖片搬移只改這一個檔。

### 9.3 `components/index.ts` 有 re-export

`index.ts` re-export 大部分 document 組件（給 portable 套件用）。新增 document 時別忘了補 export，否則 portable 抓不到。

### 9.4 Sharp / Dated 等變體無獨立 Document 組件

改 Document layout 時：它同時影響 brand 版和 sharp / dated 版。視覺修改用 `var(--color-primary)` token，別寫死顏色。

### 9.5 `[new]` badge

DemoIndex `current` 陣列可以同一類型並列兩筆，新迭代掛 `badge: 'new'` 渲染為淺紫 pill。**語意**：新的那筆仍在開發、正在取代無 badge 的那筆。完成取代時，舊筆移到 `archiveGroups`、新筆去掉 `badge`。

### 9.6 PaperWork_Design_Src/ 已搬入 Templates/

原本 `PaperWork_Design_Src/Design_Src_Pics_Specs/` 在 repo 根目錄且被 `.gitignore` 排除，導致 fresh clone 圖片破圖。已搬到 `Templates/Design_Src_Pics_Specs/` 納管。**別再恢復舊路徑**。

### 9.7 Portable 資料夾

有些 demo 依賴 `portable/` 資料夾（已被 `tsconfig.json` 排除於編譯）。那是為了輸出成獨立 package 預留的。暫時不影響 dev，拆封前先讀 `sync: portable folder ...` commit。

---

## 10. 加新 document / 新迭代的標準流程

### 10.1 全新 document（例：新增「Invoice Credit Note」文件類型）

1. **建組件**：`Templates/components/CreditNoteDocument.tsx`
   - 呼叫 `DocumentHeader` / `DocumentMeta` / 其他 shared primitives
   - 顏色用 `var(--color-primary)` 等 token
   - 如需圖片，透過 `_assets.ts` 增加新 export
   - Export `CreditNoteData` type
2. **建 demo**：`Templates/demo/src/CreditNoteDemo.tsx`
   - Import 組件 + 餵假資料 + 加 `<DownloadPdfButton />`
3. **註冊路由**：
   - `main.tsx` 加 lazy import + switch case
   - `DemoIndex.tsx` 的 `current` 或對應 `archiveGroups` 加一筆
4. **對外 export**：`components/index.ts` 補 export（如要給 portable 用）
5. 跑 `npm run typecheck && npm run test` 確認綠

### 10.2 新迭代（例：Invoice v4）

1. 複製 `InvoiceDocument_v3.tsx` → `InvoiceDocument_v4.tsx`；複製 `InvoiceDemo_v3.tsx` → `InvoiceDemo_v4.tsx`
2. 在 v4 檔案做變更
3. `main.tsx` 加 `#/invoice-v4` case
4. `DemoIndex.tsx` 的 `current` 加一筆 v4，**掛 `badge: 'new'`**（v3 保持無 badge）
5. 同類兩筆並列於 Current，可並印比對
6. **升格時**：v4 取代 v3
   - `DemoIndex`：v3 從 `current` 搬到 `archiveGroups.Invoice`；v4 去掉 `badge`
   - 檔案：`InvoiceDocument_v3.tsx` + `InvoiceDemo_v3.tsx` git mv 到 `components/_archive/` 與 `demo/src/_archive/`（參考 phase 2 的 import path 調整慣例）
   - `components/index.ts` 把 v3 的 export 刪掉、加 v4 的
7. tsc + test 驗證

---

## 11. Troubleshooting

### `Chrome not found` 啟 PDF server 失敗
Mac / Linux 沒裝 Chrome 或路徑非預設 → 設 `CHROME_PATH` 環境變數（見 § 12.5 Loose Ends 的指令範例）。

### 點 Download PDF 後沒反應 / 下載空白 PDF
1. 確認 PDF server 有跑：`curl http://localhost:3001/api/health` 應回 `{"status":"ok"}`
2. 確認 `downloadPdf.ts` 呼叫的 port 對應（`const PDF_SERVER = 'http://localhost:3001'`）
3. 若 demo 是 iframe 自含 HTML（QC Package 這類）→ 確認傳了 `rawHtml` 給 `downloadPdf`
4. Chrome 若未安裝或版本太舊 → `npm run dev:pdf` 啟 server 時會 throw

### 改了組件但 demo 樣式沒跟著動
- 檢查 component 是否讀 `var(--color-primary)`，而不是 hardcode
- sharp / dated demo 頁外層 `<div>` 的 CSS 變數覆寫有沒有誤刪

### 列印 A4 排版錯位
- 看是否有長表格超出一頁但沒掛 `PaginatedDocument`
- 檢查 `[data-sandbox]` 量測步驟是否跑完（downloadPdf.ts 會等它隱藏）

### tsc 無錯但 runtime `Cannot find module './_archive/...'`
- 檢查 `main.tsx` 的 lazy import 路徑（archive 搬動後要帶 `./_archive/` prefix）
- 跑 `git log --follow <file>` 確認檔案有沒有被 archive 移動過

### vitest 紅字一大片
- 多半是 `paginateParts` / `formatDims` 的 drift（見 § 12）— 這些已 `.skip`，不該還紅
- 若依然紅，檢查是不是跑到 `test:archive`（archive 測試不保證綠）

### `npm install` 跑一堆 warning
- 4 個間接依賴 vulnerabilities，不影響 dev；看 § 12 Loose Ends
- 若要清理：`npm audit fix`（非 breaking change 自動套）

---

## 12. Loose Ends / TODOs

- **Quote Proposal Builder 沒正式版**：v5 是最新但未上線，全系列在 `_archive/quote-builder-v*/`。工程師接手若要推進，從 v5 開始即可。
- **BOM / Quotation / PO / Receipt / Eval 沒正式版**：只有 base 或實驗版。若要導入這幾類的正式模板，需重新設計。
- **`factoryBom.test.ts` 有 7 個 skip tests（`TODO(handoff)`）**：`paginateParts` describe（5 failing 測試，外加同區 4 個仍相容的；統一 skip 保持群組一致）+ 2 個 `formatDims` 測試。肇因是實作 drift：
  - `paginateParts`：測試寫 5+7 分頁，實作產出不同比例
  - `formatDims`：測試期待 integer 不加 `.0`，實作現在一律 `.0`
  接手時擇一：修測試對齊實作 OR 修實作對齊測試，然後移掉 `.skip`。
- **`scripts/pdf-server.ts` 依賴本機 Chrome**：用 `puppeteer-core`（不附帶 Chromium），開服前要有 Chrome。

  預設搜尋順序（Windows）：
  ```
  C:/Program Files/Google/Chrome/Application/chrome.exe
  C:/Program Files (x86)/Google/Chrome/Application/chrome.exe
  $CHROME_PATH（環境變數）
  ```

  **Mac / Linux**：設環境變數後再 `npm run dev`
  ```bash
  # Mac
  export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

  # Linux
  export CHROME_PATH="/usr/bin/google-chrome"
  ```
  或把 path 加入 `scripts/pdf-server.ts` 的 `CHROME_PATHS` 陣列（第 27 行）。

- **`DocDesignChecklist.md` 與 `PaperWork_Design_Src/Archive/`**：不在此 repo（設計內部文件），如需請另索取。
- **`npm install` 回報 4 個 vulnerabilities**（1 moderate, 3 high，來自間接依賴）：跑 `npm audit` 看細節。
- **`components/` 約 80 處 hardcoded 顏色（非 `var()`）**：違反 token 慣例但不 breaking。若觸碰相關檔案順手改成 token。
- **`components/index.ts` 仍 re-export archive-only 組件**（CoC v1-v3、PackingSlip v1-v2、EvalDocument 等）：可清理但不影響功能。
- **5 個 Factory BOM + Packing Slip v1 有 `validateDOMNesting` React dev warning**：colgroup/table 子節點有多餘 whitespace，production build 不顯示、視覺正常。整理時刪掉 `<colgroup>` 跟 `<tr>` 之間的空白 text node 即可。

---

## 13. 貢獻慣例

目前 repo **無** ESLint / Prettier / pre-commit hook。CI 有 GitHub Actions（push / PR 會跑 `typecheck` + `test`，見 `.github/workflows/ci.yml`）。

個人 push 前自我把關：
- `npm run typecheck` — 無型別錯誤
- `npm run test` — 無 test 失敗
- `npm run build` — production bundle 可產生

**Commit message 格式**（`git log` 可見現有範例）：
```
<type>: <scope / short summary>

<optional body — 描述 why，不是 what>

Co-Authored-By: ...
```
`type`：`feat` / `fix` / `refactor` / `chore` / `docs` / `test` / `sync` / `style`

**PR 描述**：見 `.github/PULL_REQUEST_TEMPLATE.md`。

---

## 14. Git 是主要交接文件

`git log --oneline` 從 `062f3c6 chore: cleanup for handoff` 起，是交接前的整理 commits。有疑問先 `git log --follow <file>` 或 `git blame` 查上下文。交接階段的關鍵 commits：

```
chore:   cleanup for handoff（062f3c6）
feat:    CoC / Packing Slip / Traveler / ... 各系列
refactor: fix import paths in archived demos
feat:    DemoIndex Current/Archive split + workflow ordering
feat:    centralise shared image assets in components/_assets
feat:    bring design source assets into repo
feat:    DemoIndex collapsible archive groups
docs:    HANDOFF.md engineer handoff guide
chore:   cleanup — drop playwright / verify.sh / add .nvmrc
feat:    Factory BOM (date-only) variant（第一個 [new] 實例）
feat:    DemoIndex type-safe [new] badge + pill UI
test:    scope test script to current + skip drifted cases
```

---

## 15. CLAUDE.md 與本檔分工

- `CLAUDE.md`（repo 根）— AI coding assistant 讀的 bug fix 方法論與執行指令
- `HANDOFF.md`（本檔）— 工程師讀的專案總覽

兩份可並行閱讀。
