/**
 * VendorComparisonTable — Multi-vendor comparison with status indicators
 *
 * Renders a supplier comparison table showing status, pricing, lead time,
 * and notes per vendor. Supports per-part pricing columns.
 * Conclusion-first header shows the recommended vendor.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx, StatusIndicator.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name           | Type            | Required | Default | Description                       |
 * |----------------|-----------------|----------|---------|-----------------------------------|
 * | title          | string          | yes      | —       | Section title (e.g. "材料詢價")    |
 * | subtitle       | string          | no       | —       | Material/context subtitle          |
 * | recommendation | string          | no       | —       | Recommended vendor name            |
 * | vendors        | VendorRow[]     | yes      | —       | Vendor data rows                   |
 * | columns        | VendorColumn[]  | no       | default | Custom column definitions           |
 * | notes          | string[]        | no       | []      | Footnotes below table              |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <VendorComparisonTable
 *     title="Material Sourcing 材料詢價"
 *     subtitle="G11 (FR5)"
 *     recommendation="高成電木"
 *     vendors={[...]}
 *     notes={['高成: FR5 與 G11 同等級']}
 *   />
 */

import { SectionLabel } from './SectionLabel';
import { StatusIndicator, type StatusType } from './StatusIndicator';

export interface VendorRow {
  name: string;
  status: StatusType;
  /** If this is the selected vendor */
  selected?: boolean;
  /** Decline/note reason */
  statusDetail?: string;
  /** Dynamic values matching column order */
  values: (string | number | null)[];
}

export interface VendorColumn {
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

const DEFAULT_MATERIAL_COLUMNS: VendorColumn[] = [
  { header: '尺寸', align: 'left' },
  { header: '庫存', align: 'center', width: '8%' },
  { header: '交期', align: 'left', width: '12%' },
  { header: '單價', align: 'right', width: '14%' },
  { header: '總價', align: 'right', width: '14%' },
  { header: '材證', align: 'center', width: '8%' },
];

interface VendorComparisonTableProps {
  title: string;
  subtitle?: string;
  recommendation?: string;
  vendors: VendorRow[];
  columns?: VendorColumn[];
  notes?: string[];
}

export function VendorComparisonTable({
  title,
  subtitle,
  recommendation,
  vendors,
  columns = DEFAULT_MATERIAL_COLUMNS,
  notes = [],
}: VendorComparisonTableProps) {
  return (
    <div data-comp="VendorComparisonTable" className="flex flex-col gap-[var(--doc-sp-1-5)]">
      <div className="flex items-baseline justify-between">
        <SectionLabel className="flex-1">
          {title}{subtitle ? ` — ${subtitle}` : ''}
        </SectionLabel>
        {recommendation && (
          <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--color-primary)] font-semibold ml-[var(--sp-4)] shrink-0 pb-[var(--sp-1)]">
            推薦: {recommendation} ✓
          </span>
        )}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] border-b-[var(--doc-border-emphasis)] border-[var(--gray-200)]"
              style={{ width: '18%' }}
            >
              供應商
            </th>
            <th className="text-center py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] border-b-[var(--doc-border-emphasis)] border-[var(--gray-200)]"
              style={{ width: '10%' }}
            >
              狀態
            </th>
            {columns.map((col, i) => (
              <th
                key={i}
                className={[
                  'py-[var(--doc-sp-table-y)] px-[var(--sp-2)]',
                  'text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)]',
                  'uppercase tracking-[var(--doc-tracking-label)]',
                  'border-b-[var(--doc-border-emphasis)] border-[var(--gray-200)]',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                ].join(' ')}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor, vi) => (
            <tr
              key={vi}
              data-el="VendorComparisonTable-row"
              className={vendor.selected ? '' : ''}
              style={vendor.selected ? { borderLeft: '3px solid var(--color-primary)' } : undefined}
            >
              <td className={[
                'py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)]',
                vendor.selected ? 'font-bold text-[color:var(--color-primary)]' : 'font-medium text-[color:var(--gray-900)]',
              ].join(' ')}>
                {vendor.name}{vendor.selected ? ' ✓' : ''}
              </td>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-center">
                <StatusIndicator status={vendor.status} showLabel />
              </td>
              {columns.map((col, ci) => {
                const val = vendor.values[ci];
                const isEmpty = val == null || val === '' || val === '—';
                return (
                  <td
                    key={ci}
                    className={[
                      'py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)] border-b border-[var(--gray-150)]',
                      isEmpty ? 'text-[color:var(--gray-300)]' : 'text-[color:var(--gray-600)]',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    ].join(' ')}
                  >
                    {isEmpty ? '—' : String(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {notes.length > 0 && (
        <div className="flex flex-col gap-[var(--doc-sp-half)] mt-[var(--sp-1)]">
          {notes.map((note, i) => (
            <div key={i} className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] leading-[1.5]">
              ▸ {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VendorComparisonTable;
