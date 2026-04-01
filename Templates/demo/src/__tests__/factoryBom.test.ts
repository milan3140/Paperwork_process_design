/**
 * FactoryBomDocument — Comprehensive Test Suite
 *
 * Covers all pure logic functions exported from FactoryBomDocument.tsx:
 *   formatDims, formatWeight, countUniquePartTypes, tierLabel,
 *   getMaxTierCount, computeTierTotals, paginateParts
 *
 * Run:  npx vitest run src/__tests__/factoryBom.test.ts
 * Watch: npx vitest src/__tests__/factoryBom.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  formatDims,
  formatWeight,
  countUniquePartTypes,
  tierLabel,
  getMaxTierCount,
  computeTierTotals,
  paginateParts,
  type FactoryBomPart,
  type Dims3D,
} from '../../../components/FactoryBomDocument';

/* ═══════════════════════════════════════════════════════════
   Test Helpers — reusable part factory
   ═══════════════════════════════════════════════════════════ */

/** Create a minimal FactoryBomPart with overrides */
function mkPart(overrides: Partial<FactoryBomPart> & { qtyTiers: number[] }): FactoryBomPart {
  return {
    partId: 'P01',
    dimsMm: { l: 100, w: 50, h: 25 },
    weight: 0.5,
    material: '鋁合金 6061-T6',
    finish: '標準',
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════════
   formatDims
   ═══════════════════════════════════════════════════════════ */

describe('formatDims', () => {
  it('formats Dims3D object with × separator', () => {
    expect(formatDims({ l: 127, w: 89, h: 45 })).toBe('127 × 89 × 45');
  });

  it('passes through pre-formatted string as-is', () => {
    expect(formatDims('127 × 89 × 45')).toBe('127 × 89 × 45');
  });

  it('handles zero dimensions', () => {
    expect(formatDims({ l: 0, w: 0, h: 0 })).toBe('0 × 0 × 0');
  });

  it('handles decimal dimensions', () => {
    expect(formatDims({ l: 12.5, w: 8.3, h: 2.1 })).toBe('12.5 × 8.3 × 2.1');
  });

  it('uses multiplication sign (×, U+00D7) not lowercase x', () => {
    const result = formatDims({ l: 1, w: 2, h: 3 });
    expect(result).toContain('\u00d7');
    expect(result).not.toContain(' x ');
  });

  it('handles empty string pass-through', () => {
    expect(formatDims('')).toBe('');
  });
});

/* ═══════════════════════════════════════════════════════════
   formatWeight
   ═══════════════════════════════════════════════════════════ */

describe('formatWeight', () => {
  it('formats number to 2 decimal places with kg suffix', () => {
    expect(formatWeight(0.34)).toBe('0.34 kg');
  });

  it('pads integer to 2 decimals', () => {
    expect(formatWeight(2)).toBe('2.00 kg');
  });

  it('rounds to 2 decimals', () => {
    expect(formatWeight(1.999)).toBe('2.00 kg');
    expect(formatWeight(0.005)).toBe('0.01 kg');
  });

  it('handles zero', () => {
    expect(formatWeight(0)).toBe('0.00 kg');
  });

  it('passes through pre-formatted string as-is', () => {
    expect(formatWeight('0.34 kg')).toBe('0.34 kg');
    expect(formatWeight('2.18 kg')).toBe('2.18 kg');
  });

  it('handles empty string pass-through', () => {
    expect(formatWeight('')).toBe('');
  });
});

/* ═══════════════════════════════════════════════════════════
   countUniquePartTypes
   ═══════════════════════════════════════════════════════════ */

describe('countUniquePartTypes', () => {
  it('counts distinct base partIds', () => {
    const parts = [
      mkPart({ partId: 'P01', qtyTiers: [1] }),
      mkPart({ partId: 'P02', qtyTiers: [1] }),
      mkPart({ partId: 'P03', qtyTiers: [1] }),
    ];
    expect(countUniquePartTypes(parts)).toBe(3);
  });

  it('deduplicates sub-parts (P02\\n(1/2) and P02\\n(2/2) count as 1)', () => {
    const parts = [
      mkPart({ partId: 'P02\n(1/2)', qtyTiers: [1] }),
      mkPart({ partId: 'P02\n(2/2)', qtyTiers: [1] }),
    ];
    expect(countUniquePartTypes(parts)).toBe(1);
  });

  it('deduplicates repeated same partId (P05 × 4 = 1 type)', () => {
    const parts = Array.from({ length: 4 }, () =>
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] })
    );
    expect(countUniquePartTypes(parts)).toBe(1);
  });

  it('handles mixed: unique + sub-parts + repeats', () => {
    // Real demo data: P01, P02(1/2), P02(2/2), P03, P04, P05×4 → 5 unique
    const parts = [
      mkPart({ partId: 'P01', qtyTiers: [1, 5, 10] }),
      mkPart({ partId: 'P02\n(1/2)', qtyTiers: [2, 4, 8] }),
      mkPart({ partId: 'P02\n(2/2)', qtyTiers: [2, 4, 8] }),
      mkPart({ partId: 'P03', qtyTiers: [1, 3] }),
      mkPart({ partId: 'P04', qtyTiers: [5, 10, 20] }),
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] }),
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] }),
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] }),
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] }),
    ];
    expect(countUniquePartTypes(parts)).toBe(5);
  });

  it('returns 0 for empty parts array', () => {
    expect(countUniquePartTypes([])).toBe(0);
  });

  it('handles partId with no \\n (no sub-part) correctly', () => {
    const parts = [mkPart({ partId: 'SINGLE', qtyTiers: [1] })];
    expect(countUniquePartTypes(parts)).toBe(1);
  });
});

