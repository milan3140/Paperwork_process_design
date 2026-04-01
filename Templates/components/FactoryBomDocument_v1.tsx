/**
 * FactoryBomDocument — Factory-facing RFQ BOM for supplier quoting
 *
 * 3-column layout: 尺寸圖紙 | 規格說明 | 報價
 * Quotation column: nested table with vertical borders, dashed fill-lines,
 * evenly distributed qty tiers.
 *
 * Chinese only (lang='zh' always). Based on BomDocument.tsx.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, DocumentHeader.tsx, DocumentFooter.tsx
 */

import React from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface FactoryBomPartSpec {
  label: string;
  value: string;
  valueZh?: string;
}

export interface FactoryBomPart {
  partId: string;
  thumbnail?: string;
  dimsMm: string;
  dimsIn: string;
  weight: string;
  filename: string;
  drawingFilename?: string;
  specs: FactoryBomPartSpec[];
  /** Quantity tiers for quoting, e.g. [1, 5, 10] */
  qtyTiers: number[];
}

export interface FactoryBomData {
  orderId: string;
  itemCount: number;
  totalParts: number | string;
  replyDeadline: string;
  parts: FactoryBomPart[];
}

interface FactoryBomDocumentProps {
  data: FactoryBomData;
}

/* ═══════════════════════════════════════════════════════════
   Locale (Chinese only)
   ═══════════════════════════════════════════════════════════ */

const LABEL_ZH: Record<string, string> = {
  Process: '製程',
  Material: '材質',
  Finish: '表處',
};

/* ═══════════════════════════════════════════════════════════
   Style constants
   ═══════════════════════════════════════════════════════════ */

const TH = [
  'text-[length:var(--doc-text-param-label)] font-semibold',
  'text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)]',
  'py-[var(--sp-1)] px-[var(--sp-3)]',
  'border-b border-[var(--gray-200)]',
].join(' ');

/* ── Quotation sub-column widths ── */
const QTY_COL = 56;
const DELIVERY_COL = 72;

/* ═══════════════════════════════════════════════════════════
   Inline icons (print-safe, ~10px)
   ═══════════════════════════════════════════════════════════ */

/** 3D/CAD file — isometric cube */
function IconCad() {
  return (
    <svg
      className="inline-block shrink-0"
      width="10" height="10" viewBox="0 0 10 10"
      fill="none"
      style={{ verticalAlign: '-1px' }}
    >
      <path d="M5 1L9 3.2V6.8L5 9L1 6.8V3.2Z" stroke="var(--gray-400)" strokeWidth="0.75" />
      <path d="M5 5.2L9 3.2M5 5.2L1 3.2M5 5.2V9" stroke="var(--gray-400)" strokeWidth="0.5" />
    </svg>
  );
}

/** Drawing/PDF file — page with folded corner */
function IconDrawing() {
  return (
    <svg
      className="inline-block shrink-0"
      width="10" height="10" viewBox="0 0 10 10"
      fill="none"
      style={{ verticalAlign: '-1px' }}
    >
      <path d="M2 1H6.5L8.5 3V9H2V1Z" stroke="var(--gray-400)" strokeWidth="0.75" />
      <path d="M6.5 1V3H8.5" stroke="var(--gray-400)" strokeWidth="0.5" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export const FactoryBomDocument = React.forwardRef<HTMLDivElement, FactoryBomDocumentProps>(
  function FactoryBomDocument({ data }, ref) {
    return (
      <div ref={ref} data-comp="FactoryBomDocument" className="doc-page">
        <DocumentHeader docType="BOM 表" />

        <div className="doc-content">
          {/* ── Title row ── */}
          <div className="flex items-baseline gap-[var(--sp-4)]">
            <span className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
              BOM
            </span>
            <span className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-title)]">
              {data.orderId}
            </span>
          </div>

          {/* ── Summary + deadline ── */}
          <div className="flex items-baseline justify-between">
            <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-500)]">
              {data.itemCount} 種零件
            </span>
            <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-500)]">
              回覆時間：{data.replyDeadline}
            </span>
          </div>

          {/* ── Table ── */}
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 180 }} />
              <col />
              <col style={{ width: 280 }} />
            </colgroup>

            <tbody>
              {/* ── Table header ── */}
              <tr className="bg-[var(--gray-50)]">
                <td className={`${TH} text-center border-r border-r-[var(--gray-100)]`}>
                  尺寸圖紙
                </td>
                <td className={`${TH} text-left border-r border-r-[var(--gray-100)]`}>
                  規格說明
                </td>
                <td className={`${TH} text-center`}>
                  報價
                </td>
              </tr>

              {data.parts.map((part, i) => (
                <FactoryBomRow key={part.partId} part={part} isLast={i === data.parts.length - 1} />
              ))}

              {/* ── Summary row ── */}
              <FactoryBomSummary data={data} />
            </tbody>
          </table>
        </div>

        <DocumentFooter docId={data.orderId} page={1} totalPages={1} />
      </div>
    );
  }
);

