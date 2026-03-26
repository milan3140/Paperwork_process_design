/**
 * PaginatedDocument — Measures sections and splits into pages
 *
 * Two-pass render:
 *   1. Hidden container: render all sections, measure heights
 *   2. Visible: render pages, each with Header + Footer
 *
 * Sections are never split — each section stays on one page.
 * FlexSpacer between sections on each page distributes leftover space.
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { DocumentHeader } from '../../../components/DocumentHeader';
import { DocumentFooter } from '../../../components/DocumentFooter';

export interface PageSection {
  key: string;
  content: ReactNode;
}

interface PaginatedDocumentProps {
  sections: PageSection[];
  docId: string;
  validDays: number;
  /** Gap between sections on each page */
  gap?: number;
  /** Max gap growth factor (e.g., 1.5 = 150% of base gap) */
  maxGapFactor?: number;
}

// A4/Letter page constants (matching documents.css)
const PAGE_HEIGHT_PX = 1056; // 279.4mm at 96dpi
const HEADER_H = 44;
const FOOTER_H = 40;
const PAD_TOP = 20;
const PAD_BOTTOM = 16;
const AVAILABLE_H = PAGE_HEIGHT_PX - HEADER_H - FOOTER_H - PAD_TOP - PAD_BOTTOM;

export function PaginatedDocument({
  sections,
  docId,
  validDays,
  gap = 24,
  maxGapFactor = 1.5,
}: PaginatedDocumentProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageSection[][]>([]);
  const [measured, setMeasured] = useState(false);

  // Pass 1 → measure, then assign to pages
  useEffect(() => {
    if (!measureRef.current) return;
    const container = measureRef.current;
    const children = container.children;

    // Measure each section's height
    const heights: number[] = [];
    for (let i = 0; i < children.length; i++) {
      heights.push((children[i] as HTMLElement).offsetHeight);
    }

    // Greedy bin-packing: assign sections to pages
    const result: PageSection[][] = [];
    let currentPage: PageSection[] = [];
    let currentHeight = 0;

    for (let i = 0; i < sections.length; i++) {
      const sectionH = heights[i] || 0;
      const gapH = currentPage.length > 0 ? gap : 0;

      if (currentHeight + gapH + sectionH > AVAILABLE_H && currentPage.length > 0) {
        // Start new page
        result.push(currentPage);
        currentPage = [sections[i]];
        currentHeight = sectionH;
      } else {
        currentPage.push(sections[i]);
        currentHeight += gapH + sectionH;
      }
    }
    if (currentPage.length > 0) {
      result.push(currentPage);
    }

    setPages(result);
    setMeasured(true);
  }, [sections, gap]);

  const maxGap = gap * maxGapFactor;
  const FlexSpacer = () => (
    <div style={{ flex: `1 0 ${gap}px`, maxHeight: `${maxGap}px` }} />
  );

  return (
    <>
      {/* Hidden measuring container — same width as doc-page, invisible */}
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

      {/* Paginated output */}
      {measured && pages.map((pageSections, pageIdx) => (
        <div
          key={pageIdx}
          className="doc-page"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            marginBottom: pageIdx < pages.length - 1 ? '32px' : 0,
          }}
        >
          <DocumentHeader docType="Quotation" />

          <div
            className="doc-content"
            style={{
              gap: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {pageSections.map((section, si) => (
              <div key={section.key}>
                {si > 0 && <FlexSpacer />}
                {section.content}
              </div>
            ))}
          </div>

          <DocumentFooter
            docId={docId}
            page={pageIdx + 1}
            totalPages={pages.length}
            closing="We look forward to working with you."
          />
        </div>
      ))}
    </>
  );
}

export default PaginatedDocument;
