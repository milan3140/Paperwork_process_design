/**
 * ReceiptDemo — Demonstrates two Receipt variants:
 * 1. Full Payment Receipt — Acme order fully settled (continues Invoice lifecycle)
 * 2. Partial Payment Receipt — installment payment with remaining balance
 */

import { ReceiptDocument, type ReceiptData } from '../../components/ReceiptDocument';

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA — Full Payment Receipt
 * Continues the Acme Precision Engineering order lifecycle:
 * Quote (U26033148F) → Invoice (INV-2026-0047) → Receipt (RCT-2026-0012)
 * Full payment of $6,390.00 received via wire transfer.
 * ════════════════════════════════════════════════════════════════ */
const sampleFullPayment: ReceiptData = {
  receiptId: 'RCT-2026-0012',
  date: 'May 28, 2026',

  invoiceRef: 'INV-2026-0047',
  quoteRef: 'U26033148F',
  poRef: 'PO-2026-0042',

  from: {
    name: 'InstaVoxel, Inc.',
    lines: [
      'No. 100, Sec. 2, Zhongxiao E. Rd',
      "Da'an District, Taipei 106, Taiwan",
      '+886-2-2771-0000',
      'sales@instavoxel.com',
    ],
  },
  issuedTo: {
    name: 'Acme Precision Engineering',
    lines: [
      '1234 Industrial Blvd, Suite 200',
      'San Jose, CA 95112, USA',
      'purchasing@acme-precision.com',
      'Attn: John Smith (A/P)',
    ],
  },

  /* Brief goods/services summary — Receipt references Invoice, does not repeat
     full line items. Enough context so reader knows what this payment was for
     without flipping to the Invoice. */
  description: 'CNC Machined Parts (3 items) — Aluminum, Stainless Steel, Garolite',

  amountReceived: 6390,
  currency: 'USD ($)',
  paymentMethod: 'Wire Transfer',
  transactionRef: 'FNB-20260526-87432',
  dateReceived: 'May 26, 2026',

  invoiceTotal: 6390,
  balanceDue: 0,

  notes: [
    'This receipt confirms full payment for Invoice #INV-2026-0047.',
    'Please retain your Invoice for tax and accounting purposes.',
    'Issued by: InstaVoxel, Inc. — Accounts Receivable',
  ],

  termsText:
    'This receipt is issued as confirmation of payment received by InstaVoxel, Inc. It does not constitute a tax invoice. For tax documentation, please refer to the original Invoice referenced above.',

  closingMessage: 'Thank you for your business.',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA — Partial Payment Receipt
 * Nova Research Labs — PIA order, paying in 2 installments.
 * First payment of $772.50 (50% deposit) received via credit card.
 *
 * Invoice total: $1,545.00
 * This payment: $772.50 (deposit)
 * Balance due: $772.50 (due before shipping)
 * ════════════════════════════════════════════════════════════════ */
const samplePartialPayment: ReceiptData = {
  receiptId: 'RCT-2026-0013',
  date: 'April 30, 2026',

  invoiceRef: 'INV-2026-0048',
  quoteRef: 'QU260401055',

  from: {
    name: 'InstaVoxel, Inc.',
    lines: [
      'No. 100, Sec. 2, Zhongxiao E. Rd',
      "Da'an District, Taipei 106, Taiwan",
      '+886-2-2771-0000',
      'sales@instavoxel.com',
    ],
  },
  issuedTo: {
    name: 'Nova Research Labs',
    lines: [
      '456 Innovation Way',
      'Austin, TX 78701, USA',
      'finance@nova-research.com',
      'Attn: Sarah Chen',
    ],
  },

  description: 'CNC Machined Parts (1 item) — Titanium Grade 5 Sensor Mount',

  amountReceived: 772.50,
  currency: 'USD ($)',
  paymentMethod: 'Credit Card (Visa)',
  transactionRef: 'CC-VISA-8842-04302026',
  dateReceived: 'April 30, 2026',

  invoiceTotal: 1545,
  previouslyPaid: 0,
  balanceDue: 772.50,

  isPartial: true,
  paymentLabel: 'Payment 1/2, 50% Deposit',

  notes: [
    'This receipt confirms partial payment for Invoice #INV-2026-0048.',
    'Remaining balance of $772.50 is due before shipping.',
    'Please retain your Invoice for tax and accounting purposes.',
    'Issued by: InstaVoxel, Inc. — Accounts Receivable',
  ],

  termsText:
    'This receipt is issued as confirmation of partial payment received by InstaVoxel, Inc. The remaining balance must be settled before shipment. This document does not constitute a tax invoice.',

  closingMessage: 'Thank you for your business.',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO PAGE
 * ════════════════════════════════════════════════════════════════ */
export default function ReceiptDemo() {
  return (
    <div className="flex flex-col items-center gap-12 py-10 bg-[var(--gray-100)]">
      {/* ── Full Payment Receipt ── */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--gray-400)]">
          Receipt — Full Payment
        </span>
        <ReceiptDocument data={sampleFullPayment} />
      </div>

      {/* ── Partial Payment Receipt ── */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--gray-400)]">
          Receipt — Partial Payment (Deposit)
        </span>
        <ReceiptDocument data={samplePartialPayment} />
      </div>
    </div>
  );
}
