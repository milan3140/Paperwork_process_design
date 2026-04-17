/**
 * SummaryDocument — Internal order brief (single-page, monochrome + Geist Sans)
 *
 * Ports the legacy static Summary.html into the shared React document pipeline:
 *   - Renders a single `.doc-page` (no pagination needed; content is bounded).
 *   - Uses `DocumentHeader` for the brand band — identical to Invoice / CoC / PackingSlip.
 *   - Custom internal footer: docId + descriptor + `Internal` tag + page number
 *     (deliberately omits website/email — this document never leaves the factory).
 *   - Title is the only saturated color on the page; everything else is grayscale.
 *   - Font stack: Geist Sans (loaded globally via demo/index.html).
 *   - Download PDF goes through the standard `DownloadPdfButton` →
 *     `buildHtmlFromDom()` → Puppeteer pipeline, same as all other documents.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, DocumentHeader.tsx, Icons_Print.tsx
 */

import React from 'react';
import { DocumentHeader } from './DocumentHeader';
import { PRINT_ICONS } from './Icons_Print';
import { MODEL_SHOT_1 as shot1, MODEL_SHOT_2 as shot2 } from './_assets';

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function toChineseNum(n: number): string {
  return n >= 0 && n <= 10 ? CN_DIGITS[n] : String(n);
}

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface SummarySpec {
  k: string;
  /** Value — pass JSX with `<span className="s-hi">…</span>` to highlight
   *  portions (or the whole value) in primary color + bold. */
  v: React.ReactNode;
}

export interface SummaryPart {
  partId: string;
  filename: string;
  dimsMm: string;         // e.g. "127 × 89 × 45"
  dimsIn: string;         // e.g. "5.00 × 3.50 × 1.77"
  weight: string;         // e.g. "342 g"
  qty: string | number;   // number or "待定"
  thumbnail: 1 | 2;       // which preset 3D shot to use
  specs: { k: string; v: string }[];
  notes: string[];
}

export interface SummaryScheduleRow {
  stage: string;
  /** Date — pass JSX to highlight (e.g. earliest/critical deadline). */
  date: React.ReactNode;
  note: React.ReactNode;
  /** Optional 4th column — typically shows the downstream buffer/rationale
   *  (e.g. "留 2 天質檢緩衝"). Omit to leave the cell blank. */
  buffer?: React.ReactNode;
}

export interface SummaryData {
  quoteId: string;
  orderName: string;
  issued: string;
  pm: string;

  signatureSlots: string[]; // e.g. ['預習', '預習複查', '質檢', '質檢複查']

  schedule: SummaryScheduleRow[];
  orderSummary: SummarySpec[];
  parts: SummaryPart[];

  /** Footer descriptor — short phrase shown between docId and "Internal" tag */
  descriptor?: string; // defaults to "Order Brief"
}

interface SummaryDocumentProps {
  data: SummaryData;
  /**
   * Visual variant.
   * - `'default'`: brand-purple title + header band (Summary as shipped).
   * - `'sharp'`: pure grayscale — 90% black title, black header, sharper font
   *   stack (no Microsoft JhengHei fallback). Goal: high contrast & crisp edges.
   */
  variant?: 'default' | 'sharp';
}

/* ═══════════════════════════════════════════════════════════
   Scoped stylesheet (injected once per session via <style>)
   ═══════════════════════════════════════════════════════════ */

