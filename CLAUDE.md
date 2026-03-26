# Paperwork Process Design — Instavoxel

React 18 + TypeScript 5 + Tailwind 3 + Vite 5. Quote Builder with PDF/Email generation.

## Commands
```
cd Templates/demo
npm run dev                                      # localhost:5173
npx vitest run src/quote-builder/__tests__/      # 155+ tests
npx tsc --noEmit                                 # type check
```

## Structure
- `Templates/demo/src/quote-builder/` — active development (v1)
- `Templates/demo/src/quote-builder-v0/` — frozen snapshot
- `Templates/components/` — shared PDF/print components
- `.gitignore` whitelist mode — `git add .` is safe

## Bug Fix Rule

**DO NOT only fix the obvious element straight. Find the root cause first.**

1. **Reproduce** — exact conditions, expected vs actual
2. **Isolate** — toggle one variable at a time (environment? input? interaction? component?)
3. **Trace** — follow data: Input → State → Computation → Render → Output. Find where it diverges.
4. **Layer check** — symptom layer ≠ cause layer (types → logic → components → output adapters → browser)
5. **Verify** — revert fix = bug returns? Apply only fix = bug gone?
6. **Max 2 attempts** — then report analysis to user

## References (read when needed, not every prompt)
- `Templates/Quote_Build_Auotomate/Debug_Methodology.md` — full 6-step root cause analysis, anti-patterns, layer examples, design decisions
- `Templates/Quote_Build_Auotomate/Known_Pitfalls.md` — 7 documented bug patterns with symptoms/causes/fixes
- `Templates/Quote_Build_Auotomate/UI_Testing_Strategy.md` — testing approach comparison (Playwright, MCP, etc.)
