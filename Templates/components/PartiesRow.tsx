/**
 * PartiesRow — From / Bill To / Ship To party information layout
 *
 * Renders party details in a structured layout:
 *   - FROM row: full width (top)
 *   - BILL TO (left) + SHIP TO (right): 2-column grid (bottom)
 * If `shipTo` is omitted, billTo renders full-width.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name      | Type      | Required | Default   | Description                              |
 * |-----------|-----------|----------|-----------|------------------------------------------|
 * | from      | PartyInfo | yes      | —         | Sender information (InstaVoxel)           |
 * | billTo    | PartyInfo | yes      | —         | Billing recipient                         |
 * | shipTo    | PartyInfo | no       | —         | Shipping recipient (if different)         |
 * | fromLabel | string    | no       | "From"    | Label for sender section                  |
 *
 * PartyInfo shape:
 * | Field | Type     | Description                                       |
 * |-------|----------|---------------------------------------------------|
 * | name  | string   | Company name (rendered bold, --doc-text-party-name) |
 * | lines | string[] | Address/contact lines (each on its own line)       |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `fromLabel`: Override sender header for different document types.
 * - `shipTo`: When omitted, Bill To renders full-width without Ship To column.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   // Quote (Bill To + Ship To separate)
 *   <PartiesRow from={instavoxel} billTo={billingAddr} shipTo={shippingAddr} />
 *
 *   // Quote (same billing & shipping — omit shipTo)
 *   <PartiesRow from={instavoxel} billTo={customer} />
 *
 *   // PO
 *   <PartiesRow fromLabel="Buyer" from={buyer} billTo={supplier} />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use in Quote, Invoice, PO, RFQ, Packing Slip, and CoC — any document
 * that identifies a sender and recipient. Always placed after the title/meta area.
 */

import { SectionLabel } from './SectionLabel';

export interface PartyInfo {
  name: string;
  lines: string[];
}

interface PartiesRowProps {
  from: PartyInfo;
  billTo: PartyInfo;
  shipTo?: PartyInfo;
  fromLabel?: string;
}

export function PartiesRow({
  from,
  billTo,
  shipTo,
  fromLabel = 'From',
}: PartiesRowProps) {
  return (
    <div data-comp="PartiesRow" className="flex flex-col gap-[var(--sp-4)]">
      {/* ── FROM (full width, top) ── */}
      <PartyBlock label={fromLabel} party={from} side="from" />

      {/* ── BILL TO + SHIP TO (bottom row) ── */}
      {shipTo ? (
        <div className="grid grid-cols-2 gap-[var(--sp-6)]">
          <PartyBlock label="Bill To" party={billTo} side="billTo" />
          <PartyBlock label="Ship To" party={shipTo} side="shipTo" />
        </div>
      ) : (
        <PartyBlock label="Bill To / Ship To" party={billTo} side="billTo" />
      )}
    </div>
  );
}

function PartyBlock({ label, party, side }: { label: string; party: PartyInfo; side: string }) {
  return (
    <div data-el={`PartiesRow-${side}`} className="flex flex-col gap-[var(--doc-sp-1-5)]">
      <SectionLabel>{label}</SectionLabel>
      <div data-el={`PartiesRow-${side}-name`} className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)]">
        {party.name}
      </div>
      <div data-el={`PartiesRow-${side}-detail`} className="text-[length:var(--doc-text-body)] font-normal text-[color:var(--gray-600)] leading-[1.5]">
        {party.lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < party.lines.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

export default PartiesRow;