const SUMMARY_CSS = `
[data-comp="SummaryDocument"] {
  --s-primary: #2E0D77;    /* title color — flipped to 90% black in sharp variant */
  --s-highlight: #2E0D77;  /* .s-hi accent — ALWAYS brand purple, both variants */
  --s-ink: #111;
  --s-ink-soft: #333;
  --s-ink-muted: #666;
  --s-ink-faint: #999;
  --s-line: #D4D4D4;
  --s-line-soft: #E5E5E5;
  --s-surface: #F5F5F5;
  font-family: "Geist", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 10pt;
  color: #1a1a1a;
  line-height: 1.4;
  font-feature-settings: "ss01", "cv11";
}

[data-comp="SummaryDocument"] .s-body {
  flex: 1;
  padding: 6mm 12mm 4mm 12mm;
  display: flex;
  flex-direction: column;
  gap: 4mm;
  overflow: hidden;
}

[data-comp="SummaryDocument"] .s-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 3mm;
  border-bottom: 1.2pt solid var(--s-ink);
}
[data-comp="SummaryDocument"] .s-title-line {
  display: flex;
  align-items: baseline;
  gap: 4mm;
}
[data-comp="SummaryDocument"] .s-quote-id {
  font-size: 28px;
  font-weight: 700;
  color: var(--s-primary);
  letter-spacing: 0.3pt;
  line-height: 1.15;
}
[data-comp="SummaryDocument"] .s-order-name {
  font-size: 28px;
  font-weight: 600;
  color: var(--s-primary);
  line-height: 1.15;
}
[data-comp="SummaryDocument"] .s-meta {
  text-align: right;
  font-size: 8.5pt;
  color: var(--s-ink-muted);
  line-height: 1.5;
}
[data-comp="SummaryDocument"] .s-meta .s-label {
  color: var(--s-ink-faint);
  font-size: 7.5pt;
  letter-spacing: 0.3pt;
}

/* Highlight span — used inline to mark critical values (earliest deadline,
   tight tolerance, key material requirement). Uses --s-highlight which is
   brand purple in BOTH variants: in sharp it's deliberately the only
   saturated color on an otherwise grayscale page, so highlights pop. */
[data-comp="SummaryDocument"] .s-hi {
  color: var(--s-highlight);
  font-weight: 700;
}

[data-comp="SummaryDocument"] .s-section-label {
  font-size: 9pt;
  font-weight: 700;
  color: var(--s-ink);
  letter-spacing: 1.2pt;
  padding-bottom: 1.2mm;
  margin-bottom: 2mm;
  border-bottom: 0.5pt solid var(--s-line);
  text-transform: uppercase;
}

/* Authorization */
[data-comp="SummaryDocument"] .s-auth-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 4mm;
  font-size: 8.5pt;
}
[data-comp="SummaryDocument"] .s-sig-slot {
  display: flex;
  flex-direction: column;
  gap: 1mm;
  padding: 1mm 0 0 0;
}
[data-comp="SummaryDocument"] .s-sig-slot .s-role {
  font-weight: 300;
  color: var(--s-ink);
  font-size: 8pt;
  letter-spacing: 0.3pt;
}
[data-comp="SummaryDocument"] .s-sig-slot .s-line {
  border-bottom: 0.6pt solid var(--s-ink-soft);
  height: 35px;
}
[data-comp="SummaryDocument"] .s-sig-slot .s-date-label {
  color: var(--s-ink-faint);
  font-size: 7pt;
  margin-top: 0.5mm;
}

/* Delivery schedule */
[data-comp="SummaryDocument"] .s-schedule {
  width: 100%;
  border-collapse: collapse;
  font-size: 9.5pt;
}
[data-comp="SummaryDocument"] .s-schedule td {
  padding: 1.8mm 2.5mm;
  border-bottom: 0.3pt solid var(--s-line);
  vertical-align: middle;
}
[data-comp="SummaryDocument"] .s-schedule tr:last-child td { border-bottom: none; }
[data-comp="SummaryDocument"] .s-schedule .s-stage {
  width: 40mm;
  font-weight: 600;
  color: var(--s-ink);
  background: var(--s-surface);
}
[data-comp="SummaryDocument"] .s-schedule .s-date {
  width: 45mm;
  font-weight: 700;
  color: var(--s-ink);
  font-size: 10.5pt;
}
[data-comp="SummaryDocument"] .s-schedule .s-note {
  color: var(--s-ink-muted);
  font-size: 9pt;
}

/* Order summary grid */
[data-comp="SummaryDocument"] .s-summary-grid {
  display: grid;
  grid-template-columns: 36mm 1fr;
  row-gap: 1.5mm;
  column-gap: 3mm;
  font-size: 9.5pt;
}
[data-comp="SummaryDocument"] .s-summary-grid .s-k {
  color: var(--s-ink-soft);
  font-weight: 600;
}
[data-comp="SummaryDocument"] .s-summary-grid .s-v {
  color: var(--s-ink);
}

/* BOM table */
[data-comp="SummaryDocument"] .s-bom {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  table-layout: fixed;
}
[data-comp="SummaryDocument"] .s-bom thead td {
  background: var(--s-surface);
  color: var(--s-ink-muted);
  font-weight: 600;
  font-size: 7pt;
  letter-spacing: 0.5pt;
  text-transform: uppercase;
  padding: 1.4mm 2mm;
  border-bottom: 0.3pt solid var(--s-line);
}
[data-comp="SummaryDocument"] .s-bom thead .s-col-meas,
[data-comp="SummaryDocument"] .s-bom thead .s-col-qty { text-align: center; }
[data-comp="SummaryDocument"] .s-bom thead .s-col-qty {
  border-left: 0.4pt solid var(--s-line);
  border-right: 0.4pt solid var(--s-line);
}
[data-comp="SummaryDocument"] .s-bom tbody td {
  padding: 2.2mm 2mm;
  vertical-align: top;
  border-bottom: 0.3pt solid var(--s-line);
}
[data-comp="SummaryDocument"] .s-bom tbody tr:last-child td { border-bottom: none; }

[data-comp="SummaryDocument"] .s-bom .s-meas {
  text-align: center;
  vertical-align: middle !important;
}
[data-comp="SummaryDocument"] .s-thumb {
  width: 30mm;
  height: 22mm;
  /* contain (not cover) — preserves the 3D model's full aspect ratio inside
     the box without any edge cropping. May leave letterbox space on one
     axis depending on source image proportions; transparent background
     means that empty space blends into the page (no visible letterbox). */
  object-fit: contain;
  background: transparent;
  display: block;
  margin: 0 auto 1.5mm auto;
}
[data-comp="SummaryDocument"] .s-dims {
  font-size: 7.5pt;
  color: var(--s-ink-soft);
  line-height: 1.4;
  white-space: nowrap;
}
[data-comp="SummaryDocument"] .s-dims .s-sep { color: var(--s-line); margin: 0 1mm; }
[data-comp="SummaryDocument"] .s-dims .s-weight { color: var(--s-ink-muted); }
[data-comp="SummaryDocument"] .s-dims-in {
  font-size: 7pt;
  color: var(--s-ink-faint);
  margin-top: 0.3mm;
  white-space: nowrap;
}

[data-comp="SummaryDocument"] .s-qty {
  text-align: center;
  vertical-align: middle !important;
  border-left: 0.4pt solid var(--s-line);
  border-right: 0.4pt solid var(--s-line);
}
[data-comp="SummaryDocument"] .s-qty .s-val {
  font-size: 13pt;
  font-weight: 700;
  color: var(--s-ink);
  line-height: 1.1;
}
[data-comp="SummaryDocument"] .s-qty .s-val.s-pending {
  color: var(--s-ink-soft);
  font-size: 9pt;
  font-style: italic;
}
[data-comp="SummaryDocument"] .s-qty .s-lab {
  font-size: 6.5pt;
  color: var(--s-ink-faint);
  letter-spacing: 0.6pt;
  text-transform: uppercase;
  margin-top: 0.8mm;
}

[data-comp="SummaryDocument"] .s-desc-header {
  display: flex;
  align-items: baseline;
  gap: 2.5mm;
  margin-bottom: 1.8mm;
  flex-wrap: wrap;
}
[data-comp="SummaryDocument"] .s-desc-header .s-pid {
  font-size: 10pt;
  font-weight: 700;
  color: var(--s-ink);
}
[data-comp="SummaryDocument"] .s-desc-header .s-dot { color: var(--s-line); }
[data-comp="SummaryDocument"] .s-desc-header .s-file {
  font-size: 7.5pt;
  color: var(--s-ink-muted);
  font-family: "Geist Mono", "Courier New", monospace;
}

[data-comp="SummaryDocument"] .s-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* Fixed 4 rows — column 1 always fills with the first 4 dimensional specs
     (公差 / 材質 / 表處 / 表粗) before anything flows to column 2. Parts with
     fewer than 5 specs leave column 2 empty; that's intentional. */
  grid-template-rows: repeat(4, auto);
  grid-auto-flow: column;
  gap: 0.8mm 5mm;
  font-size: 8pt;
}
[data-comp="SummaryDocument"] .s-specs .s-row {
  display: flex;
  gap: 2mm;
  line-height: 1.45;
}
[data-comp="SummaryDocument"] .s-specs .s-k {
  color: var(--s-ink-muted);
  font-weight: 600;
  flex-shrink: 0;
  width: 10mm;
}
[data-comp="SummaryDocument"] .s-specs .s-v {
  color: var(--s-ink);
}

/* Notes block — laid out as a single-row pair (label "備註" + multi-line
   content), matching the spec-row visual rhythm. The first content line sits
   on the same baseline as the label; subsequent lines hang under it, indented
   to the same x-position by virtue of the flex value column. No bullets. */
[data-comp="SummaryDocument"] .s-notes {
  margin-top: 2mm;
  padding-top: 1.5mm;
  border-top: 0.3pt dashed var(--s-line);
  display: flex;
  gap: 2mm;
  font-size: 8pt;
  line-height: 1.45;
}
[data-comp="SummaryDocument"] .s-notes .s-k {
  color: var(--s-ink-muted);
  font-weight: 600;
  flex-shrink: 0;
  width: 10mm;
}
[data-comp="SummaryDocument"] .s-notes .s-v {
  color: var(--s-ink);
  display: flex;
  flex-direction: column;
  gap: 0.4mm;
}

/* Footer — internal-only format */
[data-comp="SummaryDocument"] .s-footer {
  flex-shrink: 0;
  height: 8mm;
  padding: 0 12mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 7.5pt;
  color: var(--s-ink-muted);
  border-top: 0.6pt solid var(--s-ink);
}
[data-comp="SummaryDocument"] .s-footer .s-left {
  display: flex;
  align-items: center;
  gap: 4mm;
}
[data-comp="SummaryDocument"] .s-footer .s-sep { color: var(--s-line); }
[data-comp="SummaryDocument"] .s-footer .s-ref {
  font-weight: 600;
  color: var(--s-ink);
}
[data-comp="SummaryDocument"] .s-footer .s-internal {
  background: var(--s-ink);
  color: #fff;
  padding: 0.6mm 2mm;
  border-radius: 1mm;
  font-weight: 600;
  font-size: 6.8pt;
  letter-spacing: 0.4pt;
  text-transform: uppercase;
}

/* ── Sharp variant (#/summary-sharp) ──
   ALL text in the body + footer is forced to pure black + regular weight.
   The TravelerDocument_v4-style header keeps its bold typographic emphasis
   on three exempt items: "Summary", "#{quoteId} {orderName}", "艾維數位工業".
   Structural grays (--s-line, --s-surface) remain so the table & schedule
   keep visual structure without using saturated colors. */
[data-comp="SummaryDocument"][data-variant="sharp"] {
  --s-primary: #000;
  --s-highlight: #000;     /* drop brand purple — pure monochrome */
  --s-ink: #000;
  --s-ink-soft: #000;
  --s-ink-muted: #000;
  --s-ink-faint: #000;
  --s-line: #D9D9D9;       /* gray structural lines stay */
  --s-line-soft: #F0F0F0;
  --s-surface: #F5F5F5;    /* gray bg on stage / thead stays */
  font-family: "Geist", "Inter", "Noto Sans TC", "PingFang TC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: geometricPrecision;
}

/* Force regular weight + uniform 12px size everywhere inside body + footer
   (header is exempt by selector — it's outside .s-body and .s-footer).
   Specificity matches the per-element rules above; placed later so it wins. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-body,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-body *,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-footer,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-footer * {
  font-weight: 400;
  font-size: 12px;
}

/* Highlight spans — bold survives the strip-everything-to-400 blanket above
   (selector below has higher specificity: .s-body .s-hi vs .s-body *).
   Color stays at the variant's --s-highlight (#000 in sharp). */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-body .s-hi,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-body .s-hi * {
  font-weight: 700;
}

/* Remove schedule "stage" cell gray background AND per-row dividers —
   schedule rows become a plain flat table with no inter-row lines. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule .s-stage {
  background: transparent;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule td {
  border-bottom: none;
}

/* Section dividers — every direct child of .s-body except the last gets a
   bottom border + matching padding-bottom, so the line is symmetrically
   centred between adjacent sections (4mm flex gap below + 4mm pad above). */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-body > div:not(:last-child) {
  padding-bottom: 4mm;
  border-bottom: 0.6pt solid var(--s-line);
}

/* BOM section sits flush against the Order Summary divider — cancel the
   flex gap above so the gray thead bar visually merges with the line. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-body > div:last-child {
  margin-top: -4mm;
}

/* Shared 4-column base — Authorization, Schedule, and Order Summary all
   sit on the same repeat(4, 1fr) grid so column starts line up vertically.
   Each body column is ~46.5mm (187mm body-width / 4). */

/* Authorization gap collapsed to zero so its 4 cells truly span 25% each
   (the default 4mm column gap shrank columns to ~43.5mm — out of sync with
   the schedule's table-layout: fixed 46.5mm columns). Visual separation
   between signature lines comes from padding-right inside each slot — keeps
   column starts aligned with the shared grid while breaking the underline
   continuity that would otherwise join all four slots into one bar. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-auth-grid {
  gap: 0;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-sig-slot {
  padding-right: 4mm;
}

/* Pull the role labels (預習 / 預習複查 / 質檢 / 質檢複查) up by 10px so
   the entire signature row reads tighter against the section above. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-sig-slot .s-role {
  margin-top: -10px;
}

/* Date hint sits INSIDE the line span (positioned absolutely at its bottom
   right corner) so it physically rests on the writing line. The line span
   is the 35px-tall writing area whose border-bottom IS the visible line —
   "bottom: 1px" puts the text baseline directly above the rule. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-sig-slot .s-line {
  position: relative;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-sig-slot .s-date-label {
  position: absolute;
  bottom: 1px;
  right: 0;
  font-size: 9px;
  line-height: 1;
  margin-top: 0;
  pointer-events: none;
  /* Half-step lighter than the other muted labels (#737373 → #8C8C8C,
     Ant gray-7) — the hint sits ON the writing line so it should recede
     further to avoid competing with the line itself. */
  color: #8C8C8C;
}

/* Schedule converts to fixed-layout table with 25% per column, no horizontal
   cell padding — stage / date / note / buffer start exactly at column edges. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule {
  table-layout: fixed;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule .s-stage,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule .s-date {
  width: 25%;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule td {
  padding-left: 0;
  padding-right: 0;
}

/* Order Summary: key in col 1, value spans cols 2–4 (long strings like the
   tolerance line need the full remaining width). */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-summary-grid {
  grid-template-columns: repeat(4, 1fr);
  column-gap: 0;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-summary-grid .s-v {
  grid-column: span 3;
}

/* BOM thead — remove the gray bar; header text sits on plain white next to
   the merged divider line from the section above. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom thead td {
  background: transparent;
}

/* Collapse the Internal tag (originally black bg + white text + bold) into
   plain inline text matching the rest of the footer. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-footer .s-internal {
  background: transparent;
  color: #000;
  padding: 0;
  border-radius: 0;
  text-transform: none;
  letter-spacing: 0;
  font-size: 7.5pt;
}

/* Muted label color — signature role / date hint AND BOM spec labels
   (公差/材質/表粗/表處/螺紋/插件/護套) recede to neutral mid-gray so the
   values can carry the visual weight. Pure neutral #737373 (HSL 0 0% 45%),
   contrast 4.74:1 on white (WCAG AA). Reused across both label groups for
   consistency. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-sig-slot .s-role,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-sig-slot .s-date-label,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom .s-specs .s-k,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom .s-notes .s-k {
  color: #737373;
}

/* Per-element font-size overrides — must appear AFTER the blanket 12px rule
   (specificity is higher on all, placed last for clarity too). */
/* Dimensions block below the 3D thumbnail */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom .s-dims,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom .s-dims *,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom .s-dims-in {
  font-size: 11px;
}
/* Schedule table — stage / date / note cells */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule * {
  font-size: 14px;
}
/* Restore bold on the date column — the sharp blanket forces 400 on every
   .s-body * but all 3 schedule dates are meant to read as the row's anchor. */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule .s-date,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-schedule .s-date * {
  font-weight: 700;
}
/* BOM Qty — large value only (keep "QTY" tag at blanket 12px) */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom .s-qty .s-val {
  font-size: 18px;
}
/* BOM description header line: Part ID · filename */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom .s-desc-header,
[data-comp="SummaryDocument"][data-variant="sharp"] .s-bom .s-desc-header * {
  font-size: 14px;
}

/* ── Sharp variant header — ported from TravelerDocument_v4 TitleSection ──
   No full-width colored band: white background with a 1px bottom border.
   Left: big "訂單摘要" docType + "#{quoteId}" subtitle.
   Right: InstaVoxel logo icon + 艾維數位工業 brand, then page count below.
   High-contrast, grayscale-only (matches sharp variant intent). */
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-header {
  flex-shrink: 0;
  /* Horizontal padding matches .s-body's 12mm so the header title/subtitle
     (left) and brand/page counter (right) align flush with the body-content
     edges below (authorization labels, schedule cells, BOM table, etc.). */
  padding: 20px 12mm 14px 12mm;
  border-bottom: 1px solid var(--s-line);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.02em;
  color: var(--s-ink);
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-subtitle {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: 0.02em;
  color: var(--s-ink);
  opacity: 0.85;
  margin-top: 2px;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--s-ink);
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-brand-name {
  font-size: 22px;
  font-weight: 700;
  line-height: 34px;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-pages {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--s-ink);
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 0.1em;
}
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-pages .s-p-cur { opacity: 0.9; }
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-pages .s-p-sep { opacity: 0.4; }
[data-comp="SummaryDocument"][data-variant="sharp"] .s-v4-pages .s-p-tot { opacity: 0.7; }

/* Fixed-height for PDF output — mirrors pdf-server.ts override */
@media print {
  [data-comp="SummaryDocument"].doc-page {
    height: 297mm;
    min-height: 297mm;
    overflow: hidden;
  }
}
`;

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

