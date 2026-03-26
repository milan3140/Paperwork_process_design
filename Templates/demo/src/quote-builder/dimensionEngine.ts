/**
 * Dimension Engine — Auto-detects comparison structure from scenarios
 *
 * Given a Part's scenarios, determines which fields vary (comparison dimensions)
 * and which are fixed. Then selects the optimal layout for rendering.
 */

import type { Scenario, QuotePart, DimensionAnalysis, VaryingDimension, ComparisonLayout } from './types';

/**
 * Analyze which dimensions vary across a Part's scenarios.
 */
export function analyzeDimensions(part: QuotePart): DimensionAnalysis {
  const { scenarios } = part;
  if (scenarios.length <= 1) {
    return {
      varying: [],
      fixed: {
        qty: scenarios[0]?.qty,
        location: scenarios[0]?.location,
        material: scenarios[0]?.materialOverride ?? undefined,
        finish: scenarios[0]?.finishOverride ?? undefined,
        leadTime: scenarios[0]?.leadTimeDays,
      },
    };
  }

  const varying: VaryingDimension[] = [];
  const fixed: DimensionAnalysis['fixed'] = {};

  // Check each dimension
  const qtys = new Set(scenarios.map(s => s.qty));
  if (qtys.size > 1) varying.push('qty');
  else fixed.qty = scenarios[0].qty;

  // Location: compare effective values (undefined treated as distinct)
  const locations = new Set(scenarios.map(s => s.location ?? NONE));
  if (locations.size > 1) {
    varying.push('location');
  } else {
    const val = scenarios[0].location;
    if (val) fixed.location = val;
  }

  // Material: compute EFFECTIVE material per scenario (override ?? Part default)
  // This catches the case where some scenarios override and some don't
  const effectiveMaterials = new Set(
    scenarios.map(s => s.materialOverride || part.material || NONE)
  );
  if (effectiveMaterials.size > 1) {
    varying.push('material');
  } else {
    // All scenarios have the same effective material
    const overrideVal = scenarios.find(s => s.materialOverride)?.materialOverride;
    if (overrideVal) fixed.material = overrideVal;
  }

  // Finish: compute EFFECTIVE finish per scenario (override ?? Part default)
  const effectiveFinishes = new Set(
    scenarios.map(s => s.finishOverride || part.finish || NONE)
  );
  if (effectiveFinishes.size > 1) {
    varying.push('finish');
  } else {
    const overrideVal = scenarios.find(s => s.finishOverride)?.finishOverride;
    if (overrideVal) fixed.finish = overrideVal;
  }

  // LeadTime varies if it's not fully explained by other varying dimensions
  // (i.e., different lead times that aren't just a consequence of different locations)
  const leadTimes = new Set(scenarios.map(s => s.leadTimeDays));
  if (leadTimes.size > 1 && !varying.includes('location') && !varying.includes('qty')) {
    varying.push('leadTime');
  }
  if (leadTimes.size === 1) fixed.leadTime = scenarios[0].leadTimeDays;

  return { varying, fixed };
}

/**
 * Compute a "fingerprint" for a scenario based on varying dimensions.
 * Two scenarios with identical fingerprints cannot coexist in a matrix cell.
 */
function scenarioFingerprint(
  s: Scenario, varying: VaryingDimension[], partMaterial: string, partFinish?: string,
): string {
  return varying.map(dim => {
    switch (dim) {
      case 'qty': return `q:${s.qty}`;
      case 'location': return `l:${s.location ?? NONE}`;
      case 'material': return `m:${s.materialOverride || partMaterial || NONE}`;
      case 'finish': return `f:${s.finishOverride || partFinish || NONE}`;
      case 'leadTime': return `t:${s.leadTimeDays}`;
    }
  }).join('|');
}

/**
 * Check if all scenarios can be uniquely placed in the layout.
 * If two scenarios have the same fingerprint, the layout can't distinguish them.
 */
export function allScenariosUnique(part: QuotePart, varying: VaryingDimension[]): boolean {
  const seen = new Set<string>();
  for (const s of part.scenarios) {
    const fp = scenarioFingerprint(s, varying, part.material, part.finish);
    if (seen.has(fp)) return false;
    seen.add(fp);
  }
  return true;
}

/**
 * Select the optimal layout based on dimension count.
 * Cells with multiple matching scenarios are stacked, so no fallback needed.
 */
export function selectLayout(analysis: DimensionAnalysis): ComparisonLayout {
  switch (analysis.varying.length) {
    case 0: return 'single';
    case 1: return 'horizontal';
    case 2: return 'matrix';
    case 3: return 'grouped_matrix';
    default: return 'flat_list';
  }
}

/**
 * Generate the condition label for a scenario based on which dimensions vary.
 */
