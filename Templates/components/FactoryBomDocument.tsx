/**
 * FactoryBomDocument v2 — Factory-facing RFQ BOM for supplier quoting
 *
 * 5-column layout: 尺寸圖紙 | 工件號 | 材質 | 表處 | 報價(數量/單價/交期)
 * Key fields enlarged to 14px bold for factory-floor readability.
 * Notes section at page bottom. Print-optimized.
 *
 * Chinese only (lang='zh' always).
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, DocumentHeader.tsx, DocumentFooter.tsx
 */

import React from 'react';
import { PRINT_ICONS } from './Icons_Print';
import { DocumentFooter } from './DocumentFooter';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface FactoryBomPart {
  partId: string;
  thumbnail?: string;
  dimsMm: string;
  weight: string;
  material: string;
  finish: string;
  /** Quantity tiers for quoting, e.g. [1, 5, 10] */
  qtyTiers: number[];
}

export interface FactoryBomData {
  orderId: string;
  issueDate: string;
  replyDeadline: string;
  itemCount: number;
  parts: FactoryBomPart[];
}

interface FactoryBomDocumentProps {
  data: FactoryBomData;
}

/* ═══════════════════════════════════════════════════════════
   Style constants
   ═══════════════════════════════════════════════════════════ */

const TH = [
  'text-[length:var(--doc-text-param-label)] font-semibold',
  'text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]',
  'py-[var(--sp-1)] px-[var(--sp-2)]',
  'border-b border-[var(--gray-200)]',
].join(' ');

/** Large bold style for key fields — 14px for factory-floor readability */
const KEY_VALUE = 'text-[length:14px] font-bold text-[color:var(--gray-900)]';

/* ── Quotation sub-column widths ── */
const QTY_COL = 60;
const DELIVERY_COL = 72;

/* ── Main column widths ── */
const COL_THUMBNAIL = 140;
const COL_PART_ID = 70;
const COL_MATERIAL = 120;
const COL_FINISH = 100;
// COL_QUOTE = remaining (flex)

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

function computeTotals(parts: FactoryBomPart[]) {
  let minSum = 0;
  let midSum = 0;
  let maxSum = 0;
  for (const p of parts) {
    const sorted = [...p.qtyTiers].sort((a, b) => a - b);
    minSum += sorted[0];
    maxSum += sorted[sorted.length - 1];
    // Second-largest: if only 2 tiers, use max
    midSum += sorted.length >= 3 ? sorted[sorted.length - 2] : sorted[sorted.length - 1];
  }
  return { minSum, midSum, maxSum };
}

/* ═══════════════════════════════════════════════════════════
   Notes — manufacturing disclaimers (every page bottom)
   ═══════════════════════════════════════════════════════════ */

const NOTES = [
  '對於所有小於305mm的尺寸，若圖紙上沒有明確指定的公差（或未提供PDF圖紙），則適用默認標準公差+/-12.7條',
  '若圖紙或訂單PO沒有特別指定，所有螺紋的默認標準為2A/2B（美規）或6g/6H（公規）',
  '除非有專門說明，所有鋒利邊緣均要去毛邊（尺寸為0.25-0.75mm，R角或C角皆可）。成品不可割手。',
  '所有工件加工完成後要立即清潔，成品不可有任何氧化變黑痕跡。關於清潔方式如有疑問請與艾維聯繫。',
];

