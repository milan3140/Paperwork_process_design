/**
 * Validation Engine — Comprehensive Tests
 */

import { describe, it, expect } from 'vitest';
import { validateQuote, type ValidationResult } from '../validation';
import type { QuoteBuilderData, Scenario, QuotePart } from '../types';

/* ── Helpers ── */

function mkScenario(overrides: Partial<Scenario> & { qty: number; unitPrice: number }): Scenario {
  return { id: `s${Math.random()}`, leadTimeDays: 20, ...overrides };
}

function mkQuote(parts: Partial<QuotePart>[]): QuoteBuilderData {
  return {
    quoteId: 'Q001',
    date: 'March 25, 2026',
    validDays: 30,
    customer: { companyName: 'Acme', contactName: 'John', billingAddress: { street: '', city: '', state: '', postalCode: '', country: '' }, shippingAddress: { street: '', city: '', state: '', postalCode: '', country: '' }, shippingSameAsBilling: true },
    coverLetterStrategy: 'standard',
    parts: parts.map(p => ({
      id: p.id || `p${Math.random()}`,
      name: p.name ?? 'Part',           // use ?? to allow explicit empty string
      qty: p.qty ?? 1,
      material: p.material ?? 'Al 6061',
      leadTimeDays: p.leadTimeDays ?? 20,
      finish: p.finish,
      enabledDimensions: p.enabledDimensions ?? [],
      customDimensions: p.customDimensions,
      scenarios: p.scenarios || [mkScenario({ qty: 1, unitPrice: 100 })],
    })),
    leadTimeDays: 20,
    manufacturingNotes: ['Quoted with standard inspection'],
    extraNotes: [],
    sections: {
      leadTime: { label: 'Lead Time', content: 'Standard: ship in {leadTime} workdays.' },
      shipping: { label: 'Shipping', content: 'Shipping not included.' },
      paymentTerms: { label: 'Payment Terms', content: 'USD only\nUpfront payment' },
      terms: { label: 'Terms & Conditions', content: 'Standard terms.' },
    },
  };
}

function errorsOf(result: ValidationResult): string[] {
  return result.errors.filter(e => e.severity === 'error').map(e => e.field);
}

function warningsOf(result: ValidationResult): string[] {
  return result.errors.filter(e => e.severity === 'warning').map(e => e.field);
}

/* ═══════════════════════════════════════════════════════════════
   1. SCENARIO-LEVEL VALIDATION
   ═══════════════════════════════════════════════════════════════ */

describe('scenario validation', () => {

  it('price = 0 → error', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 1, unitPrice: 0 })],
    }]));
    expect(result.isValid).toBe(false);
    expect(errorsOf(result)).toContain('unitPrice');
  });

  it('price < 0 → error', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 1, unitPrice: -5 })],
    }]));
    expect(result.isValid).toBe(false);
    expect(errorsOf(result)).toContain('unitPrice');
  });

  it('price = 0.01 → valid (no error)', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [mkScenario({ qty: 1, unitPrice: 0.01 })],
    }]));
    expect(errorsOf(result)).not.toContain('unitPrice');
  });

  it('price > 100000 → warning (not error)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 1, unitPrice: 150000 })],
    }]));
    expect(result.isValid).toBe(true); // warnings don't block
    expect(warningsOf(result)).toContain('unitPrice');
  });

  it('qty = 0 → error (when qty compare enabled)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 0, unitPrice: 100 })],
    }]));
    expect(errorsOf(result)).toContain('qty');
  });

  it('qty < 0 → error (when qty compare enabled)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: -1, unitPrice: 100 })],
    }]));
    expect(errorsOf(result)).toContain('qty');
  });

  it('qty = 1.5 (non-integer) → error (when qty compare enabled)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 1.5, unitPrice: 100 })],
    }]));
    expect(errorsOf(result)).toContain('qty');
  });

  it('qty = 1000001 → warning (when qty compare enabled)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 1000001, unitPrice: 100 })],
    }]));
    expect(warningsOf(result)).toContain('qty');
  });

  it('qty not validated at scenario level when qty compare disabled', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [mkScenario({ qty: 0, unitPrice: 100 })],
    }]));
    // Scenario-level qty error should NOT fire; Part-level qty is separate
    const scenarioQtyErrors = result.errors.filter(e => e.path.startsWith('scenario:') && e.field === 'qty');
    expect(scenarioQtyErrors).toHaveLength(0);
  });

  it('leadTimeDays = 0 → error (when leadTime compare enabled)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['leadTime'],
      scenarios: [{ id: 's1', qty: 1, unitPrice: 100, leadTimeDays: 0 }],
    }]));
    expect(errorsOf(result)).toContain('leadTimeDays');
  });

  it('leadTimeDays < 0 → error (when leadTime compare enabled)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['leadTime'],
      scenarios: [{ id: 's1', qty: 1, unitPrice: 100, leadTimeDays: -5 }],
    }]));
    expect(errorsOf(result)).toContain('leadTimeDays');
  });

  it('leadTimeDays = 1.5 (non-integer) → error (when leadTime compare enabled)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['leadTime'],
      scenarios: [{ id: 's1', qty: 1, unitPrice: 100, leadTimeDays: 1.5 }],
    }]));
    expect(errorsOf(result)).toContain('leadTimeDays');
  });

  it('leadTimeDays > 365 → warning (when leadTime compare enabled)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['leadTime'],
      scenarios: [{ id: 's1', qty: 1, unitPrice: 100, leadTimeDays: 400 }],
    }]));
    expect(warningsOf(result)).toContain('leadTimeDays');
  });

  it('valid scenario → no errors', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 10, unitPrice: 45.50 })],
    }]));
    expect(result.isValid).toBe(true);
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   2. PART-LEVEL VALIDATION
   ═══════════════════════════════════════════════════════════════ */

