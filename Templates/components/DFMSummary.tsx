/**
 * DFMSummary — Design for Manufacturing feedback summary table
 *
 * Renders structured DFM feedback items with severity classification,
 * impact assessment, and resolution status.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx, StatusIndicator.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name    | Type        | Required | Default | Description           |
 * |---------|-------------|----------|---------|-----------------------|
 * | items   | DFMItem[]   | yes      | —       | DFM feedback items    |
 * | factory | string      | no       | —       | Source factory name   |
 */

import { SectionLabel } from './SectionLabel';

export type DFMSeverity = 'blocker' | 'required' | 'suggested' | 'info';

const SEVERITY_CONFIG: Record<DFMSeverity, { icon: string; label: string; color: string }> = {
  blocker:   { icon: '🔴', label: '阻斷',     color: '#B61F1F' },
  required:  { icon: '🟡', label: '必要修改', color: 'var(--color-warning)' },
  suggested: { icon: '🔵', label: '建議修改', color: 'var(--color-info)' },
  info:      { icon: '⚪', label: '告知事項', color: 'var(--gray-400)' },
};

export interface DFMItem {
  severity: DFMSeverity;
  partId: string;
  category: string;
  description: string;
  impact?: string;
  status: 'accepted' | 'waitingCustomer' | 'info' | 'declined';
}

interface DFMSummaryProps {
  items: DFMItem[];
  factory?: string;
}

export function DFMSummary({ items, factory }: DFMSummaryProps) {
  if (items.length === 0) return null;

  return (
    <div data-comp="DFMSummary" className="flex flex-col gap-[var(--doc-sp-1-5)]">
      <div className="flex items-baseline justify-between">
        <SectionLabel className="flex-1">DFM Feedback Summary</SectionLabel>
        <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] ml-[var(--sp-4)] shrink-0 pb-[var(--sp-1)]">
          共 {items.length} 項反饋
        </span>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['#', '嚴重度', '零件', '類別', '說明', '狀態'].map((h, i) => (
              <th
                key={i}
                className={[
                  'py-[var(--doc-sp-table-y)] px-[var(--sp-2)]',
                  'text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)]',
                  'uppercase tracking-[var(--doc-tracking-label)]',
                  'border-b-[var(--doc-border-emphasis)] border-[var(--gray-200)] text-left',
                ].join(' ')}
                style={
                  i === 0 ? { width: '5%' } :
                  i === 1 ? { width: '12%' } :
                  i === 2 ? { width: '8%' } :
                  i === 3 ? { width: '8%' } :
                  i === 5 ? { width: '12%' } : undefined
                }
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const sev = SEVERITY_CONFIG[item.severity];
            return (
              <tr key={i} data-el="DFMSummary-row" className="border-b border-[var(--gray-150)]">
                <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] text-[color:var(--gray-400)]">
                  {i + 1}
                </td>
                <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)]" style={{ color: sev.color }}>
                  {sev.icon} {sev.label}
                </td>
                <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-900)]">
                  {item.partId}
                </td>
                <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
                  {item.category}
                </td>
                <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] leading-[1.4]">
                  {item.description}
                  {item.impact && (
                    <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] mt-[var(--doc-sp-half)]">
                      {item.impact}
                    </div>
                  )}
                </td>
                <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)]">
                  <span className="text-[length:var(--doc-text-secondary)]" style={{ color: sev.color }}>
                    {item.status === 'accepted' ? '● 已接受' :
                     item.status === 'waitingCustomer' ? '◐ 等待客戶' :
                     item.status === 'declined' ? '⊘ 已拒絕' : '— 告知'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-baseline justify-between text-[length:var(--doc-text-fine)] text-[color:var(--gray-400)]">
        <span>嚴重度: 🔴 阻斷 · 🟡 必要修改 · 🔵 建議修改 · ⚪ 告知事項</span>
        {factory && <span>來源工廠: {factory}</span>}
      </div>
    </div>
  );
}

export default DFMSummary;
