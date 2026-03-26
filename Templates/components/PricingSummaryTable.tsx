/**
 * PricingSummaryTable — Per-part cost breakdown for Section 2 "此單統整"
 *
 * For each part, picks the cheapest factory and shows:
 *   單件成本/交期 (bold), 總成本 (annotation), 代料加工, DHL, 關稅
 *
 * Grid: gridCols(max(n,2)) — shared with TechFeasibility for alignment.
 * All values LEFT-aligned (TD_LABEL) for visual consistency with tech table.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, tableStyles.ts, quoteEvalHelpers.tsx
 */

import {
  gridCols, indentStyle,
  TH_LEFT, TD_LABEL,
  TEXT_CATEGORY, TEXT_VENDOR, TEXT_SUB, TEXT_MUTED,
  TEXT_BOLD_VALUE, TEXT_DAYS,
} from './tableStyles';
import {
  type QuoteEvalData,
  fmtP, fmtT, parseQty,
} from './quoteEvalHelpers';

interface Props { data: QuoteEvalData }

/** Find the cheapest factory index for a given part label (by first valid price) */
function cheapestFactoryForPart(data: QuoteEvalData, partLabel: string): number {
  let bestFi = 0, bestPrice = Infinity;
  for (let fi = 0; fi < data.factories.length; fi++) {
    const part = data.factories[fi].parts.find(p => p.label === partLabel);
    if (!part) continue;
    const firstValid = part.cells.find(c => c.price != null);
    if (firstValid && firstValid.price! < bestPrice) {
      bestPrice = firstValid.price!;
      bestFi = fi;
    }
  }
  return bestFi;
}

/** Shared grid cols for Summary section — ensures pricing + tech tables align */
export function summaryGridCols(scenarioCount: number) {
  return gridCols(Math.max(scenarioCount, 2));
}

export function PricingSummaryTable({ data }: Props) {
  const { scenarios, factories, dhl, customs } = data;
  const n = scenarios.length;
  const cols = summaryGridCols(n);
  const extraCols = Math.max(Math.max(n, 2) - n, 0);

  // Derive unique part labels
  const partLabels = [...new Set(factories.flatMap(f => f.parts.map(p => p.label)))];
  const partCount = partLabels.length;

  return (
    <div data-comp="PricingSummaryTable">
      <div className="mb-[var(--sp-1)]">
        <span className={`text-[length:var(--doc-text-body)] ${TEXT_CATEGORY}`}>報價統整</span>
        {data.nextUpdateDate && (
          <>
            <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]"> · </span>
            <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--color-warning)] font-medium">
              預計更新: {data.nextUpdateDate}
            </span>
          </>
        )}
      </div>

      <div className="mt-[var(--sp-1)]" style={{ display: 'grid', gridTemplateColumns: cols }}>
        {/* Header */}
        <div className={TH_LEFT} />
        {scenarios.map((s, i) => (
          <div key={i} className={TH_LEFT}>{s.header}</div>
        ))}
        {Array.from({ length: extraCols }).map((_, i) => <div key={`eh-${i}`} />)}

        {partLabels.map((label, li) => {
          const bestFi = cheapestFactoryForPart(data, label);
          const factory = factories[bestFi];
          const part = factory.parts.find(p => p.label === label);
          if (!part) return null;

          const getDhlShare = (si: number) => {
            if (dhl?.values?.[si] != null) return dhl.values[si]! / partCount;
            return 0;
          };
          const getTaxShare = (si: number) => {
            if (customs?.values?.[si] != null) return customs.values[si]! / partCount;
            return 0;
          };

          return (
            <div key={li} className="contents">
              {/* Part header */}
              <div className={`col-span-full ${TD_LABEL} ${TEXT_VENDOR} pt-[var(--sp-2)]`} style={indentStyle(0)}>
                {label}({factory.name})
              </div>

              {/* 單件成本/交期 */}
              <div className={`${TD_LABEL} ${TEXT_SUB} pb-0`} style={indentStyle(1)}>單件成本/交期</div>
              {part.cells.map((cell, ci) => {
                if (cell.price == null) return <div key={ci} className={`${TD_LABEL} ${TEXT_MUTED} pb-0`}>—</div>;
                const total = cell.price + getDhlShare(ci) + getTaxShare(ci);
                return (
                  <div key={ci} className={`${TD_LABEL} ${TEXT_BOLD_VALUE} pb-0`}>
                    {fmtP(total)}{cell.days != null && <span className={TEXT_DAYS}>/{cell.days}d</span>}
                  </div>
                );
              })}
              {Array.from({ length: extraCols }).map((_, i) => <div key={`e1-${i}`} className="pb-0" />)}

              {/* 總成本 */}
              <div className={`${TD_LABEL} ${TEXT_MUTED} text-[length:var(--doc-text-param-label)] pt-0`} style={indentStyle(1)}>總成本</div>
              {part.cells.map((cell, ci) => {
                if (cell.price == null) return <div key={ci} className={`${TD_LABEL} ${TEXT_MUTED} pt-0`}>—</div>;
                const total = cell.price + getDhlShare(ci) + getTaxShare(ci);
                const qty = parseQty(scenarios[ci].header);
                return (
                  <div key={ci} className={`${TD_LABEL} ${TEXT_MUTED} text-[length:var(--doc-text-secondary)] pt-0`}>
                    {fmtT(total * qty)}
                  </div>
                );
              })}
              {Array.from({ length: extraCols }).map((_, i) => <div key={`e2-${i}`} className="pt-0" />)}

              {/* 代料加工 */}
              <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(1)}>代料加工</div>
              {part.cells.map((cell, ci) => {
                if (cell.price == null) return <div key={ci} className={`${TD_LABEL} ${TEXT_MUTED}`}>—</div>;
                return (
                  <div key={ci} className={`${TD_LABEL} ${TEXT_SUB}`}>{fmtP(cell.price)}</div>
                );
              })}
              {Array.from({ length: extraCols }).map((_, i) => <div key={`e3-${i}`} />)}

              {/* DHL */}
              <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(1)}>DHL</div>
              {scenarios.map((_, ci) => (
                <div key={ci} className={`${TD_LABEL} ${TEXT_SUB}`}>
                  {getDhlShare(ci) > 0 ? fmtP(getDhlShare(ci)) : '—'}
                </div>
              ))}
              {Array.from({ length: extraCols }).map((_, i) => <div key={`e4-${i}`} />)}

              {/* 關稅 */}
              <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(1)}>關稅</div>
              {scenarios.map((_, ci) => (
                <div key={ci} className={`${TD_LABEL} ${TEXT_SUB}`}>
                  {getTaxShare(ci) > 0 ? fmtP(getTaxShare(ci)) : '—'}
                </div>
              ))}
              {Array.from({ length: extraCols }).map((_, i) => <div key={`e5-${i}`} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PricingSummaryTable;
