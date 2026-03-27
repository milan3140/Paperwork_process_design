# Quote Builder 工作紀錄 — 2026-03-26

> 目的：匯報 Quote Builder 的完整設計內容與今日完成的所有工作，讓團隊成員徹底理解系統架構、設計決策、以及開發進度。

---

## 零、Quote Builder 使用方式

### 環境需求

- Node.js 18+（建議 20 LTS）
- npm 9+
- 現代瀏覽器（Chrome / Edge / Firefox）

### 快速啟動

```
cd Templates/demo
npm install          # 首次使用時安裝依賴
npm run dev          # 啟動開發伺服器
```

啟動後瀏覽器開啟 `http://localhost:5173`，進入 InstaVoxel Documents 首頁。

### 存取各版本

| 版本 | 網址 | 說明 |
|---|---|---|
| v2（最新） | `http://localhost:5173/#/quote-builder-v2` | 含可編輯 PDF 區塊 |
| v1（穩定版） | `http://localhost:5173/#/quote-builder` | 完整功能，已驗證 |
| v0（冷凍快照） | `http://localhost:5173/#/quote-builder-v0` | 最初版本，僅供對照 |

也可從首頁（`http://localhost:5173`）點選連結進入各版本。

### 操作流程

1. **填寫報價基本資訊**（左側面板頂部）
   - Quote ID：系統自動生成，可手動修改（格式如 Q2603261A）
   - Valid：報價有效天數（預設 30 天）

2. **填寫客戶資訊**
   - 公司名稱、聯絡人、Email
   - 帳單地址（街道、城市、州/區、郵遞區號、國家）
   - 出貨地址：預設勾選「Shipping same as billing address」，取消勾選後可輸入不同的出貨地址

3. **選擇 Cover Letter 策略**
   - Standard：標準回覆
   - Responding to Target Price：回應客戶目標價格的措辭
   - Dual Location Comparison：美國/台灣雙廠比較的措辭
   - Custom：完全自訂，出現文字輸入區域

4. **建立零件與定價選項**
   - 每個零件填寫：名稱、材料、表面處理（選填）
   - 每個零件下方可新增多個「Pricing Option」（定價選項）
   - 每個選項填寫：數量、單價（USD）、交期天數
   - 選項的進階欄位（用於多維度比較）：製造地點（台灣/美國）、材料覆寫、表面處理覆寫、自訂標籤
   - 點擊「+ Add Option」新增選項，「+ Add Part」新增零件
   - 零件支援「Duplicate」複製和「Remove」刪除

5. **填寫製造備註**
   - 可新增多條備註，會顯示在 PDF 和 Email 中

6. **編輯 PDF 區塊內容**（僅 v2）
   - Lead Time：標題和內容可自訂，內容中 `{leadTime}` 會自動替換為實際工作天數
   - Shipping：標題和內容可自訂
   - Payment Terms：標題和內容可自訂，每行一個項目
   - Terms & Conditions：標題和內容可自訂，內容中 `{validDays}` 會自動替換為有效天數

7. **預覽與輸出**（右側面板）
   - **Email Tab**：即時預覽純文字 Email。點擊「Copy Email」複製到剪貼簿，可直接貼入信件
   - **PDF Tab**：即時預覽分頁 PDF 文件。點擊「Download PDF」開啟列印對話框（可選擇印表機或另存 PDF）。「Copy Cover Letter」僅複製 Cover Letter 段落

### 系統自動行為

- **維度自動偵測**：當零件的各選項之間有不同的數量、地點、材料、表面處理或交期時，系統會自動辨識並選擇最佳的比較表格排版（橫向/矩陣/群組矩陣/清單）。不需要手動指定。
- **分頁自動計算**：PDF 內容超過一頁時，系統自動分頁。每頁有獨立的 Header 和 Footer（含 Page N of M）。區塊間距會根據內容量自動調整。
- **即時驗證**：輸入不合法的值（價格為 0、數量為負、重複選項等）會即時標紅並顯示錯誤訊息。有錯誤時「Copy Email」按鈕會被停用。

### 驗證與測試

