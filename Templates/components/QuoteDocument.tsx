/**
 * QuoteDocument — Full quotation page composed from shared document components
 *
 * Renders a complete, print-ready quotation document. Uses the two-pass
 * useDocumentPagination hook to automatically distribute content across as
 * many Letter-size pages as needed. Each atom (SectionLabel, PartBlock, NRE,
 * Totals, etc.) is measured in a hidden sandbox, then placed on the correct
 * page via greedy bin-packing — no hardcoded page-break constants required.
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css (design tokens)
 *   documents.css (document tokens + print styles)
 *   Icons_Print.tsx (icon registry)
 *   DocumentHeader.tsx, DocumentFooter.tsx, DocumentMeta.tsx
 *   SectionLabel.tsx, PartiesRow.tsx, KeyInfoRow.tsx
 *   PartBlock.tsx, NRETable.tsx, TotalsTable.tsx
 *   NotesList.tsx, WarningBox.tsx, PaymentInfo.tsx
 *   SignatureRow.tsx, TermsSection.tsx
 *   useDocumentPagination.ts
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type      | Required | Default | Description                       |
 * |------|-----------|----------|---------|-----------------------------------|
 * | data | QuoteData | yes      | —       | Complete quote data object        |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <QuoteDocument data={quoteData} />
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   <QuoteDocument ref={ref} data={quoteData} />
 *   <button onClick={() => handlePrint(ref)}>Export PDF</button>
 */

import React, { useMemo } from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { type PartyInfo } from './PartiesRow';
import { PartBlock, type PartData } from './PartBlock';
import { NRETable, type NRECharge } from './NRETable';
import { TotalsTable, type TotalLine } from './TotalsTable';
import { NotesList } from './NotesList';
import { WarningBox } from './WarningBox';
import { PaymentInfo, type InfoItem } from './PaymentInfo';
import { SignatureRow } from './SignatureRow';
import { TermsSection } from './TermsSection';
import { useDocumentPagination } from './useDocumentPagination';
import { ContinuedOnNextPage, ContinuedFromPreviousPage } from './ContinuationHints';

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
  /** When true, the purple brand header band is omitted from every page. Pair with
      `renderLogoAboveMeta` to replace it with an in-content logo block. */
  hideHeaderBand?: boolean;
  /** Optional render fn placed above DocumentMeta in the title row (e.g. a text
      logo + page indicator when hideHeaderBand removes the top banner). */
  renderLogoAboveMeta?: (totalPages: number) => React.ReactNode;
}

/* ── Sandbox styles ─────────────────────────────────────────────────────────
 * The measurement sandbox is positioned absolutely off-screen so it has real
 * layout dimensions but is never visible. data-sandbox="true" lets print CSS
 * exclude it via [data-sandbox] { display: none }. */
const SANDBOX_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 0,
  width: 'var(--doc-page-w)',
  visibility: 'hidden',
  pointerEvents: 'none',
  zIndex: -9999,
};

