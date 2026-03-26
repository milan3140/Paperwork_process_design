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
    <div data-comp="NRETable" className="flex flex-col gap-0">
      <SectionLabel>Non-Recurring Charges (NRE)</SectionLabel>
      <div className="h-[var(--sp-1)]" />
      <table className="w-full border-collapse text-[length:var(--doc-text-body)]">
        <thead>
          <tr>
            <th data-el="NRETable-th-desc" className="bg-[var(--color-primary-wash)] text-[color:var(--color-primary)] text-[length:var(--doc-text-file-tag)] font-semibold uppercase tracking-[var(--doc-tracking-label)] py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-left border-b-[var(--doc-border-emphasis)] border-[var(--color-primary-subtle)]">
              Description
            </th>
            <th data-el="NRETable-th-amount" className="bg-[var(--color-primary-wash)] text-[color:var(--color-primary)] text-[length:var(--doc-text-file-tag)] font-semibold uppercase tracking-[var(--doc-tracking-label)] py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-right border-b-[var(--doc-border-emphasis)] border-[var(--color-primary-subtle)]">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {charges.map((charge, i) => (
            <tr key={i} data-el="NRETable-row">
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] border-b border-[var(--gray-150)] text-[color:var(--gray-900)] leading-[1.4]">
                {charge.description}
              </td>
              <td className="py-[var(--doc-sp-table-y)] px-[var(--sp-2)] border-b border-[var(--gray-150)] text-right text-[color:var(--gray-900)] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmt(charge.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NRETable;
