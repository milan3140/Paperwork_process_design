/**
 * PartBlock — Single part section for document line items
 *
 * Renders a complete part entry: thumbnail, part ID, dimensions, material,
 * pricing, 7-column parameter grid with left-border dividers, and referenced
 * files (Model + Drawings). No card wrapper — parts are separated by
 * horizontal divider lines only (禁止卡片式設計).
 *
 * This is the print equivalent of the web PartCard component.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, Icons_Print.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name        | Type     | Required | Default | Description                                    |
 * |-------------|----------|----------|---------|------------------------------------------------|
 * | part        | PartData | yes      | —       | Complete part data object                      |
 * | showDivider | boolean  | no       | true    | Show bottom border. Set false for last item.   |
 *
 * PartData shape:
 * | Field        | Type        | Required | Description                                           |
 * |--------------|-------------|----------|-------------------------------------------------------|
 * | id           | string      | yes      | Part identifier (e.g. "P01")                         |
 * | dims         | string      | yes      | Dimensions string (e.g. "255.0 × 225.0 × 34.5 mm · 0.86 kg") |
 * | material     | string      | yes      | Full material name (e.g. "Aluminum 6061-T6")         |
 * | quantity     | number      | yes      | Number of pieces                                      |
 * | unitPrice    | number      | yes      | Price per unit in USD                                 |
 * | amount       | number      | yes      | Total line amount (quantity × unitPrice)              |
 * | thumbnail    | string      | no       | Image URL for 3D preview. Shows "3D" placeholder if omitted. |
 * | params       | PartParam[] | yes      | Array of exactly 7 parameter items                   |
 * | modelFile    | string      | yes      | STEP/STL model filename                              |
 * | drawingFiles | string[]    | yes      | Array of drawing PDF filenames                       |
 *
 * PartParam shape:
 * | Field | Type   | Description                                        |
 * |-------|--------|----------------------------------------------------|
 * | label | string | Parameter label (e.g. "Finish", "Tolerance")       |
 * | value | string | Parameter value (e.g. "Standard", "±0.13mm")       |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `showDivider`: Set false for the last part in a list to avoid trailing border.
 * - `params` array: Must contain exactly 7 items. Column widths are fixed at
 *   1fr / 1.2fr / 1.2fr / 0.7fr / 0.7fr / 1.2fr / 1.2fr for:
 *   Finish / Tolerance / Surface Roughness / Threads / Inserts / Part Marking / Inspection
 * - `thumbnail`: Pass a URL for real 3D render; omit for placeholder.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <PartBlock part={partData} />
 *   <PartBlock part={partData} showDivider={false} />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use inside Quote and Invoice documents for each line item. Also usable
 * in Packing Slip (without pricing) by setting unitPrice/amount to 0.
 */

import { PRINT_ICONS } from './Icons_Print';

export interface PartParam {
  label: string;
  value: string;
}

export interface PartData {
  id: string;
  dims: string;
  material: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  thumbnail?: string;
  params: PartParam[];
  modelFile: string;
  drawingFiles: string[];
}

export type PricingLayout = 'equation' | 'table';

/** Grid column template shared between PartBlock and column headers */
export const PRICING_TABLE_COLS = '76px 40px 96px';

