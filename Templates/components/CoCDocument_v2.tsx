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
 * | data | CoCDataV2 | yes      | Complete CoC data object |
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   <CoCDocumentV2 ref={ref} data={cocData} />
 */

import React from 'react';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

/** Per-part entry for the certified items table */
export interface CoCPartEntryV2 {
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
export interface CoCComplianceItemV2 {
  /** e.g. "RoHS Directive 2011/65/EU" */
  label: string;
  /** true = ☑ brand primary, false = ☐ gray */
  compliant: boolean;
  /** e.g. "Compliant" or "N/A" */
  status?: string;
}

export interface CoCDataV2 {
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
  parts: CoCPartEntryV2[];

  /* ── Shipment ── */
  countryOfOrigin?: string;

  /* ── Compliance ── */
  compliance: CoCComplianceItemV2[];

  /* ── Notes ── */
  notes?: string;

  /* ── Authorization ── */
  signerName?: string;
  signerTitle?: string;
}

interface CoCDocumentV2Props {
  data: CoCDataV2;
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

/** Parts table column widths */
const TABLE_COLS = '20px 110px 1fr 44px 52px 52px 100px';

/* ═══════════════════════════════════════════════════════════
   Style constants
   ═══════════════════════════════════════════════════════════ */

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 'var(--doc-text-label)',
  fontWeight: 600,
  color: 'var(--gray-400)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--doc-tracking-label)',
  lineHeight: 1,
};

const PARTY_NAME: React.CSSProperties = {
  fontSize: 'var(--doc-text-body)',
  fontWeight: 700,
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

export const CoCDocumentV2 = React.forwardRef<HTMLDivElement, CoCDocumentV2Props>(
  function CoCDocumentV2({ data }, ref) {

    const metaItems: MetaItem[] = [
      { label: 'Date',    value: data.date },
      { label: 'Order',   value: data.orderId, highlight: true },
    ];
    if (data.packingSlipRef) metaItems.push({ label: 'PS Ref',  value: data.packingSlipRef });
    if (data.poRef)          metaItems.push({ label: 'PO Ref',  value: data.poRef });
    if (data.invoiceRef)     metaItems.push({ label: 'Invoice', value: data.invoiceRef });

    /* ── Build sections array ── */
    const sections: PageSection[] = [
      /* Title + Meta */
      {
        key: 'title',
        content: (
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                Certificate of Conformance
              </div>
              <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
                #{data.cocId}
              </div>
            </div>
            <DocumentMeta items={metaItems} />
          </div>
        ),
      },

      /* Certification statement */
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
              fontSize: 'var(--doc-text-body)',
              color: 'var(--gray-700)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              We hereby certify that all products listed herein have been manufactured, inspected,
              and tested in accordance with the customer's drawings, specifications, and purchase
              order requirements referenced in this document. All items are fully conforming and
              acceptable for use. InstaVoxel certifies RoHS / REACH compliance for all applicable
              items in this certificate.
            </p>
          </div>
        ),
      },

      /* ISSUED BY | CUSTOMER — 2-col */
      {
        key: 'parties',
        content: (
          <div
            data-el="CoCV2-parties"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-8)' }}
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
                {data.customerRevision && data.customerRevision !== 'N/A' && (
                  <span style={{ ...PARTY_LINE, marginTop: 4 }}>{data.customerRevision}</span>
                )}
                {data.customerSerial && data.customerSerial !== 'N/A' && (
                  <span style={PARTY_LINE}>{data.customerSerial}</span>
                )}
              </div>
            </div>
          </div>
        ),
      },

      /* CERTIFIED ITEMS — full-width table */
      {
        key: 'items',
        content: (
          <div data-el="CoCV2-items">
            <SectionLabel>Certified Items</SectionLabel>

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
                  { label: '#',           align: 'left'  },
                  { label: 'Part No.',    align: 'left'  },
                  { label: 'Description', align: 'left'  },
                  { label: 'Rev',         align: 'left'  },
                  { label: 'Ordered',     align: 'right' },
                  { label: 'Shipped',     align: 'right' },
                  { label: 'Lot #',       align: 'left'  },
                ].map(({ label, align }) => (
                  <span key={label} style={{
                    fontSize: 'var(--doc-text-label)',
                    fontWeight: 600,
                    color: 'var(--gray-400)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--doc-tracking-label)',
                    textAlign: align as React.CSSProperties['textAlign'],
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
                    padding: 'var(--sp-2) 0',
                    borderBottom: '1px solid var(--gray-100)',
                    alignItems: 'center',
                  }}
                >
                  {/* # */}
                  <span style={{
                    fontSize: 'var(--doc-text-secondary)',
                    color: 'var(--gray-400)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {i + 1}
                  </span>

                  {/* Part No. */}
                  <span style={{
                    fontSize: 'var(--doc-text-secondary)',
                    fontFamily: 'monospace',
                    color: 'var(--gray-700)',
                    wordBreak: 'break-all',
                  }}>
                    {part.quotedPartId ?? part.partId}
                  </span>

                  {/* Description — 2 lines */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{
                      fontSize: 'var(--doc-text-body)',
                      fontWeight: 600,
                      color: 'var(--gray-900)',
                      lineHeight: 1.3,
                    }}>
                      {part.partName ?? part.partId}
                    </span>
                    <span style={{
                      fontSize: 'var(--doc-text-secondary)',
                      color: 'var(--gray-500)',
                      lineHeight: 1.3,
                    }}>
                      {part.material} · {part.finish}
                    </span>
                  </div>

                  {/* Rev */}
                  <span style={{
                    fontSize: 'var(--doc-text-secondary)',
                    color: 'var(--gray-700)',
                  }}>
                    {part.drawingRev ?? '—'}
                  </span>

                  {/* QTY Ordered */}
                  <span style={{
                    fontSize: 'var(--doc-text-body)',
                    fontWeight: 500,
                    color: 'var(--gray-700)',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {part.quantityOrdered}
                  </span>

                  {/* QTY Shipped */}
                  <span style={{
                    fontSize: 'var(--doc-text-body)',
                    fontWeight: 700,
                    color: part.quantityShipped < part.quantityOrdered
                      ? 'var(--color-warning, #b45309)'
                      : 'var(--gray-900)',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {part.quantityShipped}
                  </span>

                  {/* Lot # */}
                  <span style={{
                    fontSize: 'var(--doc-text-secondary)',
                    fontFamily: 'monospace',
                    color: 'var(--gray-600)',
                  }}>
                    {part.materialLot ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ),
      },

      /* COMPLIANCE | DRAWING REFERENCES — 2-col */
      {
        key: 'complianceAndDrawings',
        content: (
          <div
            data-el="CoCV2-complianceAndDrawings"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-8)', marginTop: 'var(--sp-2)' }}
          >
            {/* Left: Compliance + Country of Origin */}
            <div>
              <SectionLabel>Compliance</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 'var(--doc-sp-1-5)' }}>
                {data.compliance.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{
                      fontSize: 'var(--doc-text-part-id)',
                      color: item.compliant ? 'var(--color-primary)' : 'var(--gray-300)',
                      flexShrink: 0,
                      lineHeight: 1,
                    }}>
                      {item.compliant ? '☑' : '☐'}
                    </span>
                    <span style={{
                      fontSize: 'var(--doc-text-body)',
                      color: item.compliant ? 'var(--gray-900)' : 'var(--gray-400)',
                      fontWeight: item.compliant ? 500 : 400,
                    }}>
                      {item.label}
                      {item.status && (
                        <span style={{
                          fontSize: 'var(--doc-text-secondary)',
                          color: item.compliant ? 'var(--gray-500)' : 'var(--gray-300)',
                          marginLeft: 4,
                        }}>
                          — {item.status}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Drawing References */}
            <div>
              <SectionLabel>Drawing References</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--doc-sp-1-5)' }}>
                {data.parts.filter(p => p.drawingRef).map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span style={{
                      fontSize: 'var(--doc-text-label)',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      width: 28,
                    }}>
                      {p.partId}
                    </span>
                    <span style={{
                      fontSize: 'var(--doc-text-secondary)',
                      fontFamily: 'monospace',
                      color: 'var(--gray-600)',
                      wordBreak: 'break-all',
                    }}>
                      {p.drawingRef}
                    </span>
                  </div>
                ))}
                {data.parts.every(p => !p.drawingRef) && (
                  <span style={{ fontSize: 'var(--doc-text-body)', color: 'var(--gray-400)' }}>—</span>
                )}
              </div>
              {data.countryOfOrigin && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'var(--sp-3)' }}>
                  <span style={SECTION_LABEL_STYLE}>Origin</span>
                  <span style={{ fontSize: 'var(--doc-text-body)', fontWeight: 500, color: 'var(--gray-900)' }}>
                    {data.countryOfOrigin}
                  </span>
                </div>
              )}
            </div>
          </div>
        ),
      },

      /* NOTES — fixed-height bordered box */
      {
        key: 'notes',
        content: (
          <div data-el="CoCV2-notes">
            <span style={SECTION_LABEL_STYLE}>Notes</span>
            <div style={{
              marginTop: 'var(--doc-sp-1-5)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--sp-3) var(--sp-4)',
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

      /* AUTHORIZED RELEASE — 3-col signature */
      {
        key: 'signature',
        content: (
          <div data-el="CoCV2-signature" style={{ marginTop: 'var(--sp-2)' }}>

            {/* Title */}
            <span style={{
              fontSize: 'var(--doc-text-label)',
              fontWeight: 600,
              color: 'var(--gray-400)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--doc-tracking-label)',
            }}>
              Authorized Release
            </span>

            {/* 3 signature columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 'var(--sp-6)',
              marginTop: 'var(--sp-5)',
            }}>
              {/* Printed Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <div style={{
                  minHeight: 60,
                  borderBottom: '1px solid var(--gray-200)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  paddingBottom: 2,
                }}>
                  {data.signerName && (
                    <span style={{ fontSize: 'var(--doc-text-body)', color: 'var(--gray-800)' }}>
                      {data.signerName}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>
                  Printed Name
                </span>
              </div>

              {/* Signature */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <div style={{ minHeight: 60, borderBottom: '1px solid var(--gray-200)' }} />
                <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>
                  Signature
                </span>
              </div>

              {/* Title + Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                  <div style={{
                    minHeight: 60,
                    borderBottom: '1px solid var(--gray-200)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    paddingBottom: 2,
                  }}>
                    {data.signerTitle && (
                      <span style={{
                        fontSize: 'var(--doc-text-label)',
                        fontWeight: 600,
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                  <div style={{ minHeight: 40, borderBottom: '1px solid var(--gray-200)' }} />
                  <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>Date</span>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ];

    return (
      <div ref={ref} data-comp="CoCDocumentV2">
        <PaginatedDocument
          docType="Certificate of Conformance"
          docId={data.cocId}
          sections={sections}
        />
      </div>
    );
  }
);

export default CoCDocumentV2;
