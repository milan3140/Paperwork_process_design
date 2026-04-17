/**
 * FactoryBomDocument v2 — Factory-facing RFQ BOM for supplier quoting
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ PURPOSE                                                 │
 * │ Renders a printable, multi-page Letter-size (215.9mm ×  │
 * │ 279.4mm) PDF document that InstaVoxel sends to Chinese  │
 * │ CNC factories for quoting. Factories print it, hand-    │
 * │ write prices/delivery in the blank cells, and return it. │
 * └─────────────────────────────────────────────────────────┘
 *
 * ## Page Layout (per page)
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ HEADER BAND  (purple, logo + "BOM 表" + issueDate)  │  44px fixed
 * ├─────────────────────────────────────────────────────┤
 * │ doc-content (flex:1, gap: 12px)                     │
 * │   [Page 1 only] Title: "RFQ BOM" + orderId + 最晚.. │
 * │   [Page 1 only] Metadata row (in <thead>):          │
 * │     零件種類: N 種   │   共 X / Y / Z 件            │
 * │     ↑ guide line     │   ↑ guide line               │
 * │   Table header: 尺寸圖紙│工件號│材質│表處│數量│單價│交期│
 * │   Part rows...                                      │
 * │   [Last page] Summary: 方案一/二/三                  │
 * │   [Last page] 加工備註 (DFM blank lines)             │
 * ├─────────────────────────────────────────────────────┤
 * │ 注意事項 (manufacturing disclaimers, every page)     │
 * ├─────────────────────────────────────────────────────┤
 * │ FOOTER  (orderCode + URL + email + Page X of Y)     │
 * └─────────────────────────────────────────────────────┘
 *
 * ## 5-Column Table Structure
 *
 * │ 尺寸圖紙  │ 工件號 │ 材質   │ 表處   │ 報價 (nested)      │
 * │ 140px     │ 50px  │ 120px │ 100px │ 數量│單價│交期        │
 * │ fixed     │ fixed │ fixed │ fixed │ 60px│flex│98px (fixed)│
 *
 * ## Design Token Dependencies (from Design_Sys_style.css + documents.css)
 *
 * Colors:
 *   --color-primary      Purple brand (#2E0D77)  → header bg, title text
 *   --color-primary-hover Hover state             → button only
 *   --color-error         Red (#B61F1F)           → deadline text
 *   --gray-50..900        Gray scale              → table borders, text, bg
 *
 * Typography:
 *   --doc-text-title       ~18px  → "RFQ BOM" title
 *   --doc-text-subtitle    ~14px  → orderId subtitle
 *   --doc-text-doc-type    11px   → header "BOM 表" + issueDate
 *   --doc-text-part-id     11px   → metadata labels (零件種類, 共...件)
 *   --doc-text-secondary   9px    → section titles (注意事項, 加工備註), dims/weight
 *   --doc-text-thumb-placeholder  7px → "3D" placeholder in thumbnail
 *   --doc-text-footer      8px    → footer text
 *   14px (KEY_VALUE)              → partId, qty numbers, tier totals (hardcoded)
 *   13px                          → material, finish values (hardcoded)
 *   12px                          → deadline text (hardcoded)
 *   10px                          → table headers, labels, 件/$/工作天 (hardcoded)
 *
 * Spacing:
 *   --sp-1..8             4px..32px spacing scale
 *   --doc-sp-half         Half spacing unit
 *   --doc-margin-x        16mm   → page left/right margin
 *   --doc-header-h        44px   → header band height
 *   --doc-content-pad-top 20px   → content area top padding
 *   --doc-content-pad-bottom 16px
 *   --doc-content-gap     24px   → default gap (overridden to 12px here)
 *   --doc-page-w          215.9mm (Letter width)
 *   --doc-page-h          279.4mm (Letter height)
 *
 * Other:
 *   --radius-sm           → thumbnail border radius
 *   --doc-tracking-label  → letter-spacing for labels
 *   --doc-tracking-title  → letter-spacing for titles
 *   --doc-tracking-doc-type → letter-spacing for header doc type
 *
 * ## External Dependencies
 *
 * - Design_Sys_style.css  → CSS custom properties (colors, spacing, typography)
 * - documents.css         → .doc-page, .doc-content, @page print rules
 * - Icons_Print.tsx       → PRINT_ICONS.logoText(height) for header logo (SVG)
 * - DocumentFooter.tsx    → <DocumentFooter docId page totalPages />
 *
 * ## Usage
 *
 * ```tsx
 * import { FactoryBomDocument, type FactoryBomData } from './FactoryBomDocument';
 *
 * const data: FactoryBomData = {
 *   orderCode: 'U26033148F',
 *   orderName: '簡易BOM測試',
 *   issueDate: '4 月 1 日 (三)',
 *   replyDeadline: '4 月 7 日 (二) 下午 4 點前',
 *   parts: [
 *     {
 *       partId: 'P01',
 *       dimsMm: { l: 127, w: 89, h: 45 },  // or string: '127 × 89 × 45'
 *       weight: 0.34,                        // or string: '0.34 kg'
 *       material: '鋁合金 6061-T6',
 *       finish: '黑色陽極氧化',               // '標準' → renders blank
 *       qtyTiers: [1, 5, 10],                // drives sub-rows + summary tiers
 *     },
 *   ],
 *   // Optional:
 *   // notes: ['custom note 1', ...'],   // override default 5 manufacturing notes
 *   // dfmLineCount: 6,                  // override default 4 blank DFM lines
 * };
 *
 * <FactoryBomDocument ref={pdfRef} data={data} />
 * ```
 *
 * ## Auto-Computed Fields (do NOT pass manually)
 *
 * - **零件種類 N 種**: countUniquePartTypes(parts) — unique base partId count
 *     "P02\n(1/2)" and "P02\n(2/2)" share base "P02" → counted as 1 type
 * - **共 X / Y / Z 件**: computeTierTotals(parts, tierCount)
 *     tierCount = max(qtyTiers.length) across all parts
 *     Parts with fewer tiers: highest tier value replicated to fill
 *     Example: P03 has [1, 3] in a 3-tier doc → contributes [1, 3, 3]
 * - **方案一/二/三...**: dynamic, one per tier (tierLabel function)
 * - **Pagination**: ROWS_PAGE_1=5 (first page), ROWS_CONTINUATION=7 (subsequent)
 *
 * Chinese only (lang='zh' always).
 */