interface PartBlockProps {
  part: PartData;
  showDivider?: boolean;
  pricingLayout?: PricingLayout;
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PartBlock({ part, showDivider = true, pricingLayout = 'equation' }: PartBlockProps) {
  return (
    <div
      data-comp="PartBlock"
      className={[
        'py-[var(--doc-sp-part-y)]',
        showDivider ? 'border-b border-[var(--gray-150)]' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* ── Top row: thumbnail + core info + pricing ── */}
      <div
        data-el="PartBlock-top"
        className="grid items-center gap-[var(--sp-3)]"
        style={{ gridTemplateColumns: 'var(--thumb-size) 1fr auto' }}
      >
        {/* Thumbnail */}
        <div
          data-el="PartBlock-thumb"
          className="bg-[var(--gray-50)] border border-[var(--gray-150)] rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center shrink-0"
          style={{ width: 'var(--thumb-size)', height: 'var(--thumb-size)' }}
        >
          {part.thumbnail ? (
            <img src={part.thumbnail} alt={part.id} className="w-full h-full object-contain" />
          ) : (
            <span className="text-[length:var(--doc-text-thumb-placeholder)] text-[color:var(--gray-300)] uppercase tracking-[var(--doc-tracking-label)]">
              3D
            </span>
          )}
        </div>

        {/* Core info */}
        <div data-el="PartBlock-core" className="flex flex-col gap-[var(--doc-sp-half)] min-w-0">
          <span data-el="PartBlock-id" className="text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-900)]">
            {part.id}
          </span>
          <span data-el="PartBlock-dims" className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] leading-[1.4]">
            {part.dims}
          </span>
          <span data-el="PartBlock-material" className="text-[length:var(--doc-text-body)] font-normal text-[color:var(--gray-900)] mt-[var(--doc-sp-half)]">
            {part.material}
          </span>
        </div>

        {/* Pricing */}
        {pricingLayout === 'table' ? (
          <div data-el="PartBlock-pricing" className="grid items-end text-right whitespace-nowrap tabular-nums"
            style={{ gridTemplateColumns: PRICING_TABLE_COLS, gap: 'var(--sp-3)' }}>
            {[
              { label: 'Price', value: formatCurrency(part.unitPrice), hero: false },
              { label: 'Qty', value: String(part.quantity), hero: false },
              { label: 'Subtotal', value: formatCurrency(part.amount), hero: true },
            ].map(col => (
              <div key={col.label} className="flex flex-col items-end gap-[var(--doc-sp-half)]">
                <span className="text-[length:var(--doc-text-param-label)] font-semibold uppercase tracking-[var(--doc-tracking-label)] text-[color:var(--gray-400)]">
                  {col.label}
                </span>
                <span className={`font-bold text-[color:var(--gray-900)] ${col.hero ? 'text-[length:var(--doc-text-party-name)]' : 'text-[length:var(--doc-text-part-id)]'}`}>
                  {col.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div data-el="PartBlock-pricing" className="whitespace-nowrap text-[length:var(--doc-text-part-id)] text-[color:var(--gray-500)] text-right">
            <span className="font-bold text-[color:var(--gray-900)]">{formatCurrency(part.unitPrice)}</span>
            <span className="px-[var(--sp-2)]">×</span>
            <span><span className="font-bold text-[color:var(--gray-900)]">{part.quantity}</span> pcs</span>
            <span className="px-[var(--sp-2)]">=</span>
            <span className="font-bold text-[length:var(--doc-text-party-name)] text-[color:var(--gray-900)]">{formatCurrency(part.amount)}</span>
          </div>
        )}
      </div>

      {/* ── Parameters grid — 7 columns with left border dividers ── */}
      <div
        data-el="PartBlock-params"
        className="grid mt-[var(--sp-3)]"
        style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 0.7fr 0.7fr 1.2fr 1.2fr' }}
      >
        {part.params.map((param, i) => (
          <div
            key={i}
            data-el="PartBlock-param"
            className="px-[var(--sp-2)] py-[var(--doc-sp-half)] border-l border-[var(--gray-150)]"
          >
            <div className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] leading-[1.6]">
              {param.label}
            </div>
            <div className="text-[length:var(--doc-text-secondary)] font-medium text-[color:var(--gray-900)] leading-[1.4]">
              {param.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Files: Model + Drawings ── */}
      <div
        data-el="PartBlock-files"
        className="flex items-baseline gap-x-[var(--sp-3)] gap-y-[var(--sp-1)] mt-[var(--sp-3)] flex-wrap text-[length:var(--doc-text-file-tag)] text-[color:var(--gray-600)] leading-[1.6]"
      >
        <span data-el="PartBlock-model" className="inline-flex items-center gap-[var(--sp-1)] flex-wrap">
          <span className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] whitespace-nowrap shrink-0">
            Model:
          </span>
          <FileTag name={part.modelFile} />
        </span>

        {part.drawingFiles.length > 0 && (
          <span data-el="PartBlock-drawings" className="inline-flex items-center gap-[var(--sp-1)] flex-wrap">
            <span className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] whitespace-nowrap shrink-0">
              Drawings:
            </span>
            {part.drawingFiles.map((file, i) => (
              <FileTag key={i} name={file} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function FileTag({ name }: { name: string }) {
  return (
    <span
      data-el="PartBlock-fileTag"
      className="inline-flex items-center gap-[var(--sp-1)] text-[length:var(--doc-text-file-tag)] text-[color:var(--gray-600)] bg-[var(--gray-50)] border border-[var(--gray-150)] px-[var(--doc-file-tag-px)] py-[var(--doc-sp-half)]"
      style={{ borderRadius: 'var(--doc-file-tag-radius)' }}
    >
      {PRINT_ICONS.file(10)}
      {name}
    </span>
  );
}

export default PartBlock;
