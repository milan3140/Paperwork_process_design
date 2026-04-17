/**
 * Validation Engine — Comprehensive input validation for Quote Builder
 *
 * Validates all fields at Scenario, Part, and Quote levels.
 * Returns structured errors that the UI can display inline.
 */

import type { QuoteBuilderData, QuotePart, Scenario, VaryingDimension, CompareDimension } from './types';
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

function validateScenario(s: Scenario, partId: string, enabledDims: CompareDimension[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `scenario:${s.id}`;

  // Price: must be positive (always validated — the only core Option field)
  if (s.unitPrice <= 0) {
    errors.push({ path, field: 'unitPrice', message: 'Price must be greater than 0', severity: 'error' });
  }
  if (s.unitPrice > 100000) {
    errors.push({ path, field: 'unitPrice', message: 'Price is very high ($100K+) — double check', severity: 'warning' });
  }
  if (s.unitPrice > 0 && s.unitPrice < 1) {
    errors.push({ path, field: 'unitPrice', message: 'Price is unusually low (<$1) for machined parts — double check', severity: 'warning' });
  }

  // Cost/Margin: if one is set but not the other, warn
  const hasCost = s.cost != null && s.cost > 0;
  const hasMargin = s.marginPercent != null && s.marginPercent > 0;
  if (hasCost && !hasMargin) {
    errors.push({ path, field: 'marginPercent', message: 'Margin is empty — fill both Cost and Margin, or leave both empty', severity: 'warning' });
  }
  if (!hasCost && hasMargin) {
    errors.push({ path, field: 'cost', message: 'Cost is empty — fill both Cost and Margin, or leave both empty', severity: 'warning' });
  }
  if (hasCost && s.cost! <= 0) {
    errors.push({ path, field: 'cost', message: 'Cost must be positive', severity: 'error' });
  }

  // QTY: only validate at Scenario level when qty is an enabled compare dimension
  if (enabledDims.includes('qty')) {
    if (s.qty <= 0) {
      errors.push({ path, field: 'qty', message: 'Quantity must be at least 1', severity: 'error' });
    }
    if (!Number.isInteger(s.qty)) {
      errors.push({ path, field: 'qty', message: 'Quantity must be a whole number', severity: 'error' });
    }
    if (s.qty > 1000000) {
      errors.push({ path, field: 'qty', message: 'Very large quantity — double check', severity: 'warning' });
    }
  }

  // Lead time: only validate at Scenario level when leadTime is an enabled compare dimension
  if (enabledDims.includes('leadTime')) {
    if (s.leadTimeDays <= 0) {
      errors.push({ path, field: 'leadTimeDays', message: 'Lead time must be at least 1 day', severity: 'error' });
    }
    if (!Number.isInteger(s.leadTimeDays)) {
      errors.push({ path, field: 'leadTimeDays', message: 'Lead time must be a whole number', severity: 'error' });
    }
    if (s.leadTimeDays > 365) {
      errors.push({ path, field: 'leadTimeDays', message: 'Lead time over 1 year — double check', severity: 'warning' });
    }
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
    // Progressive: name not entered → Stage 2/3 not visible, skip their validation
    return errors;
  }

  // Material required
  if (!part.material.trim()) {
    errors.push({ path, field: 'material', message: 'Material is required', severity: 'error' });
  }

  // Part-level qty: must be positive integer (always required at Part level)
  if (part.qty <= 0) {
    errors.push({ path, field: 'qty', message: 'Quantity must be at least 1', severity: 'error' });
  }
  if (!Number.isInteger(part.qty)) {
    errors.push({ path, field: 'qty', message: 'Quantity must be a whole number', severity: 'error' });
  }

  // Part-level lead time: must be positive integer (always required at Part level)
  if (part.leadTimeDays <= 0) {
    errors.push({ path, field: 'leadTimeDays', message: 'Lead time must be at least 1 day', severity: 'error' });
  }
  if (!Number.isInteger(part.leadTimeDays)) {
    errors.push({ path, field: 'leadTimeDays', message: 'Lead time must be a whole number', severity: 'error' });
  }

  // Must select at least one Compare dimension to configure pricing
  if ((part.enabledDimensions ?? []).length === 0) {
    errors.push({ path, field: 'enabledDimensions', message: 'Select at least one Compare dimension to configure pricing', severity: 'error' });
    // Progressive: no Compare selected → Pricing Options not visible, skip scenario validation
    return errors;
  }

  // Must have at least 1 scenario
  if (part.scenarios.length === 0) {
    errors.push({ path, field: 'scenarios', message: 'At least one pricing option is required', severity: 'error' });
  }

  // Validate each scenario (scoped to enabledDimensions)
  const enabled = part.enabledDimensions ?? [];
  for (const s of part.scenarios) {
    errors.push(...validateScenario(s, part.id, enabled));
  }

  // Cross-scenario validations
  // v2: Only ENABLED dimensions + label participate in duplicate/collision detection.
  // Non-enabled dimensions are invisible to the user and should not differentiate options.
  if (part.scenarios.length >= 2) {
    /**
     * Build a fingerprint from only the enabled compare dimensions.
     * Non-enabled dimensions are excluded — they use Part defaults and
     * the user can't see or edit them per-Option.
     */
    function buildFingerprint(s: Scenario): string {
      const parts: string[] = [];
      if (enabled.includes('qty')) parts.push(`q:${s.qty}`);
      if (enabled.includes('leadTime')) parts.push(`t:${s.leadTimeDays}`);
      if (enabled.includes('location')) parts.push(`l:${s.location ?? NONE}`);
      if (enabled.includes('material')) parts.push(`m:${s.materialOverride || part.material || NONE}`);
      if (enabled.includes('finish')) parts.push(`f:${s.finishOverride || part.finish || NONE}`);
      // Custom dimensions
      for (const cd of part.customDimensions ?? []) {
        if (enabled.includes(`custom:${cd.id}` as CompareDimension)) {
          parts.push(`cd:${cd.id}:${s.customDimValues?.[cd.id]?.trim() || NONE}`);
        }
      }
      return parts.join('|');
    }

    // Duplicate: same fingerprint AND same price → truly identical, remove one
    for (let i = 0; i < part.scenarios.length; i++) {
      for (let j = i + 1; j < part.scenarios.length; j++) {
        const a = part.scenarios[i];
        const b = part.scenarios[j];
        if (buildFingerprint(a) === buildFingerprint(b) && a.unitPrice === b.unitPrice) {
          errors.push({
            path: `scenario:${b.id}`,
            field: '_duplicate',
            message: `Identical to Option ${i + 1} — remove or change something`,
            severity: 'warning',
          });
        }
      }
    }

    // Collision: same fingerprint but DIFFERENT price → need label to distinguish
    const fingerprints = new Map<string, number[]>();
    for (let i = 0; i < part.scenarios.length; i++) {
      const fp = buildFingerprint(part.scenarios[i]);
      if (!fingerprints.has(fp)) fingerprints.set(fp, []);
      fingerprints.get(fp)!.push(i);
    }

    for (const [, indices] of fingerprints) {
      if (indices.length < 2) continue;
      const cellScenarios = indices.map(i => part.scenarios[i]);
      const allSamePrice = new Set(cellScenarios.map(s => s.unitPrice)).size === 1;

      if (!allSamePrice) {
        // Collision: same conditions, different price → ERROR (must be fixed)
        for (const idx of indices) {
          const s = part.scenarios[idx];
          const others = indices.filter(j => j !== idx).map(j => j + 1).join(', ');
          const hint = enabled.length === 0
            ? 'Enable a Compare dimension or add a custom dimension to distinguish'
            : 'Add a custom dimension or change a value to distinguish';
          errors.push({
            path: `scenario:${s.id}`,
            field: '_collision',
            message: `Same conditions as Option ${others} but different price — ${hint}`,
            severity: 'error',
          });
        }
      }
    }

    // Same price across different conditions → warning (intentional?)
    if (part.scenarios.length >= 2) {
      const priceGroups = new Map<number, number[]>();
      for (let i = 0; i < part.scenarios.length; i++) {
        const p = part.scenarios[i].unitPrice;
        if (!priceGroups.has(p)) priceGroups.set(p, []);
        priceGroups.get(p)!.push(i);
      }
      for (const [price, indices] of priceGroups) {
        if (indices.length < 2 || price <= 0) continue;
        // Check if they actually have different fingerprints
        const fps = new Set(indices.map(i => buildFingerprint(part.scenarios[i])));
        if (fps.size > 1) {
          for (const idx of indices) {
            errors.push({
              path: `scenario:${part.scenarios[idx].id}`,
              field: '_samePrice',
              message: `Same price as other option(s) with different conditions — intentional?`,
              severity: 'warning',
            });
          }
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
