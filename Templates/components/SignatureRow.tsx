/**
 * SignatureRow — Dual-column signature blocks
 *
 * Renders two side-by-side signature areas, each with a SectionLabel,
 * signature line, name/title sub-label, date line, and date sub-label.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name       | Type   | Required | Default | Description                                         |
 * |------------|--------|----------|---------|-----------------------------------------------------|
 * | leftLabel  | string | yes      | —       | Left block label (e.g. "Authorized By (InstaVoxel)")|
 * | rightLabel | string | yes      | —       | Right block label (e.g. "Accepted By (Customer)")   |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `leftLabel` / `rightLabel`: Override for different document types.
 *   Quote: "Authorized By" / "Accepted By"
 *   PO: "Buyer" / "Supplier Acknowledgment"
 *   CoC: "Quality Representative" / (omit right? use single-column variant)
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <SignatureRow leftLabel="Authorized By (InstaVoxel)" rightLabel="Accepted By (Customer)" />
 *   <SignatureRow leftLabel="Buyer" rightLabel="Supplier Acknowledgment" />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use in Quote, PO, CoC, GRN, and Traveller — any document requiring
 * authorization or acceptance signatures from one or both parties.
 */

import { SectionLabel } from './SectionLabel';

interface SignatureRowProps {
  leftLabel: string;
  rightLabel: string;
  /** Override "Name / Title" sub-label (e.g., "姓名 / 職稱" for Chinese PO) */
  nameSubLabel?: string;
  /** Override "Date" sub-label (e.g., "日期" for Chinese PO) */
  dateSubLabel?: string;
}

export function SignatureRow({ leftLabel, rightLabel, nameSubLabel = 'Name / Title', dateSubLabel = 'Date' }: SignatureRowProps) {
  return (
    <div data-comp="SignatureRow" className="grid grid-cols-2 gap-[var(--sp-6)] mt-[var(--sp-1)]">
      <SignatureBlock label={leftLabel} side="left" nameSubLabel={nameSubLabel} dateSubLabel={dateSubLabel} />
      <SignatureBlock label={rightLabel} side="right" nameSubLabel={nameSubLabel} dateSubLabel={dateSubLabel} />
    </div>
  );
}

function SignatureBlock({ label, side, nameSubLabel, dateSubLabel }: { label: string; side: string; nameSubLabel: string; dateSubLabel: string }) {
  return (
    <div data-el={`SignatureRow-${side}`} className="flex flex-col gap-[var(--sp-6)]">
      <SectionLabel>{label}</SectionLabel>
      {/* Signature line */}
      <div data-el={`SignatureRow-${side}-sig`} className="border-b border-[var(--gray-200)] pb-[var(--sp-1)] flex flex-col justify-end" style={{ minHeight: 'var(--h-sm)' }} />
      <div className="text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)] -mt-[var(--sp-5)]">
        {nameSubLabel}
      </div>
      {/* Date line */}
      <div data-el={`SignatureRow-${side}-date`} className="border-b border-[var(--gray-200)] pb-[var(--sp-1)] flex flex-col justify-end" style={{ minHeight: 'var(--h-sm)', maxWidth: 'var(--doc-w-date-line)' }} />
      <div className="text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)] -mt-[var(--sp-5)]">
        {dateSubLabel}
      </div>
    </div>
  );
}

export default SignatureRow;
