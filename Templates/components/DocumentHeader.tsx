/**
 * DocumentHeader — Brand header band for all printed documents
 *
 * Renders the full-width #2E0D77 purple band with white InstaVoxel logo (left)
 * and document type label (right). This is the print equivalent of the web
 * AppHeader and must appear at the top of every document page.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, Icons_Print.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name    | Type   | Required | Default | Description                                                     |
 * |---------|--------|----------|---------|-----------------------------------------------------------------|
 * | docType | string | yes      | —       | Document type label on the right (e.g. "Quotation", "Invoice")  |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `docType`: Controls the right-side label text. Should be the document's
 *   formal name in English, uppercase is applied via CSS.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <DocumentHeader docType="Quotation" />
 *   <DocumentHeader docType="Invoice" />
 *   <DocumentHeader docType="Purchase Order" />
 *   <DocumentHeader docType="Certificate of Compliance" />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use as the first child inside every document page (`doc-page`).
 * This component is mandatory for all InstaVoxel documents — it provides
 * brand recognition and document type identification at a glance.
 */

import { PRINT_ICONS } from './Icons_Print';

interface DocumentHeaderProps {
  docType: string;
  /** Optional text label to replace the SVG logo (e.g. Chinese company name for factory docs) */
  logoLabel?: string;
  /**
   * Override the header band background color. Accepts any CSS color value.
   * Defaults to `var(--color-primary)`. Use this for per-document-variant
   * header coloring (e.g. neutral black, mid-gray, brand purple) without
   * injecting scoped CSS or overriding the whole palette.
   */
  headerBg?: string;
}

export function DocumentHeader({ docType, logoLabel, headerBg }: DocumentHeaderProps) {
  return (
    <div
      data-comp="DocumentHeader"
      className="flex items-center justify-between shrink-0"
      style={{
        height: 'var(--doc-header-h)',
        padding: '0 var(--doc-margin-x)',
        background: headerBg ?? 'var(--color-primary)',
      }}
    >
      <div data-el="DocumentHeader-logo" className="flex items-center">
        {logoLabel ? (
          <span className="text-white font-bold" style={{ fontSize: 23 }}>{logoLabel}</span>
        ) : (
          PRINT_ICONS.logoText(28)
        )}
      </div>
      <span
        data-el="DocumentHeader-docType"
        className="text-white font-semibold tracking-[var(--doc-tracking-doc-type)] uppercase" /* was text-white/85, changed to full opacity for print compatibility */
        style={{ fontSize: 14 }}
      >
        {docType}
      </span>
    </div>
  );
}

export default DocumentHeader;
