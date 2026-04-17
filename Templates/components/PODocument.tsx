/**
 * PODocument — Purchase Order to Factory (採購單)
 *
 * Renders a complete, print-ready PO for InstaVoxel's contract manufacturers.
 * **Chinese-primary** document — all labels and content in Traditional Chinese,
 * with English as reference where needed (material specs, tolerances).
 *
 * Supports 3 supply modes (one component, conditional props):
 * - **代料加工** (standard): Factory sources materials and manufactures
 * - **來料加工** (material-supplied): InstaVoxel provides materials
 * - **轉包** (multi-factory): Parts route through multiple factories
 *
 * ⚠️ CRITICAL: PO to Factory must NEVER contain customer information.
 *   - No customer name, email, address, or project name
 *   - Drawings must use _processed versions (customer info erased)
 *   - Prices are factory cost only (no margin, no customer selling price)
 *   - Delivery address is InstaVoxel warehouse ONLY
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css,
 *   DocumentHeader, DocumentFooter, DocumentMeta, SectionLabel,
 *   PartiesRow, NotesList, SignatureRow, TermsSection
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type   | Required | Default | Description              |
 * |------|--------|----------|---------|--------------------------|
 * | data | POData | yes      | —       | Complete PO data object  |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <PODocument data={poData} />
 */

import React from 'react';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { PartiesRow, type PartyInfo } from './PartiesRow';
import { NotesList } from './NotesList';
import { SignatureRow } from './SignatureRow';
import { TermsSection } from './TermsSection';

/* ── Types ── */

export interface POPartItem {
  partId: string;
  /** Chinese abbreviation — critical for factory communication */
  zhCode: string;
  /** Material spec in Chinese (e.g., "鋁合金 6061-T6") */
  material: string;
  /** Surface finish in Chinese (e.g., "黑色陽極氧化", "標準") */
  finish: string;
  quantity: number;
  /** Factory cost price only — NEVER customer selling price */
  unitPrice: number;
  amount: number;
  /** Must be _processed version (customer info erased) */
  drawingRef: string;
  drawingVersion?: string;
  note?: string;
}

export type SupplyMode = 'standard' | 'material-supplied' | 'multi-factory';

export interface MaterialSupplyInfo {
  materialName: string;
  supplier: string;
  batchNumber: string;
  expectedArrival: string;
  storageNotes?: string;
}

export interface ProcessingStep {
  step: number;
  /** e.g., "CNC 加工", "刻字", "陽極氧化" */
  process: string;
  factoryName: string;
  factoryContact: string;
  /** Next factory or "InstaVoxel 倉庫" for final step */
  deliverTo: string;
}

export interface POData {
  poId: string;
  date: string;
  deliveryDate: string;

  /* ── Cross-references ── */
  bomRef: string;           // Factory BOM orderCode
  orderName?: string;       // Chinese codename for factory communication

  /* ── Parties ── */
  buyer: PartyInfo;         // InstaVoxel
  supplier: PartyInfo;      // Factory — Chinese name + address

  /* ── Supply mode ── */
  supplyMode: SupplyMode;
  supplyModeLabel: string;  // "代料加工" | "來料加工" | "轉包"

  /* ── Line items — factory cost only, NO customer pricing ── */
  parts: POPartItem[];

  /* ── Totals ── */
  subtotal: number;
  total: number;
  currency: string;         // "NTD" or "USD"

  /* ── Quality ── */
  qualityNotes: string[];
  inspectionLevel: string;
  requiredDocs: string[];

  /* ── Delivery — MUST be InstaVoxel warehouse, NEVER customer address ── */
  deliveryAddress: string;
  deliveryContact: string;
  deliveryPhone: string;
  packagingNotes?: string;

  /* ── Conditional: 來料加工 ── */
  materialSupply?: MaterialSupplyInfo;
  /* ── Conditional: 轉包 ── */
  processingRoute?: ProcessingStep[];

  /* ── Notes & Terms ── */
  notes: string[];
  termsText: string;
}

interface PODocumentProps {
  data: POData;
}