import React from 'react';
import { PRINT_ICONS } from './Icons_Print';
import { DocumentFooter } from './DocumentFooter';
import { ContinuedOnNextPage, ContinuedFromPreviousPage } from './ContinuationHints';

/* ═══════════════════════════════════════════════════════════
   Hue-less gray palette — local override of Design_Sys_style.css
   tokens. Base scale has a slight purple hue for brand cohesion;
   Factory BOM overrides to true neutral (R = G = B) at the same
   approximate lightness so visual depth is preserved while the
   chromatic cast is removed. Applied inline on every .doc-page
   so it cascades to all descendants via CSS custom properties.
   ═══════════════════════════════════════════════════════════ */
const HUE_LESS_GRAY_PALETTE: Record<string, string> = {
  '--gray-950': '#0D0D0D',
  '--gray-900': '#1A1A1A',
  '--gray-800': '#2B2B2B',
  '--gray-700': '#3D3D3D',
  '--gray-600': '#565656',
  '--gray-500': '#6B6B6B',
  '--gray-400': '#8E8E8E',
  '--gray-300': '#B5B5B5',
  '--gray-250': '#C8C8C8',
  '--gray-200': '#D8D8D8',
  '--gray-175': '#E8E8E8',
  '--gray-160': '#F5F5F5',
  '--gray-150': '#E4E4E4',
  '--gray-100': '#EDEDED',
  '--gray-75': '#F2F2F2',
  '--gray-60': '#F5F5F5',
  '--gray-50': '#F7F7F7',
};

/* ═══════════════════════════════════════════════════════════
   Types — Public API for data input
   ═══════════════════════════════════════════════════════════ */

/** Structured 3D dimensions in mm. Auto-formatted as "l × w × h". */
export interface Dims3D {
  l: number;  // length
  w: number;  // width
  h: number;  // height
}

export interface FactoryBomPart {
  /** Part identifier. e.g. "P01", "P02".
   *  Used for unique part type counting (零件種類). */
  partId: string;
  /** Optional variant label for same-part material/finish alternatives.
   *  Rendered as small gray "(A)" / "(B)" below partId.
   *  Omit for standalone parts — no label shown.
   *  Example: P02 with variantLabel "A" → displays "P02" + "(A)" below.
   *  All variants still get quoted by the factory; the label just
   *  distinguishes which material/finish option is which. */
  variantLabel?: string;
  /** Thumbnail URL or base64 data URI. Omit for "3D" placeholder. */
  thumbnail?: string;
  /** Dimensions: structured {l, w, h} in mm → auto-formatted "127 × 89 × 45",
   *  or pre-formatted string passed through as-is. */
  dimsMm: Dims3D | string;
  /** Weight: number in kg → auto-formatted "0.34 kg",
   *  or pre-formatted string passed through as-is. */
  weight: number | string;
  /** Material name, displayed at 13px bold. e.g. "鋁合金 6061-T6" */
  material: string;
  /** Surface finish. "標準" (standard) renders as blank to reduce noise.
   *  Other values displayed at 13px bold. e.g. "黑色陽極氧化", "電解拋光" */
  finish: string;
  /** Quantity tiers for quoting. Each value becomes a sub-row in the 報價 column.
   *  e.g. [1, 5, 10] → 3 sub-rows with "1 件", "5 件", "10 件".
   *  The max length across all parts determines the number of Summary 方案 rows. */
  qtyTiers: number[];
  /** Optional per-part note displayed below the part row. */
  note?: string;
}

export interface FactoryBomData {
  /** Machine-readable order code from ERP. e.g. "U26033148F"
   *  Format: [U|T] + YYMMDD + 3 hex chars. Used in footer's docId. */
  orderCode: string;
  /** Chinese codename for factory communication. e.g. "簡易BOM測試"
   *  Displayed next to orderCode in title row as "{orderCode} {orderName}". */
  orderName: string;
  /** Issue date display string. Shown in header band next to "BOM 表".
   *  e.g. "4 月 1 日 (三)" — no auto-formatting, pass final display string. */
  issueDate: string;
  /** Reply deadline display string. Shown in red (--color-error) on title row.
   *  e.g. "4 月 7 日 (二) 下午 4 點前" — no auto-formatting. */
  replyDeadline: string;
  /** Array of parts to quote. Order determines row order in the table.
   *  Auto-computed from parts: itemCount, tierCount, tierTotals, pagination. */
  parts: FactoryBomPart[];
  /** Override default manufacturing notes shown at bottom of every page.
   *  Omit to use DEFAULT_NOTES (5 items). Pass [] to suppress entirely. */
  notes?: string[];
  /** Number of blank dashed lines in the "加工備註" DFM section (last page only).
   *  Default: 4. These are hand-writable lines for factory DFM remarks. */
  dfmLineCount?: number;
  /** Optional order-level note displayed between title and table. */
  orderNote?: string;
}

