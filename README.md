# Paperwork Process Design

Instavoxel's document generation and quoting system. React + TypeScript components for producing print-ready PDF documents and structured email quotes.

## Quick Start

```bash
cd Templates/demo
npm install
npm run dev
```

Open http://localhost:5175 to see all available tools:

| Route | Tool | Status |
|-------|------|--------|
| `/#/quote-builder` | **Quote Builder** — generate email + PDF quotes with multi-dimensional pricing comparison | Active development |
| `/#/quote` | Quote Document preview | Stable |
| `/#/bom` | BOM Sheet preview | Stable |
| `/#/eval` | Internal Evaluation Report | Stable |

## Project Structure

```
Templates/
├── demo/                        # Vite dev app — all tools run here
│   ├── src/
│   │   ├── quote-builder/       # ★ Quote Builder (core tool)
│   │   │   ├── types.ts         #   Data model
│   │   │   ├── dimensionEngine.ts  # Dimension analysis & scenario matching
│   │   │   ├── emailRenderer.ts    # Plain-text email generator
│   │   │   ├── validation.ts       # Input validation (140 test cases)
│   │   │   ├── QuoteBuilder.tsx    # Main UI (form + live preview)
│   │   │   ├── QuoteComparisonTable.tsx  # PDF comparison table
│   │   │   └── __tests__/       #   Test suites
│   │   └── *.tsx                #   Other demo pages
│   └── package.json
│
├── components/                  # Shared PDF/print component library
│   ├── QuoteDocument.tsx        #   Customer-facing quote
│   ├── BomDocument.tsx          #   Bill of Materials
│   ├── EvalDocumentV2.tsx       #   Internal evaluation report
│   ├── DocumentHeader.tsx       #   Reusable header
│   ├── documents.css            #   Print styles
│   └── ...                      #   40+ components
│
Design_Sys/
└── Shared_Components/
    └── components/
        └── Design_Sys_style.css # Design tokens (colors, spacing, typography)
```

## Running Tests

```bash
cd Templates/demo
npx vitest run src/quote-builder/__tests__/
```

140 tests covering:
- Dimension analysis (0d through 3d, mixed overrides, edge cases)
- Email rendering (all comparison types, deduplication, fixed sections)
- Validation (field-level, cross-scenario collision detection, fingerprint matching)

## Quote Builder — How It Works

The Quote Builder helps Sales generate formatted email quotes and PDF proposals from structured pricing data.

### Input
Sales fills in parts and pricing options. Each option can vary by:
- **Quantity** — different order sizes
- **Location** — Taiwan vs U.S. manufacturing
- **Material** — override the part's default material
- **Finish** — override the part's default surface treatment
- **Lead Time** — different delivery timelines
- **Custom Label** — free text for any other comparison

### Auto-Detection
The system automatically detects which dimensions vary and selects the optimal output format:

| Varying dims | Email format | PDF format |
|-------------|-------------|------------|
| 0 (single price) | Simple line item | Inline price |
| 1 (e.g., qty only) | Bullet list with qty labels | Horizontal table |
| 2 (e.g., location × qty) | Bullet list with compound labels | Matrix table |
| 3 (e.g., location × material × qty) | Bullet list | Grouped matrix |

### Output
- **Email tab** — copyable plain text, ready to paste into email client
- **PDF tab** — print-ready document with comparison tables and annotations

## Development Notes

### Adding a New PDF Component
1. Create component in `Templates/components/`
2. Import design tokens: component files include `⚠️ REQUIRES: Design_Sys_style.css` reminder
3. Add to `Templates/components/index.ts` barrel export
4. Create a demo page in `Templates/demo/src/` and add route in `App.tsx`

### Design Tokens
All visual constants (colors, spacing, typography, border radius) are defined as CSS custom properties in `Design_Sys_style.css`. Components reference these via `var(--token-name)`. Never hardcode values.

### Print Styles
`documents.css` contains `@media print` rules and document-specific tokens. PDF components are designed at A4 dimensions and tested via browser print preview.

## Tech Stack

- **React 18** + **TypeScript 5**
- **Tailwind CSS 3** + Design System CSS custom properties
- **Vite 5** (dev server + build)
- **Vitest 4** (testing)