```
cd Templates/demo
npm run verify       # 一鍵跑完全部五層驗證（約 30 秒）
npm run test:unit    # 僅跑單元測試（155 個，約 1 秒）
npm run test:e2e     # 僅跑 Playwright E2E（18 個，約 20 秒）
npx tsc --noEmit     # 僅跑 TypeScript 型別檢查
```

### 常見問題

**Q：PDF 下載後格式不對？**
A：Download PDF 使用瀏覽器的列印功能。在列印對話框中確認：紙張大小為 Letter、邊距為 None、勾選「背景圖形」。

**Q：新增第 4、5 個選項後比較表沒有顯示？**
A：確認新選項至少有一個欄位與其他選項不同（數量、地點、材料、表面處理、交期）。如果所有欄位都相同但價格不同，需要加上自訂標籤（Label 欄位）來區分。

**Q：維度分析指示器顯示什麼意思？**
A：每個零件下方的紫色區塊（如「Comparing Quantity x Location」）表示系統偵測到這個零件的各選項之間，哪些欄位有差異。這些差異欄位會決定比較表的排版方式。

---

## 一、今日工作總覽

今日完成兩個主要工作項目：

1. **自動化驗證框架（Verification Funnel）** — 建立完整的五層自動化測試管道，確保 Quote Builder 在每次修改後都能被系統性驗證
2. **Quote Builder v2 — 可編輯 PDF 區塊** — 基於 v1 建立新版本，讓使用者能自訂 PDF 報價單上各區塊的標題與內容

兩項工作皆已通過完整驗證，v1 版本已存檔並確認可正常開啟。

---

## 二、Quote Builder v1 完整設計內容

### 2.1 系統定位與目標

Quote Builder 是 InstaVoxel 的報價產出工具。業務人員在左側面板輸入客戶資訊、零件規格、定價選項，右側面板即時預覽兩種輸出格式：

- **Email 純文字** — 直接複製貼上到信件，格式完全對齊公司現有的業務信件格式
- **PDF 報價單** — 專業排版的多頁 PDF，包含完整的公司資訊、客戶地址、比較定價表、條款等

核心解決的問題是：CNC 加工報價涉及多種維度的組合比較（數量、製造地點、材料、表面處理、交期），傳統做法是業務人員手動在 Excel 或信件中排列這些組合，容易出錯且耗時。Quote Builder 自動偵測哪些維度在不同選項之間有差異，並選擇最適合的比較表格呈現方式。

### 2.2 技術架構

技術堆疊為 React 18 + TypeScript 5 + Tailwind CSS 3 + Vite 5，前端純靜態應用，無後端依賴。

整個系統由以下核心模組組成：

**資料模型（types.ts）**

資料結構採三層巢狀：Quote → Part → Scenario。

一份報價（QuoteBuilderData）包含報價單號、日期、有效天數、客戶資訊、Cover Letter 策略、多個零件、製造備註等。

每個零件（QuotePart）有名稱、預設材料、預設表面處理，以及多個定價選項（Scenario）。

每個 Scenario 代表一種報價條件：數量、單價、交期天數，以及可選的製造地點（台灣/美國）、材料覆寫、表面處理覆寫、自訂標籤。

客戶資訊包含公司名、聯絡人、Email、帳單地址、出貨地址，以及「出貨地址同帳單地址」的切換。地址欄位支援完整的街道、城市、州/區、郵遞區號、國家。

**維度分析引擎（dimensionEngine.ts）**

這是整個系統的核心智慧模組。給定一個零件的所有 Scenario，引擎自動判斷哪些欄位在各選項之間有差異（稱為「varying dimensions」），哪些是固定的。

支援的維度包含：數量（qty）、製造地點（location）、材料（material）、表面處理（finish）、交期（leadTime）。

引擎的分析結果決定了比較表格應該使用哪種排版。維度數量與排版的對應關係：

- 0 個變化維度 → single 排版（只顯示單一價格）
- 1 個變化維度 → horizontal 排版（選項作為欄位橫向排列）
- 2 個變化維度 → matrix 排版（行 × 列矩陣）
- 3 個變化維度 → grouped_matrix 排版（矩陣群組）
- 4 個以上 → flat_list 排版（回退為平面清單）

引擎處理了數個複雜的邊界情況：

