/**
 * PackingSlipDocument v6 — Shipment manifest for CNC machined parts
 *
 * v6 changes from v5:
 *   - Dimensions / Weight extracted from below the thumbnail into its own
 *     right-column cell, between QTY and Required Document Checklist
 *   - Thumbnail column is now a 1:1 square (width tracks card height via
 *     aspect-ratio), giving the image more breathing room
 *
 * v5 changes from v4:
 *   - Per-part document checklist designed for 0–3 items (not 5)
 *   - Thumbnail compacted: 200×200 → 140×140 (image column 200 → 160)
 *   - Card body tightened: qty row / docs section padding 14px → 10px
 *   - Empty docs state skipped entirely — card keeps proportion with note row only
 *
 * v4 changes from v3:
 *   - Removed blue hue from all neutral colors (pure neutral grays)
 *   - Primary theme color → 90% black (#1A1A1A)
 *   - Carrier/Incoterms info row values: removed bold (labels stay bold)
 *   - Compressed whitespace above Line Items (tighter header spacing)
 *
 * Full card reconstruction from v2:
 *   - Card header: compound ID "orderId_partId" (e.g. U26033148F_P01) + larger filename
 *   - Card body: qty row (prominent top) + dims/weight row (below divider)
 *   - Card footer: optional documents text list (no checkbox symbols) + optional note
 *   - No line number displayed — compound ID is the canonical identifier
 *
 * Info block redesigned:
 *   - Removed redundant order refs (Order / PO Ref / Invoice already in DocumentMeta)
 *   - Carrier info split into two-column grid for balanced density
 *
 * Address block:
 *   - Merged (soldTo absent or identical to shipTo): Ship From + Ship To side-by-side
 *   - Separate billing: Ship From left, then Sold To + Ship To side-by-side (2-col grid)
 *
 * Pagination: conservative CARDS_PAGE_1 = 2 (safe with comments + int'l overhead)
 *             CARDS_CONTINUATION = 4
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css,
 *   DocumentHeader, DocumentFooter, DocumentMeta, SectionLabel,
 *   SignatureRow, NotesList, WarningBox
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type            | Required | Default | Description                 |
 * |------|-----------------|----------|---------|-----------------------------|
 * | data | PackingSlipData | yes      | —       | Complete packing slip data  |
 *
 * ─── Usage ─────────────────────────────────────────────────────────────────
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   <PackingSlipDocument ref={ref} data={slipData} />
 */

import React from 'react';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { SignatureRow } from './SignatureRow';
import { NotesList } from './NotesList';
import { WarningBox } from './WarningBox';
import type { PartyInfo } from './PartiesRow';

export type { PartyInfo };

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface PackingSlipItem {
  lineNum: number;
  /** Part identifier. e.g. "P01" — combined with orderId to form compound header ID */
  partId: string;
  /** Drawing / model file name. e.g. "115425AT_P064454846468483.STEP" */
  fileName: string;
  /** Physical dimensions as string. e.g. "255.0 × 225.0 × 34.5 mm" */
  dims: string;
  /** Unit weight as string. e.g. "0.86 kg" */
  unitWeight: string;
  qtyOrdered: number;
  qtyShipped: number;
  /** Optional part image URL or base64 data URI. Omit → "3D" placeholder. */
  thumbnail?: string;
  /**
   * Required documents checklist — all rendered as empty ☐ for manual sign-off.
   * The dock worker / IQC inspector checks each box physically on the printed slip.
   * e.g. ['Certificate of Conformance (CoC)', 'AS9102 FAI Report', ...]
   */
  documents?: string[];
  /** Per-part note shown in card footer. Only rendered when present. */
  note?: string;
}

export interface PackingSlipData {
  slipId: string;
  /** Display date string. e.g. "April 20, 2026" */
  date: string;

  /* ── Cross-references ── */
  /** PRIMARY internal order reference — highlighted in brand color, used in compound card ID */
  orderId: string;
  /** Customer's PO number */
  poRef?: string;
  /** Forward reference if invoice has been issued */
  invoiceRef?: string;

  /* ── Parties ── */
  /** InstaVoxel — rendered compactly */
  shipFrom: PartyInfo;
  /**
   * Billing address ("Sold To").
   * If omitted or identical to shipTo → merged mode: Ship From + Ship To side-by-side.
   * If different → Ship From row, then Sold To + Ship To side-by-side (2-col grid).
   */
  soldTo?: PartyInfo;
  /** Physical delivery address — primary visual focus */
  shipTo: PartyInfo;