function NotesSection() {
  return (
    <div className="mt-auto pt-[var(--sp-4)]" style={{ paddingLeft: 'var(--doc-margin-x)', paddingRight: 'var(--doc-margin-x)' }}>
      <div className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-600)] border-b border-[var(--gray-200)] pb-[var(--doc-sp-half)] mb-[var(--sp-2)]">
        注意事項
      </div>
      <div className="flex flex-col gap-[var(--sp-1)]">
        {NOTES.map((note, i) => (
          <div key={i} className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-500)] leading-[1.6]">
            {note}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export const FactoryBomDocument = React.forwardRef<HTMLDivElement, FactoryBomDocumentProps>(
  function FactoryBomDocument({ data }, ref) {
    const { minSum, midSum, maxSum } = computeTotals(data.parts);

    return (
      <div ref={ref} data-comp="FactoryBomDocument" className="doc-page">
        {/* ── Header band with issueDate next to docType ── */}
        <div
          className="flex items-center justify-between shrink-0 bg-[var(--color-primary)]"
          style={{ height: 'var(--doc-header-h)', padding: '0 var(--doc-margin-x)' }}
        >
          <div className="flex items-center">
            {PRINT_ICONS.logoText(22)}
          </div>
          <div className="flex items-center gap-[var(--sp-3)]">
            <span className="text-white/85 text-[length:var(--doc-text-doc-type)] font-semibold tracking-[var(--doc-tracking-doc-type)] uppercase">
              BOM 表
            </span>
            <span className="text-white/60 text-[length:var(--doc-text-doc-type)] font-normal">
              {data.issueDate}
            </span>
          </div>
        </div>

        <div className="doc-content" style={{ gap: 'var(--sp-3)' }}>
          {/* ── Title row: RFQ BOM + orderId + deadline ── */}
          <div className="flex items-end gap-[var(--sp-4)]">
            <span className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
              RFQ BOM
            </span>
            <span className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-title)]">
              {data.orderId}
            </span>
            <span className="flex-1" />
            <span className="text-[length:12px] font-bold text-[color:var(--color-warning-text)]">
              最晚報價時間：{data.replyDeadline}
            </span>
          </div>

          {/* ── Metadata row: 零件種類 + 共 X/Y/Z 件 ── */}
          <div className="relative flex items-baseline">
            {/* Left — aligned with 尺寸圖紙 column */}
            <span className="text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-800)]">
              零件種類：<span className={KEY_VALUE}>{data.itemCount}</span> 種
            </span>
            {/* Center-aligned with 數量 sub-column center */}
            <span
              className="absolute whitespace-nowrap"
              style={{ left: COL_THUMBNAIL + COL_PART_ID + COL_MATERIAL + COL_FINISH + QTY_COL / 2, transform: 'translateX(-50%)' }}
            >
              <span className="text-[length:var(--doc-text-part-id)] text-[color:var(--gray-800)]">共{' '}</span>
              <span className={KEY_VALUE}>{minSum}</span>
              <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]"> / </span>
              <span className={KEY_VALUE}>{midSum}</span>
              <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]"> / </span>
              <span className={KEY_VALUE}>{maxSum}</span>
              <span className="text-[length:var(--doc-text-part-id)] text-[color:var(--gray-800)]">{' '}件</span>
            </span>
          </div>

          {/* ── Table ── */}
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: COL_THUMBNAIL }} />
              <col style={{ width: COL_PART_ID }} />
              <col style={{ width: COL_MATERIAL }} />
              <col style={{ width: COL_FINISH }} />
              <col /> {/* 報價 — remaining width */}
            </colgroup>

            <thead>
              {/* ── Main table header ── */}
              <tr className="bg-[var(--gray-50)]">
                <td className={`${TH} text-center border-r border-r-[var(--gray-100)]`}>
                  尺寸圖紙
                </td>
                <td className={`${TH} text-center border-r border-r-[var(--gray-100)]`}>
                  工件號
                </td>
                <td className={`${TH} text-center border-r border-r-[var(--gray-100)]`}>
                  材質
                </td>
                <td className={`${TH} text-center border-r border-r-[var(--gray-100)]`}>
                  表處
                </td>
                {/* 報價 header — contains sub-column labels */}
                <td className={`${TH} p-0`}>
                  <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: QTY_COL }} />
                      <col />
                      <col style={{ width: DELIVERY_COL }} />
                    </colgroup>
                    <tbody><tr>
                      <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]"
                          style={{ borderRight: '1px dashed var(--gray-100)' }}>
                        <span className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]">數量</span>
                      </td>
                      <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]"
                          style={{ borderRight: '1px dashed var(--gray-100)' }}>
                        <span className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]">單價</span>
                      </td>
                      <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]">
                        <span className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]">交期</span>
                      </td>
                    </tr></tbody>
                  </table>
                </td>
              </tr>
            </thead>

            <tbody>
              {data.parts.map((part, i) => (
                <FactoryBomRow key={`${part.partId}-${i}`} part={part} isLast={i === data.parts.length - 1} />
              ))}

              {/* ── Summary row ── */}
              <FactoryBomSummary data={data} />
            </tbody>
          </table>
        </div>

        <NotesSection />
        <DocumentFooter docId={data.orderId} page={1} totalPages={1} />
      </div>
    );
  }
);

