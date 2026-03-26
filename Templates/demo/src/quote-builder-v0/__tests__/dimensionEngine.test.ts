/**
 * Dimension Engine — Comprehensive Tests
 *
 * Covers all dimension combinations (0d, 1d, 2d, 3d, mixed),
 * edge cases, label generation, comparison annotations, and UX scenarios.
 */

import { describe, it, expect } from 'vitest';
import {
  NONE,
  analyzeDimensions,
  selectLayout,
  generateConditionLabel,
  computeComparisons,
  getUniqueValues,
  findScenario,
  findScenarios,
} from '../dimensionEngine';
import type { QuotePart, Scenario } from '../types';

/* ── Helpers ── */

function mkScenario(overrides: Partial<Scenario> & { qty: number; unitPrice: number }): Scenario {
  return { id: `s${Math.random()}`, leadTimeDays: 20, ...overrides };
}

function mkPart(name: string, material: string, scenarios: Scenario[], finish?: string): QuotePart {
  return { id: `p${Math.random()}`, name, material, finish, scenarios };
}

/* ═══════════════════════════════════════════════════════════════
   1. DIMENSION ANALYSIS
   ═══════════════════════════════════════════════════════════════ */

describe('analyzeDimensions', () => {

  // --- 0 dimensions ---

  it('single scenario → 0 varying dimensions', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38 }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toEqual([]);
    expect(analysis.fixed.qty).toBe(10);
  });

  it('empty scenarios array → 0 varying', () => {
    const part = mkPart('Shaft', 'Al 6061', []);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toEqual([]);
  });

  // --- 1 dimension: quantity ---

  it('different qty → qty varies', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 1, unitPrice: 185 }),
      mkScenario({ qty: 10, unitPrice: 42 }),
      mkScenario({ qty: 100, unitPrice: 28 }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('qty');
    expect(analysis.varying).not.toContain('location');
  });

  // --- 1 dimension: location ---

  it('different location, same qty → location varies', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 2, unitPrice: 159.92, location: 'US' }),
      mkScenario({ qty: 2, unitPrice: 105.75, location: 'TW' }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('location');
    expect(analysis.varying).not.toContain('qty');
    expect(analysis.fixed.qty).toBe(2);
  });

  // --- 1 dimension: material ---

  it('different materialOverride → material varies', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 100, unitPrice: 28, materialOverride: 'Aluminum 6061-T6' }),
      mkScenario({ qty: 100, unitPrice: 142, materialOverride: 'PEEK' }),
      mkScenario({ qty: 100, unitPrice: 85, materialOverride: 'Delrin' }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('material');
    expect(analysis.varying).not.toContain('qty');
  });

  // --- 1 dimension: finish ---

  it('different finishOverride → finish varies', () => {
    const part = mkPart('Housing', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 45, finishOverride: 'As-Machined' }),
      mkScenario({ qty: 10, unitPrice: 52, finishOverride: 'Anodize Type II' }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('finish');
  });

  // --- 1 dimension: lead time only ---

  it('different leadTime without other varying dims → leadTime varies', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 35, leadTimeDays: 25 }),
      mkScenario({ qty: 10, unitPrice: 48, leadTimeDays: 15 }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('leadTime');
  });

  // --- 2 dimensions: location × quantity ---

  it('location × qty → 2 varying', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38, location: 'TW' }),
      mkScenario({ qty: 10, unitPrice: 52, location: 'US' }),
      mkScenario({ qty: 100, unitPrice: 22, location: 'TW' }),
      mkScenario({ qty: 100, unitPrice: 33, location: 'US' }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('qty');
    expect(analysis.varying).toContain('location');
    expect(analysis.varying.length).toBe(2);
  });

  // --- 2 dimensions: material × quantity ---

  it('material × qty → 2 varying', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38, materialOverride: 'Al 6061' }),
      mkScenario({ qty: 100, unitPrice: 22, materialOverride: 'Al 6061' }),
      mkScenario({ qty: 10, unitPrice: 142, materialOverride: 'PEEK' }),
      mkScenario({ qty: 100, unitPrice: 105, materialOverride: 'PEEK' }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('qty');
    expect(analysis.varying).toContain('material');
  });

  // --- 3 dimensions: location × material × quantity ---

  it('location × material × qty → 3 varying', () => {
    const scenarios: Scenario[] = [];
    for (const loc of ['TW', 'US'] as const) {
      for (const mat of ['Al 6061', 'PEEK']) {
        for (const qty of [10, 100]) {
          scenarios.push(mkScenario({
            qty, unitPrice: Math.random() * 100,
            location: loc, materialOverride: mat,
          }));
        }
      }
    }
    const part = mkPart('Shaft', 'Al 6061', scenarios);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('qty');
    expect(analysis.varying).toContain('location');
    expect(analysis.varying).toContain('material');
    expect(analysis.varying.length).toBe(3);
  });
});

