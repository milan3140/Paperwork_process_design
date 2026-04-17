/**
 * PaginatedDocument — Renders paginated PDF preview with per-page Header + Footer
 *
 * Shared component used by all document pages. Accepts sections as ReactNode
 * content, measures their heights via DOM, and distributes them across A4 pages
 * using pure computation from pagination.ts.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name                   | Type          | Required | Default                              |
 * |------------------------|---------------|----------|--------------------------------------|
 * | sections               | PageSection[] | yes      | —                                    |
 * | docType                | string        | yes      | —                                    |
 * | docId                  | string        | yes      | —                                    |
 * | gap                    | number        | no       | 24                                   |
 * | maxGapFactor           | number        | no       | 2                                    |
 * | closing                | string        | no       | undefined                            |
 * | showContinuationHints  | boolean       | no       | true                                 |
 *
 * ─── Usage ─────────────────────────────────────────────────────────────────
 *
 *   const sections: PageSection[] = [
 *     { key: 'title', content: <Title /> },
 *     { key: 'parties', content: <PartiesRow /> },
 *     { key: 'items', content: <PartBlock />, group: 'items' },
 *   ];
 *   <PaginatedDocument
 *     sections={sections}
 *     docType="Invoice"
 *     docId="INV-2026-0047"
 *     closing="We look forward to working with you."
 *   />
 */

import { useState, useLayoutEffect, useRef, type ReactNode } from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';
import { ContinuedOnNextPage, ContinuedFromPreviousPage } from './ContinuationHints';
import { computePageLayouts, type PageLayout, type SectionMeta } from './pagination';

export interface PageSection {
  key: string;
  content: ReactNode;
  group?: string;
}

export interface PaginatedDocumentProps {
  sections: PageSection[];
  docType: string;
  docId: string;
  gap?: number;
  maxGapFactor?: number;
  closing?: string;
  showContinuationHints?: boolean;
  /** Optional text label to replace the SVG logo in the header */
  logoLabel?: string;
  /**
   * When true, pagination bin-packing uses the actual render `gap` value
   * (instead of MIN_GAP=12) for section spacing estimation. This can rescue
   * borderline-overflowing documents by ~9px × N gaps. If the new result is
   * single-page, continuation hints are auto-suppressed.
   */
  tightPagination?: boolean;
  /**
   * Minimum adaptive-spacer height (overrides the default MIN_GAP=12 floor).
   * Useful when the caller wants tighter section spacing than the global default.
   */
  minGap?: number;
  /**
   * Inline style applied directly to each `.doc-page` element.
   * Use this for palette/font overrides (CSS custom properties like
   * `--color-primary`) so they survive PDF export regardless of the
   * wrapping container structure. Preferred over wrapping the whole
   * component in a styled parent — wrappers are stripped by pdf-server.
   */
  pageStyle?: React.CSSProperties;
  /**
   * Override the header band background color. Passed through to
   * DocumentHeader's `headerBg` prop. Use this for explicit per-variant
   * header coloring (e.g. neutral black, mid-gray, brand purple).
   */
  headerBg?: string;
  /**
   * Force a single-page layout regardless of pagination engine output.
   * When true: all sections render on one page and continuation hints are
   * suppressed. Intended for cases where content marginally overflows
   * (by less than ~CONT_HINT_BOTTOM_H = 28px) and the hint itself is the
   * only thing forcing a page break.
   *
   * Use sparingly — if content genuinely doesn't fit, `.doc-page`'s
   * `overflow: hidden` will clip the bottom in PDF output.
   */
  forceSinglePage?: boolean;
  /**
   * Suppress the brand DocumentHeader band entirely. doc-content is rendered
   * directly under the page edge with optional `headerOffset` whitespace.
   * Use for minimal/headerless layouts (e.g. v9: title moved into content).
   */
  noHeader?: boolean;
  /** Suppress the DocumentFooter bar (docId, URL, page number). */
  noFooter?: boolean;
  /**
   * Top whitespace (px) above doc-content when `noHeader` is true.
   * Acts as a controlled gap between page edge and the first content element.
   */
  headerOffset?: number;
  /**
   * Per-page header renderer. When provided, called once per page with the
   * current page number and total count; the result is placed at the very
   * top of doc-content (above any sections). Use to render a title that
   * needs to show "Page N of M" or otherwise vary across pages.
   */
  renderPageHeader?: (pageNum: number, totalPages: number) => React.ReactNode;
  /**
   * Per-section upper bound for the spacer rendered BEFORE that section,
   * keyed by `section.key`. The pagination engine still computes its usual
   * distribution spacer; at render time the height is `Math.min(engine, cap)`.
   * Use to tighten specific section breaks (e.g. `{ signature: 16 }` so the
   * signature block doesn't drift far down on single-page layouts) without
   * shrinking every other spacer on the page.
   */
  sectionSpacerCaps?: Record<string, number>;
}

