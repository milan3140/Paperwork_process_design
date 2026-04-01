# Quote Proposal Builder 工作紀錄 — 2026-03-27

> 目的：匯報今天在 Quote Proposal Builder v2 修復 & v3 全新 UIUX 重新設計的完整工作內容，讓團隊成員徹底理解今天做了什麼、設計決策的原因、以及目前的系統狀態。

---

## 一、今日工作總覽

今天的工作分為兩大塊：

| 項目 | 說明 |
|---|---|
| **v2 修復與完善** | 修復 v2 上線後發現的 7 個問題，強化 PDF 輸出品質 |
| **v3 全新 UIUX 重設計** | 基於 v2 的使用經驗，從零重新設計整個左側編輯面板的操作體驗 |

v3 的目標：**讓工具「非常直觀易懂且極便於使用」**。不是單純加功能，而是重新思考每個操作流程是否符合使用者的心理模型。

---

## 二、v2 修復清單（7 項）

在開始 v3 之前，先完成了 v2 的收尾修復：

### 2.1 PDF 尺寸排序修正

**問題**：Part 的 Dimensions（L × W × H）在 PDF 上直接照輸入順序顯示，例如使用者輸入 10 × 50 × 30，PDF 也顯示 10 × 50 × 30。
**修復**：改為大到小排序（50 × 30 × 10），符合工程圖紙慣例，讓客戶更容易理解零件大小。

### 2.2 normalizePart — 非啟用維度重置

**問題**：使用者勾選了 Location Compare 後填了 TW/US，之後又取消勾選 Location，但 PDF 比較表仍然顯示 TW/US 的差異。
**修復**：新增 `normalizePart()` 函數，在 PDF/Email 輸出前將所有「非啟用維度」的值重置為 Part 預設值。例如取消 Location 後，所有 Option 的 location 統一清空，維度引擎就不會偵測到差異。

### 2.3 比較表文字對齊修正

**問題**：比較表的價格欄位從 `text-right` 改為移除 `w-full` 後表格太窄，加 `minWidth: 50%` 後又不統一。
**修復**：保持 `w-full`（全寬），將所有 `text-right` 改為 `text-left`，讓表格數據統一左對齊，提升閱讀體驗。

### 2.4 PDF 點擊導航拆分

**問題**：PDF 右側的 Manufacturing Notes、Lead Time、Shipping、Payment Terms 區塊全部共用同一個 `data-edit-target="leadTime"`，點擊任何區塊都跳到 Lead Time。
**修復**：拆分為各自獨立的 target（mfgNotes、leadTime、shipping、paymentTerms），每個 PDF 區塊點擊後精確跳到左側對應的編輯區。

### 2.5 Per-Part Note 與 Quote Notes 加入 PDF

**問題**：使用者在 Part 下方填寫的 Per-Part Note、以及 Quote Notes 區塊，在 PDF 上完全沒有呈現。
**修復**：
- Per-Part Note：在 PDF 的每個 Part 比較表下方渲染
- Quote Notes：在 Terms & Conditions 之前新增獨立的「Notes」區塊

### 2.6 `<details>` 箭頭旋轉修復

**問題**：只有 Manufacturing Notes 的 `<details>` 展開時箭頭會旋轉 90 度，其他四個（Shipping、Payment Terms、Quote Notes、T&C）都沒有。
**修復**：為每個 `<details>` 加上唯一的 group 名稱（`group/ship`、`group/pay`、`group/qn`、`group/tc`），配合 `group-open/xxx:rotate-90` 讓箭頭正確旋轉。

### 2.7 Customer Phone 欄位

**新增**：在 Customer 區塊的 Email 旁邊加入 Phone 欄位，對應 `Customer.phone` 類型欄位。

---

## 三、v3 全新 UIUX 重設計 — 設計理念

### 3.1 識別出的三大核心問題

在操作 v2 的過程中，識別出三個核心的 UIUX 問題：

| 問題類型 | 說明 |
|---|---|
| **A. 視覺設計** | 卡片邊框過重、層次不分明、資訊密度不均 |
| **B. 操作流程** | 一次呈現所有欄位造成認知負擔，使用者不知道從哪裡開始 |
| **C. 輸出與輸入的對應性** | 左側填寫、右側預覽，但兩者之間缺乏直覺的對應關係 |

