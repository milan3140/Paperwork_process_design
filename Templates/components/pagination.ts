/**
 * Pagination — Pure computation logic for page layout
 *
 * Extracted from PaginatedDocument for testability.
 * No React, no DOM — pure functions operating on numbers.
 *
 * Used by PaginatedDocument to assign sections to pages
 * and compute spacer heights for even distribution.
 */

export interface SectionMeta {
  height: number;
  group?: string;
}

export interface PageLayout {
  indices: number[];
  spacerHeights: number[]; // length = indices.length - 1
}

// Page constants (matching documents.css)
// NOTE: 297mm at 96dpi = 1122.52px; browsers round to 1122 when printing.
// Use 1122 (not 1123) to avoid subpixel overflow that pushes footers to next page.
export const PAGE_HEIGHT_PX = 1122;
export const HEADER_H = 56; // matches --doc-header-h in documents.css
export const FOOTER_H = 32; // actual rendered height ≈ 29px, 32 = small safety buffer
export const PAD_TOP = 20;
export const PAD_BOTTOM = 16;
export const AVAILABLE_H = PAGE_HEIGHT_PX - HEADER_H - FOOTER_H - PAD_TOP - PAD_BOTTOM; // 998
export const TIGHT_GAP = 12;
export const MIN_GAP = 12;

/** Height reserved for continuation hints on non-first/non-last pages */
export const CONT_HINT_TOP_H = 28;
export const CONT_HINT_BOTTOM_H = 28;

/**
 * Assign sections to pages using greedy bin-packing.
 * Uses MIN_GAP for estimation to pack as tightly as possible.
 *
 * Two-pass approach to avoid unnecessary page breaks:
 * 1. First try without hint reserves — if everything fits on one page, done.
 * 2. If multi-page, re-run with hint space reserves so hints don't overlap content.
 */
export function assignToPages(sectionMetas: SectionMeta[], packingGap: number = MIN_GAP): number[][] {
  // Pass 1: try fitting everything without hint reserves
  const optimistic = greedyAssign(sectionMetas, AVAILABLE_H, packingGap);
  if (optimistic.length <= 1) return optimistic;

  // Pass 2: multi-page confirmed — re-run with hint space reserves
  return greedyAssignWithHints(sectionMetas, packingGap);
}

/** Simple greedy bin-packing with a fixed available height per page. */
function greedyAssign(sectionMetas: SectionMeta[], availH: number, packingGap: number): number[][] {
  const pageIndices: number[][] = [];
  let current: number[] = [];
  let currentH = 0;

  for (let i = 0; i < sectionMetas.length; i++) {
    const h = sectionMetas[i].height;
    const estimatedGap = current.length > 0 ? packingGap : 0;

    if (currentH + estimatedGap + h > availH && current.length > 0) {
      pageIndices.push(current);
      current = [i];
      currentH = h;
    } else {
      current.push(i);
      currentH += estimatedGap + h;
    }
  }
  if (current.length > 0) pageIndices.push(current);
  return pageIndices;
}

/** Greedy bin-packing with per-page hint height reserves. */
function greedyAssignWithHints(sectionMetas: SectionMeta[], packingGap: number): number[][] {
  const pageIndices: number[][] = [];
  let current: number[] = [];
  let currentH = 0;

  for (let i = 0; i < sectionMetas.length; i++) {
    const h = sectionMetas[i].height;
    const estimatedGap = current.length > 0 ? packingGap : 0;

    const isFirstPage = pageIndices.length === 0;
    const hintReserve = isFirstPage
      ? CONT_HINT_BOTTOM_H
      : CONT_HINT_TOP_H + CONT_HINT_BOTTOM_H;
    const availH = AVAILABLE_H - hintReserve;

    if (currentH + estimatedGap + h > availH && current.length > 0) {
      pageIndices.push(current);
      current = [i];
      currentH = h;
    } else {
      current.push(i);
      currentH += estimatedGap + h;
    }
  }
  if (current.length > 0) pageIndices.push(current);
  return pageIndices;
}

/**
 * Compute spacer heights for a single page.
 * Distributes remaining space among adaptive gaps, clamped to [minGap, maxGap].
 * Same-group gaps always get TIGHT_GAP.
 */
export function computeSpacerHeights(
  indices: number[],
  sectionMetas: SectionMeta[],
  maxGap: number,
  pageAvailableH: number = AVAILABLE_H,
  minGap: number = MIN_GAP,
  tightGap: number = TIGHT_GAP,
): number[] {
  if (indices.length <= 1) return [];

  const gaps: ('tight' | 'adaptive')[] = [];
  for (let si = 1; si < indices.length; si++) {
    const prev = sectionMetas[indices[si - 1]];
    const curr = sectionMetas[indices[si]];
    const sameGroup = curr.group && prev?.group && curr.group === prev.group;
    gaps.push(sameGroup ? 'tight' : 'adaptive');
  }

  const totalSectionH = indices.reduce((sum, idx) => sum + sectionMetas[idx].height, 0);
  const tightCount = gaps.filter(g => g === 'tight').length;
  const adaptiveCount = gaps.filter(g => g === 'adaptive').length;
  const tightTotal = tightCount * tightGap;

  const remainingForAdaptive = pageAvailableH - totalSectionH - tightTotal;
  let adaptiveGap = adaptiveCount > 0
    ? Math.floor(remainingForAdaptive / adaptiveCount)
    : 0;

  const effectiveMax = Math.max(minGap, maxGap);
  adaptiveGap = Math.max(minGap, Math.min(effectiveMax, adaptiveGap));

  return gaps.map(g => g === 'tight' ? tightGap : adaptiveGap);
}

/**
 * Full pipeline: measure → assign → compute spacers
 */
export function computePageLayouts(
  sectionMetas: SectionMeta[],
  maxGap: number,
  packingGap?: number,
  minGap?: number,
): PageLayout[] {
  const pageIndices = assignToPages(sectionMetas, packingGap ?? minGap ?? MIN_GAP);
  const totalPages = pageIndices.length;
  const isMultiPage = totalPages > 1;

  return pageIndices.map((indices, pageIdx) => {
    // Adjust available height for continuation hints
    let pageAvailH = AVAILABLE_H;
    if (isMultiPage) {
      const isFirst = pageIdx === 0;
      const isLast = pageIdx === totalPages - 1;
      if (isFirst) pageAvailH -= CONT_HINT_BOTTOM_H;
      else if (isLast) pageAvailH -= CONT_HINT_TOP_H;
      else pageAvailH -= CONT_HINT_TOP_H + CONT_HINT_BOTTOM_H;
    }

    return {
      indices,
      spacerHeights: computeSpacerHeights(indices, sectionMetas, maxGap, pageAvailH, minGap),
    };
  });
}
