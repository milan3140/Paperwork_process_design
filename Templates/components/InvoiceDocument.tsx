/**
 * InvoiceDocument — Full invoice page composed from shared document components
 *
 * Renders a complete, print-ready invoice document by composing shared and
 * invoice-specific components into a Letter-size page. Supports 4 variants:
 *
 * - **PIA** (Payment In Advance): Pre-production invoice, no due date, warning box
 * - **Net 30**: Standard post-delivery invoice with due date
 * - **Partial**: Installment invoice showing paid-to-date and balance
 * - **Credit Card**: Includes 3% processing fee line item
 *
 * Key design decisions (from Document_Gap_Analysis.md):
 * - Quote Ref is the PRIMARY traceability point (highlighted), not PO Ref
 *   (many InstaVoxel clients are R&D teams without formal PO systems)
 * - Dual bank accounts (US + Taiwan) for cross-border operations
 * - No SignatureRow (PO already signed; invoice is a payment request)
 * - Items reference Quote (not PO) as the authoritative source
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css, Icons_Print.tsx,
 *   DocumentHeader, DocumentFooter, DocumentMeta, SectionLabel,
 *   PartiesRow, InvoiceKeyInfoRow, PartBlock, NRETable, TotalsTable,
 *   NotesList, WarningBox, PaymentInstructions, TermsSection
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type        | Required | Default | Description                  |
 * |------|-------------|----------|---------|------------------------------|
 * | data | InvoiceData | yes      | —       | Complete invoice data object  |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <InvoiceDocument data={invoiceData} />
 *
 *   // With react-to-print
 *   const ref = useRef<HTMLDivElement>(null);
 *   <InvoiceDocument ref={ref} data={invoiceData} />
 */

import React from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { PartiesRow, type PartyInfo } from './PartiesRow';
import { InvoiceKeyInfoRow, type InvoiceVariant } from './InvoiceKeyInfoRow';
import { PartBlock, type PartData } from './PartBlock';
import { NRETable, type NRECharge } from './NRETable';
import { TotalsTable, type TotalLine } from './TotalsTable';
import { NotesList } from './NotesList';
import { WarningBox } from './WarningBox';
import { PaymentInstructions, type BankDetails } from './PaymentInstructions';
import { TermsSection } from './TermsSection';

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
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const InvoiceDocument = React.forwardRef<HTMLDivElement, InvoiceDocumentProps>(
  function InvoiceDocument({ data }, ref) {

    /* ── Build meta items ──
       4 items max (AP-focused): Date, Due Date, Quote Ref, PO Ref.
       Ship Date → moved to key-info-row (trade conditions, not AP urgency).
       Packing Slip Ref → moved to notes (secondary traceability). */
    const metaItems: MetaItem[] = [
      { label: 'Date', value: data.date },
    ];
    if (data.dueDate && data.variant !== 'pia') {
      metaItems.push({ label: 'Due Date', value: data.dueDate, highlight: true });
    }
    metaItems.push({ label: 'Quote Ref', value: data.quoteRef, highlight: true });
    if (data.poRef) {
      metaItems.push({ label: 'PO Ref', value: data.poRef });
    }

    /* ── Build notes list ── */
    const noteItems: string[] = [...(data.notes ?? [])];
    if (data.packingSlipRef) {
      noteItems.push(`Ref: Packing Slip ${data.packingSlipRef}`);
    }
    if (data.earlyPaymentDiscount) {
      noteItems.push(data.earlyPaymentDiscount);
    }

    return (
      <div ref={ref} data-comp="InvoiceDocument" className="doc-page">
        <DocumentHeader docType="Invoice" />

        <div className="doc-content">
          {/* ── Title + Meta ── */}
          <div data-el="InvoiceDocument-titleRow" className="flex justify-between items-start">
            <div>
              <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                Invoice
              </div>
              <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
                #{data.invoiceId}
              </div>
            </div>
            <DocumentMeta items={metaItems} />
          </div>

          {/* ── Parties ── */}
          <PartiesRow
            from={data.from}
            billTo={data.billTo}
            shipTo={data.shipTo}
          />

          {/* ── Key Info: Payment Terms + Currency + Ship Date ── */}
          <InvoiceKeyInfoRow
            paymentTerms={data.paymentTerms}
            currency={data.currency}
            shipDate={data.shipDate}
            exchangeRate={data.exchangeRate}
            variant={data.variant}
          />

          {/* ── Line Items ── */}
          <div data-el="InvoiceDocument-parts">
            <SectionLabel>Invoiced Items ({data.parts.length} items)</SectionLabel>
            {data.parts.map((part, i) => (
              <PartBlock key={part.id} part={part} showDivider={i < data.parts.length - 1} />
            ))}
          </div>

          {/* ── NRE Charges (conditional) ── */}
          {data.nreCharges.length > 0 && <NRETable charges={data.nreCharges} />}

          {/* ── Totals ── */}
          <TotalsTable lines={data.totalsLines} total={data.total} />

          {/* ── Partial Payment Block (conditional) ── */}
          {data.partialPayment && (
            <div
              data-el="InvoiceDocument-partialPayment"
              className="flex justify-end"
            >
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
          )}

          {/* ── Notes (left) + Payment Instructions (right) ── */}
          <div data-el="InvoiceDocument-infoRow" className="grid grid-cols-2 gap-[var(--sp-6)]">
            <div>
              {noteItems.length > 0 && (
                <NotesList label="Invoice Notes" items={noteItems} />
              )}
            </div>
            <div>
              <PaymentInstructions
                bankDetails={data.bankDetails}
                creditCardFeeNote={data.creditCardFeeNote}
              />
            </div>
          </div>

          {/* ── PIA Warning (conditional) ── */}
          {data.variant === 'pia' && (
            <WarningBox>
              <strong>Payment In Advance:</strong> Full payment is required before production begins.
              Upon receipt of payment, InstaVoxel will commence manufacturing within 5 business days.
            </WarningBox>
          )}

          {/* ── Overdue Warning (conditional) ── */}
          {data.overdueNote && data.variant !== 'pia' && (
            <WarningBox>
              {data.overdueNote}
            </WarningBox>
          )}

          {/* ── Terms & Conditions ── */}
          <TermsSection text={data.termsText} linkUrl={data.termsLinkUrl} />
        </div>

        <DocumentFooter
          docId={data.invoiceId}
          page={1}
          totalPages={1}
          closing={data.closingMessage}
        />
      </div>
    );
  }
);

export default InvoiceDocument;
