/**
 * RevisionHistory — Document revision tracking table
 *
 * Renders a simple table of revision entries showing what changed per version.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 */

import { SectionLabel } from './SectionLabel';

export interface RevisionEntry {
  rev: string;
  date: string;
  author: string;
  description: string;
}

interface RevisionHistoryProps {
  entries: RevisionEntry[];
}

export function RevisionHistory({ entries }: RevisionHistoryProps) {
  return (
    <div data-comp="RevisionHistory" className="flex flex-col gap-[var(--doc-sp-1-5)]">
      <SectionLabel>Revision History 修訂歷史</SectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['REV', '日期', '作者', '變更內容'].map((h, i) => (
              <th
                key={i}
                className="text-left py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] border-b-[var(--doc-border-emphasis)] border-[var(--gray-200)]"
                style={i === 0 ? { width: '8%' } : i === 1 ? { width: '18%' } : i === 2 ? { width: '15%' } : undefined}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} className="border-b border-[var(--gray-150)]">
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)]">
                {entry.rev}
              </td>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
                {entry.date}
              </td>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
                {entry.author}
              </td>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
                {entry.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RevisionHistory;