/* ═══════════════════════════════════════════════════════════════
   2. LAYOUT SELECTION
   ═══════════════════════════════════════════════════════════════ */

describe('selectLayout', () => {
  it('0 varying → single', () => {
    expect(selectLayout({ varying: [], fixed: {} })).toBe('single');
  });
  it('1 varying → horizontal', () => {
    expect(selectLayout({ varying: ['qty'], fixed: {} })).toBe('horizontal');
  });
  it('2 varying → matrix', () => {
    expect(selectLayout({ varying: ['qty', 'location'], fixed: {} })).toBe('matrix');
  });
  it('3 varying → grouped_matrix', () => {
    expect(selectLayout({ varying: ['qty', 'location', 'material'], fixed: {} })).toBe('grouped_matrix');
  });
  it('4+ varying → flat_list', () => {
    expect(selectLayout({ varying: ['qty', 'location', 'material', 'finish'], fixed: {} })).toBe('flat_list');
  });

  it('colliding scenarios still get matrix layout (stacked in cell)', () => {
    // Two scenarios with same location → same cell, stacked
    const part = mkPart('Part', 'Al 6061', [
      mkScenario({ qty: 1, unitPrice: 10, location: 'US' }),
      mkScenario({ qty: 1, unitPrice: 12, location: 'US' }),  // same cell as above
      mkScenario({ qty: 1, unitPrice: 11, location: 'TW' }),
    ]);
    const analysis = analyzeDimensions(part);
    // Still horizontal — stacking handles the collision
    expect(selectLayout(analysis)).toBe('horizontal');
  });
});

/* ═══════════════════════════════════════════════════════════════
   3. CONDITION LABEL GENERATION
   ═══════════════════════════════════════════════════════════════ */

