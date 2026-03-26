/**
 * PricingStructureTable — Core pricing comparison table for evaluation reports
 *
 * Renders all cost sources (AI benchmark, material, machining, shipping, customs)
 * in a single unified table for direct comparison. Supports 4 modes:
 *   D: Single confirmed scenario (1 column)
 *   A: Multiple quantity tiers (N columns, same material)
 *   B: Multiple materials (N columns, same quantity)
 *   C: Cross matrix (materials × quantities — condensed summary)
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name           | Type              | Required | Default | Description                     |
 * |----------------|-------------------|----------|---------|---------------------------------|
 * | scenarios      | PricingScenario[] | yes      | —       | Array of pricing scenarios      |
 * | recommendedIdx | number            | no       | 0       | Index of recommended scenario   |
 * | marginPercent  | number            | no       | 18      | Profit margin percentage        |
 * | matrixMode     | boolean           | no       | false   | True for Mode C (condensed)     |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   // Mode D: Single scenario
 *   <PricingStructureTable scenarios={[single]} />
 *
 *   // Mode A: Quantity tiers
 *   <PricingStructureTable scenarios={[qty100, qty200, qty500]} recommendedIdx={1} />
 *
 *   // Mode B: Material alternatives
 *   <PricingStructureTable scenarios={[peek, delrin, al6061]} recommendedIdx={1} />
 */

import { SectionLabel } from './SectionLabel';

export interface CostLineItem {
  label: string;
  /** Sub-detail text (e.g., "高成電木, G11") */
  detail?: string;
}

export interface PricingScenario {
  /** Column header (e.g., "100 pcs" or "PEEK" or "100 pcs / PEEK") */
  header: string;
  /** AI benchmark unit price for this scenario */
  aiBenchmark?: number;
  /** Cost breakdown line items — values correspond to CostLineItem labels */
  costValues: number[];
  /** Lead time in working days */
  leadTimeDays: number;
  /** Weight description (e.g., "成品 0.24kg × 8件 = 1.92kg | 含包裝 3.24kg") */
  weight: string;
}