「有效值」概念：材料和表面處理有兩層——零件層級的預設值和選項層級的覆寫值。引擎計算每個選項的「有效材料 = 選項覆寫 ?? 零件預設 ?? 空值標記」，用有效值而非原始值來判斷是否有差異。這解決了「部分選項有覆寫、部分沒有」導致的維度判斷錯誤。

交期抑制：當製造地點或數量已經作為比較維度時，交期的差異通常是這些因素的自然結果（台灣和美國的交期本來就不同），此時交期不會被額外標為變化維度，避免排版過於複雜。但在碰撞偵測中仍然會考慮交期差異。

空值標記（NONE sentinel）：使用 '—' 作為統一的空值表示，貫穿整個系統。當某個選項沒有設定某個欄位時，該欄位的有效值為 '—'，而非 undefined 或空字串。這確保了「沒有設定」和「設定為空」在邏輯上的一致性。

findScenarios 函式返回所有匹配的 Scenario（不只第一個），支援同一表格儲存格內堆疊多個選項。getUniqueValues 保留 NONE 值在結果中，確保未設定的選項仍然在比較表中可見。

引擎同時支援條件標籤自動生成：根據變化維度組合出人類可讀的條件描述，例如「U.S. manufacturing, Aluminum 6061-T6」。如果使用者設定了自訂標籤，則優先使用自訂標籤。

**比較表格元件（QuoteComparisonTable.tsx）**

根據維度引擎的分析結果，自動選擇並渲染對應的排版。

SingleLayout：無比較維度時，直接顯示零件名稱 + 價格。

HorizontalLayout：一個比較維度時，維度值作為欄位標題。例如比較數量時，欄位是「QTY 1」「QTY 10」「QTY 100」。使用 getUniqueValues 取得不重複的維度值作為欄位（而非每個 Scenario 一欄），避免重複欄位的問題。

MatrixLayout：兩個比較維度時，一個作為列、一個作為欄，形成矩陣。每個儲存格用 findScenarios 查找匹配的選項。

GroupedMatrixLayout：三個比較維度時，選擇唯一值最少的維度作為群組，每個群組內渲染一個二維矩陣。

FlatListLayout：四個以上維度的回退排版，每個選項一行。

所有排版共用 PriceCell 元件，顯示單價 + 交期 + 比較標註。當同一儲存格有多個匹配的選項時，用虛線分隔垂直堆疊。當交期本身就是比較維度的欄/列標題時，儲存格內不重複顯示交期。

PartHeader 元件在每個零件的比較表上方顯示零件名稱和固定屬性（不作為比較維度的材料、表面處理、製造地點、數量），用中點分隔。

**分頁系統**

分頁是整個 PDF 渲染中技術難度最高的部分。由兩個檔案協同運作：

pagination.ts — 純計算邏輯，不依賴 React 或 DOM。定義了頁面常數：頁面高度 1056px（279.4mm Letter 規格 @ 96dpi）、Header 44px、Footer 40px、上下間距共 36px，可用高度 936px。

核心演算法是 greedy bin-packing：依序將各區塊放入目前頁面，用最小間距 12px 估算。當加入下一個區塊會超出可用高度時，開啟新頁面。

間距計算：同一群組的區塊之間使用固定的 12px 緊湊間距（例如 Pricing 標題和各零件之間），不同群組的區塊之間使用自適應間距。自適應間距 = (可用高度 - 所有區塊高度 - 緊湊間距總和) / 自適應間距數量，限制在 12px 到 48px 之間。

PaginatedDocument.tsx — React 渲染元件。使用隱藏容器測量每個區塊的實際像素高度，傳給 computePageLayouts 計算分頁，然後渲染每一頁。每頁有獨立的 DocumentHeader（Quotation 標題）和 DocumentFooter（Page N of M）。

初始狀態使用 defaultLayout（所有區塊在一頁上），避免首次渲染出現空白畫面。useLayoutEffect 在每次渲染後重新計算並與前一次結果深度比較，只在結果改變時更新 state，防止無限渲染循環。

這套方案是經歷多次嘗試後的最終方案。之前嘗試過 CSS flex-shrink、CSS grid、space-between 等方式，但在巢狀 flex 容器中都無法可靠運作。最終選擇純 JavaScript 計算取代 CSS 彈性佈局，確保間距行為完全可預測、可測試。

