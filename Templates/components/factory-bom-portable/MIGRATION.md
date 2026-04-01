# Factory BOM RFQ Document — Migration Guide

## Overview

This package contains a self-contained React component that renders a printable, multi-page RFQ BOM document for CNC factory quoting. Factories print it, hand-write prices and delivery times, and return it.

**Tech Stack:** React 18 + TypeScript 5 + Tailwind CSS 3

---

## Files in This Package

```
factory-bom-portable/
  MIGRATION.md              ← You are here
  FactoryBomDocument.tsx    ← Main component (copy from parent dir)
  DocumentFooter.tsx        ← Footer component (copy from parent dir)
  Icons_Print.tsx           ← Logo SVG icons (copy from parent dir)
  factory-bom.css           ← All required CSS variables (self-contained)
  FactoryBomDemo.tsx        ← Usage example with print handler
  factoryBom.test.ts        ← 48 tests (vitest)
```

---

## Step 1: Install Dependencies

Your project needs:

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0"
}
```

For tests: `"vitest": "^4.0.0"`

---

## Step 2: Copy Files

Copy these into your project's component directory:

| File | Required | Notes |
|------|----------|-------|
| `FactoryBomDocument.tsx` | Yes | Main component. No changes needed. |
| `DocumentFooter.tsx` | Yes | OR replace with your own footer component. |
| `Icons_Print.tsx` | Yes | OR replace `PRINT_ICONS.logoText(22)` with your logo. |
| `factory-bom.css` | Yes | Import before the component. Map variables to your design system. |
| `FactoryBomDemo.tsx` | Optional | Reference for how to call the component + print handler. |
| `factoryBom.test.ts` | Optional | Run to verify logic after integration. |

---

## Step 3: Import CSS

You likely already have `Design_Sys_style.css` in your ERP system (most variables are shared). You only need the **additional document-specific tokens** from `factory-bom.css`.

**If you have `Design_Sys_style.css`:** only import the `factory-bom.css` portion that defines `--doc-*` variables and the `.doc-page` / `.doc-content` classes (the bottom half of the file). The color/spacing/font variables at the top are already in your `Design_Sys_style.css`.

**If you don't have it:** import the full `factory-bom.css` which is a self-contained extraction of everything needed.

```tsx
import './Design_Sys_style.css';   // your existing file (if you have it)
import './factory-bom.css';        // document-specific additions (--doc-* tokens + .doc-page)
```

The `factory-bom.css` file has inline comments marking which variables come from `Design_Sys_style.css` (likely already present) vs which are document-specific additions.

---

## Step 4: Adapt Branding

### Logo (Icons_Print.tsx)

The header band calls `PRINT_ICONS.logoText(22)` which renders the InstaVoxel SVG logo. To use your own logo:

```tsx
// Option A: Replace in Icons_Print.tsx
logoText: (h: number) => <img src="/your-logo.svg" height={h} />

// Option B: Edit HeaderBand in FactoryBomDocument.tsx directly
// Find: {PRINT_ICONS.logoText(22)}
// Replace with your logo element
```

### Footer (DocumentFooter.tsx)

The footer shows: `docId | www.instavoxel.com | sales@instavoxel.com | Page X of Y`

Either modify `DocumentFooter.tsx` or replace the `<DocumentFooter>` call in `FactoryBomDocument.tsx` with your own footer component matching this interface:

```tsx
interface FooterProps {
  docId: string;      // order code, e.g. "U26033148F"
  page: number;
  totalPages: number;
}
```

---

## Step 5: Pass Data

```tsx
import { FactoryBomDocument, type FactoryBomData } from './FactoryBomDocument';

const data: FactoryBomData = {
  orderCode: 'U26033148F',           // ERP order code (shown in footer)
  orderName: '噴火槍',               // Chinese codename (shown in title)
  issueDate: '4 月 1 日 (三)',       // Header band display
  replyDeadline: '4 月 7 日 下午4點', // Red deadline text
  parts: [
    {
      partId: 'P01',                  // Part ID. Use \n for sub-parts: "P02\n(1/2)"
      dimsMm: { l: 127, w: 89, h: 45 }, // Auto-formatted "127 × 89 × 45"
      // dimsMm: '127 × 89 × 45',    // OR pass pre-formatted string
      weight: 0.34,                   // Auto-formatted "0.34 kg"
      // weight: '0.34 kg',           // OR pass pre-formatted string
      material: '鋁合金 6061-T6',
      finish: '黑色陽極氧化',         // '標準' → renders blank
      qtyTiers: [1, 5, 10],          // Each value = 1 sub-row for factory to quote
    },
  ],
  // Optional overrides:
  // notes: ['Custom note 1', 'Custom note 2'],  // Override manufacturing notes
  // dfmLineCount: 6,                             // Override DFM blank lines (default 4)
};