/* ═══════════════════════════════════════════════════════════
   FactoryBomRow — single part row (5 columns)
   ═══════════════════════════════════════════════════════════ */

function FactoryBomRow({ part, isLast }: { part: FactoryBomPart; isLast: boolean }) {
  return (
    <tr className={isLast ? '' : 'border-b border-[var(--gray-200)]'}>
      {/* ── THUMBNAIL ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)]">
        <div
          className="bg-[var(--gray-50)] border border-[var(--gray-150)] rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center mb-[var(--sp-2)] mx-auto"
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
        <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.6] whitespace-nowrap">
          {part.dimsMm} mm{'\u00a0\u00b7\u00a0'}{part.weight}
        </div>
      </td>

      {/* ── PART ID ── */}
      <td className={`py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)] ${KEY_VALUE}`}>
        {part.partId}
      </td>

      {/* ── MATERIAL ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)] text-[length:13px] font-bold text-[color:var(--gray-900)]">
        {part.material}
      </td>

      {/* ── FINISH ── */}
      {/* NOTE: "標準"(standard) = default finish → leave blank to reduce noise.
         Only non-default finishes (e.g. 陽極氧化, 電解拋光) are displayed. */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)] text-[length:13px] font-bold text-[color:var(--gray-900)]">
        {part.finish !== '標準' ? part.finish : null}
      </td>

      {/* ── QUOTATION — nested table, no per-row label ── */}
      <td className="py-0 px-0" style={{ height: 1 }}>
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: QTY_COL }} />
            <col />
            <col style={{ width: DELIVERY_COL }} />
          </colgroup>
          <tbody>
            {part.qtyTiers.map((qty, i) => (
              <tr key={qty} className={i < part.qtyTiers.length - 1 ? 'border-b border-[var(--gray-100)]' : ''}>
                <td className="text-center align-middle px-[var(--sp-1)]"
                    style={{ borderRight: '1px dashed var(--gray-100)' }}>
                  <span className={KEY_VALUE}>{qty}</span>
                  <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)] ml-[3px]">件</span>
                </td>
                <td className="align-middle px-[var(--sp-2)]"
                    style={{ borderRight: '1px dashed var(--gray-100)' }}>
                  <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)]">$</span>
                </td>
                <td className="align-middle px-[var(--sp-2)] text-right">
                  <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)]">天</span>
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
   FactoryBomSummary — totals row at the bottom
   ═══════════════════════════════════════════════════════════ */

function FactoryBomSummary({ data }: { data: FactoryBomData }) {
  const { minSum, midSum, maxSum } = computeTotals(data.parts);
  const tiers = [minSum, midSum, maxSum];

  return (
    <>
      {tiers.map((total, i) => {
        const rowBorder = i < tiers.length - 1 ? 'border-b border-b-[var(--gray-100)]' : '';
        return (
          <tr
            key={i}
            className={i === 0 ? 'border-t-[1.5px] border-t-[var(--gray-300)]' : ''}
          >
            {/* ── Thumbnail area — no bottom border, right border as separator ── */}
            <td style={{ borderBottom: 'none' }} className="border-r border-r-[var(--gray-100)]" />

            {/* ── 方案 XX 件 — spans 工件號+材質+表處 ── */}
            <td colSpan={3} className={`py-[var(--sp-3)] px-[var(--sp-3)] ${rowBorder}`}>
              <div className="flex items-baseline">
                <span className="text-[length:10px] font-bold text-[color:var(--gray-400)]">
                  方案
                </span>
                <span className={`${KEY_VALUE} flex-1 text-center`}>
                  {total}
                </span>
                <span className="text-[length:10px] font-bold text-[color:var(--gray-400)]">
                  件
                </span>
              </div>
            </td>

            {/* ── 天 — right-aligned in delivery area ── */}
            <td className={`py-[var(--sp-3)] px-[var(--sp-2)] text-right ${rowBorder}`}>
              <span className="text-[length:10px] font-bold text-[color:var(--gray-400)]">
                天
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}

export default FactoryBomDocument;
