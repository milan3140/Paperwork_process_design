/**
 * PackingSlipDocument v2 — FROZEN SNAPSHOT
 * Active development → PackingSlipDocument.tsx (v3)
 *
 * Per-part card layout. Each card has an image placeholder (or rendered thumbnail)
 * on the left and part details (dims, weight, qty ordered/shipped) on the right.
 * No document checklists shown. Comments section conditional.
 *
 * Three sequential readers:
 *   1. Dock worker   — confirms Ship To address, counts qty per part, signs
 *   2. IQC inspector — verifies each part's details against order
 *   3. AP clerk      — three-way match: PS# ↔ Order ID ↔ Invoice#
 *
 * Pagination: CARDS_PAGE_1 = 3 (page 1 has overhead: title/meta/address/comments)
 *             CARDS_CONTINUATION = 5 (continuation pages)
 *
 * Supports 3 address variants (via soldTo field):
 *   - soldTo not provided: Ship From + Ship To side-by-side (merged)
 *   - soldTo === shipTo:   Ship From + Ship To side-by-side (merged)
 *   - soldTo ≠ shipTo:     Ship From / Sold To / Ship To stacked
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css,
 *   DocumentHeader, DocumentFooter, SectionLabel, SignatureRow,
 *   NotesList, WarningBox
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
  /** Part identifier shown large in card header. e.g. "P01" */
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
  /** Per-part note. Shown in card footer row, only when present. */
  note?: string;
}

export interface PackingSlipData {
  slipId: string;
  /** Display date string. e.g. "April 20, 2026" */
  date: string;

  /* ── Cross-references ── */
  /** PRIMARY internal order reference — highlighted in brand color. (was quoteRef) */
  orderId: string;
  /** Customer's PO number */
  poRef?: string;
  /** Forward reference if invoice has been issued */
  invoiceRef?: string;

  /* ── Parties ── */
  /** InstaVoxel — rendered compactly, not the visual focus */
  shipFrom: PartyInfo;
  /**
   * Billing address ("Sold To").
   * If omitted or identical to shipTo → address block shows Ship From + Ship To
   * side-by-side (merged mode).
   * If different → shows Ship From / Sold To / Ship To stacked.
   */
  soldTo?: PartyInfo;
  /** Physical delivery address — visual primary in address block */
  shipTo: PartyInfo;

  /* ── Carrier ── */
  carrier: string;
  trackingNumber: string;
  shipMethod?: string;
  packages?: string;
  /** Carrier account number. e.g. "DHL#123456789" — for billing/AP */
  userAccount?: string;

  /* ── International (conditional) ── */
  international?: boolean;
  countryOfOrigin?: string;
  grossWeight?: string;
  netWeight?: string;
  incoterms?: string;

  /* ── Partial shipment (conditional) ── */
  isPartial?: boolean;
  /** e.g. "Shipment 1 of 2" — shown as badge in title */
  shipmentLabel?: string;

  /* ── Content ── */
  items: PackingSlipItem[];

  /**
   * Free-text comment block — shown as "NOTES" section between address and items.
   * Only rendered when non-empty. Accepts multi-line text.
   */
  comments?: string;

  /** Legacy general notes (bullet list, last page) */
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
 * Page 1 carries title / meta / address / comments overhead → fewer cards fit.
 * Continuation pages only have the items section header → more cards.
 * Tune if card heights change significantly.
 */
const CARDS_PAGE_1 = 3;
const CARDS_CONTINUATION = 5;

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
   Sub-components
   ═══════════════════════════════════════════════════════════ */

/**
 * Inline label style — matches SectionLabel typography but sits on the same
 * baseline as address content (not a block-level section header).
 * minWidth aligns all labels in the address block.
 */
const INLINE_LABEL: React.CSSProperties = {
  fontSize: 'var(--doc-text-label)',
  fontWeight: 600,
  color: 'var(--gray-400)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--doc-tracking-label)',
  flexShrink: 0,
  minWidth: 68,
  paddingTop: 1,  // optical alignment with company name baseline
};

/** Single address entry: [inline label] [company name + address lines] */
function AddressEntry({ label, party }: { label: string; party: PartyInfo }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
      <span style={INLINE_LABEL}>{label}</span>
      <div>
        <div className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)]">
          {party.name}
        </div>
        <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] leading-[1.5]">
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