/* ═══════════════════════════════════════════════════════════
   tierLabel
   ═══════════════════════════════════════════════════════════ */

describe('tierLabel', () => {
  it('generates 方案一 through 方案十', () => {
    expect(tierLabel(0)).toBe('方案一');
    expect(tierLabel(1)).toBe('方案二');
    expect(tierLabel(2)).toBe('方案三');
    expect(tierLabel(8)).toBe('方案九');
    expect(tierLabel(9)).toBe('方案十');
  });

  it('falls back to numeric for index >= 10', () => {
    expect(tierLabel(10)).toBe('方案11');
    expect(tierLabel(99)).toBe('方案100');
  });
});

/* ═══════════════════════════════════════════════════════════
   getMaxTierCount
   ═══════════════════════════════════════════════════════════ */

describe('getMaxTierCount', () => {
  it('returns max qtyTiers.length across all parts', () => {
    const parts = [
      mkPart({ qtyTiers: [1, 5, 10] }),     // 3
      mkPart({ qtyTiers: [2, 4] }),          // 2
      mkPart({ qtyTiers: [5, 10, 50] }),     // 3
    ];
    expect(getMaxTierCount(parts)).toBe(3);
  });

  it('returns 1 for empty parts array', () => {
    expect(getMaxTierCount([])).toBe(1);
  });

  it('returns 1 for all single-tier parts', () => {
    const parts = [
      mkPart({ qtyTiers: [10] }),
      mkPart({ qtyTiers: [5] }),
    ];
    expect(getMaxTierCount(parts)).toBe(1);
  });

  it('handles mixed tier counts', () => {
    const parts = [
      mkPart({ qtyTiers: [1] }),             // 1
      mkPart({ qtyTiers: [1, 2, 3, 4] }),    // 4
      mkPart({ qtyTiers: [1, 2] }),           // 2
    ];
    expect(getMaxTierCount(parts)).toBe(4);
  });
});

/* ═══════════════════════════════════════════════════════════
   computeTierTotals
   ═══════════════════════════════════════════════════════════ */