### 3.2 設計原則

基於上述問題，v3 採用以下設計原則：

1. **漸進式揭露（Progressive Disclosure）**：不要一次顯示所有欄位，依照使用者的填寫進度逐步展開
2. **減法優先於加法**：拿掉不必要的視覺元素（例如卡片邊框），而非加更多裝飾
3. **Hover-reveal 操作按鈕**：Remove、Duplicate 等操作平時隱藏，滑鼠移上去才顯示
4. **延遲錯誤顯示**：不要在使用者還在填寫時就顯示紅色錯誤，等到適當時機再一次顯示
5. **PDF↔編輯器雙向導航**：點擊 PDF 上的區塊直接跳到左側對應的編輯區

---

## 四、v3 核心功能實作

### 4.1 漸進式揭露（Progressive Disclosure）

#### Customer 區塊（2 階段）

| 階段 | 觸發條件 | 顯示內容 |
|---|---|---|
| Stage 1 | 永遠顯示 | Company Name + Contact Name |
| Stage 2 | 任一欄位有值 | Email、Phone、Billing Address、Shipping Address |

**設計理由**：大部分使用場景不需要完整的客戶資訊（例如初步報價），先只顯示最基本的兩個欄位，避免空白表單造成的壓迫感。

#### Part 區塊（3 階段）

| 階段 | 觸發條件 | 顯示內容 |
|---|---|---|
| Stage 1 | 永遠顯示 | Part Name + Thumbnail |
| Stage 2 | Part Name 有值 | QTY、Material、Lead Time、Dimensions、Compare checkboxes |
| Stage 3 | 任一 Compare 被勾選 | Pricing Options（所有 Option 卡片）、Per-Part Note |

**設計理由**：使用者必須先命名零件，才有意義填寫材料和數量。必須先決定要比較哪些維度，才有意義設定各 Option 的價格。每一步都建立在前一步的基礎上。

### 4.2 Cost / Margin / Unit Price 定價模型

v2 只有一個 Unit Price 欄位。v3 改為三欄式設計：

| 欄位 | 說明 |
|---|---|
| **Cost (USD)** | 成本價（採購成本） |
| **Margin (%)** | 利潤百分比 |
| **Unit Price (USD)** | 自動計算 = Cost × (1 + Margin/100)，也可手動覆寫 |

**覆寫機制**：
- 正常情況下 Unit Price 由 Cost × (1 + Margin%) 自動計算
- 使用者可直接修改 Unit Price 數字，此時欄位顯示虛線邊框 + "overridden" 標記
- 出現 "Reset to calculated" 按鈕，一鍵恢復自動計算
- 只有當手動輸入的值與計算值不同時，才標記為 overridden（避免誤觸）

**浮點數精度**：所有計算路徑都使用 `Math.round(... * 100) / 100` 確保顯示為 2 位小數，避免 `10.700000000000001` 這類浮點數問題。

### 4.3 延遲錯誤顯示（Delayed Error Display）

**問題**：傳統做法是即時驗證、即時顯示紅色錯誤。但使用者在填寫過程中看到「Price must be greater than 0」只會感到煩躁——他還沒填到那裡呢。

**解決方案**：使用 `showErrors` 狀態，預設為 false。錯誤只在以下三個時機才顯示：

1. **點擊底部錯誤列的 "View" 按鈕**
2. **點擊底部錯誤/警告計數**
3. **嘗試下載 PDF 時被錯誤阻擋**

顯示後，`revealErrors()` 會：
- 設定 `showErrors = true`，所有欄位的 inline error 同時顯現
- 自動捲動到第一個錯誤所在的位置
- 自動展開被收合的 Part（從 `collapsedParts` 中移除）
- 自動展開 `<details>` 元素
- 顯示 2 秒的 highlight ring

**自動重置**：當所有錯誤和警告都修復後，`showErrors` 自動回到 false。

### 4.4 PDF↔編輯器點擊導航

