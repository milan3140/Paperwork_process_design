# Debug Methodology — Full Reference

Condensed version in CLAUDE.md. This file contains the complete methodology with examples.

## Root Cause Analysis — 6 Steps

### Step 1: REPRODUCE

Before touching any code:
1. Can I reproduce it? Under what exact conditions?
2. What is the EXPECTED behavior vs ACTUAL behavior? (be specific: numbers, positions, text)
3. Does it happen ALWAYS or INTERMITTENTLY?

If you can't reproduce it, you can't verify a fix. Stop and gather more information.

### Step 2: ISOLATE — Change ONE variable at a time

Find the BOUNDARY between "works" and "doesn't work":

| Variable to toggle | What it reveals |
|-------------------|----------------|
| **Which environment?** Preview vs Print vs Email | Same code can render differently in different output contexts |
| **Which input?** Minimal data vs complex data | Bug might only appear with specific data patterns |
| **Which interaction?** Fresh load vs after user action | State management vs initial render issue |
| **Which component?** Comment out sections one by one | Which component's presence/absence changes the behavior |
| **Which version?** Current vs last known working commit | `git diff` between working and broken reveals the breaking change |
| **Which browser?** Chrome vs Firefox vs Safari | CSS interpretation differences |

**Binary search**: If you changed 5 files, revert 3. Bug gone? → Problem is in those 3. Bug remains? → In the other 2. Repeat.

### Step 3: TRACE — Follow the data flow

```
Input (user types / data source)
  → State (React state, props)
    → Computation (dimension engine, pagination math, validation)
      → Render (JSX output, CSS applied)
        → Output (screen DOM, print window, email text)
```

At each stage: "Is the value correct HERE?" The first wrong stage = where the bug lives.

### Step 4: IDENTIFY THE LAYER

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

| Symptom (manifests) | Root cause (lives) | Wrong fix | Right fix |
|---|---|---|---|
| Footer floating in print (L5) | handleDownloadPdf missing CSS (L4) | Component CSS (L3) | Print CSS in handleDownloadPdf (L4) |
| FlexSpacer not shrinking (L3) | Pagination not accounting for spacers (L2) | CSS flex-shrink (L3) | Rewrite pagination.ts (L2) |
| Duplicate "U.S." columns (L3) | HorizontalLayout iterating scenarios not unique values (L3 logic) | Dedup in render | Fix to use getUniqueValues |
| Wrong material value (L3) | NONE sentinel inconsistency (L2) | Override in render | Unify NONE sentinel (L2) |

### Step 5: VERIFY

1. **Necessity**: Revert ONLY this fix → bug returns? (If no → fix is irrelevant)
2. **Sufficiency**: Apply ONLY this fix → bug gone? (If no → something else also needs fixing)
3. **No side effects**: Run full test suite.

### Step 6: CROSS-CONTEXT verification

| Context | CSS source | Renderer |
|---------|-----------|---------|
| Screen preview | `documents.css` + component styles + Tailwind | React DOM |
| Print (Download PDF) | Styles injected by `handleDownloadPdf()` | New browser window |
| Email | Plain text from `emailRenderer.ts` | No CSS |

---

## Anti-Patterns

| Anti-pattern | Why it fails | Do this instead |
|---|---|---|
| **Shotgun debugging**: change 5 things at once | Can't tell which helped | Change ONE thing, verify, repeat |
| **Symptom patching**: `!important` / hardcode | Hides root cause | Find WHY the rule doesn't apply |
| **Same-layer fixation**: keep trying CSS when bug is in JS | Wrong tool | Trace the data flow |
| **Untested fixes**: "should work" | Confirmation bias | Run verification funnel |
| **Infinite loop**: fix → break → fix | Not finding root cause | After 2 attempts, STOP and report |

---

## Verification Funnel

```
Layer 0: grep key elements exist         <1s
Layer 1: npx tsc --noEmit                ~2s
Layer 2: npx vitest run                  ~0.5s
Layer 3: curl localhost:5173             <1s
Layer 4: npx playwright test             ~5-10s
Layer 5: MCP screenshot (if needed)      ~10s
```

Stop at first failure. Fix root cause. Re-run from Layer 0. Max 2 attempts.

---

## Key Design Decisions

- **PDF spacing**: JS-calculated in `pagination.ts`, not CSS flex. Arithmetic: `(available - content - tight_gaps) / adaptive_count`, clamped [12px, 48px].
- **Same-group sections** (pricing parts): Fixed 12px tight gap, never adaptive.
- **Print footer**: Handled by injected CSS in `handleDownloadPdf`, separate from preview.
- **Dimension engine**: Auto-detects varying dimensions → selects layout (single/horizontal/matrix/grouped_matrix/flat_list).
- **Comparison annotations**: Always "vs {reference}" — never omit the comparison target.
- **Collision detection**: Uses ALL fields (qty/location/material/finish/leadTime/label) for fingerprint, not just `analysis.varying`.
