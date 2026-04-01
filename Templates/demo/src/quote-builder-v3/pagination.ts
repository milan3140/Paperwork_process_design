/**
 * Pagination — Pure computation logic for page layout
 *
 * Extracted from PaginatedDocument for testability.
 * No React, no DOM — pure functions operating on numbers.
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
export const PAGE_HEIGHT_PX = 1056; // 279.4mm at 96dpi
export const HEADER_H = 44;
export const FOOTER_H = 40;
export const PAD_TOP = 20;
export const PAD_BOTTOM = 16;
export const AVAILABLE_H = PAGE_HEIGHT_PX - HEADER_H - FOOTER_H - PAD_TOP - PAD_BOTTOM; // 936
export const TIGHT_GAP = 12;
export const MIN_GAP = 12;

/**
 * Assign sections to pages using greedy bin-packing.
 * Uses MIN_GAP for estimation to pack as tightly as possible.
 */
export function assignToPages(sectionMetas: SectionMeta[]): number[][] {
  const pageIndices: number[][] = [];
  let current: number[] = [];
  let currentH = 0;

  for (let i = 0; i < sectionMetas.length; i++) {
    const h = sectionMetas[i].height;
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
  const tightTotal = tightCount * TIGHT_GAP;

  const remainingForAdaptive = AVAILABLE_H - totalSectionH - tightTotal;
  let adaptiveGap = adaptiveCount > 0
    ? Math.floor(remainingForAdaptive / adaptiveCount)
    : 0;

  adaptiveGap = Math.max(MIN_GAP, Math.min(maxGap, adaptiveGap));

  return gaps.map(g => g === 'tight' ? TIGHT_GAP : adaptiveGap);
}

/**
 * Full pipeline: measure → assign → compute spacers
 */
export function computePageLayouts(
  sectionMetas: SectionMeta[],
  maxGap: number,
): PageLayout[] {
  const pageIndices = assignToPages(sectionMetas);
  return pageIndices.map(indices => ({
    indices,
    spacerHeights: computeSpacerHeights(indices, sectionMetas, maxGap),
  }));
}