interface PricingStructureTableProps {
  /** Descriptive subtitle (e.g., "材料: G11 (FR5) | 數量: 8 件" or "材料: Aluminum 6061-T6") */
  subtitle: string;
  /** Cost line item labels — shared across all scenarios */
  costLines: CostLineItem[];
  /** Array of scenarios (columns) */
  scenarios: PricingScenario[];
  /** Index of the recommended scenario (gets ✓ marker + accent border) */
  recommendedIdx?: number;
  /** Profit margin percentage */
  marginPercent?: number;
  /** True = Mode C condensed matrix (only shows unit price + lead time per cell) */
  matrixMode?: boolean;
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function PricingStructureTable({
  subtitle,
  costLines,
  scenarios,
  recommendedIdx = 0,
  marginPercent = 18,
  matrixMode = false,
}: PricingStructureTableProps) {
  const isSingle = scenarios.length === 1;
  const colWidth = isSingle ? '1fr' : scenarios.map(() => '1fr').join(' ');

  return (
    <div data-comp="PricingStructureTable" className="flex flex-col gap-[var(--doc-sp-1-5)]">
      <SectionLabel>Pricing Structure 價格結構</SectionLabel>
      <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] -mt-[var(--sp-1)]">
        {subtitle}
      </div>

      <table className="w-full border-collapse mt-[var(--sp-1)]">
        {/* ── Column Headers ── */}
        <thead>
          <tr>
            <th className="text-left py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] border-b-[var(--doc-border-emphasis)] border-[var(--gray-200)]"
              style={{ width: isSingle ? '60%' : '40%' }}
            />
            {scenarios.map((s, i) => (
              <th
                key={i}
                className={[
                  'text-right py-[var(--doc-sp-table-y)] px-[var(--sp-2)]',
                  'text-[length:var(--doc-text-param-label)] font-semibold uppercase tracking-[var(--doc-tracking-label)]',
                  'border-b-[var(--doc-border-emphasis)]',
                  i === recommendedIdx
                    ? 'text-[color:var(--color-primary)] border-[var(--color-primary-subtle)]'
                    : 'text-[color:var(--gray-400)] border-[var(--gray-200)]',
                ].join(' ')}
              >
                {s.header}{i === recommendedIdx && ' ✓'}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* ── AI Benchmark ── */}
          {scenarios.some(s => s.aiBenchmark != null) && (
            <tr data-el="PricingStructureTable-benchmark">
              <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] italic">
                AI Benchmark (Xometry)
              </td>
              {scenarios.map((s, i) => (
                <td key={i} className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] italic">
                  {s.aiBenchmark != null ? fmt(s.aiBenchmark) : '—'}
                </td>
              ))}
            </tr>
          )}

          {/* ── Spacer ── */}
          <tr><td colSpan={scenarios.length + 1} className="py-[var(--doc-sp-half)]" /></tr>

          {/* ── "我方報價:" label row ── */}
          <tr>
            <td colSpan={scenarios.length + 1} className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-600)]">
              我方報價:
            </td>
          </tr>

          {!matrixMode && (
            <>
              {/* ── Cost line items ── */}
              {costLines.map((line, li) => (
                <tr key={li} data-el="PricingStructureTable-costLine">
                  <td className="py-[var(--doc-sp-half)] pl-[var(--sp-4)] pr-[var(--sp-2)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)]">
                    {line.label}
                    {line.detail && (
                      <span className="text-[color:var(--gray-400)]"> ({line.detail})</span>
                    )}
                  </td>
                  {scenarios.map((s, i) => (
                    <td key={i} className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)]">
                      {fmt(s.costValues[li])}
                    </td>
                  ))}
                </tr>
              ))}

              {/* ── Subtotal separator ── */}
              <tr>
                <td colSpan={scenarios.length + 1}>
                  <div className="border-b border-[var(--gray-200)] mx-[var(--sp-2)] my-[var(--sp-1)]" />
                </td>
              </tr>

              {/* ── Subtotal ── */}
              <tr data-el="PricingStructureTable-subtotal">
                <td className="py-[var(--doc-sp-half)] pl-[var(--sp-4)] pr-[var(--sp-2)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)]">
                  成本小計
                </td>
                {scenarios.map((s, i) => {
                  const subtotal = s.costValues.reduce((a, b) => a + b, 0);
                  return (
                    <td key={i} className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)]">
                      {fmt(subtotal)}
                    </td>
                  );
                })}
              </tr>

              {/* ── Margin ── */}
              <tr data-el="PricingStructureTable-margin">
                <td className="py-[var(--doc-sp-half)] pl-[var(--sp-4)] pr-[var(--sp-2)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
                  利潤 ({marginPercent}%)
                </td>
                {scenarios.map((s, i) => {
                  const subtotal = s.costValues.reduce((a, b) => a + b, 0);
                  const margin = subtotal * (marginPercent / 100);
                  return (
                    <td key={i} className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
                      {fmt(margin)}
                    </td>
                  );
                })}
              </tr>

              {/* ── Quote price separator ── */}
              <tr>
                <td colSpan={scenarios.length + 1}>
                  <div className="border-b border-[var(--gray-200)] mx-[var(--sp-2)] my-[var(--sp-1)]" />
                </td>
              </tr>

              {/* ── Quote unit price ── */}
              <tr data-el="PricingStructureTable-quotePrice">
                <td className="py-[var(--doc-sp-totals-y)] pl-[var(--sp-4)] pr-[var(--sp-2)] text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-900)]">
                  報價單價
                </td>
                {scenarios.map((s, i) => {
                  const subtotal = s.costValues.reduce((a, b) => a + b, 0);
                  const quotePrice = subtotal * (1 + marginPercent / 100);
                  return (
                    <td
                      key={i}
                      className={[
                        'py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-part-id)] font-bold',
                        i === recommendedIdx
                          ? 'text-[color:var(--color-primary)]'
                          : 'text-[color:var(--gray-900)]',
                      ].join(' ')}
                    >
                      {fmt(quotePrice)}
                    </td>
                  );
                })}
              </tr>
            </>
          )}

          {matrixMode && (
            /* ── Mode C: condensed — each scenario shows only quote price ── */
            <tr data-el="PricingStructureTable-matrixPrice">
              <td className="py-[var(--doc-sp-totals-y)] pl-[var(--sp-4)] pr-[var(--sp-2)] text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-900)]">
                報價單價
              </td>
              {scenarios.map((s, i) => {
                const subtotal = s.costValues.reduce((a, b) => a + b, 0);
                const quotePrice = subtotal * (1 + marginPercent / 100);
                return (
                  <td
                    key={i}
                    className={[
                      'py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-part-id)] font-bold',
                      i === recommendedIdx
                        ? 'text-[color:var(--color-primary)]'
                        : 'text-[color:var(--gray-900)]',
                    ].join(' ')}
                  >
                    {fmt(quotePrice)}
                  </td>
                );
              })}
            </tr>
          )}

          {/* ── Bottom separator (double) ── */}
          <tr>
            <td colSpan={scenarios.length + 1}>
              <div className="mx-[var(--sp-2)] my-[var(--sp-1)]" style={{ borderBottom: 'var(--doc-border-emphasis) solid var(--gray-300)' }} />
            </td>
          </tr>

          {/* ── Lead Time ── */}
          <tr data-el="PricingStructureTable-leadTime">
            <td className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)]">
              交期
            </td>
            {scenarios.map((s, i) => (
              <td key={i} className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)]">
                {s.leadTimeDays} 工作天
              </td>
            ))}
          </tr>

          {/* ── Weight ── */}
          <tr data-el="PricingStructureTable-weight">
            <td className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
              重量
            </td>
            {scenarios.map((s, i) => (
              <td key={i} className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
                {s.weight}
              </td>
            ))}
          </tr>

          {/* ── vs AI ── */}
          {scenarios.some(s => s.aiBenchmark != null) && (
            <tr data-el="PricingStructureTable-vsAI">
              <td className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
                vs AI
              </td>
              {scenarios.map((s, i) => {
                if (s.aiBenchmark == null) return <td key={i} />;
                const subtotal = s.costValues.reduce((a, b) => a + b, 0);
                const quotePrice = subtotal * (1 + marginPercent / 100);
                const diff = ((quotePrice - s.aiBenchmark) / s.aiBenchmark) * 100;
                return (
                  <td key={i} className="py-[var(--doc-sp-half)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--color-success)]">
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PricingStructureTable;