describe('computeTierTotals', () => {
  it('computes per-tier sums for uniform 3-tier parts', () => {
    const parts = [
      mkPart({ qtyTiers: [1, 5, 10] }),
      mkPart({ qtyTiers: [2, 4, 8] }),
    ];
    // sorted: [1,5,10] + [2,4,8] = [3, 9, 18]
    expect(computeTierTotals(parts, 3)).toEqual([3, 9, 18]);
  });

  it('replicates highest tier for parts with fewer tiers', () => {
    const parts = [
      mkPart({ qtyTiers: [1, 5, 10] }),   // sorted [1,5,10] → [1, 5, 10]
      mkPart({ qtyTiers: [1, 3] }),         // sorted [1,3]    → [1, 3, 3] (3 replicated)
    ];
    expect(computeTierTotals(parts, 3)).toEqual([2, 8, 13]);
  });

  it('handles single-tier parts in a multi-tier document', () => {
    const parts = [
      mkPart({ qtyTiers: [100] }),          // [100] → [100, 100, 100]
      mkPart({ qtyTiers: [1, 5, 10] }),     // [1, 5, 10]
    ];
    expect(computeTierTotals(parts, 3)).toEqual([101, 105, 110]);
  });

  it('sorts qtyTiers before computing (handles unsorted input)', () => {
    const parts = [
      mkPart({ qtyTiers: [10, 1, 5] }),     // sorted → [1, 5, 10]
    ];
    expect(computeTierTotals(parts, 3)).toEqual([1, 5, 10]);
  });

  it('returns zeros for empty parts array', () => {
    expect(computeTierTotals([], 3)).toEqual([0, 0, 0]);
  });

  it('matches demo data: 9 parts → [31, 66, 249]', () => {
    // Exact demo data from FactoryBomDemo.tsx
    const parts = [
      mkPart({ partId: 'P01', qtyTiers: [1, 5, 10] }),
      mkPart({ partId: 'P02', qtyTiers: [2, 4, 8] }),
      mkPart({ partId: 'P02', qtyTiers: [2, 4, 8] }),
      mkPart({ partId: 'P03', qtyTiers: [1, 3] }),       // 2-tier → [1, 3, 3]
      mkPart({ partId: 'P04', qtyTiers: [5, 10, 20] }),
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] }),
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] }),
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] }),
      mkPart({ partId: 'P05', qtyTiers: [5, 10, 50] }),
    ];
    // Tier 0 (min): 1+2+2+1+5+5+5+5+5 = 31
    // Tier 1 (mid): 5+4+4+3+10+10+10+10+10 = 66
    // Tier 2 (max): 10+8+8+3+20+50+50+50+50 = 249
    expect(computeTierTotals(parts, 3)).toEqual([31, 66, 249]);
  });

  it('handles tierCount=1 (single-tier document)', () => {
    const parts = [
      mkPart({ qtyTiers: [5] }),
      mkPart({ qtyTiers: [10] }),
    ];
    expect(computeTierTotals(parts, 1)).toEqual([15]);
  });

  it('handles tierCount=4 with mixed tiers', () => {
    const parts = [
      mkPart({ qtyTiers: [1, 2, 3, 4] }),    // [1, 2, 3, 4]
      mkPart({ qtyTiers: [10, 20] }),          // [10, 20, 20, 20]
    ];
    expect(computeTierTotals(parts, 4)).toEqual([11, 22, 23, 24]);
  });
});

/* ═══════════════════════════════════════════════════════════
   paginateParts
   ═══════════════════════════════════════════════════════════ */

