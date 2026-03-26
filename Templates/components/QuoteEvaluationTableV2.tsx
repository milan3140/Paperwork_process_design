/**
 * QuoteEvaluationTableV2 — Part-first pricing comparison table
 *
 * Y-axis: Part → Factory (sorted by price low→high)
 * X-axis: Quantity scenarios
 * Sections: AI Benchmark → 我方報價 → 代料加工 (parts) → DHL/關稅 → 成本總覽 (parts, per-part unit+total) → 體積/重量
 *
 * Uses same QuoteEvalData interface as V1 — no schema change needed.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, tableStyles.ts, quoteEvalHelpers.tsx
 */

import {
  gridCols, indentStyle,
  TH_LEFT, TH_RIGHT, TD_LABEL, TD_VALUE,
  TEXT_CATEGORY, TEXT_VENDOR, TEXT_SUB, TEXT_MUTED, TEXT_DECLINED,
  TEXT_BOLD_VALUE, TEXT_DAYS,
} from './tableStyles';
import {
  type QuoteEvalData, type FactoryQuote, type PriceCell,
  fmtP, fmtT, PriceWithDays, SubtotalCell,
  isFactoryAllDeclined, parseQty,
} from './quoteEvalHelpers';

interface Props { data: QuoteEvalData }

/** Sort factory indices by first valid price for a given part label (low→high) */
function sortedFactoryIndices(
  factories: FactoryQuote[],
  partLabel: string,
): number[] {
  return factories
    .map((f, fi) => {
      const part = f.parts.find(p => p.label === partLabel);
      const firstPrice = part?.cells.find(c => c.price != null)?.price ?? Infinity;
      return { fi, price: firstPrice };
    })
    .sort((a, b) => a.price - b.price)
    .map(x => x.fi);
}

/** Compute per-part cost: part price + DHL share + customs share */
function computePartCost(
  cell: PriceCell,
  si: number,
  partCount: number,
  dhl?: QuoteEvalData['dhl'],
  customs?: QuoteEvalData['customs'],
) {
  if (cell.price == null) return { price: null as number | null, days: cell.days };
  let cost = cell.price;
  // Add DHL share
  if (dhl?.values?.[si] != null) cost += dhl.values[si]! / partCount;
  // Add customs share
  if (customs?.values?.[si] != null) cost += customs.values[si]! / partCount;
  return { price: cost, days: cell.days };
}

