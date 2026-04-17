/**
 * CoCDocument_v2 — Certificate of Conformance for CNC machined parts (v2)
 *
 * Redesigned from v1 with unified parts table, ISSUED BY | CUSTOMER two-column
 * header, and COMPLIANCE | DRAWING REFERENCES two-column section.
 *
 * Key changes from v1:
 *   - Unified CERTIFIED ITEMS table (# / Part No. / Description / Rev / Ordered / Shipped / Lot #)
 *   - ISSUED BY (hardcoded InstaVoxel) | CUSTOMER (with Attn: contact)
 *   - Drawing References moved next to Compliance section
 *   - Material & Process section removed (info integrated into parts table)
 *   - Notes rendered as fixed-height bordered box
 *   - Simplified AUTHORIZED RELEASE (no pre-signature certify text)
 *   - quantity → quantityOrdered + quantityShipped
 *
 * Layout:
 *   [Title + Meta]
 *   [Certification Statement — full width]
 *   [ISSUED BY | CUSTOMER — 2-col]
 *   [CERTIFIED ITEMS — full-width table]
 *   [COMPLIANCE + Country of Origin | DRAWING REFERENCES — 2-col]
 *   [NOTES — fixed-height bordered box]
 *   [AUTHORIZED RELEASE — 3-col signature]
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css,
 *   DocumentHeader, DocumentFooter, DocumentMeta, SectionLabel
 *
 * ─── Props ──────────────────────────────────────────────────────────────────
 *
 * | Name | Type      | Required | Description              |
 * |------|-----------|----------|--------------------------|
 * | data | CoCDataV4 | yes      | Complete CoC data object |
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   <CoCDocumentV4 ref={ref} data={cocData} />
 */

import React, { useEffect } from 'react';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { PRINT_ICONS } from './Icons_Print';

const GEIST_FONT_STACK =
  "'Geist', 'Noto Sans TC', 'PingFang TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/** Inject Geist font from Google Fonts once per session. */
