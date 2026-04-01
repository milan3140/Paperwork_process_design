/**
 * PaymentInstructions — Bank transfer details for Invoice
 *
 * Invoice-specific replacement for PaymentInfo. Instead of listing accepted
 * payment methods (Quote), this shows specific bank account details for
 * wire transfer. Supports dual accounts (US + Taiwan) for InstaVoxel's
 * dual-location operations.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name              | Type          | Required | Default | Description                          |
 * |-------------------|---------------|----------|---------|--------------------------------------|
 * | bankDetails       | BankDetails[] | yes      | —       | Array of bank accounts (1-2 typical) |
 * | creditCardFeeNote | string        | no       | —       | CC processing fee note (credit-card variant) |
 *
 * BankDetails shape:
 * | Field         | Type   | Required | Description                          |
 * |---------------|--------|----------|--------------------------------------|
 * | bankName      | string | yes      | Bank name                            |
 * | accountName   | string | yes      | Account holder name                  |
 * | accountNumber | string | yes      | Account number                       |
 * | swiftCode     | string | yes      | SWIFT/BIC code                       |
 * | bankAddress   | string | yes      | Bank address                         |
 * | routingNumber | string | no       | Routing number (US banks)            |
 * | iban          | string | no       | IBAN (European banks)                |
 * | currency      | string | yes      | Account currency (e.g. "USD", "TWD") |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <PaymentInstructions bankDetails={[
 *     { bankName: 'First National Bank', accountName: 'InstaVoxel, Inc.',
 *       accountNumber: '1234567890', swiftCode: 'FNBAUS12',
 *       routingNumber: '021000089', bankAddress: '123 Main St, Quincy, MA',
 *       currency: 'USD' },
 *   ]} />
 */

import { SectionLabel } from './SectionLabel';

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  bankAddress: string;
  routingNumber?: string;
  iban?: string;
  currency: string;
}

interface PaymentInstructionsProps {
  bankDetails: BankDetails[];
  creditCardFeeNote?: string;
}

function BankDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: '88px 1fr', gap: 'var(--sp-2)' }}>
      <span
        className="text-[length:var(--doc-text-secondary)] font-semibold uppercase tracking-[var(--doc-tracking-label)] text-[color:var(--gray-400)] leading-[1.8]"
      >
        {label}
      </span>
      <span className="text-[length:var(--doc-text-body)] text-[color:var(--gray-900)] leading-[1.6]">
        {value}
      </span>
    </div>
  );
}

export function PaymentInstructions({ bankDetails, creditCardFeeNote }: PaymentInstructionsProps) {
  return (
    <div data-comp="PaymentInstructions" className="flex flex-col gap-[var(--sp-3)]">
      <SectionLabel>Payment Instructions</SectionLabel>

      {bankDetails.map((bank, i) => (
        <div key={i} data-el="PaymentInstructions-bank" className="flex flex-col gap-[var(--sp-1)]">
          {/* Sub-label for account currency */}
          <div
            className="text-[length:var(--doc-text-part-id)] font-semibold text-[color:var(--gray-700)] mt-[var(--sp-1)]"
          >
            {bank.currency} Wire Transfer
          </div>

          {/* Bank detail rows */}
          <div className="flex flex-col">
            <BankDetailRow label="Bank" value={bank.bankName} />
            <BankDetailRow label="Account" value={bank.accountName} />
            <BankDetailRow label="Acct #" value={bank.accountNumber} />
            <BankDetailRow label="SWIFT" value={bank.swiftCode} />
            {bank.routingNumber && <BankDetailRow label="Routing" value={bank.routingNumber} />}
            {bank.iban && <BankDetailRow label="IBAN" value={bank.iban} />}
            <BankDetailRow label="Address" value={bank.bankAddress} />
          </div>
        </div>
      ))}

      {creditCardFeeNote && (
        <div
          data-el="PaymentInstructions-ccNote"
          className="text-[length:var(--doc-text-fine)] text-[color:var(--gray-400)] leading-[1.4] mt-[var(--sp-1)]"
        >
          {creditCardFeeNote}
        </div>
      )}
    </div>
  );
}

export default PaymentInstructions;
