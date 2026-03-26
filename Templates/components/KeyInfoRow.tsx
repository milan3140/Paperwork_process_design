/**
 * KeyInfoRow — Lead Time Options + Payment Terms + Currency
 *
 * Renders a 3-column key information strip. The left column (2fr) contains
 * a mini-table of lead time tier options for customer selection. The middle
 * and right columns (1fr each) show Payment Terms and Currency.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name            | Type             | Required | Default | Description                                  |
 * |-----------------|------------------|----------|---------|----------------------------------------------|
 * | leadTimeOptions | LeadTimeOption[] | yes      | —       | Array of lead time tiers for customer choice  |
 * | leadTimeNote    | string           | no       | —       | Footnote below lead time options              |
 * | paymentTerms    | string           | yes      | —       | Payment terms value (e.g. "PIA")              |
 * | currency        | string           | yes      | —       | Currency value (e.g. "USD ($)")               |
 *
 * LeadTimeOption shape:
 * | Field     | Type   | Description                                       |
 * |-----------|--------|---------------------------------------------------|
 * | days      | string | Duration (e.g. "26 Work Days")                    |
 * | surcharge | string | Surcharge text ("——" for none, "+$200" etc.)      |
 * | label     | string | Tier name (e.g. "Standard", "Expedited", "Rush")  |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `leadTimeOptions`: Variable number of tiers. Typically 2-4.
 * - `leadTimeNote`: Optional footnote (e.g. "Lead time begins upon receipt of PO...")
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <KeyInfoRow
 *     leadTimeOptions={[
 *       { days: '26 Work Days', surcharge: '——', label: 'Standard' },
 *       { days: '15 Work Days', surcharge: '+$200', label: 'Expedited' },
 *       { days: '8 Work Days', surcharge: '+$450', label: 'Rush' },
 *     ]}
 *     leadTimeNote="Lead time begins upon receipt of PO and payment."
 *     paymentTerms="Payment In Advance (PIA)"
 *     currency="USD ($)"
 *   />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use between PartiesRow and the main content (parts/items) to surface
 * key decision factors the reader needs at a glance.
 */

import { SectionLabel } from './SectionLabel';

export interface LeadTimeOption {
  days: string;
  surcharge: string;
  label: string;
}

interface KeyInfoRowProps {
  leadTimeOptions: LeadTimeOption[];
  leadTimeNote?: string;
  paymentTerms: string;
  currency: string;
}

export function KeyInfoRow({ leadTimeOptions, leadTimeNote, paymentTerms, currency }: KeyInfoRowProps) {
  return (
    <div
      data-comp="KeyInfoRow"
      className="grid gap-[var(--sp-6)] py-[var(--sp-2)]"
      style={{ gridTemplateColumns: '2fr 1fr 1fr' }}
    >
      {/* ── Lead Time Options (mini-table) ── */}
      <div data-el="KeyInfoRow-leadTime" className="flex flex-col gap-[var(--doc-sp-1-5)]">
        <SectionLabel>Quoted Lead Time</SectionLabel>
        <div className="flex flex-col gap-[var(--sp-1)]">
          {leadTimeOptions.map((opt, i) => (
            <div
              key={i}
              data-el="KeyInfoRow-leadTime-option"
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
        {leadTimeNote && (
          <div
            data-el="KeyInfoRow-leadTime-note"
            className="text-[length:var(--doc-text-fine)] text-[color:var(--gray-400)] leading-[1.4]"
          >
            {leadTimeNote}
          </div>
        )}
      </div>

      {/* ── Payment Terms ── */}
      <div data-el="KeyInfoRow-paymentTerms" className="flex flex-col gap-[var(--doc-sp-1-5)]">
        <SectionLabel>Payment Terms</SectionLabel>
        <div className="text-[length:var(--doc-text-part-id)] font-semibold text-[color:var(--gray-900)] mt-[var(--doc-sp-1-5)]">
          {paymentTerms}
        </div>
      </div>

      {/* ── Currency ── */}
      <div data-el="KeyInfoRow-currency" className="flex flex-col gap-[var(--doc-sp-1-5)]">
        <SectionLabel>Currency</SectionLabel>
        <div className="text-[length:var(--doc-text-part-id)] font-semibold text-[color:var(--gray-900)] mt-[var(--doc-sp-1-5)]">
          {currency}
        </div>
      </div>
    </div>
  );
}

export default KeyInfoRow;