export function PaginatedDocument({
  sections,
  docType,
  docId,
  gap = 24,
  maxGapFactor = 2,
  closing,
  showContinuationHints = true,
  logoLabel,
  tightPagination = false,
  minGap,
  pageStyle,
  headerBg,
  forceSinglePage = false,
  noHeader = false,
  noFooter = true,
  headerOffset,
  renderPageHeader,
  sectionSpacerCaps,
}: PaginatedDocumentProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const maxGap = gap * maxGapFactor;

  // Initial layout: all sections on one page with default gap
  const defaultLayout: PageLayout[] = [{
    indices: sections.map((_, i) => i),
    spacerHeights: sections.slice(1).map(() => gap),
  }];

  const [pages, setPages] = useState<PageLayout[]>(defaultLayout);

  useLayoutEffect(() => {
    if (!measureRef.current || sections.length === 0) return;
    const children = measureRef.current.children;

    const metas: SectionMeta[] = [];
    for (let i = 0; i < children.length; i++) {
      metas.push({
        height: (children[i] as HTMLElement).offsetHeight,
        group: sections[i]?.group,
      });
    }

    const packingGap = tightPagination ? Math.max(0, gap) : undefined;
    let result = computePageLayouts(metas, maxGap, packingGap, minGap);

    // Auto-collapse: if pagination split into 2+ pages but the total content
    // actually fits AVAILABLE_H with minGap spacers, force single-page.
    // This covers the case where hint reserve (CONT_HINT_BOTTOM_H ≈ 28px) is
    // the sole cause of the split — browser preview renders fine but PDF output
    // (where hint reserve is deducted) marginally pushes a small tail section
    // onto page 2. We prefer single-page with content intact over showing
    // hints + orphaned tail on page 2.
    if (result.length > 1) {
      const AVAILABLE_H = 1003; // matches pagination.ts constant
      const effectiveMinGap = minGap ?? 12;
      const totalContentH = metas.reduce((s, m) => s + m.height, 0)
        + Math.max(0, metas.length - 1) * effectiveMinGap;
      if (totalContentH <= AVAILABLE_H) {
        result = [{
          indices: sections.map((_, i) => i),
          spacerHeights: sections.slice(1).map(() => gap),
        }];
      }
    }

    // Manual single-page override: collapse whatever the engine returned into
    // a single page. Continuation hints are auto-suppressed since pages.length=1.
    if (forceSinglePage && result.length > 1) {
      result = [{
        indices: sections.map((_, i) => i),
        spacerHeights: sections.slice(1).map(() => gap),
      }];
    }

    // Only update if changed (prevent infinite re-render)
    setPages(prev => {
      if (prev.length !== result.length) return result;
      const same = prev.every((p, i) =>
        p.indices.length === result[i].indices.length &&
        p.indices.every((v, j) => v === result[i].indices[j]) &&
        p.spacerHeights.length === result[i].spacerHeights.length &&
        p.spacerHeights.every((v, j) => v === result[i].spacerHeights[j])
      );
      return same ? prev : result;
    });
  }); // runs every render

  const isMultiPage = pages.length > 1;

  return (
    <>
      {/* Hidden measuring container.
       *
       * Sandbox MUST replicate the actual render's DOM/CSS context exactly
       * so `offsetHeight` matches what each section will occupy in the real
       * page. Previously a bare <div> was used, which missed the inheritance
       * from `.doc-page` (font, font-variant-numeric: tabular-nums, flex) and
       * `.doc-content` (gap, padding) — causing sandbox measurements to diverge
       * from real render, esp. when font-family is overridden via pageStyle.
       *
       * Structure mirrors the real page: outer .doc-page wrapper (positioned
       * off-screen) → inner .doc-content → section refs. pageStyle applies to
       * .doc-page as in the real render. */}
      <div
        aria-hidden
        data-sandbox
        className="doc-page"
        style={{
          ...pageStyle,
          position: 'absolute',
          left: '-9999px',
          visibility: 'hidden',
        }}
      >
        <div ref={measureRef} className="doc-content" style={{ gap: 0 }}>
          {sections.map(s => (
            <div key={s.key}>{s.content}</div>
          ))}
        </div>
      </div>

      {/* Paginated output */}
      {pages.map((page, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast  = pageIdx === pages.length - 1;
        const pageNum = pageIdx + 1;

        return (
          <div
            key={pageIdx}
            className="doc-page"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              marginBottom: !isLast ? '32px' : 0,
              /* pageStyle spreads AFTER defaults so callers (palette overrides,
               * font-family swaps) take precedence. Applying palette here keeps
               * CSS custom properties on .doc-page itself — they survive PDF
               * export even when the outer wrapper is stripped. */
              ...pageStyle,
            }}
          >
            {!noHeader && (
              <DocumentHeader docType={docType} logoLabel={logoLabel} headerBg={headerBg} />
            )}

            <div
              className="doc-content"
              style={{
                gap: 0,
                /* When DocumentHeader is suppressed, optional whitespace pads
                 * between the page top edge and the first content element. */
                ...(noHeader && headerOffset !== undefined ? { paddingTop: headerOffset } : {}),
              }}
            >
              {/* Per-page header — placed above sections so it shows on every
               * page with current pageNum/totalPages baked in. */}
              {renderPageHeader && renderPageHeader(pageNum, pages.length)}

              {/* "Continued from previous page" — top of pages 2+ */}
              {showContinuationHints && isMultiPage && !isFirst && (
                <ContinuedFromPreviousPage page={pageNum} totalPages={pages.length} />
              )}

              {page.indices.map((sectionIdx, si) => {
                const section = sections[sectionIdx];
                if (!section) return null;
                const engineSpacer = page.spacerHeights[si - 1] ?? gap;
                const cap = sectionSpacerCaps?.[section.key];
                const spacerH = cap !== undefined ? Math.min(engineSpacer, cap) : engineSpacer;
                return (
                  <div key={section.key}>
                    {si > 0 && (
                      <div style={{ height: `${spacerH}px` }} />
                    )}
                    {section.content}
                  </div>
                );
              })}

              {/* "Continued on next page" — bottom of all pages except last */}
              {showContinuationHints && isMultiPage && !isLast && (
                <ContinuedOnNextPage page={pageNum} totalPages={pages.length} />
              )}
            </div>

            {!noFooter && (
              <DocumentFooter
                docId={docId}
                page={pageNum}
                totalPages={pages.length}
                closing={closing}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export default PaginatedDocument;