export const QuoteDocument = React.forwardRef<HTMLDivElement, QuoteDocumentProps>(
  function QuoteDocument({ data, hideHeaderBand = false, renderLogoAboveMeta }, ref) {
    /* ── Meta items ── */
    const metaItems: MetaItem[] = [
      { label: 'Date',        value: data.date },
      { label: 'Valid Until', value: data.validUntil, highlight: true, weight: 'bold', fontSize: 16 },
    ];
    if (data.rfqRef) {
      metaItems.push({ label: 'RFQ Ref', value: data.rfqRef });
    }
    metaItems.push({ label: 'Payment Terms', value: data.paymentTerms, highlight: true, weight: 'normal' });

    const subtitle =
      data.revision && data.revision > 0
        ? `#${data.quoteId}_REV-${data.revision}`
        : `#${data.quoteId}`;

    /* ── Atom descriptors ──────────────────────────────────────────────────
     * atom[0]              = SectionLabel "Quoted Parts (N items)"
     * atom[1..parts.length] = PartBlocks (showDivider computed per-page in render)
     * atom[parts.length+1..] = tail sections (NRE, Totals, Notes, Warning, Sig, Terms)
     *
     * showDivider for PartBlocks in the sandbox uses true so measurement includes
     * the 1px border-bottom. Actual render computes showDivider from page context. */
    const partAtomEnd = data.parts.length; // inclusive index of last PartBlock atom

    const atomDefs = useMemo<{ key: string; node: React.ReactNode }[]>(() => {
      const defs: { key: string; node: React.ReactNode }[] = [];

      // [0] Section header
      defs.push({
        key:  'parts-label',
        node: <SectionLabel>Quoted Parts ({data.parts.length} items)</SectionLabel>,
      });

      // [1..N] Parts — showDivider=true so sandbox height includes divider border
      data.parts.forEach(part => {
        defs.push({
          key:  `part-${part.id}`,
          node: <PartBlock part={part} showDivider />,
        });
      });

      // Tail atoms
      if (data.nreCharges.length > 0) {
        defs.push({ key: 'nre', node: <NRETable charges={data.nreCharges} /> });
      }

      defs.push({
        key:  'totals',
        node: <TotalsTable lines={data.totalsLines} total={data.total} />,
      });

      defs.push({
        key: 'info-row',
        node: (
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
        ),
      });

      if (data.exclusions) {
        defs.push({
          key:  'warning',
          node: <WarningBox><strong>Exclusions:</strong> {data.exclusions}</WarningBox>,
        });
      }

      defs.push({
        key:  'signature',
        node: <SignatureRow leftLabel="Authorized By (InstaVoxel)" rightLabel="Accepted By (Customer)" />,
      });

      defs.push({
        key:  'terms',
        node: <TermsSection text={data.termsText} linkUrl={data.termsLinkUrl} />,
      });

      return defs;
    }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Pagination hook ── */
    const {
      contentMeasureRef,
      fixedRef,
      contLabelRef,
      atomRefs,
      assignments,
      isReady,
    } = useDocumentPagination(atomDefs.length, 24 /* doc-content-gap */);

    const totalPages = assignments?.pageCount ?? 1;

    /* ── Party block helper — mirrors InvoiceDocument so the Invoice-v3-style
         title/parties layout can be used here without importing PartiesRow. ── */
    const renderPartyBlock = (label: string, party: PartyInfo, side: string) => (
      <div data-el={`QuoteDocument-${side}`} className="flex flex-col gap-[var(--doc-sp-1-5)]">
        <SectionLabel>{label}</SectionLabel>
        <div
          data-el={`QuoteDocument-${side}-name`}
          className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)]"
        >
          {party.name}
        </div>
        <div
          data-el={`QuoteDocument-${side}-detail`}
          className="text-[length:var(--doc-text-body)] font-normal text-[color:var(--gray-900)] leading-[1.5]"
        >
          {party.lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < party.lines.length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>
    );

    /* ── Fixed sections (page 0 only) — duplicated for sandbox + main render ── */
    const FixedSections = (
      <>
        <div data-el="QuoteDocument-titleRow" className="grid grid-cols-2 gap-[var(--sp-6)] items-start">
          <div className="flex flex-col gap-[var(--sp-4)] min-w-0">
            <div>
              <div
                data-el="QuoteDocument-title"
                className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]"
              >
                Quotation
              </div>
              <div
                data-el="QuoteDocument-subtitle"
                className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]"
              >
                {subtitle}
              </div>
            </div>
            {renderPartyBlock('From', data.from, 'from')}
          </div>
          <div className="flex flex-col items-end gap-[var(--sp-3)]">
            {renderLogoAboveMeta?.(totalPages)}
            <DocumentMeta items={metaItems} />
          </div>
        </div>

        {data.shipTo ? (
          <div data-comp="PartiesRow" style={{ marginTop: -12 }} className="grid grid-cols-2 gap-[var(--sp-6)]">
            {renderPartyBlock('Bill To', data.billTo, 'billTo')}
            {renderPartyBlock('Ship To', data.shipTo, 'shipTo')}
          </div>
        ) : (
          <div data-comp="PartiesRow" style={{ marginTop: -12 }}>
            {renderPartyBlock('Bill To / Ship To', data.billTo, 'billTo')}
          </div>
        )}

        <div data-comp="QuoteDocument-leadTime" className="flex flex-col gap-[var(--doc-sp-1-5)]">
          <SectionLabel>Quoted Lead Time</SectionLabel>
          <div className="flex flex-col gap-[var(--sp-1)]">
            {data.leadTimeOptions.map((opt, i) => (
              <div
                key={i}
                data-el="QuoteDocument-leadTime-option"
                className="grid text-[length:var(--doc-text-secondary)] leading-[1.5]"
                style={{ gridTemplateColumns: '1fr auto auto', gap: 'var(--sp-4)' }}
              >
                <span className={i === 0
                  ? 'font-bold text-[color:var(--color-primary)]'
                  : 'font-medium text-[color:var(--gray-700)]'
                }>
                  {opt.days}
                </span>
                <span className="text-[color:var(--gray-500)] text-right tabular-nums">
                  {opt.surcharge}
                </span>
                <span className="text-[color:var(--gray-400)] text-right" style={{ minWidth: '5em' }}>
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
          {data.leadTimeNote && (
            <div
              data-el="QuoteDocument-leadTime-note"
              className="text-[length:var(--doc-text-fine)] text-[color:var(--gray-400)] leading-[1.4]"
            >
              {data.leadTimeNote}
            </div>
          )}
        </div>
      </>
    );

    /* ── Continuation label — same markup in sandbox + main render ── */
    const ContLabelInner = (
      <div
        data-el="QuoteDocument-contLabel"
        className="text-[length:var(--doc-text-grid-label)] font-semibold text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)] uppercase"
        style={{ borderBottom: '1px solid var(--gray-200)', paddingBottom: 'var(--sp-2)' }}
      >
        Quoted Parts — continued
      </div>
    );

    return (
      /* position: relative so the absolute-positioned sandbox is contained */
      <div
        ref={ref}
        data-comp="QuoteDocument"
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}
      >
        {/* ══ Measurement sandbox ══════════════════════════════════════════ */}
        <div aria-hidden="true" data-sandbox="true" style={SANDBOX_STYLE}>

          {/* Reference page → measures exact available content height */}
          <div className="doc-page">
            {!hideHeaderBand && <DocumentHeader docType="Quotation" />}
            <div className="doc-content" ref={contentMeasureRef} style={{ minHeight: 0 }} />
            <DocumentFooter docId={data.quoteId} page={1} totalPages={1} />
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

        {/* ══ Paginated pages (rendered only once measurements are ready) ══ */}
        {isReady && assignments && assignments.pageAtoms.map((pageAtomIndices, pageIdx) => {
          // Show cont label when this page starts with a PartBlock (not SectionLabel or tail)
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
              {!hideHeaderBand && <DocumentHeader docType="Quotation" />}

              <div className="doc-content" style={{ minHeight: 0, overflow: 'hidden' }}>
                {/* Continued from previous page hint */}
                {pageIdx > 0 && <ContinuedFromPreviousPage page={pageIdx + 1} totalPages={totalPages} />}

                {/* Fixed sections on page 0 */}
                {pageIdx === 0 && FixedSections}

                {/* Continuation label on pages 1+ (parts only) */}
                {showContLabel && ContLabelInner}

                {/* Atoms assigned to this page */}
                {pageAtomIndices.map((atomIdx, localIdx) => {
                  const isPartBlock = atomIdx >= 1 && atomIdx <= partAtomEnd;

                  if (isPartBlock) {
                    const part = data.parts[atomIdx - 1];
                    // showDivider only when the NEXT atom on this same page is also a PartBlock
                    const nextIdx = pageAtomIndices[localIdx + 1];
                    const showDivider =
                      nextIdx !== undefined &&
                      nextIdx >= 1 &&
                      nextIdx <= partAtomEnd;
                    return (
                      <PartBlock
                        key={part.id}
                        part={part}
                        showDivider={showDivider}
                      />
                    );
                  }

                  // All other atoms (SectionLabel, tail sections)
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
                docId={data.quoteId}
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

export default QuoteDocument;