function useGeistFont() {
  useEffect(() => {
    const id = 'geist-font-link';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

/**
 * Applied to every section below the certification `statement`:
 *   - Font family: Geist Sans
 *   - Base size: 12px (overrides any inherited fontSize without explicit px)
 *   - `--doc-text-*` custom properties pinned to 12px so inline
 *     `fontSize: 'var(--doc-text-label)'` (default 9px) etc. resolve to 12.
 * Ancestor `pageStyle` handles colors; this only touches typography.
 */
const BELOW_STATEMENT_STYLE: React.CSSProperties = {
  fontFamily: GEIST_FONT_STACK,
  fontSize: 14,
  /* Section headers (Issued By, Customer, Certified Items, Notes,
     Authorized Release) + table column headers + signerTitle label
     all read from --doc-text-label → pin to 12px. */
  ['--doc-text-label' as any]: '12px',
  ['--doc-text-body' as any]: '14px',
  ['--doc-text-secondary' as any]: '14px',
  ['--doc-text-footer' as any]: '14px',
};

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

/** Per-part entry for the certified items table */
export interface CoCPartEntryV4 {
  /** Short part identifier e.g. "P01" */
  partId: string;
  /** InstaVoxel quoted part ID e.g. "U26033148F_P01" */
  quotedPartId?: string;
  /** Customer-facing part name/description e.g. "Bracket Plate" */
  partName?: string;
  /** PDF drawing reference e.g. "115425AT_BracketPlate_Rev.C.pdf" */
  drawingRef?: string;
  /** Drawing revision e.g. "Rev C" */
  drawingRev?: string;
  /** Material spec e.g. "Aluminum 6061-T6" */
  material: string;
  /** Surface finish e.g. "Anodize Type II" */
  finish: string;
  /** Material lot / heat number e.g. "LOT-2026-0412" */
  materialLot?: string;
  /** Quantity ordered */
  quantityOrdered: number;
  /** Quantity shipped */
  quantityShipped: number;
  /** Unit e.g. "pcs" */
  unit?: string;
}

/** Compliance declaration item */
export interface CoCComplianceItemV4 {
  /** e.g. "RoHS Directive 2011/65/EU" */
  label: string;
  /** true = ☑ brand primary, false = ☐ gray */
  compliant: boolean;
  /** e.g. "Compliant" or "N/A" */
  status?: string;
}

export interface CoCDataV4 {
  /** CoC document number e.g. "COC-2026-0031" */
  cocId: string;
  /** Issue date string e.g. "April 20, 2026" */
  date: string;

  /* ── Cross-references ── */
  /** PRIMARY order reference — highlighted in meta */
  orderId: string;
  packingSlipRef?: string;
  poRef?: string;
  invoiceRef?: string;

  /* ── Customer ── */
  customerName: string;
  /** Contact person / Attn line e.g. "Amy Ishler" */
  customerContact?: string;
  /** Address lines rendered verbatim */
  customerAddress?: string[];
  customerRevision?: string;
  customerSerial?: string;

  /* ── Parts ── */
  parts: CoCPartEntryV4[];

  /* ── Shipment ── */
  countryOfOrigin?: string;

  /* ── Compliance ── */
  compliance: CoCComplianceItemV4[];

  /* ── Notes ── */
  notes?: string;

  /* ── Authorization ── */
  signerName?: string;
  signerTitle?: string;
}

interface CoCDocumentV4Props {
  data: CoCDataV4;
}

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

/** Hardcoded InstaVoxel issuer info (matches current production CoC) */
const ISSUED_BY = {
  name: 'InstaVoxel, Inc.',
  lines: [
    '859 Willard Street Suite 400',
    'Quincy MA 02169 USA',
    'info@instavoxel.com | (617) 302-1629',
  ],
};

/** Parts table column widths:
 *  # / Part No. / (spacer) / Specification / Ordered / (right spacer).
 *  Track 3 = 30px spacer nudges Specification rightward without compressing it.
 *  Right spacer (20px) provides breathing room after Ordered. */
const TABLE_COLS = '20px 200px 30px 1fr 52px 20px';

/* ═══════════════════════════════════════════════════════════
   Style constants
   ═══════════════════════════════════════════════════════════ */

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 'var(--doc-text-label)',
  fontWeight: 300,
  color: 'var(--gray-400)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--doc-tracking-label)',
  lineHeight: 1,
};

const PARTY_NAME: React.CSSProperties = {
  fontSize: 'var(--doc-text-body)',
  fontWeight: 300,
  color: 'var(--gray-900)',
  lineHeight: 1.3,
};

const PARTY_LINE: React.CSSProperties = {
  fontSize: 'var(--doc-text-secondary)',
  color: 'var(--gray-600)',
  lineHeight: 1.4,
};

const PARTY_LABEL: React.CSSProperties = {
  fontSize: 'var(--doc-text-label)',
  fontWeight: 600,
  color: 'var(--gray-400)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--doc-tracking-label)',
  marginRight: 6,
};

const FIELD_VALUE: React.CSSProperties = {
  fontSize: 'var(--doc-text-body)',
  fontWeight: 500,
  color: 'var(--gray-900)',
  lineHeight: 1.4,
};

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

export const CoCDocumentV4 = React.forwardRef<HTMLDivElement, CoCDocumentV4Props>(
  function CoCDocumentV4({ data }, ref) {
    useGeistFont();

    const metaItems: MetaItem[] = [
      { label: 'Date',    value: data.date, weight: 'light', labelWeight: 'light' },
      { label: 'Order',   value: data.orderId, highlight: true, weight: 'light', labelWeight: 'light' },
    ];
    if (data.packingSlipRef) metaItems.push({ label: 'Packing Slip Ref',  value: data.packingSlipRef, weight: 'light', labelWeight: 'light' });
    if (data.poRef)          metaItems.push({ label: 'PO Ref',  value: data.poRef, weight: 'light', labelWeight: 'light' });

    /**
     * Derive display cocId: replace trailing "-NNNN" segment with the orderId body
     * (orderId minus the "U26" quote prefix) concatenated to the year + "-1".
     * e.g. cocId "COC-2026-0031" + orderId "U26033148F" → "COC-2026033148F-1"
     */
    const orderBody = data.orderId.slice(3);
    const displayCocId = data.cocId.replace(/-[^-]+$/, `${orderBody}-1`);

    const sections: PageSection[] = [
      /* ── ISSUED BY | CUSTOMER — 2-col ── */
      {
        key: 'parties',
        content: (
          <div
            data-el="CoCV2-parties"
            style={{ ...BELOW_STATEMENT_STYLE, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-8)', marginTop: 'var(--sp-3)' }}
          >
            {/* Left: Issued By */}
            <div>
              <div style={{ ...SECTION_LABEL_STYLE, display: 'block', paddingBottom: 'var(--sp-2)', borderBottom: '1px solid var(--gray-200)' }}>Issued By</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'var(--doc-sp-1-5)' }}>
                <span style={PARTY_NAME}>{ISSUED_BY.name}</span>
                {ISSUED_BY.lines.map((line, i) => (
                  <span key={i} style={PARTY_LINE}>{line}</span>
                ))}
              </div>
            </div>

            {/* Right: Customer */}
            <div>
              <div style={{ ...SECTION_LABEL_STYLE, display: 'block', paddingBottom: 'var(--sp-2)', borderBottom: '1px solid var(--gray-200)' }}>Customer</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'var(--doc-sp-1-5)' }}>
                <span style={PARTY_NAME}>{data.customerName}</span>
                {data.customerContact && (
                  <span style={PARTY_LINE}>{data.customerContact}</span>
                )}
                {data.customerAddress?.map((line, i) => (
                  <span key={i} style={PARTY_LINE}>{line}</span>
                ))}
                {data.customerSerial && data.customerSerial !== 'N/A' && (
                  <span style={PARTY_LINE}>{data.customerSerial}</span>
                )}
              </div>
            </div>
          </div>
        ),
      },

      /* ── Certification statement ── */
      {
        key: 'statement',
        content: (
          <div
            data-el="CoCV2-statement"
            style={{
              borderLeft: '3px solid var(--color-primary)',
              paddingLeft: 'var(--sp-4)',
              paddingTop: 'var(--sp-1)',
              paddingBottom: 'var(--sp-1)',
            }}
          >
            <p style={{
              fontSize: 18,
              color: 'var(--gray-700)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              We hereby certify that all products listed herein have been manufactured, inspected,
              and tested in accordance with the customer's drawings, specifications, and purchase
              order requirements referenced in this document. All processes, materials, and
              workmanship conform to the applicable standards and specifications.
            </p>
          </div>
        ),
      },

      /* ── CERTIFIED ITEMS — full-width table ── */
      {
        key: 'items',
        content: (
          <div data-el="CoCV2-items" style={BELOW_STATEMENT_STYLE}>
            <SectionLabel className="!font-light">Certified Items</SectionLabel>

            <div style={{ marginTop: 'var(--doc-sp-1-5)' }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: TABLE_COLS,
                gap: 'var(--sp-3)',
                paddingBottom: 'var(--sp-1)',
                borderBottom: '1px solid var(--gray-200)',
              }}>
                {[
                  { label: '#',             align: 'left',  col: 1 },
                  { label: 'Part No.',      align: 'left',  col: 2 },
                  { label: 'Specification', align: 'left',  col: 4 },
                  { label: 'Ordered',       align: 'right', col: 5 },
                ].map(({ label, align, col }) => (
                  <span key={label} style={{
                    fontSize: 'var(--doc-text-label)',
                    fontWeight: 300,
                    color: 'var(--gray-400)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--doc-tracking-label)',
                    textAlign: align as React.CSSProperties['textAlign'],
                    gridColumn: col,
                  }}>
                    {label}
                  </span>
                ))}
              </div>

              {/* Data rows */}
              {data.parts.map((part, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: TABLE_COLS,
                    gap: 'var(--sp-3)',
                    padding: 'var(--sp-3) 0',
                    borderBottom: '1px solid var(--gray-100)',
                    alignItems: 'center',
                  }}
                >
                  {/* # */}
                  <span style={{
                    gridColumn: 1,
                    fontSize: 'var(--doc-text-secondary)',
                    color: 'var(--gray-400)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {i + 1}
                  </span>

                  {/* Part No. + Rev suffix */}
                  <span style={{
                    gridColumn: 2,
                    fontSize: 'var(--doc-text-secondary)',
                    color: 'var(--gray-700)',
                    wordBreak: 'break-all',
                  }}>
                    {part.quotedPartId ?? part.partId}
                    {part.drawingRev && ` ${part.drawingRev.toUpperCase().replace('REV ', 'REV.')}`}
                  </span>

                  {/* Specification */}
                  <div style={{ gridColumn: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{
                      fontSize: 'var(--doc-text-body)',
                      fontWeight: 300,
                      color: 'var(--gray-900)',
                      lineHeight: 1.3,
                    }}>
                      {part.material} · {part.finish}
                    </span>
                  </div>

                  {/* QTY Ordered */}
                  <span style={{
                    gridColumn: 5,
                    fontSize: 'var(--doc-text-body)',
                    fontWeight: 300,
                    color: 'var(--gray-700)',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {part.quantityOrdered}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ),
      },

      /* ── NOTES — fixed-height bordered box ── */
      {
        key: 'notes',
        content: (
          <div data-el="CoCV2-notes" style={BELOW_STATEMENT_STYLE}>
            <span style={SECTION_LABEL_STYLE}>Notes</span>
            <div style={{
              marginTop: 'var(--doc-sp-1-5)',
              padding: 'var(--sp-3) 0',
              minHeight: 88,
            }}>
              {data.notes && (
                <p style={{
                  fontSize: 'var(--doc-text-body)',
                  color: 'var(--gray-700)',
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {data.notes}
                </p>
              )}
            </div>
          </div>
        ),
      },

      /* ── AUTHORIZED RELEASE — D: inline label in rule ── */
      {
        key: 'signature',
        content: (
          <div data-el="CoCV2-signature" style={{ ...BELOW_STATEMENT_STYLE, marginTop: 'var(--sp-2)' }}>

            {/* Title */}
            <span style={{
              fontSize: 'var(--doc-text-label)',
              fontWeight: 300,
              color: 'var(--gray-400)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--doc-tracking-label)',
            }}>
              Authorized Release
            </span>

            {/* Signature / Title / Date — single row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 'var(--sp-6)',
              marginTop: 'var(--sp-5)',
            }}>
              {/* Signature */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <div style={{ minHeight: 50, borderBottom: '1px solid var(--gray-200)' }} />
                <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>
                  Signature
                </span>
              </div>

              {/* Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <div style={{
                  minHeight: 50,
                  borderBottom: '1px solid var(--gray-200)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  paddingBottom: 2,
                }}>
                  {data.signerTitle && (
                    <span style={{
                      fontSize: 'var(--doc-text-label)',
                      fontWeight: 300,
                      color: 'var(--gray-400)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--doc-tracking-label)',
                    }}>
                      {data.signerTitle}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>Title</span>
              </div>

              {/* Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <div style={{ minHeight: 50, borderBottom: '1px solid var(--gray-200)' }} />
                <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>Date</span>
              </div>
            </div>
          </div>
        ),
      },
    ];

    return (
      <div ref={ref} data-comp="CoCDocumentV4">
        <PaginatedDocument
          docType="Certificate of Conformance"
          docId={data.cocId}
          sections={sections}
          noHeader
          headerOffset={40}
          sectionSpacerCaps={{ signature: 16 }}
          pageStyle={{
            color: '#000',
            fontWeight: 300,
            fontFamily: GEIST_FONT_STACK,
            ['--color-primary' as any]: '#000',
            ['--color-warning' as any]: '#000',
            ['--gray-900' as any]: '#000',
            ['--gray-700' as any]: '#000',
            ['--gray-600' as any]: '#000',
            ['--gray-400' as any]: '#000',
            /* --gray-200 / --gray-150 / --gray-100 left untouched so
               horizontal dividers keep their native gray. */
          }}
          renderPageHeader={(pageNum, totalPages) => (
            <div
              data-el="CoCV4-top"
              className="flex items-start justify-between"
              style={{ marginBottom: 24 }}
            >
              {/* Left: Title + ID */}
              <div>
                <div
                  className="font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]"
                  style={{ fontSize: 28 }}
                >
                  Certificate of Conformance
                </div>
                <div
                  className="font-normal text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]"
                  style={{ fontSize: 22 }}
                >
                  #{displayCocId}
                </div>
              </div>

              {/* Right: Logo + Meta (stacked) */}
              <div className="flex flex-col items-end" style={{ gap: 6 }}>
                <div style={{ lineHeight: 0 }}>
                  {PRINT_ICONS.logoText(36, '#000')}
                </div>
                <div style={{ marginTop: 8 }}>
                  <DocumentMeta items={metaItems} />
                </div>
              </div>
            </div>
          )}
        />
      </div>
    );
  }
);

export default CoCDocumentV4;
