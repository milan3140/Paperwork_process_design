/**
 * PaginatedDocument — Measures sections and splits into pages
 *
 * Architecture:
 *   - Hidden container renders ALL sections for height measurement
 *   - useLayoutEffect measures heights and computes page assignments (index groups)
 *   - Visible render always uses CURRENT sections prop with stored index groups
 *   - Sections are never split — each stays on one page
 *   - FlexSpacer between sections distributes leftover space (min gap, max 1.5×)
 */

import { useState, useLayoutEffect, useRef, type ReactNode } from 'react';
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
  gap?: number;
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
  gap = 24,
  maxGapFactor = 1.5,
}: PaginatedDocumentProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  // Store page assignments as index groups: [[0,1,2], [3,4], [5]]
  const [pageGroups, setPageGroups] = useState<number[][]>([[...sections.map((_, i) => i)]]);

  // Measure and compute page groups synchronously before paint
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const children = measureRef.current.children;

    const heights: number[] = [];
    for (let i = 0; i < children.length; i++) {
      heights.push((children[i] as HTMLElement).offsetHeight);
    }

    const groups: number[][] = [];
    let current: number[] = [];
    let currentH = 0;

    for (let i = 0; i < sections.length; i++) {
      const h = heights[i] || 0;
      const g = current.length > 0 ? gap : 0;

      if (currentH + g + h > AVAILABLE_H && current.length > 0) {
        groups.push(current);
        current = [i];
        currentH = h;
      } else {
        current.push(i);
        currentH += g + h;
      }
    }
    if (current.length > 0) groups.push(current);

    // Only update state if groups actually changed (prevents infinite loop)
    setPageGroups(prev => {
      const same = prev.length === groups.length &&
        prev.every((g, i) => g.length === groups[i].length && g.every((v, j) => v === groups[i][j]));
      return same ? prev : groups;
    });
  }); // No deps — runs every render, but bails out if groups unchanged

  const maxGap = gap * maxGapFactor;

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

      {/* Paginated output — always uses latest sections via index groups */}
      {pageGroups.map((indices, pageIdx) => (
        <div
          key={pageIdx}
          className="doc-page"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            height: 'var(--doc-page-h, 279.4mm)',
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            marginBottom: pageIdx < pageGroups.length - 1 ? '32px' : 0,
          }}
        >
          <DocumentHeader docType="Quotation" />

          <div className="doc-content" style={{ gap: 0, minHeight: 0, overflow: 'hidden' }}>
            {indices.flatMap((sectionIdx, si) => {
              const section = sections[sectionIdx];
              if (!section) return [];
              const items: ReactNode[] = [];
              if (si > 0) items.push(
                <div key={`gap-${si}`} style={{ flex: `1 0 ${gap}px`, maxHeight: `${maxGap}px` }} />
              );
              items.push(
                <div key={section.key} style={{ flexShrink: 0 }}>{section.content}</div>
              );
              return items;
            })}
          </div>

          <DocumentFooter
            docId={docId}
            page={pageIdx + 1}
            totalPages={pageGroups.length}
            closing="We look forward to working with you."
          />
        </div>
      ))}
    </>
  );
}

export default PaginatedDocument;