const THUMBS: Record<1 | 2, string> = { 1: shot1, 2: shot2 };

export const SummaryDocument = React.forwardRef<HTMLDivElement, SummaryDocumentProps>(
  function SummaryDocument({ data, variant = 'default' }, ref) {
    const descriptor = data.descriptor ?? 'Order Brief';
    const isSharp = variant === 'sharp';

    return (
      <div
        ref={ref}
        data-comp="SummaryDocument"
        data-variant={variant}
        className="doc-page"
      >
        {/* React-managed <style> — always reflects the latest SUMMARY_CSS
            string after HMR; avoids stale CSS cached on a one-shot injection. */}
        <style data-style="SummaryDocument" dangerouslySetInnerHTML={{ __html: SUMMARY_CSS }} />

        {isSharp ? (
          /* Sharp variant — TravelerDocument_v4 style header (no colored band). */
          <div className="s-v4-header">
            <div>
              <div className="s-v4-title">Summary</div>
              <div className="s-v4-subtitle">#{data.quoteId} {data.orderName}</div>
            </div>
            <div className="s-v4-right">
              <div className="s-v4-brand">
                {PRINT_ICONS.logo(34, 'currentColor')}
                <span className="s-v4-brand-name">艾維數位工業</span>
              </div>
              <div className="s-v4-pages">
                <span className="s-p-cur">第{toChineseNum(1)}頁</span>
                <span className="s-p-sep">/</span>
                <span className="s-p-tot">共{toChineseNum(1)}頁</span>
              </div>
            </div>
          </div>
        ) : (
          <DocumentHeader docType="Summary" />
        )}

        <div className="s-body">

          {/* Title row — kept for default variant only. Sharp variant's
              TravelerDocument_v4-style header already carries the quote ID,
              so this row (and its divider) is redundant and removed there. */}
          {!isSharp && (
            <div className="s-title-row">
              <div className="s-title-line">
                <span className="s-quote-id">{data.quoteId}</span>
                <span className="s-order-name">{data.orderName}</span>
              </div>
              <div className="s-meta">
                <div><span className="s-label">ISSUED</span> &nbsp; {data.issued}</div>
                <div><span className="s-label">PM</span> &nbsp; {data.pm}</div>
              </div>
            </div>
          )}

          {/* Authorization — 4-slot single row, no title/divider */}
          <div className="s-auth-grid">
            {data.signatureSlots.map((role) => (
              <div key={role} className="s-sig-slot">
                <span className="s-role">{role}</span>
                {/* In sharp variant the "簽名·日期" hint sits INSIDE the line
                    span (positioned at its bottom-right corner so it visually
                    sits on the writing line); in default variant it stays as
                    a sibling rendered below the line. */}
                <span className="s-line">
                  {isSharp && <span className="s-date-label">簽名 · 日期</span>}
                </span>
                {!isSharp && <span className="s-date-label">簽名 · 日期</span>}
              </div>
            ))}
          </div>

          {/* Delivery schedule (no label, no divider) */}
          <div>
            <table className="s-schedule">
              <tbody>
                {data.schedule.map((row, i) => (
                  <tr key={i}>
                    <td className="s-stage">{row.stage}</td>
                    <td className="s-date">{row.date}</td>
                    <td className="s-note">{row.note}</td>
                    <td className="s-note">{row.buffer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Summary — section label hidden in sharp variant */}
          <div>
            {!isSharp && <div className="s-section-label">Order Summary</div>}
            <div className="s-summary-grid">
              {data.orderSummary.flatMap((row, i) => [
                <div key={`k${i}`} className="s-k">{row.k}</div>,
                <div key={`v${i}`} className="s-v">{row.v}</div>,
              ])}
            </div>
          </div>

          {/* BOM */}
          <div>
            <table className="s-bom">
              <colgroup>
                <col style={{ width: '40mm' }} />
                <col style={{ width: '14mm' }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <td className="s-col-meas">尺寸圖</td>
                  <td className="s-col-qty">數量</td>
                  <td>規格說明</td>
                </tr>
              </thead>
              <tbody>
                {data.parts.map((p) => {
                  const isPending = p.qty === '待定';
                  return (
                    <tr key={p.partId}>
                      <td className="s-meas">
                        <img
                          className="s-thumb"
                          src={THUMBS[p.thumbnail]}
                          alt={`${p.partId} 3D model`}
                        />
                        <div className="s-dims">
                          {p.dimsMm} mm
                          <span className="s-sep">·</span>
                          <span className="s-weight">{p.weight}</span>
                        </div>
                        <div className="s-dims-in">{p.dimsIn} in</div>
                      </td>
                      <td className="s-qty">
                        <div className={`s-val${isPending ? ' s-pending' : ''}`}>{p.qty}</div>
                      </td>
                      <td>
                        <div className="s-desc-header">
                          <span className="s-pid">{p.partId}</span>
                        </div>
                        <div className="s-specs">
                          {p.specs.map((s) => (
                            <div key={s.k} className="s-row">
                              <span className="s-k">{s.k}</span>
                              <span className="s-v">{s.v}</span>
                            </div>
                          ))}
                        </div>
                        {p.notes.length > 0 && (
                          <div className="s-notes">
                            <span className="s-k">備註</span>
                            <div className="s-v">
                              {p.notes.map((n, i) => <div key={i}>{n}</div>)}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Internal footer — hidden in sharp variant (page count is in header) */}
        {!isSharp && (
          <div className="s-footer">
            <div className="s-left">
              <span className="s-ref">{data.quoteId}</span>
              <span className="s-sep">|</span>
              <span>{descriptor}</span>
              <span className="s-internal">Internal</span>
            </div>
            <span>Page 1 / 1</span>
          </div>
        )}
      </div>
    );
  }
);

export default SummaryDocument;
