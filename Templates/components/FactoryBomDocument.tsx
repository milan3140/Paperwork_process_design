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
  'text-[length:10px] font-semibold',
  'text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]',
  'py-[var(--sp-1)] px-[var(--sp-2)]',
  'border-b border-[var(--gray-200)]',
].join(' ');

/** Large bold style for key fields — 14px for factory-floor readability */
const KEY_VALUE = 'text-[length:14px] font-bold text-[color:var(--gray-900)]';

/* ── Quotation sub-column widths ── */
const QTY_COL = 60;
const DELIVERY_COL = 98;

/* ── Main column widths ── */
const COL_THUMBNAIL = 140;
const COL_PART_ID = 50;
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
  '本單所列交期天數均以工作天計算。若需改以日曆天報價，請於備註欄明確標示，或逕洽艾維確認。',
];

/* ── DFM notes — blank ruled area for factory remarks (last page only) ── */
const DFM_LINES = 4;

function DfmNotesSection() {
  return (
    <div className="flex-1 flex flex-col pt-[var(--sp-3)]">
      <div className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-600)] border-b border-[var(--gray-200)] pb-[var(--doc-sp-half)] mb-[var(--sp-2)]">
        加工備註
      </div>
      <div className="flex-1 flex flex-col">
        {Array.from({ length: DFM_LINES }, (_, i) => (
          <div
            key={i}
            className="flex-1 border-b border-dashed border-[var(--gray-200)]"
          />
        ))}
      </div>
    </div>
  );
}