/** Compact key-value grid: left-aligned labels + values. Used for carrier info. */
function InfoGrid({ items }: { items: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: 'auto 1fr', columnGap: 'var(--sp-2)', rowGap: 'var(--doc-sp-half)' }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <span className="text-[length:var(--doc-text-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)]">
            {item.label}
          </span>
          <span className={[
            'text-[length:var(--doc-text-meta-value)]',
            item.highlight
              ? 'font-bold text-[color:var(--color-primary)]'
              : 'font-semibold text-[color:var(--gray-900)]',
          ].join(' ')}>
            {item.value}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Per-part card label/value style constants ── */
const CARD_LABEL: React.CSSProperties = {
  fontSize: 'var(--doc-text-label)',
  fontWeight: 600,
  color: 'var(--gray-400)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--doc-tracking-label)',
};

const CARD_VALUE: React.CSSProperties = {
  fontSize: 'var(--doc-text-body)',
  fontWeight: 500,
  color: 'var(--gray-900)',
  fontVariantNumeric: 'tabular-nums',
};

/**
 * Per-part card:
 *   [header: lineNum · partId · fileName]
 *   [body: image placeholder (left) | dims / weight / qty (right)]
 *   [note footer — only when note present]
 *
 * No document checklist. Qty mismatch uses text color + inline diff, not bg color
 * (bg color disappears in B&W print).
 */
function PartCard({ item }: { item: PackingSlipItem }) {
  const mismatch = item.qtyShipped !== item.qtyOrdered;
  const notShipped = item.qtyShipped === 0;

  const qtyColor: string = notShipped
    ? 'var(--color-error)'
    : mismatch
      ? 'var(--color-warning-text)'
      : 'var(--gray-900)';

  return (
    <div style={{
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>
      {/* ── Card header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-2) var(--sp-3)',
        background: 'var(--gray-50)',
        borderBottom: '1px solid var(--gray-150)',
      }}>
        <span style={{
          fontSize: 'var(--doc-text-secondary)',
          color: 'var(--gray-400)',
          minWidth: 16,
          textAlign: 'right',
          flexShrink: 0,
        }}>
          {item.lineNum}
        </span>
        <span style={{
          fontSize: 'var(--doc-text-part-id)',
          fontWeight: 700,
          color: 'var(--gray-900)',
          flexShrink: 0,
        }}>
          {item.partId}
        </span>
        {item.fileName && (
          <span style={{
            fontSize: 'var(--doc-text-secondary)',
            color: 'var(--gray-400)',
            fontFamily: 'monospace',
            flex: 1,
            marginLeft: 'var(--sp-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.fileName}
          </span>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{ display: 'flex' }}>
        {/* Left: image placeholder (or thumbnail if provided) */}
        <div style={{
          width: 120,
          flexShrink: 0,
          borderRight: '1px solid var(--gray-150)',
          background: 'var(--gray-50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 84,
        }}>
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.partId}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 'var(--sp-2)' }}
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

        {/* Right: detail grid — 2 × 2 fields */}
        <div style={{
          flex: 1,
          padding: 'var(--sp-3)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--sp-2) var(--sp-6)',
          alignContent: 'start',
        }}>
          <div>
            <div style={CARD_LABEL}>Dimensions</div>
            <div style={CARD_VALUE}>{item.dims}</div>
          </div>
          <div>
            <div style={CARD_LABEL}>Unit Weight</div>
            <div style={CARD_VALUE}>{item.unitWeight}</div>
          </div>
          <div>
            <div style={CARD_LABEL}>Qty Ordered</div>
            <div style={CARD_VALUE}>{item.qtyOrdered}</div>
          </div>
          <div>
            <div style={CARD_LABEL}>Qty Shipped</div>
            <div style={{ ...CARD_VALUE, color: qtyColor, fontWeight: 700 }}>
              {item.qtyShipped}
              {/* Inline diff — text only, print-safe (no bg color) */}
              {mismatch && item.qtyShipped < item.qtyOrdered && (
                <span style={{
                  fontSize: 'var(--doc-text-secondary)',
                  fontWeight: 400,
                  color: 'var(--gray-500)',
                  marginLeft: 4,
                }}>
                  / {item.qtyOrdered}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Note footer (conditional) ── */}
      {item.note && (
        <div style={{
          display: 'flex',
          gap: 'var(--sp-3)',
          padding: 'var(--sp-2) var(--sp-3)',
          borderTop: '1px solid var(--gray-150)',
          background: 'var(--gray-50)',
        }}>
          <span style={CARD_LABEL}>Note</span>
          <span style={{ fontSize: 'var(--doc-text-body)', color: 'var(--gray-700)' }}>
            {item.note}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

export const PackingSlipDocument = React.forwardRef<HTMLDivElement, PackingSlipDocumentProps>(
  function PackingSlipDocument({ data }, ref) {

    /* ── Derived values ── */
    const totalOrdered = data.items.reduce((s, i) => s + i.qtyOrdered, 0);
    const totalShipped = data.items.reduce((s, i) => s + i.qtyShipped, 0);
    const hasShortage = totalShipped < totalOrdered;
    const hasDiscrepancy = data.items.some(i => i.qtyShipped !== i.qtyOrdered);

    /*
     * Address merge logic:
     *   - soldTo not provided → merged (Ship From + Ship To side-by-side)
     *   - soldTo identical to shipTo → merged
     *   - soldTo different → stacked (Ship From / Sold To / Ship To)
     */
    const isMerged = !data.soldTo || (
      data.soldTo.name === data.shipTo.name &&
      data.soldTo.lines.join('|') === data.shipTo.lines.join('|')
    );

    /* DocumentMeta: Date + Order ID (right side of title row) */
    const metaItems: MetaItem[] = [
      { label: 'Date', value: data.date },
      { label: 'Order', value: data.orderId, highlight: true },
    ];
    if (data.poRef)     metaItems.push({ label: 'PO Ref', value: data.poRef });
    if (data.invoiceRef) metaItems.push({ label: 'Invoice', value: data.invoiceRef });

    /* Carrier info grid (right column) */
    const carrierItems: { label: string; value: string }[] = [
      { label: 'Carrier', value: data.carrier },
    ];
    if (data.shipMethod)    carrierItems.push({ label: 'Method',   value: data.shipMethod });
    carrierItems.push(       { label: 'Tracking', value: data.trackingNumber });
    if (data.packages)      carrierItems.push({ label: 'Packages', value: data.packages });
    if (data.userAccount)   carrierItems.push({ label: 'Account',  value: data.userAccount });

    /* International fields append to carrier grid */
    if (data.international) {
      if (data.countryOfOrigin) carrierItems.push({ label: 'Origin',    value: data.countryOfOrigin });
      if (data.grossWeight)     carrierItems.push({ label: 'Gross Wt',  value: data.grossWeight });
      if (data.netWeight)       carrierItems.push({ label: 'Net Wt',    value: data.netWeight });
      if (data.incoterms)       carrierItems.push({ label: 'Incoterms', value: data.incoterms });
    }

    /* Order refs grid (left column) */
    const orderItems: { label: string; value: string; highlight?: boolean }[] = [
      { label: 'Order', value: data.orderId, highlight: true },
    ];
    if (data.poRef)      orderItems.push({ label: 'PO Ref',  value: data.poRef });
    if (data.invoiceRef) orderItems.push({ label: 'Invoice', value: data.invoiceRef });

    /* ── Build sections for PaginatedDocument ── */
    const sections: PageSection[] = [
      {
        key: 'title',
        content: (
          <div data-el="PackingSlipDocument-titleRow" className="flex items-start justify-between">
            <div>
              <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                Packing Slip
              </div>
              <div className="flex items-center gap-[var(--sp-3)] mt-[var(--doc-sp-half)]">
                <span className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-title)]">
                  #{data.slipId}
                </span>
                {/* Partial shipment badge */}
                {data.isPartial && data.shipmentLabel && (
                  <span className="text-[length:var(--doc-text-label)] font-bold uppercase tracking-[var(--doc-tracking-label)] px-[var(--sp-2)] py-[var(--doc-sp-half)] bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)]">
                    {data.shipmentLabel}
                  </span>
                )}
              </div>
            </div>
            {/* Right: Date + Order ID (AP quick-scan) */}
            <DocumentMeta items={metaItems} />
          </div>
        ),
      },
      {
        key: 'info-block',
        content: (
          <div
            data-el="PackingSlipDocument-infoBlock"
            className="grid grid-cols-2 gap-[var(--sp-8)] pt-[var(--sp-2)] border-t border-[var(--gray-150)]"
          >
            <InfoGrid items={orderItems} />
            <InfoGrid items={carrierItems} />
          </div>
        ),
      },
      {
        key: 'address',
        content: (
          <div
            data-el="PackingSlipDocument-address"
            className="flex flex-col gap-[var(--sp-2)] pt-[var(--doc-sp-1-5)] border-t border-[var(--gray-150)]"
          >
            {isMerged ? (
              /* Merged: Ship From + Ship To side-by-side on the same row */
              <div className="grid grid-cols-2 gap-[var(--sp-6)]">
                <AddressEntry label="Ship From" party={data.shipFrom} />
                <AddressEntry label="Ship To"   party={data.shipTo} />
              </div>
            ) : (
              /* Separate billing + delivery: stacked entries */
              <>
                <AddressEntry label="Ship From" party={data.shipFrom} />
                <div className="border-t border-[var(--gray-100)]" />
                <AddressEntry label="Sold To"  party={data.soldTo!} />
                <AddressEntry label="Ship To"  party={data.shipTo} />
              </>
            )}
          </div>
        ),
      },
    ];

    /* ── Comments (conditional) ── */
    if (data.comments) {
      sections.push({
        key: 'comments',
        content: (
          <div data-el="PackingSlipDocument-comments">
            <SectionLabel>Notes</SectionLabel>
            <p
              className="text-[length:var(--doc-text-body)] text-[color:var(--gray-700)] mt-[var(--doc-sp-1-5)] leading-[1.6]"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {data.comments}
            </p>
          </div>
        ),
      });
    }

    /* ── Items section label ── */
    sections.push({
      key: 'items-label',
      content: (
        <div data-el="PackingSlipDocument-items">
          <SectionLabel>
            {`Line Items — ${data.items.length} part${data.items.length !== 1 ? 's' : ''}`}
          </SectionLabel>
        </div>
      ),
      group: 'items',
    });

    /* ── Individual item cards ── */
    data.items.forEach((item) => {
      sections.push({
        key: `item-${item.partId}-${item.lineNum}`,
        content: <PartCard item={item} />,
        group: 'items',
      });
    });

    /* ── Summary bar — dock worker total count ── */
    sections.push({
      key: 'summary',
      content: (
        <div
          data-el="PackingSlipDocument-summary"
          className="flex items-center gap-[var(--sp-8)] py-[var(--sp-2)] border-t border-b border-[var(--gray-200)]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          <span className="text-[length:var(--doc-text-body)] text-[color:var(--gray-500)]">
            {data.items.length} line item{data.items.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[length:var(--doc-text-body)] text-[color:var(--gray-500)]">
            Ordered:{' '}
            <strong className="text-[color:var(--gray-800)]">{totalOrdered}</strong> units
          </span>
          <span
            className="text-[length:var(--doc-text-body)]"
            style={{ color: hasShortage ? 'var(--color-warning-text)' : 'var(--gray-500)' }}
          >
            Shipped:{' '}
            <strong style={{ color: hasShortage ? 'var(--color-warning-text)' : 'var(--gray-800)' }}>
              {totalShipped}
            </strong> units
            {hasShortage && (
              <span className="ml-[var(--sp-1)]">
                ▲ {totalOrdered - totalShipped} remaining
              </span>
            )}
          </span>
        </div>
      ),
    });

    /* ── Partial shipment warning (conditional) ── */
    if (data.isPartial && hasDiscrepancy) {
      sections.push({
        key: 'partial-warning',
        content: (
          <WarningBox>
            <strong>Partial Shipment</strong>
            {data.shipmentLabel ? ` — ${data.shipmentLabel}.` : '.'}
            {' '}Remaining quantities will follow in a subsequent shipment.
            {data.contactEmail && (
              <> Contact {data.contactName ?? 'InstaVoxel Shipping'} at {data.contactEmail} for schedule.</>
            )}
          </WarningBox>
        ),
      });
    }

    /* ── General notes (legacy bullet list, conditional) ── */
    if (data.notes && data.notes.length > 0) {
      sections.push({
        key: 'notes',
        content: <NotesList label="Additional Notes" items={data.notes} />,
      });
    }

    /* ── Signature ── */
    sections.push({
      key: 'signature',
      content: (
        <SignatureRow
          leftLabel="Verified & Packed By (InstaVoxel)"
          rightLabel="Received By (Customer)"
        />
      ),
    });

    return (
      <div ref={ref} data-comp="PackingSlipDocument">
        <PaginatedDocument
          docType="Packing Slip"
          docId={data.slipId}
          sections={sections}
        />
      </div>
    );
  }
);

export default PackingSlipDocument;
