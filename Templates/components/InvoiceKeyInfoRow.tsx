/**
 * InvoiceKeyInfoRow — Payment Terms + Currency + Ship Date
 *
 * Invoice-specific replacement for KeyInfoRow. Shows the confirmed payment
 * terms, currency, and ship date as trade conditions. Due Date is in the
 * right-side meta area (AP-focused), not here (avoids duplication).
 *
 * Adapts to 4 invoice variants:
 * - PIA: shows "Prepayment Required" badge, Ship Date may be "—"
 * - Net 30: shows ship date (triggers Net 30 countdown)
 * - Partial: shows ship date
 * - Credit Card: shows ship date
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name         | Type           | Required | Default | Description                                   |
 * |--------------|----------------|----------|---------|-----------------------------------------------|
 * | paymentTerms | string         | yes      | —       | Confirmed payment terms (e.g. "Net 30")       |
 * | currency     | string         | yes      | —       | Currency with symbol (e.g. "USD ($)")         |
 * | shipDate     | string         | no       | —       | Ship date (may be absent for PIA pre-prod)    |
 * | exchangeRate | string         | no       | —       | Exchange rate note (e.g. "1 USD = 32.15 TWD") |
 * | variant      | InvoiceVariant | yes      | —       | Invoice variant driving conditional display    |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <InvoiceKeyInfoRow
 *     paymentTerms="Net 30"
 *     currency="USD ($)"
 *     shipDate="April 20, 2026"
 *     variant="net"
 *   />
 *
 *   <InvoiceKeyInfoRow
 *     paymentTerms="Payment In Advance"
 *     currency="USD ($)"
 *     variant="pia"
 *   />
 */

import { SectionLabel } from './SectionLabel';

export type InvoiceVariant = 'pia' | 'net' | 'partial' | 'credit-card';

interface InvoiceKeyInfoRowProps {
  paymentTerms: string;
  currency: string;
  shipDate?: string;
  exchangeRate?: string;
  variant: InvoiceVariant;
}

export function InvoiceKeyInfoRow({ paymentTerms, currency, shipDate, exchangeRate, variant }: InvoiceKeyInfoRowProps) {
  return (
    <div
      data-comp="InvoiceKeyInfoRow"
      className="grid gap-[var(--sp-6)] py-[var(--sp-2)]"
      style={{ gridTemplateColumns: '1fr 1fr' }}
    >
      {/* ── Payment Terms ── */}
      <div data-el="InvoiceKeyInfoRow-paymentTerms" className="flex flex-col gap-[var(--doc-sp-1-5)]">
        <SectionLabel>Payment Terms</SectionLabel>
        <div className="text-[length:var(--doc-text-part-id)] font-semibold text-[color:var(--gray-900)] mt-[var(--doc-sp-1-5)]">
          {paymentTerms}
        </div>
        {variant === 'pia' && (
          <div
            data-el="InvoiceKeyInfoRow-pia-badge"
            className="inline-flex items-center self-start px-[var(--sp-2)] py-[var(--sp-half)] rounded-[2px] text-[length:var(--doc-text-fine)] font-semibold tracking-[var(--doc-tracking-label)] uppercase"
            style={{
              backgroundColor: 'var(--color-primary-selected)',
              color: 'var(--color-primary)',
            }}
          >
            Prepayment Required
          </div>
        )}
      </div>

      {/* ── Ship Date ── */}
      <div data-el="InvoiceKeyInfoRow-shipDate" className="flex flex-col gap-[var(--doc-sp-1-5)]">
        <SectionLabel>Ship Date</SectionLabel>
        <div className={`text-[length:var(--doc-text-part-id)] font-semibold mt-[var(--doc-sp-1-5)] ${
          shipDate
            ? 'text-[color:var(--gray-900)]'
            : 'text-[color:var(--gray-500)] italic'
        }`}>
          {shipDate ?? '—'}
        </div>
      </div>
    </div>
  );
}

export default InvoiceKeyInfoRow;