describe('generateConditionLabel', () => {

  it('custom label overrides everything', () => {
    const s = mkScenario({ qty: 10, unitPrice: 38, location: 'TW', customLabel: 'Best Deal' });
    expect(generateConditionLabel(s, ['location'], 'Al', undefined)).toBe('Best Deal');
  });

  it('location TW → Taiwan manufacturing', () => {
    const s = mkScenario({ qty: 10, unitPrice: 38, location: 'TW' });
    expect(generateConditionLabel(s, ['location'], 'Al', undefined)).toBe('Taiwan manufacturing');
  });

  it('location US → U.S. manufacturing', () => {
    const s = mkScenario({ qty: 10, unitPrice: 52, location: 'US' });
    expect(generateConditionLabel(s, ['location'], 'Al', undefined)).toBe('U.S. manufacturing');
  });

  it('material override → material name', () => {
    const s = mkScenario({ qty: 100, unitPrice: 142, materialOverride: 'PEEK' });
    expect(generateConditionLabel(s, ['material'], 'Al', undefined)).toBe('PEEK');
  });

  it('finish override → finish name', () => {
    const s = mkScenario({ qty: 10, unitPrice: 52, finishOverride: 'Anodize Type II' });
    expect(generateConditionLabel(s, ['finish'], 'Al', undefined)).toBe('Anodize Type II');
  });

  it('leadTime varying → X workdays', () => {
    const s = mkScenario({ qty: 10, unitPrice: 48, leadTimeDays: 15 });
    expect(generateConditionLabel(s, ['leadTime'], 'Al', undefined)).toBe('15 workdays');
  });

  it('multi-dimension → comma-separated', () => {
    const s = mkScenario({ qty: 10, unitPrice: 38, location: 'TW', finishOverride: 'Anodize Type II' });
    const label = generateConditionLabel(s, ['location', 'finish'], 'Al', undefined);
    expect(label).toBe('Taiwan manufacturing, Anodize Type II');
  });

  it('qty-only varying → empty label (qty shown separately)', () => {
    const s = mkScenario({ qty: 10, unitPrice: 38 });
    expect(generateConditionLabel(s, ['qty'], 'Al', undefined)).toBe('');
  });

  it('no varying dimensions → empty label', () => {
    const s = mkScenario({ qty: 10, unitPrice: 38 });
    expect(generateConditionLabel(s, [], 'Al', undefined)).toBe('');
  });
});

/* ═══════════════════════════════════════════════════════════════
   4. COMPARISON ANNOTATIONS
   ═══════════════════════════════════════════════════════════════ */

