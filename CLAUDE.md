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

## CRITICAL: Bug Fix Methodology — Universal Root Cause Analysis

When a test fails or a bug is reported, **DO NOT immediately fix the most obvious element.** Apply the scientific method: hypothesize → isolate → verify → fix.

### Step 1: REPRODUCE — Confirm and define the bug precisely

Before touching any code:
1. Can I reproduce it? Under what exact conditions?
2. What is the EXPECTED behavior vs ACTUAL behavior? (be specific: numbers, positions, text)
3. Does it happen ALWAYS or INTERMITTENTLY?

If you can't reproduce it, you can't verify a fix. Stop and gather more information.

### Step 2: ISOLATE — Narrow down by changing ONE variable at a time

The goal is to find the BOUNDARY between "works" and "doesn't work." Toggle each variable independently:

| Variable to toggle | What it reveals |
|-------------------|----------------|
| **Which environment?** Preview vs Print vs Email | Same code can render differently in different output contexts |
| **Which input?** Minimal data vs complex data | Bug might only appear with specific data patterns |
| **Which interaction?** Fresh load vs after user action | State management vs initial render issue |
| **Which component?** Comment out sections one by one | Which component's presence/absence changes the behavior |
| **Which version?** Current vs last known working commit | `git diff` between working and broken reveals the breaking change |
| **Which browser?** Chrome vs Firefox vs Safari | CSS interpretation differences |

**The most powerful isolation technique: binary search.**
If you changed 5 files, revert 3 of them. Bug gone? → Problem is in one of those 3. Bug remains? → Problem is in the other 2. Repeat until you find the single change that causes it.

### Step 3: TRACE — Follow the data flow to find where it diverges

Every bug is a point where actual behavior diverges from expected. Trace the data:

```
Input (user types / data source)
  → State (React state, props)
    → Computation (dimension engine, pagination math, validation)
      → Render (JSX output, CSS applied)
        → Output (screen DOM, print window, email text)
```

At each stage, ask: "Is the value correct HERE?" Find the first stage where it's wrong — that's where the bug lives.

Concrete techniques:
- `console.log` at each stage to see values
- Read the test output: which assertion failed? What were expected vs actual values?
- Use `page.evaluate()` in Playwright to inspect DOM state at runtime

### Step 4: IDENTIFY THE LAYER — Fix at the cause, not the symptom

```
Layer 1: Data Model (types.ts, interfaces)
  ↓
Layer 2: Business Logic (dimensionEngine, emailRenderer, validation, pagination)
  ↓
Layer 3: React Components (QuoteBuilder, QuoteComparisonTable, PaginatedDocument)
  ↓
Layer 4: Output Adapters (handleDownloadPdf, renderEmail, print CSS injection)
  ↓
Layer 5: External Systems (browser print engine, clipboard API, file system)
```

**The layer where the bug MANIFESTS is often NOT the layer where the bug LIVES.**

Examples from this project:

| Symptom (where it manifests) | Root cause (where it lives) | Wrong fix | Right fix |
|---|---|---|---|
| Footer floating in print dialog (Layer 5) | `handleDownloadPdf` missing CSS (Layer 4) | Change component flex/grid CSS (Layer 3) | Add print CSS in handleDownloadPdf (Layer 4) |
| FlexSpacer not shrinking (Layer 3 visual) | Pagination engine not accounting for spacers in bin-packing (Layer 2) | Change CSS flex-shrink values (Layer 3) | Rewrite pagination.ts computation (Layer 2) |
| Two identical "U.S." columns (Layer 3 visual) | HorizontalLayout iterating scenarios not unique values (Layer 3 logic) | Add dedup in render (Layer 3 render) | Fix column generation to use getUniqueValues (Layer 3 logic) |
| Material showing wrong value (Layer 3 visual) | NONE sentinel inconsistency between getUniqueValues and findScenarios (Layer 2) | Override display value in render | Unify NONE sentinel across all functions (Layer 2) |

### Step 5: VERIFY the fix is a root cause fix

Three checks:
1. **Necessity**: If I revert ONLY this fix, does the bug come back? (If no → this fix is irrelevant)
2. **Sufficiency**: If I apply ONLY this fix to the broken state, does the bug disappear? (If no → something else also needs fixing)
3. **No side effects**: Did this fix break anything else? (Run full test suite)

### Step 6: CROSS-CONTEXT verification

This project has multiple output contexts. A fix in one may not apply to another:

| Context | CSS source | Renderer |
|---------|-----------|---------|
| Screen preview | `documents.css` + component styles + Tailwind | React DOM |
| Print (Download PDF) | Styles injected by `handleDownloadPdf()` | New browser window |
| Email | Plain text from `emailRenderer.ts` | No CSS |

Always verify in ALL relevant contexts after a fix.

### Anti-Patterns to Avoid