  /* ── Carrier ── */
  carrier: string;
  trackingNumber: string;
  shipMethod?: string;
  packages?: string;
  /** Carrier account number. e.g. "DHL#123-456-789" */
  userAccount?: string;

  /* ── International (conditional) ── */
  international?: boolean;
  countryOfOrigin?: string;
  /** Gross weight as string with kg unit, e.g. "6.8 kg". Pound equivalent is auto-calculated. */
  grossWeight?: string;
  incoterms?: string;

  /* ── Partial shipment (conditional) ── */
  isPartial?: boolean;
  /** e.g. "Shipment 1 of 2" */
  shipmentLabel?: string;

  /* ── Content ── */
  /**
   * Default documents checklist applied to every item that does not specify
   * its own `documents` array. Defines the standard set for this shipment.
   */
  defaultDocuments?: string[];
  items: PackingSlipItem[];

  /**
   * Free-text comment block — shown as "NOTES" section between address and items.
   * Only rendered when non-empty. Accepts multi-line text (newlines preserved).
   */
  comments?: string;

  /** Legacy bullet-list notes (last page, after items) */
  notes?: string[];
  contactName?: string;
  contactEmail?: string;
}

interface PackingSlipDocumentProps {
  data: PackingSlipData;
}

/* ═══════════════════════════════════════════════════════════
   Pagination
   ═══════════════════════════════════════════════════════════ */

/**
 * Conservative capacity estimates.
 * Page 1 carries: title / meta / carrier info / address / comments → more overhead.
 * Each card ≈ 130–160px (header + body + optional footers).
 * With ~300px overhead on page 1, leaving ~700px: 2 cards safe with notes/int'l.
 * Continuation pages have ~80px overhead: 4 cards.
 */
const CARDS_PAGE_1 = 2;
const CARDS_CONTINUATION = 4;

export function paginateItems(items: PackingSlipItem[]): PackingSlipItem[][] {
  if (items.length === 0) return [[]];
  const pages: PackingSlipItem[][] = [];
  let remaining = [...items];
  pages.push(remaining.slice(0, CARDS_PAGE_1));
  remaining = remaining.slice(CARDS_PAGE_1);
  while (remaining.length > 0) {
    pages.push(remaining.slice(0, CARDS_CONTINUATION));
    remaining = remaining.slice(CARDS_CONTINUATION);
  }
  return pages;
}

/* ═══════════════════════════════════════════════════════════
   Style constants
   ═══════════════════════════════════════════════════════════ */

const INLINE_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--gray-400)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--doc-tracking-label)',
  flexShrink: 0,
  width: 76,
  paddingTop: 3,
};

const CARD_LABEL: React.CSSProperties = {
  fontSize: 'var(--doc-text-label)',
  fontWeight: 600,
  color: 'var(--gray-400)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--doc-tracking-label)',
};

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

/** Convert mm dimensions string to inches. e.g. "255.0 × 225.0 × 34.5 mm" → "10.04 × 8.86 × 1.36 in" */
function convertDimsToInch(dims: string): string {
  // 1 mm = 0.0393701 in
  const nums = dims.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return dims;
  return nums.map(n => (parseFloat(n) * 0.0393701).toFixed(2)).join(' × ') + ' in';
}

/** Convert kg weight string to lb. e.g. "0.86 kg" → "1.90 lb" */
function convertWeightToLb(weight: string): string {
  // 1 kg = 2.20462 lb
  const match = weight.match(/([\d.]+)\s*kg/i);
  if (!match) return '';
  return (parseFloat(match[1]) * 2.20462).toFixed(2) + ' lb';
}

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