**Email 渲染器（emailRenderer.ts）**

將結構化資料轉換為純文字 Email。輸出格式完全對齊公司實際業務信件中觀察到的格式。

Email 結構為九個段落：Cover Letter → 報價標題行 → 各零件明細 → 分隔線 → 製造備註 → 交期說明 → 出貨說明 → 付款條款 → 分隔線 → 結尾。

Cover Letter 支援四種策略：standard（標準回覆）、target_price（回應客戶目標價格）、dual_location（美國/台灣雙廠比較）、custom（自訂）。Standard 和 target_price 會自動帶入材料名稱（如果所有零件材料相同的話）。

零件明細（Line Items）使用維度引擎的分析結果決定顯示方式：固定維度在零件層級顯示（例如「Material: Aluminum 6061-T6」），變化維度在條件標籤中顯示（例如「$38.00 ea @ QTY 10 (U.S. manufacturing)」）。相同輸出行的重複選項會被去重。

交期段落根據各選項的交期範圍自動生成：如果所有選項交期相同，顯示單一值；如果不同，顯示範圍。

**驗證引擎（validation.ts）**

三層驗證：Scenario 層級 → Part 層級 → Quote 層級。

Scenario 驗證：單價必須大於 0、數量必須為正整數、交期必須為正整數。超高價格（>10 萬）、超低價格（<0.01）、超長交期（>365 天）、超大數量（>100 萬）會產生警告（不阻擋輸出）。

Part 驗證：零件名稱必填、材料必填、至少一個選項。

跨選項驗證包含兩種偵測：

完全重複偵測：如果兩個選項的所有欄位完全相同（數量、價格、交期、地點、材料、表面處理、標籤），產生警告提示移除。

碰撞偵測：如果兩個選項的「指紋」相同（數量 + 地點 + 材料 + 表面處理 + 交期 + 標籤的組合）但價格不同，代表它們在比較表中無法被區分，需要加上自訂標籤。這個指紋使用所有六個欄位（而非僅使用 analysis.varying 的結果），因為 analysis.varying 是為了排版而設計的（會抑制交期），而碰撞偵測需要完整的區分能力。

Quote 驗證：報價單號、日期、有效天數必填，自訂 Cover Letter 不可為空，跨零件重複名稱會警告。

驗證結果提供 hasError 和 getErrors 工具函式，讓 UI 可以對特定欄位查詢錯誤狀態，用於輸入框的紅色邊框和行內錯誤訊息顯示。

**主元件（QuoteBuilder.tsx）**

整體採用左右分割面板設計，左半是結構化表單，右半是即時預覽。使用 position: fixed 覆蓋整個視窗。

左側面板包含：
- Quote Info 卡片：報價單號 + 有效天數
- Customer 卡片：公司名 + 聯絡人 + Email + 帳單地址 + 出貨地址（含 Same-as-billing checkbox）
- Cover Letter 卡片：策略下拉選單 + 自訂文字區域
- Parts 區段：每個零件一張卡片，包含名稱/材料/表面處理 + 各選項（數量/單價/交期/地點/材料覆寫/表面處理覆寫/自訂標籤）+ 維度分析指示器
- Manufacturing Notes 卡片：可增減的備註列表

零件支援新增、刪除、複製。選項支援新增、刪除。新增選項時會從前一個選項繼承數量和交期，地點會在台灣/美國之間交替。

右側面板有兩個 Tab：
- Email Preview：渲染純文字 Email，使用等寬排版
- PDF Preview：渲染分頁 PDF 文件

Tab 欄右側的 CTA 按鈕隨 Tab 切換：Email Tab 顯示「Copy Email」按鈕，PDF Tab 顯示「Copy Cover Letter」和「Download PDF」按鈕。驗證不通過時 Copy Email 按鈕會被停用。

PDF 內容由 buildPdfSections 函式組裝，將資料轉換為 PageSection 陣列傳給 PaginatedDocument：
- Title + Meta（報價標題 + 報價單號 + 日期 + 有效天數）
- Parties（FROM + BILL TO / SHIP TO，相同地址時合併顯示，不同時三欄並排）
- Pricing（標題 + 每個零件的比較表 + 結尾線，使用 group: 'pricing' 確保緊湊間距）
- Info Grid（製造備註 + 交期 + 出貨 + 付款條款，2x2 格線排列）
- Terms & Conditions（完整條款文字）