describe('computeComparisons', () => {

  it('quantity comparison → Save X% vs QTY N', () => {
    const scenarios = [
      mkScenario({ qty: 1, unitPrice: 1600 }),
      mkScenario({ qty: 2, unitPrice: 950 }),
    ];
    const annotations = computeComparisons(scenarios, ['qty']);
    // Should annotate QTY 2 with savings vs QTY 1
    const anno = annotations.get(scenarios[1].id);
    expect(anno).toMatch(/Save.*%.*vs QTY 1/);
  });

  it('location comparison → +X% vs reference', () => {
    const scenarios = [
      mkScenario({ qty: 2, unitPrice: 105.75, location: 'TW' }),
      mkScenario({ qty: 2, unitPrice: 159.92, location: 'US' }),
    ];
    const annotations = computeComparisons(scenarios, ['location']);
    // US is more expensive, should show +X% vs Taiwan
    const anno = annotations.get(scenarios[1].id);
    expect(anno).toMatch(/\+\d+%/);
  });

  it('large difference → shows multiplier', () => {
    const scenarios = [
      mkScenario({ qty: 100, unitPrice: 28, materialOverride: 'Al 6061' }),
      mkScenario({ qty: 100, unitPrice: 142, materialOverride: 'PEEK' }),
    ];
    const annotations = computeComparisons(scenarios, ['material']);
    const anno = annotations.get(scenarios[1].id);
    expect(anno).toMatch(/×/); // 142/28 ≈ 5x
  });

  it('single scenario → no annotations', () => {
    const scenarios = [mkScenario({ qty: 10, unitPrice: 38 })];
    const annotations = computeComparisons(scenarios, []);
    expect(annotations.size).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   5. UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

describe('getUniqueValues', () => {
  it('extracts unique qty values', () => {
    const scenarios = [
      mkScenario({ qty: 10, unitPrice: 38 }),
      mkScenario({ qty: 100, unitPrice: 22 }),
      mkScenario({ qty: 10, unitPrice: 52 }), // duplicate
    ];
    expect(getUniqueValues(scenarios, 'qty')).toEqual(['10', '100']);
  });

  it('extracts unique locations', () => {
    const scenarios = [
      mkScenario({ qty: 10, unitPrice: 38, location: 'TW' }),
      mkScenario({ qty: 10, unitPrice: 52, location: 'US' }),
    ];
    expect(getUniqueValues(scenarios, 'location')).toEqual(['TW', 'US']);
  });
});

describe('findScenario', () => {
  it('finds by qty + location', () => {
    const scenarios = [
      mkScenario({ qty: 10, unitPrice: 38, location: 'TW' }),
      mkScenario({ qty: 10, unitPrice: 52, location: 'US' }),
      mkScenario({ qty: 100, unitPrice: 22, location: 'TW' }),
      mkScenario({ qty: 100, unitPrice: 33, location: 'US' }),
    ];
    const found = findScenario(scenarios, { qty: '100', location: 'TW' });
    expect(found?.unitPrice).toBe(22);
  });

  it('returns undefined when no match', () => {
    const scenarios = [mkScenario({ qty: 10, unitPrice: 38, location: 'TW' })];
    expect(findScenario(scenarios, { qty: '999' })).toBeUndefined();
  });

  it('BUG FIX: finds scenario with no materialOverride using Part default', () => {
    // Option 1: no materialOverride (uses Part default "Al 6061")
    // Option 2: materialOverride = "PEEK"
    const scenarios = [
      mkScenario({ qty: 1, unitPrice: 10, location: 'TW' }),                    // effective material = "Al 6061"
      mkScenario({ qty: 1, unitPrice: 11, location: 'US', materialOverride: '555' }),
    ];
    // Search for the Part default material — should find Option 1
    const found = findScenario(scenarios, { material: 'Al 6061' }, 'Al 6061');
    expect(found?.unitPrice).toBe(10);
  });

  it('BUG FIX: finds scenario with materialOverride', () => {
    const scenarios = [
      mkScenario({ qty: 1, unitPrice: 10 }),
      mkScenario({ qty: 1, unitPrice: 11, materialOverride: 'PEEK' }),
    ];
    const found = findScenario(scenarios, { material: 'PEEK' }, 'Al 6061');
    expect(found?.unitPrice).toBe(11);
  });

  it('BUG FIX: finds scenario with no finishOverride using Part default', () => {
    const scenarios = [
      mkScenario({ qty: 1, unitPrice: 10 }),                                     // effective finish = "As-Machined"
      mkScenario({ qty: 1, unitPrice: 15, finishOverride: 'Anodize' }),
    ];
    const found = findScenario(scenarios, { finish: 'As-Machined' }, undefined, 'As-Machined');
    expect(found?.unitPrice).toBe(10);
  });

  it('findScenarios returns ALL matches for same cell', () => {
    const scenarios = [
      mkScenario({ qty: 1, unitPrice: 10, location: 'US' }),
      mkScenario({ qty: 1, unitPrice: 13, location: 'US' }),  // same location
      mkScenario({ qty: 1, unitPrice: 11, location: 'TW' }),
    ];
    const matches = findScenarios(scenarios, { location: 'US' });
    expect(matches).toHaveLength(2);
    expect(matches.map(m => m.unitPrice)).toEqual([10, 13]);
  });

  it('BUG FIX: multi-dim with mixed overrides finds all combos', () => {
    // The exact user scenario: TW with no material override, US with material "555"
    const scenarios = [
      mkScenario({ qty: 1, unitPrice: 10, location: 'TW' }),
      mkScenario({ qty: 1, unitPrice: 11, location: 'US', materialOverride: '555' }),
    ];
    // Should find TW option using Part default material
    const tw = findScenario(scenarios, { location: 'TW', material: 'steel' }, 'steel');
    expect(tw?.unitPrice).toBe(10);
    // Should find US option with override
    const us = findScenario(scenarios, { location: 'US', material: '555' }, 'steel');
    expect(us?.unitPrice).toBe(11);
  });

  it('BUG FIX: NONE consistency between getUniqueValues and findScenarios', () => {
    // When partMaterial is empty AND materialOverride is empty,
    // getUniqueValues returns NONE, findScenarios must also match NONE
    const scenarios = [
      mkScenario({ qty: 1, unitPrice: 20 }),  // no material at all
      mkScenario({ qty: 2, unitPrice: 50 }),
      mkScenario({ qty: 2, unitPrice: 60, materialOverride: '鈦' }),
    ];

    // getUniqueValues should include NONE for scenarios without material
    const matValues = getUniqueValues(scenarios, 'material'); // no partMaterial
    expect(matValues).toContain(NONE);

    // findScenarios with material=NONE must match the scenarios without override
    const matched = findScenarios(scenarios, { material: NONE });  // no partMaterial
    expect(matched.length).toBeGreaterThanOrEqual(1);
    expect(matched.map(m => m.unitPrice)).toContain(20);
  });

  it('BUG FIX: 4 options with 3 dims - all found via getUniqueValues+findScenarios round-trip', () => {
    // User scenario: 4 options, QTY×Material×Finish varying
    const scenarios = [
      mkScenario({ qty: 1, unitPrice: 20 }),  // defaults for material+finish
      mkScenario({ qty: 2, unitPrice: 50 }),   // defaults
      mkScenario({ qty: 2, unitPrice: 60, materialOverride: '鈦' }),
      mkScenario({ qty: 2, unitPrice: 90, materialOverride: '鎂', finishOverride: '標準' }),
    ];
    const partMaterial = '鋁 6061';
    const partFinish = '';

    const qtyVals = getUniqueValues(scenarios, 'qty', partMaterial, partFinish);
    const matVals = getUniqueValues(scenarios, 'material', partMaterial, partFinish);
    const finVals = getUniqueValues(scenarios, 'finish', partMaterial, partFinish);

    // Every scenario must be findable via its unique values
    let totalFound = 0;
    for (const q of qtyVals) {
      for (const m of matVals) {
        for (const f of finVals) {
          const matched = findScenarios(scenarios, { qty: q, material: m, finish: f }, partMaterial, partFinish);
          totalFound += matched.length;
        }
      }
    }
    // All 4 scenarios must be found exactly once
    expect(totalFound).toBe(4);
  });
});

/* ═══════════════════════════════════════════════════════════════
   6. EDGE CASES & UX SCENARIOS
   ═══════════════════════════════════════════════════════════════ */

describe('edge cases', () => {

  it('all scenarios identical → 0 varying (dedup scenario)', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38, location: 'TW' }),
      mkScenario({ qty: 10, unitPrice: 38, location: 'TW' }),
    ]);
    const analysis = analyzeDimensions(part);
    // Location is TW for both → not varying
    expect(analysis.varying).not.toContain('location');
    expect(analysis.fixed.location).toBe('TW');
  });

  it('one scenario has location, other does not → location VARIES', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38, location: 'TW' }),
      mkScenario({ qty: 10, unitPrice: 52 }), // no location
    ]);
    const analysis = analyzeDimensions(part);
    // TW vs undefined are DIFFERENT → location varies
    expect(analysis.varying).toContain('location');
  });

  it('mixed: Part 1 has location comparison, Part 2 has qty comparison', () => {
    const part1 = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 2, unitPrice: 159.92, location: 'US' }),
      mkScenario({ qty: 2, unitPrice: 105.75, location: 'TW' }),
    ]);
    const part2 = mkPart('Housing', 'Al 6061', [
      mkScenario({ qty: 1, unitPrice: 185 }),
      mkScenario({ qty: 10, unitPrice: 45 }),
    ]);
    const a1 = analyzeDimensions(part1);
    const a2 = analyzeDimensions(part2);
    expect(a1.varying).toContain('location');
    expect(a1.varying).not.toContain('qty');
    expect(a2.varying).toContain('qty');
    expect(a2.varying).not.toContain('location');
  });

  it('price zero is valid (free sample scenario)', () => {
    const part = mkPart('Sample', 'Al 6061', [
      mkScenario({ qty: 1, unitPrice: 0 }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toEqual([]);
    expect(analysis.fixed.qty).toBe(1);
  });

  it('very large number of scenarios (stress test)', () => {
    const scenarios: Scenario[] = [];
    for (let q = 1; q <= 5; q++) {
      for (const loc of ['TW', 'US'] as const) {
        for (const mat of ['Al', 'PEEK', 'Delrin']) {
          scenarios.push(mkScenario({
            qty: q * 10, unitPrice: Math.random() * 200,
            location: loc, materialOverride: mat,
          }));
        }
      }
    }
    // 5 * 2 * 3 = 30 scenarios
    const part = mkPart('Complex', 'Al', scenarios);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('qty');
    expect(analysis.varying).toContain('location');
    expect(analysis.varying).toContain('material');
    expect(analysis.varying.length).toBe(3);
    expect(selectLayout(analysis)).toBe('grouped_matrix');
  });
});

/* ═══════════════════════════════════════════════════════════════
   7. OVERRIDE vs PART DEFAULT CONFLICTS
   ═══════════════════════════════════════════════════════════════ */

describe('override vs Part default conflicts', () => {

  // --- Material override conflicts ---

  it('CONFLICT: some scenarios override material, some dont → material VARIES', () => {
    // Part default = "Al 6061", Option 1 has no override, Option 2 overrides to "PEEK"
    // Effective materials: "Al 6061" vs "PEEK" → DIFFERENT → varying
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38 }),                               // effective: "Al 6061"
      mkScenario({ qty: 10, unitPrice: 142, materialOverride: 'PEEK' }),     // effective: "PEEK"
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('material');
  });

  it('CONFLICT: override same as Part default → NOT varying', () => {
    // Part default = "Al 6061", Option 1 has no override, Option 2 overrides to "Al 6061"
    // Effective materials: "Al 6061" vs "Al 6061" → SAME → NOT varying
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38 }),
      mkScenario({ qty: 10, unitPrice: 38, materialOverride: 'Al 6061' }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).not.toContain('material');
  });

  it('CONFLICT: all override to same value ≠ Part default → fixed at override', () => {
    // Part default = "Al 6061", both override to "PEEK"
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 100, materialOverride: 'PEEK' }),
      mkScenario({ qty: 100, unitPrice: 80, materialOverride: 'PEEK' }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).not.toContain('material');
    expect(analysis.fixed.material).toBe('PEEK');
  });

  it('CONFLICT: no override, no Part material → no material shown', () => {
    const part = mkPart('Shaft', '', [
      mkScenario({ qty: 10, unitPrice: 38 }),
      mkScenario({ qty: 100, unitPrice: 22 }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).not.toContain('material');
    expect(analysis.fixed.material).toBeUndefined();
  });

  // --- Finish override conflicts ---

  it('CONFLICT: some scenarios override finish, some dont → finish VARIES', () => {
    const part = mkPart('Housing', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 45 }),                                     // effective: Part finish (undefined)
      mkScenario({ qty: 10, unitPrice: 52, finishOverride: 'Anodize Type II' }),   // effective: "Anodize Type II"
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('finish');
  });

  it('CONFLICT: Part has finish, some scenarios override differently → finish VARIES', () => {
    // Part default finish = "As-Machined", one override to "Anodize Type II"
    const part = mkPart('Housing', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 45 }),                                     // effective: "As-Machined"
      mkScenario({ qty: 10, unitPrice: 52, finishOverride: 'Anodize Type II' }),   // effective: "Anodize Type II"
    ], 'As-Machined');
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('finish');
  });

  it('CONFLICT: finish override same as Part default → NOT varying', () => {
    const part = mkPart('Housing', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 45 }),
      mkScenario({ qty: 10, unitPrice: 45, finishOverride: 'As-Machined' }),
    ], 'As-Machined');
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).not.toContain('finish');
  });

  // --- Location conflicts ---

  it('CONFLICT: some scenarios set location, some dont → location VARIES', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38, location: 'TW' }),
      mkScenario({ qty: 10, unitPrice: 52 }),  // no location
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('location');
  });

  // --- Combined conflicts ---

  it('CONFLICT: material override on one + finish override on other', () => {
    // Option 1: override material only. Option 2: override finish only.
    // Both should be detected as varying
    const part = mkPart('Housing', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 45, materialOverride: 'PEEK' }),
      mkScenario({ qty: 10, unitPrice: 52, finishOverride: 'Anodize' }),
    ], 'As-Machined');
    const analysis = analyzeDimensions(part);
    // material: "PEEK" vs "Al 6061" (Part default) → varies
    expect(analysis.varying).toContain('material');
    // finish: "As-Machined" (Part default) vs "Anodize" → varies
    expect(analysis.varying).toContain('finish');
  });
});

