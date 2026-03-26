# UI Testing Strategy — Quote Builder

## Use Case

Developer/AI Agent 修改 React + TypeScript 程式碼後，需自動驗證：
- 元素是否可見（不是白畫面）
- 間距是否正確
- 截圖是否與基線一致
- 列印/PDF 輸出是否正常

## 方案總覽

| # | 方案 | 設定複雜度 | 執行速度 | 資源消耗 | 可靠性 | DOM 測量 | 截圖比對 | Agent 可觸發 | 費用 |
|---|------|----------|---------|---------|--------|---------|---------|------------|------|
| 1 | **Playwright** | 低-中 | 2-10s/test | 150-300MB | 極高 (0.72% flaky) | ✅ | ✅ 內建 | ✅ Bash/MCP | 免費 |
| 2 | **Vitest Browser Mode** | 低 | <1s/component | 共用瀏覽器 | 高 | ✅ | ✅ v4.0 內建 | ✅ Bash | 免費 |
| 3 | **Playwright MCP** | 低 | 5-15s/action | 瀏覽器+MCP | 高 | ✅ | ✅ | ✅ 自然語言 | 免費(+token) |
| 4 | **Chrome DevTools MCP** | 低 | 即時 | 共用瀏覽器 | 高 | ✅ | ✅ | ✅ | 免費 |
| 5 | **Puppeteer** | 低 | 3-5s | 150-250MB | 中 | ✅ | ⚠️ 需外掛 | ✅ Bash | 免費 |
| 6 | **Cypress** | 中 | ~16s/test | 300-500MB | 中 (0.83% flaky) | ✅ 間接 | ⚠️ 需外掛 | ✅ Bash | 免費/付費 |
| 7 | **Stagehand** | 中 | 5-10s/action | 雲端/本地 | 中 | ✅ | ⚠️ 需外掛 | ✅ API/MCP | 免費tier/付費 |
| 8 | **Chromatic/Percy** | 中 | 雲端快 | 極低(本地) | 極高 | ❌ | ✅ 核心功能 | ⚠️ CI為主 | $99-399/mo |
| 9 | **Claude Computer Use** | 高 | 10-30s/action | 極高 | 低 | ❌ | ⚠️ LLM判斷 | ✅ API | 高(token) |
| 10 | **Happy DOM/jsdom** | 極低 | <100ms | 極低 | N/A | ❌ 全回0 | ❌ | ✅ | 免費 |
| 11 | **GitHub Actions** | 中 | 30-90s | GitHub runner | 極高 | ✅ via Playwright | ✅ | ⚠️ 非即時 | 2000min免費/mo |

## 推薦方案（按優先順序）

### Tier 1: Playwright CLI（每次改動必跑）

**最佳平衡：速度、可靠性、功能完整度。**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

寫一個 `tests/verify-ui.spec.ts`：
- 導航到 `localhost:5173/#/quote-builder`
- 切換 Email/PDF tab → 驗證不是白畫面
- 測量 spacer 高度 → 驗證在 12-48px 範圍
- 加 Part → 驗證 spacer 縮小
- 截圖比對 → `toHaveScreenshot()`

Agent 執行：`npx playwright test tests/verify-ui.spec.ts`

| 指標 | 數值 |
|------|------|
| 每次驗證耗時 | 2-10 秒 |
| Token 消耗 | ~100 tokens（Bash 指令+結果） |
| 誤報率 | 0.72% |
| 維護成本 | 低（測試腳本穩定後很少改） |

### Tier 2: Vitest Browser Mode（元件級驗證）

**最快回饋。適合驗證單一元件渲染是否正確。**

已在使用 Vitest，加入 browser provider：
```bash
npm install -D @vitest/browser-playwright
```

在元件測試中：
```ts
expect(element).toMatchScreenshot('comparison-table.png');
```

| 指標 | 數值 |
|------|------|
| 每次驗證耗時 | <1 秒 |
| 適用範圍 | 元件級，非全頁面 |

### Tier 3: Playwright MCP（探索性驗證）

**Agent 用自然語言操作瀏覽器。適合「看看這個頁面對不對」的場景。**

設定（加入 `.claude/settings.json`）：
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Agent 可以直接說：「導航到 quote-builder，切到 PDF tab，截圖給我看」

| 指標 | 數值 |
|------|------|
| 每次驗證耗時 | 5-15 秒 |
| Token 消耗 | ~3,500 tokens（MCP schema overhead） |
| 適用場景 | 探索、debug、非重複性檢查 |

### Tier 4: GitHub Actions（CI 守門員）

**每次 push/PR 自動跑完整視覺回歸測試。**

```yaml
# .github/workflows/visual-test.yml
- uses: actions/setup-node@v4
- run: npm ci && npx playwright install chromium
- run: npx playwright test
- uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: test-results/
```

| 指標 | 數值 |
|------|------|
| 每次驗證耗時 | 30-90 秒 |
| 適用場景 | PR 合併前的最終檢查 |

## 不推薦的方案

| 方案 | 原因 |
|------|------|
| **Cypress** | 比 Playwright 慢 60%、flaky 率高 15%、2026 市佔已被超越 |
| **Puppeteer** | Playwright 的子集功能，無內建測試跑器和截圖比對 |
| **Claude Computer Use** | 太慢(10-30s/action)、太貴(token)、無 DOM 存取、只看像素 |
| **Chromatic/Percy** | 對單人開發過度設計，$99-399/月，需要人工審核基線 |
| **Stagehand** | 每個動作都需要 LLM 推理，增加成本和非確定性 |
| **Happy DOM/jsdom** | `getBoundingClientRect()` 全回 0，無法做任何視覺驗證 |

## MCP 瀏覽器自動化伺服器

| MCP Server | 維護者 | 功能 | Token 負擔 |
|-----------|--------|------|-----------|
| `@playwright/mcp` | Microsoft 官方 | 完整 Playwright 瀏覽器控制，26 個工具 | ~3,500 tokens |
| Chrome DevTools MCP | Google Chrome 團隊 | CDP 存取：DOM 檢查、網路、Console、截圖 | ~2,000 tokens |
| Browser MCP | 社群 | Chrome 擴充套件，複用現有瀏覽器 session | ~1,500 tokens |
| Browserbase MCP | Browserbase | 雲端瀏覽器 session + Stagehand 整合 | ~2,500 tokens |

## Token 效率比較

| 方法 | 每次驗證 Token 消耗 |
|------|-------------------|
| Playwright CLI（Bash 工具） | ~100 tokens |
| Playwright MCP | ~3,500 tokens |
| Browser MCP | ~1,500 tokens |
| Claude Computer Use | ~10,000+ tokens |

**結論：Playwright CLI 比 MCP 節省 ~35x tokens。** MCP 適合探索性使用，CLI 適合重複性驗證。

## Self-Verifying Agent Loop（2026 Best Practice）

```
Agent 修改程式碼
     ↓
Tier 1: npx playwright test（2-10s）
     ↓
  通過? ──→ 完成
     ↓ 否
Agent 讀取錯誤訊息 + diff 截圖
     ↓
Agent 修正程式碼
     ↓
重跑測試（loop 直到通過）
```

## 下一步

1. 安裝 Playwright：`npm install -D @playwright/test && npx playwright install chromium`
2. 寫 `tests/verify-ui.spec.ts` 涵蓋 5-10 個關鍵場景
3. 選擇性安裝 Playwright MCP（探索性驗證用）
4. 設定 GitHub Actions workflow（CI 守門員）
