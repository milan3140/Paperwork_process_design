/**
 * BomDocument — Bill of Materials document for print/PDF (v2)
 *
 * Renders a complete, print-ready BOM using a 3-column table layout:
 *   MEASUREMENT | QTY | DESCRIPTION (dual-column key-value grid)
 *
 * v2 changes from v1 (backup: BomDocument_v1.tsx):
 *   - PART ID column removed → partId + filename moved into DESCRIPTION header
 *   - DESCRIPTION specs: single-column → dual-column grid (like Xometry reference)
 *   - QTY: number value + gray "QTY" label below for quick identification
 *   - Logo: SVG logoText from Icons_Print.tsx
 *
 * Supports three language modes: 'en' | 'zh' | 'zh-en'
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css, DocumentHeader.tsx, DocumentFooter.tsx
 */

import React from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface BomPartSpec {
  label: string;
  value: string;
  valueZh?: string;
}

export interface BomPart {
  partId: string;
  thumbnail?: string;
  dimsMm: string;
  dimsIn: string;
  weight: string;
  qty: string | number;
  filename: string;
  specs: BomPartSpec[];
  notes?: string[];
}

export interface BomData {
  orderId: string;
  date: string;
  itemCount: number;
  totalParts: number | string;
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
  headers: [string, string, string];
  notesLabel: string;
  fileLabel: string;
  partIdLabel: string;
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
    headers: ['MEASUREMENT', 'QTY', 'DESCRIPTION'],
    notesLabel: 'Notes',
    fileLabel: 'File',
    partIdLabel: 'Part ID',
    labelZh: {},
  },
  zh: {
    docType: 'BOM 表',
    summary: (items, total) => `${items} 種零件\u00a0\u00a0\u00b7\u00a0\u00a0共 ${total} 件`,
    headers: ['尺寸圖', '數量', '規格說明'],
    notesLabel: '備註',
    fileLabel: '檔名',
    partIdLabel: '零件編號',
    labelZh: LABEL_ZH,
  },
  'zh-en': {
    docType: 'BOM 表',
    summary: (items, total) => `${items} 種零件\u00a0\u00a0\u00b7\u00a0\u00a0共 ${total} 件`,
    headers: ['尺寸圖', '數量', '規格說明'],
    notesLabel: '備註',
    fileLabel: '檔名',
    partIdLabel: '零件編號',
    labelZh: LABEL_ZH,
  },
};

const HEADER_EN = ['MEASUREMENT', 'QTY', 'DESCRIPTION'];

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
              <col style={{ width: 140 }} />
              <col style={{ width: 48 }} />
              <col />
            </colgroup>

            <tbody>
              {/* Table header */}
              <tr className="bg-[var(--gray-50)]">
                {loc.headers.map((h, i) => (
                  <td
                    key={i}
                    className={[
                      'text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] py-[var(--sp-1)] px-[var(--sp-2)] border-b border-[var(--gray-200)]',
                      i === 2 ? 'text-left' : 'text-center',
                      i < 2 ? 'border-r border-r-[var(--gray-100)]' : '',
                    ].join(' ')}
                  >
                    {h}
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
   BomRow — single part row (3 columns)
   ═══════════════════════════════════════════════════════════ */

function BomRow({ part, isLast, lang, loc }: { part: BomPart; isLast: boolean; lang: BomLang; loc: BomLocale }) {
  const isQtyPending = part.qty === '待定';
  const isBilingual = lang === 'zh-en';
  const isZh = lang === 'zh' || lang === 'zh-en';

  /* Split specs into left and right columns for dual-column grid */
  const mid = Math.ceil(part.specs.length / 2);
  const leftSpecs = part.specs.slice(0, mid);
  const rightSpecs = part.specs.slice(mid);

  return (
    <tr
      data-el="BomRow"
      className={isLast ? '' : 'border-b border-[var(--gray-200)]'}
    >
      {/* ── MEASUREMENT ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)]">
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

        <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.6] whitespace-nowrap">
          {part.dimsMm} mm
          <span className="text-[color:var(--gray-300)]">&nbsp;&nbsp;.&nbsp;&nbsp;</span>
          <span className="text-[color:var(--gray-500)]">{part.weight}</span>
        </div>

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
        <div className="text-[length:var(--doc-text-param-label)] font-normal text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] mt-[var(--doc-sp-half)]">
          QTY
        </div>
      </td>

      {/* ── DESCRIPTION (Part ID + filename header + dual-column spec grid) ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] align-top">
        {/* Part ID + Filename — same tier, shown as header of this cell */}
        <div className="flex items-baseline gap-[var(--sp-3)] mb-[var(--sp-2)]">
          <span className="text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-900)]">
            {part.partId}
          </span>
          <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-300)]">&middot;</span>
          <span className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
            {part.filename}
          </span>
        </div>

        {/* Dual-column spec grid */}
        <div
          data-el="BomRow-specs"
          className="grid gap-x-[var(--sp-6)] gap-y-[var(--doc-sp-half)]"
          style={{ gridTemplateColumns: '1fr 1fr' }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-[var(--doc-sp-half)]">
            {leftSpecs.map((spec) => (
              <SpecRow key={spec.label} spec={spec} lang={lang} labelZh={loc.labelZh} />
            ))}
          </div>
          {/* Right column */}
          <div className="flex flex-col gap-[var(--doc-sp-half)]">
            {rightSpecs.map((spec) => (
              <SpecRow key={spec.label} spec={spec} lang={lang} labelZh={loc.labelZh} />
            ))}
          </div>
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
   SpecRow — single label-value pair within the dual-column grid
   ═══════════════════════════════════════════════════════════ */

function SpecRow({ spec, lang, labelZh }: { spec: BomPartSpec; lang: BomLang; labelZh: Record<string, string> }) {
  return (
    <div className="flex gap-[var(--sp-1)]">
      <SpecLabel label={spec.label} lang={lang} labelZh={labelZh} />
      <SpecValue value={spec.value} valueZh={spec.valueZh} lang={lang} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SpecLabel
   ═══════════════════════════════════════════════════════════ */

function SpecLabel({ label, lang, labelZh }: { label: string; lang: BomLang; labelZh: Record<string, string> }) {
  const zhText = labelZh[label];
  const baseClass = 'text-[length:var(--doc-text-secondary)] font-semibold leading-[1.6] shrink-0';

  if (lang === 'en') {
    return (
      <span className={`${baseClass} text-[color:var(--gray-400)]`} style={{ width: 52 }}>
        {label}
      </span>
    );
  }

  if (lang === 'zh') {
    return (
      <span className={`${baseClass} text-[color:var(--gray-400)]`} style={{ width: 28 }}>
        {zhText || label}
      </span>
    );
  }

  return (
    <span className={`${baseClass} whitespace-nowrap`} style={{ width: 80 }}>
      <span className="text-[color:var(--gray-400)]">{zhText || label}</span>
      {zhText && <span className="text-[color:var(--gray-300)]"> {label}</span>}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   SpecValue
   ═══════════════════════════════════════════════════════════ */

function SpecValue({ value, valueZh, lang }: { value: string; valueZh?: string; lang: BomLang }) {
  if (lang === 'en') {
    return (
      <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-900)] leading-[1.6]">
        {value}
      </span>
    );
  }

  if (lang === 'zh') {
    return (
      <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-900)] leading-[1.6]">
        {valueZh || value}
      </span>
    );
  }

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

  return (
    <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-900)] leading-[1.6]">
      {value}
    </span>
  );
}

export default BomDocument;
