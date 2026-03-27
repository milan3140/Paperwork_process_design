/**
 * Email Renderer — Comprehensive Tests
 *
 * Tests all email output scenarios including:
 * - All 3 observed email formats (single, qty comparison, location comparison)
 * - Cover letter strategies
 * - Fixed section content accuracy
 * - Deduplication of identical scenarios
 * - Multi-dimensional combinations
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import { renderEmail } from '../emailRenderer';
import type { QuoteBuilderData, QuotePart, Scenario } from '../types';

/* ── Helpers ── */

function mkScenario(overrides: Partial<Scenario> & { qty: number; unitPrice: number }): Scenario {
  return { id: `s${Math.random()}`, leadTimeDays: 20, ...overrides };
}

/** Accept partial parts — fills in qty, leadTimeDays, enabledDimensions defaults */
function mkQuote(rawParts: Partial<QuotePart>[], overrides?: Partial<QuoteBuilderData>): QuoteBuilderData {
  const parts: QuotePart[] = rawParts.map(p => ({
    qty: 1, leadTimeDays: 20, enabledDimensions: [],
    id: p.id || `p${Math.random()}`, name: p.name ?? '', material: p.material ?? '',
    finish: p.finish, scenarios: p.scenarios || [],
    ...p,
  }));
  return {
    quoteId: 'Q2603251A',
    date: 'March 25, 2026',
    validDays: 30,
    customer: { companyName: 'Acme Corp', contactName: 'John Smith', billingAddress: { street: '', city: '', state: '', postalCode: '', country: '' }, shippingAddress: { street: '', city: '', state: '', postalCode: '', country: '' }, shippingSameAsBilling: true },
    coverLetterStrategy: 'standard',
    parts,
    leadTimeDays: 20,
    manufacturingNotes: ['Quoted with standard inspection'],
    extraNotes: [],
    sections: {
      leadTime: { label: 'Lead Time', content: 'Standard: ship in {leadTime} after order confirmation & payment.' },
      shipping: { label: 'Shipping', content: 'Shipping is not included. We can charge separately or ship via your carrier account.' },
      paymentTerms: { label: 'Payment Terms', content: 'All quoted prices are in U.S. dollars\nFull upfront payment required before production\nWire, Credit Card (3% fee), ACH (U.S. domestic only)' },
      terms: { label: 'Terms & Conditions', content: 'Standard terms apply.' },
    },
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════════════
   1. EMAIL FORMAT — MATCHING REAL SCREENSHOTS
   ═══════════════════════════════════════════════════════════════ */

describe('email format matches screenshots', () => {

  it('Email_0 format: single part, single price (Macor $95 @ QTY 5)', () => {
    const quote = mkQuote([{
      id: 'p1', name: '10.-ZS_Tip-Alumina-Washer-v3', material: 'Macor',
      scenarios: [mkScenario({ qty: 5, unitPrice: 95 })],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('Line #1');
    expect(email).toContain('Part: 10.-ZS_Tip-Alumina-Washer-v3');
    expect(email).toContain('Material: Macor');
    expect(email).toContain('95.00 ea @ QTY 5');
  });

  it('Email_1 format: single part, qty comparison (QTY 1 $1600, QTY 2 $950)', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Macor_Insulator_v1.step', material: 'Macor',
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 1600, leadTimeDays: 23 }),
        mkScenario({ qty: 2, unitPrice: 950, leadTimeDays: 23 }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('1,600.00 ea @ QTY 1');
    expect(email).toContain('950.00 ea @ QTY 2');
    // Both should be present as separate lines
    const priceLines = email.split('\n').filter(l => l.includes('ea @ QTY'));
    expect(priceLines.length).toBe(2);
  });

  it('Email_2 format: 5 parts, location comparison (US vs Taiwan)', () => {
    const parts: Partial<QuotePart>[] = [
      { id: 'p1', name: '21952 | LPK Mirror Azi Push Tab', material: 'Aluminum 6061-T6', finish: 'As-Machined',
        scenarios: [
          mkScenario({ qty: 2, unitPrice: 159.92, location: 'US', leadTimeDays: 15 }),
          mkScenario({ qty: 2, unitPrice: 105.75, location: 'TW', leadTimeDays: 20 }),
        ]},
      { id: 'p2', name: '21956 | MIRROR CELL', material: 'Aluminum 6061-T6', finish: 'As-Machined',
        scenarios: [
          mkScenario({ qty: 2, unitPrice: 1302.78, location: 'US', leadTimeDays: 15 }),
          mkScenario({ qty: 2, unitPrice: 854.92, location: 'TW', leadTimeDays: 20 }),
        ]},
    ];
    const quote = mkQuote(parts, { coverLetterStrategy: 'dual_location' });
    const email = renderEmail(quote);

    // Location labels
    expect(email).toContain('U.S. manufacturing');
    expect(email).toContain('Taiwan manufacturing');
    // Prices
    expect(email).toContain('159.92');
    expect(email).toContain('105.75');
    expect(email).toContain('1,302.78');
    expect(email).toContain('854.92');
    // Material shown at Part level (not varying)
    expect(email).toContain('Material: Aluminum 6061-T6');
    // Finish shown at Part level
    expect(email).toContain('Finish: As-Machined');
  });
});

/* ═══════════════════════════════════════════════════════════════
   2. COVER LETTER STRATEGIES
   ═══════════════════════════════════════════════════════════════ */

describe('cover letter strategies', () => {

  it('standard: includes "engineering team has reviewed"', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('engineering team has reviewed');
  });

  it('target_price: includes "target lead time and target pricing"', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Macor',
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }], { coverLetterStrategy: 'target_price' });
    const email = renderEmail(quote);
    expect(email).toContain('target lead time and target pricing');
    expect(email).toContain('realistic balance');
  });

  it('dual_location: includes "U.S. and Taiwan facilities"', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }], { coverLetterStrategy: 'dual_location' });
    const email = renderEmail(quote);
    expect(email).toContain('U.S. and Taiwan facilities');
  });

  it('custom: uses custom text', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }], { coverLetterStrategy: 'custom', coverLetterCustom: 'Hello World Custom' });
    const email = renderEmail(quote);
    expect(email).toContain('Hello World Custom');
    expect(email).not.toContain('engineering team');
  });

  it('standard with single material: includes material name', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Macor',
      scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('Macor machining capabilities');
  });
});

