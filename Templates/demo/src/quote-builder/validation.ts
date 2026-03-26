/**
 * Validation Engine — Comprehensive input validation for Quote Builder
 *
 * Validates all fields at Scenario, Part, and Quote levels.
 * Returns structured errors that the UI can display inline.
 */

import type { QuoteBuilderData, QuotePart, Scenario, VaryingDimension } from './types';
import { NONE, analyzeDimensions } from './dimensionEngine';

/* ── Error Types ── */

export interface ValidationError {
  /** Where: 'quote' | 'part:{partId}' | 'scenario:{scenarioId}' */
  path: string;
  /** Which field */
  field: string;
  /** Error message */
  message: string;
  /** Severity: 'error' blocks output, 'warning' shows but allows output */
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  errors: ValidationError[];
  /** True if no errors (warnings are OK) */
  isValid: boolean;
  /** Quick lookup: does this specific field have errors? */
  hasError: (path: string, field?: string) => boolean;
  /** Get errors for a specific path */
  getErrors: (path: string, field?: string) => ValidationError[];
}

/* ── Scenario-level validation ── */

function validateScenario(s: Scenario, partId: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `scenario:${s.id}`;

  // Price: must be positive
  if (s.unitPrice <= 0) {
    errors.push({ path, field: 'unitPrice', message: 'Price must be greater than 0', severity: 'error' });
  }

  // QTY: must be positive integer
  if (s.qty <= 0) {
    errors.push({ path, field: 'qty', message: 'Quantity must be at least 1', severity: 'error' });
  }
  if (!Number.isInteger(s.qty)) {
    errors.push({ path, field: 'qty', message: 'Quantity must be a whole number', severity: 'error' });
  }

  // Lead time: must be positive
  if (s.leadTimeDays <= 0) {
    errors.push({ path, field: 'leadTimeDays', message: 'Lead time must be at least 1 day', severity: 'error' });
  }
  if (!Number.isInteger(s.leadTimeDays)) {
    errors.push({ path, field: 'leadTimeDays', message: 'Lead time must be a whole number', severity: 'error' });
  }

  // Price sanity: warn on suspiciously high/low (but don't block)
  if (s.unitPrice > 100000) {
    errors.push({ path, field: 'unitPrice', message: 'Price is very high — double check', severity: 'warning' });
  }
  if (s.unitPrice > 0 && s.unitPrice < 0.01) {
    errors.push({ path, field: 'unitPrice', message: 'Price is unusually low', severity: 'warning' });
  }

  // Lead time sanity
  if (s.leadTimeDays > 365) {
    errors.push({ path, field: 'leadTimeDays', message: 'Lead time over 1 year — double check', severity: 'warning' });
  }

  // QTY sanity
  if (s.qty > 1000000) {
    errors.push({ path, field: 'qty', message: 'Very large quantity — double check', severity: 'warning' });
  }

  return errors;
}

/* ── Part-level validation ── */