Download PDF 功能開啟新視窗，注入所有 CSS 樣式加上專用的列印 CSS（強制 Letter 尺寸、每頁 279.4mm 高度、flex 佈局確保 Footer 在底部），然後觸發列印對話框。

**視覺設計系統**

所有樣式通過 CSS 變數（Design_Sys_style.css + documents.css）定義，嚴格遵循 4px 格線。主要色彩：紫色主色（color-primary）、灰階梯度（gray-50 到 gray-900）。

表單元件使用 Tailwind CSS class 組合，但數值全部引用 CSS 變數，確保設計 token 的一致性。文字大小、間距、圓角、陰影、動畫持續時間等都引用變數而非寫死數值。

PDF 中的零件比較表有淺灰色背景（gray-50）以區隔各零件。Pricing 區段上下以紫色邊線框出。表格標題用 1.5px 粗邊線，資料行用 1px 細邊線，同一儲存格內多選項用虛線分隔。

驗證錯誤以紅色邊框 + 粉色底色標示，警告以橙色邊框標示，並在欄位下方顯示行內錯誤訊息。

**共用元件庫**

PDF 渲染使用的元件來自 Templates/components/ 共用目錄：

- DocumentHeader：文件頂部標題列（"Quotation"）
- DocumentFooter：頁尾（Quote ID + Page N of M + 結語）
- DocumentMeta：右上角的資訊區塊（日期、有效天數）
- PartiesRow：三欄（FROM / BILL TO / SHIP TO）排列
- SectionLabel：區段標題（大寫、帶底線）
- TermsSection：條款文字區塊

### 2.3 v1 檔案結構

```
Templates/demo/src/quote-builder/
├── types.ts              ── 資料模型（146 行）
├── dimensionEngine.ts    ── 維度分析引擎（270 行）
├── pagination.ts         ── 分頁計算邏輯（103 行）
├── PaginatedDocument.tsx  ── 分頁文件渲染（131 行）
├── QuoteComparisonTable.tsx ── 比較表格（378 行）
├── emailRenderer.ts      ── Email 產出（178 行）
├── validation.ts         ── 驗證引擎（257 行）
├── QuoteBuilder.tsx      ── 主元件（863 行）
└── __tests__/
    ├── dimensionEngine.test.ts  ── 103 個測試
    ├── pagination.test.ts       ── 15 個測試
    ├── emailRenderer.test.ts    ── 37 個測試（含 3 種真實 Email 格式）
    └── validation.test.ts       ── 58 個測試（含碰撞偵測回歸）
```

### 2.4 單元測試涵蓋範圍（155 個測試）

**維度引擎測試（103 個）** — 測試所有維度組合的分析結果：單一 Scenario、各維度獨立變化、二維/三維/多維組合、排版選擇邏輯、條件標籤生成、比較標註計算、唯一值提取、Scenario 查找（含 NONE 一致性）、各種覆寫與預設值衝突情境。

**分頁計算測試（15 個）** — 測試 bin-packing 分頁、間距計算（最大/適中/最小/溢出）、群組緊湊間距、完整管線整合（典型報價 → 1 頁、多零件 → 多頁、間距隨內容增加而縮小）。

**Email 渲染器測試（37 個）** — 測試三種真實業務信件格式的完整重現、四種 Cover Letter 策略、固定段落（製造備註/交期/出貨/付款/結語/分隔線）、維度感知輸出（材料/表面處理/地點在正確層級顯示）、去重邏輯、交期範圍自動生成、多零件報價、覆寫與預設值在 Email 中的正確呈現。

**驗證引擎測試（58 個）** — 測試 Scenario 層級驗證（價格/數量/交期的各種無效值和邊界值）、Part 層級驗證（必填欄位）、跨選項驗證（完全重複偵測、碰撞偵測、指紋一致性）、Quote 層級驗證、合法報價的通過確認、驗證結果工具函式。含 6 個標記為 "BUG FIX" 的回歸測試，確保已修復的問題不會復發。

