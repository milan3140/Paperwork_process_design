# Known Pitfalls — Project-Specific Bug Patterns

Documented from real debugging sessions. Check these FIRST when encountering similar symptoms.

## Pitfall 1: Preview correct but print wrong (or vice versa)

**Symptom**: Something looks right in the browser preview but wrong in Download PDF print dialog (or the opposite).

**Root cause**: Screen preview and print use DIFFERENT CSS paths.
- Screen: `documents.css` loaded by Vite + component inline styles + Tailwind
- Print: `handleDownloadPdf()` opens a new `window`, copies HTML, injects its own `<style>` block

**Fix location**: `handleDownloadPdf()` in `QuoteBuilder.tsx` — the injected print CSS.

**History**: Footer was floating in print but correct in preview. 6 attempts to fix via component CSS (flex, grid, height) all failed. Root cause: the print window's injected CSS lacked `display: flex; flex-direction: column` and `height: 279.4mm` on `.doc-page`.

## Pitfall 2: CSS flex grow/shrink not working in nested containers

**Symptom**: FlexSpacer elements stuck at max-height regardless of content amount.

**Root cause**: CSS `flex-shrink` on children requires the parent to have a **definite height constraint**. In nested flex columns, `flex: 1` on a parent doesn't always propagate a definite height to children. Browsers may let children overflow instead of compress.

**Fix**: Don't rely on CSS flex for adaptive spacing. Use JS calculation instead (`pagination.ts`). Measure section heights → compute available space → divide among gaps → set as fixed `height` values.

**History**: Tried `flex: 1 1 24px`, `height: 0 + flex: 1 1 auto`, `overflow: hidden` — none reliably triggered flex-shrink in nested flex column context. Rewrote to pure arithmetic in `pagination.ts`.

## Pitfall 3: NONE sentinel inconsistency

**Symptom**: Some scenarios not found in comparison table (empty cells where there should be data).

**Root cause**: `getUniqueValues()` and `findScenarios()` used different fallback values for empty fields. One used `'—'` (NONE constant), the other used `''` (empty string). Keys didn't match → scenarios couldn't be found.

**Fix**: All functions must use the same `NONE` sentinel from `dimensionEngine.ts` for empty/missing values.

## Pitfall 4: useLayoutEffect infinite render loop

**Symptom**: Page goes completely white when switching to PDF tab. Browser freezes.

**Root cause**: `useLayoutEffect` without deps + unconditional `setState` inside = infinite re-render. Effect runs → sets state → triggers re-render → effect runs → sets state → ...

**Fix**: Compare new value with previous state. Only call `setState` if actually different:
```ts
setState(prev => {
  const same = /* deep comparison */;
  return same ? prev : newValue;  // returning prev = no re-render
});
```

## Pitfall 5: Dimension detection with mixed override/no-override scenarios

**Symptom**: Adding a 4th option with a new dimension value causes existing options to disappear from the comparison table.

**Root cause**: When some scenarios have `materialOverride` and some don't, the dimension engine must compute the **effective** value (override || part default || NONE) for comparison. If it only looks at override values and filters out undefined, it misses scenarios using the Part default.

**Fix**: Always compute effective values: `s.materialOverride || partMaterial || NONE`. Never `filter(Boolean)` on override values alone.

## Pitfall 6: Collision detection too broad or too narrow

**Symptom**: False warnings ("same dimensions but different price") when scenarios actually differ by lead time.

**Root cause**: Collision fingerprint only included `analysis.varying` dimensions (designed for PDF layout), which suppresses leadTime when location/qty also varies. Two scenarios with same location but different lead times got the same fingerprint.

**Fix**: Collision fingerprint must include ALL distinguishing fields (qty, location, material, finish, leadTime, customLabel) regardless of what `analysis.varying` says. `analysis.varying` is for layout, not for collision detection.

## Pitfall 7: Initial state renders nothing

**Symptom**: Component shows blank on first mount, then content appears after a flicker (or stays blank).

**Root cause**: State initialized as empty array `[]`, component conditionally renders based on state, useEffect populates state after first render. First render = nothing visible.

**Fix**: Initialize state with a sensible default that renders immediately, then refine after measurement.
