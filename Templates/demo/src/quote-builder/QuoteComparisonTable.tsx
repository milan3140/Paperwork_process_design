/**
 * QuoteComparisonTable — Customer-facing pricing comparison for PDF quotes
 *
 * Auto-selects the optimal layout based on dimension analysis:
 *   single:         No comparison needed, inline display
 *   horizontal:     1 varying dimension → options as columns
 *   matrix:         2 varying dimensions → rows × columns
 *   grouped_matrix: 3 varying dimensions → groups of matrices
 *   flat_list:      4+ dimensions → flat scenario list
 *
 * Each cell shows: unit price + lead time + comparison annotation
 * Uses design tokens from Design_Sys_style.css + documents.css
 */

import type { QuotePart, Scenario, VaryingDimension, DimensionAnalysis } from './types';
import {
  NONE,
  analyzeDimensions,
  selectLayout,
  generateConditionLabel,
  computeComparisons,
  getUniqueValues,
  findScenarios,
} from './dimensionEngine';

/* ── Formatting ── */

function fmtPrice(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── Style constants (doc tokens) ── */

const TH = [
  'py-[var(--doc-sp-table-y,7px)] px-[var(--sp-2,8px)]',
  'text-[length:var(--doc-text-param-label,7.5px)] font-semibold',
  'text-[color:var(--gray-500,#6b6780)] uppercase tracking-[0.06em]',
  'border-b-[1.5px] border-[var(--gray-300,#ccc9d6)]',
].join(' ');

const TD = 'py-[var(--doc-sp-table-y,7px)] px-[var(--sp-2,8px)] text-[length:var(--doc-text-body,10px)]';

const ANNOTATION = 'text-[length:var(--doc-text-secondary,9px)] text-[color:var(--gray-500,#6b6780)]';

const SEP_THICK = 'border-b-[1.5px] border-[var(--gray-400,#9a96a8)]';

/* ── Cell: Price + Lead Time + Annotation ── */

/** Renders 1 or more scenarios stacked in a single table cell */
function PriceCell({ scenarios, annotations, showLeadTime = true }: {
  scenarios: Scenario[];
  annotations: Map<string, string>;
  showLeadTime?: boolean;
}) {
  if (scenarios.length === 0) {
    return (
      <td className={`${TD} text-right text-[color:var(--gray-400,#9a96a8)]`}>—</td>
    );
  }
  return (
    <td className={`${TD} text-right`}>
      {scenarios.map((s, i) => (
        <div key={s.id} className={i > 0 ? 'mt-[var(--sp-2,8px)] pt-[var(--sp-2,8px)] border-t border-dashed border-[var(--gray-300,#ccc9d6)]' : ''}>
          {/* Show customLabel if stacking multiple in same cell */}
          {scenarios.length > 1 && s.customLabel && (
            <div className="text-[color:var(--gray-500,#6b6780)] text-[length:var(--doc-text-secondary,9px)] mb-[1px]">
              {s.customLabel}
            </div>
          )}
          <div className="font-semibold text-[color:var(--gray-900,#1c1a25)]">
            {fmtPrice(s.unitPrice)}
          </div>
          {showLeadTime && (
            <div className="text-[color:var(--gray-500,#6b6780)] text-[length:var(--doc-text-secondary,9px)]">
              {s.leadTimeDays} workdays
            </div>
          )}
          {annotations.get(s.id) && (
            <div className={ANNOTATION}>{annotations.get(s.id)}</div>
          )}
        </div>
      ))}
    </td>
  );
}

/* ── Part Header: shows fixed attributes ── */

function PartHeader({ part, analysis }: { part: QuotePart; analysis: DimensionAnalysis }) {
  const effectiveMaterial = analysis.fixed.material || part.material;
  const effectiveFinish = analysis.fixed.finish || part.finish;
  const fixedLocation = !analysis.varying.includes('location') && analysis.fixed.location
    ? (analysis.fixed.location === 'US' ? 'U.S.' : 'Taiwan')
    : undefined;

  const fixedQty = !analysis.varying.includes('qty') && analysis.fixed.qty
    ? `QTY ${analysis.fixed.qty}`
    : undefined;

  const details = [
    effectiveMaterial && !analysis.varying.includes('material') ? effectiveMaterial : null,
    effectiveFinish && !analysis.varying.includes('finish') ? effectiveFinish : null,
    fixedLocation ? `${fixedLocation} manufacturing` : null,
    fixedQty,
  ].filter(Boolean);

  return (
    <div className="mb-[var(--sp-1,4px)]">
      <span className="text-[length:var(--doc-text-body,10px)] font-semibold text-[color:var(--gray-900,#1c1a25)]">
        {part.name}
      </span>
      {details.length > 0 && (
        <span className="text-[length:var(--doc-text-secondary,9px)] text-[color:var(--gray-500,#6b6780)] ml-[var(--sp-2,8px)]">
          {details.join(' · ')}
        </span>
      )}
    </div>
  );
}

/* ── Layout: Single (0 varying dims) ── */

function SingleLayout({ part, analysis }: { part: QuotePart; analysis: DimensionAnalysis }) {
  const s = part.scenarios[0];
  if (!s) return null;

  return (
    <div className="flex items-baseline gap-[var(--sp-4,16px)]">
      <PartHeader part={part} analysis={analysis} />
      <span className="font-semibold text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-900,#1c1a25)]">
        {fmtPrice(s.unitPrice)} /ea
      </span>
    </div>
  );
}

/* ── Layout: Horizontal (1 varying dim → options as columns) ── */

function HorizontalLayout({ part, analysis, showLeadTime }: { part: QuotePart; analysis: DimensionAnalysis; showLeadTime: boolean }) {
  const dim = analysis.varying[0];
  const annotations = computeComparisons(part.scenarios, analysis.varying);

  // Column headers from UNIQUE dimension values (not per-scenario)
  const colValues = getUniqueValues(part.scenarios, dim, part.material, part.finish);

  function formatDimValue(val: string): string {
    if (dim === 'qty') return `QTY ${val}`;
    if (dim === 'location') return val === 'US' ? 'U.S. manufacturing' : val === 'TW' ? 'Taiwan manufacturing' : val;
    if (dim === 'leadTime') return `${val} workdays`;
    return val;
  }

  // If leadTime IS the comparison dimension, don't repeat it in cells
  const cellShowLeadTime = showLeadTime && dim !== 'leadTime';

  return (
    <div>
      <PartHeader part={part} analysis={analysis} />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {colValues.map((cv, i) => (
              <th key={i} className={`${TH} text-right`}>{formatDimValue(cv)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {colValues.map((cv, i) => {
              const matched = findScenarios(part.scenarios, { [dim]: cv }, part.material, part.finish);
              return <PriceCell key={i} scenarios={matched} annotations={annotations} showLeadTime={cellShowLeadTime} />;
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ── Layout: Matrix (2 varying dims → rows × columns) ── */

function MatrixLayout({ part, analysis, showLeadTime }: { part: QuotePart; analysis: DimensionAnalysis; showLeadTime: boolean }) {
  const [dimRow, dimCol] = analysis.varying;
  const rowValues = getUniqueValues(part.scenarios, dimRow, part.material, part.finish);
  const colValues = getUniqueValues(part.scenarios, dimCol, part.material, part.finish);
  const annotations = computeComparisons(part.scenarios, analysis.varying);

  function formatDimValue(dim: VaryingDimension, val: string): string {
    if (dim === 'qty') return `QTY ${val}`;
    if (dim === 'location') return val === 'US' ? 'U.S.' : val === 'TW' ? 'Taiwan' : val;
    if (dim === 'leadTime') return `${val} workdays`;
    return val;
  }

  // If leadTime is shown in headers/rows, don't repeat in cells
  const cellShowLeadTime = showLeadTime && !analysis.varying.includes('leadTime');

  return (
    <div>
      <PartHeader part={part} analysis={analysis} />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${TH} text-left`} style={{ width: '25%' }} />
            {colValues.map((cv, i) => (
              <th key={i} className={`${TH} text-right`}>{formatDimValue(dimCol, cv)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowValues.map((rv, ri) => (
            <tr key={ri} className={ri < rowValues.length - 1 ? 'border-b border-[var(--gray-300,#ccc9d6)]' : ''}>
              <td className={`${TD} text-left font-medium text-[color:var(--gray-600,#6b6780)]`}>
                {formatDimValue(dimRow, rv)}
              </td>
              {colValues.map((cv, ci) => {
                const matched = findScenarios(part.scenarios, { [dimRow]: rv, [dimCol]: cv }, part.material, part.finish);
                return (
                  <PriceCell key={ci} scenarios={matched} annotations={annotations} showLeadTime={cellShowLeadTime} />
                );
              })}
            </tr>
          ))}
          {/* Subtotal row removed — pricing options are alternatives, not additive */}
        </tbody>
      </table>
    </div>
  );
}

/* ── Layout: Grouped Matrix (3 varying dims) ── */

function GroupedMatrixLayout({ part, analysis, showLeadTime }: { part: QuotePart; analysis: DimensionAnalysis; showLeadTime: boolean }) {
  // Use the dimension with fewest unique values as the group
  const dimCounts = analysis.varying.map(d => ({
    dim: d,
    count: getUniqueValues(part.scenarios, d, part.material, part.finish).length,
  }));
  dimCounts.sort((a, b) => a.count - b.count);

  const groupDim = dimCounts[0].dim;
  const innerDims = analysis.varying.filter(d => d !== groupDim);
  const groupValues = getUniqueValues(part.scenarios, groupDim, part.material, part.finish);

  function formatDimValue(dim: VaryingDimension, val: string): string {
    if (dim === 'qty') return `QTY ${val}`;
    if (dim === 'location') return val === 'US' ? 'U.S.' : val === 'TW' ? 'Taiwan' : val;
    if (dim === 'leadTime') return `${val} workdays`;
    return val;
  }

  // If leadTime is shown in headers/rows, don't repeat in cells
  const cellShowLeadTime = showLeadTime && !analysis.varying.includes('leadTime');

  return (
    <div>
      <PartHeader part={part} analysis={analysis} />
      <div className="flex flex-col gap-[var(--sp-3,12px)]">
        {groupValues.map((gv, gi) => {
          // Filter scenarios for this group
          const groupScenarios = part.scenarios.filter(s => {
            switch (groupDim) {
              case 'qty': return String(s.qty) === gv;
              case 'location': return (s.location ?? NONE) === gv;
              case 'material': return (s.materialOverride || part.material || NONE) === gv;
              case 'finish': return (s.finishOverride || part.finish || NONE) === gv;
              case 'leadTime': return String(s.leadTimeDays) === gv;
            }
          });

          const [dimRow, dimCol] = innerDims;
          const rowValues = getUniqueValues(groupScenarios, dimRow, part.material, part.finish);
          const colValues = getUniqueValues(groupScenarios, dimCol, part.material, part.finish);
          const annotations = computeComparisons(groupScenarios, innerDims);

          return (
            <div key={gi} className="border border-[var(--gray-300,#ccc9d6)] rounded-[var(--radius-sm,4px)] p-[var(--sp-2,8px)]">
              <div className="text-[length:var(--doc-text-body,10px)] font-semibold text-[color:var(--gray-700,#4a4660)] mb-[var(--sp-1,4px)]">
                {formatDimValue(groupDim, gv)}
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${TH} text-left`} style={{ width: '25%' }} />
                    {colValues.map((cv, i) => (
                      <th key={i} className={`${TH} text-right`}>{formatDimValue(dimCol, cv)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowValues.map((rv, ri) => (
                    <tr key={ri} className={ri < rowValues.length - 1 ? 'border-b border-[var(--gray-300,#ccc9d6)]' : ''}>
                      <td className={`${TD} text-left font-medium text-[color:var(--gray-600,#6b6780)]`}>
                        {formatDimValue(dimRow, rv)}
                      </td>
                      {colValues.map((cv, ci) => {
                        const matched = findScenarios(groupScenarios, { [dimRow]: rv, [dimCol]: cv }, part.material, part.finish);
                        return (
                          <PriceCell key={ci} scenarios={matched} annotations={annotations} showLeadTime={cellShowLeadTime} />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Layout: Flat List (4+ dims fallback) ── */

function FlatListLayout({ part, analysis, showLeadTime }: { part: QuotePart; analysis: DimensionAnalysis; showLeadTime: boolean }) {
  const annotations = computeComparisons(part.scenarios, analysis.varying);

  return (
    <div>
      <PartHeader part={part} analysis={analysis} />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${TH} text-left`}>Option</th>
            <th className={`${TH} text-right`}>Unit Price</th>
            {showLeadTime && <th className={`${TH} text-right`}>Lead Time</th>}
            <th className={`${TH} text-right`}>Comparison</th>
          </tr>
        </thead>
        <tbody>
          {part.scenarios.map((s, i) => {
            const label = generateConditionLabel(s, analysis.varying, part.material, part.finish);
            const qtyLabel = `QTY ${s.qty}`;
            const fullLabel = label ? `${qtyLabel} — ${label}` : qtyLabel;
            return (
              <tr key={i} className={i < part.scenarios.length - 1 ? 'border-b border-[var(--gray-300,#ccc9d6)]' : ''}>
                <td className={`${TD} text-left text-[color:var(--gray-600,#6b6780)]`}>{fullLabel}</td>
                <td className={`${TD} text-right font-semibold text-[color:var(--gray-900,#1c1a25)]`}>{fmtPrice(s.unitPrice)}</td>
                {showLeadTime && <td className={`${TD} text-right text-[color:var(--gray-400,#9a96a8)]`}>{s.leadTimeDays} workdays</td>}
                <td className={`${TD} text-right ${ANNOTATION}`}>{annotations.get(s.id) || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main Component ── */

interface QuoteComparisonTableProps {
  part: QuotePart;
}

export function QuoteComparisonTable({ part }: QuoteComparisonTableProps) {
  const analysis = analyzeDimensions(part);
  const layout = selectLayout(analysis);

  // Always show lead time in cells — each layout's cellShowLeadTime
  // will suppress it only when leadTime IS the comparison dimension
  switch (layout) {
    case 'single':
      return <SingleLayout part={part} analysis={analysis} />;
    case 'horizontal':
      return <HorizontalLayout part={part} analysis={analysis} showLeadTime={true} />;
    case 'matrix':
      return <MatrixLayout part={part} analysis={analysis} showLeadTime={true} />;
    case 'grouped_matrix':
      return <GroupedMatrixLayout part={part} analysis={analysis} showLeadTime={true} />;
    case 'flat_list':
      return <FlatListLayout part={part} analysis={analysis} showLeadTime={true} />;
  }
}

export default QuoteComparisonTable;