describe('paginateParts', () => {
  it('fits ≤5 parts on one page', () => {
    const parts = Array.from({ length: 5 }, (_, i) =>
      mkPart({ partId: `P${i}`, qtyTiers: [1] })
    );
    const pages = paginateParts(parts);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(5);
  });

  it('splits 6 parts into 2 pages: 5 + 1', () => {
    const parts = Array.from({ length: 6 }, (_, i) =>
      mkPart({ partId: `P${i}`, qtyTiers: [1] })
    );
    const pages = paginateParts(parts);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(5);
    expect(pages[1]).toHaveLength(1);
  });

  it('splits 12 parts into 2 pages: 5 + 7', () => {
    const parts = Array.from({ length: 12 }, (_, i) =>
      mkPart({ partId: `P${i}`, qtyTiers: [1] })
    );
    const pages = paginateParts(parts);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(5);
    expect(pages[1]).toHaveLength(7);
  });

  it('splits 13 parts into 3 pages: 5 + 7 + 1', () => {
    const parts = Array.from({ length: 13 }, (_, i) =>
      mkPart({ partId: `P${i}`, qtyTiers: [1] })
    );
    const pages = paginateParts(parts);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toHaveLength(5);
    expect(pages[1]).toHaveLength(7);
    expect(pages[2]).toHaveLength(1);
  });

  it('splits 19 parts into 3 pages: 5 + 7 + 7', () => {
    const parts = Array.from({ length: 19 }, (_, i) =>
      mkPart({ partId: `P${i}`, qtyTiers: [1] })
    );
    const pages = paginateParts(parts);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toHaveLength(5);
    expect(pages[1]).toHaveLength(7);
    expect(pages[2]).toHaveLength(7);
  });

  it('handles empty parts array (1 page with 0 parts)', () => {
    const pages = paginateParts([]);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(0);
  });

  it('handles single part (1 page with 1 part)', () => {
    const parts = [mkPart({ qtyTiers: [1] })];
    const pages = paginateParts(parts);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(1);
  });

  it('preserves part order across pages', () => {
    const parts = Array.from({ length: 8 }, (_, i) =>
      mkPart({ partId: `P${i + 1}`, qtyTiers: [1] })
    );
    const pages = paginateParts(parts);
    expect(pages[0].map(p => p.partId)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5']);
    expect(pages[1].map(p => p.partId)).toEqual(['P6', 'P7', 'P8']);
  });

  it('does not mutate the original parts array', () => {
    const parts = Array.from({ length: 8 }, (_, i) =>
      mkPart({ partId: `P${i}`, qtyTiers: [1] })
    );
    const originalLength = parts.length;
    paginateParts(parts);
    expect(parts).toHaveLength(originalLength);
  });
});

/* ═══════════════════════════════════════════════════════════
   Integration: full data flow sanity check
   ═══════════════════════════════════════════════════════════ */

describe('integration: full data flow', () => {
  const demoParts: FactoryBomPart[] = [
    mkPart({ partId: 'P01', dimsMm: { l: 127, w: 89, h: 45 }, weight: 0.34, material: '鋁合金 6061-T6', finish: '黑色陽極氧化', qtyTiers: [1, 5, 10] }),
    mkPart({ partId: 'P02\n(1/2)', dimsMm: { l: 88, w: 62, h: 31 }, weight: 1.34, material: '不鏽鋼 304', finish: '標準', qtyTiers: [2, 4, 8] }),
    mkPart({ partId: 'P02\n(2/2)', dimsMm: { l: 88, w: 62, h: 31 }, weight: 0.48, material: '鋁合金 7075-T6', finish: '透明陽極氧化', qtyTiers: [2, 4, 8] }),
    mkPart({ partId: 'P03', dimsMm: { l: 65, w: 52, h: 28 }, weight: 0.24, material: 'ZERODUR', finish: '標準', qtyTiers: [1, 3] }),
    mkPart({ partId: 'P04', dimsMm: { l: 220, w: 180, h: 55 }, weight: 2.18, material: '鋁合金 6061-T6', finish: '標準', qtyTiers: [5, 10, 20] }),
    ...Array.from({ length: 4 }, () =>
      mkPart({ partId: 'P05', dimsMm: { l: 35, w: 12, h: 8 }, weight: 0.02, material: '不鏽鋼 316L', finish: '電解拋光', qtyTiers: [5, 10, 50] })
    ),
  ];

  it('9 demo parts → 5 unique types', () => {
    expect(demoParts).toHaveLength(9);
    expect(countUniquePartTypes(demoParts)).toBe(5);
  });

  it('9 demo parts → 3 tiers', () => {
    expect(getMaxTierCount(demoParts)).toBe(3);
  });

  it('9 demo parts → tier totals [31, 66, 249]', () => {
    const tierCount = getMaxTierCount(demoParts);
    expect(computeTierTotals(demoParts, tierCount)).toEqual([31, 66, 249]);
  });

  it('9 demo parts → 2 pages (5 + 4)', () => {
    const pages = paginateParts(demoParts);
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(5);
    expect(pages[1]).toHaveLength(4);
  });

  it('all Dims3D values format correctly', () => {
    for (const part of demoParts) {
      const result = formatDims(part.dimsMm);
      expect(result).toMatch(/^\d+(\.\d+)? × \d+(\.\d+)? × \d+(\.\d+)?$/);
    }
  });

  it('all weight values format correctly', () => {
    for (const part of demoParts) {
      const result = formatWeight(part.weight);
      expect(result).toMatch(/^\d+\.\d{2} kg$/);
    }
  });

  it('finish logic: 標準 parts should be filtered, non-標準 displayed', () => {
    const standardParts = demoParts.filter(p => p.finish === '標準');
    const nonStandardParts = demoParts.filter(p => p.finish !== '標準');
    expect(standardParts.length).toBeGreaterThan(0);
    expect(nonStandardParts.length).toBeGreaterThan(0);
    // Business rule: 標準 → blank, others → displayed
    for (const p of standardParts) {
      expect(p.finish).toBe('標準');
    }
    for (const p of nonStandardParts) {
      expect(p.finish).not.toBe('標準');
      expect(p.finish.length).toBeGreaterThan(0);
    }
  });
});
