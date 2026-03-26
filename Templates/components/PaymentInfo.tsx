/**
 * PaymentInfo — Accepted payment methods display
 *
 * Renders a list of accepted payment methods with leading icons.
 * Designed to be placed alongside Manufacturing Notes in a 2-column grid
 * at the document composition level (QuoteDocument handles the grid).
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx, Icons_Print.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name     | Type       | Required | Default | Description                    |
 * |----------|------------|----------|---------|--------------------------------|
 * | payments | InfoItem[] | yes      | —       | Payment method items           |
 *
 * InfoItem shape:
 * | Field | Type          | Description                                          |
 * |-------|---------------|------------------------------------------------------|
 * | icon  | PrintIconName | Icon name from PRINT_ICONS registry                  |
 * | text  | string        | Display text (e.g. "Bank Transfer (Wire)")           |
 *
 * ─── Callbacks ─────────────────────────────────────────────────────────────
 *
 * No callbacks — display only.
 *
 * ─── Customizable options ──────────────────────────────────────────────────
 *
 * - `payments`: Variable number of items.
 * - `icon`: Must be a registered name in Icons_Print.tsx.
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <PaymentInfo payments={[
 *     { icon: 'bankTransfer', text: 'Bank Transfer (Wire)' },
 *     { icon: 'creditCard', text: 'Credit Card via Stripe (3% fee)' },
 *     { icon: 'shield', text: 'NET 30 (approved accounts only)' },
 *   ]} />
 *
 * ─── When to use ───────────────────────────────────────────────────────────
 *
 * Use in Quote documents to show payment options. Typically placed alongside
 * Manufacturing Notes in a 2-column layout. Not used in Invoice (which shows
 * specific payment instructions instead).
 */

import { SectionLabel } from './SectionLabel';
import { PRINT_ICONS, type PrintIconName } from './Icons_Print';

export interface InfoItem {
  icon: PrintIconName;
  text: string;
}

interface PaymentInfoProps {
  payments: InfoItem[];
}

export function PaymentInfo({ payments }: PaymentInfoProps) {
  return (
    <div data-comp="PaymentInfo" className="flex flex-col gap-[var(--sp-1)]">
      <SectionLabel>Accepted Payment Methods</SectionLabel>
      <div className="h-[var(--sp-1)]" />
      {payments.map((item, i) => (
        <div
          key={i}
          data-el="PaymentInfo-item"
          className="flex items-center gap-[var(--doc-sp-1-5)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.6]"
        >
          <span className="shrink-0 text-[color:var(--gray-400)]">
            {PRINT_ICONS[item.icon](12)}
          </span>
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

export default PaymentInfo;
