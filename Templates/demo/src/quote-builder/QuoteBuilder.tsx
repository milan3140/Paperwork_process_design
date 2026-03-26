/**
 * QuoteBuilder — Main split-pane editor for composing quotes
 *
 * Left panel: structured input (customer, parts, scenarios)
 * Right panel: live preview (email text / PDF)
 *
 * Design: Uses Design_Sys_style.css + documents.css tokens exclusively.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { QuoteBuilderData, QuotePart, Scenario, CoverLetterStrategy, Address } from './types';
import { createDefaultQuote, createEmptyPart, createEmptyScenario, createEmptyAddress, genId } from './types';
import { analyzeDimensions } from './dimensionEngine';
import { renderEmail, getCoverLetterText } from './emailRenderer';
import { QuoteComparisonTable } from './QuoteComparisonTable';
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
   SCENARIO ROW
   ═══════════════════════════════════════════════════════════════ */

function ScenarioRow({
  scenario, index, canRemove, onChange, onRemove, validation,
}: {
  scenario: Scenario; index: number; canRemove: boolean;
  onChange: (s: Scenario) => void; onRemove: () => void;
  validation: ValidationResult;
}) {
  const path = `scenario:${scenario.id}`;
  const qtyErr = validation.getErrors(path, 'qty');
  const priceErr = validation.getErrors(path, 'unitPrice');
  const leadErr = validation.getErrors(path, 'leadTimeDays');
  const dupErr = validation.getErrors(path, '_duplicate');
  const collisionErr = validation.getErrors(path, '_collision');
  const rowWarnings = [...dupErr, ...collisionErr];

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

      {/* Row 1: Core fields */}
      <div className="grid grid-cols-[64px_1fr_80px] gap-[var(--sp-2)] items-start">
        <div>
          <label className={LABEL}>Qty</label>
          <input type="number" min="1" step="1"
            className={fieldCls(`${INPUT_COMPACT} w-full`, qtyErr)}
            value={scenario.qty || ''} onChange={e => onChange({ ...scenario, qty: Number(e.target.value) || 0 })} />
          <InlineError errors={qtyErr} />
        </div>
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
        <div>
          <label className={LABEL}>Lead</label>
          <div className="flex items-center gap-[var(--sp-1)]">
            <input type="number" min="1" step="1"
              className={fieldCls(`${INPUT_COMPACT} w-[56px]`, leadErr)}
              value={scenario.leadTimeDays || ''} onChange={e => onChange({ ...scenario, leadTimeDays: Number(e.target.value) || 0 })} />
            <span className="text-[length:var(--text-xxs)] text-[color:var(--gray-400)]">days</span>
          </div>
          <InlineError errors={leadErr} />
        </div>
      </div>

      {/* Row 2: Dimension overrides */}
      <div className="grid grid-cols-4 gap-[var(--sp-2)] mt-[var(--sp-2)]">
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
        <div>
          <label className={LABEL}>Material</label>
          <input className={`${INPUT_COMPACT} w-full text-left`} placeholder="Override"
            value={scenario.materialOverride || ''}
            onChange={e => onChange({ ...scenario, materialOverride: e.target.value || undefined })} />
        </div>
        <div>
          <label className={LABEL}>Finish</label>
          <input className={`${INPUT_COMPACT} w-full text-left`} placeholder="Override"
            value={scenario.finishOverride || ''}
            onChange={e => onChange({ ...scenario, finishOverride: e.target.value || undefined })} />
        </div>
        <div>
          <label className={LABEL}>Label</label>
          <input className={`${INPUT_COMPACT} w-full text-left`} placeholder="Custom"
            value={scenario.customLabel || ''}
            onChange={e => onChange({ ...scenario, customLabel: e.target.value || undefined })} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PART EDITOR
   ═══════════════════════════════════════════════════════════════ */

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

  const updateScenario = (sIdx: number, s: Scenario) => {
    const next = [...part.scenarios]; next[sIdx] = s;
    onChange({ ...part, scenarios: next });
  };
  const removeScenario = (sIdx: number) =>
    onChange({ ...part, scenarios: part.scenarios.filter((_, i) => i !== sIdx) });
  const addScenario = () => {
    const last = part.scenarios[part.scenarios.length - 1];
    const s = createEmptyScenario();
    s.qty = last?.qty || 1;
    s.leadTimeDays = last?.leadTimeDays || 20;
    if (last?.location === 'TW') s.location = 'US';
    else if (last?.location === 'US') s.location = 'TW';
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
        {/* Part identity */}
        <div>
          <label className={LABEL}>Part Name</label>
          <input className={fieldCls(INPUT, nameErr)} placeholder="e.g. LPK Mirror Azi Push Tab"
            value={part.name} onChange={e => onChange({ ...part, name: e.target.value })} />
          <InlineError errors={nameErr} />
        </div>
        <div className="grid grid-cols-2 gap-[var(--sp-3)]">
          <div>
            <label className={LABEL}>Material</label>
            <input className={fieldCls(INPUT, matErr)} placeholder="e.g. Aluminum 6061-T6"
              value={part.material} onChange={e => onChange({ ...part, material: e.target.value })} />
            <InlineError errors={matErr} />
          </div>
          <div>
            <label className={LABEL}>Finish</label>
            <input className={INPUT} placeholder="e.g. As-Machined" value={part.finish || ''}
              onChange={e => onChange({ ...part, finish: e.target.value || undefined })} />
          </div>
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
            Quotation
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

  // 3. Pricing — single section with all parts grouped together
  sections.push({
    key: 'pricing',
    content: (
      <div className="flex flex-col">
        <SectionLabel className="!border-b !border-[var(--color-primary)]">
          <span className="text-[color:var(--color-primary)]">Pricing</span>
        </SectionLabel>
        <div className="flex flex-col gap-[var(--sp-3)] mt-[var(--sp-3)]">
          {data.parts.map((part, i) => (
            <div key={part.id} className="bg-[color:var(--gray-50)] rounded-[var(--radius-sm)] p-[var(--sp-3)]">
              <QuoteComparisonTable part={part} />
            </div>
          ))}
        </div>
        <div className="border-b border-[color:var(--color-primary)] mt-[var(--sp-3)]" />
      </div>
    ),
  });

  // 4. Info grid (Mfg Notes + Lead Time + Shipping + Payment)
  const allLeadTimes = data.parts.flatMap(p => p.scenarios.map(s => s.leadTimeDays)).filter(d => d > 0);
  const uniqueLT = [...new Set(allLeadTimes)].sort((a, b) => a - b);
  const ltMin = uniqueLT[0];
  const ltMax = uniqueLT[uniqueLT.length - 1];

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
          <SectionLabel>Lead Time</SectionLabel>
          <p className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)] mt-[var(--sp-2)]">
            {uniqueLT.length <= 1 ? (
              <>Standard: ship in <strong className="text-[color:var(--gray-900)]">{ltMin || data.leadTimeDays} workdays</strong> after order confirmation &amp; payment.</>
            ) : (
              <>Estimated <strong className="text-[color:var(--gray-900)]">{ltMin}–{ltMax} workdays</strong> depending on option selected. See pricing details above.</>
            )}
          </p>
        </div>
        <div>
          <SectionLabel>Shipping</SectionLabel>
          <p className="text-[length:var(--doc-text-body,10px)] text-[color:var(--gray-600)] mt-[var(--sp-2)]">
            Shipping is not included. We can charge separately or ship via your carrier account.
          </p>
        </div>
        <div>
          <SectionLabel>Payment Terms</SectionLabel>
          <ul className="space-y-[var(--sp-1)] mt-[var(--sp-2)]">
            {['All quoted prices are in U.S. dollars',
              'Full upfront payment required before production',
              'Wire, Credit Card (3% fee), ACH (U.S. domestic only)',
            ].map((t, i) => (
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

  // 5. Terms
  sections.push({
    key: 'terms',
    content: (
      <TermsSection
        text={`1. This quotation is valid for ${data.validDays} days from the date of issue. Pricing is subject to change after expiration. 2. Customer is responsible for all applicable import duties, taxes, and customs fees. 3. Lead time begins upon receipt of a signed Purchase Order and payment (or credit approval). Lead time is stated in business days. 4. InstaVoxel retains no design responsibility. Parts are manufactured per customer-supplied drawings and specifications. 5. Standard inspection is included. Formal dimensional inspection reports (FAI/CMM) available upon request at additional cost. 6. Cancellation after production commencement may result in charges for materials consumed and work completed. 7. For complete terms, visit:`}
        linkUrl="https://www.instavoxel.com/terms"
      />
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
  const emailText = renderEmail(data);
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
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Quote ${data.quoteId}</title>${styles}${printCss}
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
            Quote Builder
          </h1>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-[var(--sp-5)] flex flex-col gap-[var(--sp-4)]">

            {/* ── Quote Info ── */}
            <div className={CARD}>
              <div className="px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[color:var(--gray-100)]">
                <span className="text-[length:var(--text-sm)] font-semibold text-[color:var(--gray-900)]">Quote Info</span>
              </div>
              <div className="p-[var(--sp-4)] grid grid-cols-[1fr_100px] gap-[var(--sp-3)]">
                <div>
                  <label className={LABEL}>Quote ID</label>
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
                sections={buildPdfSections(data, fromParty, billToParty, shipToParty)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