### 2.5 開發歷程中修復的重要 Bug

在 v1 的開發迭代中，共修復了十餘個顯著 Bug。以下列舉具代表性的問題及其根因：

**材料覆寫未顯示在 Email 中**：renderLineItem 使用了 part.material（零件預設值）而非 analysis.fixed.material（經維度引擎分析後的有效值）。當所有選項都覆寫為相同材料時，Email 仍顯示零件預設材料。

**NONE 空值標記不一致**：getUniqueValues 使用 '—' 作為空值，但 findScenarios 用空字串比對，導致沒有設定維度值的選項在表格中查不到。修復後統一使用 NONE 常數。

**碰撞偵測誤報**：指紋計算使用 analysis.varying（排版用），而非所有欄位。當地點和數量同時變化時，交期被排版邏輯抑制。兩個選項地點相同但交期不同，排版指紋相同導致誤報碰撞。修復後碰撞偵測的指紋涵蓋全部六個欄位。

**CSS flex-shrink 不生效**：嘗試用 CSS flex-shrink 讓間距隨內容增加而縮小，但在巢狀 flex 容器中父元素沒有確定高度時，shrink 不會觸發。嘗試了 height:0 + flex:1、overflow:hidden、CSS grid 等方案都不可靠。最終改為純 JavaScript 計算。

**PDF 首次渲染空白**：pages state 初始為空陣列，首次 mount 時沒有任何內容渲染。修復為提供 defaultLayout 作為初始值。

**無限渲染循環**：useLayoutEffect 無條件呼叫 setState → 觸發重新渲染 → 又進入 useLayoutEffect。修復為深度比較新舊結果，相同時不更新 state。

**列印時 Footer 浮動**：螢幕預覽正確，但 Download PDF 開啟的新視窗沒有正確的 CSS。修復方式是注入專用的列印 CSS，強制 .doc-page 為 flex 容器、.doc-content 使用 flex:1 撐滿剩餘空間。

**重複欄位**：HorizontalLayout 為每個 Scenario 建立一欄，導致相同維度值出現多次。修復為使用 getUniqueValues 取得不重複的值作為欄位。

---

## 三、自動化驗證框架（已合併至 master）

### 3.1 為什麼需要這個框架

Quote Builder 經過多輪功能開發與 Bug 修復，累積了大量互相依賴的元件。過去每次修改後都需要手動檢查「PDF 有沒有壞掉」「Email 格式對不對」「分頁正不正常」，不僅耗時且容易遺漏。驗證框架的目的是讓一個指令就能跑完所有檢查，開發者不需要記住該測什麼。

### 3.2 五層驗證架構

整個框架設計為漏斗式結構，從最快最基本的檢查開始，逐層深入：

**Layer 0：靜態分析（不到 1 秒）**
用 grep 掃描原始碼，確認 18 個關鍵結構元素存在。例如：QuoteBuilder 有 default export、PaginatedDocument 使用了 DocumentHeader 和 DocumentFooter、types.ts 中 QuoteBuilderData interface 存在、pagination.ts 導出 computePageLayouts 等。這一層的目的是在不執行任何程式的情況下，快速攔截「元件被刪除」或「import 被意外移除」之類的結構性錯誤。

**Layer 1：TypeScript 型別檢查（約 2 秒）**
執行 tsc --noEmit，確認所有型別定義正確、沒有型別錯誤。這層能攔截介面變更後忘記更新使用處的問題。

**Layer 2：單元測試（約 1 秒）**
執行 Vitest，跑 155 個單元測試。涵蓋維度引擎、分頁計算、Email 產出、驗證邏輯四個模組。每個模組的測試都包含正常情境、邊界條件、以及過去發現過的 Bug 回歸測試。

**Layer 3：Production Build（約 5 秒）**
執行 Vite build，確認 TypeScript 編譯成功、所有 import 路徑正確、產出的 bundle 完整。由 Playwright 的 webServer 設定自動處理。

**Layer 4：Playwright E2E 瀏覽器測試（約 19 秒）**
使用 Playwright 啟動真實瀏覽器，對 production build 執行 18 個端對端測試。分為三個群組：

