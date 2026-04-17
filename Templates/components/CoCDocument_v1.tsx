/**
 * CoCDocument — Certificate of Conformance for CNC machined parts
 *
 * Single-page, order-level CoC. Covers all parts in one shipment.
 * Three readers, three sections:
 *   1. AP clerk         → REFERENCES (Order ID / PO / PS / CoC #)
 *   2. IQC inspector    → PART IDENTIFICATION + MATERIAL & PROCESS
 *   3. Quality engineer → COMPLIANCE + signature
 *
 * Layout:
 *   [Title + Meta]
 *   [Certification Statement — full width]
 *   [CUSTOMER  |  PART IDENTIFICATION — 2-col]
 *   [MATERIAL & PROCESS — full width]
 *   [COMPLIANCE  |  NOTES — 2-col]
 *   [AUTHORIZED RELEASE — 3-col signature]
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css,
 *   DocumentHeader, DocumentFooter, DocumentMeta, SectionLabel
 *
 * ─── Props ──────────────────────────────────────────────────────────────────
 *
 * | Name | Type    | Required | Default | Description              |
 * |------|---------|----------|---------|--------------------------|
 * | data | CoCData | yes      | —       | Complete CoC data object |
 *
 * ─── Usage ──────────────────────────────────────────────────────────────────
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   <CoCDocument ref={ref} data={cocData} />
 */

import React from 'react';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

/** Per-part material/process summary for order-level CoC */
export interface CoCPartEntry {
  /** Part identifier e.g. "P01" */
  partId: string;
  /** InstaVoxel quoted part ID (compound ref) */
  quotedPartId?: string;
  /** Customer-facing part name/description */
  partName?: string;
  /** Drawing / model file reference */
  drawingRef?: string;
  /** Drawing revision e.g. "Rev C" */
  drawingRev?: string;
  /** Material spec e.g. "Aluminum 6061-T6 per AMS 2770" */
  material: string;
  /** Material lot / heat number for traceability */
  materialLot?: string;
  /** Surface finish e.g. "Anodize Type II" or "As-machined" */
  finish: string;
  /** Quantity shipped */
  quantity: number;
  /** Unit e.g. "pcs" */
  unit?: string;
}

/** Compliance declaration item */
export interface CoCComplianceItem {
  /** e.g. "RoHS Directive 2011/65/EU" */
  label: string;
  /** true = ☑ Compliant, false = ☐ N/A */
  compliant: boolean;
  /** Optional trailing qualifier e.g. "Compliant" or "N/A" */
  status?: string;
}

export interface CoCData {
  /** CoC document number e.g. "COC-2026-0031" */
  cocId: string;
  /** Issue date string e.g. "April 20, 2026" */
  date: string;

  /* ── Cross-references ── */
  /** PRIMARY order reference — highlighted */
  orderId: string;
  /** Packing slip reference */
  packingSlipRef?: string;
  /** Customer PO number */
  poRef?: string;
  /** Invoice reference */
  invoiceRef?: string;

  /* ── Customer ── */
  customerName: string;
  /** Customer PO line # — typically N/A for InstaVoxel clients */
  customerPoLine?: string;
  /** Customer-side revision tracking */
  customerRevision?: string;
  /** Customer serial # — used by medical/aerospace clients */
  customerSerial?: string;

  /* ── Parts (order-level: all parts listed) ── */
  parts: CoCPartEntry[];

  /* ── Shipment info ── */
  countryOfOrigin?: string;

  /* ── Compliance ── */
  compliance: CoCComplianceItem[];

  /* ── Notes ── */
  notes?: string;

  /* ── Authorization ── */
  /** Signer name (pre-filled if known) */
  signerName?: string;
  /** Signer title */
  signerTitle?: string;
}

interface CoCDocumentProps {
  data: CoCData;
}

/* ═══════════════════════════════════════════════════════════
   Style constants
   ═══════════════════════════════════════════════════════════ */

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 'var(--doc-text-label)',
  fontWeight: 600,
  color: 'var(--gray-400)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--doc-tracking-label)',
  lineHeight: 1,
  width: 76,
  flexShrink: 0,
  paddingTop: 3,
};

const FIELD_VALUE: React.CSSProperties = {
  fontSize: 'var(--doc-text-body)',
  fontWeight: 500,
  color: 'var(--gray-900)',
  lineHeight: 1.4,
};

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

