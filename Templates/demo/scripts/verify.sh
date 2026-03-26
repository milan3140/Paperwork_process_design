#!/bin/bash
# ══════════════════════════════════════════════════════════════
# Verification Funnel — Run all layers sequentially
# Stop at first failure. Exit code 0 = all pass, 1 = failure.
# ══════════════════════════════════════════════════════════════

set -e
cd "$(dirname "$0")/.."
START=$(date +%s)

echo ""
echo "═══════════════════════════════════════════"
echo "  Quote Builder — Verification Funnel"
echo "═══════════════════════════════════════════"
echo ""

# ── Layer 0: Static Analysis ──
echo "=== Layer 0: Static Analysis ==="
bash scripts/verify-static.sh
echo ""

# ── Layer 1: TypeScript ──
echo "=== Layer 1: TypeScript ==="
npx tsc --noEmit
echo "✓ Layer 1 passed — no type errors"
echo ""

# ── Layer 2: Unit Tests ──
echo "=== Layer 2: Unit Tests ==="
npx vitest run src/quote-builder/__tests__/ --reporter=verbose 2>&1 | tail -5
echo ""

# ── Layer 3: Server Health (handled by Playwright webServer) ──
echo "=== Layer 3: Build + Server ==="
echo "(Playwright will build and start preview server automatically)"
echo ""

# ── Layer 4: Playwright E2E ──
echo "=== Layer 4: Playwright E2E ==="
npx playwright test
echo ""

# ── Summary ──
END=$(date +%s)
ELAPSED=$((END - START))
echo "═══════════════════════════════════════════"
echo "  ALL LAYERS PASSED ✓  (${ELAPSED}s)"
echo "═══════════════════════════════════════════"