describe('part validation', () => {

  it('empty part name → error', () => {
    const result = validateQuote(mkQuote([{
      name: '',
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }]));
    expect(errorsOf(result)).toContain('name');
  });

  it('whitespace-only part name → error', () => {
    const result = validateQuote(mkQuote([{
      name: '   ',
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }]));
    expect(errorsOf(result)).toContain('name');
  });

  it('empty material → error', () => {
    const result = validateQuote(mkQuote([{
      material: '',
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }]));
    expect(errorsOf(result)).toContain('material');
  });

  it('no scenarios → error', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [],
    }]));
    expect(errorsOf(result)).toContain('scenarios');
  });

  it('duplicate part names → warning', () => {
    const result = validateQuote(mkQuote([
      { name: 'Housing' },
      { name: 'Housing' },
    ]));
    expect(warningsOf(result)).toContain('name');
  });

  it('duplicate part names case-insensitive → warning', () => {
    const result = validateQuote(mkQuote([
      { name: 'Housing' },
      { name: 'housing' },
    ]));
    expect(warningsOf(result)).toContain('name');
  });
});

/* ═══════════════════════════════════════════════════════════════
   3. CROSS-SCENARIO VALIDATION
   ═══════════════════════════════════════════════════════════════ */

describe('cross-scenario validation', () => {

  it('fully identical scenarios → warning (duplicate)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty', 'location'],
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
        mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
      ],
    }]));
    expect(warningsOf(result)).toContain('_duplicate');
  });

  it('same dimensions but different prices → NOT duplicate, but collision warning', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty', 'location'],
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
        mkScenario({ qty: 10, unitPrice: 200, location: 'TW' }),
      ],
    }]));
    expect(warningsOf(result)).not.toContain('_duplicate');
    // Should warn about collision (same fingerprint, different price, no label)
    expect(errorsOf(result)).toContain('_collision');
  });

  it('same qty+price but different location → NOT duplicate when location enabled', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['location'],
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
        mkScenario({ qty: 10, unitPrice: 100, location: 'US' }),
      ],
    }]));
    expect(warningsOf(result)).not.toContain('_duplicate');
  });

  it('different prices, no varying dimension, no label → collision warning', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100 }),
        mkScenario({ qty: 10, unitPrice: 200 }),
      ],
    }]));
    expect(errorsOf(result)).toContain('_collision');
  });

  it('different prices, different labels → no collision (labels create different fingerprints)', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, customLabel: 'Supplier A' }),
        mkScenario({ qty: 10, unitPrice: 200, customLabel: 'Supplier B' }),
      ],
    }]));
    // Different labels → different fingerprints → no collision
    expect(errorsOf(result)).not.toContain('_collision');
  });

  it('BUG FIX: collision detected even when OTHER scenarios create varying dims', () => {
    const result = validateQuote(mkQuote([{
      name: 'Cleaner', material: 'Al 6061',
      enabledDimensions: ['location', 'material'],
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 10, location: 'US' }),
        mkScenario({ qty: 1, unitPrice: 11, location: 'TW', materialOverride: '鈦' }),
        mkScenario({ qty: 1, unitPrice: 13, location: 'US' }),  // same fingerprint as Opt1
      ],
    }]));
    expect(errorsOf(result)).toContain('_collision');
  });

  it('same fingerprint, same price → no collision (already caught by duplicate)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty', 'location'],
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'US' }),
        mkScenario({ qty: 10, unitPrice: 100, location: 'US' }),
      ],
    }]));
    expect(warningsOf(result)).toContain('_duplicate');
    expect(errorsOf(result)).not.toContain('_collision');
  });

  it('custom dim distinguishes otherwise-identical options → no collision', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty', 'location', 'custom:cd1' as any],
      customDimensions: [{ id: 'cd1', name: 'Priority' }],
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'US', customDimValues: { cd1: 'Fast' } }),
        mkScenario({ qty: 10, unitPrice: 200, location: 'US', customDimValues: { cd1: 'Normal' } }),
      ],
    }]));
    expect(errorsOf(result)).not.toContain('_collision');
  });

  it('BUG FIX: different leadTime → NOT collision when leadTime+qty enabled', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty', 'leadTime'],
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 10 }),
        mkScenario({ qty: 2, unitPrice: 20, leadTimeDays: 20 }),
        mkScenario({ qty: 2, unitPrice: 30, leadTimeDays: 21 }),  // different leadTime!
      ],
    }]));
    // leadTime differs → different fingerprints → NO collision
    expect(errorsOf(result)).not.toContain('_collision');
  });

  it('same everything including leadTime but different price → collision', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty', 'location'],
      scenarios: [
        mkScenario({ qty: 2, unitPrice: 20, leadTimeDays: 20, location: 'US' }),
        mkScenario({ qty: 2, unitPrice: 30, leadTimeDays: 20, location: 'US' }),  // truly same
      ],
    }]));
    expect(errorsOf(result)).toContain('_collision');
  });

  it('same dims, same leadTime, same label, different price → collision', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, customLabel: 'Same Label' }),
        mkScenario({ qty: 10, unitPrice: 200, customLabel: 'Same Label' }),
      ],
    }]));
    expect(errorsOf(result)).toContain('_collision');
  });
});