/** Single address entry: [inline label] [company name + address lines] */
function AddressEntry({ label, party }: { label: string; party: PartyInfo }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
      <span style={INLINE_LABEL}>{label}</span>
      <div>
        <div className="font-bold text-[color:var(--gray-900)]" style={{ fontSize: 14 }}>
          {party.name}
        </div>
        <div className="text-[color:var(--gray-900)] leading-[1.5]" style={{ fontSize: 13 }}>
          {party.lines.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < party.lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact key-value grid: auto-width labels + values.
 * Used for carrier info (left or right column).
 */
function InfoGrid({ items }: { items: { label: string; value: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: '76px 1fr', columnGap: 'var(--sp-3)', rowGap: 'var(--sp-1)', alignItems: 'center' }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <span className="font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)]" style={{ fontSize: 10, lineHeight: 1 }}>
            {item.label}
          </span>
          <span className="text-[color:var(--gray-900)]" style={{ fontSize: 13, lineHeight: 1, fontWeight: 400 }}>
            {item.value}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Per-part card (v3 reconstruction):
 *
 *   ┌─ COMPOUND_ID  filename.STEP ───────────────────────────┐
 *   ├───────────┬──────────────────────────────────────────┤
 *   │           │  QTY ORDERED    QTY SHIPPED               │
 *   │  [3D img] │  50             50                        │
 *   │           ├──────────────────────────────────────────┤
 *   │           │  DIMENSIONS          UNIT WEIGHT          │
 *   │           │  255.0×225.0×34.5mm  0.86 kg             │
 *   ├───────────┴──────────────────────────────────────────┤
 *   │  DOCUMENTS  CoC  ·  FAI  ·  Dimensional Inspection    │  (optional)
 *   ├──────────────────────────────────────────────────────┤
 *   │  NOTE  Part to be free of cutting fluid, debris…      │  (optional)
 *   └──────────────────────────────────────────────────────┘
 */
function PartCard({ item, orderId, defaultDocuments }: { item: PackingSlipItem; orderId: string; defaultDocuments?: string[] }) {
  const mismatch = item.qtyShipped !== item.qtyOrdered;
  const notShipped = item.qtyShipped === 0;
  const shortfall = item.qtyOrdered - item.qtyShipped;

  const qtyColor = 'var(--gray-900)';

  /** Compound identifier shown in card header — canonical part reference on this PS */
  const compoundId = `${orderId}_${item.partId}`;

  return (
    <div style={{
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>

      {/* ── Card header: compound ID + filename (compressed) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--sp-3)',
        padding: '4px var(--sp-3)',
        background: '#F5F5F5',
        borderBottom: '1px solid var(--gray-150)',
      }}>
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--color-primary)',
          flexShrink: 0,
          fontFamily: 'monospace',
          letterSpacing: '0.01em',
        }}>
          {compoundId}
        </span>
        {item.fileName && (
          <span style={{
            fontSize: 12,
            color: 'var(--gray-500)',
            fontFamily: 'monospace',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.fileName}
          </span>
        )}
      </div>

      {/* ── Card body: image left | right column stacked ──
          Note is a separate full-width footer below this flex row. */}
      <div style={{ display: 'flex' }}>

        {/* Image column — stretches vertically with card; inner thumbnail is a 1:1 square (compressed) */}
        <div style={{
          width: 140,
          flexShrink: 0,
          alignSelf: 'stretch',
          borderRight: '1px solid var(--gray-150)',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 140,
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            boxSizing: 'border-box',
          }}>
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.partId}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{
                fontSize: 'var(--doc-text-thumb-placeholder)',
                color: 'var(--gray-300)',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}>
                3D
              </span>
            )}
          </div>
        </div>

        {/* Right column — qty / weight / documents stacked */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Qty row (compressed) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--sp-4)',
            padding: '5px var(--sp-3)',
          }}>
            <div>
              <div style={{ ...CARD_LABEL, fontSize: 10 }}>Qty Ordered</div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--gray-900)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.15,
              }}>
                {item.qtyOrdered}
              </div>
            </div>
            <div>
              <div style={{ ...CARD_LABEL, fontSize: 10 }}>Qty Shipped</div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: qtyColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.15,
              }}>
                {item.qtyShipped}
                {mismatch && shortfall > 0 && (
                  <span style={{
                    fontSize: 'var(--doc-text-secondary)',
                    fontWeight: 400,
                    color: 'var(--gray-500)',
                    marginLeft: 5,
                  }}>
                    ({shortfall} to follow)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dimensions / Weight (compressed) */}
          <div style={{
            padding: '5px var(--sp-3)',
            borderTop: '1px solid var(--gray-150)',
          }}>
            <div style={{ ...CARD_LABEL, fontSize: 10, marginBottom: 1 }}>
              Dimensions · Weight
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-900)', whiteSpace: 'nowrap', lineHeight: 1.25 }}>
              {convertDimsToInch(item.dims)}{' · '}{convertWeightToLb(item.unitWeight)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--gray-500)', whiteSpace: 'nowrap', lineHeight: 1.25 }}>
              {item.dims}{' · '}{item.unitWeight}
            </div>
          </div>

          {/* Required documents checklist — always shown; "None" when empty (v5) */}
          {(() => {
            const docs = item.documents ?? defaultDocuments ?? [];
            return (
              <div style={{
                padding: '5px var(--sp-3)',
                borderTop: '1px solid var(--gray-150)',
                background: '#F5F5F5',
              }}>
                <div style={{ ...CARD_LABEL, fontSize: 10, marginBottom: 1 }}>
                  Required Document Checklist
                </div>
                {docs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {docs.map((name, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{
                          fontSize: 13,
                          color: 'var(--gray-400)',
                          flexShrink: 0,
                          lineHeight: 1.3,
                        }}>
                          ☐
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--gray-800)', lineHeight: 1.3 }}>
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    fontSize: 12,
                    color: 'var(--gray-400)',
                    fontStyle: 'italic',
                  }}>
                    None
                  </div>
                )}
              </div>
            );
          })()}

          {/* Note — always show label, content optional */}
          <div style={{
            display: 'flex',
            gap: 'var(--sp-2)',
            padding: '2px var(--sp-3)',
            borderTop: '1px solid var(--gray-150)',
            alignItems: 'flex-start',
          }}>
            <span style={{ ...CARD_LABEL, fontSize: 11, paddingTop: 2 }}>Note</span>
            {item.note && (
              <span style={{ fontSize: 14, color: 'var(--gray-700)' }}>{item.note}</span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   v4 neutral palette — overrides CSS vars via inline style
   (removes blue hue from grays; primary = 90% black)
   ═══════════════════════════════════════════════════════════ */
const V4_PALETTE = {
  '--font': "'Geist', 'Geist Sans', 'Inter', system-ui, sans-serif",
  fontFamily: "'Geist', 'Geist Sans', 'Inter', system-ui, sans-serif",
  '--color-primary': '#1A1A1A',
  '--color-primary-hover': '#000000',
  '--color-primary-light': '#333333',
  '--color-primary-subtle': '#E5E5E5',
  '--color-primary-wash': '#F5F5F5',
  '--color-primary-selected': '#EDEDED',
  '--color-primary-dark': '#000000',
  '--color-primary-muted': '#B8B8B8',
  '--gray-950': '#0A0A0A',
  '--gray-900': '#1A1A1A',
  '--gray-800': '#2E2E2E',
  '--gray-700': '#404040',
  '--gray-600': '#595959',
  '--gray-500': '#737373',
  '--gray-400': '#8F8F8F',
  '--gray-300': '#B8B8B8',
  '--gray-250': '#CCCCCC',
  '--gray-200': '#D9D9D9',
  '--gray-175': '#E6E6E6',
  '--gray-160': '#F0F0F0',
  '--gray-150': '#E5E5E5',
  '--gray-100': '#EDEDED',
  '--gray-75': '#F1F1F1',
  '--gray-60': '#F4F4F4',
  '--gray-50': '#F7F7F7',
} as React.CSSProperties;

export const PackingSlipDocumentV6 = React.forwardRef<HTMLDivElement, PackingSlipDocumentProps>(
  function PackingSlipDocumentV6({ data }, ref) {

    /* ── Derived values ── */
    const pages = paginateItems(data.items);
    const totalPages = pages.length;
    const totalOrdered = data.items.reduce((s, i) => s + i.qtyOrdered, 0);
    const totalShipped = data.items.reduce((s, i) => s + i.qtyShipped, 0);
    const hasShortage = totalShipped < totalOrdered;
    const hasDiscrepancy = data.items.some(i => i.qtyShipped !== i.qtyOrdered);

    /**
     * Derive display slipId: replace trailing numeric/alphanumeric suffix
     * with the last 3 characters of orderId.
     * e.g. slipId "PS-2026-0031" + orderId "U26033148F" → "PS-2026-48F"
     */
    const orderSuffix = data.orderId.slice(-3);
    const displaySlipId = data.slipId.replace(/[^-]+$/, `${orderSuffix}-1`);

    /*
     * Address merge logic:
     *   soldTo absent or identical to shipTo → merged (Ship From | Ship To side-by-side)
     *   soldTo different → Ship From row, then [Sold To | Ship To] 2-col grid
     */
    const isMerged = !data.soldTo || (
      data.soldTo.name === data.shipTo.name &&
      data.soldTo.lines.join('|') === data.shipTo.lines.join('|')
    );

    /* DocumentMeta: top-right of page 1 */
    const metaItems: MetaItem[] = [
      { label: 'Date',  value: data.date },
      { label: 'Order', value: data.orderId, highlight: true },
    ];
    if (data.poRef)      metaItems.push({ label: 'PO Ref',  value: data.poRef });

    /*
     * Carrier info — split into two columns for balanced density.
     * Order refs intentionally excluded (already in DocumentMeta top-right).
     */
    /* Left: 物流識別 — Carrier / Method / Account / Tracking */
    const carrierLeft: { label: string; value: string }[] = [
      { label: 'Carrier',  value: data.carrier },
    ];
    if (data.shipMethod)   carrierLeft.push({ label: 'Method',   value: data.shipMethod });
    if (data.userAccount)  carrierLeft.push({ label: 'Account',  value: data.userAccount });
    carrierLeft.push(       { label: 'Tracking', value: data.trackingNumber });

    /* Right: 物理規格 — Packages / Gross Wt / Incoterms(int'l only) */
    const carrierRight: { label: string; value: string }[] = [];
    if (data.packages)     carrierRight.push({ label: 'Packages', value: data.packages });
    if (data.grossWeight) {
      // Auto-convert kg → lb: 1 kg = 2.20462 lb
      const kgMatch = data.grossWeight.match(/([\d.]+)\s*kg/i);
      const grossDisplay = kgMatch
        ? `${(parseFloat(kgMatch[1]) * 2.20462).toFixed(1)} lb (${data.grossWeight})`
        : data.grossWeight;
      carrierRight.push({ label: 'Gross Wt', value: grossDisplay });
    }
    if (data.international && data.incoterms)
      carrierRight.push({ label: 'Incoterms', value: data.incoterms });

    /* ── Build sections array ── */
    const sections: PageSection[] = [];

    /* ── Header block: title + shipFrom + carrier + address (single section) ── */
    sections.push({
      key: 'header',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* Title row */}
          <div data-el="PackingSlipDocument-titleRow" className="flex items-start justify-between">
            <div>
              <div className="font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)] leading-none" style={{ fontSize: 27 }}>
                Packing Slip
              </div>
              <div className="flex items-center gap-[var(--sp-3)] mt-[var(--doc-sp-half)]">
                <span className="font-light text-[color:var(--gray-400)] tracking-[var(--doc-tracking-title)]" style={{ fontSize: 18 }}>
                  #{displaySlipId}
                </span>
                {data.isPartial && data.shipmentLabel && (
                  <span className="font-bold uppercase tracking-[var(--doc-tracking-label)] px-[var(--sp-2)] py-[var(--doc-sp-half)] bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)]" style={{ fontSize: 10 }}>
                    {data.shipmentLabel}
                  </span>
                )}
              </div>
            </div>
            {/* v5 compact meta — line-height:1 rows, tight row-gap, minimizes title-row height diff */}
            <div
              className="grid items-baseline"
              style={{
                gridTemplateColumns: 'auto auto',
                columnGap: 'var(--sp-2)',
                rowGap: '2px',
              }}
            >
              {metaItems.map((item, i) => (
                <React.Fragment key={i}>
                  <span
                    className="font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] text-right"
                    style={{ fontSize: 12, lineHeight: 1 }}
                  >
                    {item.label}
                  </span>
                  <span
                    className={[
                      'text-right',
                      item.highlight ? 'font-normal text-[color:var(--color-primary)]' : 'font-normal text-[color:var(--gray-900)]',
                    ].join(' ')}
                    style={{ fontSize: 15, lineHeight: 1 }}
                  >
                    {item.value}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Ship From */}
          <div data-el="PackingSlipDocument-shipFrom">
            <div className="font-bold text-[color:var(--gray-900)]" style={{ fontSize: 14 }}>
              {data.shipFrom.name}
            </div>
            <div className="text-[color:var(--gray-600)] leading-[1.4]" style={{ fontSize: 11 }}>
              {data.shipFrom.lines.map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < data.shipFrom.lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Carrier info */}
          <div
            data-el="PackingSlipDocument-carrier"
            className="grid grid-cols-2 gap-[var(--sp-6)] pt-[var(--doc-sp-1-5)] border-t border-[var(--gray-150)]"
          >
            <InfoGrid items={carrierLeft} />
            <InfoGrid items={carrierRight} />
          </div>

          {/* Address block */}
          <div
            data-el="PackingSlipDocument-address"
            className="flex flex-col gap-[var(--sp-1)] pt-[var(--doc-sp-1-5)] border-t border-[var(--gray-150)]"
          >
            {isMerged ? (
              <AddressEntry label="Ship To" party={data.shipTo} />
            ) : (
              <div className="grid grid-cols-2 gap-[var(--sp-6)]">
                <AddressEntry label="Sold To" party={data.soldTo!} />
                <AddressEntry label="Ship To" party={data.shipTo} />
              </div>
            )}
          </div>
        </div>
      ),
    });

    /* ── Comments (conditional) ── */
    if (data.comments) {
      sections.push({
        key: 'comments',
        content: (
          /* marginTop: -6 halves the ~12px inter-section spacer above Notes (MIN_GAP=12 in pagination.ts) */
          <div data-el="PackingSlipDocument-comments" style={{ marginTop: -6 }}>
            <SectionLabel>Notes</SectionLabel>
            <p
              className="text-[color:var(--gray-700)] mt-[var(--doc-sp-1-5)] leading-[1.6]"
              style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}
            >
              {data.comments}
            </p>
          </div>
        ),
      });
    }

    /* ── Items header ── */
    sections.push({
      key: 'items-header',
      group: 'items',
      content: (
        <div data-el="PackingSlipDocument-items">
          <SectionLabel>
            {`Line Items — ${data.items.length} part${data.items.length !== 1 ? 's' : ''}`}
          </SectionLabel>
        </div>
      ),
    });

    /* ── Individual part cards ── */
    data.items.forEach((item) => {
      sections.push({
        key: `item-${item.partId}-${item.lineNum}`,
        group: 'items',
        content: (
          <PartCard
            item={item}
            orderId={data.orderId}
            defaultDocuments={data.defaultDocuments}
          />
        ),
      });
    });

    /* ── Summary bar ── */
    sections.push({
      key: 'summary',
      content: (
        <div
          data-el="PackingSlipDocument-summary"
          className="flex items-center gap-[var(--sp-8)]"
          style={{
            fontVariantNumeric: 'tabular-nums',
            background: '#F5F5F5', /* print-safe: no hue → no CMYK color shift (was var(--gray-50) #F7F6FB) */
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--sp-3) var(--sp-4)',
          }}
        >
          <span className="text-[color:var(--gray-500)]" style={{ fontSize: 13 }}>
            {data.items.length} line item{data.items.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[color:var(--gray-500)]" style={{ fontSize: 13 }}>
            Ordered:{' '}
            <strong className="text-[color:var(--gray-800)]" style={{ fontSize: 16 }}>{totalOrdered}</strong> units
          </span>
          <span
            style={{ fontSize: 13, color: 'var(--gray-500)' }}
          >
            Shipped:{' '}
            <strong style={{ color: 'var(--gray-800)', fontSize: 16 }}>
              {totalShipped}
            </strong>{' '}units
            {hasShortage && (
              <span className="ml-[var(--sp-1)]">
                — {totalOrdered - totalShipped} to follow
              </span>
            )}
          </span>
        </div>
      ),
    });

    /* ── Partial shipment warning (conditional) ── */
    if (data.isPartial && hasDiscrepancy) {
      sections.push({
        key: 'partial-note',
        content: (
          <div>
            <SectionLabel>Partial Shipment</SectionLabel>
            <p style={{ fontSize: 13, color: 'var(--gray-700)', marginTop: 'var(--doc-sp-1-5)', lineHeight: 1.6 }}>
              {data.shipmentLabel ? `${data.shipmentLabel}.` : ''}
              {' '}Additional items will be shipped separately upon completion.
              {data.contactEmail && (
                <> Contact {data.contactName ?? 'InstaVoxel Shipping'} at {data.contactEmail} for schedule.</>
              )}
            </p>
          </div>
        ),
      });
    }

    /* ── General notes (conditional) ── */
    if (data.notes && data.notes.length > 0) {
      sections.push({
        key: 'notes',
        content: <NotesList label="Additional Notes" items={data.notes} />,
      });
    }


    return (
      <div ref={ref} data-comp="PackingSlipDocument" style={V4_PALETTE}>
        <PaginatedDocument
          docType="Packing Slip"
          docId={data.slipId}
          sections={sections}
          gap={3}
          maxGapFactor={1}
        />
      </div>
    );
  }
);

export default PackingSlipDocumentV6;