/* ═══════════════════════════════════════════════════════════════
   3. FIXED SECTIONS — EXACT TEXT VERIFICATION
   ═══════════════════════════════════════════════════════════════ */

describe('fixed sections match real email text', () => {

  const quote = mkQuote([{
    id: 'p1', name: 'Part', material: 'Al',
    scenarios: [mkScenario({ qty: 1, unitPrice: 100 })],
  }]);
  const email = renderEmail(quote);

  it('has Proposal ID header', () => {
    expect(email).toContain('========== Proposal ID: Q2603251A | Date: March 25, 2026 ==========');
  });

  it('has Manufacturing Note', () => {
    expect(email).toContain('Manufacturing Note');
    expect(email).toContain('Quoted with standard inspection');
  });

  it('has Lead Time section', () => {
    expect(email).toContain('Lead Time');
    expect(email).toContain('workdays after order confirmation & payment');
  });

  it('has Shipping section', () => {
    expect(email).toContain('Shipping');
    expect(email).toContain('not included');
    expect(email).toContain('carrier account');
  });

  it('has Payment Terms', () => {
    expect(email).toContain('Payment Terms');
    expect(email).toContain('U.S. dollars');
    expect(email).toContain('upfront payment');
    expect(email).toContain('Wire');
    expect(email).toContain('Credit Card');
  });

  it('has closing CTA', () => {
    expect(email).toContain('formal PDF quote');
    expect(email).toContain('online invoice');
  });

  it('has separator lines', () => {
    const separators = email.split('\n').filter(l => l.includes('— — —'));
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });
});

/* ═══════════════════════════════════════════════════════════════
   4. DIMENSION-AWARE OUTPUT
   ═══════════════════════════════════════════════════════════════ */

