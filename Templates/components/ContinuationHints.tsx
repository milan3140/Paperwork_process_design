/**
 * ContinuationHints — Shared continuation hint components for multi-page documents
 *
 * Renders dot-pattern hints at page boundaries:
 * - Bottom of non-last pages: "· · · Continued on page N > · · ·"
 * - Top of non-first pages:   "· · · < Continued from page N · · ·"
 *
 * Used by PaginatedDocument, QuoteDocument, InvoiceDocument, and any
 * other multi-page document component.
 */

import type React from 'react';

const CONT_HINT_BASE: React.CSSProperties = {
  fontSize: '9.5px',
  fontWeight: 600,
  fontStyle: 'italic',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-light)',
  /* 1.4 (not 1.0) — italic glyph descenders (g/p/y) overflow a tight line-box
     and get clipped by the container's overflow:hidden (which clips the dot
     pattern). 1.4 × 9.5 ≈ 13.3px still fits within the pagination engine's
     reserved 14px text slot, so layout metrics stay unchanged. */
  lineHeight: 1.4,
};

const DOTS = Array(60).fill('\u00b7').join(' ');

/** Optional style overrides — `color` and `fontWeight` let a consumer change
 *  the hint's accent colour or weight without forking this shared component.
 *  Both default to the CONT_HINT_BASE values (purple, 600) used across Quote,
 *  Invoice, CoC, etc. */
interface ContHintCommonProps {
  page: number;
  totalPages?: number;
  label?: string;
  fontSize?: number | string;
  color?: string;
  fontWeight?: number | string;
}

export function ContinuedOnNextPage({ page, totalPages, label, fontSize, color, fontWeight, marginTop = '42px', marginBottom = '14px' }: ContHintCommonProps & { marginTop?: string | number; marginBottom?: string | number }) {
  const defaultLabel = totalPages
    ? `Page ${page}/${totalPages} — see next page >`
    : `Page ${page} — see next page >`;
  return (
    <div style={{ ...CONT_HINT_BASE, ...(fontSize ? { fontSize } : {}), ...(color ? { color } : {}), ...(fontWeight !== undefined ? { fontWeight } : {}), marginTop, marginBottom, overflow: 'hidden', whiteSpace: 'nowrap', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ flex: 1, overflow: 'hidden', textAlign: 'right', paddingRight: '4px' }}>{DOTS}</span>
      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{label ?? defaultLabel}</span>
      <span style={{ flex: 1, overflow: 'hidden', textAlign: 'left', paddingLeft: '4px' }}>{DOTS}</span>
    </div>
  );
}

export function ContinuedFromPreviousPage({ page, totalPages, label, fontSize, color, fontWeight }: ContHintCommonProps) {
  const defaultLabel = totalPages
    ? `< Page ${page}/${totalPages} — from previous page`
    : `< Page ${page} — from previous page`;
  return (
    <div style={{ ...CONT_HINT_BASE, ...(fontSize ? { fontSize } : {}), ...(color ? { color } : {}), ...(fontWeight !== undefined ? { fontWeight } : {}), marginTop: '14px', marginBottom: '42px', overflow: 'hidden', whiteSpace: 'nowrap', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ flex: 1, overflow: 'hidden', textAlign: 'right', paddingRight: '4px' }}>{DOTS}</span>
      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{label ?? defaultLabel}</span>
      <span style={{ flex: 1, overflow: 'hidden', textAlign: 'left', paddingLeft: '4px' }}>{DOTS}</span>
    </div>
  );
}