/* ═══════════════════════════════════════════════════════════════
   3B. V2-SPECIFIC: enabledDimensions-aware validation
   ═══════════════════════════════════════════════════════════════ */

describe('v2: enabledDimensions-aware collision/duplicate', () => {

  it('no dims enabled → progressive validation skips scenarios (only enabledDimensions error)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100 }),
        mkScenario({ qty: 10, unitPrice: 100 }),
      ],
    }]));
    // Progressive: enabledDimensions empty → scenario validation skipped
    expect(errorsOf(result)).toContain('enabledDimensions');
    expect(warningsOf(result)).not.toContain('_duplicate');
    expect(errorsOf(result)).not.toContain('_collision');
  });

  it('no dims enabled, different price → only enabledDimensions error (no collision)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100 }),
        mkScenario({ qty: 5, unitPrice: 200 }),
      ],
    }]));
    // Progressive: scenarios not visible, so collision not reported
    expect(errorsOf(result)).toContain('enabledDimensions');
    expect(errorsOf(result)).not.toContain('_collision');
  });

  it('qty enabled, different qty → NOT duplicate even with same price', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['qty'],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100 }),
        mkScenario({ qty: 10, unitPrice: 100 }),
      ],
    }]));
    expect(warningsOf(result)).not.toContain('_duplicate');
  });

  it('hidden dimension differs but not enabled → progressive skips scenarios', () => {
    // Location differs but enabledDimensions is empty → scenario validation skipped entirely
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100, location: 'TW' }),
        mkScenario({ qty: 5, unitPrice: 100, location: 'US' }),
      ],
    }]));
    expect(errorsOf(result)).toContain('enabledDimensions');
    expect(warningsOf(result)).not.toContain('_duplicate');
  });

  it('custom dimension distinguishes options when enabled', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: ['custom:cd1' as any],
      customDimensions: [{ id: 'cd1', name: 'Priority' }],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100, customDimValues: { cd1: 'Rush' } }),
        mkScenario({ qty: 5, unitPrice: 200, customDimValues: { cd1: 'Standard' } }),
      ],
    }]));
    expect(errorsOf(result)).not.toContain('_collision');
  });

  it('Part-level qty = 0 → Part error (not scenario error)', () => {
    const result = validateQuote(mkQuote([{
      qty: 0,
      enabledDimensions: [],
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }]));
    const partQtyErrors = result.errors.filter(e => e.path.startsWith('part:') && e.field === 'qty');
    expect(partQtyErrors.length).toBeGreaterThan(0);
  });

  it('Part-level leadTimeDays = 0 → Part error', () => {
    const result = validateQuote(mkQuote([{
      leadTimeDays: 0,
      enabledDimensions: [],
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }]));
    const partLeadErrors = result.errors.filter(e => e.path.startsWith('part:') && e.field === 'leadTimeDays');
    expect(partLeadErrors.length).toBeGreaterThan(0);
  });

  it('no dims enabled → progressive validation only reports enabledDimensions error', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100 }),
        mkScenario({ qty: 5, unitPrice: 200 }),
      ],
    }]));
    // Progressive: no collision check when dims empty — only the enabledDimensions error
    expect(errorsOf(result)).toContain('enabledDimensions');
    expect(result.errors.find(e => e.field === '_collision')).toBeUndefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
   3C. PROGRESSIVE VALIDATION (only validate visible fields)
   ═══════════════════════════════════════════════════════════════ */

