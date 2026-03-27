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
      scenarios: [mkScenario({ qty: 1, unitPrice: 0 })],
    }]));
    expect(result.isValid).toBe(false);
    expect(errorsOf(result)).toContain('unitPrice');
  });

  it('price < 0 → error', () => {
    const result = validateQuote(mkQuote([{
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
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
        mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
      ],
    }]));
    expect(warningsOf(result)).toContain('_duplicate');
  });

  it('same dimensions but different prices → NOT duplicate, but collision warning', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
        mkScenario({ qty: 10, unitPrice: 200, location: 'TW' }),
      ],
    }]));
    expect(warningsOf(result)).not.toContain('_duplicate');
    // Should warn about collision (same fingerprint, different price, no label)
    expect(warningsOf(result)).toContain('_collision');
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
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100 }),
        mkScenario({ qty: 10, unitPrice: 200 }),
      ],
    }]));
    expect(warningsOf(result)).toContain('_collision');
  });

  it('different prices, different labels → no collision (labels create different fingerprints)', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, customLabel: 'Supplier A' }),
        mkScenario({ qty: 10, unitPrice: 200, customLabel: 'Supplier B' }),
      ],
    }]));
    // Different labels → different fingerprints → no collision
    expect(warningsOf(result)).not.toContain('_collision');
  });

  it('BUG FIX: collision detected even when OTHER scenarios create varying dims', () => {
    const result = validateQuote(mkQuote([{
      name: 'Cleaner', material: 'Al 6061',
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 10, location: 'US' }),
        mkScenario({ qty: 1, unitPrice: 11, location: 'TW', materialOverride: '鈦' }),
        mkScenario({ qty: 1, unitPrice: 13, location: 'US' }),  // same fingerprint as Opt1
      ],
    }]));
    expect(warningsOf(result)).toContain('_collision');
  });

  it('same fingerprint, same price → no collision (already caught by duplicate)', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'US' }),
        mkScenario({ qty: 10, unitPrice: 100, location: 'US' }),
      ],
    }]));
    expect(warningsOf(result)).toContain('_duplicate');
    expect(warningsOf(result)).not.toContain('_collision');
  });

  it('one has label, other doesnt → different fingerprints → no collision', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'US', customLabel: 'Fast' }),
        mkScenario({ qty: 10, unitPrice: 200, location: 'US' }),
      ],
    }]));
    // Different labels (one has, one empty) → different fingerprints → no collision
    expect(warningsOf(result)).not.toContain('_collision');
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
    expect(warningsOf(result)).not.toContain('_collision');
  });

  it('same everything including leadTime but different price → collision', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [
        mkScenario({ qty: 2, unitPrice: 20, leadTimeDays: 20, location: 'US' }),
        mkScenario({ qty: 2, unitPrice: 30, leadTimeDays: 20, location: 'US' }),  // truly same
      ],
    }]));
    expect(warningsOf(result)).toContain('_collision');
  });

  it('same dims, same leadTime, same label, different price → collision', () => {
    const result = validateQuote(mkQuote([{
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, customLabel: 'Same Label' }),
        mkScenario({ qty: 10, unitPrice: 200, customLabel: 'Same Label' }),
      ],
    }]));
    expect(warningsOf(result)).toContain('_collision');
  });
});

/* ═══════════════════════════════════════════════════════════════
   3B. V2-SPECIFIC: enabledDimensions-aware validation
   ═══════════════════════════════════════════════════════════════ */

describe('v2: enabledDimensions-aware collision/duplicate', () => {

  it('no dims enabled, same price → duplicate', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100 }),
        mkScenario({ qty: 10, unitPrice: 100 }),  // different qty but qty NOT enabled
      ],
    }]));
    expect(warningsOf(result)).toContain('_duplicate');
  });

  it('no dims enabled, different price → collision (need label)', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100 }),
        mkScenario({ qty: 5, unitPrice: 200 }),
      ],
    }]));
    expect(warningsOf(result)).toContain('_collision');
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

  it('hidden dimension differs but not enabled → still duplicate', () => {
    // Location differs but Location is NOT in enabledDimensions → invisible to user
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100, location: 'TW' }),
        mkScenario({ qty: 5, unitPrice: 100, location: 'US' }),
      ],
    }]));
    expect(warningsOf(result)).toContain('_duplicate');
  });

  it('label distinguishes options even when no dims enabled', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100, customLabel: 'Rush' }),
        mkScenario({ qty: 5, unitPrice: 200, customLabel: 'Standard' }),
      ],
    }]));
    expect(warningsOf(result)).not.toContain('_collision');
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

  it('collision hint suggests enabling dims when none are enabled', () => {
    const result = validateQuote(mkQuote([{
      enabledDimensions: [],
      scenarios: [
        mkScenario({ qty: 5, unitPrice: 100 }),
        mkScenario({ qty: 5, unitPrice: 200 }),
      ],
    }]));
    const collisionMsg = result.errors.find(e => e.field === '_collision')?.message ?? '';
    expect(collisionMsg).toContain('Enable a Compare dimension');
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
      scenarios: [mkScenario({ qty: 10, unitPrice: 45.50 })],
    }]));
    expect(result.isValid).toBe(true);
    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('multi-part multi-scenario → valid', () => {
    const result = validateQuote(mkQuote([
      {
        name: 'Shaft', material: 'Al 6061',
        scenarios: [
          mkScenario({ qty: 2, unitPrice: 159.92, location: 'US' }),
          mkScenario({ qty: 2, unitPrice: 105.75, location: 'TW' }),
        ],
      },
      {
        name: 'Housing', material: 'Al 6061',
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
    const result = validateQuote(mkQuote([{
      name: '',
      material: '',
      scenarios: [mkScenario({ qty: 0, unitPrice: -1 })],
    }]));
    const partPath = result.errors.find(e => e.field === 'name')?.path;
    if (partPath) {
      const partErrors = result.getErrors(partPath);
      expect(partErrors.length).toBeGreaterThanOrEqual(2); // name + material
      const nameErrors = result.getErrors(partPath, 'name');
      expect(nameErrors).toHaveLength(1);
    }
  });
});
