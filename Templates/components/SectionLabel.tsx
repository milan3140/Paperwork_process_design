/**
 * SectionLabel — Uppercase label with bottom divider line
 *
 * The foundational label pattern used throughout all documents.
 * This is the print equivalent of the web design system's
 * "two-level label system" (Section Title variant with underline).
 *
 * Anatomy: 9px / semibold / UPPERCASE / gray-400 / tracking 0.05em / 1px gray-150 bottom border
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name      | Type      | Required | Default | Description                         |
 * |-----------|-----------|----------|---------|-------------------------------------|
 * | children  | ReactNode | yes      | —       | Label text content                  |
 * | className | string    | no       | ''      | Additional CSS classes on the label  |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `className`: Add custom spacing, remove border, adjust width, etc.
 *   Example: `<SectionLabel className="border-none">` removes the underline.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <SectionLabel>From</SectionLabel>
 *   <SectionLabel>Quoted Lead Time</SectionLabel>
 *   <SectionLabel>Line Items</SectionLabel>
 *   <SectionLabel>Quoted Parts (3 items)</SectionLabel>
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use above every content section in a document. Every block of information
 * (From, To, Key Info, Parts, Notes, T&C, Signature) starts with a SectionLabel.
 * This is the most reused component across all document types.
 */

import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <div
      data-comp="SectionLabel"
      className={[
        'text-[length:var(--doc-text-label)] font-semibold text-[color:var(--gray-400)]',
        'uppercase tracking-[var(--doc-tracking-label)]',
        'pb-[var(--sp-1)] border-b border-[var(--gray-150)]',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export default SectionLabel;