describe('progressive validation', () => {

  it('empty name → only name error, skips material/scenario validation', () => {
    const result = validateQuote(mkQuote([{
      name: '',
      material: '',
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 0, unitPrice: -1 })],
    }]));
    const partErrors = result.errors.filter(e => e.path.startsWith('part:'));
    expect(partErrors).toHaveLength(1);
    expect(partErrors[0].field).toBe('name');
  });

  it('name filled but no Compare → name ok + metadata errors + enabledDimensions error, no scenario errors', () => {
    const result = validateQuote(mkQuote([{
      name: 'Test',
      material: '',
      enabledDimensions: [],
      scenarios: [mkScenario({ qty: 1, unitPrice: 0 })],
    }]));
    expect(errorsOf(result)).toContain('material');
    expect(errorsOf(result)).toContain('enabledDimensions');
    // Scenario-level unitPrice=0 should NOT be reported (Options not visible)
    const scenarioErrors = result.errors.filter(e => e.path.startsWith('scenario:'));
    expect(scenarioErrors).toHaveLength(0);
  });

  it('name filled + Compare enabled → full validation including scenarios', () => {
    const result = validateQuote(mkQuote([{
      name: 'Test',
      material: 'Al 6061',
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 1, unitPrice: 0 })],
    }]));
    expect(errorsOf(result)).toContain('unitPrice');
  });
});

/* ═══════════════════════════════════════════════════════════════
   4. QUOTE-LEVEL VALIDATION
   ═══════════════════════════════════════════════════════════════ */

