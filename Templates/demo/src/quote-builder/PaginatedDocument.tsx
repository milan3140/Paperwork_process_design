/**
 * PaginatedDocument — Measures sections, splits into pages, computes spacer heights
 *
 * All spacing is calculated in JS — no CSS flex grow/shrink for gaps.
 *   1. Hidden container measures each section's height
 *   2. Greedy bin-packing assigns sections to pages (including gap estimates)
 *   3. Per-page: compute total section height → distribute remaining space as spacer heights
 *   4. Spacer heights clamped to [minGap, maxGap]
 */

import { useState, useLayoutEffect, useRef, type ReactNode } from 'react';
import { DocumentHeader } from '../../../components/DocumentHeader';
import { DocumentFooter } from '../../../components/DocumentFooter';

export interface PageSection {
  key: string;
  content: ReactNode;
  /** Sections with the same group get tight spacing (TIGHT_GAP); different groups get adaptive spacing */
  group?: string;
}

interface PaginatedDocumentProps {
  sections: PageSection[];
  docId: string;
  validDays: number;
  /** Base gap between different-group sections (default 24) */
  gap?: number;
  /** Max gap as multiple of base (default 2 = 48px) */
  maxGapFactor?: number;
}

// Page constants (matching documents.css)
const PAGE_HEIGHT_PX = 1056; // 279.4mm at 96dpi
const HEADER_H = 44;
const FOOTER_H = 40;
const PAD_TOP = 20;
const PAD_BOTTOM = 16;
const AVAILABLE_H = PAGE_HEIGHT_PX - HEADER_H - FOOTER_H - PAD_TOP - PAD_BOTTOM;
const TIGHT_GAP = 12; // Fixed gap between same-group sections
const MIN_GAP = 12;   // Minimum adaptive gap

interface PageLayout {
  indices: number[];
  spacerHeights: number[]; // one per gap (length = indices.length - 1)
}

export function PaginatedDocument({
  sections,
  docId,
  gap = 24,
  maxGapFactor = 2,
}: PaginatedDocumentProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageLayout[]>([]);
  const [heights, setHeights] = useState<number[]>([]);

  const maxGap = gap * maxGapFactor;

  // Measure + compute pages synchronously before paint
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const children = measureRef.current.children;

    const measured: number[] = [];
    for (let i = 0; i < children.length; i++) {
      measured.push((children[i] as HTMLElement).offsetHeight);
    }

    // --- Bin-packing: assign sections to pages ---
    // Use MIN_GAP for estimation so we pack as tightly as possible
    const pageIndices: number[][] = [];
    let current: number[] = [];
    let currentH = 0;

    for (let i = 0; i < sections.length; i++) {
      const h = measured[i] || 0;
      const estimatedGap = current.length > 0 ? MIN_GAP : 0;

      if (currentH + estimatedGap + h > AVAILABLE_H && current.length > 0) {
        pageIndices.push(current);
        current = [i];
        currentH = h;
      } else {
        current.push(i);
        currentH += estimatedGap + h;
      }
    }
    if (current.length > 0) pageIndices.push(current);

    // --- Per page: compute spacer heights ---
    const result: PageLayout[] = pageIndices.map(indices => {
      if (indices.length <= 1) return { indices, spacerHeights: [] };

      // Count tight vs adaptive gaps
      const gaps: ('tight' | 'adaptive')[] = [];
      for (let si = 1; si < indices.length; si++) {
        const prev = sections[indices[si - 1]];
        const curr = sections[indices[si]];
        const sameGroup = curr.group && prev?.group && curr.group === prev.group;
        gaps.push(sameGroup ? 'tight' : 'adaptive');
      }

      const totalSectionH = indices.reduce((sum, idx) => sum + (measured[idx] || 0), 0);
      const tightCount = gaps.filter(g => g === 'tight').length;
      const adaptiveCount = gaps.filter(g => g === 'adaptive').length;
      const tightTotal = tightCount * TIGHT_GAP;

      const remainingForAdaptive = AVAILABLE_H - totalSectionH - tightTotal;
      let adaptiveGap = adaptiveCount > 0
        ? Math.floor(remainingForAdaptive / adaptiveCount)
        : 0;

      // Clamp
      adaptiveGap = Math.max(MIN_GAP, Math.min(maxGap, adaptiveGap));

      return {
        indices,
        spacerHeights: gaps.map(g => g === 'tight' ? TIGHT_GAP : adaptiveGap),
      };
    });

    // Only update if changed
    setPages(prev => {
      const same = prev.length === result.length &&
        prev.every((p, i) =>
          p.indices.length === result[i].indices.length &&
          p.indices.every((v, j) => v === result[i].indices[j]) &&
          p.spacerHeights.every((v, j) => v === result[i].spacerHeights[j])
        );
      return same ? prev : result;
    });
    setHeights(measured);
  }); // runs every render, bails if unchanged

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

      {/* Paginated output */}
      {pages.map((page, pageIdx) => (
        <div
          key={pageIdx}
          className="doc-page"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            height: 'var(--doc-page-h, 279.4mm)',
            marginBottom: pageIdx < pages.length - 1 ? '32px' : 0,
          }}
        >
          <DocumentHeader docType="Quotation" />

          <div className="doc-content" style={{ gap: 0 }}>
            {page.indices.map((sectionIdx, si) => {
              const section = sections[sectionIdx];
              if (!section) return null;
              return (
                <div key={section.key}>
                  {si > 0 && (
                    <div style={{ height: `${page.spacerHeights[si - 1]}px` }} />
                  )}
                  {section.content}
                </div>
              );
            })}
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
