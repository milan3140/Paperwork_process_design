/**
 * tableStyles — Unified table layout constants for all document components
 *
 * All table-based components (QuoteEvaluationTable, LeadTimeTable,
 * TechFeasibility, FactoryDetailBlock) MUST use these constants
 * to ensure visual consistency across the document.
 *
 * ⚠️ REQUIRES: documents.css (design tokens)
 */

/* ── Column Layout ── */

/** Fixed width for Y-axis label column */
export const LABEL_COL_WIDTH = '200px';

/** Grid template for tables with label + N value columns */
export function gridCols(valueColCount: number): string {
  return `${LABEL_COL_WIDTH} repeat(${valueColCount}, 1fr)`;
}

/* ── Indentation ── */

/** Indentation levels in px (L0 = no indent, L1 = category, L2 = vendor, L3 = detail) */
export const INDENT = [0, 16, 32, 48] as const;

export function indentStyle(level: 0 | 1 | 2 | 3) {
  return { paddingLeft: `${8 + INDENT[level]}px` };
}

/* ── Shared CSS Classes ── */

/** Table header cell */
export const TH_CLS = [
  'py-[var(--doc-sp-table-y)] px-[var(--sp-2)]',
  'text-[length:var(--doc-text-param-label)] font-semibold',
  'text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)]',
  'border-b-[var(--doc-border-emphasis)] border-[var(--gray-200)]',
].join(' ');

/** Table header cell — left aligned (for label column) */
export const TH_LEFT = `${TH_CLS} text-left`;

/** Table header cell — right aligned (for value columns) */
export const TH_RIGHT = `${TH_CLS} text-right`;

/** Table data cell — base */
export const TD_BASE = 'py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:var(--doc-text-body)]';

/** Table data cell — label column (left) */
export const TD_LABEL = `${TD_BASE} text-left`;

/** Table data cell — value column (right) */
export const TD_VALUE = `${TD_BASE} text-right`;

/** Row with bottom border (standard row separator) */
export const ROW_BORDER = 'border-b border-[var(--gray-150)]';

/** Section separator — thin line between major groups within a table */
export const SECTION_SEP_THIN = 'border-b border-[var(--gray-200)]';

/** Section separator — thick line for subtotal/total boundaries */
export const SECTION_SEP_THICK = 'border-b-[var(--doc-border-emphasis)] border-[var(--gray-300)]';

/* ── Text Style Helpers ── */

/** Category label (bold, dark) — "我方報價", "DHL", "小計" */
export const TEXT_CATEGORY = 'font-semibold text-[color:var(--gray-900)]';

/** Vendor/factory name (medium, dark) — "鑫源", "嘉承" */
export const TEXT_VENDOR = 'font-medium text-[color:var(--gray-900)]';

/** Sub-item label (regular, muted) — "P01", "6061-T6", "單價" */
export const TEXT_SUB = 'text-[color:var(--gray-600)]';

/** Muted text — secondary info, notes */
export const TEXT_MUTED = 'text-[color:var(--gray-400)]';

/** Cannot achieve / declined — red */
export const TEXT_BLOCKED = 'text-[#B61F1F] font-semibold';

/** Declined/unavailable — gray italic */
export const TEXT_DECLINED = 'italic text-[color:var(--gray-300)]';

/** Bold value — prices in summary rows */
export const TEXT_BOLD_VALUE = 'font-bold text-[color:var(--gray-900)]';

/** Days suffix — appended to price */
export const TEXT_DAYS = 'text-[color:var(--gray-400)] font-normal';

/* ── SectionLabel + Right Info Layout ── */

/** Flex container for SectionLabel with adjacent info (not right-aligned to edge) */
export const SECTION_HEADER_FLEX = 'flex items-end gap-[var(--sp-4)]';

/** Info text next to section label (adjacent, not pushed to far right) */
export const SECTION_HEADER_INFO = 'text-[length:var(--doc-text-secondary)] shrink-0 pb-[var(--sp-1)]';

/* ── Capability Matrix (shared between TechFeasibility + FactoryDetail) ── */

/** Column widths for 3-column capability matrix: Item / Requirement / Capability */
export const CAP_MATRIX_COLS = `${LABEL_COL_WIDTH} 1fr 1fr`;

/* ── Lead Time Table ── */

/** Column widths: Phase / Days / Description */
export const LEAD_TIME_COLS = '25% 15% 1fr';
