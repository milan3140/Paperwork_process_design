/**
 * QuoteDocument — Full quotation page composed from shared document components
 *
 * Renders a complete, print-ready quotation document by composing all shared
 * document components into a Letter-size page. This is a "document renderer" —
 * purely visual, no interactivity. Pass a QuoteData object and it renders
 * a page ready for PDF export via react-to-print, Puppeteer, or browser Ctrl+P.
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css (design tokens)
 *   documents.css (document tokens + print styles)
 *   Icons_Print.tsx (icon registry)
 *   DocumentHeader.tsx
 *   DocumentFooter.tsx
 *   DocumentMeta.tsx
 *   SectionLabel.tsx
 *   PartiesRow.tsx
 *   KeyInfoRow.tsx
 *   PartBlock.tsx
 *   NRETable.tsx
 *   TotalsTable.tsx
 *   NotesList.tsx
 *   WarningBox.tsx
 *   PaymentInfo.tsx
 *   SignatureRow.tsx
 *   TermsSection.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type      | Required | Default | Description                       |
 * |------|-----------|----------|---------|-----------------------------------|
 * | data | QuoteData | yes      | —       | Complete quote data object        |
 *
 * QuoteData shape:
 * | Field              | Type               | Required | Description                                        |
 * |--------------------|--------------------|----------|----------------------------------------------------|
 * | quoteId            | string             | yes      | Quote ID (e.g. "U260319042")                       |
 * | revision           | number             | no       | Revision number. >0 appends _REV-X to subtitle    |
 * | date               | string             | yes      | Issue date (e.g. "March 19, 2026")                 |
 * | validUntil         | string             | yes      | Expiration date                                     |
 * | rfqRef             | string             | no       | Customer RFQ reference number                      |
 * | from               | PartyInfo          | yes      | Sender company info                                 |
 * | billTo             | PartyInfo          | yes      | Billing recipient info                              |
 * | shipTo             | PartyInfo          | no       | Shipping recipient (if different from billTo)       |
 * | leadTimeOptions    | LeadTimeOption[]   | yes      | Lead time tiers for customer selection              |
 * | leadTimeNote       | string             | no       | Footnote below lead time options                    |
 * | paymentTerms       | string             | yes      | Payment terms (e.g. "Payment In Advance (PIA)")    |
 * | currency           | string             | yes      | Currency (e.g. "USD ($)")                           |
 * | parts              | PartData[]         | yes      | Array of part items with params and files           |
 * | nreCharges         | NRECharge[]        | yes      | Non-recurring charges (pass [] if none)             |
 * | totalsLines        | TotalLine[]        | yes      | Cost breakdown lines (Subtotal, Shipping, Tax)     |
 * | total              | TotalLine          | yes      | Final total line                                    |
 * | manufacturingNotes | string[]           | yes      | Manufacturing note strings                          |
 * | exclusions         | string             | yes      | Exclusions warning text                             |
 * | payments           | InfoItem[]         | yes      | Payment method items                                |
 * | termsText          | string             | yes      | T&C text content                                    |
 * | termsLinkUrl       | string             | no       | URL to full terms page                              |
 * | closingMessage     | string             | no       | Footer closing (e.g. "We look forward to...")      |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only. For PDF export, use ref with react-to-print.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - All content is driven by the `data` prop — no hardcoded business data.
 * - `ref` (via forwardRef): Attach a ref for react-to-print PDF export.
 * - Layout structure and component order are fixed by design intent.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   // Basic render
 *   <QuoteDocument data={quoteData} />
 *
 *   // With react-to-print
 *   const ref = useRef<HTMLDivElement>(null);
 *   <QuoteDocument ref={ref} data={quoteData} />
 *   <button onClick={() => handlePrint(ref)}>Export PDF</button>
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use as the top-level component for rendering a quotation document.
 * This is a composition component — it orchestrates shared components
 * but does not define its own visual styles beyond layout.
 */

import React from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { PartiesRow, type PartyInfo } from './PartiesRow';
import { KeyInfoRow } from './KeyInfoRow';
import { PartBlock, type PartData } from './PartBlock';
import { NRETable, type NRECharge } from './NRETable';
import { TotalsTable, type TotalLine } from './TotalsTable';
import { NotesList } from './NotesList';
import { WarningBox } from './WarningBox';
import { PaymentInfo, type InfoItem } from './PaymentInfo';
import { SignatureRow } from './SignatureRow';
import { TermsSection } from './TermsSection';