- **A 群：Smoke Tests（4 個）** — PDF 預覽有渲染（不是空白）、Email 預覽有內容、PDF 中所有固定區塊都存在、Tab 切換不會讓畫面壞掉
- **B 群：Functional Tests（9 個）** — 輸入零件名稱後 Email 和 PDF 都會更新、Add Part 增加零件數量、Add Option 增加選項、Same-as-billing checkbox 正確切換顯示、Cover Letter 下拉選單切換模式、CTA 按鈕隨 Tab 切換、驗證錯誤正確顯示
- **C 群：Layout Tests（5 個）** — Pricing 區塊有彩色邊框、Spacer 高度隨零件增加而縮小、多頁分頁正確顯示頁碼、零件卡片有灰色背景、Header 和 Footer 不互相重疊

### 3.3 使用方式

```
cd Templates/demo
npm run verify
```

一個指令依序跑完全部五層，任何一層失敗就停止並報錯。全部通過耗時約 27-34 秒。

### 3.4 新增的檔案

| 檔案 | 用途 |
|---|---|
| scripts/verify.sh | 主控腳本，依序呼叫五層 |
| scripts/verify-static.sh | Layer 0 靜態分析，18 個 grep 檢查 |
| tests/quote-builder.spec.ts | 18 個 Playwright E2E 測試 |
| playwright.config.ts | Playwright 設定（webServer、timeout、screenshot） |
| Verification_Framework_Checklist.md | 框架設計規格與實作檢查清單 |

---

## 四、v1 版本存檔與驗證

在開始 v2 開發之前，先確認 v1 現有版本的完整性：

- 確認 working tree clean，所有變更已 commit（commit hash: 1b78744）
- 執行 TypeScript 型別檢查：通過
- 執行 Production build：成功（1.75 秒）
- 確認已 push 至 GitHub remote（origin/master）
- v1 持續可透過 `localhost:5173/#/quote-builder` 存取

v1 版本在整個 v2 開發過程中完全未被修改。

---

## 五、Quote Builder v2 — 可編輯 PDF 區塊

### 5.1 需求背景

v1 的 PDF 報價單中，Lead Time、Shipping、Payment Terms、Terms & Conditions 這四個區塊的內容是寫死在程式碼裡的。使用者無法調整措辭、修改條款、或針對特定客戶客製化這些區塊的內容。業務人員在不同報價情境下可能需要不同的付款條件說明，或是針對特定客戶調整出貨條款。

### 5.2 設計決策

**架構選擇：獨立 v2 目錄，不修改 v1**

將 quote-builder 完整複製為 quote-builder-v2，然後在 v2 上修改。這個決策基於以下考量：

- v1 已經過完整驗證且穩定，不應該承受新功能的風險
- v2 的變更涉及資料模型（types.ts 新增欄位），如果在 v1 上改會破壞現有測試
- 平行版本讓我們可以隨時比較行為差異，方便回溯
- v0（冷凍快照）、v1（穩定版）、v2（新功能版）三個版本並存，路徑清晰

**資料模型設計：EditableSection 介面**

新增 EditableSection 介面，包含 label（標題）和 content（內容）兩個字串欄位。在 QuoteBuilderData 中新增 sections 物件，包含四個 EditableSection：leadTime、shipping、paymentTerms、terms。

選擇用樣板變數（template variables）處理動態內容，例如 {leadTime} 會在渲染時被替換為實際的工作天數範圍，{validDays} 會被替換為報價有效天數。這樣使用者可以自由調整前後文字，而動態數值仍會正確插入。

**UI 設計：左側面板新增 PDF Sections 編輯區**

在左側表單面板的底部（Manufacturing Notes 之後），新增「PDF Sections」區塊。每個區塊用獨立的卡片呈現，卡片內有兩個欄位：Section Label（標題輸入框）和 Content（內容文字區域）。內容區域支援多行輸入，Payment Terms 以換行分隔各項目。

### 5.3 修改的檔案與具體變更

**types.ts（+31 行）**
- 新增 EditableSection 介面（label + content）
- QuoteBuilderData 新增 sections 欄位（leadTime、shipping、paymentTerms、terms）
- createDefaultQuote 提供四個區塊的預設內容，包含樣板變數

