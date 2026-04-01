# Quote Proposal Builder 工作紀錄 — 2026-03-31

> 目的：匯報今天在 Quote Proposal Builder v3 的持續開發工作，承接 3/27 的 v3 UIUX 重設計基礎，進一步優化資料模型與編輯體驗。

---

## 一、今日工作總覽

| 項目 | 說明 |
|---|---|
| **Metadata 區域精簡** | 移除 Finish 輸入框，精簡為 3 欄 |
| **Add Part 按鈕強化** | 新增全寬虛線按鈕，降低操作門檻 |
| **自定義維度系統** | 取代固定 Label，使用者可自由新增比較維度 |

---

## 二、Metadata 區域精簡

**變更**：Part metadata 從 4 欄（QTY / Material / Lead Time / Finish）精簡為 3 欄（QTY / Material / Lead Time）。

**設計理由**：
- Finish 不是每個零件都需要填寫的必要資訊，不需要佔據 metadata 區的永久版面
- Compare checkbox 中仍保留 Finish 選項，使用者勾選後可在每個 Option 中設定 `finishOverride`
- 所有 Finish 相關的型別定義、維度分析引擎、比較表渲染、驗證邏輯完全保留，僅移除 metadata 輸入框

---

## 三、全寬虛線 Add Part 按鈕

**變更**：在最後一個 Part 卡片下方新增一個全寬、虛線邊框的 "+ Add Part" 按鈕。

**設計理由**：
- 右上角原有的 "+ Add Part" 文字連結保留不動（方便快速操作）
- 新的全寬按鈕提供更明顯的視覺引導，讓使用者一目了然知道可以繼續新增零件
- hover 時邊框和文字變為主題色，提供操作回饋

---

## 四、自定義維度系統（Custom Dimensions）

這是今天最核心的功能變更，將固定的 "Label" Compare checkbox 替換為彈性的自定義維度系統。

### 4.1 變更動機

v2/v3 原有的 "Label" 只能為 Option 加上一個自由文字標籤，用途有限。實際業務場景中，使用者可能需要根據各種自定義的參數來比較報價，例如：
- **Supplier**：不同供應商的報價比較
- **Process**：不同加工製程（CNC vs 3D Print）
- **Priority**：Rush vs Standard
- **Surface Treatment**：不同表面處理工藝

這些都不屬於內建的 5 個比較維度（QTY / Lead Time / Location / Material / Finish），但都是合理的比較軸。

### 4.2 使用者操作流程

1. 在 Part 的 Compare 區域，點擊 "+ Dimension"
2. 新的自定義維度出現在 checkbox 列中，帶有一個可編輯的名稱欄位
3. 輸入維度名稱（如 "Supplier"）
4. 勾選 checkbox 啟用該維度
5. 每個 Option 自動出現對應的文字輸入欄位
6. 填入各 Option 的維度值（如 "廠商 A"、"廠商 B"）
7. PDF 比較表自動以該維度名稱為欄/列標題

每個自定義維度旁有 × 按鈕可刪除（hover 時顯示），刪除時同時清除對應的 enabledDimensions 設定。

### 4.3 每個 Part 獨立管理

自定義維度是 Per-Part 的，不是全域的。每個 Part 可以有完全不同的自定義維度組合。例如：
- Part A：比較 Supplier + Priority
- Part B：比較 Process

### 4.4 系統連動更新

自定義維度的實作涉及全系統 8 個檔案的連動修改：

| 層級 | 檔案 | 變更內容 |
|---|---|---|
| **型別** | types.ts | 新增 `CustomDimension` 介面、`QuotePart.customDimensions`、`Scenario.customDimValues`、`CompareDimension` 支援 `custom:{id}` 格式、`VaryingDimension` 同步支援 |
| **引擎** | dimensionEngine.ts | `analyzeDimensions` 偵測自定義維度的差異、`getUniqueValues` 支援取值、`findScenarios` 支援匹配、`scenarioFingerprint` 包含自定義值、`generateConditionLabel` 顯示自定義值 |
| **UI** | QuoteBuilder.tsx | Compare 區域的自定義維度管理 UI、ScenarioRow 顯示自定義欄位、`normalizePart` 清理非啟用的自定義值、PDF 去重指紋包含自定義值 |
| **比較表** | QuoteComparisonTable.tsx | 共用 `formatDimValue` 和 `dimHeaderLabel` 支援自定義維度名稱、所有 5 種佈局（Single / Horizontal / Matrix / Grouped Matrix / Flat List）都支援 |
| **驗證** | validation.ts | `buildFingerprint` 包含啟用的自定義維度、碰撞偵測提示文字更新 |
| **Email** | emailRenderer.ts | `generateConditionLabel` 傳入 customDimensions |
| **測試** | validation.test.ts | 更新 `mkQuote` helper 傳遞 customDimensions、2 個測試案例從 Label 改為 Custom Dimension |

### 4.5 驗證結果

- 167 個測試全部通過
- TypeScript 0 個類型錯誤
- 所有 5 種比較表佈局都支援自定義維度

---

## 五、目前系統狀態

| 版本 | 狀態 | 測試 |
|---|---|---|
| v0 | 冷凍快照 | — |
| v1 | 穩定版 | 155 unit + 18 E2E |
| v2 | 穩定版 | 共用 v1 測試 |
| v3 | 開發中（未 commit） | 167 unit tests 通過 |

---

## 六、後續待處理項目

（本節將隨今天後續工作持續更新）