/* ═══════════════════════════════════════════════════════════
   FactoryBomRow — single part row (3 columns)
   ═══════════════════════════════════════════════════════════ */

function FactoryBomRow({ part, isLast }: { part: FactoryBomPart; isLast: boolean }) {
  return (
    <tr className={isLast ? '' : 'border-b border-[var(--gray-200)]'}>
      {/* ── VISUAL REFERENCE (center-aligned) ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)]">
        {/* Thumbnail */}
        <div
          className="bg-[var(--gray-50)] border border-[var(--gray-150)] rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center mb-[var(--sp-2)] mx-auto"
          style={{ width: 110, height: 88 }}
        >
          {part.thumbnail ? (
            <img src={part.thumbnail} alt={part.partId} className="w-full h-full object-contain" />
          ) : (
            <span className="text-[length:var(--doc-text-thumb-placeholder)] text-[color:var(--gray-300)] uppercase tracking-[var(--doc-tracking-label)]">
              3D
            </span>
          )}
        </div>

        {/* Dims mm · weight */}
        <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.6] whitespace-nowrap">
          {part.dimsMm} mm{'\u00a0\u00b7\u00a0'}{part.weight}
        </div>

        {/* Dims inches — small gray annotation */}
        <div className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)] leading-[1.4]">
          {part.dimsIn} in
        </div>
      </td>

      {/* ── SPECS (left-aligned) ── */}
      <td className="py-[var(--sp-3)] px-[var(--sp-2)] align-middle border-r border-r-[var(--gray-100)]">
        {/* Part ID */}
        <div className="text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-900)] mb-[var(--sp-1)]">
          {part.partId}
        </div>

        {/* File references — CAD + Drawing with icons */}
        <div className="flex flex-col gap-[var(--doc-sp-half)] mb-[var(--sp-3)]">
          <div className="flex items-center gap-[var(--sp-1)]">
            <IconCad />
            <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)]">
              {part.filename}
            </span>
          </div>
          {part.drawingFilename && (
            <div className="flex items-center gap-[var(--sp-1)]">
              <IconDrawing />
              <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)]">
                {part.drawingFilename}
              </span>
            </div>
          )}
        </div>

        {/* Specs — Process / Material / Finish */}
        <div className="flex flex-col gap-[var(--doc-sp-half)]">
          {part.specs.map(spec => (
            <div key={spec.label} className="flex items-baseline gap-[var(--sp-1)]">
              <span className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-400)] shrink-0" style={{ width: 28 }}>
                {LABEL_ZH[spec.label] || spec.label}
              </span>
              <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-900)]">
                {spec.valueZh || spec.value}
              </span>
            </div>
          ))}
        </div>
      </td>

      {/* ── QUOTATION — vertical borders, dashed fill-lines, even distribution ── */}
      <td className="py-0 px-0" style={{ height: 1 }}>
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: QTY_COL }} />
            <col />
            <col style={{ width: DELIVERY_COL }} />
          </colgroup>
          <tbody>
            {/* Per-part column labels — compact, fixed height */}
            <tr style={{ height: 12 }}>
              <td
                className="text-center px-[var(--sp-1)] py-[var(--doc-sp-half)] leading-none"
                style={{ borderBottom: '1px solid var(--gray-100)', borderRight: '1px dashed var(--gray-100)' }}
              >
                <span className="text-[length:var(--doc-text-param-label)] font-medium text-[color:var(--gray-300)] leading-none">數量</span>
              </td>
              <td
                className="text-center px-[var(--sp-2)] py-[var(--doc-sp-half)] leading-none"
                style={{ borderBottom: '1px solid var(--gray-100)', borderRight: '1px dashed var(--gray-100)' }}
              >
                <span className="text-[length:var(--doc-text-param-label)] font-medium text-[color:var(--gray-300)] leading-none">單價</span>
              </td>
              <td
                className="text-center px-[var(--sp-2)] py-[var(--doc-sp-half)] leading-none"
                style={{ borderBottom: '1px solid var(--gray-100)' }}
              >
                <span className="text-[length:var(--doc-text-param-label)] font-medium text-[color:var(--gray-300)] leading-none">交期</span>
              </td>
            </tr>
            {part.qtyTiers.map((qty, i) => (
              <tr key={qty} className={i < part.qtyTiers.length - 1 ? 'border-b border-[var(--gray-100)]' : ''}>
                {/* Qty — large number + small gray 件, vertically centered */}
                <td className="text-center align-middle px-[var(--sp-1)] border-r border-dashed border-r-[var(--gray-100)]">
                  <span className="text-[length:12px] font-bold text-[color:var(--gray-800)]">{qty}</span>
                  <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)] ml-[3px]">件</span>
                </td>
                {/* Price — $ prefix only */}
                <td className="align-middle px-[var(--sp-2)] border-r border-dashed border-r-[var(--gray-100)]">
                  <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)]">$</span>
                </td>
                {/* Delivery — 天 suffix only, right-aligned */}
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
  const minTotal = data.parts.reduce((sum, p) => sum + Math.min(...p.qtyTiers), 0);
  const maxTotal = data.parts.reduce((sum, p) => sum + Math.max(...p.qtyTiers), 0);

  return (
    <>
      {/* ── Min scenario row ── */}
      <tr className="border-t-[1.5px] border-t-[var(--gray-300)]">
        {/* Column 1 — spans both scenario rows */}
        <td
          rowSpan={2}
          className="py-[var(--sp-4)] px-[var(--sp-2)] text-center align-middle border-r border-r-[var(--gray-100)]"
        >
          <span className="text-[length:12px] font-bold text-[color:var(--gray-800)]">{data.itemCount}</span>
          <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)] ml-[3px]">種零件</span>
        </td>

        {/* Column 2 — min qty, centered in cell */}
        <td className="py-[var(--sp-4)] px-[var(--sp-3)] text-center align-baseline border-b border-b-[var(--gray-100)]">
          <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)] mr-[var(--sp-1)]">最低</span>
          <span className="text-[length:12px] font-bold text-[color:var(--gray-800)]">{minTotal}</span>
          <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)] ml-[3px]">件</span>
        </td>

        {/* Column 3 — min delivery, inline-block sub-columns for baseline alignment */}
        <td className="py-[var(--sp-4)] px-0 align-baseline border-b border-b-[var(--gray-100)]">
          <span
            className="inline-block text-center text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)]"
            style={{ width: QTY_COL }}
          >最低總交期</span><span
            className="inline-block text-right text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)]"
            style={{ width: `calc(100% - ${QTY_COL}px)`, paddingRight: 'var(--sp-2)' }}
          >天</span>
        </td>
      </tr>

      {/* ── Max scenario row ── */}
      <tr>
        <td className="py-[var(--sp-4)] px-[var(--sp-3)] text-center align-baseline">
          <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)] mr-[var(--sp-1)]">最多</span>
          <span className="text-[length:12px] font-bold text-[color:var(--gray-800)]">{maxTotal}</span>
          <span className="text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)] ml-[3px]">件</span>
        </td>

        <td className="py-[var(--sp-4)] px-0 align-baseline">
          <span
            className="inline-block text-center text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)]"
            style={{ width: QTY_COL }}
          >最多總交期</span><span
            className="inline-block text-right text-[length:var(--doc-text-param-label)] text-[color:var(--gray-400)]"
            style={{ width: `calc(100% - ${QTY_COL}px)`, paddingRight: 'var(--sp-2)' }}
          >天</span>
        </td>
      </tr>
    </>
  );
}

export default FactoryBomDocument;
