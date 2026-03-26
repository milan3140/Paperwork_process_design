/**
 * TotalsTable — Right-aligned cost summary table
 *
 * Renders Subtotal, NRE, Shipping, Tax, and Total in a compact right-aligned
 * table. The Total row is visually emphasized with brand primary color,
 * larger font, and highlighted background.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name  | Type        | Required | Default | Description                            |
 * |-------|-------------|----------|---------|----------------------------------------|
 * | lines | TotalLine[] | yes      | —       | Array of subtotal line items           |
 * | total | TotalLine   | yes      | —       | Final total line (visually emphasized) |
 *
 * TotalLine shape:
 * | Field  | Type   | Description                                         |
 * |--------|--------|-----------------------------------------------------|
 * | label  | string | Line label (e.g. "Subtotal (Parts)", "Tax")         |
 * | amount | number | Dollar amount — formatted as $X,XXX.XX              |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `lines` array: Add/remove cost breakdown rows as needed.
 * - `total`: Always rendered last with brand-color emphasis.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <TotalsTable
 *     lines={[
 *       { label: 'Subtotal (Parts)', amount: 5855 },
 *       { label: 'NRE / Tooling', amount: 350 },
 *       { label: 'Shipping (DHL Express)', amount: 185 },
 *       { label: 'Tax', amount: 0 },
 *     ]}
 *     total={{ label: 'Total', amount: 6390 }}
 *   />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use in Quote and Invoice documents after the line items section.
 * Always right-aligned per accounting convention.
 */

export interface TotalLine {
  label: string;
  amount: number;
}

interface TotalsTableProps {
  lines: TotalLine[];
  total: TotalLine;
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TotalsTable({ lines, total }: TotalsTableProps) {
  return (
    <div data-comp="TotalsTable" className="flex justify-end">
      <table className="w-[var(--doc-w-totals)] border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} data-el="TotalsTable-line">
              <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right pr-[var(--sp-4)] text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)]">
                {line.label}
              </td>
              <td className="py-[var(--doc-sp-totals-y)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmt(line.amount)}
              </td>
            </tr>
          ))}
          <tr data-el="TotalsTable-total">
            <td
              className="py-[var(--sp-2)] px-[var(--sp-2)] text-right pr-[var(--sp-4)] text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--color-primary)]"
              style={{ borderTop: 'var(--doc-border-emphasis) solid var(--color-primary)' }}
            >
              {total.label}
            </td>
            <td
              className="py-[var(--sp-2)] px-[var(--sp-2)] text-right text-[length:var(--doc-text-key-value)] font-bold text-[color:var(--color-primary)] bg-[var(--color-primary-selected)] rounded-[var(--radius-sm)]"
              style={{ fontVariantNumeric: 'tabular-nums', borderTop: 'var(--doc-border-emphasis) solid var(--color-primary)' }}
            >
              {fmt(total.amount)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default TotalsTable;
