# Agent Self-Verification Framework — Design Checklist

## Overview

Agent 改完程式碼後，自動跑分層驗證漏斗。每層攔截不同類型的錯誤，越快越便宜的先跑。

```
改完程式碼
  ↓
Layer 0: Static Analysis        <1s     攔截結構性錯誤
  ↓ pass
Layer 1: TypeScript             ~2s     攔截型別錯誤
  ↓ pass
Layer 2: Unit Tests             ~1s     攔截邏輯錯誤
  ↓ pass
Layer 3: Dev Server Health      <1s     攔截編譯/啟動錯誤
  ↓ pass
Layer 4: Playwright E2E         ~5-10s  攔截渲染/互動/視覺錯誤
  ↓ pass or fail
Report to user（附數據/截圖）
```

---

## Implementation Checklist

### Phase 1: Infrastructure Setup

- [ ] **1.1** Install Playwright
  ```bash
  cd Templates/demo
  npm install -D @playwright/test
  npx playwright install chromium
  ```
  - 驗證: `npx playwright --version` 回傳版本號

- [ ] **1.2** Create Playwright config (`playwright.config.ts`)
  ```
  - webServer: npm run build && npm run preview (port 4173)
  - timeout: 30s per test, 10s per assertion
  - retries: 0 (local), 2 (CI)
  - reporter: list + html
  - screenshot: only-on-failure
  ```
  - 驗證: `npx playwright test --list` 不報錯

- [ ] **1.3** Create verification runner script (`scripts/verify.sh`)
  ```
  - Layer 0 → 1 → 2 → 3 → 4 sequential
  - Exit on first failure with clear error message
  - Output: per-layer ✓/✗ + total time
  ```
  - 驗證: `bash scripts/verify.sh` 在乾淨狀態下全部通過

- [ ] **1.4** Add to `.gitignore`
  ```
  test-results/
  playwright-report/
  ```

### Phase 2: Layer 0 — Static Analysis

- [ ] **2.1** Create `scripts/verify-static.sh`
  - 檢查項目:
    - [ ] `DocumentHeader` 存在於 PaginatedDocument.tsx
    - [ ] `DocumentFooter` 存在於 PaginatedDocument.tsx
    - [ ] `QuoteComparisonTable` 存在於 QuoteBuilder.tsx
    - [ ] `SectionLabel` 存在於 QuoteBuilder.tsx
    - [ ] `handleDownloadPdf` 存在於 QuoteBuilder.tsx
    - [ ] `export default` 存在於每個模組
  - 驗證: 刪除一個 import → script 回報哪個缺失 → 恢復

### Phase 3: Layer 1 — TypeScript

- [ ] **3.1** 已有: `npx tsc --noEmit`
  - 驗證: 故意加一個型別錯誤 → tsc 報錯 → 恢復

### Phase 4: Layer 2 — Unit Tests

- [ ] **4.1** 已有: `npx vitest run src/quote-builder/__tests__/`
  - 涵蓋: dimensionEngine (50+), emailRenderer (30+), validation (60+), pagination (15+)
  - 驗證: 155+ tests all pass

### Phase 5: Layer 3 — Dev Server Health

