# Contributing

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Stable, tested code. All tests must pass before merge. |
| `feature/*` | New features (e.g., `feature/pdf-comparison-table`) |
| `fix/*` | Bug fixes (e.g., `fix/dimension-collision-detection`) |

## Workflow

1. Create a feature branch from `master`
2. Make changes, ensure tests pass: `npx vitest run src/quote-builder/__tests__/`
3. Commit with descriptive messages (see format below)
4. Push and open a PR

## Commit Message Format

```
<type>: <short description>

<optional body — what and why>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`

Examples:
```
feat: add surface treatment comparison to PDF table
fix: dimension engine now detects leadTime as distinguishing factor
test: add fingerprint collision edge cases
docs: update README with Quote Builder usage
```

## Testing

Before any PR:

```bash
cd Templates/demo
npx vitest run src/quote-builder/__tests__/   # Must: 0 failures
npx tsc --noEmit                               # Must: 0 errors
```

When adding new features to Quote Builder:
- Add test cases in the corresponding `__tests__/*.test.ts` file
- Cover both happy path and edge cases (empty values, mixed overrides, boundary conditions)
- Use the existing `mkScenario()` / `mkQuote()` / `mkPart()` helpers

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React component | PascalCase | `QuoteComparisonTable.tsx` |
| Utility module | camelCase | `dimensionEngine.ts` |
| Test file | `<module>.test.ts` | `dimensionEngine.test.ts` |
| CSS | kebab-case or specific name | `documents.css`, `Design_Sys_style.css` |
| Type definitions | camelCase | `types.ts` |

## Code Style

- TypeScript strict mode
- Functional components with hooks
- CSS custom properties from `Design_Sys_style.css` — no hardcoded colors/spacing
- Export types from `types.ts`, not inline
