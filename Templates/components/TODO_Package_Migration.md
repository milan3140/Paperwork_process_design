# 元件庫套件化 (Package Migration) — 執行指南

> **目的**：將目前「散裝 .tsx 檔案手動複製」的分發方式，改為標準 npm 套件，讓工程師用 `npm install` 引入。
> **範圍**：`Design_Sys/Shared_Components/components/` (Web UI 元件) + `Templates/components/` (文件元件)
> **重要**：元件的 Props、資料傳遞、內部邏輯、CSS Token 引用**完全不需要修改**。只改檔案打包/分發方式。

---

## 現況問題

```
工程師要用 Button.tsx:
1. 到 Shared_Components/components/ 找到 Button.tsx
2. 手動複製到自己專案的 src/components/
3. 同時複製 Design_Sys_style.css 和 Icons.tsx（REQUIRES 依賴）
4. 手動確認 import 路徑
5. 你改了元件 → 工程師不知道、無法同步
```

## 目標

```
工程師要用 Button:
1. npm install @instavoxel/ui
2. import { Button } from '@instavoxel/ui';
3. import '@instavoxel/ui/styles.css';
4. 你更新元件 → npm publish → 工程師 npm update
```

---

## 需要產出的兩個套件

### 套件 1: `@instavoxel/ui` (Web UI 元件)

**來源**：`Design_Sys/Shared_Components/components/` 中的所有 .tsx 檔
**消費者**：InstaVoxel 主網站工程師

### 套件 2: `@instavoxel/documents` (文件渲染元件)

**來源**：`Templates/components/` 中的所有 .tsx 檔
**消費者**：文件生成系統
**依賴**：`@instavoxel/ui`（引用 Design_Sys_style.css 中的 token）

---

## 具體執行步驟

### Step 1: 建立 `index.ts` 統一匯出入口

每個元件庫資料夾建立 `index.ts`，匯出所有公開元件和型別。

**`Design_Sys/Shared_Components/components/index.ts`**（範例）:
```ts
// Components
export { Button } from './Button';
export type { ButtonProps } from './Button';
export { Modal } from './Modal';
export { StatusBadge } from './StatusBadge';
export { Input } from './Input';
// ... 所有其他元件

// Icons
export { ICONS, Icon } from './Icons';
export type { IconName } from './Icons';
```

**`Templates/components/index.ts`**（範例）:
```ts
// Shared document components
export { DocumentHeader } from './DocumentHeader';
export { DocumentFooter } from './DocumentFooter';
export { DocumentMeta } from './DocumentMeta';
export type { MetaItem } from './DocumentMeta';
export { SectionLabel } from './SectionLabel';
export { PartiesRow } from './PartiesRow';
export type { PartyInfo } from './PartiesRow';
export { KeyInfoRow } from './KeyInfoRow';
export type { KeyInfoItem } from './KeyInfoRow';
export { PartBlock } from './PartBlock';
export type { PartData, PartParam } from './PartBlock';
export { NRETable } from './NRETable';
export type { NRECharge } from './NRETable';
export { TotalsTable } from './TotalsTable';
export type { TotalLine } from './TotalsTable';
export { NotesList } from './NotesList';
export { WarningBox } from './WarningBox';
export { PaymentInfo } from './PaymentInfo';
export type { InfoItem } from './PaymentInfo';
export { SignatureRow } from './SignatureRow';
export { TermsSection } from './TermsSection';

// Composed documents
export { QuoteDocument } from './QuoteDocument';
export type { QuoteData } from './QuoteDocument';

// Icons
export { PRINT_ICONS } from './Icons_Print';
export type { PrintIconName } from './Icons_Print';
```

### Step 2: 建立 `package.json`

每個元件庫資料夾需要自己的 `package.json`。

