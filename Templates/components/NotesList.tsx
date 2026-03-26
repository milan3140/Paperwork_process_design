/**
 * NotesList — Bullet-point notes list with section label
 *
 * Renders a labeled list of text items with small gray dot bullets.
 * Used for Manufacturing Notes, assumptions, and general remarks.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name  | Type     | Required | Default | Description                            |
 * |-------|----------|----------|---------|----------------------------------------|
 * | label | string   | yes      | —       | Section label text (e.g. "Manufacturing Notes") |
 * | items | string[] | yes      | —       | Array of note strings                  |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `label`: Set any section heading text.
 * - `items`: Each string renders as one bullet-point line.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <NotesList label="Manufacturing Notes" items={[
 *     'Quoted based on submitted 3D models and selected parameters.',
 *     'General tolerance applies to unspecified dimensions only.',
 *   ]} />
 *
 *   <NotesList label="Special Instructions" items={['Handle with care.']} />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use in Quote (Manufacturing Notes), PO (Notes to Supplier), and any
 * document needing a list of text remarks.
 */

import { SectionLabel } from './SectionLabel';

interface NotesListProps {
  label: string;
  items: string[];
}

export function NotesList({ label, items }: NotesListProps) {
  return (
    <div data-comp="NotesList" className="flex flex-col gap-[var(--doc-sp-1-5)]">
      <SectionLabel>{label}</SectionLabel>
      {items.map((item, i) => (
        <div
          key={i}
          data-el="NotesList-item"
          className="flex items-start gap-[var(--doc-sp-1-5)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.5]"
        >
          <span
            className="rounded-full bg-[var(--gray-300)] mt-[var(--doc-sp-bullet-offset)] shrink-0"
            style={{ width: 'var(--doc-size-bullet)', height: 'var(--doc-size-bullet)', minWidth: 'var(--doc-size-bullet)' }}
          />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default NotesList;