**機制**：
1. PDF 每個區塊設有 `data-edit-target` 屬性（如 `customer`、`part:p1`、`leadTime`）
2. 點擊 PDF 區塊 → 呼叫 `scrollToEditor(targetId)`
3. 左側面板尋找對應的 `data-edit-id` 元素
4. 如果目標在收合的 Part 中 → 自動展開
5. 如果目標在 `<details>` 中 → 自動打開
6. `scrollIntoView({ behavior: 'smooth', block: 'center' })`
7. 顯示 2 秒的紫色 highlight ring

### 4.5 三種 Note 類型

| 類型 | 位置 | 作用範圍 | PDF 位置 |
|---|---|---|---|
| **Per-Part Note** | Part 下方（可選） | 單一零件 | 該零件比較表下方 |
| **Quote Notes** | Delivery & Terms 區塊（可收合） | 整份報價 | Terms & Conditions 之前 |
| **Manufacturing Notes** | Delivery & Terms 區塊（可收合） | 全域 | 固定區塊 |

### 4.6 Part 收合/展開

每個 Part 都可以透過點擊標題的三角箭頭收合。收合時只顯示一行摘要（Part 名稱 + Material + QTY + 價格範圍）。
- 使用 `collapsedParts: Set<string>` 管理狀態
- PDF 點擊導航或 revealErrors 時會自動展開

### 4.7 Compare Hover 提示

當使用者填了 Part Name 但沒有勾選任何 Compare dimension 時，Pricing Options 區域不會顯示。此時如果滑鼠 hover 到 Compare 下方的空白區域，會出現一個 info box 說明：「No comparison dimensions selected. Select at least one above to configure pricing options.」

---

## 五、驗證系統強化

### 5.1 enabledDimensions-aware 驗證

v3 的驗證引擎完全基於 `enabledDimensions` 運作：

- **Scenario QTY**：只有當 `qty` 在 enabledDimensions 中時才驗證 Scenario 的 qty（否則用 Part 預設值）
- **Scenario Lead Time**：同理，只有 `leadTime` 在 enabledDimensions 中時才驗證
- **Fingerprint 指紋**：碰撞和重複檢測的指紋只包含 enabled 的維度值，非 enabled 的維度不影響判斷
- **enabledDimensions 為空**：報錯「Select at least one Compare dimension」，並跳過所有 Scenario 驗證（因為 Pricing Options 區域不可見）

### 5.2 碰撞與重複偵測

| 情境 | 嚴重度 | 說明 |
|---|---|---|
| 相同指紋 + 相同價格 | **Warning** | 完全重複，建議刪除其一 |
| 相同指紋 + 不同價格 | **Error** | 碰撞，同樣條件不能有不同報價 |
| 不同指紋 + 相同價格 | **Warning** | 不同條件但相同價格，詢問是否刻意 |
| Price > $100K | **Warning** | 異常高價提醒 |
| Price < $1 | **Warning** | 異常低價提醒 |
| Cost/Margin 只填一個 | **Warning** | 提醒兩個都要填或都不填 |

### 5.3 漸進式驗證

驗證也遵循漸進式揭露原則：
- Part Name 未填 → 只報 name 錯誤，不報 material、qty 等（因為 Stage 2 不可見）
- enabledDimensions 為空 → 只報 enabledDimensions 錯誤，不報 Scenario 錯誤（因為 Stage 3 不可見）

### 5.4 PDF 下載守衛

- **有 Error** → 阻擋下載，呼叫 revealErrors() 跳到第一個錯誤
- **只有 Warning** → 彈出 confirm 對話框，列出所有警告，讓使用者決定是否繼續
- **無問題** → 直接開啟列印對話框

### 5.5 PDF 場景去重

當 Option 3 的所有值與 Option 1 完全相同（已被標記為 duplicate warning）時，PDF 輸出中會自動去重，避免顯示兩個完全一樣的定價行。

---

## 六、Bug 修復紀錄（v3 開發過程中）

在 v3 開發和測試過程中，發現並修復了以下問題：

