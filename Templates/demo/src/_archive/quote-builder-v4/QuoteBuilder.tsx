/**
 * QuoteBuilder — Main split-pane editor for composing quotes
 *
 * Left panel: structured input (customer, parts, scenarios)
 * Right panel: live preview (email text / PDF)
 *
 * Design: Uses Design_Sys_style.css + documents.css tokens exclusively.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { QuoteBuilderData, QuotePart, Scenario, CoverLetterStrategy, Address, EditableSection, CompareDimension, BuiltinCompareDimension, CustomDimension } from './types';
import { createDefaultQuote, createEmptyPart, createEmptyScenario, createEmptyAddress, genId, computeUnitPrice } from './types';
import { analyzeDimensions } from './dimensionEngine';
import { renderEmail, getCoverLetterText } from './emailRenderer';
import { QuoteComparisonTable, PartHeader } from './QuoteComparisonTable';
import { validateQuote, type ValidationResult, type ValidationError } from './validation';
import { DocumentMeta } from '../../../components/DocumentMeta';
import { PartiesRow, type PartyInfo } from '../../../components/PartiesRow';
import { SectionLabel } from '../../../components/SectionLabel';
import { TermsSection } from '../../../components/TermsSection';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';
import { downloadPdf } from '../downloadPdf';

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
  'hover:text-[color:var(--gray-700)] hover:bg-[color:var(--gray-75)]',
  'active:bg-[color:var(--gray-150)] transition-all duration-[var(--duration-fast)]',
  'cursor-pointer',
].join(' ');

const BTN_DANGER_TEXT = [
  'text-[length:var(--text-xs)] font-medium',
  'text-[color:var(--color-error)] cursor-pointer',
  'hover:text-[color:var(--color-error)] hover:underline',
  'transition-colors duration-[var(--duration-fast)]',
].join(' ');

/** v3: Lightweight section header — replaces heavy card borders */
const SECTION_HEADER = [
  'text-[length:var(--text-xxs)] font-semibold uppercase tracking-[0.06em]',
  'text-[color:var(--gray-500)]',
].join(' ');

/** v3: Card — only used for email preview, not form sections */
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

const BUILTIN_COMPARE_LABELS: Record<string, string> = {
  qty: 'Qty', leadTime: 'Lead Time', location: 'Location',
  material: 'Material', finish: 'Finish',
};

