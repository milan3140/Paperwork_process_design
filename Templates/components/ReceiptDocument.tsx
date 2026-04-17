/**
 * ReceiptDocument — Full payment receipt composed from shared document components
 *
 * Renders a complete, print-ready payment receipt confirming that InstaVoxel
 * has received payment for a specific Invoice. Supports 2 variants:
 *
 * - **Full Payment**: Invoice fully settled — subtle "Paid in Full" status
 * - **Partial Payment**: Installment — status + WarningBox for remaining balance
 *
 * Key design decisions (from Document_Gap_Analysis.md + industry research):
 * - Invoice Ref is the PRIMARY traceability point (highlighted)
 * - Quote Ref always present (many clients lack formal PO)
 * - Uses "Issued To" (not "Bill To") — declarative document, not transactional
 * - No full line items — Receipt references Invoice; includes brief description only
 * - No SignatureRow — unilateral confirmation; "Issued by" statement instead
 * - Receipt is NOT a tax document — note directs reader to retain Invoice
 * - Status shown as subtle text in title area, not full-width banner
 *   (banner pattern is web UI, not professional document design)
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css, Icons_Print.tsx,
 *   DocumentHeader, DocumentFooter, DocumentMeta, SectionLabel,
 *   PartiesRow, NotesList, WarningBox, TermsSection,
 *   PaginatedDocument
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type        | Required | Default | Description                   |
 * |------|-------------|----------|---------|-------------------------------|
 * | data | ReceiptData | yes      | —       | Complete receipt data object   |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <ReceiptDocument data={receiptData} />
 *
 *   // With react-to-print
 *   const ref = useRef<HTMLDivElement>(null);
 *   <ReceiptDocument ref={ref} data={receiptData} />
 */

import React from 'react';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { PartiesRow, type PartyInfo } from './PartiesRow';
import { NotesList } from './NotesList';
import { WarningBox } from './WarningBox';
import { TermsSection } from './TermsSection';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';

/* ── Types ── */

export interface ReceiptData {
  receiptId: string;
  date: string;

  /* ── Cross-references (traceability chain) ── */
  invoiceRef: string;     // PRIMARY traceability — always present
  quoteRef: string;       // Always present (many clients lack formal PO)
  poRef?: string;         // Optional — client may not have formal PO

  /* ── Parties ── */
  from: PartyInfo;
  issuedTo: PartyInfo;    // "Issued To" for declarative documents (not "Bill To")

  /* ── Payment details ── */
  description?: string;     // Brief goods/services summary (e.g. "CNC Machined Parts (3 items)")
  amountReceived: number;
  currency: string;
  paymentMethod: string;    // "Wire Transfer", "Credit Card", "ACH"
  transactionRef: string;   // Bank reference number / CC transaction ID
  dateReceived: string;     // Bank entry date — may differ from receipt date

  /* ── Payment summary ── */
  invoiceTotal: number;
  previouslyPaid?: number;  // For partial payments — sum of prior receipts
  balanceDue: number;

  /* ── Partial payment (conditional) ── */
  isPartial?: boolean;
  paymentLabel?: string;    // e.g. "Payment 1 of 2"

  /* ── Notes & Terms ── */
  notes?: string[];
  termsText: string;
  closingMessage?: string;
}