describe('dimension-aware rendering', () => {

  it('material comparison: material NOT shown at Part level', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Shaft', material: 'Al 6061',
      scenarios: [
        mkScenario({ qty: 100, unitPrice: 28, materialOverride: 'Aluminum 6061-T6' }),
        mkScenario({ qty: 100, unitPrice: 142, materialOverride: 'PEEK' }),
      ],
    }]);
    const email = renderEmail(quote);
    // Material should NOT appear as "Material: Al 6061" at part level
    // Instead it should be in the condition labels
    expect(email).toContain('(Aluminum 6061-T6)');
    expect(email).toContain('(PEEK)');
    // Check it doesn't show "Material: Al 6061" between Part name and Unit Price
    const lines = email.split('\n');
    const partLineIdx = lines.findIndex(l => l.includes('Part: Shaft'));
    const priceLineIdx = lines.findIndex(l => l.includes('Unit Price'));
    const between = lines.slice(partLineIdx + 1, priceLineIdx);
    const hasMaterialLine = between.some(l => l.trim().startsWith('• Material:'));
    expect(hasMaterialLine).toBe(false);
  });

  it('finish comparison: finish NOT shown at Part level', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Housing', material: 'Al 6061', finish: 'As-Machined',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 45, finishOverride: 'As-Machined' }),
        mkScenario({ qty: 10, unitPrice: 52, finishOverride: 'Anodize Type II' }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('(As-Machined)');
    expect(email).toContain('(Anodize Type II)');
  });

  it('BUG FIX: uniform materialOverride shows override, not Part default', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Part Default Material',
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 100, materialOverride: 'Override Material', finishOverride: 'Finish A' }),
        mkScenario({ qty: 1, unitPrice: 100, materialOverride: 'Override Material', finishOverride: 'Finish B' }),
      ],
    }]);
    const email = renderEmail(quote);
    // Should show the uniform override, NOT the Part default
    expect(email).toContain('Material: Override Material');
    expect(email).not.toContain('Part Default Material');
  });

  it('BUG FIX: uniform finishOverride shows override, not Part default', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al', finish: 'Part Default Finish',
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 100, finishOverride: 'Override Finish', location: 'TW' }),
        mkScenario({ qty: 1, unitPrice: 100, finishOverride: 'Override Finish', location: 'US' }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('Finish: Override Finish');
    expect(email).not.toContain('Part Default Finish');
  });

  it('BUG FIX: uniform location shown at Part level', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 100, location: 'TW', finishOverride: 'Finish A' }),
        mkScenario({ qty: 1, unitPrice: 100, location: 'TW', finishOverride: 'Finish B' }),
      ],
    }]);
    const email = renderEmail(quote);
    // Location is the same for both → should show at Part level
    expect(email).toContain('Manufacturing: Taiwan');
  });

  it('BUG FIX: no location line when no scenarios have location', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 100 }),
        mkScenario({ qty: 10, unitPrice: 50 }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).not.toContain('Manufacturing:');
  });

  it('multi-dim: location + finish in condition label', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al 6061',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 38, location: 'TW', finishOverride: 'As-Machined' }),
        mkScenario({ qty: 10, unitPrice: 52, location: 'US', finishOverride: 'Anodize Type II' }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('Taiwan manufacturing, As-Machined');
    expect(email).toContain('U.S. manufacturing, Anodize Type II');
  });
});

/* ═══════════════════════════════════════════════════════════════
   5. DEDUPLICATION
   ═══════════════════════════════════════════════════════════════ */

describe('deduplication', () => {

  it('identical scenarios produce only one line', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100 }),
        mkScenario({ qty: 10, unitPrice: 100 }), // exact duplicate
      ],
    }]);
    const email = renderEmail(quote);
    const priceLines = email.split('\n').filter(l => l.includes('100.00 ea @ QTY 10'));
    expect(priceLines.length).toBe(1);
  });

  it('same price different qty → both shown (not deduped)', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100 }),
        mkScenario({ qty: 100, unitPrice: 100 }), // same price, different qty
      ],
    }]);
    const email = renderEmail(quote);
    const priceLines = email.split('\n').filter(l => l.includes('100.00 ea'));
    expect(priceLines.length).toBe(2);
  });

  it('same price different location → both shown', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 100, location: 'TW' }),
        mkScenario({ qty: 10, unitPrice: 100, location: 'US' }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('Taiwan manufacturing');
    expect(email).toContain('U.S. manufacturing');
  });
});

/* ═══════════════════════════════════════════════════════════════
   6. LEAD TIME SECTION LOGIC
   ═══════════════════════════════════════════════════════════════ */

describe('lead time section', () => {

  it('uniform lead time → single value', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 38, leadTimeDays: 20 }),
        mkScenario({ qty: 100, unitPrice: 22, leadTimeDays: 20 }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('ship in 20 workdays');
    expect(email).not.toContain('varies');
  });

  it('varying lead time → shows range', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [
        mkScenario({ qty: 2, unitPrice: 159, location: 'US', leadTimeDays: 10 }),
        mkScenario({ qty: 2, unitPrice: 105, location: 'TW', leadTimeDays: 20 }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).toContain('10-20 workdays');
  });
});

/* ═══════════════════════════════════════════════════════════════
   7. MULTI-PART SCENARIOS
   ═══════════════════════════════════════════════════════════════ */

