#!/bin/bash
# Layer 0: Static Analysis — verify key elements exist in source files
# Fast (<1s), catches structural deletions and missing imports.

set -e
cd "$(dirname "$0")/.."

FAIL=0
check() {
  local file="$1" pattern="$2" desc="$3"
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo "  ✓ $desc"
  else
    echo "  ✗ $desc  (missing '$pattern' in $file)"
    FAIL=1
  fi
}

echo "Layer 0: Static Analysis"

# QuoteBuilder core imports and elements
check "src/quote-builder/QuoteBuilder.tsx" "QuoteComparisonTable" "QuoteComparisonTable used in QuoteBuilder"
check "src/quote-builder/QuoteBuilder.tsx" "handleDownloadPdf" "handleDownloadPdf exists"
check "src/quote-builder/QuoteBuilder.tsx" "PaginatedDocument" "PaginatedDocument used"
check "src/quote-builder/QuoteBuilder.tsx" "renderEmail" "renderEmail imported"
check "src/quote-builder/QuoteBuilder.tsx" "validateQuote" "validateQuote imported"
check "src/quote-builder/QuoteBuilder.tsx" "export default" "QuoteBuilder has default export"

# PaginatedDocument structure
check "src/quote-builder/PaginatedDocument.tsx" "DocumentHeader" "DocumentHeader in PaginatedDocument"
check "src/quote-builder/PaginatedDocument.tsx" "DocumentFooter" "DocumentFooter in PaginatedDocument"
check "src/quote-builder/PaginatedDocument.tsx" "computePageLayouts" "pagination logic used"

# Types integrity
check "src/quote-builder/types.ts" "QuoteBuilderData" "QuoteBuilderData interface exists"
check "src/quote-builder/types.ts" "Scenario" "Scenario interface exists"
check "src/quote-builder/types.ts" "createDefaultQuote" "createDefaultQuote helper exists"

# Dimension engine
check "src/quote-builder/dimensionEngine.ts" "analyzeDimensions" "analyzeDimensions exported"
check "src/quote-builder/dimensionEngine.ts" "findScenarios" "findScenarios exported"
check "src/quote-builder/dimensionEngine.ts" "NONE" "NONE sentinel exported"

# Pagination
check "src/quote-builder/pagination.ts" "computePageLayouts" "computePageLayouts exported"
check "src/quote-builder/pagination.ts" "AVAILABLE_H" "AVAILABLE_H constant"

# Router entry
check "src/main.tsx" "quote-builder" "quote-builder route in main"

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "✗ Layer 0 FAILED — structural elements missing"
  exit 1
fi

echo "✓ Layer 0 passed"
