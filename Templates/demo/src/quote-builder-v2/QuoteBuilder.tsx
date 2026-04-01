/**
 * QuoteBuilder — Main split-pane editor for composing quotes
 *
 * Left panel: structured input (customer, parts, scenarios)
 * Right panel: live preview (email text / PDF)
 *
 * Design: Uses Design_Sys_style.css + documents.css tokens exclusively.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { QuoteBuilderData, QuotePart, Scenario, CoverLetterStrategy, Address, EditableSection, CompareDimension } from './types';
import { createDefaultQuote, createEmptyPart, createEmptyScenario, createEmptyAddress, genId } from './types';
import { analyzeDimensions } from './dimensionEngine';
import { renderEmail, getCoverLetterText } from './emailRenderer';
import { QuoteComparisonTable, PartHeader } from './QuoteComparisonTable';
import { validateQuote, type ValidationResult, type ValidationError } from './validation';
import { DocumentMeta } from '../../../components/DocumentMeta';
import { PartiesRow, type PartyInfo } from '../../../components/PartiesRow';
import { SectionLabel } from '../../../components/SectionLabel';
import { TermsSection } from '../../../components/TermsSection';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';

/* ═══════════════════════════════════════════════════════════════
   STYLE TOKENS — all reference CSS vars, strict 4px grid
   ═══════════════════════════════════════════════════════════════ */

const LABEL = [
  'text-[length:var(--text-xxs)] font-semibold uppercase',
  'tracking-[0.05em] text-[color:var(--gray-400)]',
  'mb-[var(--sp-1)]',
].join(' ');

const INPUT = [
  'w-full h-[var(--h-sm)] px-[var(--sp-2)] text-[length:var(--text-sm)]',
  'text-[color:var(--gray-800)]',
  'border border-[color:var(--gray-200)] rounded-[var(--radius-sm)]',
  'shadow-[var(--shadow-input)]',
  'outline-none focus:border-[color:var(--color-primary)] focus:shadow-[var(--shadow-focus)]',
  'transition-all duration-[var(--duration-fast)]',
  'placeholder:text-[color:var(--gray-300)]',
].join(' ');

const INPUT_COMPACT = [
  'h-[var(--h-sm)] px-[var(--sp-2)] text-[length:var(--text-sm)]',
  'text-[color:var(--gray-800)] tabular-nums text-right',
  'border border-[color:var(--gray-200)] rounded-[var(--radius-sm)]',
  'shadow-[var(--shadow-input)]',
  'outline-none focus:border-[color:var(--color-primary)] focus:shadow-[var(--shadow-focus)]',
  'transition-all duration-[var(--duration-fast)]',
].join(' ');

const BTN_PRIMARY = [
  'h-[var(--h-sm)] px-[var(--sp-4)] text-[length:var(--text-xs)] font-semibold',
  'bg-[color:var(--color-primary)] text-white rounded-[var(--radius-sm)]',
  'hover:bg-[color:var(--color-primary-hover,#3A1199)]',
  'active:scale-[0.98] transition-all duration-[var(--duration-fast)]',
  'cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
].join(' ');

const BTN_GHOST = [
  'h-[var(--h-sm)] px-[var(--sp-3)] text-[length:var(--text-xs)] font-medium',
  'text-[color:var(--gray-500)] rounded-[var(--radius-sm)]',
  'hover:text-[color:var(--gray-700)] hover:bg-[color:var(--gray-100)]',
  'active:bg-[color:var(--gray-150)] transition-all duration-[var(--duration-fast)]',
  'cursor-pointer',
].join(' ');

const BTN_DANGER_TEXT = [
  'text-[length:var(--text-xs)] font-medium',
  'text-[color:var(--color-error)] cursor-pointer',
  'hover:text-[color:var(--color-error)] hover:underline',
  'transition-colors duration-[var(--duration-fast)]',
].join(' ');

const CARD = [
  'rounded-[var(--radius-lg)] bg-white',
  'border border-[color:var(--gray-150)]',
  'shadow-[var(--shadow-xs)]',
].join(' ');

/* ── Validation styling ── */

function fieldCls(base: string, errors: ValidationError[]): string {
  if (errors.some(e => e.severity === 'error'))
    return `${base} border-[color:var(--color-error)] bg-[#fef2f2]`;
  if (errors.some(e => e.severity === 'warning'))
    return `${base} border-[color:var(--color-warning)]`;
  return base;
}