function validatePart(part: QuotePart): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `part:${part.id}`;

  // Part name required
  if (!part.name.trim()) {
    errors.push({ path, field: 'name', message: 'Part name is required', severity: 'error' });
  }

  // Material required
  if (!part.material.trim()) {
    errors.push({ path, field: 'material', message: 'Material is required', severity: 'error' });
  }

  // Must have at least 1 scenario
  if (part.scenarios.length === 0) {
    errors.push({ path, field: 'scenarios', message: 'At least one pricing option is required', severity: 'error' });
  }

  // Validate each scenario
  for (const s of part.scenarios) {
    errors.push(...validateScenario(s, part.id));
  }

  // Cross-scenario validations
  if (part.scenarios.length >= 2) {
    const analysis = analyzeDimensions(part);

    // Duplicate scenarios: same effective values across ALL dimensions but NOT the same scenario
    for (let i = 0; i < part.scenarios.length; i++) {
      for (let j = i + 1; j < part.scenarios.length; j++) {
        const a = part.scenarios[i];
        const b = part.scenarios[j];
        const sameQty = a.qty === b.qty;
        const samePrice = a.unitPrice === b.unitPrice;
        const sameLead = a.leadTimeDays === b.leadTimeDays;
        const sameLoc = (a.location ?? '') === (b.location ?? '');
        const sameMat = (a.materialOverride ?? '') === (b.materialOverride ?? '');
        const sameFin = (a.finishOverride ?? '') === (b.finishOverride ?? '');
        const sameLabel = (a.customLabel ?? '') === (b.customLabel ?? '');

        if (sameQty && samePrice && sameLead && sameLoc && sameMat && sameFin && sameLabel) {
          errors.push({
            path: `scenario:${b.id}`,
            field: '_duplicate',
            message: `Identical to Option ${i + 1} — remove or change something`,
            severity: 'warning',
          });
        }
      }
    }

    // Fingerprint collision: scenarios that have identical distinguishing attributes
    // but differ in price without a label to explain why.
    //
    // IMPORTANT: Use ALL distinguishing fields for fingerprint, not just analysis.varying.
    // analysis.varying is for PDF layout; collision detection needs the full picture.
    // e.g., leadTime may not be in analysis.varying (suppressed when qty/location varies),
    // but different leadTime values DO make two scenarios distinguishable.
    const fingerprints = new Map<string, number[]>();
    for (let i = 0; i < part.scenarios.length; i++) {
      const s = part.scenarios[i];
      const fp = [
        `q:${s.qty}`,
        `l:${s.location ?? NONE}`,
        `m:${s.materialOverride || part.material || NONE}`,
        `f:${s.finishOverride || part.finish || NONE}`,
        `t:${s.leadTimeDays}`,
        `c:${s.customLabel?.trim() || ''}`,
      ].join('|');
      if (!fingerprints.has(fp)) fingerprints.set(fp, []);
      fingerprints.get(fp)!.push(i);
    }

    for (const [, indices] of fingerprints) {
      if (indices.length < 2) continue;
      const cellScenarios = indices.map(i => part.scenarios[i]);
      const allSamePrice = new Set(cellScenarios.map(s => s.unitPrice)).size === 1;

      if (!allSamePrice) {
        // Identical fingerprint (same qty, location, material, finish, leadTime, label)
        // but different prices — truly indistinguishable, must add label
        for (const idx of indices) {
          const s = part.scenarios[idx];
          errors.push({
            path: `scenario:${s.id}`,
            field: '_collision',
            message: `Same dimensions as Option ${indices.filter(j => j !== idx).map(j => j + 1).join(', ')} but different price — add a Label to distinguish`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return errors;
}

/* ── Quote-level validation ── */

export function validateQuote(data: QuoteBuilderData): ValidationResult {
  const errors: ValidationError[] = [];

  // Quote ID
  if (!data.quoteId.trim()) {
    errors.push({ path: 'quote', field: 'quoteId', message: 'Quote ID is required', severity: 'error' });
  }

  // Date
  if (!data.date.trim()) {
    errors.push({ path: 'quote', field: 'date', message: 'Date is required', severity: 'error' });
  }

  // Valid days
  if (data.validDays <= 0) {
    errors.push({ path: 'quote', field: 'validDays', message: 'Valid days must be positive', severity: 'error' });
  }

  // Lead time (quote-level default)
  if (data.leadTimeDays <= 0) {
    errors.push({ path: 'quote', field: 'leadTimeDays', message: 'Lead time must be at least 1 day', severity: 'error' });
  }

  // Must have at least 1 part
  if (data.parts.length === 0) {
    errors.push({ path: 'quote', field: 'parts', message: 'At least one part is required', severity: 'error' });
  }

  // Custom cover letter: if selected, must have content
  if (data.coverLetterStrategy === 'custom' && !(data.coverLetterCustom ?? '').trim()) {
    errors.push({ path: 'quote', field: 'coverLetterCustom', message: 'Custom cover letter cannot be empty', severity: 'error' });
  }

  // Manufacturing notes: warn on empty notes (empty strings in the array)
  for (let i = 0; i < data.manufacturingNotes.length; i++) {
    if (!data.manufacturingNotes[i].trim()) {
      errors.push({ path: 'quote', field: `note:${i}`, message: 'Empty note — remove or fill in', severity: 'warning' });
    }
  }

  // Validate each part
  for (const part of data.parts) {
    errors.push(...validatePart(part));
  }

  // Cross-part: duplicate part names
  const names = data.parts.map(p => p.name.trim().toLowerCase()).filter(Boolean);
  const nameSet = new Set<string>();
  for (let i = 0; i < names.length; i++) {
    if (nameSet.has(names[i])) {
      errors.push({
        path: `part:${data.parts[i].id}`,
        field: 'name',
        message: 'Duplicate part name',
        severity: 'warning',
      });
    }
    nameSet.add(names[i]);
  }

  const hasError = (path: string, field?: string): boolean =>
    errors.some(e => e.path === path && e.severity === 'error' && (field ? e.field === field : true));

  const getErrors = (path: string, field?: string): ValidationError[] =>
    errors.filter(e => e.path === path && (field ? e.field === field : true));

  return {
    errors,
    isValid: !errors.some(e => e.severity === 'error'),
    hasError,
    getErrors,
  };
}
