/**
 * Email Renderer — Generates plain-text email quote from QuoteBuilderData
 *
 * Outputs the exact format observed in Sales email screenshots,
 * with auto-generated condition labels based on varying dimensions.
 */

import type { QuoteBuilderData, QuotePart, Scenario, CoverLetterStrategy } from './types';
import { analyzeDimensions, generateConditionLabel } from './dimensionEngine';

/* ── Cover Letter Templates ── */

const COVER_LETTERS: Record<Exclude<CoverLetterStrategy, 'custom'>, (material?: string) => string> = {
  standard: (material) =>
    `Thank you for your message.\n\nOur engineering team has reviewed your inquiry and confirmed that the design is well within our${material ? ' ' + material : ''} machining capabilities. Please find our quotation below for your review:`,

  target_price: (material) =>
    `Thank you for sharing your target lead time and target pricing — that context was very helpful.\n\nOur engineering team has reviewed your inquiry and confirmed that the design is well within our${material ? ' ' + material : ''} machining capabilities. We carefully considered both your desired timeline and target pricing while preparing this quote. However, based on the material characteristics and overall manufacturing scope involved, the quotation below reflects the most realistic balance between process reliability, dimensional control, and achievable delivery.\n\nPlease find our quotation below for your review:`,

  dual_location: () =>
    `Thank you again for your RFQ.\n\nOur engineering team has reviewed the designs, and all parts fall within a straightforward manufacturing scope. Both our U.S. and Taiwan facilities are well-equipped to support this work.\n\nFor your reference, we've included options from both facilities for comparison. Kindly find the quote below:`,
};

/* ── Fixed Sections ── */

function renderManufacturingNotes(notes: string[]): string {
  return 'Manufacturing Note\n' + notes.map(n => `  • ${n}`).join('\n');
}

function renderLeadTime(data: QuoteBuilderData): string {
  // Collect all unique lead times across all scenarios
  const allLeadTimes = new Set<number>();
  for (const part of data.parts) {
    for (const s of part.scenarios) {
      allLeadTimes.add(s.leadTimeDays);
    }
  }

  const times = [...allLeadTimes].sort((a, b) => a - b);

  let lines = 'Lead Time\n';
  if (times.length === 1) {
    lines += `  • Standard: ship in ${times[0]} workdays after order confirmation & payment.`;
  } else {
    lines += `  • Estimated: ship in ${times[0]}-${times[times.length - 1]} workdays after order confirmation & payment (varies by option).`;
  }

  // If not all scenarios include expedite-level lead times, mention availability
  const hasShortLeadTime = times.some(t => t <= 12);
  if (!hasShortLeadTime) {
    lines += '\n  • Expedited options available upon request';
  }

  return lines;
}

const SHIPPING = `Shipping
  • Shipping is not included in the above pricing. We can either charge it separately or ship using your preferred carrier account.`;

const PAYMENT_TERMS = `Payment Terms
  • All orders are subject to our General Sales Terms & Conditions.
  • All quoted prices are in U.S. dollars.
  • For clients without an established credit account, full upfront payment is required before production begins.
  • Accepted payment methods:
      ○ Wire
      ○ Credit Card Online Invoice (3% processing fee)
      ○ ACH (U.S. domestic client only)`;

const CLOSING = `Please let us know if you have any questions, revisions, or would like to proceed with the order. If needed, we can also provide a formal PDF quote for your procurement purposes or issue an online invoice to facilitate credit card payment.`;

/* ── Line Item Rendering ── */

function fmtPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderLineItem(index: number, part: QuotePart): string {
  const analysis = analyzeDimensions(part);
  const lines: string[] = [];

  lines.push(`Line #${index + 1}`);
  lines.push(`  • Part: ${part.name}`);

  // Show material at Part level only if NOT a comparison dimension
  // Use uniform materialOverride if all scenarios agree, else fall back to Part default
  if (!analysis.varying.includes('material')) {
    const displayMaterial = analysis.fixed.material || part.material;
    if (displayMaterial) lines.push(`  • Material: ${displayMaterial}`);
  }

  // Show finish at Part level only if NOT a comparison dimension
  // Use uniform finishOverride if all scenarios agree, else fall back to Part default
  if (!analysis.varying.includes('finish')) {
    const displayFinish = analysis.fixed.finish || part.finish;
    if (displayFinish) lines.push(`  • Finish: ${displayFinish}`);
  }

  // Show location at Part level if uniform across all scenarios (not a comparison dimension)
  if (!analysis.varying.includes('location') && analysis.fixed.location) {
    const locLabel = analysis.fixed.location === 'US' ? 'U.S.' : 'Taiwan';
    lines.push(`  • Manufacturing: ${locLabel}`);
  }

  // Deduplicate scenarios with identical output lines
  const scenarioLines: string[] = [];
  const seen = new Set<string>();
  for (const s of part.scenarios) {
    const condition = generateConditionLabel(s, analysis.varying, part.material, part.finish);
    const condStr = condition ? ` (${condition})` : '';
    const line = `      ○ $${fmtPrice(s.unitPrice)} ea @ QTY ${s.qty}${condStr}`;
    if (!seen.has(line)) {
      seen.add(line);
      scenarioLines.push(line);
    }
  }

  // Render
  lines.push(`  • Unit Price:`);
  for (const line of scenarioLines) {
    lines.push(line);
  }

  return lines.join('\n');
}

/* ── Main Renderer ── */

export function renderEmail(data: QuoteBuilderData): string {
  const sections: string[] = [];

  // 1. Cover Letter
  if (data.coverLetterStrategy === 'custom') {
    sections.push(data.coverLetterCustom || '');
  } else {
    // Determine dominant material for template
    // Check scenario overrides first, then fall back to Part defaults
    const allMaterials = new Set<string>();
    for (const p of data.parts) {
      const analysis = analyzeDimensions(p);
      const effectiveMaterial = analysis.fixed.material || p.material;
      if (effectiveMaterial) allMaterials.add(effectiveMaterial);
    }
    const materialStr = allMaterials.size === 1 ? [...allMaterials][0] : undefined;
    sections.push(COVER_LETTERS[data.coverLetterStrategy](materialStr));
  }

  // 2. Quote Header
  sections.push(`========== Quote ID: ${data.quoteId} | Date: ${data.date} ==========`);

  // 3. Line Items
  for (let i = 0; i < data.parts.length; i++) {
    sections.push(renderLineItem(i, data.parts[i]));
  }

  // 4. Separator
  sections.push('— — — — — — — — — — — — — — — — — —');

  // 5. Manufacturing Notes
  sections.push(renderManufacturingNotes(data.manufacturingNotes));

  // 6. Lead Time
  sections.push(renderLeadTime(data));

  // 7. Shipping
  sections.push(SHIPPING);

  // 8. Payment Terms
  sections.push(PAYMENT_TERMS);

  // 9. Separator + Closing
  sections.push('— — — — — — — — — — — — — — — — — —');
  sections.push(CLOSING);

  return sections.join('\n\n');
}
