/**
 * FeasibilityMatrix — Requirement vs. capability table with risk indicators
 *
 * Renders a technical feasibility assessment as a structured checklist.
 * Each row shows a requirement, the shop's capability, and a risk level.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx, StatusIndicator.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name       | Type               | Required | Default | Description                    |
 * |------------|--------------------|----------|---------|--------------------------------|
 * | items      | FeasibilityItem[]  | yes      | —       | Assessment rows                |
 * | overall    | StatusType         | yes      | —       | Overall risk level             |
 * | conclusion | string             | yes      | —       | Conclusion text                |
 * | reference  | string             | no       | —       | Reference case/prior art       |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <FeasibilityMatrix
 *     items={[{ criterion: '材料可加工性', requirement: 'G11', capability: 'CNC 可加工', risk: 'riskLow' }]}
 *     overall="riskLow"
 *     conclusion="CNC 加工可達到要求。"
 *   />
 */

import { SectionLabel } from './SectionLabel';
import { StatusIndicator, type StatusType } from './StatusIndicator';

export interface FeasibilityItem {
  criterion: string;
  requirement: string;
  capability: string;
  risk: StatusType;
}

interface FeasibilityMatrixProps {
  items: FeasibilityItem[];
  overall: StatusType;
  conclusion: string;
  reference?: string;
}

export function FeasibilityMatrix({ items, overall, conclusion, reference }: FeasibilityMatrixProps) {
  return (
    <div data-comp="FeasibilityMatrix" className="flex flex-col gap-[var(--doc-sp-1-5)]">
      <div className="flex items-baseline justify-between">
        <SectionLabel className="flex-1">Technical Feasibility 技術可行性</SectionLabel>
        <span className="flex items-center gap-[var(--sp-1)] text-[length:var(--doc-text-secondary)] ml-[var(--sp-4)] shrink-0 pb-[var(--sp-1)]">
          綜合評估: <StatusIndicator status={overall} showLabel />
        </span>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['項目', '需求', '能力', '風險'].map((h, i) => (
              <th
                key={i}
                className={[
                  'py-[var(--doc-sp-table-y)] px-[var(--sp-2)]',
                  'text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)]',
                  'uppercase tracking-[var(--doc-tracking-label)]',
                  'border-b-[var(--doc-border-emphasis)] border-[var(--gray-200)]',
                  i === 0 ? 'text-left' : i === 3 ? 'text-center' : 'text-left',
                ].join(' ')}
                style={i === 0 ? { width: '25%' } : i === 3 ? { width: '12%' } : undefined}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} data-el="FeasibilityMatrix-row" className={i % 2 === 1 ? 'bg-[var(--gray-50)]' : ''}>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-900)]">
                {item.criterion}
              </td>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
                {item.requirement}
              </td>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
                {item.capability}
              </td>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-center">
                <StatusIndicator status={item.risk} showLabel />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] leading-[1.5] mt-[var(--sp-1)]">
        <strong className="text-[color:var(--gray-900)]">結論:</strong> {conclusion}
      </div>
      {reference && (
        <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
          參考案例: {reference}
        </div>
      )}
    </div>
  );
}

export default FeasibilityMatrix;
