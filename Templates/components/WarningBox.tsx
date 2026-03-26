/**
 * WarningBox — Semantic warning callout with left accent border
 *
 * Renders a yellow-tinted callout box with a warning triangle icon
 * and text content. Used for exclusions, assumptions, and important
 * caveats that the reader must not overlook.
 *
 * Corresponds to the web InfoBox component with warning variant.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, Icons_Print.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name     | Type      | Required | Default | Description                                         |
 * |----------|-----------|----------|---------|-----------------------------------------------------|
 * | children | ReactNode | yes      | —       | Warning text. Use <strong> for bold prefix.          |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `children`: Full control over warning text content.
 *   Use `<strong>Exclusions:</strong>` for bold label prefix.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <WarningBox>
 *     <strong>Exclusions:</strong> This quote does not include special packaging...
 *   </WarningBox>
 *
 *   <WarningBox>
 *     <strong>Note:</strong> Customer-supplied material is not included in pricing.
 *   </WarningBox>
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use for exclusions (Quote), flow-down requirements (PO), or any critical
 * caveat the reader must acknowledge. Do NOT use for general notes — use
 * NotesList instead. Reserve WarningBox for high-importance alerts.
 */

import React from 'react';
import { PRINT_ICONS } from './Icons_Print';

interface WarningBoxProps {
  children: React.ReactNode;
}

export function WarningBox({ children }: WarningBoxProps) {
  return (
    <div
      data-comp="WarningBox"
      className="flex gap-[var(--sp-2)] py-[var(--sp-2)] px-[var(--sp-3)] bg-[var(--color-warning-bg)] rounded-r-[var(--radius-sm)] text-[length:var(--doc-text-secondary)] text-[color:var(--color-warning-text)] leading-[1.5] [&_strong]:font-semibold"
      style={{ borderLeft: 'var(--doc-border-accent) solid var(--color-warning)' }}
    >
      <span data-el="WarningBox-icon" className="shrink-0 mt-[var(--doc-micro-adjust)] text-[color:var(--color-warning)]">
        {PRINT_ICONS.alertTriangle(14)}
      </span>
      <div data-el="WarningBox-content">{children}</div>
    </div>
  );
}

export default WarningBox;
