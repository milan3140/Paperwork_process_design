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
    `Thank you for your message.\n\nOur engineering team has reviewed your inquiry and confirmed that the design is well within our${material ? ' ' + material : ''} machining capabilities. Please find our quote proposal below for your review:`,

  target_price: (material) =>
    `Thank you for sharing your target lead time and target pricing — that context was very helpful.\n\nOur engineering team has reviewed your inquiry and confirmed that the design is well within our${material ? ' ' + material : ''} machining capabilities. We carefully considered both your desired timeline and target pricing while preparing this quote. However, based on the material characteristics and overall manufacturing scope involved, the quote proposal below reflects the most realistic balance between process reliability, dimensional control, and achievable delivery.\n\nPlease find our quote proposal below for your review:`,

  dual_location: () =>
    `Thank you again for your RFQ.\n\nOur engineering team has reviewed the designs, and all parts fall within a straightforward manufacturing scope. Both our U.S. and Taiwan facilities are well-equipped to support this work.\n\nFor your reference, we've included options from both facilities for comparison. Kindly find the quote proposal below:`,
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
  const leadTimeStr = times.length === 1
    ? `${times[0]} workdays`
    : `${times[0]}-${times[times.length - 1]} workdays`;

  // v2: Use editable section content with {leadTime} placeholder
  const label = data.sections.leadTime.label;
  const content = data.sections.leadTime.content.replace(/\{leadTime\}/g, leadTimeStr);
  return `${label}\n  • ${content}`;
}

function renderShipping(data: QuoteBuilderData): string {
  const label = data.sections.shipping.label;
  return `${label}\n  • ${data.sections.shipping.content}`;
}

function renderPaymentTerms(data: QuoteBuilderData): string {
  const label = data.sections.paymentTerms.label;
  const items = data.sections.paymentTerms.content.split('\n').filter(l => l.trim());
  return `${label}\n${items.map(item => `  • ${item}`).join('\n')}`;
}

const CLOSING = `Please let us know if you have any questions, revisions, or would like to proceed with the order. If needed, we can also provide a formal PDF quote proposal for your procurement purposes or issue an online invoice to facilitate credit card payment.`;

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

/** Extract just the cover letter text */
export function getCoverLetterText(data: QuoteBuilderData): string {
  if (data.coverLetterStrategy === 'custom') {
    return data.coverLetterCustom || '';
  }
  const allMaterials = new Set<string>();
  for (const p of data.parts) {
    const analysis = analyzeDimensions(p);
    const effectiveMaterial = analysis.fixed.material || p.material;
    if (effectiveMaterial) allMaterials.add(effectiveMaterial);
  }
  const materialStr = allMaterials.size === 1 ? [...allMaterials][0] : undefined;
  return COVER_LETTERS[data.coverLetterStrategy](materialStr);
}

export function renderEmail(data: QuoteBuilderData): string {
  const sections: string[] = [];

  // 1. Cover Letter
  sections.push(getCoverLetterText(data));

  // 2. Quote Header
  sections.push(`========== Proposal ID: ${data.quoteId} | Date: ${data.date} ==========`);

  // 3. Line Items
  for (let i = 0; i < data.parts.length; i++) {
    sections.push(renderLineItem(i, data.parts[i]));
  }

  // 4. Separator
  sections.push('— — — — — — — — — — — — — — — — — —');

  // 5. Manufacturing Notes
  sections.push(renderManufacturingNotes(data.manufacturingNotes));

  // 6. Lead Time (editable)
  sections.push(renderLeadTime(data));

  // 7. Shipping (editable)
  sections.push(renderShipping(data));

  // 8. Payment Terms (editable)
  sections.push(renderPaymentTerms(data));

  // 9. Separator + Closing
  sections.push('— — — — — — — — — — — — — — — — — —');
  sections.push(CLOSING);

  return sections.join('\n\n');
}