// Render
const ref = useRef<HTMLDivElement>(null);
<FactoryBomDocument ref={ref} data={data} />
```

---

## Step 6: Print Handler

See `FactoryBomDemo.tsx` for the full print handler implementation. The pattern:

```tsx
const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  // 1. Copy all stylesheets
  // 2. Add print CSS (@page Letter, page-break rules)
  // 3. Inject ref.current.outerHTML
  // 4. setTimeout → printWindow.print()
};
```

---

## Auto-Computed Fields (DO NOT pass manually)

| Display | Computation | Example |
|---------|-------------|---------|
| 零件種類：N 種 | Unique base partIds (before `\n`) | P01, P02, P03, P04, P05 → 5 |
| 共 X / Y / Z 件 | Per-tier quantity sums | [31, 66, 249] for 9 parts |
| 方案一/二/三... | One per max(qtyTiers.length) | 3 tiers → 3 summary rows |
| Pagination | Page 1: 5 rows, Page 2+: 7 rows | 9 parts → 2 pages (5+4) |

---

## CSS Variable Reference

All variables in `factory-bom.css` with their default InstaVoxel values:

### Colors (map to your brand)
| Variable | Default | Usage |
|----------|---------|-------|
| `--color-primary` | `#2E0D77` | Header bg, title text, footer border |
| `--color-primary-light` | `#5B2FD4` | Footer brand URL color |
| `--color-error` | `#B61F1F` | Deadline text |
| `--gray-50` | `#F7F6FB` | Header row bg, thumbnail bg |
| `--gray-100` | `#EDEBF4` | Column separators, guide lines |
| `--gray-150` | `#E4E2EC` | Thumbnail border |
| `--gray-200` | `#D8D5E4` | Header bottom border, section dividers |
| `--gray-300` | `#B5B0C7` | Summary top border |
| `--gray-400` | `#8E89A3` | Labels, placeholders ($, 件, 工作天) |
| `--gray-500` | `#6B6480` | Notes text |
| `--gray-600` | `#56516A` | Section titles (注意事項, 加工備註) |
| `--gray-800` | `#2B2638` | Metadata text (零件種類, 共...件) |
| `--gray-900` | `#1A1625` | Key values (partId, qty, material) |

### Spacing
| Variable | Default | Usage |
|----------|---------|-------|
| `--sp-1` | `4px` | Table header padding, note gaps |
| `--sp-2` | `8px` | Cell padding, metadata padding |
| `--sp-3` | `12px` | Content gap, section spacing |
| `--sp-4` | `16px` | Title gap, notes top padding |

### Typography
| Variable | Default | Usage |
|----------|---------|-------|
| `--font` | `Inter, system-ui, sans-serif` | Base font family |
| `--doc-text-title` | `22px` | "RFQ BOM" heading |
| `--doc-text-subtitle` | `13px` | Order ID |
| `--doc-text-doc-type` | `11px` | Header "BOM 表" |
| `--doc-text-part-id` | `11px` | Metadata labels |
| `--doc-text-secondary` | `9px` | Section titles, dims/weight |
| `--doc-text-thumb-placeholder` | `7px` | "3D" placeholder |
| `--doc-text-footer` | `8px` | Footer text |

### Layout
| Variable | Default | Usage |
|----------|---------|-------|
| `--doc-page-w` | `215.9mm` | Letter width |
| `--doc-page-h` | `279.4mm` | Letter height |
| `--doc-margin-x` | `16mm` | Left/right page margin |
| `--doc-header-h` | `44px` | Header band height |

---

## Verification

After integration, run:

```bash
npx vitest run factoryBom.test.ts    # 48 tests verify all logic
npx tsc --noEmit                      # Type check
```

Then visually verify at your dev server URL.
