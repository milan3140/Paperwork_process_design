/**
 * DocumentFooter — Bottom bar for all printed documents
 *
 * Renders a 1px brand-color top border, then a row containing: document ID,
 * brand URL, contact email, optional closing message, and page number.
 * Appears at the bottom of every document page.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name       | Type   | Required | Default                | Description                                                  |
 * |------------|--------|----------|------------------------|--------------------------------------------------------------|
 * | docId      | string | yes      | —                      | Document identifier displayed first (e.g. "U260319042")     |
 * | page       | number | yes      | —                      | Current page number                                          |
 * | totalPages | number | yes      | —                      | Total page count                                             |
 * | email      | string | no       | "sales@instavoxel.com" | Contact email displayed in footer                            |
 * | closing    | string | no       | undefined              | Optional closing line (e.g. "We look forward to working...") |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `email`: Override the default sales email for different document types
 * - `closing`: Add a polite closing line; omit for formal documents (CoC, PO)
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   // Basic (Quote, Invoice)
 *   <DocumentFooter docId="U260319042" page={1} totalPages={1} closing="We look forward to working with you." />
 *
 *   // Without closing (CoC, PO — more formal)
 *   <DocumentFooter docId="U260319042" page={1} totalPages={2} />
 *
 *   // Custom email
 *   <DocumentFooter docId="T260319042" page={1} totalPages={1} email="info@instavoxel.com" />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use as the last child inside every document page (`doc-page`).
 * Mandatory for all documents — provides ISO 7.5 traceability (doc ID + page number).
 */

interface DocumentFooterProps {
  docId: string;
  page: number;
  totalPages: number;
  email?: string;
  closing?: string;
}

export function DocumentFooter({
  docId,
  page,
  totalPages,
  email = 'sales@instavoxel.com',
  closing,
}: DocumentFooterProps) {
  return (
    <div
      data-comp="DocumentFooter"
      className="flex items-center justify-between shrink-0 border-t border-[var(--color-primary)]"
      style={{ padding: 'var(--sp-2) var(--doc-margin-x)' }}
    >
      <div data-el="DocumentFooter-left" className="flex items-center gap-[var(--sp-4)] text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)]">
        <span data-el="DocumentFooter-docId">{docId}</span>
        <span>|</span>
        <span data-el="DocumentFooter-brand" className="text-[color:var(--color-primary-light)] font-semibold">www.instavoxel.com</span>
        <span>|</span>
        <span data-el="DocumentFooter-email">{email}</span>
        {closing && (
          <>
            <span>|</span>
            <span data-el="DocumentFooter-closing">{closing}</span>
          </>
        )}
      </div>
      <div data-el="DocumentFooter-page" className="text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)]">
        Page {page} of {totalPages}
      </div>
    </div>
  );
}

export default DocumentFooter;
