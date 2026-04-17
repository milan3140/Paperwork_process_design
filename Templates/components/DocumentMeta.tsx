/**
 * DocumentMeta — Right-aligned metadata grid for document headers
 *
 * Renders a 2-column CSS Grid of label/value pairs, right-aligned.
 * Uses `display: contents` so all labels and values participate in
 * the same grid, auto-aligning right edges regardless of content width.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name  | Type       | Required | Default | Description                      |
 * |-------|------------|----------|---------|----------------------------------|
 * | items | MetaItem[] | yes      | —       | Array of label/value pair objects |
 *
 * MetaItem shape:
 * | Field     | Type    | Required | Default | Description                                          |
 * |-----------|---------|----------|---------|------------------------------------------------------|
 * | label     | string  | yes      | —       | Uppercase label (e.g. "DATE", "VALID UNTIL")         |
 * | value     | string  | yes      | —       | Display value (e.g. "March 19, 2026")                |
 * | highlight | boolean | no       | false   | When true, value uses brand primary color + bold     |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `items` array: Add/remove rows dynamically. Order determines display order.
 * - `highlight` per item: Use for the most important identifier (e.g. document ID).
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   // Quote meta
 *   <DocumentMeta items={[
 *     { label: 'Date', value: 'March 19, 2026' },
 *     { label: 'Valid Until', value: 'April 18, 2026' },
 *     { label: 'RFQ Ref', value: 'RFQ-20260315-A' },
 *   ]} />
 *
 *   // Invoice meta
 *   <DocumentMeta items={[
 *     { label: 'Invoice #', value: 'INV-2026-0001', highlight: true },
 *     { label: 'Date', value: 'April 20, 2026' },
 *     { label: 'Due Date', value: 'May 20, 2026' },
 *     { label: 'PO Ref', value: 'PO-2026-0042' },
 *   ]} />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use in the top-right corner of document pages, paired with the document
 * title on the left. Contains dates, reference numbers, and identifiers.
 */

export interface MetaItem {
  label: string;
  value: string;
  highlight?: boolean;
  /** Custom color override — e.g. 'var(--color-success)' for Receipt status.
      When set, applies this color + bold weight, overriding highlight. */
  color?: string;
  /** Background color for the value cell — e.g. 'var(--color-primary-selected)'. */
  bgColor?: string;
  /** Override value font weight. Defaults: bold if highlight/color, else semibold. */
  weight?: 'light' | 'normal' | 'semibold' | 'bold';
  /** Per-item font size override for the value cell (in px). */
  fontSize?: number;
  /** Per-item font size override for the label cell (in px). Pairs with fontSize
      to enlarge a single row without touching others. */
  labelFontSize?: number;
  /** Override label font weight (useful for emphasised rows like Page indicator). */
  labelWeight?: 'light' | 'normal' | 'semibold' | 'bold';
}

interface DocumentMetaProps {
  items: MetaItem[];
  /** Override label font size (default: --doc-text-label = 9px) */
  labelFontSize?: number;
  /** Override value font size (default: --doc-text-meta-value = 12px) */
  valueFontSize?: number;
}

export function DocumentMeta({ items, labelFontSize, valueFontSize }: DocumentMetaProps) {
  return (
    <div
      data-comp="DocumentMeta"
      className="grid gap-x-[var(--sp-2)] gap-y-[var(--sp-1)] items-baseline"
      style={{ gridTemplateColumns: 'auto 1fr' }}
    >
      {items.map((item, i) => (
        <div key={i} className="contents">
          <span
            data-el="DocumentMeta-label"
            className={[
              (item.labelFontSize || labelFontSize) ? '' : 'text-[length:var(--doc-text-label)]',
              item.labelWeight ? `font-${item.labelWeight}` : 'font-semibold',
              'text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] text-right',
            ].filter(Boolean).join(' ')}
            style={item.labelFontSize ? { fontSize: item.labelFontSize } : labelFontSize ? { fontSize: labelFontSize } : undefined}
          >
            {item.label}
          </span>
          <span
            data-el="DocumentMeta-value"
            className={[
              `${(valueFontSize || item.fontSize) ? '' : 'text-[length:var(--doc-text-meta-value)]'} text-right`,
              item.weight
                ? `font-${item.weight}`
                : (item.color || item.highlight) ? 'font-bold' : 'font-semibold',
              item.color
                ? ''
                : item.highlight
                  ? 'text-[color:var(--color-primary)]'
                  : 'text-[color:var(--gray-900)]',
            ].filter(Boolean).join(' ')}
            style={{
              ...(item.fontSize ? { fontSize: item.fontSize } : valueFontSize ? { fontSize: valueFontSize } : {}),
              ...(item.color ? { color: item.color } : {}),
              ...(item.bgColor ? { backgroundColor: item.bgColor, padding: '3px 0 3px 10px', borderRadius: '3px 0 0 3px', marginLeft: '-4px' } : {}),
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default DocumentMeta;
