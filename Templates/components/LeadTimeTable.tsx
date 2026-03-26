/**
 * LeadTimeTable — Simple text-based lead time table
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx, tableStyles.ts
 */

import { SectionLabel } from './SectionLabel';
import {
  CAP_MATRIX_COLS, TH_LEFT, TD_LABEL, TD_VALUE,
  TEXT_BOLD_VALUE, TEXT_SUB, TEXT_MUTED,
  SECTION_HEADER_FLEX, SECTION_HEADER_INFO, ROW_BORDER,
} from './tableStyles';

export interface LeadTimeRow {
  phase: string;
  days: number;
  note?: string;
}

export interface LeadTimeData {
  rows: LeadTimeRow[];
  totalDays: number;
  estimatedDelivery?: string;
  deliveryNote?: string;
}

interface Props { data: LeadTimeData }

export function LeadTimeTable({ data }: Props) {
  return (
    <div data-comp="LeadTimeTable">
      {/* SectionLabel provided by parent SectionBreak */}
      <div className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-900)]">
        合計: {data.totalDays} 個工作天
      </div>

      <div className="mt-[var(--sp-2)]" style={{ display: 'grid', gridTemplateColumns: CAP_MATRIX_COLS }}>
        {/* Header */}
        <div className={TH_LEFT}>階段</div>
        <div className={TH_LEFT}>天數</div>
        <div className={TH_LEFT}>說明</div>

        {/* Rows */}
        {data.rows.map((row, i) => (
          <div key={i} className={`contents ${ROW_BORDER}`}>
            <div className={`${TD_LABEL} font-medium text-[color:var(--gray-900)] ${ROW_BORDER}`}>
              {row.phase}
            </div>
            <div className={`${TD_LABEL} ${TEXT_BOLD_VALUE} ${ROW_BORDER}`}>
              {row.days} 天
            </div>
            <div className={`${TD_LABEL} ${TEXT_MUTED} ${ROW_BORDER}`}>
              {row.note || ''}
            </div>
          </div>
        ))}

        {/* Total row */}
        <div className="contents" style={{ borderTop: 'var(--doc-border-emphasis) solid var(--gray-300)' }}>
          <div className={`${TD_LABEL} ${TEXT_BOLD_VALUE}`} style={{ borderTop: 'var(--doc-border-emphasis) solid var(--gray-300)' }}>
            合計
          </div>
          <div className={`${TD_LABEL} font-bold text-[color:var(--color-primary)]`} style={{ borderTop: 'var(--doc-border-emphasis) solid var(--gray-300)' }}>
            {data.totalDays} 天
          </div>
          <div className={`${TD_LABEL} ${TEXT_SUB}`} style={{ borderTop: 'var(--doc-border-emphasis) solid var(--gray-300)' }}>
            {data.estimatedDelivery && <>預計到貨: {data.estimatedDelivery}</>}
            {data.deliveryNote && <span className={`${TEXT_MUTED} ml-[var(--sp-2)]`}>{data.deliveryNote}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeadTimeTable;