**QuoteBuilder.tsx（+121 行 / -19 行）**
- 新增 SectionEditor 元件：可重用的表單元件，接受 EditableSection 並提供 label 輸入框 + content 文字區域
- 左側面板新增四張編輯卡片，分別對應 Lead Time、Shipping、Payment Terms、Terms & Conditions
- PDF 渲染邏輯（buildPdfSections）從寫死的文字改為讀取 data.sections 的內容
- Lead Time 區塊：執行 {leadTime} 樣板變數替換，將工作天數範圍插入使用者自訂的內容中
- Payment Terms 區塊：將多行內容按換行符號拆分為項目清單
- Terms & Conditions 區塊：從使用共用 TermsSection 元件改為直接渲染，以支援自訂標題

**emailRenderer.ts（+22 行 / -30 行）**
- renderLeadTime 函式改為讀取 data.sections.leadTime 的內容，替換 {leadTime} 變數
- 移除 SHIPPING 和 PAYMENT_TERMS 兩個寫死的常數
- 新增 renderShipping 和 renderPaymentTerms 函式，從 data.sections 讀取內容

**測試檔案調整**
- emailRenderer.test.ts（+10 行 / -5 行）：fixture 新增 sections，斷言匹配新措辭
- validation.test.ts（+6 行）：fixture 新增 sections

### 5.4 路由與進入點

在 main.tsx 新增 #/quote-builder-v2 路由，DemoIndex 首頁加入 v2 連結。

存取方式：npm run dev → localhost:5173/#/quote-builder-v2

---

## 六、驗證結果

### 6.1 v2 單獨驗證

- TypeScript 型別檢查：通過（零錯誤）
- v2 單元測試：155 個全部通過
- Production build：成功（1.70 秒，三個 QuoteBuilder chunk — v0、v1、v2）

### 6.2 完整驗證管道（npm run verify）

```
Layer 0: 18 靜態檢查 ✓
Layer 1: TypeScript ✓
Layer 2: 155 單元測試 ✓
Layer 3: Build ✓
Layer 4: 18 Playwright E2E ✓
ALL LAYERS PASSED (34s)
```

### 6.3 v1 回歸確認

v1 的 155 個單元測試獨立執行後全部通過，確認 v2 開發未影響 v1。

---

## 七、目前版本狀態

| 版本 | 路由 | 狀態 | 說明 |
|---|---|---|---|
| v0 | /#/quote-builder-v0 | 冷凍快照 | 最初始版本，不再修改 |
| v1 | /#/quote-builder | 穩定版 | 完整功能 + 驗證框架覆蓋，已存檔至 master |
| v2 | /#/quote-builder-v2 | 開發中 | v1 全部功能 + 可編輯 PDF 區塊 |

v2 的變更尚未 commit，目前為 working tree 中的未追蹤檔案（quote-builder-v2 目錄）加上 main.tsx 和 DemoIndex.tsx 的小幅修改。

---

## 八、技術備註

### 樣板變數機制（v2）

v2 的可編輯區塊使用簡單的字串替換（非模板引擎），目前支援兩個變數：

- {leadTime} — 自動替換為根據所有零件選項計算出的工作天數（單一值或範圍）
- {validDays} — 自動替換為報價有效天數

使用者在編輯內容時可以把這些變數放在任何位置。

### 驗證框架的 E2E 測試目前針對 v1

Playwright E2E 測試的 URL 指向 /#/quote-builder（v1）。v2 的新功能（可編輯區塊）目前僅由單元測試覆蓋。後續若需要為 v2 新增專屬的 E2E 測試，可以複製現有 spec 檔案並調整 URL 和新增區塊的互動測試。

### 參考文件

以下文件提供更深入的技術細節，開發時可按需查閱：

| 文件 | 內容 |
|---|---|
| Debug_Methodology.md | 完整的六步根因分析方法論、反模式、各層範例 |
| Known_Pitfalls.md | 7 個已記錄的 Bug 模式，含症狀/成因/修復方式 |
| UI_Testing_Strategy.md | 10 種測試方法的比較分析 |
| Verification_Framework_Checklist.md | 驗證框架的設計規格與實作檢查清單 |