interface FactoryBomDocumentProps {
  data: FactoryBomData;
  /** When true, render `data.issueDate` as a small thin line directly under
   *  "艾維數位工業" in the top-right brand block. Default false keeps the
   *  original single-line brand header. Used by variants like #/factory-bom-dated. */
  showIssueDateBelowBrand?: boolean;
  /** When true, place the reply-deadline on the RIGHT side of the title row,
   *  bottom-aligned with the orderId. Default false keeps it on the LEFT,
   *  below the orderId. Used by #/factory-bom-sharp.
   *  Mutually exclusive with showIssueDateBelowBrand — if both are set,
   *  showIssueDateBelowBrand wins and deadlineOnRight is ignored. */
  deadlineOnRight?: boolean;
}

/* ═══════════════════════════════════════════════════════════
   Style Constants — Tailwind class strings

   These are composed into className attributes. They reference
   CSS custom properties from Design_Sys_style.css and documents.css.
   ═══════════════════════════════════════════════════════════ */

/** Table header cell style: 10px semibold gray label with bottom border.
 *  Used for: 尺寸圖紙, 工件號, 材質, 表處, and the 報價 sub-headers. */
const TH = [
  'text-[length:10px]',                             // 10px, regular weight (per design direction)
  'text-black tracking-[var(--doc-tracking-label)]', // pure black + letter-spacing
  'py-[var(--sp-1)] px-[var(--sp-2)]',              // vertical 4px, horizontal 8px
  'border-t border-b border-[color:var(--gray-200)]', // top + bottom separator lines
].join(' ');

/** Key value emphasis: 14px regular near-black. Used for tier totals and
 *  itemCount in the metadata row. Weight deliberately regular (not bold) —
 *  thin-weight design direction applies to everything at/below the metadata row. */
const KEY_VALUE = 'text-[length:14px] text-[color:var(--gray-900)]';

/* ── Quotation sub-column widths (inside the nested table in col 5) ──
 *  These must match between: TableHead header, FactoryBomRow data, and Summary.
 *  The middle column (單價) is flex (auto-fills remaining width). */
const QTY_COL = 52;       // 數量 sub-column: "5 件" — fixed width
const DELIVERY_COL = 91;  // 交期 sub-column: "工作天" — fixed width
// 單價 sub-column: flex (remaining width between QTY_COL and DELIVERY_COL)

/* ── Main column widths (the 5 top-level <col> elements) ──
 *  Total fixed = 140+50+120+100 = 410px. Col 5 (報價) takes remaining.
 *  Letter width (215.9mm) at ~3.78px/mm ≈ 816px - 2×16mm margins ≈ 695px usable.
 *  So col 5 ≈ 695 - 410 = 285px for 報價 (contains the nested 數量|單價|交期). */
const COL_THUMBNAIL = 155; // col 1: 3D thumbnail + dims/weight text
const COL_PART_ID = 50;    // col 2: part identifier (P01, P02, etc.)
const COL_MATERIAL = 120;  // col 3: material name
const COL_FINISH = 100;    // col 4: surface finish
// col 5 = remaining (報價): contains nested table with QTY_COL | flex | DELIVERY_COL

/* ═══════════════════════════════════════════════════════════
   Helpers — Pure functions, no side effects
   ═══════════════════════════════════════════════════════════ */

/** Format Dims3D to display string "l × w × h", or pass through if already a string.
 *  The × character is U+00D7 (multiplication sign), not lowercase x. */
export function formatDims(dims: Dims3D | string): string {
  if (typeof dims === 'string') return dims;
  return `${dims.l.toFixed(1)} \u00d7 ${dims.w.toFixed(1)} \u00d7 ${dims.h.toFixed(1)}`;
}

/** Format weight number to "X.XX kg", or pass through if already a string. */
export function formatWeight(weight: number | string): string {
  if (typeof weight === 'string') return weight;
  return `${weight.toFixed(2)} kg`;
}

/** Count unique part types by partId.
 *  Same partId with different variantLabels (A/B) = same part type → counted once.
 *  Same partId repeated (P05 ×4) → counted once.
 *  Used to display "零件種類：N 種". */
export function countUniquePartTypes(parts: FactoryBomPart[]): number {
  return new Set(parts.map(p => p.partId)).size;
}

/** Chinese ordinal number labels for summary tier rows.
 *  tierLabel(0) → "方案一", tierLabel(1) → "方案二", etc.
 *  Falls back to numeric for index >= 10: tierLabel(10) → "方案11". */
const ZH_ORDINALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
export function tierLabel(index: number): string {
  return `方案${ZH_ORDINALS[index] ?? (index + 1)}`;
}