interface ReceiptDocumentProps {
  data: ReceiptData;
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const ReceiptDocument = React.forwardRef<HTMLDivElement, ReceiptDocumentProps>(
  function ReceiptDocument({ data }, ref) {

    const isFullyPaid = data.balanceDue === 0;

    /* ── Build meta items ── */
    const metaItems: MetaItem[] = [
      { label: 'Date', value: data.date },
      { label: 'Invoice Ref', value: data.invoiceRef, highlight: true },
      { label: 'Quote Ref', value: data.quoteRef },
    ];
    if (data.poRef) {
      metaItems.push({ label: 'PO Ref', value: data.poRef });
    }
    metaItems.push({
      label: 'Status',
      value: isFullyPaid ? 'Paid in Full' : 'Partial',
      highlight: true,
    });

    /* ── Build notes list ── */
    const noteItems: string[] = [...(data.notes ?? [])];

    /* ── Payment detail rows ── */
    const detailRows: { label: string; value: string; bold?: boolean }[] = [
      { label: 'Amount Received', value: fmt(data.amountReceived), bold: true },
      { label: 'Currency', value: data.currency },
      { label: 'Date Received', value: data.dateReceived },
      { label: 'Payment Method', value: data.paymentMethod },
      { label: 'Transaction Ref', value: data.transactionRef },
    ];
    if (data.description) {
      detailRows.push({ label: 'Description', value: data.description });
    }
    if (data.isPartial && data.paymentLabel) {
      detailRows.push({ label: 'Installment', value: data.paymentLabel });
    }

    /* ── Build sections for PaginatedDocument ── */
    const sections: PageSection[] = [
      {
        key: 'title-meta',
        content: (
          <div data-el="ReceiptDocument-titleRow" className="flex justify-between items-start">
            <div>
              <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                Payment Receipt
              </div>
              <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
                #{data.receiptId}
              </div>
            </div>
            <DocumentMeta items={metaItems} />
          </div>
        ),
      },
      {
        key: 'parties',
        content: (
          <PartiesRow
            from={data.from}
            billTo={data.issuedTo}
            toLabel="Issued To"
          />
        ),
      },
      {
        key: 'payment-details',
        content: (
          <div data-el="ReceiptDocument-paymentDetails">
            <SectionLabel>Payment Details</SectionLabel>
            <div className="flex flex-col mt-[var(--doc-sp-1-5)]">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="grid py-[var(--doc-sp-table-y)]"
                  style={{ gridTemplateColumns: '120px 1fr' }}
                >
                  <span className="text-[length:var(--doc-text-secondary)] font-semibold uppercase tracking-[var(--doc-tracking-label)] text-[color:var(--gray-400)]">
                    {row.label}
                  </span>
                  <span className={`text-[color:var(--gray-900)] ${row.bold ? 'font-bold text-[length:var(--doc-text-part-id)]' : 'font-medium text-[length:var(--doc-text-body)]'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        key: 'payment-summary',
        content: (
          <div data-el="ReceiptDocument-paymentSummary">
            <SectionLabel>Payment Summary</SectionLabel>
            <div className="flex justify-end mt-[var(--doc-sp-1-5)]">
              <table className="w-[var(--doc-w-totals)] border-collapse" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <tbody>
                  <tr>
                    <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right pr-[var(--sp-4)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)]">
                      Invoice Total
                    </td>
                    <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)]">
                      {fmt(data.invoiceTotal)}
                    </td>
                  </tr>
                  {data.isPartial && data.previouslyPaid != null && (
                    <tr>
                      <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right pr-[var(--sp-4)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)]">
                        Previously Paid
                      </td>
                      <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)]">
                        {fmt(data.previouslyPaid)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right pr-[var(--sp-4)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)]">
                      This Payment
                    </td>
                    <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)]">
                      {fmt(data.amountReceived)}
                    </td>
                  </tr>
                  <tr data-el="ReceiptDocument-balanceDue">
                    <td
                      className="py-[var(--sp-2)] px-[var(--sp-2)] text-right pr-[var(--sp-4)] text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--color-primary)]"
                      style={{ borderTop: 'var(--doc-border-emphasis) solid var(--color-primary)' }}
                    >
                      Balance Due
                    </td>
                    <td
                      className="py-[var(--sp-2)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-key-value)] font-bold text-[color:var(--color-primary)] bg-[var(--color-primary-selected)] rounded-[var(--radius-sm)]"
                      style={{ borderTop: 'var(--doc-border-emphasis) solid var(--color-primary)' }}
                    >
                      {fmt(data.balanceDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
    ];

    // Conditional sections
    if (data.isPartial && data.balanceDue > 0) {
      sections.push({
        key: 'partial-warning',
        content: (
          <WarningBox>
            <strong>Partial Payment:</strong> Remaining balance of {fmt(data.balanceDue)} must
            be settled before shipment. Please reference Invoice #{data.invoiceRef} on all
            future remittances.
          </WarningBox>
        ),
      });
    }

    if (noteItems.length > 0) {
      sections.push({
        key: 'notes',
        content: <NotesList label="Receipt Notes" items={noteItems} />,
      });
    }

    sections.push({
      key: 'terms',
      content: <TermsSection text={data.termsText} />,
    });

    return (
      <div ref={ref} data-comp="ReceiptDocument">
        <PaginatedDocument
          docType="Receipt"
          docId={data.receiptId}
          sections={sections}
          closing={data.closingMessage}
        />
      </div>
    );
  }
);

export default ReceiptDocument;