export function generateConditionLabel(
  scenario: Scenario,
  varying: VaryingDimension[],
  partMaterial: string,
  partFinish?: string,
): string {
  if (scenario.customLabel) return scenario.customLabel;

  const parts: string[] = [];

  for (const dim of varying) {
    switch (dim) {
      case 'location':
        if (scenario.location === 'US') parts.push('U.S. manufacturing');
        else if (scenario.location === 'TW') parts.push('Taiwan manufacturing');
        break;
      case 'material':
        // Show override if set, otherwise fall back to Part default
        parts.push(scenario.materialOverride || partMaterial);
        break;
      case 'finish':
        parts.push(scenario.finishOverride || partFinish || '');
        break;
      case 'leadTime':
        parts.push(`${scenario.leadTimeDays} workdays`);
        break;
      // qty is always shown in the "@ QTY {n}" portion, not in condition
    }
  }

  return parts.join(', ');
}

/**
 * Compute comparison annotations between scenarios.
 * Returns a map of scenarioId → annotation string.
 */
export function computeComparisons(
  scenarios: Scenario[],
  varying: VaryingDimension[],
): Map<string, string> {
  const annotations = new Map<string, string>();
  if (scenarios.length < 2) return annotations;

  // Find the lowest price scenario as reference
  const sorted = [...scenarios].sort((a, b) => a.unitPrice - b.unitPrice);
  const lowest = sorted[0];

  for (const s of scenarios) {
    if (s.id === lowest.id) continue;

    const pctMore = ((s.unitPrice - lowest.unitPrice) / lowest.unitPrice) * 100;
    const refLabel = generateConditionLabel(lowest, varying, '', '');

    if (pctMore >= 100) {
      // For large differences, show multiplier
      const multiplier = (s.unitPrice / lowest.unitPrice).toFixed(1);
      annotations.set(s.id, `${multiplier}× vs ${refLabel || 'lowest'}`);
    } else {
      annotations.set(s.id, `+${Math.round(pctMore)}% vs ${refLabel || 'lowest'}`);
    }
  }

  // For the lowest, annotate savings vs highest
  if (varying.includes('qty')) {
    // For quantity comparison, show savings vs smallest qty
    const smallestQty = [...scenarios].sort((a, b) => a.qty - b.qty)[0];
    for (const s of scenarios) {
      if (s.id === smallestQty.id) continue;
      const saved = ((smallestQty.unitPrice - s.unitPrice) / smallestQty.unitPrice) * 100;
      if (saved > 0) {
        annotations.set(s.id, `Save ${Math.round(saved)}% vs QTY ${smallestQty.qty}`);
      }
    }
  }

  return annotations;
}

/**
 * Get unique values for a dimension across scenarios.
 */
/** Sentinel for "not set" — kept in results so unset scenarios remain visible */
export const NONE = '—';

export function getUniqueValues(
  scenarios: Scenario[],
  dim: VaryingDimension,
  partMaterial?: string,
  partFinish?: string,
): string[] {
  const values = new Set<string>();
  for (const s of scenarios) {
    switch (dim) {
      case 'qty': values.add(String(s.qty)); break;
      case 'location': values.add(s.location ?? NONE); break;
      case 'material': values.add(s.materialOverride || partMaterial || NONE); break;
      case 'finish': values.add(s.finishOverride || partFinish || NONE); break;
      case 'leadTime': values.add(String(s.leadTimeDays)); break;
    }
  }
  return [...values];
}

/**
 * Find a scenario matching specific dimension values.
 * Uses EFFECTIVE values (override ?? Part default) for material/finish matching.
 * @deprecated Use findScenarios for multi-match support
 */
export function findScenario(
  scenarios: Scenario[],
  criteria: Partial<Record<VaryingDimension, string>>,
  partMaterial?: string,
  partFinish?: string,
): Scenario | undefined {
  return findScenarios(scenarios, criteria, partMaterial, partFinish)[0];
}

/**
 * Find ALL scenarios matching specific dimension values.
 * Returns an array (may contain 0, 1, or more matches).
 */
export function findScenarios(
  scenarios: Scenario[],
  criteria: Partial<Record<VaryingDimension, string>>,
  partMaterial?: string,
  partFinish?: string,
): Scenario[] {
  return scenarios.filter(s => {
    for (const [dim, val] of Object.entries(criteria)) {
      switch (dim) {
        case 'qty': if (String(s.qty) !== val) return false; break;
        case 'location': if ((s.location ?? NONE) !== val) return false; break;
        case 'material': if ((s.materialOverride || partMaterial || NONE) !== val) return false; break;
        case 'finish': if ((s.finishOverride || partFinish || NONE) !== val) return false; break;
        case 'leadTime': if (String(s.leadTimeDays) !== val) return false; break;
      }
    }
    return true;
  });
}
