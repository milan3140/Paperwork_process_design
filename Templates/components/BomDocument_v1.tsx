/**
 * BomDocument — Bill of Materials document for print/PDF
 *
 * Renders a complete, print-ready BOM using a 4-column table layout:
 *   PART ID | MEASUREMENT | QTY | DESCRIPTION (key-value grid)
 *
 * Supports three language modes:
 *   - `en`    — English only (default)
 *   - `zh`    — Chinese only (labels in Chinese, values stay technical English)
 *   - `zh-en` — Bilingual: Chinese primary + English secondary
 *              Headers: stacked (Chinese above, English below in lighter color)
 *              Labels: inline (製程 Process) with English in lighter color
 *
 * This is a "document renderer" — purely visual, no interactivity.
 * Static document: no file links, no interactive elements.
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css (design tokens)
 *   documents.css (document tokens + print styles)
 *   DocumentHeader.tsx, DocumentFooter.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type                  | Required | Default | Description                    |
 * |------|-----------------------|----------|---------|--------------------------------|
 * | data | BomData               | yes      | —       | Complete BOM data object       |
 * | lang | 'en' | 'zh' | 'zh-en' | no       | 'en'    | Language mode                  |
 */

import React from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface BomPartSpec {
  /** Spec label in English (e.g. "Process", "Material") */
  label: string;
  /** Spec value in English (e.g. "CNC Machining", "Aluminum 6061-T6") */
  value: string;
  /** Chinese value. When lang=zh shows this alone; when lang=zh-en shows "valueZh (value)". Falls back to `value` if omitted. */
  valueZh?: string;
}

export interface BomPart {
  /** Part ID displayed in PART ID column, e.g. "噴火槍_P01" */
  partId: string;
  /** Thumbnail image URL. Shows "3D" placeholder if omitted. */
  thumbnail?: string;
  /** Dimensions in mm, e.g. "127 × 89 × 45" */
  dimsMm: string;
  /** Dimensions in inches, e.g. "5.00 × 3.50 × 1.77" */
  dimsIn: string;
  /** Weight string, e.g. "342 g" */
  weight: string;
  /** Quantity — number or "待定" */
  qty: string | number;
  /** Original filename, shown as first line of DESCRIPTION */
  filename: string;
  /** Structured specs: Process, Material, Finish, Tolerance, etc. */
  specs: BomPartSpec[];
  /** Free-form notes. Omit or pass [] to hide notes section. */
  notes?: string[];
}

export interface BomData {
  /** Order ID with Chinese name, e.g. "Q1211263U 噴火槍" */
  orderId: string;
  /** Issue date, e.g. "2026-01-15" */
  date: string;
  /** Total number of part types */
  itemCount: number;
  /** Sum of all quantities */
  totalParts: number | string;
  /** Array of parts */
  parts: BomPart[];
}

export type BomLang = 'en' | 'zh' | 'zh-en';

interface BomDocumentProps {
  data: BomData;
  lang?: BomLang;
}

/* ═══════════════════════════════════════════════════════════
   Locale
   ═══════════════════════════════════════════════════════════ */

interface BomLocale {
  docType: string;
  summary: (items: number, total: number | string) => string;
  headers: [string, string, string, string];
  notesLabel: string;
  fileLabel: string;
  /** Map English spec label → Chinese label */
  labelZh: Record<string, string>;
}

const LABEL_ZH: Record<string, string> = {
  Process: '製程',
  Material: '材質',
  Finish: '表處',
  Tolerance: '公差',
  Surface: '表粗',
  Threads: '螺紋',
  Inserts: '插件',
  Helicoil: '護套',
};

const LOCALES: Record<BomLang, BomLocale> = {
  en: {
    docType: 'Bill of Materials',
    summary: (items, total) => `${items} Items\u00a0\u00a0\u00b7\u00a0\u00a0${total} Total Parts`,
    headers: ['PART ID', 'MEASUREMENT', 'QTY', 'DESCRIPTION'],
    notesLabel: 'Notes',
    fileLabel: 'File',
    labelZh: {},
  },
  zh: {
    docType: 'BOM 表',
    summary: (items, total) => `${items} 種零件\u00a0\u00a0\u00b7\u00a0\u00a0共 ${total} 件`,
    headers: ['零件編號', '尺寸圖', '數量', '規格說明'],
    notesLabel: '備註',
    fileLabel: '檔名',
    labelZh: LABEL_ZH,
  },
  'zh-en': {
    docType: 'BOM 表',
    summary: (items, total) => `${items} 種零件\u00a0\u00a0\u00b7\u00a0\u00a0共 ${total} 件`,
    headers: ['零件編號', '尺寸圖', '數量', '規格說明'],
    notesLabel: '備註',
    fileLabel: '檔名',
    labelZh: LABEL_ZH,
  },
};

