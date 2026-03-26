/**
 * quoteEvalHelpers — Shared types, formatters, and components
 * for QuoteEvaluationTable (factory-first) and QuoteEvaluationTableV2 (part-first).
 *
 * ⚠️ REQUIRES: tableStyles.ts
 */

import {
  TEXT_DECLINED, TEXT_MUTED, TEXT_DAYS,
} from './tableStyles';

/* ── Types ── */

export interface PriceCell {
  price: number | null;
  days: number | null;
  text?: string;
}

export interface FactoryQuote {
  name: string;
  parts: { label: string; cells: PriceCell[] }[];
}

export interface DhlCustomsRow {
  values?: (number | null)[];
  materialValues?: { material: string; values: (number | null)[] }[];
}

export interface QuoteEvalData {
  scenarios: { header: string; recommended?: boolean }[];
  /** Per-part AI benchmarks, or legacy flat array (treated as total) */
  aiBenchmarks: (number | null)[] | { label: string; cells: (number | null)[] }[];
  factories: FactoryQuote[];
  dhl?: DhlCustomsRow;
  customs?: DhlCustomsRow;
  marginPercent: number;
  weights: { values?: string[]; materialValues?: { material: string; values: string[] }[] };
  /** If set, shows "預計更新" on the pricing summary */
  nextUpdateDate?: string;
}

/* ── Formatters ── */

/** Format unit price: $42.00 */
export function fmtP(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format total price: $10,921 */
export function fmtT(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ── Shared Components ── */

export function PriceWithDays({ cell }: { cell: PriceCell }) {
  if (cell.text) return <span className={TEXT_DECLINED}>{cell.text}</span>;
  if (cell.price == null) return <span className={TEXT_MUTED}>—</span>;
  return (
    <span>
      <span className="font-semibold">{fmtP(cell.price)}</span>
      {cell.days != null && <span className={TEXT_DAYS}>/{cell.days}d</span>}
    </span>
  );
}

export function SubtotalCell({ price, days }: { price: number | null; days: number | null }) {
  if (price == null) return <span className={TEXT_MUTED}>—</span>;
  return (
    <span>
      <span className="font-semibold">{fmtP(price)}</span>
      {days != null && <span className={TEXT_DAYS}>/{days}d</span>}
    </span>
  );
}

/* ── Computation ── */

/** Sum factory part prices + DHL + customs for a given scenario index */
export function computeFactorySubtotal(
  factory: FactoryQuote,
  si: number,
  dhl?: DhlCustomsRow,
  customs?: DhlCustomsRow,
) {
  let total = 0, maxDays = 0, valid = false;
  for (const part of factory.parts) {
    const c = part.cells[si];
    if (c?.price != null) {
      total += c.price;
      if (c.days != null && c.days > maxDays) maxDays = c.days;
      valid = true;
    }
  }
  if (dhl?.values?.[si] != null) total += dhl.values[si]!;
  if (customs?.values?.[si] != null) total += customs.values[si]!;
  return valid
    ? { price: total, days: maxDays }
    : { price: null as number | null, days: null as number | null };
}

/** Check if every cell in a factory is null/declined */
export function isFactoryAllDeclined(factory: FactoryQuote) {
  return factory.parts.every(p => p.cells.every(c => c.price == null));
}

/** Parse quantity from scenario header string, e.g. "200 pcs" → 200 */
export function parseQty(header: string): number {
  const m = header.match(/(\d+)/);
  return m ? parseInt(m[1]) : 1;
}
