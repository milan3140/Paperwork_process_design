/**
 * TermsSection — Fine-print terms & conditions
 *
 * Renders T&C text in the smallest allowed font (--doc-text-fine, 7.5px)
 * with gray-400 color. Includes an optional link to full terms.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name     | Type   | Required | Default                      | Description                         |
 * |----------|--------|----------|------------------------------|-------------------------------------|
 * | text     | string | yes      | —                            | Full T&C text (numbered items)      |
 * | linkUrl  | string | no       | undefined                    | URL to full terms page              |
 * | linkText | string | no       | "www.instavoxel.com/terms"   | Display text for the link           |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `text`: Full T&C content. Can include numbered items as a single string.
 * - `linkUrl` / `linkText`: Append a clickable link to full terms.
 *   Omit `linkUrl` to hide the link entirely.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <TermsSection text="1. Valid for 30 days..." linkUrl="https://www.instavoxel.com/terms" />
 *   <TermsSection text="Payment due upon receipt." />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use at the bottom of Quote and Invoice documents, before the footer.
 * T&C is legally important but visually low-priority — hence the smallest font.
 */

import { SectionLabel } from './SectionLabel';

interface TermsSectionProps {
  text: string;
  linkUrl?: string;
  linkText?: string;
}

export function TermsSection({ text, linkUrl, linkText = 'www.instavoxel.com/terms' }: TermsSectionProps) {
  return (
    <div data-comp="TermsSection" className="flex flex-col gap-[var(--sp-1)]">
      <SectionLabel>Terms & Conditions</SectionLabel>
      <div data-el="TermsSection-text" className="text-[length:var(--doc-text-fine)] text-[color:var(--gray-400)] leading-[1.5]">
        {text}
        {linkUrl && (
          <>
            {' '}
            <a data-el="TermsSection-link" href={linkUrl} className="text-[color:var(--color-primary-light)] no-underline">
              {linkText}
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default TermsSection;