/** Determine how many pricing tiers (= summary rows) the document needs.
 *  Returns the maximum qtyTiers.length across all parts.
 *  Example: if parts have qtyTiers of lengths [3, 2, 3, 2] → returns 3.
 *  Empty parts array → returns 1 (minimum 1 tier). */
export function getMaxTierCount(parts: FactoryBomPart[]): number {
  return parts.length === 0 ? 1 : Math.max(...parts.map(p => p.qtyTiers.length));
}

/** Compute per-tier quantity totals across all parts.
 *
 *  Algorithm: for each tier index t (0..tierCount-1), sum every part's
 *  t-th smallest quantity. Parts with fewer tiers than tierCount have
 *  their highest tier value replicated to fill.
 *
 *  Example with tierCount=3:
 *    P01 qtyTiers=[1,5,10]  sorted=[1,5,10]   → contributes [1, 5, 10]
 *    P03 qtyTiers=[1,3]     sorted=[1,3]       → contributes [1, 3, 3]  (3 replicated)
 *    P05 qtyTiers=[5,10,50] sorted=[5,10,50]   → contributes [5, 10, 50]
 *                                         Totals: [7, 18, 63]
 *
 *  These totals are displayed as "共 7 / 18 / 63 件" in the metadata row.
 *
 *  @param parts   All parts in the BOM
 *  @param tierCount  Number of tiers (from getMaxTierCount)
 *  @returns Array of length tierCount with per-tier sums */
export function computeTierTotals(parts: FactoryBomPart[], tierCount: number): number[] {
  const totals = new Array(tierCount).fill(0);
  for (const p of parts) {
    const sorted = [...p.qtyTiers].sort((a, b) => a - b);
    for (let t = 0; t < tierCount; t++) {
      totals[t] += sorted[Math.min(t, sorted.length - 1)];
    }
  }
  return totals;
}

/* ═══════════════════════════════════════════════════════════
   Notes — Manufacturing disclaimers (bottom of every page)

   DEFAULT_NOTES: 5 standard CNC manufacturing disclaimers in
   Traditional Chinese. Can be overridden via data.notes prop.
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_NOTES = [
  '對於所有小於305mm的尺寸，若圖紙上沒有明確指定的公差（或未提供PDF圖紙），則適用默認標準公差+/-12.7條',
  '若圖紙或訂單PO沒有特別指定，所有螺紋的默認標準為2A/2B（美規）或6g/6H（公規）',
  '除非有專門說明，所有鋒利邊緣均要去毛邊（尺寸為0.25-0.75mm，R角或C角皆可）。成品不可割手。',
  '所有工件加工完成後要立即清潔，成品不可有任何氧化變黑痕跡。關於清潔方式如有疑問請與艾維聯繫。',
  '本單所列交期天數均以工作天計算。若需改以日曆天報價，請於備註欄明確標示，或逕洽艾維確認。',
];

/* ── DFM Notes Section ──
 *  Blank ruled area on last page only. Factory writes DFM (Design for
 *  Manufacturability) remarks here by hand. Lines are dashed, flex-1
 *  to evenly distribute available vertical space. */
function DfmNotesSection({ lineCount = 4 }: { lineCount?: number }) {
  return (
    <div className="flex-1 flex flex-col pt-[var(--sp-3)]">
      <div className="text-[length:var(--doc-text-secondary)] border-b border-[color:var(--gray-200)] pb-[var(--doc-sp-half)] mb-[var(--sp-2)]" style={{ color: '#000000' }}>
        加工備註
      </div>
      <div className="flex-1 flex flex-col">
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className="flex-1"
          />
        ))}
      </div>
    </div>
  );
}

/* ── Notes Section ──
 *  Rendered at the bottom of EVERY page (between doc-content and footer).
 *  Uses mt-auto to push down to the bottom of the page.
 *  Accepts optional notes override; falls back to DEFAULT_NOTES.
 *  Pass notes={[]} to suppress entirely (returns null). */
