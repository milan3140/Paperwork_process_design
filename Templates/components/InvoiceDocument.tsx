/**
 * InvoiceDocument — Full invoice page composed from shared document components
 *
 * Renders a complete, print-ready invoice document. Uses the two-pass
 * useDocumentPagination hook to automatically distribute content across as
 * many Letter-size pages as needed — no hardcoded page-break constants.
 *
 * Supports 4 variants:
 * - **PIA** (Payment In Advance): Pre-production invoice, warning box, no due date
 * - **Net 30**: Standard post-delivery invoice with due date
 * - **Partial**: Installment invoice showing paid-to-date and balance
 * - **Credit Card**: Includes 3% processing fee line item
 *
 * Key design decisions (from Document_Gap_Analysis.md):
 * - Quote Ref is the PRIMARY traceability point (highlighted), not PO Ref
 * - Dual bank accounts (US + Taiwan) for cross-border operations
 * - No SignatureRow (PO already signed; invoice is a payment request)
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css, Icons_Print.tsx,
 *   DocumentHeader, DocumentFooter, DocumentMeta, SectionLabel,
 *   PartiesRow, InvoiceKeyInfoRow, PartBlock, NRETable, TotalsTable,
 *   NotesList, WarningBox, PaymentInstructions, TermsSection,
 *   useDocumentPagination
 */

import React, { useMemo } from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { type PartyInfo } from './PartiesRow';
import { InvoiceKeyInfoRow, type InvoiceVariant } from './InvoiceKeyInfoRow';
import { PartBlock, PRICING_TABLE_COLS_RATE, type PartData, type PricingLayout } from './PartBlock';
import { NRETable, type NRECharge } from './NRETable';
import { TotalsTable, type TotalLine } from './TotalsTable';
import { NotesList } from './NotesList';
import { WarningBox } from './WarningBox';
import { PaymentInstructions, type BankDetails } from './PaymentInstructions';
import { TermsSection } from './TermsSection';
import { ShipmentTable, type ShipmentRecord } from './ShipmentTable';
import { useDocumentPagination } from './useDocumentPagination';
import { ContinuedOnNextPage, ContinuedFromPreviousPage } from './ContinuationHints';

/** Partial payment tracking for installment invoices */
export interface PartialPaymentInfo {
  label: string;        // e.g. "Payment 2 of 2"
  paidToDate: number;
  balanceDue: number;
}

export interface InvoiceData {
  invoiceId: string;
  variant: InvoiceVariant;
  date: string;
  dueDate?: string;
  shipDate?: string;

  /* ── Cross-references (traceability chain) ── */
  quoteRef: string;       // PRIMARY traceability — always present
  poRef?: string;         // Optional — client may not have formal PO
  packingSlipRef?: string;

  /* ── Parties ── */
  from: PartyInfo;
  billTo: PartyInfo;
  shipTo?: PartyInfo;

  /* ── Financial ── */
  paymentTerms: string;
  currency: string;
  exchangeRate?: string;

  /* ── Tax IDs ── */
  sellerTaxId?: string;
  buyerTaxId?: string;

  /* ── Line items ── */
  parts: PartData[];
  nreCharges: NRECharge[];

  /* ── Totals ── */
  totalsLines: TotalLine[];
  total: TotalLine;

  /* ── Partial payment (conditional) ── */
  partialPayment?: PartialPaymentInfo;

  /* ── Payment instructions ── */
  bankDetails: BankDetails[];
  creditCardFeeNote?: string;

  /* ── Shipment history ── */
  shipments?: ShipmentRecord[];

  /* ── Notes & Terms ── */
  notes?: string[];
  overdueNote?: string;
  earlyPaymentDiscount?: string;
  termsText: string;
  termsLinkUrl?: string;
  closingMessage?: string;
}

interface InvoiceDocumentProps {
  data: InvoiceData;
  pricingLayout?: PricingLayout;
  /** When true, omit the DocumentHeader colored band from all pages.
      Use for flat/minimal layouts (e.g. v3 monochrome). */
  hideHeaderBand?: boolean;
  /** Optional render fn placed above DocumentMeta in the title row (e.g. a
      text logo + page indicator when hideHeaderBand removes the top banner).
      Receives the total page count so callers can render "Page X of N". */
  renderLogoAboveMeta?: (totalPages: number) => React.ReactNode;
  /** Optional rows prepended to the start of DocumentMeta. Useful for adding
      a "Page N of M" row that aligns to the same label/value grid as Date/Ref.
      Called with totalPages after pagination settles. */
  prependMetaItems?: (totalPages: number) => MetaItem[];
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SANDBOX_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 0,
  width: 'var(--doc-page-w)',
  visibility: 'hidden',
  pointerEvents: 'none',
  zIndex: -9999,
};