function fmt(n: number, currency: string): string {
  const sym = currency === 'NTD' ? 'NT$' : '$';
  return `${sym}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Table header cell ── */
const TH_CLASS = [
  'text-[length:var(--doc-text-param-label)] font-semibold',
  'text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]',
  'py-[var(--sp-1)] px-[var(--sp-2)]',
  'border-b border-[var(--gray-200)]',
  'text-left',
].join(' ');

const TD_CLASS = [
  'text-[length:var(--doc-text-body)]',
  'text-[color:var(--gray-900)]',
  'py-[var(--doc-sp-table-y)] px-[var(--sp-2)]',
  'border-b border-[var(--gray-150)]',
  'align-top',
].join(' ');

export const PODocument = React.forwardRef<HTMLDivElement, PODocumentProps>(
  function PODocument({ data }, ref) {

    const metaItems: MetaItem[] = [
      { label: '日期', value: data.date },
      { label: 'BOM 參考', value: data.bomRef, highlight: true },
      { label: '交貨日期', value: data.deliveryDate },
    ];

    /* ── Build sections array ── */
    const sections: PageSection[] = [
      /* Title + Meta */
      {
        key: 'title',
        content: (
          <div data-el="PODocument-titleRow" className="flex justify-between items-start">
            <div>
              <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                採購單
              </div>
              <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
                #{data.poId}
              </div>
              {data.orderName && (
                <div className="text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)] mt-[var(--sp-1)]">
                  {data.orderName}
                </div>
              )}
            </div>
            <DocumentMeta items={metaItems} />
          </div>
        ),
      },

      /* Parties (買方 + 供應商) */
      {
        key: 'parties',
        content: (
          <PartiesRow
            from={data.buyer}
            billTo={data.supplier}
            fromLabel="買方"
            toLabel="供應商"
          />
        ),
      },

      /* Supply Mode */
      {
        key: 'supplyMode',
        content: (
          <div data-el="PODocument-supplyMode">
            <SectionLabel>採購模式</SectionLabel>
            <div className="text-[length:var(--doc-text-part-id)] font-semibold text-[color:var(--gray-900)] mt-[var(--doc-sp-1-5)]">
              {data.supplyModeLabel}
            </div>
          </div>
        ),
      },

      /* Line Items Table */
      {
        key: 'items',
        content: (
          <div data-el="PODocument-items">
            <SectionLabel>品項明細（{data.parts.length} 項）</SectionLabel>
            <table className="w-full border-collapse mt-[var(--doc-sp-1-5)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr>
                  <th className={TH_CLASS} style={{ width: '80px' }}>工件號</th>
                  <th className={TH_CLASS}>材質</th>
                  <th className={TH_CLASS}>表處</th>
                  <th className={`${TH_CLASS} text-right`} style={{ width: '48px' }}>數量</th>
                  <th className={`${TH_CLASS} text-right`} style={{ width: '72px' }}>單價</th>
                  <th className={`${TH_CLASS} text-right`} style={{ width: '80px' }}>小計</th>
                  <th className={TH_CLASS}>圖面</th>
                </tr>
              </thead>
              <tbody>
                {data.parts.map((part) => (
                  <tr key={part.partId}>
                    <td className={TD_CLASS}>
                      <div className="text-[length:var(--doc-text-part-id)] font-bold">{part.partId}</div>
                      <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">{part.zhCode}</div>
                    </td>
                    <td className={`${TD_CLASS} font-medium`}>{part.material}</td>
                    <td className={TD_CLASS}>{part.finish === '標準' ? '—' : part.finish}</td>
                    <td className={`${TD_CLASS} text-right font-semibold`}>{part.quantity}</td>
                    <td className={`${TD_CLASS} text-right`}>{fmt(part.unitPrice, data.currency)}</td>
                    <td className={`${TD_CLASS} text-right font-semibold`}>{fmt(part.amount, data.currency)}</td>
                    <td className={`${TD_CLASS} text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)]`}>
                      {part.drawingRef}
                      {part.drawingVersion && <span className="text-[color:var(--gray-400)]"> ({part.drawingVersion})</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals — right-aligned */}
            <div className="flex justify-end mt-[var(--doc-sp-1-5)]">
              <table className="w-[var(--doc-w-totals)] border-collapse" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <tbody>
                  <tr>
                    <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right pr-[var(--sp-4)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)]">
                      小計
                    </td>
                    <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)]">
                      {fmt(data.subtotal, data.currency)}
                    </td>
                  </tr>
                  <tr data-el="PODocument-total">
                    <td
                      className="py-[var(--sp-2)] px-[var(--sp-2)] text-right pr-[var(--sp-4)] text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--color-primary)]"
                      style={{ borderTop: 'var(--doc-border-emphasis) solid var(--color-primary)' }}
                    >
                      合計
                    </td>
                    <td
                      className="py-[var(--sp-2)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-key-value)] font-bold text-[color:var(--color-primary)] bg-[var(--color-primary-selected)] rounded-[var(--radius-sm)]"
                      style={{ borderTop: 'var(--doc-border-emphasis) solid var(--color-primary)' }}
                    >
                      {fmt(data.total, data.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
    ];

    /* Conditional: Material Supply Info (來料加工 only) */
    if (data.supplyMode === 'material-supplied' && data.materialSupply) {
      sections.push({
        key: 'materialSupply',
        content: (
          <div data-el="PODocument-materialSupply">
            <SectionLabel>來料資訊</SectionLabel>
            <div className="flex flex-col mt-[var(--doc-sp-1-5)]">
              {[
                { label: '材料名稱', value: data.materialSupply.materialName },
                { label: '供應商', value: data.materialSupply.supplier },
                { label: '批號', value: data.materialSupply.batchNumber },
                { label: '預計送達', value: data.materialSupply.expectedArrival },
                ...(data.materialSupply.storageNotes ? [{ label: '存放要求', value: data.materialSupply.storageNotes }] : []),
              ].map((row) => (
                <div key={row.label} className="grid py-[var(--doc-sp-table-y)]" style={{ gridTemplateColumns: '80px 1fr' }}>
                  <span className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-400)]">{row.label}</span>
                  <span className="text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-900)]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      });
    }

    /* Conditional: Processing Route (轉包 only) */
    if (data.supplyMode === 'multi-factory' && data.processingRoute) {
      sections.push({
        key: 'processingRoute',
        content: (
          <div data-el="PODocument-processingRoute">
            <SectionLabel>製程路線</SectionLabel>
            <div className="flex flex-col gap-[var(--sp-2)] mt-[var(--doc-sp-1-5)]">
              {data.processingRoute.map((step, i) => (
                <div key={step.step} className="flex gap-[var(--sp-3)] items-start">
                  <div
                    className="shrink-0 w-[20px] h-[20px] rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-[length:var(--doc-text-secondary)] font-bold"
                  >
                    {step.step}
                  </div>
                  <div className="flex flex-col gap-[var(--doc-sp-half)] flex-1">
                    <div className="text-[length:var(--doc-text-part-id)] font-semibold text-[color:var(--gray-900)]">
                      {step.process}
                    </div>
                    <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)]">
                      {step.factoryName} · {step.factoryContact}
                    </div>
                    {i < data.processingRoute!.length - 1 && (
                      <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
                        → 轉送至：{step.deliverTo}
                      </div>
                    )}
                    {i === data.processingRoute!.length - 1 && (
                      <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
                        → 最終交付：{step.deliverTo}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      });
    }

    /* Remaining fixed sections */
    sections.push(
      /* Quality Requirements */
      {
        key: 'quality',
        content: (
          <div data-el="PODocument-quality">
            <SectionLabel>品質要求</SectionLabel>
            <div className="text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)] mt-[var(--doc-sp-1-5)]">
              檢驗等級：{data.inspectionLevel}
            </div>
            {data.qualityNotes.length > 0 && (
              <div className="mt-[var(--sp-2)]">
                <NotesList label="加工要求" items={data.qualityNotes} />
              </div>
            )}
            {data.requiredDocs.length > 0 && (
              <div className="mt-[var(--sp-2)]">
                <NotesList label="交貨時需附文件" items={data.requiredDocs} />
              </div>
            )}
          </div>
        ),
      },

      /* Delivery Info */
      {
        key: 'delivery',
        content: (
          <div data-el="PODocument-delivery">
            <SectionLabel>交付資訊</SectionLabel>
            <div className="flex flex-col mt-[var(--doc-sp-1-5)]">
              {[
                { label: '交貨地址', value: data.deliveryAddress },
                { label: '聯繫人', value: data.deliveryContact },
                { label: '電話', value: data.deliveryPhone },
                ...(data.packagingNotes ? [{ label: '包裝要求', value: data.packagingNotes }] : []),
              ].map((row) => (
                <div key={row.label} className="grid py-[var(--doc-sp-table-y)]" style={{ gridTemplateColumns: '80px 1fr' }}>
                  <span className="text-[length:var(--doc-text-secondary)] font-semibold text-[color:var(--gray-400)]">{row.label}</span>
                  <span className="text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-900)]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },

      /* Notes */
      {
        key: 'notes',
        content: <NotesList label="注意事項" items={data.notes} />,
      },

      /* Terms & Conditions */
      {
        key: 'terms',
        content: <TermsSection text={data.termsText} />,
      },

      /* Signature Row */
      {
        key: 'signature',
        content: (
          <SignatureRow
            leftLabel="買方簽章（InstaVoxel）"
            rightLabel="供應商簽章確認"
            nameSubLabel="姓名 / 職稱"
            dateSubLabel="日期"
          />
        ),
      },
    );

    return (
      <div ref={ref} data-comp="PODocument">
        <PaginatedDocument
          docType="採購單"
          docId={data.poId}
          sections={sections}
        />
      </div>
    );
  }
);

export default PODocument;