**`Design_Sys/Shared_Components/components/package.json`**:
```json
{
  "name": "@instavoxel/ui",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --external react",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

**`Templates/components/package.json`**: 同上，但 `name` 改為 `"@instavoxel/documents"`，且 `peerDependencies` 加上 `"@instavoxel/ui": ">=1.0.0"`。

### Step 3: 調整檔案結構

```
元件庫資料夾/
  src/                    ← 原始碼移入 src/
    index.ts              ← Step 1 建立的匯出入口
    Button.tsx
    Modal.tsx
    Icons.tsx
    Design_Sys_style.css
  package.json            ← Step 2 建立的
  tsconfig.json           ← 已有
  dist/                   ← build 產出（git ignore）
    index.js
    index.mjs
    index.d.ts
    styles.css
```

注意：原始碼從資料夾根目錄移入 `src/` 子資料夾。這意味著元件內部的**相對 import 不需要改**（`'./Icons'` 仍然指向同資料夾的 Icons.tsx），但 `tsconfig.json` 的 `include` 要改為 `["src"]`。

### Step 4: 安裝 Build 工具 & 測試

```bash
cd components/
npm install
npm run build        # 產出 dist/
```

確認 `dist/` 中有：
- `index.js` (CommonJS)
- `index.mjs` (ESM)
- `index.d.ts` (型別定義)
- `styles.css` (CSS)

### Step 5: 發布

**選項 A — npm 私有發布**:
```bash
npm login
npm publish --access restricted
```

**選項 B — GitHub Packages**:
在 `package.json` 加 `"publishConfig": { "registry": "https://npm.pkg.github.com" }`

**選項 C — 本地開發先用 `npm link`**:
```bash
# 在元件庫資料夾
npm link

# 在消費者專案
npm link @instavoxel/ui
```

### Step 6: 消費者專案使用

```bash
npm install @instavoxel/ui
```

```tsx
import { Button, Modal, StatusBadge } from '@instavoxel/ui';
import '@instavoxel/ui/styles.css';
```

---

## 不需要改的東西（確認清單）

| 項目 | 需要改嗎 | 說明 |
|---|---|---|
| 元件 Props 定義 | **不改** | ButtonProps, ModalProps 等完全不動 |
| 資料傳遞方式 | **不改** | 所有 callback、controlled/uncontrolled pattern 不動 |
| 元件內部邏輯 | **不改** | 狀態管理、事件處理不動 |
| CSS Token 引用 | **不改** | `var(--color-primary)` 等全部不動 |
| Tailwind class | **不改** | 所有 className 不動 |
| Icons.tsx / Icons_Print.tsx | **不改** | SVG 定義不動 |
| data-comp / data-el | **不改** | DevTools 標識不動 |
| JSDoc 文檔 | **不改** | 所有文檔不動 |
| Design_Sys_style.css 內容 | **不改** | Token 定義不動（只是重新命名為 styles.css 作為匯出） |

## 需要改的東西

| 項目 | 改什麼 |
|---|---|
| 建立 `index.ts` | 新增檔案，匯出所有元件 |
| 建立 `package.json` | 新增檔案，定義套件名稱、版本、入口 |
| 原始碼移入 `src/` | 資料夾結構調整（import 路徑不變） |
| 安裝 `tsup` | Build 工具，將 TSX 編譯為 JS |
| `tsconfig.json` include 路徑 | 從 `./**/*.tsx` 改為 `src/**/*.tsx` |
| CSS 檔案處理 | 確保 build 時 CSS 被複製到 dist/ |

---

## Build 工具選擇

推薦 **tsup** — 零配置 TypeScript 打包工具，專門給 library 使用：
- 自動產生 CJS + ESM + .d.ts
- 內建 CSS 處理
- 不需要 Webpack/Rollup 配置

替代方案：Vite library mode、Rollup、unbuild

---

## 預估工作量

| 步驟 | 時間 | 備註 |
|---|---|---|
| 建立 index.ts | 30 分鐘 | 列出所有 export |
| 建立 package.json | 15 分鐘 | 模板化 |
| 移動檔案到 src/ | 15 分鐘 | 純搬動 |
| 安裝 tsup + 設定 | 30 分鐘 | |
| 測試 build | 30 分鐘 | 確認 dist/ 正確 |
| 消費者專案測試引用 | 30 分鐘 | npm link + import 測試 |
| **合計** | **~2.5 小時** | |