export const InvoiceDocument = React.forwardRef<HTMLDivElement, InvoiceDocumentProps>(
  function InvoiceDocument({ data, pricingLayout = 'equation', hideHeaderBand = false, renderLogoAboveMeta, prependMetaItems }, ref) {

    /* ── Meta items ──
     * Order: Date → Quote Ref → PO Ref → Due Date → Terms → Balance Due
     * Three semantic groups: identification → traceability → payment action
     * Payment block (Due Date + Terms + Balance Due) at bottom = AP decision cluster */
    const metaItems: MetaItem[] = [
      { label: 'Date', value: data.date, weight: 'normal' },
      { label: 'Quote Ref', value: data.quoteRef, weight: 'normal' },
    ];
    if (data.poRef) {
      metaItems.push({ label: 'PO Ref', value: data.poRef, weight: 'normal' });
    }
    metaItems.push({ label: 'Terms', value: data.paymentTerms, highlight: true, weight: 'normal' });
    if (data.dueDate && data.variant !== 'pia') {
      metaItems.push({ label: 'Due Date', value: data.dueDate, highlight: true, weight: 'bold', fontSize: 16 });
    }
    metaItems.push({
      label: 'Balance Due',
      value: fmt(data.partialPayment ? data.partialPayment.balanceDue : data.total.amount),
      highlight: true,
      bgColor: 'var(--color-primary-selected)',
      fontSize: 16,
    });

    /* ── Notes list ── */
    const noteItems: string[] = [...(data.notes ?? [])];
    if (data.packingSlipRef) {
      noteItems.push(`Ref: Packing Slip ${data.packingSlipRef}`);
    }
    if (data.earlyPaymentDiscount) {
      noteItems.push(data.earlyPaymentDiscount);
    }

    /* ── Atom descriptors ──────────────────────────────────────────────────
     * atom[0]              = SectionLabel "Invoiced Items (N items)"
     * atom[1..parts.length] = PartBlocks
     * atom[parts.length+1..] = tail sections */
    const partAtomEnd = data.parts.length;

    const atomDefs = useMemo<{ key: string; node: React.ReactNode }[]>(() => {
      const defs: { key: string; node: React.ReactNode }[] = [];

      // [0] Section header with pricing column titles — single border spans full width.
      // marginTop: -12 halves the 24px doc-content-gap above this section.
      defs.push({
        key:  'parts-label',
        node: (
          <div
            data-el="InvoiceDocument-itemsHeader"
            style={{ marginTop: -12 }}
            className="flex items-end justify-between pb-[var(--sp-1)] border-b border-[color:var(--gray-150)]"
          >
            <SectionLabel className="!border-b-0 !pb-0">Invoiced Items ({data.parts.length} items)</SectionLabel>
            <div className="grid text-right" style={{ gridTemplateColumns: PRICING_TABLE_COLS_RATE, gap: 'var(--sp-3)' }}>
              {['Qty', 'Unit Price', 'Subtotal'].map(label => (
                <span key={label} className="font-semibold uppercase tracking-[var(--doc-tracking-label)] text-[color:var(--gray-400)]" style={{ fontSize: '11px' }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        ),
      });

      // [1..N] Parts — showDivider=true so sandbox height includes divider border
      data.parts.forEach(part => {
        defs.push({
          key:  `part-${part.id}`,
          node: (
            <PartBlock
              part={part}
              showDivider
              pricingLayout={pricingLayout}
              hideEmptyParams
              hideFiles
              hideParams
              rateFirst
              hidePricingLabels
            />
          ),
        });
      });

      // Tail atoms
      // NRE: marginTop: -12 halves the 24px doc-content-gap above this section.
      if (data.nreCharges.length > 0) {
        defs.push({
          key: 'nre',
          node: (
            <div style={{ marginTop: -12 }}>
              <NRETable charges={data.nreCharges} />
            </div>
          ),
        });
      }

      defs.push({
        key:  'totals',
        node: <TotalsTable lines={data.totalsLines} total={data.total} />,
      });

      if (data.partialPayment) {
        defs.push({
          key: 'partial-payment',
          node: (
            <div data-el="InvoiceDocument-partialPayment" className="flex justify-end">
              <div style={{ width: 'var(--doc-w-totals)' }} className="flex flex-col">
                <div className="flex justify-between py-[var(--doc-sp-totals-y)] text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
                  <span>Paid to Date</span>
                  <span className="tabular-nums">{fmt(data.partialPayment.paidToDate)}</span>
                </div>
                <div
                  className="flex justify-between py-[var(--doc-sp-totals-y)] font-bold text-[length:var(--doc-text-key-value)] text-[color:var(--color-primary)]"
                  style={{ borderTop: 'var(--doc-border-emphasis) solid var(--gray-200)' }}
                >
                  <span>Balance Due</span>
                  <span className="tabular-nums">{fmt(data.partialPayment.balanceDue)}</span>
                </div>
                <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] text-right">
                  {data.partialPayment.label}
                </div>
              </div>
            </div>
          ),
        });
      }

      // Shipment history (after totals, before notes)
      if (data.shipments && data.shipments.length > 0) {
        defs.push({
          key: 'shipment',
          node: <ShipmentTable shipments={data.shipments} />,
        });
      }

      if (noteItems.length > 0) {
        defs.push({
          key: 'notes',
          node: <NotesList label="Invoice Notes" items={noteItems} />,
        });
      }

      if (data.variant === 'pia') {
        defs.push({
          key:  'pia-warning',
          node: (
            <WarningBox>
              <strong>Payment In Advance:</strong> Full payment is required before production begins.
              Upon receipt of payment, InstaVoxel will commence manufacturing within 5 business days.
            </WarningBox>
          ),
        });
      } else if (data.overdueNote) {
        defs.push({
          key:  'overdue-warning',
          node: <WarningBox>{data.overdueNote}</WarningBox>,
        });
      }

      defs.push({
        key:  'terms',
        node: <TermsSection text={data.termsText} linkUrl={data.termsLinkUrl} />,
      });

      return defs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, pricingLayout]);

    /* ── Atom groups: PartBlocks share 'parts' group for tight spacing ── */
    /* atom[0] = SectionLabel header, atom[1..partAtomEnd] = PartBlocks — all in 'parts' group */
    const atomGroups = useMemo(() => {
      return atomDefs.map((_, i) => (i >= 0 && i <= partAtomEnd) ? 'parts' : undefined);
    }, [atomDefs, partAtomEnd]);

    /* ── Pagination hook ── */
    const {
      contentMeasureRef,
      fixedRef,
      contLabelRef,
      atomRefs,
      assignments,
      isReady,
    } = useDocumentPagination(atomDefs.length, 24 /* doc-content-gap */, atomGroups, 0 /* tightGap: parts touch via their own padding */);

    const totalPages = assignments?.pageCount ?? 1;

    /* ── Fixed sections (page 0 only) ── */
    /* ── Font size overrides ──
     * Above parties: +1 size (title 22→24, subtitle 13→14, label 9→10, meta-value 12→13)
     * Below parties: +2 sizes (body 10→12, secondary 9→11, part-id 11→13, etc.) */
    const abovePartiesStyle = {
      '--doc-text-title': '28px',
      '--doc-text-subtitle': '18px',
      '--doc-text-label': '10px',
      '--doc-text-meta-value': '13px',
    } as React.CSSProperties;

    const belowPartiesStyle = {
      '--doc-text-part-id': '13px',
      '--doc-text-body': '12px',
      '--doc-text-secondary': '11px',
      '--doc-text-label': '11px',
      '--doc-text-grid-label': '12px',
      '--doc-text-param-label': '9.5px',
      '--doc-text-fine': '9.5px',
    } as React.CSSProperties;

    const renderPartyBlock = (label: string, party: PartyInfo, side: string) => (
      <div data-el={`InvoiceDocument-${side}`} className="flex flex-col gap-[var(--doc-sp-1-5)]">
        <SectionLabel>{label}</SectionLabel>
        <div className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)]">
          {party.name}
        </div>
        <div className="text-[length:var(--doc-text-body)] font-normal text-[color:var(--gray-900)] leading-[1.5]">
          {party.lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < party.lines.length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>
    );

    const FixedSections = (
      <>
        <div style={abovePartiesStyle}>
          <div data-el="InvoiceDocument-titleRow" className="grid grid-cols-2 gap-[var(--sp-6)] items-start">
            <div className="flex flex-col gap-[var(--sp-4)] min-w-0">
              <div>
                <div data-el="InvoiceDocument-title" className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                  Invoice
                </div>
                <div data-el="InvoiceDocument-subtitle" className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
                  #{data.invoiceId}
                </div>
              </div>
              {renderPartyBlock('From', data.from, 'from')}
            </div>
            <div className="flex flex-col items-end gap-[var(--sp-3)]">
              {renderLogoAboveMeta?.(totalPages)}
              <DocumentMeta items={[...(prependMetaItems?.(totalPages) ?? []), ...metaItems]} />
            </div>
          </div>
        </div>

        {data.shipTo ? (
          <div data-comp="PartiesRow" style={{ marginTop: -12 }} className="grid grid-cols-2 gap-[var(--sp-6)]">
            {renderPartyBlock('Bill To', data.billTo, 'billTo')}
            {renderPartyBlock('Ship To', data.shipTo, 'shipTo')}
          </div>
        ) : (
          <div style={{ marginTop: -12 }}>
            {renderPartyBlock('Bill To / Ship To', data.billTo, 'billTo')}
          </div>
        )}
      </>
    );

    /* ── Continuation label ── */
    const ContLabelInner = (
      <div
        data-el="InvoiceDocument-contLabel"
        className="text-[length:var(--doc-text-grid-label)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)] uppercase"
        style={{ borderBottom: '1px solid var(--gray-200)', paddingBottom: 'var(--sp-2)' }}
      >
        Invoiced Items — continued
      </div>
    );

    return (
      <div
        ref={ref}
        data-comp="InvoiceDocument"
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}
      >
        {/* ══ Measurement sandbox ══════════════════════════════════════════ */}
        <div aria-hidden="true" data-sandbox="true" style={SANDBOX_STYLE}>

          {/* Reference page → measures exact available content height */}
          <div className="doc-page">
            {!hideHeaderBand && <DocumentHeader docType="Invoice" />}
            <div className="doc-content" ref={contentMeasureRef} style={{ minHeight: 0 }} />
            <DocumentFooter docId={data.invoiceId} page={1} totalPages={1} />
          </div>

          {/* Fixed first-page sections measured as a flex column with same gap */}
          <div
            ref={fixedRef}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--doc-content-gap)' }}
          >
            {FixedSections}
          </div>

          {/* Continuation label — measured for cont-page overhead */}
          <div ref={contLabelRef}>{ContLabelInner}</div>

          {/* Each atom measured individually */}
          {atomDefs.map(({ key, node }, i) => (
            <div key={key} ref={el => { atomRefs.current[i] = el; }}>
              {node}
            </div>
          ))}
        </div>

        {/* ══ Paginated pages ══════════════════════════════════════════════ */}
        {isReady && assignments && assignments.pageAtoms.map((pageAtomIndices, pageIdx) => {
          const firstIdx = pageAtomIndices[0];
          const showContLabel =
            pageIdx > 0 &&
            firstIdx !== undefined &&
            firstIdx >= 1 &&
            firstIdx <= partAtomEnd;

          return (
            <div
              key={pageIdx}
              className="doc-page"
              style={{ height: 'var(--doc-page-h)', overflow: 'hidden' }}
            >
              {!hideHeaderBand && <DocumentHeader docType="Invoice" />}

              <div className="doc-content" style={{ minHeight: 0, overflow: 'hidden', ...belowPartiesStyle }}>
                {/* Continued from previous page hint */}
                {pageIdx > 0 && <ContinuedFromPreviousPage page={pageIdx + 1} totalPages={totalPages} />}

                {pageIdx === 0 && FixedSections}
                {showContLabel && ContLabelInner}

                {pageAtomIndices.map((atomIdx, localIdx) => {
                  const isPartBlock = atomIdx >= 1 && atomIdx <= partAtomEnd;
                  // Negative margin to cancel flex gap for same-group atoms (flex gap 24 - tight 0 = -24)
                  const prevAtomIdx = localIdx > 0 ? pageAtomIndices[localIdx - 1] : undefined;
                  const prevInGroup = prevAtomIdx !== undefined && prevAtomIdx >= 0 && prevAtomIdx <= partAtomEnd;
                  const currInGroup = atomIdx >= 0 && atomIdx <= partAtomEnd;
                  const tighten = currInGroup && prevInGroup;

                  if (isPartBlock) {
                    const part = data.parts[atomIdx - 1];
                    const nextIdx = pageAtomIndices[localIdx + 1];
                    const showDivider =
                      nextIdx !== undefined &&
                      nextIdx >= 1 &&
                      nextIdx <= partAtomEnd;
                    return (
                      <div key={part.id} style={tighten ? { marginTop: -24 } : undefined}>
                        <PartBlock
                          part={part}
                          showDivider={showDivider}
                          pricingLayout={pricingLayout}
                          hideEmptyParams
                          hideFiles
                          hideParams
                          rateFirst
                          hidePricingLabels
                        />
                      </div>
                    );
                  }

                  return (
                    <React.Fragment key={atomDefs[atomIdx].key}>
                      {atomDefs[atomIdx].node}
                    </React.Fragment>
                  );
                })}

                {/* Continued on next page hint */}
                {pageIdx < totalPages - 1 && <ContinuedOnNextPage page={pageIdx + 1} totalPages={totalPages} />}
              </div>

              <DocumentFooter
                docId={data.invoiceId}
                page={pageIdx + 1}
                totalPages={totalPages}
                closing={pageIdx === totalPages - 1 ? data.closingMessage : undefined}
              />
            </div>
          );
        })}
      </div>
    );
  }
);

export default InvoiceDocument;