/* ═══════════════════════════════════════════════════════════════
   8. CONDITION LABEL WITH OVERRIDES
   ═══════════════════════════════════════════════════════════════ */

describe('condition labels with override/default conflicts', () => {

  it('material varies: scenario without override shows Part default in label', () => {
    const s = mkScenario({ qty: 10, unitPrice: 38 }); // no materialOverride
    const label = generateConditionLabel(s, ['material'], 'Al 6061', undefined);
    expect(label).toBe('Al 6061'); // falls back to Part default
  });

  it('material varies: scenario with override shows override in label', () => {
    const s = mkScenario({ qty: 10, unitPrice: 142, materialOverride: 'PEEK' });
    const label = generateConditionLabel(s, ['material'], 'Al 6061', undefined);
    expect(label).toBe('PEEK');
  });

  it('finish varies: scenario without override shows Part default in label', () => {
    const s = mkScenario({ qty: 10, unitPrice: 45 }); // no finishOverride
    const label = generateConditionLabel(s, ['finish'], 'Al', 'As-Machined');
    expect(label).toBe('As-Machined');
  });

  it('multi-dim with mixed overrides: full label', () => {
    // material varies + finish varies, this scenario has material override but no finish override
    const s = mkScenario({ qty: 10, unitPrice: 50, materialOverride: 'PEEK' });
    const label = generateConditionLabel(s, ['material', 'finish'], 'Al 6061', 'As-Machined');
    expect(label).toBe('PEEK, As-Machined');
  });
});

