/**
 * NRETable — Non-Recurring Engineering charges table
 *
 * Renders a small table for one-time charges (tooling, fixtures, setup)
 * separate from per-unit pricing. Uses primary-wash header and gray-150 dividers.
 * Returns null if charges array is empty.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name    | Type        | Required | Default | Description                        |
 * |---------|-------------|----------|---------|------------------------------------|
 * | charges | NRECharge[] | yes      | —       | Array of NRE charge items          |
 *
 * NRECharge shape:
 * | Field       | Type   | Description                                             |
 * |-------------|--------|---------------------------------------------------------|
 * | description | string | Charge description (e.g. "CNC Fixture for P01")         |
 * | amount      | number | Dollar amount                                            |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `charges` array: Variable number of NRE items. Component renders null
 *   when empty, so it can always be included in the document composition.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <NRETable charges={[{ description: 'CNC Fixture for P01', amount: 350 }]} />
 *   <NRETable charges={[]} />  // renders nothing
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use in Quote and Invoice when there are one-time charges. Always placed
 * between the parts section and the totals table.
 */

import { SectionLabel } from './SectionLabel';

export interface NRECharge {
  description: string;
  amount: number;
}

interface NRETableProps {
  charges: NRECharge[];
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function NRETable({ charges }: NRETableProps) {
  if (charges.length === 0) return null;

  return (
    <div data-comp="NRETable">
      <div className="flex items-end justify-between pb-[var(--sp-1)] border-b border-[color:var(--gray-150)]">
        <SectionLabel className="!border-b-0 !pb-0">Non-Recurring Charges (NRE)</SectionLabel>
        <span className="text-[length:var(--doc-text-param-label)] font-semibold uppercase tracking-[var(--doc-tracking-label)] text-[color:var(--gray-400)]">
          Subtotal
        </span>
      </div>
      {charges.map((charge, i) => (
        <div key={i} data-el="NRETable-row" className="flex justify-between items-baseline py-[var(--doc-sp-table-y)]">
          <span className="text-[length:var(--doc-text-body)] text-[color:var(--gray-900)] leading-[1.4]">
            {charge.description}
          </span>
          <span className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmt(charge.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default NRETable;
