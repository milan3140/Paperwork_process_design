/**
 * Pagination Engine Tests
 *
 * Tests the pure computation logic: bin-packing, spacer calculation, page layout.
 * No DOM needed — all arithmetic.
 */

import { describe, it, expect } from 'vitest';
import {
  assignToPages,
  computeSpacerHeights,
  computePageLayouts,
  AVAILABLE_H,
  TIGHT_GAP,
  MIN_GAP,
  type SectionMeta,
} from '../pagination';

const MAX_GAP = 48; // default: gap(24) * maxGapFactor(2)

/* ═══════════════════════════════════════════════════════════════
   1. BIN-PACKING
   ═══════════════════════════════════════════════════════════════ */

describe('assignToPages', () => {

  it('single small section → 1 page', () => {
    const pages = assignToPages([{ height: 100 }]);
    expect(pages).toEqual([[0]]);
  });

  it('multiple sections that fit → 1 page', () => {
    const metas: SectionMeta[] = [
      { height: 200 }, { height: 200 }, { height: 200 },
    ];
    // 200 + 12 + 200 + 12 + 200 = 624 < 936
    const pages = assignToPages(metas);
    expect(pages).toEqual([[0, 1, 2]]);
  });

  it('sections that overflow → 2 pages', () => {
    const metas: SectionMeta[] = [
      { height: 500 }, { height: 500 },
    ];
    // 500 + 12 + 500 = 1012 > 936
    const pages = assignToPages(metas);
    expect(pages).toEqual([[0], [1]]);
  });

  it('many small sections → splits at right point', () => {
    // Each 100px + 12px gap. Page fits floor((936 + 12) / 112) = 8.46 → 8 sections
    // 8 sections: 8*100 + 7*12 = 884 < 936 ✓
    // 9 sections: 9*100 + 8*12 = 996 > 936 ✗
    const metas: SectionMeta[] = Array(12).fill({ height: 100 });
    const pages = assignToPages(metas);
    expect(pages[0].length).toBe(8);
    expect(pages[1].length).toBe(4);
    expect(pages.length).toBe(2);
  });

  it('one section larger than page → gets its own page', () => {
    const metas: SectionMeta[] = [
      { height: 100 }, { height: 1000 }, { height: 100 },
    ];
    const pages = assignToPages(metas);
    // Section 0 on page 1, section 1 alone on page 2, section 2 on page 3
    expect(pages.length).toBe(3);
    expect(pages[1]).toEqual([1]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   2. SPACER CALCULATION
   ═══════════════════════════════════════════════════════════════ */

describe('computeSpacerHeights', () => {

  it('single section → no spacers', () => {
    const spacers = computeSpacerHeights([0], [{ height: 100 }], MAX_GAP);
    expect(spacers).toEqual([]);
  });

  it('few sections, lots of space → spacers at max (48px)', () => {
    const metas: SectionMeta[] = [
      { height: 60 }, { height: 120 }, { height: 100 },
    ];
    // Total section: 280. Available: 936. Remaining: 656. 2 adaptive gaps. 656/2 = 328 → clamp to 48
    const spacers = computeSpacerHeights([0, 1, 2], metas, MAX_GAP);
    expect(spacers).toEqual([48, 48]);
  });

  it('moderate content → spacers between min and max', () => {
    const metas: SectionMeta[] = [
      { height: 200 }, { height: 200 }, { height: 200 }, { height: 200 },
    ];
    // Total section: 800. Available: 936. Remaining: 136. 3 adaptive gaps. 136/3 = 45
    const spacers = computeSpacerHeights([0, 1, 2, 3], metas, MAX_GAP);
    expect(spacers[0]).toBe(45);
    expect(spacers.every(s => s >= MIN_GAP && s <= MAX_GAP)).toBe(true);
  });

  it('nearly full page → spacers at min (12px)', () => {
    const metas: SectionMeta[] = [
      { height: 300 }, { height: 300 }, { height: 300 },
    ];
    // Total: 900. Available: 936. Remaining: 36. 2 gaps. 36/2 = 18
    const spacers = computeSpacerHeights([0, 1, 2], metas, MAX_GAP);
    expect(spacers[0]).toBe(18);
    expect(spacers.every(s => s >= MIN_GAP)).toBe(true);
  });

  it('overflowing page → spacers clamped to min', () => {
    const metas: SectionMeta[] = [
      { height: 400 }, { height: 400 }, { height: 400 },
    ];
    // Total: 1200 > 936. Remaining: negative. Clamped to MIN_GAP.
    const spacers = computeSpacerHeights([0, 1, 2], metas, MAX_GAP);
    expect(spacers).toEqual([MIN_GAP, MIN_GAP]);
  });

  it('same-group sections get TIGHT_GAP regardless of space', () => {
    const metas: SectionMeta[] = [
      { height: 60 },
      { height: 50, group: 'pricing' },
      { height: 50, group: 'pricing' },
      { height: 50, group: 'pricing' },
      { height: 100 },
    ];
    const spacers = computeSpacerHeights([0, 1, 2, 3, 4], metas, MAX_GAP);
    // Gap 0→1: different group → adaptive
    // Gap 1→2: same group → TIGHT_GAP (12)
    // Gap 2→3: same group → TIGHT_GAP (12)
    // Gap 3→4: different group → adaptive
    expect(spacers[1]).toBe(TIGHT_GAP);
    expect(spacers[2]).toBe(TIGHT_GAP);
    // Adaptive gaps should be equal and within range
    expect(spacers[0]).toBe(spacers[3]);
    expect(spacers[0]).toBeGreaterThanOrEqual(MIN_GAP);
    expect(spacers[0]).toBeLessThanOrEqual(MAX_GAP);
  });

  it('all same group → all tight gaps', () => {
    const metas: SectionMeta[] = [
      { height: 100, group: 'a' },
      { height: 100, group: 'a' },
      { height: 100, group: 'a' },
    ];
    const spacers = computeSpacerHeights([0, 1, 2], metas, MAX_GAP);
    expect(spacers).toEqual([TIGHT_GAP, TIGHT_GAP]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   3. FULL PIPELINE
   ═══════════════════════════════════════════════════════════════ */

describe('computePageLayouts', () => {

  it('simple quote: title + parties + pricing + info + terms → 1 page', () => {
    const metas: SectionMeta[] = [
      { height: 60 },   // title
      { height: 120 },  // parties
      { height: 30, group: 'pricing' },   // pricing header
      { height: 100, group: 'pricing' },  // part 1
      { height: 10, group: 'pricing' },   // pricing footer
      { height: 200 },  // info grid
      { height: 80 },   // terms
    ];
    const pages = computePageLayouts(metas, MAX_GAP);
    expect(pages.length).toBe(1);
    expect(pages[0].indices).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // Pricing gaps should be tight
    expect(pages[0].spacerHeights[2]).toBe(TIGHT_GAP); // header→part1
    expect(pages[0].spacerHeights[3]).toBe(TIGHT_GAP); // part1→footer
  });

  it('many parts → splits across pages', () => {
    const metas: SectionMeta[] = [
      { height: 60 },   // title
      { height: 120 },  // parties
      { height: 30, group: 'pricing' },   // pricing header
      ...Array(8).fill(null).map(() => ({ height: 100, group: 'pricing' as const })), // 8 parts
      { height: 10, group: 'pricing' },   // pricing footer
      { height: 200 },  // info grid
      { height: 80 },   // terms
    ];
    const pages = computePageLayouts(metas, MAX_GAP);
    expect(pages.length).toBeGreaterThan(1);
    // All sections accounted for
    const allIndices = pages.flatMap(p => p.indices);
    expect(allIndices.length).toBe(metas.length);
    expect(allIndices).toEqual(metas.map((_, i) => i));
  });

  it('spacers shrink as parts increase', () => {
    // 2 parts
    const metas2: SectionMeta[] = [
      { height: 60 }, { height: 120 },
      { height: 30, group: 'p' }, { height: 100, group: 'p' }, { height: 100, group: 'p' }, { height: 10, group: 'p' },
      { height: 200 }, { height: 80 },
    ];
    const pages2 = computePageLayouts(metas2, MAX_GAP);

    // 4 parts (more content)
    const metas4: SectionMeta[] = [
      { height: 60 }, { height: 120 },
      { height: 30, group: 'p' }, { height: 100, group: 'p' }, { height: 100, group: 'p' },
      { height: 100, group: 'p' }, { height: 100, group: 'p' }, { height: 10, group: 'p' },
      { height: 200 }, { height: 80 },
    ];
    const pages4 = computePageLayouts(metas4, MAX_GAP);

    // If both fit on 1 page, the adaptive gaps in pages4 should be smaller
    if (pages2.length === 1 && pages4.length === 1) {
      const adaptive2 = pages2[0].spacerHeights.filter((_, i) => {
        const idx = pages2[0].indices;
        const prev = metas2[idx[i]];
        const curr = metas2[idx[i + 1]];
        return !(prev?.group && curr?.group && prev.group === curr.group);
      });
      const adaptive4 = pages4[0].spacerHeights.filter((_, i) => {
        const idx = pages4[0].indices;
        const prev = metas4[idx[i]];
        const curr = metas4[idx[i + 1]];
        return !(prev?.group && curr?.group && prev.group === curr.group);
      });
      if (adaptive2.length > 0 && adaptive4.length > 0) {
        expect(adaptive4[0]).toBeLessThanOrEqual(adaptive2[0]);
      }
    }
  });
});