| Anti-pattern | Why it fails | What to do instead |
|---|---|---|
| **Shotgun debugging**: change 5 things at once | Can't tell which change fixed it (or made it worse) | Change ONE thing, verify, repeat |
| **Symptom patching**: add `!important` or hardcode a value | Hides the real issue, breaks later | Find why the original rule doesn't apply |
| **Same-layer fixation**: keep trying CSS when the bug is in JS | "If all you have is a hammer..." | Step back, trace the data flow |
| **Untested fixes**: "this should work" without verifying | Confirmation bias | Run the verification funnel every time |
| **Infinite loop**: fix → break → fix → break | Not finding root cause, just shuffling the bug | After 2 attempts, STOP and report to user |

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

---

## Known Pitfalls — Project-Specific Bug Patterns

Documented from real debugging sessions. Check these FIRST when encountering similar symptoms.

### Pitfall 1: Preview correct but print wrong (or vice versa)

**Symptom**: Something looks right in the browser preview but wrong in Download PDF print dialog (or the opposite).

**Root cause**: Screen preview and print use DIFFERENT CSS paths.
- Screen: `documents.css` loaded by Vite + component inline styles + Tailwind
- Print: `handleDownloadPdf()` opens a new `window`, copies HTML, injects its own `<style>` block

**Fix location**: `handleDownloadPdf()` in `QuoteBuilder.tsx` — the injected print CSS.

**History**: Footer was floating in print but correct in preview. 6 attempts to fix via component CSS (flex, grid, height) all failed. Root cause: the print window's injected CSS lacked `display: flex; flex-direction: column` and `height: 279.4mm` on `.doc-page`.

### Pitfall 2: CSS flex grow/shrink not working in nested containers

**Symptom**: FlexSpacer elements stuck at max-height regardless of content amount.

**Root cause**: CSS `flex-shrink` on children requires the parent to have a **definite height constraint**. In nested flex columns, `flex: 1` on a parent doesn't always propagate a definite height to children. Browsers may let children overflow instead of compress.

**Fix**: Don't rely on CSS flex for adaptive spacing. Use JS calculation instead (`pagination.ts`). Measure section heights → compute available space → divide among gaps → set as fixed `height` values.

**History**: Tried `flex: 1 1 24px`, `height: 0 + flex: 1 1 auto`, `overflow: hidden` — none reliably triggered flex-shrink in nested flex column context. Rewrote to pure arithmetic in `pagination.ts`.

### Pitfall 3: NONE sentinel inconsistency

**Symptom**: Some scenarios not found in comparison table (empty cells where there should be data).

**Root cause**: `getUniqueValues()` and `findScenarios()` used different fallback values for empty fields. One used `'—'` (NONE constant), the other used `''` (empty string). Keys didn't match → scenarios couldn't be found.

**Fix**: All functions must use the same `NONE` sentinel from `dimensionEngine.ts` for empty/missing values.

### Pitfall 4: useLayoutEffect infinite render loop

**Symptom**: Page goes completely white when switching to PDF tab. Browser freezes.

**Root cause**: `useLayoutEffect` without deps + unconditional `setState` inside = infinite re-render. Effect runs → sets state → triggers re-render → effect runs → sets state → ...

**Fix**: Compare new value with previous state. Only call `setState` if actually different:
```ts
setState(prev => {
  const same = /* deep comparison */;
  return same ? prev : newValue;  // returning prev = no re-render
});
```

### Pitfall 5: Dimension detection with mixed override/no-override scenarios

**Symptom**: Adding a 4th option with a new dimension value causes existing options to disappear from the comparison table.

**Root cause**: When some scenarios have `materialOverride` and some don't, the dimension engine must compute the **effective** value (override || part default || NONE) for comparison. If it only looks at override values and filters out undefined, it misses scenarios using the Part default.

**Fix**: Always compute effective values: `s.materialOverride || partMaterial || NONE`. Never `filter(Boolean)` on override values alone.

### Pitfall 6: Collision detection too broad or too narrow

**Symptom**: False warnings ("same dimensions but different price") when scenarios actually differ by lead time.

**Root cause**: Collision fingerprint only included `analysis.varying` dimensions (designed for PDF layout), which suppresses leadTime when location/qty also varies. Two scenarios with same location but different lead times got the same fingerprint.

**Fix**: Collision fingerprint must include ALL distinguishing fields (qty, location, material, finish, leadTime, customLabel) regardless of what `analysis.varying` says. `analysis.varying` is for layout, not for collision detection.

### Pitfall 7: Initial state renders nothing

**Symptom**: Component shows blank on first mount, then content appears after a flicker (or stays blank).

**Root cause**: State initialized as empty array `[]`, component conditionally renders based on state, useEffect populates state after first render. First render = nothing visible.

**Fix**: Initialize state with a sensible default that renders immediately, then refine after measurement. E.g., `useState<PageLayout[]>([{ indices: sections.map((_, i) => i), spacerHeights: sections.slice(1).map(() => gap) }])` instead of `useState<PageLayout[]>([])`.