/* ═══════════════════════════════════════════════════════════════
   9. DEDUP EDGE CASES
   ═══════════════════════════════════════════════════════════════ */

describe('dedup-related edge cases in dimension engine', () => {

  it('same price, same qty, different conditions → both should be distinguishable', () => {
    const part = mkPart('Housing', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
      mkScenario({ qty: 10, unitPrice: 100, location: 'US' }),
    ]);
    const analysis = analyzeDimensions(part);
    // Even though prices are identical, location DOES vary
    expect(analysis.varying).toContain('location');
  });

  it('different price, same everything else → 0 varying dims (price is NOT a dimension)', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
      mkScenario({ qty: 10, unitPrice: 200, location: 'TW' }),
    ]);
    const analysis = analyzeDimensions(part);
    // No dimension differs → 0 varying
    // The price difference might be a mistake or different supplier, but dimension engine doesn't judge
    expect(analysis.varying).toEqual([]);
  });

  it('leadTime as only differentiator → leadTime varies', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 35, leadTimeDays: 25 }),
      mkScenario({ qty: 10, unitPrice: 48, leadTimeDays: 15 }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('leadTime');
    expect(analysis.varying.length).toBe(1);
  });

  it('leadTime differs WITH location → leadTime NOT added (explained by location)', () => {
    const part = mkPart('Shaft', 'Al 6061', [
      mkScenario({ qty: 10, unitPrice: 38, location: 'TW', leadTimeDays: 20 }),
      mkScenario({ qty: 10, unitPrice: 52, location: 'US', leadTimeDays: 10 }),
    ]);
    const analysis = analyzeDimensions(part);
    expect(analysis.varying).toContain('location');
    expect(analysis.varying).not.toContain('leadTime');
  });
});