function NotesSection({ notes }: { notes?: string[] }) {
  const items = notes ?? DEFAULT_NOTES;
  if (items.length === 0) return null;
  return (
    <div className="mt-auto pt-[var(--sp-4)] pb-[10px]" style={{ paddingLeft: 'var(--doc-margin-x)', paddingRight: 'var(--doc-margin-x)' }}>
      <div className="text-[length:var(--doc-text-secondary)] border-b border-[color:var(--gray-200)] pb-[var(--doc-sp-half)] mb-[var(--sp-2)]" style={{ color: '#000000' }}>
        注意事項
      </div>
      <div className="flex flex-col gap-[var(--sp-1)]">
        {items.map((note, i) => (
          <div key={i} className="text-[length:10px] leading-[1.6]" style={{ color: '#000000' }}>
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component — FactoryBomDocument
   ═══════════════════════════════════════════════════════════ */

/* ── Pagination constants ──
 *  Page 1 has title + metadata overhead → fits fewer part rows.
 *  Continuation pages only have the table header → more rows.
 *  Tune these if page layout changes (e.g. font size, spacing). */
const ROWS_PAGE_1 = 5;
const ROWS_CONTINUATION = 4;

/** Split parts array into pages. Returns array of part arrays.
 *  Page 0 gets ROWS_PAGE_1 parts; each subsequent page gets ROWS_CONTINUATION. */
export function paginateParts(parts: FactoryBomPart[]) {
  const pages: FactoryBomPart[][] = [];
  let remaining = [...parts];
  pages.push(remaining.slice(0, ROWS_PAGE_1));
  remaining = remaining.slice(ROWS_PAGE_1);
  while (remaining.length > 0) {
    pages.push(remaining.slice(0, ROWS_CONTINUATION));
    remaining = remaining.slice(ROWS_CONTINUATION);
  }
  return pages;
}

/* ── Shared <colgroup> — defines the 5-column fixed-width layout ──
 *  Must be included in every <table> to ensure column alignment.
 *  Col 5 has no width → takes remaining space (flex behavior in fixed table). */
function TableColgroup() {
  return (
    <colgroup>
      <col style={{ width: COL_PART_ID }} />
      <col style={{ width: COL_THUMBNAIL }} />
      <col style={{ width: COL_MATERIAL }} />
      <col style={{ width: COL_FINISH }} />
      <col /> {/* col 5: 報價, remaining width */}
    </colgroup>
  );
}

/* ── Header Band ──
 *  Purple bar at the top of every page. Contains:
 *  - Left: InstaVoxel logo (SVG from PRINT_ICONS, height 22px)
 *  - Right: "BOM 表" label + issueDate in lighter white
 *  Height controlled by --doc-header-h (44px). */
function HeaderBand({ data }: { data: FactoryBomData }) {
  return (
    <div
      className="flex items-center justify-between shrink-0 bg-[var(--color-primary)]"
      style={{ height: 'var(--doc-header-h)', padding: '0 var(--doc-margin-x)' }}
    >
      <div className="flex items-center gap-[var(--sp-2)]">
        {PRINT_ICONS.logo(28)}
        <span className="text-white font-bold" style={{ fontSize: 18, lineHeight: '28px' }}>艾維數位工業</span>
      </div>
      <div className="flex items-center gap-[var(--sp-3)]">
        <span className="text-white/85 font-semibold tracking-[var(--doc-tracking-doc-type)] uppercase" style={{ fontSize: 14 }}>
          詢價單
        </span>
        <span className="text-white/60 font-normal" style={{ fontSize: 14 }}>
          {data.issueDate}
        </span>
      </div>
    </div>
  );
}

/** FactoryBomDocument — Main exported component.
 *
 *  Accepts a ref (for print handler access to DOM) and FactoryBomData.
 *  Renders one or more doc-page divs (Letter size) with:
 *  - Page 1: header, title row, metadata (in thead), table data, [summary], [DFM], notes, footer
 *  - Page 2+: header, table data (continued), [summary], [DFM], notes, footer
 *
 *  The outer wrapper div uses gap: 32px between pages for on-screen preview.
 *  In print mode, each .doc-page has page-break-after: always (from documents.css). */
export const FactoryBomDocument = React.forwardRef<HTMLDivElement, FactoryBomDocumentProps>(
  function FactoryBomDocument({ data, showIssueDateBelowBrand = false, deadlineOnRight = false }, ref) {
    // showIssueDateBelowBrand wins if both flags are accidentally set.
    const placeDeadlineOnRight = deadlineOnRight && !showIssueDateBelowBrand;
    /* ── Derived values (auto-computed from data.parts) ── */
    const tierCount = getMaxTierCount(data.parts);                    // e.g. 3 for [1,5,10]
    const tierTotals = computeTierTotals(data.parts, tierCount);      // e.g. [31, 66, 249]
    const itemCount = countUniquePartTypes(data.parts);               // e.g. 5 for P01..P05
    const displayOrderId = `${data.orderCode} ${data.orderName}`;     // e.g. "U26033148F 簡易BOM測試"
    const pages = paginateParts(data.parts);                          // split into page arrays
    const totalPages = pages.length;

    return (
      /* Outer wrapper: flex column with 32px gap for on-screen page separation.
       * NOT a doc-page itself — individual pages are the doc-page divs inside. */
      <div ref={ref} data-comp="FactoryBomDocument" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {pages.map((pageParts, pageIdx) => {
          const isFirst = pageIdx === 0;
          const isLast = pageIdx === totalPages - 1;
          /* Global index offset for React keys (page 0 starts at 0,
           * page 1 starts at ROWS_PAGE_1, page 2 at ROWS_PAGE_1+ROWS_CONTINUATION, etc.) */
          const offset = isFirst ? 0 : ROWS_PAGE_1 + (pageIdx - 1) * ROWS_CONTINUATION;

          return (
            /* Each page is a fixed-height Letter-size container.
             * height: var(--doc-page-h) enforces real page boundaries for on-screen preview.
             * The .doc-page class adds: width, flex column, background, font, print rules. */
            <div
              key={pageIdx}
              className="doc-page"
              style={{
                ...HUE_LESS_GRAY_PALETTE,
                height: 'var(--doc-page-h)',
                // Geist Sans for the entire page — sharper, more professional geometric sans-serif.
                // CJK fallbacks preserve Traditional Chinese rendering.
                fontFamily: '"Geist", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              } as React.CSSProperties}
            >

              {/* doc-content: flex:1 fills remaining height. gap overridden to 12px (--sp-3)
               *  from the default 24px (--doc-content-gap) for tighter BOM layout.
               *  paddingTop overridden to 40px (from --doc-content-pad-top=20px) — extra
               *  breathing room above the "詢價單" title per design direction. */}
              <div className="doc-content" style={{ gap: 'var(--sp-3)', paddingTop: 40 }}>
                {/* ── Title + deadline + instruction (every page) ── */}
                {/* 標題區拆成「上半列」+「下方 deadline」兩段：
                 *    · 上半列：左邊 詢價單 / orderId；右邊 Logo+艾維數位工業 (上) + 發行日期 (下)。
                 *      items-stretch + justify-between 使右側高度等同左側兩行總高，讓發行日期的
                 *      底端對齊左側 orderId 底端。
                 *    · 下方 deadline：脫離上半列，置於左側 orderId 下方獨立一行。 */}
                <div className="flex items-stretch justify-between" style={{ marginBottom: 6 }}>
                  <div className="flex flex-col gap-[var(--sp-1)]">
                    <span className="font-bold tracking-[var(--doc-tracking-title)]" style={{ fontSize: 28, lineHeight: 1, color: '#000000' }}>
                      詢價單
                    </span>
                    <span className="font-bold tracking-[var(--doc-tracking-title)]" style={{ fontSize: 22, lineHeight: 1, color: '#000000' }}>
                      {displayOrderId}
                    </span>
                  </div>
                  <div className="flex flex-col items-end justify-between" style={{ color: '#000' }}>
                    <div className="flex items-center gap-[var(--sp-2)]">
                      {PRINT_ICONS.logo(28, 'currentColor')}
                      <span className="font-bold" style={{ fontSize: 22, lineHeight: 1 }}>
                        艾維數位工業
                      </span>
                    </div>
                    {showIssueDateBelowBrand && (
                      // marginRight: -7px = -10 (full-width 」 trailing-whitespace
                      // compensation) + 3 (shift visible text 3px to the left).
                      <span style={{ fontSize: 13, fontWeight: 400, color: '#8C8C8C', lineHeight: 1, marginRight: -7 }}>
                        {data.issueDate}
                      </span>
                    )}
                    {placeDeadlineOnRight && (
                      <span className="font-bold text-[color:var(--color-error)]" style={{ fontSize: 18, lineHeight: 1, marginBottom: 1 }}>
                        報價截止時間：{data.replyDeadline}
                      </span>
                    )}
                  </div>
                </div>
                {!placeDeadlineOnRight && (
                  <span className="font-bold text-[color:var(--color-error)]" style={{ fontSize: 18, lineHeight: 1, marginBottom: 6 }}>
                    報價截止時間：{data.replyDeadline}
                  </span>
                )}
                {isFirst && (
                  <div
                    style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '20px var(--sp-3)' }}
                  >
                    <div className="text-[length:14px] leading-[1.8] text-center" style={{ color: '#000000' }}>
                      請依各零件規格評估可製作性，並於右側報價欄填寫<strong>單價</strong>及<strong>交期</strong>（工作天）。表末請填寫<strong>整單交期</strong>。
                    </div>
                    <div className="text-[length:var(--doc-text-grid-label)] leading-[1.8]" style={{ color: '#000000' }}>
                      若有無法加工之項目，請於加工備註欄說明原因及可行的替代方案。如需討論公差、材料規格或製程等技術細節，請明確記載於加工備註欄，以利後續確認。
                    </div>
                  </div>
                )}

                {/* Continued from previous page hint (after title+instruction) */}
                {!isFirst && <ContinuedFromPreviousPage page={pageIdx + 1} label={`< 第 ${pageIdx + 1}/${totalPages} 頁 — 承上頁`} fontSize={12} color="#000000" fontWeight={400} />}

                {/* ── Table ── */}
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <TableColgroup />
                  <thead>
                    {/* ── Metadata row (first page only) ──
                     *  Placed INSIDE <thead> so border-l guide lines connect seamlessly
                     *  to the header row below (no gap from flex/grid spacing).
                     *
                     *  Guide lines: absolute-positioned border-l spans, height 66%,
                     *  extending from bottom of cell upward. They visually connect
                     *  the metadata text to the corresponding table column below.
                     *
                     *  Left guide (left: -0.5px): aligns with col 1 (尺寸圖紙) left border.
                     *    -0.5px compensates for border-collapse rendering at table edge.
                     *  Right guide (left: 0px): aligns with col 5 (報價) left border.
                     *    0px works here because it's a cell-to-cell boundary, not table edge. */}
                    {isFirst && (
                      <tr>
                        <td colSpan={4} />
                        <td
                          className="py-[var(--sp-2)] px-[var(--sp-2)] whitespace-nowrap text-right"
                          style={{ verticalAlign: "middle" }}
                        >
                          <span className="text-[length:14px] text-[color:var(--gray-800)]">
                            零件種類：<span className={KEY_VALUE}>{itemCount}</span> 種
                          </span>
                          <span className="text-[length:14px] text-[color:var(--gray-300)] mx-[var(--sp-2)]">|</span>
                          <span className="text-[length:14px] text-[color:var(--gray-800)]">共{" "}</span>
                          <span className={KEY_VALUE}>{tierTotals[0]}</span>
                          {tierTotals.length > 1 && (
                            <>
                              <span
                                className="inline-block text-[color:var(--gray-300)]"
                                style={{ width: 12, height: '1.5px', background: 'var(--gray-400)', verticalAlign: 'middle', margin: '0 3px', borderRadius: 1 }}
                              />
                              <span className={KEY_VALUE}>{tierTotals[tierTotals.length - 1]}</span>
                            </>
                          )}
                          <span className="text-[length:14px] text-[color:var(--gray-800)]">{" "}件</span>
                        </td>
                      </tr>
                    )}

                    {/* ── Column headers ──
                     *  bg-[var(--gray-50)] gives subtle background.
                     *  First page: border-l on col 1 continues the guide line from metadata.
                     *  Col 5 (報價) uses a nested <table> for sub-column alignment
                     *  (數量|單價|交期) with dashed internal borders.
                     *  The outer td uses style={{ padding: 0 }} (not p-0 class) to
                     *  force-override TH's px-[var(--sp-2)] — Tailwind specificity issue. */}
                    <tr>
                      <td className={`${TH} text-center border-r border-r-[var(--gray-200)]`}>工件號</td>
                      <td className={`${TH} text-center border-r border-r-[var(--gray-200)]`}>尺寸圖紙</td>
                      <td className={`${TH} text-center border-r border-r-[var(--gray-200)]`}>材質</td>
                      <td className={`${TH} text-center border-r border-r-[var(--gray-200)]`}>表處</td>
                      <td className={TH} style={{ padding: 0 }}>
                        {/* Nested table for 報價 sub-columns. tableLayout:fixed ensures
                         *  sub-column widths match the data rows' nested tables exactly. */}
                        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                          <colgroup>
                            <col style={{ width: QTY_COL }} />
                            <col /> {/* 單價: flex */}
                            <col style={{ width: DELIVERY_COL }} />
                          </colgroup>
                          <tbody><tr>
                            <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]"
                                style={{ borderRight: '1px dashed var(--gray-200)' }}>
                              <span className="text-[length:10px] text-black tracking-[var(--doc-tracking-label)]">數量</span>
                            </td>
                            <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]"
                                style={{ borderRight: '1px dashed var(--gray-200)' }}>
                              <span className="text-[length:10px] text-black tracking-[var(--doc-tracking-label)]">單價</span>
                            </td>
                            <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]">
                              <span className="text-[length:10px] text-black tracking-[var(--doc-tracking-label)]">交期</span>
                            </td>
                          </tr></tbody>
                        </table>
                      </td>
                    </tr>
                  </thead>

                  <tbody>
                    {pageParts.map((part, i) => (
                      <FactoryBomRow
                        key={`${part.partId}-${offset + i}`}
                        part={part}
                        isLast={!isLast && i === pageParts.length - 1}
                      />
                    ))}
                    {/* Summary rows only on the last page */}
                    {isLast && <FactoryBomSummary />}
                  </tbody>
                </table>

                {/* DFM notes: blank hand-writable area, last page only.
                 *  Uses flex-1 to fill remaining vertical space in doc-content. */}
                {isLast && <DfmNotesSection lineCount={data.dfmLineCount} />}

                {/* Continued on next page hint */}
                {!isLast && <ContinuedOnNextPage page={pageIdx + 1} label={`第 ${pageIdx + 1}/${totalPages} 頁 — 續下頁 >`} fontSize={12} color="#000000" fontWeight={400} marginTop={12} marginBottom={4} />}
              </div>

              {/* Notes + Footer render outside doc-content, at page bottom.
               *  NotesSection uses mt-auto to push itself down if doc-content doesn't fill.
               *  Suppressed on page 1 — first page already carries the instruction box,
               *  so repeating 注意事項 there would compete for space. Shows on page 2+. */}
              {!isFirst && <NotesSection notes={data.notes} />}
              <DocumentFooter docId={data.orderCode} page={pageIdx + 1} totalPages={totalPages} />
            </div>
          );
        })}
      </div>
    );
  }
);

/* ═══════════════════════════════════════════════════════════
   FactoryBomRow — Single part row (5 columns)

   Renders one <tr> per part. The 5th column (報價) contains a
   nested <table> with one sub-row per qtyTier value.

   Column layout matches TableColgroup:
     col 1: thumbnail (100×80px placeholder or image) + dims + weight
     col 2: partId (14px bold, supports \n for sub-part notation)
     col 3: material (13px bold)
     col 4: finish (13px bold, "標準" renders blank)
     col 5: nested table with QTY_COL | flex | DELIVERY_COL
   ═══════════════════════════════════════════════════════════ */

function FactoryBomRow({ part, isLast }: { part: FactoryBomPart; isLast: boolean }) {
  return (
    <tr className={isLast ? '' : 'border-b border-[color:var(--gray-300)]'}>
      {/* ── PART ID — 14px bold (KEY_VALUE) + optional variant label ── */}
      <td className={`py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-200)]`}>
        <div className="text-[length:14px] font-normal text-[color:var(--gray-900)]">{part.partId}</div>
        {part.variantLabel && (
          <div className="text-[length:10px] mt-[2px]" style={{ color: '#000000', fontWeight: 400 }}>
            ({part.variantLabel})
          </div>
        )}
      </td>

      {/* ── THUMBNAIL + DIMENSIONS ── */}
      <td className="py-[var(--sp-3)] px-0 text-center align-middle border-r border-r-[var(--gray-200)]">
        <div
          className="rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center mb-[var(--sp-2)] mx-auto"
          style={{ width: 100, height: 80 }}
        >
          {part.thumbnail ? (
            <img src={part.thumbnail} alt={part.partId} className="w-full h-full object-contain" />
          ) : (
            <span className="text-[length:var(--doc-text-thumb-placeholder)] text-[color:var(--gray-300)] uppercase tracking-[var(--doc-tracking-label)]">
              3D
            </span>
          )}
        </div>
        <div className="text-[length:var(--doc-text-secondary)] leading-[1.6] whitespace-nowrap text-center" style={{ color: '#000000' }}>
          {formatDims(part.dimsMm)} mm{'\u00a0\u00b7\u00a0'}{formatWeight(part.weight)}
        </div>
      </td>

      {/* ── MATERIAL — 13px bold ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-200)] text-[length:13px] font-normal text-[color:var(--gray-900)]">
        {part.material}
      </td>

      {/* ── FINISH — 13px, "標準" renders blank ──
       *  Business rule: "標準" (standard/as-machined) is the default finish.
       *  Showing it adds no information → blank to reduce visual noise.
       *  Only non-default finishes are displayed. */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-200)] text-[length:13px] font-normal text-[color:var(--gray-900)]">
        {part.finish !== '標準' ? part.finish : null}
      </td>

      {/* ── QUOTATION — Nested table for sub-column alignment ──
       *  One sub-row per qtyTier value. Factory fills in 單價 and 交期 by hand.
       *  height:1 + h-full on nested table ensures the nested table stretches
       *  to fill the outer td height (needed for border rendering).
       *  Dashed borders between sub-columns (lighter than solid col borders). */}
      <td className="py-0 px-0" style={{ height: 1 }}>
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: QTY_COL }} />
            <col /> {/* 單價: flex */}
            <col style={{ width: DELIVERY_COL }} />
          </colgroup>
          <tbody>
            {part.qtyTiers.map((qty, i) => (
              <tr key={qty} className={i < part.qtyTiers.length - 1 ? 'border-b border-[color:var(--gray-200)]' : ''}>
                {/* 數量: "5 件" — number 16px regular weight, 件 in 10px gray */}
                <td className="text-center align-middle px-[var(--sp-1)]"
                    style={{ borderRight: '1px dashed var(--gray-200)' }}>
                  <span className="text-[color:var(--gray-900)]" style={{ fontSize: 16, fontWeight: 400 }}>{qty}</span>
                  <span className="text-[length:10px] text-[color:var(--gray-400)] ml-[3px]">件</span>
                </td>
                {/* 單價: "$" placeholder — factory fills in the price */}
                <td className="align-middle px-[var(--sp-2)]"
                    style={{ borderRight: '1px dashed var(--gray-200)' }}>
                  <span className="text-[length:10px] text-[color:var(--gray-400)]">$</span>
                </td>
                {/* 交期: "工作天" — factory fills in the number of working days */}
                <td className="align-middle px-[var(--sp-2)] text-right">
                  <span className="text-[length:10px] text-[color:var(--gray-400)]">工作天</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════
   FactoryBomSummary — Pricing tier summary rows

   Rendered at the bottom of the last page's table <tbody>.
   One row per pricing tier (dynamic count based on max qtyTiers.length).

   Each row layout (5 cells matching the table columns):

   │ 方案一       │ 整單共  │ (blank) │ 件 ,        │ 交期共    工作天 │
   │ col1 center  │ col2 c  │ col3    │ col4 right  │ col5 flex       │
   │ 尺寸圖紙 col │ 工件號  │ 材質    │ 表處        │ 報價             │

   Alignment details:
   - "方案一": centered in col 1 (尺寸圖紙 column)
   - "整單共": centered in col 2 (aligned with 工件號 header)
   - col 3: blank fill-in area for factory to write total quantity
   - "件": right-aligned in col 4; comma absolutely positioned at the
     right border of col 4 (translateX(50%) centers it on the border)
   - "交期共": left-aligned in col 5; "工作天": right-aligned (flex between)
     pr-[var(--sp-2)] matches the data row's delivery cell right padding,
     ensuring "工作天" right-aligns with the "工作天" text above.
   ═══════════════════════════════════════════════════════════ */

/** Summary row label style: 10px regular near-black. Used for
 *  方案一, 整單共, 件, 逗號, 交期共, 工作天.
 *  Weight regular (not bold) — thin-weight design direction. */
const LABEL = 'text-[length:10px] text-[color:var(--gray-900)]';

function FactoryBomSummary() {
  return (
    <tr className="border-t border-t-[var(--gray-400)]">
      <td
        colSpan={4}
        style={{ paddingTop: 14, paddingBottom: 8, paddingLeft: 'var(--sp-2)', paddingRight: 'var(--sp-3)', verticalAlign: 'middle' }}
      >
        <div
          className="text-[color:var(--gray-400)]"
          style={{ fontSize: 13, lineHeight: 1.7 }}
        >
          請於右側「整單交期」欄填寫整單零件製作所需的工作天數，<br />
          並於下方「加工備註」記載需要溝通的加工細節，並回傳填妥資料。
        </div>
      </td>
      <td style={{ paddingTop: 40, paddingBottom: 'var(--sp-3)', paddingLeft: 'var(--sp-3)', paddingRight: 'var(--sp-2)' }}>
        <div className="flex items-baseline">
          <span className="text-[color:var(--gray-900)]" style={{ fontSize: 13 }}>整單交期</span>
          <span className="flex-1" />
          <span className="text-[color:var(--gray-900)]" style={{ fontSize: 13 }}>工作天</span>
        </div>
      </td>
    </tr>
  );
}

export default FactoryBomDocument;