function InlineError({ errors }: { errors: ValidationError[] }) {
  if (!errors.length) return null;
  return (
    <>
      {errors.map((e, i) => (
        <p key={i} className={`text-[length:var(--text-xxs)] mt-[var(--sp-1)] ${
          e.severity === 'error' ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-warning)]'
        }`}>
          {e.message}
        </p>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENARIO ROW — Price always visible, other fields by enabledDimensions
   ═══════════════════════════════════════════════════════════════ */

const COMPARE_LABELS: Record<CompareDimension, string> = {
  qty: 'Qty', leadTime: 'Lead Time', location: 'Location',
  material: 'Material', finish: 'Finish', label: 'Label',
};

function ScenarioRow({
  scenario, index, canRemove, enabledDims, partDefaults, onChange, onRemove, validation,
}: {
  scenario: Scenario; index: number; canRemove: boolean;
  enabledDims: CompareDimension[];
  partDefaults: { qty: number; leadTimeDays: number };
  onChange: (s: Scenario) => void; onRemove: () => void;
  validation: ValidationResult;
}) {
  const path = `scenario:${scenario.id}`;
  const priceErr = validation.getErrors(path, 'unitPrice');
  const qtyErr = validation.getErrors(path, 'qty');
  const leadErr = validation.getErrors(path, 'leadTimeDays');
  const dupErr = validation.getErrors(path, '_duplicate');
  const collisionErr = validation.getErrors(path, '_collision');
  const rowWarnings = [...dupErr, ...collisionErr];

  const has = (d: CompareDimension) => enabledDims.includes(d);
  const activeDims = enabledDims.length;

  return (
    <div
      data-el="QuoteBuilder-scenario"
      className={[
        'p-[var(--sp-3)] rounded-[var(--radius-md)]',
        'bg-[color:var(--gray-50)] border border-[color:var(--gray-100)]',
        rowWarnings.length ? 'ring-2 ring-[color:var(--color-warning)]' : '',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-[var(--sp-2)]">
        <span className="text-[length:var(--text-xs)] font-semibold text-[color:var(--gray-500)]">
          Option {index + 1}
        </span>
        <div className="flex items-center gap-[var(--sp-2)]">
          {rowWarnings.length > 0 && (
            <span className="text-[length:var(--text-xxs)] text-[color:var(--color-warning)]">{rowWarnings[0].message}</span>
          )}
          {canRemove && (
            <button className={BTN_DANGER_TEXT} onClick={onRemove}>Remove</button>
          )}
        </div>
      </div>

      {/* Fields: Price + enabled dimensions, max 3 per row */}
      <div className="grid grid-cols-3 gap-[var(--sp-2)]">
        {/* Price — always visible */}
        <div>
          <label className={LABEL}>Unit Price (USD)</label>
          <div className="relative">
            <span className="absolute left-[var(--sp-2)] top-1/2 -translate-y-1/2 text-[length:var(--text-sm)] text-[color:var(--gray-400)]">$</span>
            <input type="number" min="0.01" step="0.01"
              className={fieldCls(`${INPUT_COMPACT} w-full pl-[var(--sp-5)]`, priceErr)}
              value={scenario.unitPrice || ''} onChange={e => onChange({ ...scenario, unitPrice: Number(e.target.value) || 0 })} />
          </div>
          <InlineError errors={priceErr} />
        </div>

        {has('qty') && (
          <div>
            <label className={LABEL}>Qty</label>
            <input type="number" min="1" step="1"
              className={fieldCls(`${INPUT_COMPACT} w-full`, qtyErr)}
              value={scenario.qty || partDefaults.qty || ''} onChange={e => onChange({ ...scenario, qty: Number(e.target.value) || 0 })} />
            <InlineError errors={qtyErr} />
          </div>
        )}
        {has('leadTime') && (
          <div>
            <label className={LABEL}>Lead Time</label>
            <div className="flex items-center gap-[var(--sp-1)]">
              <input type="number" min="1" step="1"
                className={fieldCls(`${INPUT_COMPACT} w-full`, leadErr)}
                value={scenario.leadTimeDays || partDefaults.leadTimeDays || ''} onChange={e => onChange({ ...scenario, leadTimeDays: Number(e.target.value) || 0 })} />
              <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)] shrink-0">days</span>
            </div>
            <InlineError errors={leadErr} />
          </div>
        )}
        {has('location') && (
          <div>
            <label className={LABEL}>Location</label>
            <select className={`${INPUT_COMPACT} w-full text-left`}
              value={scenario.location || ''}
              onChange={e => onChange({ ...scenario, location: (e.target.value || undefined) as Scenario['location'] })}>
              <option value="">—</option>
              <option value="TW">Taiwan</option>
              <option value="US">U.S.</option>
            </select>
          </div>
        )}
        {has('material') && (
          <div>
            <label className={LABEL}>Material</label>
            <input className={`${INPUT_COMPACT} w-full text-left`} placeholder="Override"
              value={scenario.materialOverride || ''}
              onChange={e => onChange({ ...scenario, materialOverride: e.target.value || undefined })} />
          </div>
        )}
        {has('finish') && (
          <div>
            <label className={LABEL}>Finish</label>
            <input className={`${INPUT_COMPACT} w-full text-left`} placeholder="Override"
              value={scenario.finishOverride || ''}
              onChange={e => onChange({ ...scenario, finishOverride: e.target.value || undefined })} />
          </div>
        )}
        {has('label') && (
          <div>
            <label className={LABEL}>Label</label>
            <input className={`${INPUT_COMPACT} w-full text-left`} placeholder="Custom"
              value={scenario.customLabel || ''}
              onChange={e => onChange({ ...scenario, customLabel: e.target.value || undefined })} />
          </div>
        )}

        {/* Fill empty grid cells when only Price shown (no dims) to prevent oversized Price field */}
        {activeDims === 0 && <><div /><div /></>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PART EDITOR — Metadata + Compare checkboxes + Options
   ═══════════════════════════════════════════════════════════════ */

const ALL_COMPARE_DIMS: CompareDimension[] = ['qty', 'leadTime', 'location', 'material', 'finish', 'label'];

function PartEditor({
  part, index, canRemove, onChange, onRemove, onDuplicate, validation,
}: {
  part: QuotePart; index: number; canRemove: boolean;
  onChange: (p: QuotePart) => void; onRemove: () => void;
  onDuplicate: () => void; validation: ValidationResult;
}) {
  const analysis = analyzeDimensions(part);
  const partPath = `part:${part.id}`;
  const nameErr = validation.getErrors(partPath, 'name');
  const matErr = validation.getErrors(partPath, 'material');
  const scenWarn = validation.getErrors(partPath, 'scenarios');

  const toggleDim = (dim: CompareDimension) => {
    const enabled = part.enabledDimensions.includes(dim)
      ? part.enabledDimensions.filter(d => d !== dim)
      : [...part.enabledDimensions, dim];
    onChange({ ...part, enabledDimensions: enabled });
  };

  const updateScenario = (sIdx: number, s: Scenario) => {
    const next = [...part.scenarios]; next[sIdx] = s;
    onChange({ ...part, scenarios: next });
  };
  const removeScenario = (sIdx: number) =>
    onChange({ ...part, scenarios: part.scenarios.filter((_, i) => i !== sIdx) });
  const addScenario = () => {
    const last = part.scenarios[part.scenarios.length - 1];
    const s = createEmptyScenario();
    // Inherit Part defaults
    s.qty = part.qty;
    s.leadTimeDays = part.leadTimeDays;
    // Alternate location if enabled
    if (part.enabledDimensions.includes('location')) {
      if (last?.location === 'TW') s.location = 'US';
      else if (last?.location === 'US') s.location = 'TW';
    }
    onChange({ ...part, scenarios: [...part.scenarios, s] });
  };

  return (
    <div data-comp="PartEditor" className={CARD}>
      {/* Header */}
      <div className="flex items-center justify-between px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
        <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">
          Part {index + 1}
        </span>
        <div className="flex items-center gap-[var(--sp-2)]">
          <button className={BTN_GHOST} onClick={onDuplicate}>Duplicate</button>
          {canRemove && <button className={BTN_DANGER_TEXT} onClick={onRemove}>Remove</button>}
        </div>
      </div>

      <div className="p-[var(--sp-4)] flex flex-col gap-[var(--sp-4)]">
        {/* Row 1: Thumbnail + Part Name */}
        <div className="flex gap-[var(--sp-3)] items-start">
          {/* Thumbnail */}
          <div className="shrink-0">
            {part.thumbnailUrl ? (
              <div className="relative w-[60px] h-[60px]">
                <img src={part.thumbnailUrl} alt=""
                  className="w-[60px] h-[60px] rounded-[var(--radius-sm)] object-cover border border-[color:var(--gray-200)]" />
                <button
                  className="absolute -top-[6px] -right-[6px] w-[18px] h-[18px] rounded-full bg-[color:var(--gray-600)] text-white text-[10px] leading-none flex items-center justify-center cursor-pointer hover:bg-[color:var(--color-error)]"
                  onClick={() => onChange({ ...part, thumbnailUrl: undefined })}>
                  x
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-[60px] h-[60px] rounded-[var(--radius-sm)] border border-dashed border-[color:var(--gray-300)] cursor-pointer hover:border-[color:var(--color-primary)] hover:bg-[color:var(--gray-50)] transition-colors">
                <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)]">+ Image</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => onChange({ ...part, thumbnailUrl: reader.result as string });
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }} />
              </label>
            )}
          </div>
          {/* Part Name */}
          <div className="flex-1">
            <label className={LABEL}>Part Name</label>
            <input className={fieldCls(INPUT, nameErr)} placeholder="e.g. LPK Mirror Azi Push Tab"
              value={part.name} onChange={e => onChange({ ...part, name: e.target.value })} />
            <InlineError errors={nameErr} />
          </div>
        </div>

        {/* Row 2: Qty + Material + Lead Time + Finish */}
        <div className="grid grid-cols-[19fr_24fr_23fr_24fr] gap-[var(--sp-3)] items-start">
          <div>
            <label className={LABEL}>Qty</label>
            <input type="number" min="1" step="1" className={`${INPUT_COMPACT} w-full`}
              value={part.qty || ''} onChange={e => onChange({ ...part, qty: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={LABEL}>Material</label>
            <input className={fieldCls(INPUT, matErr)} placeholder="e.g. Aluminum 6061-T6"
              value={part.material} onChange={e => onChange({ ...part, material: e.target.value })} />
            <InlineError errors={matErr} />
          </div>
          <div>
            <label className={LABEL}>Lead Time</label>
            <div className="flex items-center gap-[var(--sp-1)]">
              <input type="number" min="1" step="1" className={`${INPUT_COMPACT} w-full`}
                value={part.leadTimeDays || ''} onChange={e => onChange({ ...part, leadTimeDays: Number(e.target.value) || 0 })} />
              <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)] shrink-0">days</span>
            </div>
          </div>
          <div>
            <label className={LABEL}>Finish</label>
            <input className={INPUT} placeholder="e.g. As-Machined" value={part.finish || ''}
              onChange={e => onChange({ ...part, finish: e.target.value || undefined })} />
          </div>
        </div>

        {/* Row 3: Dimensions (optional) */}
        <div>
          <label className={LABEL}>Dimensions (L × W × H mm) — optional</label>
          <div className="flex items-center gap-[var(--sp-1)]">
            <input type="number" min="0" step="0.1" className={`${INPUT_COMPACT} w-[80px]`}
              placeholder="L"
              value={part.dimensions?.length ?? ''} onChange={e => {
                const v = Number(e.target.value) || 0;
                const d = part.dimensions ?? { length: 0, width: 0, height: 0 };
                onChange({ ...part, dimensions: v || d.width || d.height ? { ...d, length: v } : undefined });
              }} />
            <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)]">×</span>
            <input type="number" min="0" step="0.1" className={`${INPUT_COMPACT} w-[80px]`}
              placeholder="W"
              value={part.dimensions?.width ?? ''} onChange={e => {
                const v = Number(e.target.value) || 0;
                const d = part.dimensions ?? { length: 0, width: 0, height: 0 };
                onChange({ ...part, dimensions: d.length || v || d.height ? { ...d, width: v } : undefined });
              }} />
            <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)]">×</span>
            <input type="number" min="0" step="0.1" className={`${INPUT_COMPACT} w-[80px]`}
              placeholder="H"
              value={part.dimensions?.height ?? ''} onChange={e => {
                const v = Number(e.target.value) || 0;
                const d = part.dimensions ?? { length: 0, width: 0, height: 0 };
                onChange({ ...part, dimensions: d.length || d.width || v ? { ...d, height: v } : undefined });
              }} />
            <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)] shrink-0">mm</span>
          </div>
        </div>

        {/* Compare checkboxes */}
        <div className={[
          'flex flex-wrap items-center gap-x-[var(--sp-4)] gap-y-[var(--sp-1)]',
          'px-[var(--sp-3)] py-[var(--sp-2)]',
          'rounded-[var(--radius-sm)] bg-[color:var(--gray-50)] border border-[color:var(--gray-100)]',
        ].join(' ')}>
          <span className="text-[length:var(--text-xxs)] font-semibold uppercase tracking-[0.05em] text-[color:var(--gray-500)] mr-[var(--sp-1)]">
            Compare
          </span>
          {ALL_COMPARE_DIMS.map(dim => (
            <label key={dim} className="flex items-center gap-[var(--sp-1)] cursor-pointer select-none">
              <input type="checkbox"
                className="w-[14px] h-[14px] accent-[var(--color-primary)] cursor-pointer"
                checked={part.enabledDimensions.includes(dim)}
                onChange={() => toggleDim(dim)} />
              <span className="text-[length:var(--text-xs)] text-[color:var(--gray-600)]">
                {COMPARE_LABELS[dim]}
              </span>
            </label>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[color:var(--gray-100)]" />

        {/* Scenarios */}
        <div className="flex flex-col gap-[var(--sp-2)]">
          <span className="text-[length:var(--text-xxs)] font-semibold uppercase tracking-[0.05em] text-[color:var(--gray-900)]">
            Pricing Options
          </span>
          {part.scenarios.map((s, sIdx) => (
            <ScenarioRow key={s.id} scenario={s} index={sIdx}
              canRemove={part.scenarios.length > 1}
              enabledDims={part.enabledDimensions}
              partDefaults={{ qty: part.qty, leadTimeDays: part.leadTimeDays }}
              onChange={u => updateScenario(sIdx, u)}
              onRemove={() => removeScenario(sIdx)}
              validation={validation} />
          ))}
          <InlineError errors={scenWarn} />
          <button className={`${BTN_GHOST} self-start`} onClick={addScenario}>
            + Add Option
          </button>
        </div>

        {/* Dimension indicator */}
        {analysis.varying.length > 0 && (
          <div className={[
            'flex items-center gap-[var(--sp-2)] px-[var(--sp-3)] py-[var(--sp-2)]',
            'rounded-[var(--radius-sm)] bg-[color:var(--color-primary-wash,#F7F5FD)]',
            'border border-[color:var(--color-primary-subtle,#EDE8FA)]',
          ].join(' ')}>
            <span className="text-[length:var(--text-xxs)] font-semibold text-[color:var(--color-primary)]">
              Comparing
            </span>
            <span className="text-[length:var(--text-xxs)] text-[color:var(--color-primary-light)]">
              {analysis.varying.map(d =>
                d === 'qty' ? 'Quantity' : d === 'location' ? 'Location' :
                d === 'material' ? 'Material' : d === 'finish' ? 'Finish' :
                d === 'leadTime' ? 'Lead Time' : d
              ).join(' × ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Normalize a Part's scenarios for output (PDF/Email):
 * Non-enabled dimensions are reset to Part defaults so the dimension engine
 * won't detect them as varying. Original scenario data is NOT mutated.
 */
function normalizePart(part: QuotePart): QuotePart {
  const enabled = part.enabledDimensions;
  return {
    ...part,
    scenarios: part.scenarios.map(s => ({
      ...s,
      qty: enabled.includes('qty') ? s.qty : part.qty,
      leadTimeDays: enabled.includes('leadTime') ? s.leadTimeDays : part.leadTimeDays,
      location: enabled.includes('location') ? s.location : undefined,
      materialOverride: enabled.includes('material') ? s.materialOverride : undefined,
      finishOverride: enabled.includes('finish') ? s.finishOverride : undefined,
      customLabel: enabled.includes('label') ? s.customLabel : undefined,
    })),
  };
}

/* ── Build PDF sections for paginated rendering ── */

function buildPdfSections(
  data: QuoteBuilderData,
  fromParty: PartyInfo,
  billToParty: PartyInfo,
  shipToParty: PartyInfo,
): PageSection[] {
  const sections: PageSection[] = [];

  // 1. Title + Meta
  sections.push({
    key: 'title',
    content: (
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
            Quote Proposal
          </div>
          <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
            #{data.quoteId}
          </div>
        </div>
        <DocumentMeta items={[
          { label: 'Date', value: data.date },
          { label: 'Valid', value: `${data.validDays} days` },
        ]} />
      </div>
    ),
  });

  // 2. Parties
  sections.push({
    key: 'parties',
    content: data.customer.shippingSameAsBilling ? (
      <div className="grid grid-cols-2 gap-[var(--sp-6)]">
        <div className="flex flex-col gap-[var(--doc-sp-1-5)]">
          <SectionLabel>From</SectionLabel>
          <div className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)]">{fromParty.name}</div>
          <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] leading-[1.5]">
            {fromParty.lines.map((l, i) => <span key={i}>{l}{i < fromParty.lines.length - 1 && <br />}</span>)}
          </div>
        </div>
        <div className="flex flex-col gap-[var(--doc-sp-1-5)]">
          <SectionLabel>Bill To / Ship To</SectionLabel>
          <div className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)]">{billToParty.name}</div>
          <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] leading-[1.5]">
            {billToParty.lines.map((l, i) => <span key={i}>{l}{i < billToParty.lines.length - 1 && <br />}</span>)}
          </div>
        </div>
      </div>
    ) : (
      <PartiesRow from={fromParty} billTo={billToParty} shipTo={shipToParty} />
    ),
  });

  // 3. Pricing — header + each part as separate sections (same group for tight spacing)
  sections.push({
    key: 'pricing-header',
    group: 'pricing',
    content: (
      <SectionLabel className="!border-b !border-[var(--color-primary)]">
        <span className="text-[color:var(--color-primary)]">Pricing</span>
      </SectionLabel>
    ),
  });
  data.parts.forEach((rawPart, idx) => {
    const part = normalizePart(rawPart);
    sections.push({
      key: `pricing-part-${part.id}`,
      group: 'pricing',
      content: (
        <div>
          <div className="text-[length:var(--doc-text-secondary,9px)] font-semibold uppercase tracking-[0.06em] text-[color:var(--gray-400)] mb-[var(--sp-1)]">
            Line #{idx + 1}
          </div>
          <div className="bg-[color:var(--gray-50)] rounded-[var(--radius-sm)] p-[var(--sp-3)]">
            {/* Identity band: thumbnail (optional) + Part name, attributes & dimensions */}
            <div className="flex gap-[20px] items-center mb-[var(--sp-2)] pl-[var(--sp-2)]">
              {rawPart.thumbnailUrl && (
                <img src={rawPart.thumbnailUrl} alt=""
                  className="w-[60px] h-[60px] rounded-[var(--radius-sm)] object-cover border border-[color:var(--gray-200)] shrink-0" />
              )}
              <div>
                <PartHeader part={part} />
                {rawPart.dimensions && (rawPart.dimensions.length > 0 || rawPart.dimensions.width > 0 || rawPart.dimensions.height > 0) && (() => {
                  const sorted = [rawPart.dimensions!.length, rawPart.dimensions!.width, rawPart.dimensions!.height].sort((a, b) => b - a);
                  return (
                    <div className="text-[length:var(--doc-text-secondary,9px)] text-[color:var(--gray-400)] mt-[1px]">
                      {sorted[0]} × {sorted[1]} × {sorted[2]} mm
                      <span className="mx-[6px]">·</span>
                      {(sorted[0] / 25.4).toFixed(2)} × {(sorted[1] / 25.4).toFixed(2)} × {(sorted[2] / 25.4).toFixed(2)} in
                    </div>
                  );
                })()}
              </div>
            </div>
            {/* Subtle separator */}
            <div className="border-t border-[#fcfbfe] mb-[var(--sp-2)]" />
            {/* Full-width comparison table (header hidden — rendered above) */}
            <div className="pl-[var(--sp-2)]">
              <QuoteComparisonTable part={part} hideHeader />
            </div>
          </div>
        </div>
      ),
    });
  });
  sections.push({
    key: 'pricing-footer',
    group: 'pricing',
    content: <div className="border-b border-[color:var(--color-primary)]" />,
  });

  // 4. Info grid (Mfg Notes + Lead Time + Shipping + Payment)
  // Resolve {leadTime} placeholder in lead time content
  const allLeadTimes = data.parts.flatMap(p => p.scenarios.map(s => s.leadTimeDays)).filter(d => d > 0);
  const uniqueLT = [...new Set(allLeadTimes)].sort((a, b) => a - b);
  const ltMin = uniqueLT[0];
  const ltMax = uniqueLT[uniqueLT.length - 1];
  const leadTimeStr = uniqueLT.length <= 1
    ? `${ltMin || data.leadTimeDays} workdays`
    : `${ltMin}–${ltMax} workdays`;

  const resolvedLeadTimeContent = data.sections.leadTime.content
    .replace(/\{leadTime\}/g, leadTimeStr);
  const resolvedTermsContent = data.sections.terms.content
    .replace(/\{validDays\}/g, String(data.validDays));

  // Payment terms: split by newlines into bullet list
  const paymentItems = data.sections.paymentTerms.content
    .split('\n').filter(l => l.trim());

  sections.push({
    key: 'info-grid',
    content: (
      <div className="grid grid-cols-2 gap-x-[var(--sp-8)] gap-y-[var(--sp-5)]">
        {data.manufacturingNotes.length > 0 && (
          <div>
            <SectionLabel>Manufacturing Notes</SectionLabel>
            <ul className="space-y-[var(--sp-1)] mt-[var(--sp-2)]">
              {data.manufacturingNotes.filter(n => n.trim()).map((note, i) => (
                <li key={i} className="flex gap-[var(--sp-2)] text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)]">
                  <span className="text-[color:var(--gray-300)]">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <SectionLabel>{data.sections.leadTime.label}</SectionLabel>
          <p className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)] mt-[var(--sp-2)]">
            {resolvedLeadTimeContent}
          </p>
        </div>
        <div>
          <SectionLabel>{data.sections.shipping.label}</SectionLabel>
          <p className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)] mt-[var(--sp-2)]">
            {data.sections.shipping.content}
          </p>
        </div>
        <div>
          <SectionLabel>{data.sections.paymentTerms.label}</SectionLabel>
          <ul className="space-y-[var(--sp-1)] mt-[var(--sp-2)]">
            {paymentItems.map((t, i) => (
              <li key={i} className="flex gap-[var(--sp-2)] text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)]">
                <span className="text-[color:var(--gray-300)]">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  });

  // 5. Terms — uses editable section content with custom label
  sections.push({
    key: 'terms',
    content: (
      <div className="flex flex-col gap-[var(--sp-1)]">
        <SectionLabel>{data.sections.terms.label}</SectionLabel>
        <div className="text-[length:var(--doc-text-fine)] text-[color:var(--gray-400)] leading-[1.5]">
          {resolvedTermsContent}
        </div>
      </div>
    ),
  });

  return sections;
}

/* ═══════════════════════════════════════════════════════════════
   ADDRESS FIELDS
   ═══════════════════════════════════════════════════════════════ */

function AddressFields({ label, address, onChange }: { label: string; address: Address; onChange: (a: Address) => void }) {
  const set = (field: keyof Address, value: string) => onChange({ ...address, [field]: value });
  return (
    <div className="flex flex-col gap-[var(--sp-2)]">
      <span className={LABEL}>{label}</span>
      <input className={INPUT} placeholder="e.g. No. 100, Sec. 2, Zhongxiao E. Rd" value={address.street} onChange={e => set('street', e.target.value)} />
      <input className={INPUT} placeholder="Apt, suite, floor, building... (optional)" value={address.street2 || ''} onChange={e => set('street2', e.target.value)} />
      <div className="grid grid-cols-2 gap-[var(--sp-2)]">
        <input className={INPUT} placeholder="e.g. Taipei" value={address.city} onChange={e => set('city', e.target.value)} />
        <input className={INPUT} placeholder="e.g. Da'an District" value={address.state} onChange={e => set('state', e.target.value)} />
      </div>
      <div className="grid grid-cols-[120px_1fr] gap-[var(--sp-2)]">
        <input className={INPUT} placeholder="e.g. 106" value={address.postalCode} onChange={e => set('postalCode', e.target.value)} />
        <input className={INPUT} placeholder="e.g. Taiwan" value={address.country} onChange={e => set('country', e.target.value)} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION EDITOR — editable label + content for PDF sections
   ═══════════════════════════════════════════════════════════════ */

function SectionEditor({
  section, onChange, placeholder,
}: {
  section: EditableSection; onChange: (s: EditableSection) => void; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-[var(--sp-2)]">
      <div>
        <label className={LABEL}>Section Label</label>
        <input className={INPUT} value={section.label}
          onChange={e => onChange({ ...section, label: e.target.value })} />
      </div>
      <div>
        <label className={LABEL}>Content</label>
        <textarea className={`${INPUT} min-h-[60px] resize-y`}
          placeholder={placeholder}
          value={section.content}
          onChange={e => onChange({ ...section, content: e.target.value })} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN QUOTE BUILDER
   ═══════════════════════════════════════════════════════════════ */

export default function QuoteBuilder() {
  const [data, setData] = useState<QuoteBuilderData>(createDefaultQuote());
  const [previewTab, setPreviewTab] = useState<'email' | 'pdf'>('email');
  const [copied, setCopied] = useState(false);
  const [copiedCover, setCopiedCover] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const updatePart = useCallback((idx: number, part: QuotePart) => {
    setData(prev => ({ ...prev, parts: prev.parts.map((p, i) => i === idx ? part : p) }));
  }, []);
  const removePart = useCallback((idx: number) => {
    setData(prev => ({ ...prev, parts: prev.parts.filter((_, i) => i !== idx) }));
  }, []);
  const duplicatePart = useCallback((idx: number) => {
    setData(prev => {
      const src = prev.parts[idx];
      const dup: QuotePart = { ...src, id: genId('p'), name: src.name + ' (copy)',
        scenarios: src.scenarios.map(s => ({ ...s, id: genId('s') })) };
      const parts = [...prev.parts]; parts.splice(idx + 1, 0, dup);
      return { ...prev, parts };
    });
  }, []);
  const addPart = useCallback(() => {
    setData(prev => ({ ...prev, parts: [...prev.parts, createEmptyPart()] }));
  }, []);

  const validation = validateQuote(data);
  // Normalize parts for output: non-enabled dims reset to Part defaults
  const normalizedData = { ...data, parts: data.parts.map(normalizePart) };
  const emailText = renderEmail(normalizedData);
  const errorCount = validation.errors.filter(e => e.severity === 'error').length;

  const handleCopy = async () => {
    if (!validation.isValid) return;
    await navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCoverLetter = async () => {
    const text = getCoverLetterText(data);
    await navigator.clipboard.writeText(text);
    setCopiedCover(true);
    setTimeout(() => setCopiedCover(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!pdfRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML).join('\n');
    const printCss = `
      <style>
        @media print {
          @page { size: Letter; margin: 0; }
          body { margin: 0; }
        }
        /* Force each doc-page to fill exactly one print page */
        .doc-page {
          width: 215.9mm;
          height: 279.4mm;
          display: flex;
          flex-direction: column;
          page-break-after: always;
          overflow: hidden;
        }
        .doc-page:last-child { page-break-after: auto; }
        .doc-content { flex: 1; }
        /* Print colors */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      </style>`;
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Quote Proposal ${data.quoteId}</title>${styles}${printCss}
    </head><body>${pdfRef.current.outerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
  };

  /* ── Build party info for PDF ── */
  const fromParty: PartyInfo = {
    name: 'InstaVoxel Inc.',
    lines: ['No. 100, Sec. 2, Zhongxiao E. Rd', "Da'an District, Taipei 106, Taiwan", '+886-2-2771-0000', 'sales@instavoxel.com'],
  };
  const formatAddress = (a: Address): string[] => {
    const lines: string[] = [];
    if (a.street) lines.push(a.street);
    if (a.street2) lines.push(a.street2);
    const cityLine = [a.city, a.state].filter(Boolean).join(', ');
    const postalCountry = [a.postalCode, a.country].filter(Boolean).join(', ');
    if (cityLine || postalCountry) lines.push([cityLine, postalCountry].filter(Boolean).join(' '));
    return lines;
  };
  const billToParty: PartyInfo = {
    name: data.customer.companyName || '—',
    lines: [
      ...formatAddress(data.customer.billingAddress),
      ...(data.customer.email ? [data.customer.email] : []),
      ...(data.customer.contactName ? [`Attn: ${data.customer.contactName}`] : []),
    ],
  };
  const effectiveShipping = data.customer.shippingSameAsBilling ? data.customer.billingAddress : data.customer.shippingAddress;
  const shipToParty: PartyInfo = {
    name: data.customer.companyName || '—',
    lines: [
      ...formatAddress(effectiveShipping),
      ...(data.customer.contactName ? [`Attn: ${data.customer.contactName}`] : []),
    ],
  };

  return (
    <div data-comp="QuoteBuilder" className="flex h-screen w-screen bg-[color:var(--bg-base,var(--gray-50))]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", position: 'fixed', top: 0, left: 0 }}>

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="w-1/2 min-w-[420px] flex flex-col border-r border-[color:var(--gray-200)] bg-white">

        {/* Panel header */}
        <div className="shrink-0 flex items-center justify-between h-[var(--header-h,56px)] px-[var(--sp-5)] border-b border-[color:var(--gray-150)]">
          <h1 className="text-[length:var(--text-lg)] font-bold text-[color:var(--color-primary)]">
            Quote Proposal Builder
          </h1>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-[var(--sp-5)] flex flex-col gap-[var(--sp-4)]">

            {/* ── Quote Info ── */}
            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">Proposal Info</span>
              </div>
              <div className="p-[var(--sp-4)] grid grid-cols-[1fr_100px] gap-[var(--sp-3)]">
                <div>
                  <label className={LABEL}>Proposal ID</label>
                  <input className={INPUT} value={data.quoteId}
                    onChange={e => setData(d => ({ ...d, quoteId: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Valid</label>
                  <div className="flex items-center gap-[var(--sp-1)]">
                    <input type="number" className={`${INPUT_COMPACT} w-[56px]`} value={data.validDays}
                      onChange={e => setData(d => ({ ...d, validDays: Number(e.target.value) || 30 }))} />
                    <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)]">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Customer ── */}
            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">Customer</span>
              </div>
              <div className="p-[var(--sp-4)] flex flex-col gap-[var(--sp-3)]">
                <div className="grid grid-cols-2 gap-[var(--sp-3)]">
                  <div>
                    <label className={LABEL}>Company</label>
                    <input className={INPUT} placeholder="Acme Optics Corp" value={data.customer.companyName}
                      onChange={e => setData(d => ({ ...d, customer: { ...d.customer, companyName: e.target.value } }))} />
                  </div>
                  <div>
                    <label className={LABEL}>Contact</label>
                    <input className={INPUT} placeholder="John Smith" value={data.customer.contactName}
                      onChange={e => setData(d => ({ ...d, customer: { ...d.customer, contactName: e.target.value } }))} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Email</label>
                  <input className={INPUT} type="email" placeholder="purchasing@acme.com" value={data.customer.email || ''}
                    onChange={e => setData(d => ({ ...d, customer: { ...d.customer, email: e.target.value } }))} />
                </div>

                {/* Billing Address */}
                <AddressFields
                  label="Billing Address"
                  address={data.customer.billingAddress}
                  onChange={a => setData(d => ({ ...d, customer: { ...d.customer, billingAddress: a } }))}
                />

                {/* Shipping Address */}
                <div className="flex items-center gap-[var(--sp-2)] pt-[var(--sp-1)]">
                  <input type="checkbox" id="ship-same"
                    className="w-[16px] h-[16px] accent-[var(--color-primary)] cursor-pointer"
                    checked={data.customer.shippingSameAsBilling}
                    onChange={e => setData(d => ({
                      ...d, customer: {
                        ...d.customer,
                        shippingSameAsBilling: e.target.checked,
                        shippingAddress: e.target.checked ? d.customer.billingAddress : d.customer.shippingAddress,
                      }
                    }))} />
                  <label htmlFor="ship-same" className="text-[length:var(--text-xs)] text-[color:var(--gray-600)] cursor-pointer select-none">
                    Shipping same as billing address
                  </label>
                </div>
                {!data.customer.shippingSameAsBilling && (
                  <AddressFields
                    label="Shipping Address"
                    address={data.customer.shippingAddress}
                    onChange={a => setData(d => ({ ...d, customer: { ...d.customer, shippingAddress: a } }))}
                  />
                )}
              </div>
            </div>

            {/* ── Cover Letter ── */}
            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">Cover Letter</span>
              </div>
              <div className="p-[var(--sp-4)]">
                <select className={INPUT} value={data.coverLetterStrategy}
                  onChange={e => setData(d => ({ ...d, coverLetterStrategy: e.target.value as CoverLetterStrategy }))}>
                  <option value="standard">Standard</option>
                  <option value="target_price">Responding to Target Price</option>
                  <option value="dual_location">Dual Location Comparison</option>
                  <option value="custom">Custom</option>
                </select>
                {data.coverLetterStrategy === 'custom' && (
                  <textarea className={`${INPUT} mt-[var(--sp-3)] min-h-[80px]`}
                    placeholder="Write your cover letter..."
                    value={data.coverLetterCustom || ''}
                    onChange={e => setData(d => ({ ...d, coverLetterCustom: e.target.value }))} />
                )}
              </div>
            </div>

            {/* ── Section label: Parts ── */}
            <div className="flex items-center gap-[var(--sp-3)] pt-[var(--sp-2)]">
              <span className="text-[length:var(--text-xxs)] font-semibold uppercase tracking-[0.06em] text-[color:var(--gray-900)]">
                Parts ({data.parts.length})
              </span>
              <div className="flex-1 border-t border-[color:var(--gray-150)]" />
            </div>

            {/* ── Part Editors ── */}
            {data.parts.map((part, idx) => (
              <PartEditor key={part.id} part={part} index={idx}
                canRemove={data.parts.length > 1}
                onChange={p => updatePart(idx, p)}
                onRemove={() => removePart(idx)}
                onDuplicate={() => duplicatePart(idx)}
                validation={validation} />
            ))}

            <button className={`${BTN_PRIMARY} self-start`} onClick={addPart}>
              + Add Part
            </button>

            {/* ── Notes ── */}
            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">Manufacturing Notes</span>
              </div>
              <div className="p-[var(--sp-4)] flex flex-col gap-[var(--sp-2)]">
                {data.manufacturingNotes.map((note, i) => (
                  <div key={i} className="flex items-center gap-[var(--sp-2)]">
                    <input className={`${INPUT} flex-1`} value={note}
                      onChange={e => setData(d => ({
                        ...d,
                        manufacturingNotes: d.manufacturingNotes.map((n, j) => j === i ? e.target.value : n),
                      }))} />
                    {data.manufacturingNotes.length > 1 && (
                      <button className={BTN_DANGER_TEXT}
                        onClick={() => setData(d => ({
                          ...d,
                          manufacturingNotes: d.manufacturingNotes.filter((_, j) => j !== i),
                        }))}>Remove</button>
                    )}
                  </div>
                ))}
                <button className={`${BTN_GHOST} self-start`}
                  onClick={() => setData(d => ({ ...d, manufacturingNotes: [...d.manufacturingNotes, ''] }))}>
                  + Add Note
                </button>
              </div>
            </div>

            {/* ── PDF Section Editors ── */}
            <div className="flex items-center gap-[var(--sp-3)] pt-[var(--sp-2)]">
              <span className="text-[length:var(--text-xxs)] font-semibold uppercase tracking-[0.06em] text-[color:var(--gray-900)]">
                PDF Sections
              </span>
              <div className="flex-1 border-t border-[color:var(--gray-150)]" />
            </div>

            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">
                  {data.sections.leadTime.label || 'Lead Time'}
                </span>
              </div>
              <div className="p-[var(--sp-4)]">
                <SectionEditor
                  section={data.sections.leadTime}
                  placeholder="Use {leadTime} for auto lead time range"
                  onChange={s => setData(d => ({ ...d, sections: { ...d.sections, leadTime: s } }))}
                />
              </div>
            </div>

            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">
                  {data.sections.shipping.label || 'Shipping'}
                </span>
              </div>
              <div className="p-[var(--sp-4)]">
                <SectionEditor
                  section={data.sections.shipping}
                  onChange={s => setData(d => ({ ...d, sections: { ...d.sections, shipping: s } }))}
                />
              </div>
            </div>

            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">
                  {data.sections.paymentTerms.label || 'Payment Terms'}
                </span>
              </div>
              <div className="p-[var(--sp-4)]">
                <SectionEditor
                  section={data.sections.paymentTerms}
                  placeholder="One item per line"
                  onChange={s => setData(d => ({ ...d, sections: { ...d.sections, paymentTerms: s } }))}
                />
              </div>
            </div>

            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">
                  {data.sections.terms.label || 'Terms & Conditions'}
                </span>
              </div>
              <div className="p-[var(--sp-4)]">
                <SectionEditor
                  section={data.sections.terms}
                  placeholder="Each numbered term on its own line"
                  onChange={s => setData(d => ({ ...d, sections: { ...d.sections, terms: s } }))}
                />
              </div>
            </div>

            {/* Bottom breathing room */}
            <div className="h-[var(--sp-8)]" />
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[color:var(--gray-50)]">

        {/* Tab bar */}
        <div className="shrink-0 flex items-center h-[var(--header-h,56px)] px-[var(--sp-5)] border-b border-[color:var(--gray-150)] bg-white">
          {(['email', 'pdf'] as const).map(tab => (
            <button key={tab}
              className={[
                'h-full px-[var(--sp-4)] text-[length:var(--text-sm)] font-medium',
                'border-b-2 transition-colors duration-[var(--duration-fast)]',
                previewTab === tab
                  ? 'text-[color:var(--color-primary)] border-[color:var(--color-primary)]'
                  : 'text-[color:var(--gray-400)] border-transparent hover:text-[color:var(--gray-600)]',
              ].join(' ')}
              onClick={() => setPreviewTab(tab)}>
              {tab === 'email' ? 'Email' : 'PDF'} Preview
            </button>
          ))}

          <div className="ml-auto flex items-center gap-[var(--sp-3)]">
            {errorCount > 0 && (
              <span className="text-[length:var(--text-xs)] text-[color:var(--color-error)] font-medium">
                {errorCount} error{errorCount > 1 ? 's' : ''}
              </span>
            )}
            {previewTab === 'email' ? (
              <>
                <button className={BTN_PRIMARY} onClick={handleCopy} disabled={!validation.isValid}>
                  {copied ? 'Copied' : 'Copy Email'}
                </button>
              </>
            ) : (
              <>
                <button className={BTN_GHOST} onClick={handleCopyCoverLetter}>
                  {copiedCover ? 'Copied' : 'Copy Cover Letter'}
                </button>
                <button className={BTN_PRIMARY} onClick={handleDownloadPdf}>
                  Download PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto p-[var(--sp-6)]">
          {previewTab === 'email' ? (
            /* ── Email preview ── */
            <div className={`${CARD} shadow-[var(--shadow-sm)]`}>
              <pre className="p-[var(--sp-6)] text-[length:var(--text-sm)] leading-[var(--leading-relaxed)] whitespace-pre-wrap text-[color:var(--gray-800)]"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {emailText}
              </pre>
            </div>
          ) : (
            /* ── PDF preview — paginated document ── */
            <div ref={pdfRef}>
              <PaginatedDocument
                docId={data.quoteId}
                validDays={data.validDays}
                sections={buildPdfSections(normalizedData, fromParty, billToParty, shipToParty)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