function NotesSection() {
  return (
    <div className="mt-auto pt-[var(--sp-4)] pb-[10px]" style={{ paddingLeft: 'var(--doc-margin-x)', paddingRight: 'var(--doc-margin-x)' }}>
      <div className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-600)] border-b border-[var(--gray-200)] pb-[var(--doc-sp-half)] mb-[var(--sp-2)]">
        注意事項
      </div>
      <div className="flex flex-col gap-[var(--sp-1)]">
        {NOTES.map((note, i) => (
          <div key={i} className="text-[length:10px] text-[color:var(--gray-500)] leading-[1.6]">
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

/* ── Pagination constants ── */
const ROWS_PAGE_1 = 5;        // first page: title + metadata + table overhead → fewer rows
const ROWS_CONTINUATION = 7;  // continuation pages: just table header

function paginateParts(parts: FactoryBomPart[]) {
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


/* ── Shared colgroup ── */
function TableColgroup() {
  return (
    <colgroup>
      <col style={{ width: COL_THUMBNAIL }} />
      <col style={{ width: COL_PART_ID }} />
      <col style={{ width: COL_MATERIAL }} />
      <col style={{ width: COL_FINISH }} />
      <col />
    </colgroup>
  );
}

/* ── Header band (every page) ── */
function HeaderBand({ data }: { data: FactoryBomData }) {
  return (
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
  );
}

export const FactoryBomDocument = React.forwardRef<HTMLDivElement, FactoryBomDocumentProps>(
  function FactoryBomDocument({ data }, ref) {
    const { minSum, midSum, maxSum } = computeTotals(data.parts);
    const pages = paginateParts(data.parts);
    const totalPages = pages.length;

    return (
      <div ref={ref} data-comp="FactoryBomDocument" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {pages.map((pageParts, pageIdx) => {
          const isFirst = pageIdx === 0;
          const isLast = pageIdx === totalPages - 1;
          // Global index offset for part keys
          const offset = isFirst ? 0 : ROWS_PAGE_1 + (pageIdx - 1) * ROWS_CONTINUATION;

          return (
            <div key={pageIdx} className="doc-page" style={{ height: 'var(--doc-page-h)' }}>
              <HeaderBand data={data} />

              <div className="doc-content" style={{ gap: 'var(--sp-3)' }}>
                {/* ── Title + metadata only on first page ── */}
                {isFirst && (
                  <>
                    <div className="flex gap-[var(--sp-4)]">
                      <span className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                        RFQ BOM
                      </span>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-title)]">
                          {data.orderId}
                        </span>
                        <span className="text-[length:12px] font-bold text-[color:var(--color-error)]">
                          最晚報價時間：{data.replyDeadline}
                        </span>
                      </div>
                    </div>

                  </>
                )}

                {/* ── Table ── */}
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <TableColgroup />
                  <thead>
                    {/* ── Metadata row (first page only) — inside thead for seamless guide lines ── */}
                    {isFirst && (
                      <tr>
                        <td
                          className="relative py-[var(--sp-2)] px-[var(--sp-2)]"
                          style={{ verticalAlign: 'middle' }}
                        >
                          <span className="absolute bottom-0 border-l border-l-[var(--gray-100)]" style={{ left: -0.5, height: '66%' }} />
                          <span className="text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-800)]">
                            零件種類：<span className={KEY_VALUE}>{data.itemCount}</span> 種
                          </span>
                        </td>
                        <td colSpan={3} />
                        <td
                          className="relative py-[var(--sp-2)] px-[var(--sp-2)] whitespace-nowrap"
                          style={{ verticalAlign: 'middle' }}
                        >
                          <span className="absolute bottom-0 border-l border-l-[var(--gray-100)]" style={{ left: 0, height: '66%' }} />
                          <span className="text-[length:var(--doc-text-part-id)] text-[color:var(--gray-800)]">共{' '}</span>
                          <span className={KEY_VALUE}>{minSum}</span>
                          <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]"> / </span>
                          <span className={KEY_VALUE}>{midSum}</span>
                          <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]"> / </span>
                          <span className={KEY_VALUE}>{maxSum}</span>
                          <span className="text-[length:var(--doc-text-part-id)] text-[color:var(--gray-800)]">{' '}件</span>
                        </td>
                      </tr>
                    )}
                    {/* ── Column headers ── */}
                    <tr className="bg-[var(--gray-50)]">
                      <td className={`${TH} text-center ${isFirst ? 'border-l border-l-[var(--gray-100)]' : ''} border-r border-r-[var(--gray-100)]`}>尺寸圖紙</td>
                      <td className={`${TH} text-center border-r border-r-[var(--gray-100)]`}>工件號</td>
                      <td className={`${TH} text-center border-r border-r-[var(--gray-100)]`}>材質</td>
                      <td className={`${TH} text-center border-r border-r-[var(--gray-100)]`}>表處</td>
                      <td className={TH} style={{ padding: 0 }}>
                        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                          <colgroup>
                            <col style={{ width: QTY_COL }} />
                            <col />
                            <col style={{ width: DELIVERY_COL }} />
                          </colgroup>
                          <tbody><tr>
                            <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]"
                                style={{ borderRight: '1px dashed var(--gray-100)' }}>
                              <span className="text-[length:10px] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]">數量</span>
                            </td>
                            <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]"
                                style={{ borderRight: '1px dashed var(--gray-100)' }}>
                              <span className="text-[length:10px] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]">單價</span>
                            </td>
                            <td className="text-center py-[var(--sp-1)] px-[var(--sp-1)]">
                              <span className="text-[length:10px] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]">交期</span>
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
                    {isLast && <FactoryBomSummary data={data} />}
                  </tbody>
                </table>

                {isLast && <DfmNotesSection />}
              </div>

              <NotesSection />
              <DocumentFooter docId={data.orderId} page={pageIdx + 1} totalPages={totalPages} />
            </div>
          );
        })}
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
                  <span className="text-[length:10px] text-[color:var(--gray-400)] ml-[3px]">件</span>
                </td>
                <td className="align-middle px-[var(--sp-2)]"
                    style={{ borderRight: '1px dashed var(--gray-100)' }}>
                  <span className="text-[length:10px] text-[color:var(--gray-400)]">$</span>
                </td>
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
   FactoryBomSummary — totals row at the bottom
   ═══════════════════════════════════════════════════════════ */

const LABEL = 'text-[length:10px] font-bold text-[color:var(--gray-400)]';

function FactoryBomSummary({ data }: { data: FactoryBomData }) {
  const { minSum, midSum, maxSum } = computeTotals(data.parts);
  const tiers = [minSum, midSum, maxSum];

  return (
    <>
      {tiers.map((_, i) => {
        const rowBorder = i < tiers.length - 1 ? 'border-b border-b-[var(--gray-100)]' : '';
        return (
          <tr
            key={i}
            className={i === 0 ? 'border-t-[1.5px] border-t-[var(--gray-300)]' : ''}
          >
            {/* col 1 — 方案名，置中於尺寸圖紙欄 */}
            <td className={`py-[var(--sp-3)] text-center ${rowBorder}`}>
              <span className={LABEL}>{['方案一', '方案二', '方案三'][i]}</span>
            </td>

            {/* col 2 (工件號) — 整單共，置中對齊工件號欄 */}
            <td className={`py-[var(--sp-3)] text-center ${rowBorder}`}>
              <span className={LABEL}>整單共</span>
            </td>

            {/* col 3 (材質) — 純留白填寫區 */}
            <td className={`py-[var(--sp-3)] ${rowBorder}`} />

            {/* col 4 (表處) — 件 + 逗號居中於右邊界 */}
            <td className={`py-[var(--sp-3)] text-right relative ${rowBorder}`}
                style={{ paddingRight: 'var(--sp-3)', overflow: 'visible' }}>
              <span className={LABEL}>件</span>
              <span className={LABEL} style={{ position: 'absolute', right: 0, transform: 'translateX(50%)' }}>,</span>
            </td>

            {/* col 5 (報價) — 交期共 ___ 工作天（右端對齊天字） */}
            <td className={`py-[var(--sp-3)] ${rowBorder}`}
                style={{ paddingLeft: 'var(--sp-3)', paddingRight: 'var(--sp-2)' }}>
              <div className="flex items-baseline">
                <span className={LABEL}>交期共</span>
                <span className="flex-1" />
                <span className={LABEL}>工作天</span>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

export default FactoryBomDocument;