function ScenarioRow({
  scenario, index, canRemove, enabledDims, partDefaults, customDimensions, onChange, onRemove, validation, showErrors: showErr,
}: {
  scenario: Scenario; index: number; canRemove: boolean;
  enabledDims: CompareDimension[];
  partDefaults: { qty: number; leadTimeDays: number };
  customDimensions?: CustomDimension[];
  onChange: (s: Scenario) => void; onRemove: () => void;
  validation: ValidationResult; showErrors: boolean;
}) {
  const path = `scenario:${scenario.id}`;
  const priceErr = showErr ? validation.getErrors(path, 'unitPrice') : [];
  const qtyErr = showErr ? validation.getErrors(path, 'qty') : [];
  const leadErr = showErr ? validation.getErrors(path, 'leadTimeDays') : [];
  const dupErr = showErr ? validation.getErrors(path, '_duplicate') : [];
  const collisionErr = showErr ? validation.getErrors(path, '_collision') : [];
  const samePriceErr = showErr ? validation.getErrors(path, '_samePrice') : [];
  const costErr = showErr ? validation.getErrors(path, 'cost') : [];
  const marginErr = showErr ? validation.getErrors(path, 'marginPercent') : [];
  const rowWarnings = [...dupErr, ...collisionErr, ...samePriceErr, ...costErr, ...marginErr];

  const has = (d: CompareDimension) => enabledDims.includes(d);

  // Cost/Margin → auto Unit Price
  const calculatedPrice = Math.round((scenario.cost ?? 0) * (1 + (scenario.marginPercent ?? 0) / 100) * 100) / 100;
  const isOverridden = scenario.priceOverride != null;
  const displayPrice = Math.round((isOverridden ? scenario.priceOverride! : calculatedPrice) * 100) / 100;

  // Dimension fields for row 2: built-in dims + enabled custom dims
  const builtinDims: CompareDimension[] = enabledDims.filter(d => !d.startsWith('custom:'));
  const enabledCustomDims = (customDimensions ?? []).filter(cd => enabledDims.includes(`custom:${cd.id}` as CompareDimension));

  return (
    <div
      data-el="QuoteBuilder-scenario"
      className={[
        'group/opt relative py-[var(--sp-3)] px-[var(--sp-3)]',
        'rounded-[var(--radius-sm)]',
        'hover:bg-[color:var(--gray-50)] transition-colors duration-[var(--duration-fast)]',
        rowWarnings.some(e => e.severity === 'error') ? 'bg-[#fef2f2] ring-1 ring-[color:var(--color-error)]' :
        rowWarnings.length ? 'bg-[#fffbeb] ring-1 ring-[color:var(--color-warning)]' : '',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--sp-2)]">
        <span className="text-[length:11px] font-medium text-[color:var(--gray-400)]">
          Option {index + 1}
        </span>
        <div className="flex items-center gap-[var(--sp-2)]">
          {rowWarnings.length > 0 && (
            <span className={`text-[length:var(--text-xxs)] ${rowWarnings[0].severity === 'error' ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-warning)]'}`}>{rowWarnings[0].message}</span>
          )}
          {canRemove && (
            <button className={`${BTN_DANGER_TEXT} opacity-0 group-hover/opt:opacity-100 transition-opacity`} onClick={onRemove}>Remove</button>
          )}
        </div>
      </div>

      {/* Row 1: Cost + Margin + Unit Price */}
      <div className="grid grid-cols-3 gap-[var(--sp-2)]">
        <div>
          <label className={LABEL}>Cost (USD)</label>
          <div className="relative">
            <span className="absolute left-[var(--sp-2)] top-1/2 -translate-y-1/2 text-[length:var(--text-sm)] text-[color:var(--gray-400)]">$</span>
            <input type="number" min="0" step="0.01"
              className={`${INPUT_COMPACT} w-full pl-[var(--sp-5)]`}
              value={scenario.cost ?? ''} onChange={e => {
                const cost = Number(e.target.value) || 0;
                const up = Math.round(cost * (1 + (scenario.marginPercent ?? 0) / 100) * 100) / 100;
                onChange({ ...scenario, cost, unitPrice: up, priceOverride: undefined });
              }} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Margin (%)</label>
          <div className="relative">
            <input type="number" min="0" step="1"
              className={`${INPUT_COMPACT} w-full pr-[var(--sp-5)]`}
              value={scenario.marginPercent ?? ''} onChange={e => {
                const margin = Number(e.target.value) || 0;
                const up = Math.round((scenario.cost ?? 0) * (1 + margin / 100) * 100) / 100;
                onChange({ ...scenario, marginPercent: margin, unitPrice: up, priceOverride: undefined });
              }} />
            <span className="absolute right-[var(--sp-2)] top-1/2 -translate-y-1/2 text-[length:var(--text-sm)] text-[color:var(--gray-400)]">%</span>
          </div>
        </div>
        <div>
          <label className={LABEL}>
            Unit Price (USD)
            {isOverridden && <span className="ml-[var(--sp-1)] text-[color:var(--color-primary)] font-normal normal-case tracking-normal">overridden</span>}
          </label>
          <div className="relative">
            <span className="absolute left-[var(--sp-2)] top-1/2 -translate-y-1/2 text-[length:var(--text-sm)] text-[color:var(--gray-400)]">$</span>
            <input type="number" min="0.01" step="0.01"
              className={fieldCls(`${INPUT_COMPACT} w-full pl-[var(--sp-5)] ${isOverridden ? 'border-dashed border-[color:var(--color-primary)]' : ''}`, priceErr)}
              value={displayPrice || ''}
              onChange={e => {
                const v = Number(e.target.value) || 0;
                // Only mark as overridden if the value actually differs from calculated
                if (Math.abs(v - calculatedPrice) < 0.001) {
                  onChange({ ...scenario, priceOverride: undefined, unitPrice: v });
                } else {
                  onChange({ ...scenario, priceOverride: v, unitPrice: v });
                }
              }} />
          </div>
          {isOverridden && (
            <button className="text-[length:10px] text-[color:var(--color-primary)] cursor-pointer hover:underline mt-[1px]"
              onClick={() => {
                const up = Math.round((scenario.cost ?? 0) * (1 + (scenario.marginPercent ?? 0) / 100) * 100) / 100;
                onChange({ ...scenario, priceOverride: undefined, unitPrice: up });
              }}>Reset to calculated</button>
          )}
          <InlineError errors={priceErr} />
        </div>
      </div>

      {/* Row 2: Compare dimension fields */}
      {(builtinDims.length > 0 || enabledCustomDims.length > 0) && (
        <div className="grid grid-cols-3 gap-[var(--sp-2)] mt-[var(--sp-2)]">
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
          {enabledCustomDims.map(cd => (
            <div key={cd.id}>
              <label className={LABEL}>{cd.name}</label>
              <input className={`${INPUT_COMPACT} w-full text-left`} placeholder={cd.name}
                value={scenario.customDimValues?.[cd.id] || ''}
                onChange={e => onChange({ ...scenario, customDimValues: { ...scenario.customDimValues, [cd.id]: e.target.value } })} />
            </div>
          ))}
        </div>
      )}

      {/* Optional per-scenario note */}
      <div className="mt-[var(--sp-2)]">
        <label className={LABEL}>Note <span className="font-normal normal-case tracking-normal text-[color:var(--gray-400)]">(optional — shown in PDF below price)</span></label>
        <input className={`${INPUT_COMPACT} w-full`}
          placeholder="e.g. includes surface treatment, expedite available..."
          value={scenario.note || ''}
          onChange={e => onChange({ ...scenario, note: e.target.value || undefined })} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PART EDITOR — Metadata + Compare checkboxes + Options
   ═══════════════════════════════════════════════════════════════ */

const BUILTIN_COMPARE_DIMS: BuiltinCompareDimension[] = ['qty', 'leadTime', 'location', 'material', 'finish'];

function PartEditor({
  part, index, canRemove, collapsed, onToggle, onChange, onRemove, onDuplicate, validation, showErrors: showErr,
}: {
  part: QuotePart; index: number; canRemove: boolean;
  collapsed: boolean; onToggle: () => void;
  onChange: (p: QuotePart) => void; onRemove: () => void;
  onDuplicate: () => void; validation: ValidationResult; showErrors: boolean;
}) {
  const [hoverEmptyZone, setHoverEmptyZone] = useState(false);
  const analysis = analyzeDimensions(part);
  const partPath = `part:${part.id}`;
  const nameErr = showErr ? validation.getErrors(partPath, 'name') : [];
  const matErr = showErr ? validation.getErrors(partPath, 'material') : [];
  const scenWarn = showErr ? validation.getErrors(partPath, 'scenarios') : [];
  const compareErr = showErr ? validation.getErrors(partPath, 'enabledDimensions') : [];
  const partErrors = validation.errors.filter(e => e.path === partPath || e.path.startsWith('scenario:'));

  // Progressive disclosure stages
  const stage1 = true; // always show name + image
  const stage2 = !!part.name.trim(); // name filled → show metadata + compare
  const stage3 = part.enabledDimensions.length > 0; // compare checked → show options

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
    s.qty = part.qty;
    s.leadTimeDays = part.leadTimeDays;
    if (part.enabledDimensions.includes('location')) {
      if (last?.location === 'TW') s.location = 'US';
      else if (last?.location === 'US') s.location = 'TW';
    }
    onChange({ ...part, scenarios: [...part.scenarios, s] });
  };

  // Summary for collapsed state
  const lowestPrice = Math.min(...part.scenarios.map(s => s.unitPrice).filter(p => p > 0));
  const summaryText = [
    part.material,
    `QTY ${part.qty}`,
    `${part.scenarios.length} option${part.scenarios.length > 1 ? 's' : ''}`,
    lowestPrice > 0 && lowestPrice < Infinity ? `from $${lowestPrice.toFixed(2)}` : '',
  ].filter(Boolean).join(' · ');

  // Collapsed view
  if (collapsed) {
    return (
      <div data-comp="PartEditor" data-part-id={part.id}
        className="group/part flex items-center gap-[var(--sp-3)] py-[var(--sp-3)] px-[var(--sp-4)] cursor-pointer hover:bg-[color:var(--gray-50)] rounded-[var(--radius-sm)] transition-colors"
        onClick={onToggle}>
        <span className="text-[color:var(--gray-400)] text-[14px] select-none">▶</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[var(--sp-2)]">
            <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)] truncate">
              {part.name || `Part ${index + 1}`}
            </span>
            {partErrors.some(e => e.severity === 'error') && (
              <span className="w-[6px] h-[6px] rounded-full bg-[color:var(--color-error)] shrink-0" />
            )}
          </div>
          <span className="text-[length:var(--text-xs)] text-[color:var(--gray-400)]">{summaryText}</span>
        </div>
        <div className="flex items-center gap-[var(--sp-2)] opacity-0 group-hover/part:opacity-100 transition-opacity">
          <button className={BTN_GHOST} onClick={e => { e.stopPropagation(); onDuplicate(); }}>Duplicate</button>
          {canRemove && <button className={BTN_DANGER_TEXT} onClick={e => { e.stopPropagation(); onRemove(); }}>Remove</button>}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div data-comp="PartEditor" data-part-id={part.id} className="flex flex-col">
      {/* Expandable header */}
      <div className="group/part flex items-center gap-[var(--sp-3)] py-[var(--sp-3)] px-[var(--sp-4)] cursor-pointer hover:bg-[color:var(--gray-50)] rounded-t-[var(--radius-sm)] transition-colors"
        onClick={onToggle}>
        <span className="text-[color:var(--gray-400)] text-[14px] select-none">▼</span>
        <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)] flex-1">
          {part.name || `Part ${index + 1}`}
        </span>
        <div className="flex items-center gap-[var(--sp-2)] opacity-0 group-hover/part:opacity-100 transition-opacity">
          <button className={BTN_GHOST} onClick={e => { e.stopPropagation(); onDuplicate(); }}>Duplicate</button>
          {canRemove && <button className={BTN_DANGER_TEXT} onClick={e => { e.stopPropagation(); onRemove(); }}>Remove</button>}
        </div>
      </div>

      <div className="px-[var(--sp-4)] pb-[var(--sp-4)] flex flex-col gap-[var(--sp-4)]">
        {/* Thumbnail + Part Name */}
        <div className="flex gap-[var(--sp-3)] items-start">
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
                    reader.onload = (ev) => {
                      const img = new Image();
                      img.onload = () => {
                        const MAX = 240;
                        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
                        const w = Math.round(img.width * scale);
                        const h = Math.round(img.height * scale);
                        const canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                        onChange({ ...part, thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8) });
                      };
                      img.src = ev.target!.result as string;
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }} />
              </label>
            )}
          </div>
          <div className="flex-1">
            <label className={LABEL}>Part Name</label>
            <input className={fieldCls(INPUT, nameErr)} placeholder="e.g. LPK Mirror Azi Push Tab"
              value={part.name} onChange={e => onChange({ ...part, name: e.target.value })} />
            <InlineError errors={nameErr} />
          </div>
        </div>

        {/* ── Stage 2: Metadata + Compare (visible when Part Name filled) ── */}
        {stage2 && (<>
          {/* Qty + Material + Lead Time */}
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-[var(--sp-3)] items-start">
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
          </div>

          {/* Dimensions */}
          <div>
            <label className={LABEL}>Dimensions (L × W × H mm) — optional</label>
            <div className="flex items-center gap-[var(--sp-1)]">
              <input type="number" min="0" step="0.1" className={`${INPUT_COMPACT} w-[80px]`} placeholder="L"
                value={part.dimensions?.length ?? ''} onChange={e => {
                  const v = Number(e.target.value) || 0;
                  const d = part.dimensions ?? { length: 0, width: 0, height: 0 };
                  onChange({ ...part, dimensions: v || d.width || d.height ? { ...d, length: v } : undefined });
                }} />
              <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)]">×</span>
              <input type="number" min="0" step="0.1" className={`${INPUT_COMPACT} w-[80px]`} placeholder="W"
                value={part.dimensions?.width ?? ''} onChange={e => {
                  const v = Number(e.target.value) || 0;
                  const d = part.dimensions ?? { length: 0, width: 0, height: 0 };
                  onChange({ ...part, dimensions: d.length || v || d.height ? { ...d, width: v } : undefined });
                }} />
              <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)]">×</span>
              <input type="number" min="0" step="0.1" className={`${INPUT_COMPACT} w-[80px]`} placeholder="H"
                value={part.dimensions?.height ?? ''} onChange={e => {
                  const v = Number(e.target.value) || 0;
                  const d = part.dimensions ?? { length: 0, width: 0, height: 0 };
                  onChange({ ...part, dimensions: d.length || d.width || v ? { ...d, height: v } : undefined });
                }} />
              <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)] shrink-0">mm</span>
            </div>
          </div>

          {/* Compare */}
          <div>
            <div className="flex flex-wrap items-center gap-x-[var(--sp-4)] gap-y-[var(--sp-1)] px-[var(--sp-3)] py-[var(--sp-2)] rounded-[var(--radius-sm)] bg-[color:var(--gray-50)]">
              <span className={`${SECTION_HEADER} mr-[var(--sp-1)]`}>Compare</span>
              {BUILTIN_COMPARE_DIMS.map(dim => (
                <label key={dim} className="flex items-center gap-[var(--sp-1)] cursor-pointer select-none">
                  <input type="checkbox" className="w-[14px] h-[14px] accent-[var(--color-primary)] cursor-pointer"
                    checked={part.enabledDimensions.includes(dim)} onChange={() => toggleDim(dim)} />
                  <span className="text-[length:var(--text-xs)] text-[color:var(--gray-600)]">{BUILTIN_COMPARE_LABELS[dim]}</span>
                </label>
              ))}
              {/* Custom dimensions */}
              {(part.customDimensions ?? []).map(cd => (
                <label key={cd.id} className="flex items-center gap-[var(--sp-1)] cursor-pointer select-none group/cd">
                  <input type="checkbox" className="w-[14px] h-[14px] accent-[var(--color-primary)] cursor-pointer"
                    checked={part.enabledDimensions.includes(`custom:${cd.id}` as CompareDimension)}
                    onChange={() => toggleDim(`custom:${cd.id}` as CompareDimension)} />
                  <input className="text-[length:var(--text-xs)] text-[color:var(--gray-600)] bg-transparent border-b border-dashed border-transparent hover:border-[color:var(--gray-300)] focus:border-[color:var(--color-primary)] outline-none w-[80px]"
                    value={cd.name} placeholder="Name..."
                    onChange={e => {
                      const updated = (part.customDimensions ?? []).map(d => d.id === cd.id ? { ...d, name: e.target.value } : d);
                      onChange({ ...part, customDimensions: updated });
                    }} />
                  <button className="text-[color:var(--gray-300)] hover:text-[color:var(--color-error)] text-[12px] opacity-0 group-hover/cd:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => {
                      const updated = (part.customDimensions ?? []).filter(d => d.id !== cd.id);
                      const dims = part.enabledDimensions.filter(d => d !== `custom:${cd.id}`);
                      onChange({ ...part, customDimensions: updated.length ? updated : undefined, enabledDimensions: dims });
                    }}>×</button>
                </label>
              ))}
              <button className="text-[length:var(--text-xs)] text-[color:var(--color-primary)] hover:underline cursor-pointer"
                onClick={() => {
                  const id = genId('cd');
                  const dims = [...(part.customDimensions ?? []), { id, name: '' }];
                  onChange({ ...part, customDimensions: dims });
                }}>
                + Dimension
              </button>
            </div>
            <InlineError errors={compareErr} />
          </div>
        </>)}

        {/* ── Stage 3: Options + Notes (visible when Compare checked) ── */}
        {stage3 ? (
          <>
            <div className="flex flex-col">
              <span className={`${SECTION_HEADER} mb-[var(--sp-2)]`}>Pricing Options</span>
              {part.scenarios.map((s, sIdx) => (
                <ScenarioRow key={s.id} scenario={s} index={sIdx}
                  canRemove={part.scenarios.length > 1}
                  enabledDims={part.enabledDimensions}
                  partDefaults={{ qty: part.qty, leadTimeDays: part.leadTimeDays }}
                  customDimensions={part.customDimensions}
                  onChange={u => updateScenario(sIdx, u)}
                  onRemove={() => removeScenario(sIdx)}
                  validation={validation} showErrors={showErr} />
              ))}
              <InlineError errors={scenWarn} />
              <button className={`${BTN_GHOST} self-start mt-[var(--sp-1)]`} onClick={addScenario}>
                + Add Option
              </button>
            </div>

            {/* Per-Part Note */}
            {part.note !== undefined ? (
              <div>
                <div className="flex items-center justify-between mb-[var(--sp-1)]">
                  <span className={SECTION_HEADER}>Part Note</span>
                  <button className={`${BTN_DANGER_TEXT} text-[length:11px] opacity-60 hover:opacity-100`}
                    onClick={() => onChange({ ...part, note: undefined })}>Remove</button>
                </div>
                <textarea className={`${INPUT} min-h-[48px] resize-y`} placeholder="Note specific to this part..."
                  value={part.note || ''} onChange={e => onChange({ ...part, note: e.target.value })} />
              </div>
            ) : (
              <button className={`${BTN_GHOST} self-start text-[length:var(--text-xs)]`}
                onClick={() => onChange({ ...part, note: '' })}>
                + Add Part Note
              </button>
            )}

            {/* Dimension indicator */}
            {analysis.varying.length > 0 && (
              <div className="flex items-center gap-[var(--sp-2)] px-[var(--sp-3)] py-[var(--sp-2)] rounded-[var(--radius-sm)] bg-[color:var(--color-primary-wash,#F7F5FD)]">
                <span className="text-[length:var(--text-xxs)] font-semibold text-[color:var(--color-primary)]">Comparing</span>
                <span className="text-[length:var(--text-xxs)] text-[color:var(--color-primary-light)]">
                  {analysis.varying.map(d => {
                    if (d === 'qty') return 'Quantity';
                    if (d === 'location') return 'Location';
                    if (d === 'material') return 'Material';
                    if (d === 'finish') return 'Finish';
                    if (d === 'leadTime') return 'Lead Time';
                    if (d.startsWith('custom:')) {
                      const cid = d.slice(7);
                      return (part.customDimensions ?? []).find(cd => cd.id === cid)?.name || d;
                    }
                    return d;
                  }).join(' × ')}
                </span>
              </div>
            )}
          </>
        ) : stage2 && (
          /* Fix 6: Hover info box when no Compare checked */
          <div className="py-[var(--sp-3)]"
            onMouseEnter={() => setHoverEmptyZone(true)} onMouseLeave={() => setHoverEmptyZone(false)}>
            {hoverEmptyZone && (
              <div className="flex items-start gap-[var(--sp-2)] px-[var(--sp-3)] py-[var(--sp-2)] rounded-[var(--radius-sm)] bg-[#f0f4ff] border border-[#d0daf0] text-[length:var(--text-xs)] text-[color:var(--gray-600)]">
                <span className="text-[14px] shrink-0">ℹ</span>
                <span>No comparison dimensions selected. Select at least one above to configure pricing options. If you don't need to compare, use the <strong>Quotation</strong> tool for a fixed-price quote.</span>
              </div>
            )}
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
    scenarios: part.scenarios.map(s => {
      // Clean custom dim values: only keep enabled custom dims
      const cleanCustom: Record<string, string> = {};
      for (const cd of part.customDimensions ?? []) {
        if (enabled.includes(`custom:${cd.id}` as CompareDimension) && s.customDimValues?.[cd.id]) {
          cleanCustom[cd.id] = s.customDimValues[cd.id];
        }
      }
      return {
        ...s,
        qty: enabled.includes('qty') ? s.qty : part.qty,
        leadTimeDays: enabled.includes('leadTime') ? s.leadTimeDays : part.leadTimeDays,
        location: enabled.includes('location') ? s.location : undefined,
        materialOverride: enabled.includes('material') ? s.materialOverride : undefined,
        finishOverride: enabled.includes('finish') ? s.finishOverride : undefined,
        customDimValues: Object.keys(cleanCustom).length ? cleanCustom : undefined,
      };
    }),
  };
}

