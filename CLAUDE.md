# Project: Paperwork Process Design

Instavoxel's document generation and quoting system.

## Tech Stack

- React 18 + TypeScript 5 + Tailwind CSS 3
- Vite 5 (dev server + build)
- Vitest 4 (unit/integration tests, 155+ tests)
- Playwright (E2E visual verification)

## Key Directories

- `Templates/demo/src/quote-builder/` — Quote Builder (active development)
- `Templates/demo/src/quote-builder-v0/` — Quote Builder v0 (frozen snapshot)
- `Templates/components/` — Shared PDF/print component library
- `Templates/demo/src/` — Demo app with all routes

## Running

```bash
cd Templates/demo
npm run dev           # Dev server at localhost:5173
npm run build         # Production build
npm run preview       # Preview production build at localhost:4173
```

## Testing

```bash
cd Templates/demo
npx vitest run src/quote-builder/__tests__/    # Unit tests (155+)
npx playwright test                             # E2E verification
```

## Git

- `.gitignore` uses WHITELIST mode — only `Templates/` is tracked
- Safe to `git add .` — everything else is auto-ignored
- Always `npx vitest run` + `npx tsc --noEmit` before committing

---

## CRITICAL: Bug Fix Methodology — Root Cause Analysis Before Fix

When a test fails or a bug is reported, DO NOT immediately fix the most obvious element. Follow this protocol:

### Step 1: Isolate WHERE the bug occurs

Ask these questions BEFORE writing any code:

| Question | Why it matters |
|----------|---------------|
| Does the bug appear in preview AND print? Or only one? | If only print → problem is in `handleDownloadPdf` CSS injection, NOT in components |
| Does the bug appear with 1 part AND multiple parts? | If only multiple → problem is in pagination logic, NOT in component styling |
| Does the bug appear on first render AND after interaction? | If only after interaction → problem is in state update/event handler |
| Is the bug in the content or in the spacing? | Content → component logic. Spacing → pagination.ts or PaginatedDocument |
| Does the unit test pass but E2E fails? | Logic is correct but rendering is wrong → CSS/layout issue |

### Step 2: Identify the architectural layer

This project has distinct layers. Bugs at different layers require fixes at different layers:

```
Layer 1: Data Model (types.ts)
  ↓ feeds into
Layer 2: Business Logic (dimensionEngine.ts, emailRenderer.ts, validation.ts, pagination.ts)
  ↓ feeds into
Layer 3: Component Rendering (QuoteBuilder.tsx, QuoteComparisonTable.tsx, PaginatedDocument.tsx)
  ↓ feeds into
Layer 4: PDF Output (handleDownloadPdf — separate CSS injection for print)
  ↓ feeds into
Layer 5: Browser Print Engine (browser's @page rules, print CSS)
```

**A bug that manifests at Layer 4 (print) should NOT be fixed at Layer 3 (components).**

Example from this project: Footer was floating in print preview but correct in screen preview.
- Wrong approach (6 failed attempts): Changed component CSS (flex, grid, height) at Layer 3
- Correct approach: Added print-specific CSS in `handleDownloadPdf` at Layer 4

### Step 3: Verify the fix addresses the root cause

After fixing, ask: "If I revert this fix, does the bug come back? If I apply ONLY this fix to a clean state, does the bug go away?"

If the answer to either is "no," you haven't found the root cause.

### Step 4: Cross-environment verification

Always check changes in BOTH environments:
- Screen preview (localhost in browser)
- Print preview (Download PDF → print dialog)

They use DIFFERENT CSS paths:
- Screen: `documents.css` + component inline styles
- Print: `handleDownloadPdf()` injects styles into a new window

A fix in one may not apply to the other.

---

## Verification Funnel (run after every code change)

```
Layer 0: grep key elements exist         <1s
Layer 1: npx tsc --noEmit                ~2s
Layer 2: npx vitest run                  ~0.5s
Layer 3: curl localhost:5173             <1s
Layer 4: npx playwright test             ~5-10s
Layer 5: MCP screenshot (if needed)      ~10s
```

Stop at the first failure. Fix the root cause. Re-run from Layer 0.

**Max 2 fix attempts per issue.** If still failing after 2 attempts, report to user with:
- What was tried
- What the test output says
- Which architectural layer the bug likely lives in
- Proposed next approaches (for user to choose)

---

## Key Design Decisions (for context)

- **PDF spacing**: JS-calculated in `pagination.ts`, not CSS flex. Spacer heights are arithmetic: `(available - content - tight_gaps) / adaptive_gap_count`, clamped to [12px, 48px].
- **Same-group sections** (pricing parts): Always 12px tight gap, never adaptive.
- **Print footer positioning**: Handled by injected CSS in `handleDownloadPdf`, separate from preview styling.
- **Dimension engine**: Detects which dimensions vary across scenarios, selects optimal comparison layout (single/horizontal/matrix/grouped_matrix/flat_list).
- **Comparison annotations**: Always include "vs {reference}" — never omit what's being compared to.