describe('quote-level validation', () => {

  it('empty quote ID → error', () => {
    const quote = mkQuote([{}]);
    quote.quoteId = '';
    const result = validateQuote(quote);
    expect(errorsOf(result)).toContain('quoteId');
  });

  it('empty date → error', () => {
    const quote = mkQuote([{}]);
    quote.date = '';
    const result = validateQuote(quote);
    expect(errorsOf(result)).toContain('date');
  });

  it('validDays = 0 → error', () => {
    const quote = mkQuote([{}]);
    quote.validDays = 0;
    const result = validateQuote(quote);
    expect(errorsOf(result)).toContain('validDays');
  });

  it('leadTimeDays = 0 (quote level) → error', () => {
    const quote = mkQuote([{}]);
    quote.leadTimeDays = 0;
    const result = validateQuote(quote);
    expect(errorsOf(result)).toContain('leadTimeDays');
  });

  it('custom cover letter selected but empty → error', () => {
    const quote = mkQuote([{}]);
    quote.coverLetterStrategy = 'custom';
    quote.coverLetterCustom = '';
    const result = validateQuote(quote);
    expect(errorsOf(result)).toContain('coverLetterCustom');
  });

  it('custom cover letter with content → no error', () => {
    const quote = mkQuote([{}]);
    quote.coverLetterStrategy = 'custom';
    quote.coverLetterCustom = 'Hello customer';
    const result = validateQuote(quote);
    expect(errorsOf(result)).not.toContain('coverLetterCustom');
  });

  it('empty manufacturing note → warning', () => {
    const quote = mkQuote([{}]);
    quote.manufacturingNotes = ['Valid note', ''];
    const result = validateQuote(quote);
    expect(warningsOf(result)).toContain('note:1');
  });

  it('no parts → error', () => {
    const quote = mkQuote([]);
    const result = validateQuote(quote);
    expect(errorsOf(result)).toContain('parts');
  });
});

/* ═══════════════════════════════════════════════════════════════
   5. VALID QUOTE — HAPPY PATH
   ═══════════════════════════════════════════════════════════════ */

describe('valid quotes', () => {

  it('simple valid quote → no errors', () => {
    const result = validateQuote(mkQuote([{
      name: 'Shaft Assembly',
      material: 'Al 6061-T6',
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 10, unitPrice: 45.50 })],
    }]));
    expect(result.isValid).toBe(true);
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('multi-part multi-scenario → valid', () => {
    const result = validateQuote(mkQuote([
      {
        name: 'Shaft', material: 'Al 6061',
        enabledDimensions: ['location'],
        scenarios: [
          mkScenario({ qty: 2, unitPrice: 159.92, location: 'US' }),
          mkScenario({ qty: 2, unitPrice: 105.75, location: 'TW' }),
        ],
      },
      {
        name: 'Housing', material: 'Al 6061',
        enabledDimensions: ['qty'],
        scenarios: [
          mkScenario({ qty: 1, unitPrice: 185 }),
          mkScenario({ qty: 10, unitPrice: 45 }),
          mkScenario({ qty: 100, unitPrice: 31 }),
        ],
      },
    ]));
    expect(result.isValid).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════
   6. HELPER METHODS
   ═══════════════════════════════════════════════════════════════ */

describe('validation result helpers', () => {

  it('hasError returns true for error fields', () => {
    const result = validateQuote(mkQuote([{
      name: '',
      scenarios: [mkScenario({ qty: 1, unitPrice: -5 })],
    }]));
    const nameError = result.errors.find(e => e.field === 'name' && e.severity === 'error');
    expect(nameError).toBeDefined();
    expect(result.hasError(nameError!.path, 'name')).toBe(true);
  });

  it('hasError returns false for warnings', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [mkScenario({ qty: 1, unitPrice: 150000 })],
    }]));
    // price > 100k is a warning, not error
    const scenarioPath = result.errors.find(e => e.field === 'unitPrice')?.path;
    if (scenarioPath) {
      expect(result.hasError(scenarioPath, 'unitPrice')).toBe(false);
    }
  });

  it('getErrors filters by path and field', () => {
    // Progressive: name filled so metadata validation runs; enabledDimensions set so scenarios run
    const result = validateQuote(mkQuote([{
      name: 'Test',
      material: '',
      enabledDimensions: ['qty'],
      scenarios: [mkScenario({ qty: 0, unitPrice: -1 })],
    }]));
    const partPath = result.errors.find(e => e.field === 'material')?.path;
    if (partPath) {
      const partErrors = result.getErrors(partPath);
      expect(partErrors.length).toBeGreaterThanOrEqual(1); // material + enabledDimensions etc
      const materialErrors = result.getErrors(partPath, 'material');
      expect(materialErrors).toHaveLength(1);
    }
  });
});