/** Lead time tier option for customer selection */
export interface LeadTimeOption {
  /** Display label (e.g. "Standard", "Expedited", "Rush") */
  label: string;
  /** Duration text (e.g. "26 Work Days") */
  days: string;
  /** Surcharge text: "——" for no surcharge, "+$200" etc. */
  surcharge: string;
}

export interface QuoteData {
  quoteId: string;
  /** Revision number. When > 0, subtitle shows e.g. #U260319042_REV-1 */
  revision?: number;
  date: string;
  validUntil: string;
  rfqRef?: string;

  from: PartyInfo;
  billTo: PartyInfo;
  shipTo?: PartyInfo;

  leadTimeOptions: LeadTimeOption[];
  leadTimeNote?: string;
  paymentTerms: string;
  currency: string;

  parts: PartData[];
  nreCharges: NRECharge[];

  totalsLines: TotalLine[];
  total: TotalLine;

  manufacturingNotes: string[];
  exclusions: string;

  payments: InfoItem[];

  termsText: string;
  termsLinkUrl?: string;

  closingMessage?: string;
}

interface QuoteDocumentProps {
  data: QuoteData;
}

export const QuoteDocument = React.forwardRef<HTMLDivElement, QuoteDocumentProps>(
  function QuoteDocument({ data }, ref) {
    const metaItems: MetaItem[] = [
      { label: 'Date', value: data.date },
      { label: 'Valid Until', value: data.validUntil },
    ];
    if (data.rfqRef) {
      metaItems.push({ label: 'RFQ Ref', value: data.rfqRef });
    }

    /* ── Build subtitle with optional REV-X ── */
    const subtitle =
      data.revision && data.revision > 0
        ? `#${data.quoteId}_REV-${data.revision}`
        : `#${data.quoteId}`;

    return (
      <div ref={ref} data-comp="QuoteDocument" className="doc-page">
        <DocumentHeader docType="Quotation" />

        <div className="doc-content">
          {/* ── Title + Meta ── */}
          <div data-el="QuoteDocument-titleRow" className="flex justify-between items-start">
            <div>
              <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                Quotation
              </div>
              <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
                {subtitle}
              </div>
            </div>
            <DocumentMeta items={metaItems} />
          </div>

          {/* ── Parties: From (top), Bill To + Ship To (bottom row) ── */}
          <PartiesRow
            from={data.from}
            billTo={data.billTo}
            shipTo={data.shipTo}
          />

          {/* ── Key Info: Lead Time Options + Payment Terms + Currency ── */}
          <KeyInfoRow
            leadTimeOptions={data.leadTimeOptions}
            leadTimeNote={data.leadTimeNote}
            paymentTerms={data.paymentTerms}
            currency={data.currency}
          />

          {/* ── Parts ── */}
          <div data-el="QuoteDocument-parts">
            <SectionLabel>Quoted Parts ({data.parts.length} items)</SectionLabel>
            {data.parts.map((part, i) => (
              <PartBlock key={part.id} part={part} showDivider={i < data.parts.length - 1} />
            ))}
          </div>

          {data.nreCharges.length > 0 && <NRETable charges={data.nreCharges} />}

          <TotalsTable lines={data.totalsLines} total={data.total} />

          {/* ── Manufacturing Notes (left) + Payment Methods (right) ── */}
          <div data-el="QuoteDocument-infoRow" className="grid grid-cols-2 gap-[var(--sp-6)]">
            <div>
              {data.manufacturingNotes.length > 0 && (
                <NotesList label="Manufacturing Notes" items={data.manufacturingNotes} />
              )}
            </div>
            <div>
              <PaymentInfo payments={data.payments} />
            </div>
          </div>

          {data.exclusions && (
            <WarningBox>
              <strong>Exclusions:</strong> {data.exclusions}
            </WarningBox>
          )}

          <SignatureRow leftLabel="Authorized By (InstaVoxel)" rightLabel="Accepted By (Customer)" />

          <TermsSection text={data.termsText} linkUrl={data.termsLinkUrl} />
        </div>

        <DocumentFooter docId={data.quoteId} page={1} totalPages={1} closing={data.closingMessage} />
      </div>
    );
  }
);

export default QuoteDocument;
