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
}

export function SignatureRow({ leftLabel, rightLabel }: SignatureRowProps) {
  return (
    <div data-comp="SignatureRow" className="grid grid-cols-2 gap-[var(--sp-6)] mt-[var(--sp-1)]">
      <SignatureBlock label={leftLabel} side="left" />
      <SignatureBlock label={rightLabel} side="right" />
    </div>
  );
}

function SignatureBlock({ label, side }: { label: string; side: string }) {
  return (
    <div data-el={`SignatureRow-${side}`} className="flex flex-col gap-[var(--sp-6)]">
      <SectionLabel>{label}</SectionLabel>
      {/* Signature line */}
      <div data-el={`SignatureRow-${side}-sig`} className="border-b border-[var(--gray-200)] pb-[var(--sp-1)] flex flex-col justify-end" style={{ minHeight: 'var(--h-sm)' }} />
      <div className="text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)] -mt-[var(--sp-5)]">
        Name / Title
      </div>
      {/* Date line */}
      <div data-el={`SignatureRow-${side}-date`} className="border-b border-[var(--gray-200)] pb-[var(--sp-1)] flex flex-col justify-end" style={{ minHeight: 'var(--h-sm)', maxWidth: 'var(--doc-w-date-line)' }} />
      <div className="text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)] -mt-[var(--sp-5)]">
        Date
      </div>
    </div>
  );
}

export default SignatureRow;