/* ── Build PDF sections for paginated rendering ── */

function buildPdfSections(
  data: QuoteBuilderData,
  fromParty: PartyInfo,
  billToParty: PartyInfo,
  shipToParty: PartyInfo,
  showBillTo: boolean,
): PageSection[] {
  const sections: PageSection[] = [];

  // 1. Title + Meta
  sections.push({
    key: 'title',
    content: (
      <div className="flex justify-between items-start cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="proposal">
        <div>
          <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
            Quote Option Proposal
          </div>
          <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
            #{data.quoteId}
          </div>
        </div>
        <DocumentMeta items={[
          { label: 'Date',  value: data.date },
          { label: 'Valid', value: `${data.validDays} days` },
          { label: 'Terms', value: data.paymentTerm === 'net30' ? 'NET 30' : 'PIA' },
        ]} />
      </div>
    ),
  });

  // 2. Parties
  sections.push({
    key: 'parties',
    content: showBillTo ? (
      data.customer.shippingSameAsBilling ? (
        <div className="grid grid-cols-2 gap-[var(--sp-6)] cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="customer">
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
      )
    ) : (
      /* No customer data yet — only show FROM */
      <div className="cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="customer">
        <SectionLabel>From</SectionLabel>
        <div className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)]">{fromParty.name}</div>
        <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] leading-[1.5]">
          {fromParty.lines.map((l, i) => <span key={i}>{l}{i < fromParty.lines.length - 1 && <br />}</span>)}
        </div>
      </div>
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
    // Fix #3: Skip pricing for Parts with no Compare dimensions
    if (rawPart.enabledDimensions.length === 0) return;
    const normalized = normalizePart(rawPart);
    // Deduplicate identical scenarios (same fingerprint + same price)
    const seen = new Set<string>();
    const dedupedScenarios = normalized.scenarios.filter(s => {
      const customVals = (rawPart.customDimensions ?? []).map(cd => s.customDimValues?.[cd.id] ?? '').join('|');
      const fp = [s.qty, s.unitPrice, s.leadTimeDays, s.location ?? '', s.materialOverride ?? '', s.finishOverride ?? '', customVals].join('|');
      if (seen.has(fp)) return false;
      seen.add(fp);
      return true;
    });
    const part = { ...normalized, scenarios: dedupedScenarios };
    sections.push({
      key: `pricing-part-${part.id}`,
      group: 'pricing',
      content: (
        <div className="cursor-pointer hover:opacity-90 transition-opacity" data-edit-target={`part:${rawPart.id}`}>
          <div className="text-[length:var(--doc-text-secondary,9px)] font-semibold uppercase tracking-[0.06em] text-[color:var(--gray-400)] mb-[var(--sp-1)]">
            Line #{idx + 1}
          </div>
          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {/* Block 1+2 — Identity (left) + Comparison table (right), same bg */}
            <div style={{ backgroundColor: 'var(--gray-50)', display: 'flex', alignItems: 'stretch' }}>
              {/* Left: identity band */}
              <div style={{ minWidth: '180px', maxWidth: '220px', flexShrink: 0, borderRight: '4px solid white', display: 'flex', flexDirection: 'column' }}>
                {/* Thumbnail (left half, flush) + Name/Details (right half, centered) */}
                {(() => {
                  const analysis = analyzeDimensions(part);
                  const effectiveMaterial = analysis.fixed.material || part.material;
                  const effectiveFinish = analysis.fixed.finish || part.finish;
                  const fixedLocation = !analysis.varying.includes('location') && analysis.fixed.location
                    ? (analysis.fixed.location === 'US' ? 'U.S.' : 'Taiwan') : undefined;
                  const fixedQty = !analysis.varying.includes('qty') && analysis.fixed.qty
                    ? `QTY ${analysis.fixed.qty}` : undefined;
                  const details = [
                    effectiveMaterial && !analysis.varying.includes('material') ? effectiveMaterial : null,
                    effectiveFinish && !analysis.varying.includes('finish') ? effectiveFinish : null,
                    fixedLocation ? `${fixedLocation} manufacturing` : null,
                    fixedQty,
                  ].filter(Boolean);
                  return (
                    <div style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
                      {/* Thumbnail — with padding */}
                      {rawPart.thumbnailUrl && (
                        <div style={{ padding: '10px 0 10px 10px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                          <img src={rawPart.thumbnailUrl} alt=""
                            style={{ width: '90px', height: '90px', objectFit: 'cover', display: 'block', borderRadius: 'var(--radius-sm)' }} />
                        </div>
                      )}
                      {/* Name + details — right half, centered */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                        <div className="text-[length:var(--doc-text-body,10px)] font-semibold text-[color:var(--gray-900,#1c1a25)]" style={{ textAlign: 'center' }}>
                          {part.name}
                        </div>
                        {details.length > 0 && (
                          <div className="text-[length:var(--doc-text-secondary,9px)] text-[color:var(--gray-500)]" style={{ marginTop: '6px', textAlign: 'center' }}>
                            {details.join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {/* Dimensions — centered under the group above */}
                {rawPart.dimensions && (rawPart.dimensions.length > 0 || rawPart.dimensions.width > 0 || rawPart.dimensions.height > 0) && (() => {
                  const sorted = [rawPart.dimensions!.length, rawPart.dimensions!.width, rawPart.dimensions!.height].sort((a, b) => b - a);
                  const volMm3 = sorted[0] * sorted[1] * sorted[2];
                  const mmVol = volMm3 >= 1000
                    ? `${(volMm3 / 1000).toFixed(1)} cm³`
                    : `${volMm3.toFixed(0)} mm³`;
                  const inDims = sorted.map(v => (v / 25.4).toFixed(1));
                  const volIn3 = (volMm3 / (25.4 ** 3));
                  const inVol = volIn3 < 1
                    ? `${volIn3.toFixed(3)} in³`
                    : `${volIn3.toFixed(2)} in³`;
                  return (
                    <div style={{ alignSelf: 'stretch' }}>
                      <div style={{ borderTop: '1px solid white' }} />
                      <div className="text-[length:var(--doc-text-secondary,9px)] text-[color:var(--gray-400)]" style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '4px' }}>
                        <div>{sorted[0].toFixed(1)} × {sorted[1].toFixed(1)} × {sorted[2].toFixed(1)} mm · {mmVol}</div>
                        <div>{inDims[0]} × {inDims[1]} × {inDims[2]} in · {inVol}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {/* Right: comparison table */}
              <div style={{ flex: 1, padding: '10px 12px', minWidth: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%' }}><QuoteComparisonTable part={part} hideHeader /></div>
              </div>
            </div>
            {/* Block 3 — Per-Part Note */}
            {rawPart.note?.trim() && (
              <div style={{ backgroundColor: 'var(--gray-50)', padding: '8px 12px', borderTop: '1px solid var(--gray-100)' }}>
                <div className="text-[length:var(--doc-text-secondary,9px)] font-semibold uppercase tracking-[0.06em] text-[color:var(--gray-500)] mb-[2px]">Note</div>
                <p className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)]">{rawPart.note}</p>
              </div>
            )}
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
          <div className="cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="mfgNotes">
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
        <div className="cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="leadTime">
          <SectionLabel>{data.sections.leadTime.label}</SectionLabel>
          <p className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)] mt-[var(--sp-2)]">
            {resolvedLeadTimeContent}
          </p>
        </div>
        <div className="cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="shipping">
          <SectionLabel>{data.sections.shipping.label}</SectionLabel>
          <p className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)] mt-[var(--sp-2)]">
            {data.sections.shipping.content}
          </p>
        </div>
        <div className="cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="paymentTerms">
          <SectionLabel>{data.sections.paymentTerms.label}</SectionLabel>
          <ul className="space-y-[var(--sp-1)] mt-[var(--sp-2)]">
            {paymentItems.map((t, i) => (
              <li key={i} className="flex gap-[var(--sp-2)] text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)]">
                <span className="text-[color:var(--gray-300)]">•</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="text-[length:var(--doc-text-secondary,9px)] text-[color:var(--gray-400)] italic mt-[var(--sp-2)]">
            {data.paymentTerm === 'pia'
              ? `→ To confirm: wire payment referencing Quote #${data.quoteId}`
              : `→ To confirm: issue a PO referencing Quote #${data.quoteId}`}
          </p>
        </div>
      </div>
    ),
  });

  // 5. Quote Notes (before T&C)
  if (data.quoteNotes?.trim()) {
    sections.push({
      key: 'quoteNotes',
      content: (
        <div className="cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="quoteNotes">
          <SectionLabel>Notes</SectionLabel>
          <p className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)] mt-[var(--sp-2)] leading-[1.5]">
            {data.quoteNotes}
          </p>
        </div>
      ),
    });
  }

  // 6. How to Proceed — actionable steps for customer (varies by paymentTerm)
  const isPia = data.paymentTerm === 'pia';
  const proceedSteps = isPia
    ? [
        `Reply to this quote with your approval (email is sufficient)`,
        `Wire full payment to the bank account below, referencing Quote #${data.quoteId}`,
        `Send payment confirmation to sales@instavoxel.com — production begins within 5 business days`,
      ]
    : [
        `Reply to this quote with your approval (email is sufficient)`,
        `Issue a Purchase Order (PO) referencing Quote #${data.quoteId}`,
        `Email your PO to sales@instavoxel.com — production begins upon receipt`,
      ];

  sections.push({
    key: 'how-to-proceed',
    content: (
      <div style={{
        border: '1px solid var(--gray-200)',
        borderRadius: '4px',
        padding: '12px 14px',
        backgroundColor: 'color-mix(in srgb, var(--color-primary) 3%, transparent)',
      }}>
        <div className="text-[length:var(--doc-text-label,9px)] font-semibold uppercase tracking-[var(--doc-tracking-label,0.05em)] text-[color:var(--color-primary)] mb-[var(--sp-2)]">
          How to Proceed
        </div>
        <ol style={{ margin: 0, paddingLeft: '16px', listStyleType: 'decimal' }}>
          {proceedSteps.map((step, i) => (
            <li key={i} className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-700)]" style={{ marginBottom: i < proceedSteps.length - 1 ? '4px' : 0 }}>
              {step}
            </li>
          ))}
        </ol>
        {isPia && (
          <div className="mt-[var(--sp-2)] text-[length:var(--doc-text-secondary,9px)] text-[color:var(--gray-500)]">
            Payment accepted via wire transfer (USD or TWD). Contact us for bank details.
          </div>
        )}
      </div>
    ),
  });

  // 7. Terms — uses editable section content with custom label
  sections.push({
    key: 'terms',
    content: (
      <div className="flex flex-col gap-[var(--sp-1)] cursor-pointer hover:opacity-80 transition-opacity" data-edit-target="terms">
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
  const [collapsedParts, setCollapsedParts] = useState<Set<string>>(new Set());
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const togglePartCollapse = useCallback((partId: string) => {
    setCollapsedParts(prev => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId); else next.add(partId);
      return next;
    });
  }, []);

  /** PDF click → scroll to corresponding editor section */
  const scrollToEditor = useCallback((targetId: string) => {
    if (!leftPanelRef.current) return;
    // Expand part if collapsed
    if (targetId.startsWith('part:')) {
      const partId = targetId.replace('part:', '');
      setCollapsedParts(prev => { const next = new Set(prev); next.delete(partId); return next; });
    }
    // Highlight + scroll + open <details> if needed
    setHighlightSection(targetId);
    setTimeout(() => {
      const el = leftPanelRef.current?.querySelector(`[data-edit-id="${targetId}"]`);
      if (el instanceof HTMLDetailsElement && !el.open) el.open = true;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    setTimeout(() => setHighlightSection(null), 2000);
  }, []);

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
  // Sync unitPrice from cost/margin for each scenario before output
  const outputData = {
    ...normalizedData,
    parts: normalizedData.parts.map(p => ({
      ...p,
      scenarios: p.scenarios.map(s => ({ ...s, unitPrice: computeUnitPrice(s) })),
    })),
  };
  const emailText = renderEmail(outputData);
  const errorCount = validation.errors.filter(e => e.severity === 'error').length;
  const warningCount = validation.errors.filter(e => e.severity === 'warning').length;

  // Customer incomplete warnings (Fix 2)
  const customerStarted = !!(data.customer.companyName.trim() || data.customer.contactName.trim());
  const customerIncomplete = customerStarted ? [
    !data.customer.companyName.trim() && 'Company',
    !data.customer.contactName.trim() && 'Contact',
    !data.customer.email?.trim() && 'Email',
    !data.customer.phone?.trim() && 'Phone',
    !data.customer.billingAddress.street.trim() && 'Billing Address',
    ...(!data.customer.shippingSameAsBilling && !data.customer.shippingAddress.street.trim() ? ['Shipping Address'] : []),
  ].filter(Boolean) as string[] : [];

  // Auto-reset showErrors when all errors fixed
  useEffect(() => {
    if (errorCount === 0 && warningCount === 0) setShowErrors(false);
  }, [errorCount, warningCount]);

  /** Trigger error display + scroll to first error */
  const revealErrors = useCallback(() => {
    setShowErrors(true);
    setTimeout(() => {
      // Find first error, fall back to first warning
      const first = validation.errors.find(e => e.severity === 'error')
        || validation.errors.find(e => e.severity === 'warning');
      if (!first) {
        // Customer incomplete warnings (not in validation.errors)
        if (customerIncomplete.length > 0) { scrollToEditor('customer'); }
        return;
      }
      // Quote-level errors → map to editor targets when inside collapsible sections
      if (first.path === 'quote') {
        if (first.field?.startsWith('note:')) { scrollToEditor('mfgNotes'); return; }
        // Other quote fields (quoteId, date, validDays, leadTimeDays) are always visible
        return;
      }
      // Part/Scenario errors → scroll to parent Part
      for (const p of data.parts) {
        if (first.path === `part:${p.id}` || p.scenarios.some(s => first.path === `scenario:${s.id}`)) {
          scrollToEditor(`part:${p.id}`);
          return;
        }
      }
    }, 50);
  }, [validation, data.parts, customerIncomplete, scrollToEditor]);

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
    // Block on errors
    if (errorCount > 0) { revealErrors(); return; }
    // Confirm on any warnings (validation + customer)
    const allWarnings: string[] = [
      ...customerIncomplete.map(f => `Customer: ${f} is empty`),
      ...validation.errors.filter(e => e.severity === 'warning').map(e => e.message),
    ];
    if (allWarnings.length > 0) {
      revealErrors();
      if (!window.confirm(`Warnings:\n${allWarnings.map(w => `• ${w}`).join('\n')}\n\nDownload anyway?`)) return;
    }
    downloadPdf({ filename: `Quote-Proposal-${data.quoteId}`, useHtmlMode: true });
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
      ...(data.customer.phone ? [data.customer.phone] : []),
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

  // Memoize PDF sections — prevents PaginatedDocument re-renders + DOM measurements
  // on every keystroke when only the left-panel state (collapsed, etc.) changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pdfSections = useMemo(
    () => buildPdfSections(outputData, fromParty, billToParty, shipToParty, customerStarted),
    [data], // data is the source of truth for all inputs
  );

  return (
    <div data-comp="QuoteBuilder" className="flex h-screen w-screen bg-[color:var(--bg-base,var(--gray-50))]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", position: 'fixed', top: 0, left: 0 }}>

      {/* ══════════ LEFT PANEL — v3 redesign ══════════ */}
      <div className="w-1/2 min-w-[420px] flex flex-col border-r border-[color:var(--gray-200)] bg-white">

        {/* Panel header */}
        <div className="shrink-0 flex items-center justify-between h-[var(--header-h,56px)] px-[var(--sp-5)] border-b border-[color:var(--gray-150)]">
          <h1 className="text-[length:var(--text-lg)] font-bold text-[color:var(--color-primary)]">
            Quote Proposal Builder
          </h1>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto" ref={leftPanelRef}>
          <div className="p-[var(--sp-5)] flex flex-col gap-[var(--sp-5)]">

            {/* ── PROPOSAL ── */}
            <section data-edit-id="proposal"
              className={`transition-all duration-300 ${highlightSection === 'proposal' ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30 rounded-[var(--radius-sm)]' : ''}`}>
              <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-3)]">
                <span className={`w-[6px] h-[6px] rounded-full ${data.quoteId.trim() ? 'bg-[#22c55e]' : 'border border-[color:var(--gray-300)]'}`} />
                <span className={SECTION_HEADER}>Proposal</span>
              </div>
              <div className="grid grid-cols-[1fr_100px_1fr] gap-[var(--sp-3)]">
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
                <div>
                  <label className={LABEL}>Cover Letter</label>
                  <select className={INPUT} value={data.coverLetterStrategy}
                    onChange={e => setData(d => ({ ...d, coverLetterStrategy: e.target.value as CoverLetterStrategy }))}>
                    <option value="standard">Standard</option>
                    <option value="target_price">Responding to Target Price</option>
                    <option value="dual_location">Dual Location Comparison</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              {data.coverLetterStrategy === 'custom' && (
                <textarea className={`${INPUT} mt-[var(--sp-3)] min-h-[80px]`}
                  placeholder="Write your cover letter..."
                  value={data.coverLetterCustom || ''}
                  onChange={e => setData(d => ({ ...d, coverLetterCustom: e.target.value }))} />
              )}
            </section>

            <div className="border-t border-[color:var(--gray-75)]" />

            {/* ── CUSTOMER (progressive disclosure) ── */}
            <section data-edit-id="customer"
              className={`transition-all duration-300 ${highlightSection === 'customer' ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30 rounded-[var(--radius-sm)]' : ''}`}>
              <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-3)]">
                <span className={`w-[6px] h-[6px] rounded-full ${customerStarted && customerIncomplete.length === 0 ? 'bg-[#22c55e]' : customerStarted ? 'bg-[color:var(--color-warning)]' : 'border border-[color:var(--gray-300)]'}`} />
                <span className={SECTION_HEADER}>Customer</span>
                {showErrors && customerIncomplete.length > 0 && (
                  <span className="text-[length:var(--text-xxs)] text-[color:var(--color-warning)]">Missing: {customerIncomplete.join(', ')}</span>
                )}
              </div>
              <div className="flex flex-col gap-[var(--sp-3)]">
                {/* Always visible: Company + Contact */}
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
                {/* Progressive: show rest when Company or Contact has value */}
                {customerStarted && (<>
                  <div className="grid grid-cols-2 gap-[var(--sp-3)]">
                    <div>
                      <label className={LABEL}>Email</label>
                      <input className={INPUT} type="email" placeholder="purchasing@acme.com" value={data.customer.email || ''}
                        onChange={e => setData(d => ({ ...d, customer: { ...d.customer, email: e.target.value } }))} />
                    </div>
                    <div>
                      <label className={LABEL}>Phone</label>
                      <input className={INPUT} type="tel" placeholder="+1-555-000-0000" value={data.customer.phone || ''}
                        onChange={e => setData(d => ({ ...d, customer: { ...d.customer, phone: e.target.value } }))} />
                    </div>
                  </div>
                  <AddressFields label="Billing Address" address={data.customer.billingAddress}
                    onChange={a => setData(d => ({ ...d, customer: { ...d.customer, billingAddress: a } }))} />
                  <div className="flex items-center gap-[var(--sp-2)]">
                    <input type="checkbox" id="ship-same"
                      className="w-[16px] h-[16px] accent-[var(--color-primary)] cursor-pointer"
                      checked={data.customer.shippingSameAsBilling}
                      onChange={e => setData(d => ({
                        ...d, customer: { ...d.customer, shippingSameAsBilling: e.target.checked,
                          shippingAddress: e.target.checked ? d.customer.billingAddress : d.customer.shippingAddress }
                      }))} />
                    <label htmlFor="ship-same" className="text-[length:var(--text-xs)] text-[color:var(--gray-600)] cursor-pointer select-none">
                      Shipping same as billing address
                    </label>
                  </div>
                  {!data.customer.shippingSameAsBilling && (
                    <AddressFields label="Shipping Address" address={data.customer.shippingAddress}
                      onChange={a => setData(d => ({ ...d, customer: { ...d.customer, shippingAddress: a } }))} />
                  )}
                </>)}
              </div>
            </section>

            <div className="border-t border-[color:var(--gray-75)]" />

            {/* ── PARTS ── */}
            <section>
              <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-3)]">
                <span className={`w-[6px] h-[6px] rounded-full ${data.parts.every(p => p.name.trim() && p.material.trim()) ? 'bg-[#22c55e]' : 'border border-[color:var(--gray-300)]'}`} />
                <span className={SECTION_HEADER}>Parts ({data.parts.length})</span>
                <div className="flex-1" />
                <button className={`${BTN_GHOST} text-[length:var(--text-xs)]`} onClick={addPart}>+ Add Part</button>
              </div>

              <div className="flex flex-col gap-[var(--sp-1)]">
                {data.parts.map((part, idx) => (
                  <div key={part.id}
                    data-edit-id={`part:${part.id}`}
                    className={`rounded-[var(--radius-md)] border border-[color:var(--gray-75)] transition-all duration-300 ${highlightSection === `part:${part.id}` ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30' : ''}`}>
                    <PartEditor part={part} index={idx}
                      canRemove={data.parts.length > 1}
                      collapsed={collapsedParts.has(part.id)}
                      onToggle={() => togglePartCollapse(part.id)}
                      onChange={p => updatePart(idx, p)}
                      onRemove={() => removePart(idx)}
                      onDuplicate={() => duplicatePart(idx)}
                      validation={validation} showErrors={showErrors} />
                  </div>
                ))}
              </div>

              <button className="w-full mt-[var(--sp-3)] py-[var(--sp-3)] border-2 border-dashed border-[color:var(--gray-200)] rounded-[var(--radius-md)] text-[length:var(--text-sm)] text-[color:var(--gray-400)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] transition-colors cursor-pointer bg-transparent"
                onClick={addPart}>
                + Add Part
              </button>
            </section>

            <div className="border-t border-[color:var(--gray-75)]" />

            {/* ── DELIVERY & TERMS ── */}
            <section>
              <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-3)]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#22c55e]" />
                <span className={SECTION_HEADER}>Delivery & Terms</span>
              </div>

              {/* Lead Time — always expanded (edited almost every time) */}
              <div data-edit-id="leadTime"
                className={`mb-[var(--sp-4)] transition-all duration-300 ${highlightSection === 'leadTime' ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30 rounded-[var(--radius-sm)] p-[var(--sp-2)]' : ''}`}>
                <SectionEditor section={data.sections.leadTime}
                  placeholder="Use {leadTime} for auto lead time range"
                  onChange={s => setData(d => ({ ...d, sections: { ...d.sections, leadTime: s } }))} />
              </div>

              {/* Mfg Notes — Fix 4: group/details for arrow, Fix 5: textarea */}
              <details className={`mb-[var(--sp-3)] group/mfg rounded-[var(--radius-sm)] transition-all duration-300 ${highlightSection === 'mfgNotes' ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30' : ''}`} data-edit-id="mfgNotes">
                <summary className="cursor-pointer select-none flex items-center gap-[var(--sp-2)] py-[var(--sp-2)] hover:bg-[color:var(--gray-50)] rounded-[var(--radius-sm)] px-[var(--sp-2)]">
                  <span className="text-[color:var(--gray-400)] text-[12px] group-open/mfg:rotate-90 transition-transform">▶</span>
                  <span className={SECTION_HEADER}>Manufacturing Notes</span>
                  <span className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] truncate flex-1">{data.manufacturingNotes[0] || ''}</span>
                </summary>
                <div className="pt-[var(--sp-2)] pl-[var(--sp-5)]">
                  <textarea className={`${INPUT} min-h-[60px] resize-y`} placeholder="One note per line"
                    value={data.manufacturingNotes.join('\n')}
                    onChange={e => setData(d => ({ ...d, manufacturingNotes: e.target.value.split('\n') }))} />
                </div>
              </details>

              {/* Shipping */}
              <details className={`mb-[var(--sp-3)] group/ship rounded-[var(--radius-sm)] transition-all duration-300 ${highlightSection === 'shipping' ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30' : ''}`} data-edit-id="shipping">
                <summary className="cursor-pointer select-none flex items-center gap-[var(--sp-2)] py-[var(--sp-2)] hover:bg-[color:var(--gray-50)] rounded-[var(--radius-sm)] px-[var(--sp-2)]">
                  <span className="text-[color:var(--gray-400)] text-[12px] group-open/ship:rotate-90 transition-transform">▶</span>
                  <span className={SECTION_HEADER}>{data.sections.shipping.label}</span>
                  <span className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] truncate flex-1">{data.sections.shipping.content.slice(0, 40)}...</span>
                </summary>
                <div className="pt-[var(--sp-2)] pl-[var(--sp-5)]">
                  <SectionEditor section={data.sections.shipping}
                    onChange={s => setData(d => ({ ...d, sections: { ...d.sections, shipping: s } }))} />
                </div>
              </details>

              {/* Payment Terms */}
              <details className={`mb-[var(--sp-3)] group/pay rounded-[var(--radius-sm)] transition-all duration-300 ${highlightSection === 'paymentTerms' ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30' : ''}`} data-edit-id="paymentTerms">
                <summary className="cursor-pointer select-none flex items-center gap-[var(--sp-2)] py-[var(--sp-2)] hover:bg-[color:var(--gray-50)] rounded-[var(--radius-sm)] px-[var(--sp-2)]">
                  <span className="text-[color:var(--gray-400)] text-[12px] group-open/pay:rotate-90 transition-transform">▶</span>
                  <span className={SECTION_HEADER}>{data.sections.paymentTerms.label}</span>
                  <span className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] truncate flex-1">{data.sections.paymentTerms.content.split('\n')[0].slice(0, 40)}...</span>
                </summary>
                <div className="pt-[var(--sp-2)] pl-[var(--sp-5)]">
                  {/* Payment term selector — drives PDF meta + How to Proceed section */}
                  <div className="flex items-center gap-[var(--sp-3)] mb-[var(--sp-3)]">
                    <span className={LABEL}>Term Type</span>
                    {(['pia', 'net30'] as const).map(t => (
                      <label key={t} className="flex items-center gap-[var(--sp-1)] cursor-pointer select-none">
                        <input
                          type="radio"
                          name="paymentTerm"
                          value={t}
                          checked={data.paymentTerm === t}
                          onChange={() => setData(d => ({ ...d, paymentTerm: t }))}
                          className="accent-[var(--color-primary)] cursor-pointer"
                        />
                        <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-700)]">
                          {t === 'pia' ? 'PIA' : 'NET 30'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <SectionEditor section={data.sections.paymentTerms} placeholder="One item per line"
                    onChange={s => setData(d => ({ ...d, sections: { ...d.sections, paymentTerms: s } }))} />
                </div>
              </details>

              {/* Quote Notes — collapsible like others, Fix 3 */}
              <details className={`mb-[var(--sp-3)] group/qn rounded-[var(--radius-sm)] transition-all duration-300 ${highlightSection === 'quoteNotes' ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30' : ''}`} data-edit-id="quoteNotes">
                <summary className="cursor-pointer select-none flex items-center gap-[var(--sp-2)] py-[var(--sp-2)] hover:bg-[color:var(--gray-50)] rounded-[var(--radius-sm)] px-[var(--sp-2)]">
                  <span className="text-[color:var(--gray-400)] text-[12px] group-open/qn:rotate-90 transition-transform">▶</span>
                  <span className={SECTION_HEADER}>Quote Notes</span>
                  <span className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] truncate flex-1">{(data.quoteNotes || '').slice(0, 40) || '(empty)'}</span>
                </summary>
                <div className="pt-[var(--sp-2)] pl-[var(--sp-5)]">
                  <textarea className={`${INPUT} min-h-[48px] resize-y`} placeholder="Additional notes for this quote..."
                    value={data.quoteNotes || ''} onChange={e => setData(d => ({ ...d, quoteNotes: e.target.value }))} />
                </div>
              </details>

              {/* T&C */}
              <details className={`group/tc rounded-[var(--radius-sm)] transition-all duration-300 ${highlightSection === 'terms' ? 'ring-2 ring-[color:var(--color-primary)] ring-opacity-30' : ''}`} data-edit-id="terms">
                <summary className="cursor-pointer select-none flex items-center gap-[var(--sp-2)] py-[var(--sp-2)] hover:bg-[color:var(--gray-50)] rounded-[var(--radius-sm)] px-[var(--sp-2)]">
                  <span className="text-[color:var(--gray-400)] text-[12px] group-open/tc:rotate-90 transition-transform">▶</span>
                  <span className={SECTION_HEADER}>{data.sections.terms.label}</span>
                  <span className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] truncate flex-1">{data.sections.terms.content.slice(0, 40)}...</span>
                </summary>
                <div className="pt-[var(--sp-2)] pl-[var(--sp-5)]">
                  <SectionEditor section={data.sections.terms} placeholder="Each numbered term on its own line"
                    onChange={s => setData(d => ({ ...d, sections: { ...d.sections, terms: s } }))} />
                </div>
              </details>
            </section>

            <div className="h-[var(--sp-8)]" />
          </div>
        </div>

        {/* Floating error bar */}
        {/* Floating error/warning bar */}
        {(errorCount > 0 || warningCount > 0 || customerIncomplete.length > 0) && (
          <div className={`shrink-0 flex items-center justify-between h-[36px] px-[var(--sp-4)] border-t border-[color:var(--gray-150)] ${errorCount > 0 ? 'bg-[#fef2f2]' : 'bg-[#fffbeb]'}`}>
            <span className="text-[length:var(--text-xs)] font-medium flex items-center gap-[var(--sp-1)]">
              {errorCount > 0 && <span className="text-[color:var(--color-error)]">{errorCount} error{errorCount > 1 ? 's' : ''}</span>}
              {(errorCount > 0 && (warningCount > 0 || customerIncomplete.length > 0)) && <span className="text-[color:var(--gray-300)]">·</span>}
              {(warningCount > 0 || customerIncomplete.length > 0) && (
                <span className="text-[color:var(--color-warning)]">
                  {warningCount + customerIncomplete.length} warning{(warningCount + customerIncomplete.length) > 1 ? 's' : ''}
                </span>
              )}
            </span>
            <span className="flex items-center gap-[var(--sp-3)]">
              {showErrors && (
                <button className="text-[length:var(--text-xs)] font-medium cursor-pointer hover:underline text-[color:var(--gray-400)]"
                  onClick={() => setShowErrors(false)}>
                  Hide
                </button>
              )}
              <button className={`text-[length:var(--text-xs)] font-medium cursor-pointer hover:underline ${errorCount > 0 ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-warning)]'}`}
                onClick={revealErrors}>
                View
              </button>
            </span>
          </div>
        )}
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
            {(errorCount > 0 || warningCount > 0 || customerIncomplete.length > 0) && (
              <button className="text-[length:var(--text-xs)] font-medium cursor-pointer hover:underline flex items-center gap-[var(--sp-1)]"
                onClick={revealErrors}>
                {errorCount > 0 && <span className="text-[color:var(--color-error)]">{errorCount} error{errorCount > 1 ? 's' : ''}</span>}
                {(errorCount > 0 && (warningCount > 0 || customerIncomplete.length > 0)) && <span className="text-[color:var(--gray-300)]">·</span>}
                {(warningCount > 0 || customerIncomplete.length > 0) && (
                  <span className="text-[color:var(--color-warning)]">{warningCount + customerIncomplete.length} warning{(warningCount + customerIncomplete.length) > 1 ? 's' : ''}</span>
                )}
              </button>
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
            /* ── PDF preview — click any section to jump to editor ── */
            <div ref={pdfRef} onClick={e => {
              const target = (e.target as HTMLElement).closest('[data-edit-target]');
              if (target) scrollToEditor(target.getAttribute('data-edit-target')!);
            }}>
              <PaginatedDocument
                docType="Quote Option Proposal"
                docId={data.quoteId}
                sections={pdfSections}
                closing="We look forward to working with you."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