describe('multi-part quotes', () => {

  it('multiple parts numbered sequentially', () => {
    const quote = mkQuote([
      { id: 'p1', name: 'Part A', material: 'Al', scenarios: [mkScenario({ qty: 1, unitPrice: 100 })] },
      { id: 'p2', name: 'Part B', material: 'Al', scenarios: [mkScenario({ qty: 1, unitPrice: 200 })] },
      { id: 'p3', name: 'Part C', material: 'Al', scenarios: [mkScenario({ qty: 1, unitPrice: 300 })] },
    ]);
    const email = renderEmail(quote);
    expect(email).toContain('Line #1');
    expect(email).toContain('Line #2');
    expect(email).toContain('Line #3');
  });

  it('each part can have different comparison dimensions', () => {
    const quote = mkQuote([
      // Part 1: location comparison
      { id: 'p1', name: 'Shaft', material: 'Al 6061',
        scenarios: [
          mkScenario({ qty: 2, unitPrice: 160, location: 'US' }),
          mkScenario({ qty: 2, unitPrice: 106, location: 'TW' }),
        ]},
      // Part 2: qty comparison
      { id: 'p2', name: 'Cover', material: 'Al 6061',
        scenarios: [
          mkScenario({ qty: 1, unitPrice: 185 }),
          mkScenario({ qty: 10, unitPrice: 45 }),
        ]},
      // Part 3: single price
      { id: 'p3', name: 'Pin', material: 'SS 304',
        scenarios: [mkScenario({ qty: 5, unitPrice: 12 })] },
    ]);
    const email = renderEmail(quote);
    // Part 1 has location labels
    expect(email).toContain('U.S. manufacturing');
    expect(email).toContain('Taiwan manufacturing');
    // Part 2 has qty labels
    expect(email).toContain('QTY 1');
    expect(email).toContain('QTY 10');
    // Part 3 has single price
    expect(email).toContain('12.00 ea @ QTY 5');
  });
});

/* ═══════════════════════════════════════════════════════════════
   8. OVERRIDE vs PART DEFAULT — EMAIL OUTPUT
   ═══════════════════════════════════════════════════════════════ */

describe('override vs Part default in email output', () => {

  it('partial materialOverride → material varies, both shown in conditions', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Shaft', material: 'Al 6061',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 38 }),                           // no override → uses "Al 6061"
        mkScenario({ qty: 10, unitPrice: 142, materialOverride: 'PEEK' }),
      ],
    }]);
    const email = renderEmail(quote);
    // Material is a comparison dimension → NOT shown at Part level
    expect(email).not.toMatch(/  • Material:/);
    // Both effective materials shown in conditions
    expect(email).toContain('(Al 6061)');
    expect(email).toContain('(PEEK)');
  });

  it('partial finishOverride with Part default → finish varies', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Housing', material: 'Al 6061', finish: 'As-Machined',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 45 }),                                     // uses Part default "As-Machined"
        mkScenario({ qty: 10, unitPrice: 52, finishOverride: 'Anodize Type II' }),
      ],
    }]);
    const email = renderEmail(quote);
    // Finish varies → NOT at Part level
    expect(email).not.toMatch(/  • Finish:/);
    // Conditions show both
    expect(email).toContain('(As-Machined)');
    expect(email).toContain('(Anodize Type II)');
  });

  it('all overrides identical to Part default → NOT varying, shown at Part level', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Shaft', material: 'Al 6061',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 38, materialOverride: 'Al 6061' }),
        mkScenario({ qty: 100, unitPrice: 22, materialOverride: 'Al 6061' }),
      ],
    }]);
    const email = renderEmail(quote);
    // Same effective material → shown at Part level
    expect(email).toContain('Material: Al 6061');
    // No material in conditions
    expect(email).not.toContain('(Al 6061)');
  });

  it('mixed override + no override + location → correct multi-dim labels', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al 6061', finish: 'As-Machined',
      scenarios: [
        mkScenario({ qty: 10, unitPrice: 38, location: 'TW', materialOverride: 'PEEK' }),
        mkScenario({ qty: 10, unitPrice: 52, location: 'US' }),  // no materialOverride → "Al 6061"
      ],
    }]);
    const email = renderEmail(quote);
    // Both location AND material vary
    expect(email).toContain('Taiwan manufacturing, PEEK');
    expect(email).toContain('U.S. manufacturing, Al 6061');
  });

  it('empty Part material + no overrides → no Material line shown', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Generic Part', material: '',
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 100 }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).not.toContain('Material:');
  });

  it('empty Part finish + no overrides → no Finish line shown', () => {
    const quote = mkQuote([{
      id: 'p1', name: 'Part', material: 'Al',
      scenarios: [
        mkScenario({ qty: 1, unitPrice: 100 }),
      ],
    }]);
    const email = renderEmail(quote);
    expect(email).not.toContain('Finish:');
  });
});