- [ ] **5.1** 加入 verify script
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:4173
  # 期望: 200
  ```
  - 驗證: 關掉 server → 回傳非 200 → 開啟 server → 回傳 200

### Phase 6: Layer 4 — Playwright E2E Tests

分為 3 個測試組別：

#### 6A: Smoke Tests（每次都跑）

- [ ] **6A.1** PDF Preview 不是白畫面
  ```
  goto → click PDF tab → expect(.doc-page).toBeVisible()
  ```

- [ ] **6A.2** Email Preview 有內容
  ```
  goto → expect(pre).toContainText('Thank you')
  ```

- [ ] **6A.3** 所有固定區塊存在
  ```
  PDF tab → expect each: DocumentHeader, PRICING, MANUFACTURING NOTES,
  LEAD TIME, SHIPPING, PAYMENT TERMS, TERMS & CONDITIONS, DocumentFooter
  ```

- [ ] **6A.4** Tab 切換正常
  ```
  click Email → content visible
  click PDF → content visible (not blank)
  click Email → content visible (still works)
  ```

#### 6B: Functional Tests（關鍵功能）

- [ ] **6B.1** 輸入資料即時反映在 Email preview
  ```
  fill Part Name "TestPart" → expect email to contain "TestPart"
  ```

- [ ] **6B.2** 輸入資料即時反映在 PDF preview
  ```
  fill Part Name "TestPart" → click PDF tab → expect .doc-page to contain "TestPart"
  ```

- [ ] **6B.3** Add Part 功能
  ```
  click "+ Add Part" → expect parts count = 2
  ```

- [ ] **6B.4** Add Option 功能
  ```
  click "+ Add Option" → expect options count = 2
  ```

- [ ] **6B.5** Same as billing checkbox
  ```
  uncheck → expect Shipping Address fields visible
  check → expect Shipping Address fields hidden
  PDF: check → expect "BILL TO / SHIP TO" (combined)
  PDF: uncheck → expect "BILL TO" + "SHIP TO" (separate)
  ```

- [ ] **6B.6** Cover Letter 切換
  ```
  select "Custom" → expect textarea visible
  select "Standard" → expect textarea hidden
  ```

- [ ] **6B.7** Copy Email 功能
  ```
  fill valid data → click Copy Email → verify clipboard (or button text changes to "Copied")
  ```

- [ ] **6B.8** Download PDF 功能
  ```
  click PDF tab → click Download PDF → expect new window opened (or print dialog)
  ```

- [ ] **6B.9** Validation 顯示
  ```
  leave Part Name empty → expect error message visible
  set price = 0 → expect error message visible
  fill valid data → expect no error messages
  ```

#### 6C: Layout/Spacing Tests（視覺驗證）

- [ ] **6C.1** Pricing 區塊有紫色邊框
  ```
  PDF tab → measure SectionLabel[Pricing] border-color = primary color
  ```

- [ ] **6C.2** 間距隨內容增加而縮小
  ```
  1 Part → measure spacer height = X
  add 3 more Parts → measure spacer height = Y
  expect Y < X
  ```

- [ ] **6C.3** 多頁分頁正確
  ```
  add 8+ Parts → expect page count > 1
  each page has DocumentHeader + DocumentFooter
  page N of M 頁碼正確
  ```

- [ ] **6C.4** Part 灰色底色卡片
  ```
  PDF tab → each pricing part has background-color = gray-50
  ```

- [ ] **6C.5** 截圖基線比對
  ```
  fill standard test data → PDF tab → toHaveScreenshot('pdf-baseline.png')
  ```

### Phase 7: Runner Script Integration

- [ ] **7.1** `scripts/verify.sh` 整合所有 layers
  ```bash
  #!/bin/bash
  set -e
  echo "=== Layer 0: Static Analysis ==="
  bash scripts/verify-static.sh
  echo "=== Layer 1: TypeScript ==="
  npx tsc --noEmit
  echo "=== Layer 2: Unit Tests ==="
  npx vitest run src/quote-builder/__tests__/
  echo "=== Layer 3: Server Health ==="
  # (handled by Playwright webServer config)
  echo "=== Layer 4: Playwright E2E ==="
  npx playwright test
  echo "=== ALL LAYERS PASSED ✓ ==="
  ```
  - 驗證: 完整跑完，全部通過

- [ ] **7.2** Package.json script
  ```json
  "scripts": {
    "verify": "bash scripts/verify.sh",
    "test:e2e": "playwright test",
    "test:unit": "vitest run src/quote-builder/__tests__/"
  }
  ```

### Phase 8: Agent Integration

- [ ] **8.1** Agent 改完程式碼後自動執行
  ```
  Agent: Bash("cd Templates/demo && npm run verify")
  ```

- [ ] **8.2** 失敗時 Agent 讀取結構化輸出
  ```
  - 哪一層失敗
  - 具體錯誤訊息
  - 失敗截圖路徑（Layer 4）
  ```

- [ ] **8.3** Agent 行為規範
  ```
  - 通過 → 告訴用戶「驗證通過」
  - Layer 0-2 失敗 → 根據錯誤訊息自行修正（明確的程式碼錯誤）
  - Layer 4 失敗 → 讀取 Debug_Methodology.md，進行根因分析
  - 2 次修正後仍失敗 → 停止，帶分析報告回報用戶
  ```

---

## Implementation Order

```
Phase 1 (Infrastructure)   ← 先做，其他都依賴它
  ↓
Phase 2 (Static)           ← 最簡單，立即可用
Phase 3 (TypeScript)       ← 已有，只需整合
Phase 4 (Unit Tests)       ← 已有，只需整合
Phase 5 (Server Health)    ← 一行 curl
  ↓
Phase 6A (Smoke)           ← 最高 ROI 的 Playwright 測試
Phase 6B (Functional)      ← 覆蓋所有互動功能
Phase 6C (Layout)          ← 視覺驗證
  ↓
Phase 7 (Runner)           ← 整合成一個指令
Phase 8 (Agent)            ← 最後整合
```

## Acceptance Criteria

整個框架完成時：
1. `npm run verify` 一個指令跑完所有層級
2. 乾淨狀態下 <15 秒全部通過
3. 故意引入每種類型的錯誤都能被對應層級攔截
4. 失敗輸出包含足夠資訊讓 Agent 判斷根因
5. Playwright 截圖存於 `test-results/` 供 Agent 或用戶查看