| 問題 | 原因 | 修復 |
|---|---|---|
| Unit Price 顯示 10.700000000000001 | 浮點數精度 | 所有計算路徑加 `Math.round(... * 100) / 100` |
| 點擊 Unit Price 就變成 overridden | `onFocus` 直接設定 priceOverride | 改為 `onChange` 時才判斷，且值必須與計算值不同 |
| Warning View 點擊後沒顯示 | ScenarioRow 只讀 `_duplicate` + `_collision`，遺漏 `_samePrice`、`cost`、`marginPercent` | 加入所有 warning 欄位到 rowWarnings |
| Download PDF 沒顯示 warning | handleDownloadPdf 只檢查 errors | 加入所有 validation warnings 到 confirm dialog |
| PDF 中重複 Option 仍然顯示 | 缺少去重邏輯 | 新增 fingerprint Set 去重後再渲染 |
| `<details>` 箭頭不旋轉 | 只有一個有 group-open class | 為每個 details 加唯一 group name |
| PDF 點擊全部跳到 leadTime | info-grid 共用一個 data-edit-target | 拆分為各自獨立的 target |
| Per-Part Note 沒出現在 PDF | buildPdfSections 遺漏 | 在比較表下方加入 note 渲染 |
| Quote Notes 沒出現在 PDF | 缺少區塊 | 在 T&C 之前新增 Notes 區塊 |
| 碰撞應為 Error 非 Warning | 設計決策變更 | `_collision` severity 改為 `'error'` |
| enabledDimensions 空可下載 | 缺少驗證 | 新增 Part-level error |
| 比較表右對齊且太窄 | 移除 w-full 後寬度不足 | 保持 w-full + text-left |
| 測試因驗證變更而失敗 | enabledDimensions: [] 觸發新錯誤 | 為測試 fixtures 加上適當的 enabledDimensions |

---

## 七、v3 檔案結構與規模

```
Templates/demo/src/quote-builder-v3/
  types.ts                      225 行  資料模型 + computeUnitPrice
  dimensionEngine.ts            296 行  維度分析 + 比較邏輯
  validation.ts                 320 行  三層驗證引擎
  QuoteBuilder.tsx            1,497 行  主元件（左側面板 + PDF 建構）
  QuoteComparisonTable.tsx      369 行  比較表（5 種佈局）
  emailRenderer.ts              169 行  Email 純文字輸出
  PaginatedDocument.tsx         130 行  PDF 分頁容器
  pagination.ts                 102 行  分頁計算
  __tests__/
    dimensionEngine.test.ts     706 行  維度引擎測試
    emailRenderer.test.ts       542 行  Email 輸出測試
    pagination.test.ts          232 行  分頁測試
    validation.test.ts          662 行  驗證測試

總計：5,250 行（含測試 2,142 行）
測試數量：167 個測試全部通過
TypeScript：0 個類型錯誤
```

---

## 八、v2 → v3 差異對照

| 面向 | v2 | v3 |
|---|---|---|
| Part 欄位呈現 | 一次顯示所有欄位 | 3 階段漸進式揭露 |
| Customer 欄位呈現 | 一次顯示所有欄位 | 2 階段漸進式揭露 |
| 定價模型 | 只有 Unit Price | Cost + Margin + auto Unit Price（可覆寫） |
| 錯誤顯示 | 即時驗證即時顯示 | 延遲顯示，3 個觸發時機 |
| PDF 點擊 | 無 | 點擊 PDF 區塊跳到對應編輯區 |
| Note 類型 | 無 Per-Part Note | Per-Part Note + Quote Notes + Manufacturing Notes |
| 碰撞嚴重度 | Warning | Error |
| Price < $1 警告 | 無 | Warning |
| Price > $100K 警告 | 無 | Warning |
| Cost/Margin 不完整 | 無 | Warning |
| enabledDimensions 為空 | 無提示 | Error + 漸進式驗證跳過 Scenario |
| Compare hover 提示 | 無 | info box 說明 |
| PDF 場景去重 | 無 | 自動去重 |
| Part 收合 | 無 | 可收合/展開 |
| 操作按鈕 | 始終可見 | Hover-reveal |
| 名稱 | Quote Builder | Quote Proposal Builder |

---

## 九、目前系統狀態

| 版本 | 狀態 | 網址 |
|---|---|---|
| v0 | 冷凍快照 | `/#/quote-builder-v0` |
| v1 | 穩定版（155 tests + 18 E2E） | `/#/quote-builder` |
| v2 | 已修復，穩定 | `/#/quote-builder-v2` |
| v3 | 開發中（167 tests 通過，未 commit） | `/#/quote-builder-v3` |