/** Single label + value row */
function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
      <span style={FIELD_LABEL}>{label}</span>
      <span style={FIELD_VALUE}>{value}</span>
    </div>
  );
}

/** Stack of FieldRows with consistent gap */
function FieldStack({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginTop: 'var(--doc-sp-1-5)' }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

export const CoCDocument = React.forwardRef<HTMLDivElement, CoCDocumentProps>(
  function CoCDocument({ data }, ref) {

    const metaItems: MetaItem[] = [
      { label: 'Date',  value: data.date },
      { label: 'Order', value: data.orderId, highlight: true },
    ];
    if (data.packingSlipRef) metaItems.push({ label: 'PS Ref',   value: data.packingSlipRef });
    if (data.poRef)          metaItems.push({ label: 'PO Ref',   value: data.poRef });
    if (data.invoiceRef)     metaItems.push({ label: 'Invoice',  value: data.invoiceRef });

    /* ── Build sections array ── */
    const sections: PageSection[] = [
      /* Title row */
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
            data-el="CoCDocument-statement"
            style={{
              borderLeft: '3px solid var(--color-primary)',
              paddingLeft: 'var(--sp-4)',
              paddingTop: 'var(--sp-2)',
              paddingBottom: 'var(--sp-2)',
            }}
          >
            <p style={{
              fontSize: 'var(--doc-text-body)',
              color: 'var(--gray-700)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              This is to certify that the products listed herein have been manufactured, processed,
              inspected, and tested in accordance with all applicable drawing requirements, material
              specifications, and purchase order terms. All items are fully conforming and acceptable
              for use. Inspection was performed against referenced drawings using visual and dimensional
              methods; all results are within specified tolerances.
            </p>
            <p style={{
              fontSize: 'var(--doc-text-body)',
              color: 'var(--gray-700)',
              lineHeight: 1.6,
              margin: 'var(--sp-2) 0 0',
            }}>
              InstaVoxel certifies RoHS / REACH compliance for all items in this certificate.
            </p>
          </div>
        ),
      },

      /* CUSTOMER | PART IDENTIFICATION — 2-col */
      {
        key: 'customerAndParts',
        content: (
          <div
            data-el="CoCDocument-customerAndParts"
            className="grid grid-cols-2 gap-[var(--sp-8)]"
          >
            {/* Left: Customer */}
            <div>
              <SectionLabel>Customer</SectionLabel>
              <FieldStack>
                <FieldRow label="Name"      value={data.customerName} />
                <FieldRow label="PO #"      value={data.poRef ?? 'N/A'} />
                <FieldRow label="PO Line"   value={data.customerPoLine ?? 'N/A'} />
                <FieldRow label="Revision"  value={data.customerRevision ?? 'N/A'} />
                <FieldRow label="Serial #"  value={data.customerSerial ?? 'N/A'} />
              </FieldStack>
            </div>

            {/* Right: Part Identification */}
            <div>
              <SectionLabel>Part Identification</SectionLabel>
              <FieldStack>
                <FieldRow label="Order ID"  value={
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{data.orderId}</span>
                } />
                <FieldRow label="Parts"     value={data.parts.map(p => p.partId).join(' · ')} />
                <FieldRow label="Part IDs"  value={
                  data.parts.map(p => p.quotedPartId ?? p.partId).join(' · ')
                } />
                {data.parts[0]?.drawingRev && (
                  <FieldRow label="Rev"     value={
                    data.parts.length === 1
                      ? data.parts[0].drawingRev
                      : data.parts.map(p => `${p.partId}: ${p.drawingRev ?? 'N/A'}`).join(' · ')
                  } />
                )}
                {data.parts[0]?.drawingRef && (
                  <FieldRow label="Drawing" value={
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {data.parts.filter(p => p.drawingRef).map((p, i) => (
                        <span key={i} style={{ fontFamily: 'monospace', fontSize: 'var(--doc-text-secondary)' }}>
                          {data.parts.length > 1 && <span style={{ color: 'var(--color-primary)', fontWeight: 700, marginRight: 4 }}>{p.partId}</span>}
                          {p.drawingRef}
                        </span>
                      ))}
                    </span>
                  } />
                )}
              </FieldStack>
            </div>
          </div>
        ),
      },

      /* MATERIAL & PROCESS — full width */
      {
        key: 'material',
        content: (
          <div data-el="CoCDocument-material">
            <SectionLabel>Material &amp; Process</SectionLabel>

            {/* Per-part table */}
            <div style={{ marginTop: 'var(--doc-sp-1-5)' }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 1fr 80px 60px 68px',
                gap: 'var(--sp-3)',
                paddingBottom: 'var(--sp-1)',
                borderBottom: '1px solid var(--gray-200)',
              }}>
                {['Part', 'Material', 'Finish', 'Lot #', 'Qty', 'Origin'].map(h => (
                  <span key={h} style={{
                    fontSize: 'var(--doc-text-label)',
                    fontWeight: 600,
                    color: 'var(--gray-400)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--doc-tracking-label)',
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Data rows */}
              {data.parts.map((part, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 1fr 80px 60px 68px',
                  gap: 'var(--sp-3)',
                  padding: 'var(--sp-2) 0',
                  borderBottom: '1px solid var(--gray-100)',
                }}>
                  <span style={{
                    fontSize: 'var(--doc-text-part-id)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    fontFamily: 'monospace',
                  }}>
                    {part.partId}
                  </span>
                  <span style={FIELD_VALUE}>{part.material}</span>
                  <span style={FIELD_VALUE}>{part.finish}</span>
                  <span style={{ ...FIELD_VALUE, fontFamily: 'monospace' }}>{part.materialLot ?? '—'}</span>
                  <span style={FIELD_VALUE}>{part.quantity} {part.unit ?? 'pcs'}</span>
                  <span style={FIELD_VALUE}>{data.countryOfOrigin ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },

      /* COMPLIANCE | NOTES — 2-col */
      {
        key: 'complianceAndNotes',
        content: (
          <div
            data-el="CoCDocument-complianceAndNotes"
            className="grid grid-cols-2 gap-[var(--sp-8)]"
            style={{ marginTop: 'var(--sp-4)' }}
          >
            {/* Left: Compliance */}
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

            {/* Right: Notes */}
            <div>
              <SectionLabel>Notes</SectionLabel>
              <p style={{
                fontSize: 'var(--doc-text-body)',
                color: data.notes ? 'var(--gray-700)' : 'var(--gray-400)',
                lineHeight: 1.6,
                marginTop: 'var(--doc-sp-1-5)',
                whiteSpace: 'pre-wrap',
              }}>
                {data.notes ?? 'N/A'}
              </p>
            </div>
          </div>
        ),
      },

      /* AUTHORIZED RELEASE — 3-col signature */
      {
        key: 'signature',
        content: (
          <div
            data-el="CoCDocument-signature"
            style={{ marginTop: 'var(--sp-2)' }}
          >
            <SectionLabel>Authorized Release</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 'var(--sp-6)',
              marginTop: 'var(--sp-6)',
            }}>
              {/* Printed Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <div style={{ minHeight: 'var(--h-sm)', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                  {data.signerName && (
                    <span style={{ fontSize: 'var(--doc-text-body)', color: 'var(--gray-800)' }}>{data.signerName}</span>
                  )}
                </div>
                <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>Printed Name</span>
              </div>

              {/* Signature */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <div style={{ minHeight: 'var(--h-sm)', borderBottom: '1px solid var(--gray-200)' }} />
                <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>Signature</span>
              </div>

              {/* Title + Date stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                  <div style={{ minHeight: 28, borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                    {data.signerTitle && (
                      <span style={{
                        fontSize: 'var(--doc-text-label)',
                        fontWeight: 600,
                        color: 'var(--gray-400)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--doc-tracking-label)',
                      }}>{data.signerTitle}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>Title</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                  <div style={{ minHeight: 28, borderBottom: '1px solid var(--gray-200)' }} />
                  <span style={{ fontSize: 'var(--doc-text-footer)', color: 'var(--gray-400)' }}>Date</span>
                </div>
              </div>
            </div>

            <p style={{
              fontSize: 'var(--doc-text-footer)',
              color: 'var(--gray-400)',
              marginTop: 'var(--sp-3)',
              fontStyle: 'italic',
            }}>
              Signed on behalf of InstaVoxel, Inc. — This certificate is valid only with an authorized signature.
            </p>
          </div>
        ),
      },
    ];

    return (
      <div ref={ref} data-comp="CoCDocument">
        <PaginatedDocument
          docType="Certificate of Conformance"
          docId={data.cocId}
          sections={sections}
        />
      </div>
    );
  }
);

export default CoCDocument;
