/**
 * PaginatedDocument — Renders paginated PDF preview with per-page Header + Footer
 *
 * Uses pure computation from pagination.ts (tested independently).
 * DOM measurement → computePageLayouts() → render with fixed spacer heights.
 */

import { useState, useLayoutEffect, useRef, type ReactNode } from 'react';
import { DocumentHeader } from '../../../components/DocumentHeader';
import { DocumentFooter } from '../../../components/DocumentFooter';
import { computePageLayouts, type PageLayout, type SectionMeta } from './pagination';

export interface PageSection {
  key: string;
  content: ReactNode;
  group?: string;
}

interface PaginatedDocumentProps {
  sections: PageSection[];
  docId: string;
  validDays: number;
  gap?: number;
  maxGapFactor?: number;
}

/* ── Continuation hint styles ──────────────────────────────────────────────
 * Used at the bottom of non-last pages and top of non-first pages.
 * Small, uppercase, gray — non-intrusive but clearly legible. */
const CONT_HINT_BASE: React.CSSProperties = {
  fontSize: '7.5px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--gray-300)',
  lineHeight: 1,
};

function ContinuedOnNextPage() {
  return (
    <div
      style={{
        ...CONT_HINT_BASE,
        borderTop: '1px solid var(--gray-100)',
        paddingTop: '6px',
        textAlign: 'right',
        marginTop: '8px',
      }}
    >
      Continued on next page ›
    </div>
  );
}

function ContinuedFromPreviousPage() {
  return (
    <div
      style={{
        ...CONT_HINT_BASE,
        borderBottom: '1px solid var(--gray-100)',
        paddingBottom: '6px',
        marginBottom: '8px',
      }}
    >
      ‹ Continued from previous page
    </div>
  );
}

export function PaginatedDocument({
  sections,
  docId,
  gap = 24,
  maxGapFactor = 2,
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

    const result = computePageLayouts(metas, maxGap);

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
      {/* Hidden measuring container */}
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: 'absolute',
          left: '-9999px',
          width: 'var(--doc-page-w, 215.9mm)',
          padding: '0 var(--doc-margin-x, 16mm)',
          visibility: 'hidden',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {sections.map(s => (
          <div key={s.key}>{s.content}</div>
        ))}
      </div>

      {/* Paginated output — always renders (uses default layout initially) */}
      {pages.map((page, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast  = pageIdx === pages.length - 1;

        return (
          <div
            key={pageIdx}
            className="doc-page"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              marginBottom: !isLast ? '32px' : 0,
            }}
          >
            <DocumentHeader docType="Quote Option Proposal" />

            <div className="doc-content" style={{ gap: 0 }}>
              {/* "Continued from previous page" — top of pages 2+ */}
              {isMultiPage && !isFirst && <ContinuedFromPreviousPage />}

              {page.indices.map((sectionIdx, si) => {
                const section = sections[sectionIdx];
                if (!section) return null;
                return (
                  <div key={section.key}>
                    {si > 0 && (
                      <div style={{ height: `${page.spacerHeights[si - 1] ?? gap}px` }} />
                    )}
                    {section.content}
                  </div>
                );
              })}

              {/* "Continued on next page" — bottom of all pages except last */}
              {isMultiPage && !isLast && <ContinuedOnNextPage />}
            </div>

            <DocumentFooter
              docId={docId}
              page={pageIdx + 1}
              totalPages={pages.length}
              closing="We look forward to working with you."
            />
          </div>
        );
      })}
    </>
  );
}

export default PaginatedDocument;