/** English sub-labels for bilingual table headers */
const HEADER_EN = ['PART ID', 'MEASUREMENT', 'QTY', 'DESCRIPTION'];

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export const BomDocument = React.forwardRef<HTMLDivElement, BomDocumentProps>(
  function BomDocument({ data, lang = 'en' }, ref) {
    const loc = LOCALES[lang];
    const isBilingual = lang === 'zh-en';

    return (
      <div ref={ref} data-comp="BomDocument" className="doc-page">
        <DocumentHeader docType={loc.docType} />

        <div className="doc-content">
          {/* ── Title row ── */}
          <div data-el="BomDocument-titleRow" className="flex items-baseline gap-[var(--sp-4)]">
            <span className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
              BOM
            </span>
            <span className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-title)]">
              {data.orderId}
            </span>
            <span className="flex-1" />
            <span className="text-[length:var(--doc-text-body)] text-[color:var(--gray-500)]">
              {data.date}
            </span>
          </div>

          {/* ── Summary line ── */}
          <div
            data-el="BomDocument-summary"
            className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-500)] -mt-[var(--sp-4)]"
          >
            {loc.summary(data.itemCount, data.totalParts)}
          </div>

          {/* ── Table ── */}
          <table
            data-el="BomDocument-table"
            className="w-full border-collapse"
            style={{ tableLayout: 'fixed' }}
          >
            <colgroup>
              <col style={{ width: 110 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 48 }} />
              <col />
            </colgroup>

            {/* Table header — uses tbody to prevent browser auto-repeating on print page breaks */}
            <tbody>
              <tr className="bg-[var(--gray-50)]">
                {loc.headers.map((h, i) => (
                  <td
                    key={i}
                    className={[
                      'text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] py-[var(--sp-1)] px-[var(--sp-2)] border-b border-[var(--gray-200)]',
                      i === 3 ? 'text-left' : 'text-center',
                      i < 3 ? 'border-r border-r-[var(--gray-100)]' : '',
                    ].join(' ')}
                  >
                    {h}
                    {/* Bilingual: English sub-label below Chinese */}
                    {isBilingual && (
                      <div className="text-[color:var(--gray-300)] font-medium mt-[1px] normal-case tracking-normal">
                        {HEADER_EN[i]}
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {data.parts.map((part, i) => (
                <BomRow key={part.partId} part={part} isLast={i === data.parts.length - 1} lang={lang} loc={loc} />
              ))}
            </tbody>
          </table>
        </div>

        <DocumentFooter docId={data.orderId} page={1} totalPages={1} />
      </div>
    );
  }
);

/* ═══════════════════════════════════════════════════════════
   BomRow — single part row
   ═══════════════════════════════════════════════════════════ */

function BomRow({ part, isLast, lang, loc }: { part: BomPart; isLast: boolean; lang: BomLang; loc: BomLocale }) {
  const isQtyPending = part.qty === '待定';
  const isBilingual = lang === 'zh-en';
  const isZh = lang === 'zh' || lang === 'zh-en';

  return (
    <tr
      data-el="BomRow"
      className={isLast ? '' : 'border-b border-[var(--gray-200)]'}
    >
      {/* ── PART ID ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)]">
        <div className="text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-900)] leading-[1.4]">
          {part.partId}
        </div>
      </td>

      {/* ── MEASUREMENT ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)]">
        {/* Thumbnail */}
        <div
          data-el="BomRow-thumb"
          className="bg-[var(--gray-50)] border border-[var(--gray-150)] rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center mb-[var(--sp-2)] mx-auto"
          style={{ width: 120, height: 100 }}
        >
          {part.thumbnail ? (
            <img src={part.thumbnail} alt={part.partId} className="w-full h-full object-contain" />
          ) : (
            <span className="text-[length:var(--doc-text-thumb-placeholder)] text-[color:var(--gray-300)] uppercase tracking-[var(--doc-tracking-label)]">
              3D
            </span>
          )}
        </div>

        {/* Dimensions mm  .  weight */}
        <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.6] whitespace-nowrap">
          {part.dimsMm} mm
          <span className="text-[color:var(--gray-300)]">
            &nbsp;&nbsp;.&nbsp;&nbsp;
          </span>
          <span className="text-[color:var(--gray-500)]">{part.weight}</span>
        </div>

        {/* Dimensions inch */}
        <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] leading-[1.6] mt-[var(--doc-sp-half)]">
          {part.dimsIn} in
        </div>
      </td>

      {/* ── QTY ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)]">
        <div
          className={[
            'text-[length:var(--doc-text-key-value)] font-bold leading-[1.4]',
            isQtyPending
              ? 'text-[color:var(--color-warning-text)]'
              : 'text-[color:var(--gray-900)]',
          ].join(' ')}
        >
          {part.qty}
        </div>
      </td>

      {/* ── DESCRIPTION (key-value grid) ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] align-top">
        {/* Filename */}
        <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] mb-[var(--sp-2)]">
          {isZh ? loc.fileLabel : 'File'}
          {isBilingual && <span className="text-[color:var(--gray-300)]"> File</span>}
          <span className="text-[color:var(--gray-400)]">&nbsp;&nbsp;</span>
          {part.filename}
        </div>

        {/* Spec key-value pairs */}
        <div data-el="BomRow-specs" className="flex flex-col gap-[var(--doc-sp-half)]">
          {part.specs.map((spec) => (
            <div key={spec.label} className="flex gap-[var(--sp-2)]">
              <SpecLabel label={spec.label} lang={lang} labelZh={loc.labelZh} />
              <SpecValue value={spec.value} valueZh={spec.valueZh} lang={lang} />
            </div>
          ))}
        </div>

        {/* Notes (conditional) */}
        {part.notes && part.notes.length > 0 && (
          <div data-el="BomRow-notes" className="mt-[var(--sp-3)]">
            <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-1)]">
              <span className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] shrink-0">
                {loc.notesLabel}
                {isBilingual && <span className="text-[color:var(--gray-300)] normal-case tracking-normal"> Notes</span>}
              </span>
              <div className="flex-1 border-b border-[var(--gray-100)]" />
            </div>
            <div className="flex flex-col gap-[var(--doc-sp-half)]">
              {part.notes.map((note, i) => (
                <div key={i} className="flex gap-[var(--sp-1)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-700)] leading-[1.6]">
                  <span className="text-[color:var(--gray-400)] shrink-0">&middot;</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════
   SpecLabel — handles en / zh / bilingual label rendering
   ═══════════════════════════════════════════════════════════ */

function SpecLabel({ label, lang, labelZh }: { label: string; lang: BomLang; labelZh: Record<string, string> }) {
  const zhText = labelZh[label];

  if (lang === 'en') {
    return (
      <span
        className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-400)] leading-[1.6] shrink-0"
        style={{ width: 90 }}
      >
        {label}
      </span>
    );
  }

  if (lang === 'zh') {
    return (
      <span
        className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-400)] leading-[1.6] shrink-0"
        style={{ width: 90 }}
      >
        {zhText || label}
      </span>
    );
  }

  /* zh-en bilingual: Chinese primary + English secondary inline */
  return (
    <span
      className="text-[length:var(--doc-text-secondary)] font-semibold leading-[1.6] shrink-0"
      style={{ width: 110 }}
    >
      <span className="text-[color:var(--gray-400)]">{zhText || label}</span>
      {zhText && <span className="text-[color:var(--gray-300)]"> {label}</span>}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   SpecValue — handles en / zh / bilingual value rendering

   Bilingual design: Chinese value on top, English below in
   lighter color + smaller size. This avoids the parenthetical
   "鋁合金6061 (Aluminum 6061)" squeeze and gives each
   language its own reading line.
   ═══════════════════════════════════════════════════════════ */

function SpecValue({ value, valueZh, lang }: { value: string; valueZh?: string; lang: BomLang }) {
  /* English only — just the value */
  if (lang === 'en') {
    return (
      <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-900)] leading-[1.6]">
        {value}
      </span>
    );
  }

  /* Chinese only — show Chinese if available, else English */
  if (lang === 'zh') {
    return (
      <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-900)] leading-[1.6]">
        {valueZh || value}
      </span>
    );
  }

  /* Bilingual — Chinese primary line + English secondary line below */
  if (valueZh) {
    return (
      <span className="flex flex-col leading-[1.6]">
        <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-900)]">
          {valueZh}
        </span>
        <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)]">
          {value}
        </span>
      </span>
    );
  }

  /* Bilingual but no Chinese translation — show English only */
  return (
    <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-900)] leading-[1.6]">
      {value}
    </span>
  );
}

export default BomDocument;
