/**
 * QuoteEvaluationTable — Unified pricing comparison table (factory-first)
 *
 * Y-axis: Factory → Part(Material), unified "含工帶料" pricing
 * X-axis: Quantity scenarios
 * Cell format: $price/days
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx, tableStyles.ts
 */

import {
  gridCols, indentStyle,
  TH_LEFT, TH_RIGHT, TD_LABEL, TD_VALUE,
  TEXT_CATEGORY, TEXT_VENDOR, TEXT_SUB, TEXT_MUTED, TEXT_DECLINED,
  TEXT_BOLD_VALUE, TEXT_DAYS,
} from './tableStyles';
import {
  type QuoteEvalData, type PriceCell, type FactoryQuote, type DhlCustomsRow,
  fmtP, fmtT, PriceWithDays, SubtotalCell, computeFactorySubtotal, isFactoryAllDeclined, parseQty,
} from './quoteEvalHelpers';

// Re-export types for backward compatibility
export type { PriceCell, FactoryQuote, DhlCustomsRow, QuoteEvalData };

interface Props { data: QuoteEvalData }

export function QuoteEvaluationTable({ data }: Props) {
  const { scenarios, aiBenchmarks, factories, dhl, customs, marginPercent, weights } = data;
  const n = scenarios.length;
  const cols = gridCols(n);

  const subs = factories.map(f => scenarios.map((_, si) => computeFactorySubtotal(f, si, dhl, customs)));

  return (
    <div data-comp="QuoteEvaluationTable">
      {/* SectionLabel provided by parent SectionBreak */}

      <div className="mt-[var(--sp-2)]" style={{ display: 'grid', gridTemplateColumns: cols }}>

        {/* ── Header ── */}
        <div className={TH_LEFT}>p/days</div>
        {scenarios.map((s, i) => <div key={i} className={TH_RIGHT}>{s.header}</div>)}

        {/* ── AI Benchmark (flatten per-part to totals for V1 display) ── */}
        {(() => {
          const isPerPart = aiBenchmarks.length > 0 && typeof aiBenchmarks[0] === 'object' && aiBenchmarks[0] !== null && 'label' in aiBenchmarks[0];
          const flat: (number | null)[] = isPerPart
            ? (aiBenchmarks as { label: string; cells: (number | null)[] }[])[0]?.cells.map((_, ci) =>
                (aiBenchmarks as { label: string; cells: (number | null)[] }[]).reduce((sum, p) => {
                  const v = p.cells[ci];
                  return v != null ? (sum ?? 0) + v : sum;
                }, null as number | null),
              ) ?? []
            : (aiBenchmarks as (number | null)[]);
          if (!flat.some(v => v != null)) return null;
          return (
            <>
              <div className={`${TD_LABEL} ${TEXT_BOLD_VALUE}`} style={indentStyle(0)}>AI 報價</div>
              {flat.map((v, i) => (
                <div key={i} className={`${TD_VALUE} ${TEXT_BOLD_VALUE}`}>{v != null ? fmtP(v) : '—'}</div>
              ))}
            </>
          );
        })()}

        {/* ── Spacer ── */}
        <div className="col-span-full h-[var(--sp-2)]" />

        {/* ── 我方報價 ── */}
        <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>我方報價</div>

        {factories.map((factory, fi) => {
          if (isFactoryAllDeclined(factories[fi])) {
            return (
              <div key={fi} className="contents">
                <div className={`col-span-full ${TD_LABEL} ${TEXT_VENDOR}`} style={indentStyle(1)}>{factory.name} — <span className={TEXT_DECLINED}>拒絕報價</span></div>
              </div>
            );
          }
          return (
            <div key={fi} className="contents">
              <div className={`col-span-full ${TD_LABEL} ${TEXT_VENDOR}`} style={indentStyle(1)}>{factory.name}</div>
              {factory.parts.map((part, pi) => (
                <div key={pi} className="contents">
                  <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(2)}>{part.label}</div>
                  {part.cells.map((cell, ci) => (
                    <div key={ci} className={`${TD_VALUE} ${TEXT_SUB}`}><PriceWithDays cell={cell} /></div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}

        {/* ── DHL ── */}
        {dhl?.values && (
          <>
            <div className={`${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>DHL</div>
            {dhl.values.map((v, i) => <div key={i} className={`${TD_VALUE} ${TEXT_SUB}`}>{v != null ? fmtP(v) : '—'}</div>)}
          </>
        )}
        {dhl?.materialValues?.map((mv, mi) => (
          <div key={`dhl-m-${mi}`} className="contents">
            {mi === 0 && <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>DHL</div>}
            <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(1)}>{mv.material}</div>
            {mv.values.map((v, i) => <div key={i} className={`${TD_VALUE} ${TEXT_SUB}`}>{v != null ? fmtP(v) : '—'}</div>)}
          </div>
        ))}

        {/* ── Customs ── */}
        {customs?.values && (
          <>
            <div className={`${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>關稅</div>
            {customs.values.map((v, i) => <div key={i} className={`${TD_VALUE} ${TEXT_SUB}`}>{v != null ? fmtP(v) : '—'}</div>)}
          </>
        )}
        {customs?.materialValues?.map((mv, mi) => (
          <div key={`cus-m-${mi}`} className="contents">
            {mi === 0 && <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>關稅</div>}
            <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(1)}>{mv.material}</div>
            {mv.values.map((v, i) => <div key={i} className={`${TD_VALUE} ${TEXT_SUB}`}>{v != null ? fmtP(v) : '—'}</div>)}
          </div>
        ))}

        {/* ── Separator ── */}
        <div className="col-span-full border-b border-[var(--gray-200)] my-[var(--sp-2)]" />

        {/* ── 小計 ── */}
        <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>小計</div>
        {factories.map((factory, fi) => {
          if (isFactoryAllDeclined(factories[fi])) return null;
          return (
            <div key={fi} className="contents">
              <div className={`${TD_LABEL} ${TEXT_VENDOR}`} style={indentStyle(1)}>{factory.name}</div>
              {subs[fi].map((s, si) => (
                <div key={si} className={`${TD_VALUE} font-semibold text-[color:var(--gray-900)]`}>
                  <SubtotalCell price={s.price} days={s.days} />
                </div>
              ))}
            </div>
          );
        })}

        {/* ── Separator ── */}
        <div className="col-span-full border-b border-[var(--gray-200)] my-[var(--sp-2)]" />

        {/* ── 報價 (利潤 X%) ── */}
        <div className={`col-span-full ${TD_LABEL} ${TEXT_CATEGORY}`} style={indentStyle(0)}>報價 (利潤 {marginPercent}%)</div>
        {factories.map((factory, fi) => {
          if (isFactoryAllDeclined(factories[fi])) return null;
          const margin = 1 + marginPercent / 100;
          return (
            <div key={fi} className="contents">
              <div className={`col-span-full ${TD_LABEL} ${TEXT_VENDOR}`} style={indentStyle(1)}>{factory.name}</div>
              {/* 單價 */}
              <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(2)}>單價</div>
              {subs[fi].map((s, si) => (
                <div key={si} className={`${TD_VALUE} ${TEXT_BOLD_VALUE}`}>
                  {s.price != null ? (
                    <span>{fmtP(s.price * margin)}<span className={TEXT_DAYS}>/{s.days}d</span></span>
                  ) : <span className={TEXT_MUTED}>—</span>}
                </div>
              ))}
              {/* 總價 */}
              <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(2)}>總價</div>
              {subs[fi].map((s, si) => {
                const qty = parseQty(scenarios[si].header);
                return (
                  <div key={si} className={`${TD_VALUE} ${TEXT_SUB}`}>
                    {s.price != null ? (
                      <span>{fmtT(s.price * margin * qty)}<span className={TEXT_DAYS}>/{s.days}d</span></span>
                    ) : <span className={TEXT_MUTED}>—</span>}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ── Double separator ── */}
        <div className="col-span-full my-[var(--sp-2)]" style={{ borderBottom: 'var(--doc-border-emphasis) solid var(--gray-300)' }} />

        {/* ── Weight ── */}
        {weights.values && (
          <>
            <div className={`${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(0)}>重量</div>
            {weights.values.map((w, i) => <div key={i} className={`${TD_VALUE} ${TEXT_SUB}`}>{w}</div>)}
          </>
        )}
        {weights.materialValues?.map((mv, mi) => (
          <div key={`w-${mi}`} className="contents">
            {mi === 0 && <div className={`col-span-full ${TD_LABEL} ${TEXT_SUB}`} style={indentStyle(0)}>重量</div>}
            <div className={`${TD_LABEL} ${TEXT_MUTED}`} style={indentStyle(1)}>{mv.material}</div>
            {mv.values.map((w, j) => <div key={j} className={`${TD_VALUE} ${TEXT_SUB}`}>{w}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuoteEvaluationTable;