export function QuoteEvaluationTableV2({ data }: Props) {
  const { scenarios, aiBenchmarks, factories, dhl, customs, weights } = data;
  const n = scenarios.length;
  const cols = gridCols(n);

  // Derive unique part labels in order of first appearance
  const partLabels = [...new Set(factories.flatMap(f => f.parts.map(p => p.label)))];
  const partCount = partLabels.length;

  return (
    <div data-comp="QuoteEvaluationTableV2">
      <div className="mt-[var(--sp-2)]" style={{ display: 'grid', gridTemplateColumns: cols }}>

        {/* ── Header ── */}
        <div className={TH_LEFT}>p/days</div>
        {scenarios.map((s, i) => (
          <div key={i} className={TH_RIGHT}>{s.header}</div>
        ))}

        {/* ── AI Benchmark (per-part, same font as 我方報價) ── */}
        {(() => {
          // Support both legacy flat array and per-part array
          const isPerPart = aiBenchmarks.length > 0 && typeof aiBenchmarks[0] === 'object' && aiBenchmarks[0] !== null && 'label' in aiBenchmarks[0];
          const perPart = isPerPart
            ? (aiBenchmarks as { label: string; cells: (number | null)[] }[])
            : null;
          const flat = !isPerPart ? (aiBenchmarks as (number | null)[]) : null;

          if (flat && flat.some(v => v != null)) {
            return (
              <>
                <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>AI 報價</div>
                <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(1)}>合計</div>
                {flat.map((v, i) => (
                  <div key={i} className={`${TD_VALUE} ${TEXT_SUB}`}>{v != null ? fmtP(v) : '—'}</div>
                ))}
              </>
            );
          }

          if (perPart && perPart.some(p => p.cells.some(v => v != null))) {
            return (
              <>
                <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>AI 報價</div>
                {perPart.map((part, pi) => (
                  <div key={pi} className="contents">
                    <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(1)}>{part.label}</div>
                    {part.cells.map((v, ci) => (
                      <div key={ci} className={`${TD_VALUE} ${TEXT_SUB}`}>{v != null ? fmtP(v) : '—'}</div>
                    ))}
                  </div>
                ))}
              </>
            );
          }

          return null;
        })()}

        {/* ── Spacer ── */}
        <div className="col-span-full h-[var(--sp-2)]" />

        {/* ── 我方報價 ── */}
        <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>我方報價</div>

        {/* ── Separator below 我方報價 ── */}
        <div className="col-span-full border-b border-[var(--gray-200)]" />

        {/* ── 代料加工 ── */}
        <div className={`col-span-full ${TD_LABEL} ${TEXT_VENDOR}`} style={indentStyle(0)}>代料加工</div>

        {partLabels.map((label, li) => {
          const sorted = sortedFactoryIndices(factories, label);
          return (
            <div key={li} className="contents">
              {/* Part header */}
              <div className={`col-span-full ${TD_LABEL} ${TEXT_VENDOR}`} style={indentStyle(1)}>{label}</div>

              {/* Factory rows sorted by price */}
              {sorted.map(fi => {
                const factory = factories[fi];
                const part = factory.parts.find(p => p.label === label);
                if (!part) return null;

                if (part.cells.every(c => c.price == null && !c.text)) return null;

                return (
                  <div key={fi} className="contents">
                    <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(2)}>{factory.name}</div>
                    {part.cells.map((cell, ci) => (
                      <div key={ci} className={`${TD_VALUE} ${TEXT_SUB}`}><PriceWithDays cell={cell} /></div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ── Separator above DHL ── */}
        <div className="col-span-full border-b border-[var(--gray-200)] mt-[var(--sp-1)]" />

        {/* ── DHL ── */}
        {dhl?.values && (
          <>
            <div className={`${TD_LABEL} ${TEXT_CATEGORY} pb-0`} style={indentStyle(0)}>DHL</div>
            {dhl.values.map((v, i) => (
              <div key={i} className={`${TD_VALUE} ${TEXT_SUB} pb-0`}>{v != null ? fmtP(v) : '—'}</div>
            ))}
            {/* 體積/重量 below DHL (annotation style: tiny label, tight) */}
            {weights.values && (
              <>
                <div className={`${TD_LABEL} ${TEXT_MUTED} text-[length:var(--doc-text-param-label)] py-0 pb-[var(--sp-1)]`} style={indentStyle(0)}>體積/重量</div>
                {weights.values.map((w, i) => (
                  <div key={i} className={`${TD_VALUE} ${TEXT_MUTED} text-[length:var(--doc-text-secondary)] py-0 pb-[var(--sp-1)]`}>{w}</div>
                ))}
              </>
            )}
          </>
        )}
        {/* DHL materialValues — each material row followed by its 體積/重量 */}
        {dhl?.materialValues?.map((mv, mi) => {
          const wt = weights.materialValues?.find(w => w.material === mv.material);
          return (
            <div key={`dhl-m-${mi}`} className="contents">
              {mi === 0 && <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>DHL</div>}
              {/* DHL price row */}
              <div className={`${TD_LABEL} ${TEXT_SUB} pb-0`} style={indentStyle(1)}>{mv.material}</div>
              {mv.values.map((v, i) => (
                <div key={i} className={`${TD_VALUE} ${TEXT_SUB} pb-0`}>{v != null ? fmtP(v) : '—'}</div>
              ))}
              {/* 體積/重量 annotation row (tight below) */}
              {wt && (
                <>
                  <div className={`${TD_LABEL} ${TEXT_MUTED} text-[length:var(--doc-text-param-label)] py-0 pb-[var(--sp-1)]`} style={indentStyle(1)}>體積/重量</div>
                  {wt.values.map((w, j) => (
                    <div key={j} className={`${TD_VALUE} ${TEXT_MUTED} text-[length:var(--doc-text-secondary)] py-0 pb-[var(--sp-1)]`}>{w}</div>
                  ))}
                </>
              )}
            </div>
          );
        })}

        {/* ── Customs ── */}
        {customs?.values && (
          <>
            <div className={`${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>關稅</div>
            {customs.values.map((v, i) => (
              <div key={i} className={`${TD_VALUE} ${TEXT_SUB}`}>{v != null ? fmtP(v) : '—'}</div>
            ))}
          </>
        )}
        {customs?.materialValues?.map((mv, mi) => (
          <div key={`cus-m-${mi}`} className="contents">
            {mi === 0 && <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>關稅</div>}
            <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(1)}>{mv.material}</div>
            {mv.values.map((v, i) => (
              <div key={i} className={`${TD_VALUE} ${TEXT_SUB}`}>{v != null ? fmtP(v) : '—'}</div>
            ))}
          </div>
        ))}

        {/* ── Separator ── */}
        <div className="col-span-full border-b border-[var(--gray-200)] my-[var(--sp-2)]" />

        {/* ── 成本總覽 (part-first: 單件成本 + 總成本 per part per factory) ── */}
        <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>成本總覽</div>

        {partLabels.map((label, li) => {
          const sorted = sortedFactoryIndices(factories, label);
          return (
            <div key={li} className="contents">
              {/* Part header */}
              <div className={`col-span-full ${TD_LABEL} ${TEXT_VENDOR}`} style={indentStyle(1)}>{label}</div>

              {sorted.map(fi => {
                const factory = factories[fi];
                const part = factory.parts.find(p => p.label === label);
                if (!part) return null;
                if (isFactoryAllDeclined(factory)) return null;
                if (part.cells.every(c => c.price == null)) return null;

                return (
                  <div key={fi} className="contents">
                    {/* 單件成本 (bold) */}
                    <div className={`${TD_LABEL} ${TEXT_BOLD_VALUE}`} style={indentStyle(2)}>{factory.name}</div>
                    {part.cells.map((cell, ci) => {
                      const cost = computePartCost(cell, ci, partCount, dhl, customs);
                      return (
                        <div key={ci} className={`${TD_VALUE} ${TEXT_BOLD_VALUE}`}>
                          <SubtotalCell price={cost.price} days={cost.days} />
                        </div>
                      );
                    })}

                    {/* 總成本 (annotation: tiny label, tight to 單件成本) */}
                    <div className={`${TD_LABEL} ${TEXT_MUTED} text-[length:var(--doc-text-param-label)] py-0 pb-[var(--sp-1)]`} style={indentStyle(2)}>總成本</div>
                    {part.cells.map((cell, ci) => {
                      const cost = computePartCost(cell, ci, partCount, dhl, customs);
                      const qty = parseQty(scenarios[ci].header);
                      return (
                        <div key={ci} className={`${TD_VALUE} ${TEXT_MUTED} text-[length:var(--doc-text-secondary)] py-0 pb-[var(--sp-1)]`}>
                          {cost.price != null ? fmtT(cost.price * qty) : <span className={TEXT_MUTED}>—</span>}
                        </div>
                      );
                    })}

                    {/* Spacer between factories */}
                    <div className="col-span-full h-[var(--sp-2)]" />
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ── Double separator ── */}
        <div className="col-span-full my-[var(--sp-2)]" style={{ borderBottom: 'var(--doc-border-emphasis) solid var(--gray-300)' }} />
      </div>
    </div>
  );
}

export default QuoteEvaluationTableV2;
