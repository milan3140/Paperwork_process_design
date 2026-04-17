/**
 * InvoiceDemo v3 — Monochrome high-contrast variant
 *
 * Uses InvoiceDocumentV3 (same data/pagination as v2, themed to pure grayscale + Geist Sans).
 * Reuses the same sample data pattern as v2 so visual changes isolate to theme.
 */

import { type InvoiceData } from '../../components/InvoiceDocument';
import { InvoiceDocumentV3 } from '../../components/InvoiceDocument_v3';
import { DownloadPdfButton } from './DownloadPdfButton';
import { MODEL_SHOT_1 as thumb1, MODEL_SHOT_2 as thumb2 } from '../../components/_assets';

const THUMBS = [thumb1, thumb2];

const sampleNet30: InvoiceData = {
  invoiceId: 'INV-2026-48F-1',
  variant: 'net',
  date: 'April 25, 2026',
  dueDate: 'May 25, 2026',
  shipDate: 'April 20, 2026',

  quoteRef: 'U26033148F',
  poRef: 'PO-2026-48F-1',
  packingSlipRef: 'PS-2026-0031',

  from: {
    name: 'InstaVoxel, Inc.',
    lines: [
      'No. 100, Sec. 2, Zhongxiao E. Rd',
      "Da'an District, Taipei 106, Taiwan",
      '+886-2-2771-0000',
      'sales@instavoxel.com',
      'Tax ID (EIN): 12-3456789',
    ],
  },
  billTo: {
    name: 'Acme Precision Engineering',
    lines: [
      '1234 Industrial Blvd, Suite 200',
      'San Jose, CA 95112, USA',
      'purchasing@acme-precision.com',
      'Attn: John Smith (A/P)',
    ],
  },
  shipTo: {
    name: 'Acme Precision Engineering',
    lines: [
      '5678 Manufacturing Dr, Bldg C',
      'San Jose, CA 95134, USA',
      'Attn: Mike Johnson (Receiving)',
    ],
  },

  paymentTerms: 'Net 30',
  currency: 'USD ($)',

  parts: [
    {
      id: 'M-509743A-mfg / C',
      dims: '10.04 × 8.86 × 1.36 in · 1.90 lb',
      material: 'Aluminum 6061-T6',
      quantity: 50,
      unitPrice: 48,
      amount: 2400,
      thumbnail: THUMBS[0],
      params: [
        { label: 'Finish', value: 'Standard' },
        { label: 'Tolerance', value: '±0.13mm (±.005")' },
        { label: 'Surface Roughness', value: '125 uin / 3.2um Ra' },
        { label: 'Threads', value: 'None' },
        { label: 'Inserts', value: 'None' },
        { label: 'Part Marking', value: 'Silkscreen, Loc: 1' },
        { label: 'Inspection', value: 'First Article (FAI)' },
      ],
      modelFile: '115425AT_P064454846468483.STEP',
      drawingFiles: ['115425AT_Rev.C.pdf', '2595-ST30.2.1-001-R00.pdf'],
    },
    {
      id: 'M-217865B-mfg / D',
      dims: '7.09 × 4.72 × 0.47 in · 4.52 lb',
      material: 'Stainless Steel 304',
      quantity: 30,
      unitPrice: 72.5,
      amount: 2175,
      thumbnail: THUMBS[1],
      params: [
        { label: 'Finish', value: 'Standard' },
        { label: 'Tolerance', value: '±0.25mm (±.010")' },
        { label: 'Surface Roughness', value: '125 uin / 3.2um Ra' },
        { label: 'Threads', value: '4' },
        { label: 'Inserts', value: '2' },
        { label: 'Part Marking', value: 'None' },
        { label: 'Inspection', value: 'Standard' },
      ],
      modelFile: '220817MP_MountingPlate.STEP',
      drawingFiles: ['220817MP_Drawing.pdf'],
      note: 'Unit price reflects volume tier for qty ≥ 30; tooling NRE billed separately on line below.',
    },
    {
      id: 'M-384021C-mfg / C',
      dims: '1.18 × 1.18 × 0.16 in · 0.02 lb',
      material: 'Garolite G11',
      quantity: 100,
      unitPrice: 12.8,
      amount: 1280,
      thumbnail: THUMBS[0],
      params: [
        { label: 'Finish', value: 'Standard' },
        { label: 'Tolerance', value: '±0.13mm (±.005")' },
        { label: 'Surface Roughness', value: 'Standard' },
        { label: 'Threads', value: 'None' },
        { label: 'Inserts', value: 'None' },
        { label: 'Part Marking', value: 'None' },
        { label: 'Inspection', value: 'Standard' },
      ],
      modelFile: 'SR-0098_SpacerRing.STEP',
      drawingFiles: ['SR-0098_Drawing.pdf'],
    },
  ],

  nreCharges: [
    { description: 'Tooling & Setup — CNC Fixture for P01', amount: 350 },
  ],

  totalsLines: [
    { label: 'Subtotal (Parts)', amount: 5855 },
    { label: 'NRE / Tooling', amount: 350 },
    { label: 'Shipping (DHL Express)', amount: 185 },
    { label: 'Tax', amount: 0 },
    { label: 'Total', amount: 6390 },
  ],
  total: { label: 'Balance Due', amount: 6390 },

  bankDetails: [
    {
      bankName: 'First National Bank',
      accountName: 'InstaVoxel, Inc.',
      accountNumber: '1234567890',
      swiftCode: 'FNBAUS12',
      routingNumber: '021000089',
      bankAddress: '123 Main St, Quincy, MA 02169',
      currency: 'USD',
    },
    {
      bankName: '第一商業銀行 (First Commercial Bank)',
      accountName: 'InstaVoxel, Inc.',
      accountNumber: '9876543210',
      swiftCode: 'FCBKTWTP',
      bankAddress: 'No. 30, Sec. 1, Chongqing S. Rd, Taipei',
      currency: 'TWD',
    },
  ],

  shipments: [
    {
      shipDate: 'April 20, 2026',
      carrier: 'DHL Express',
      trackingNumber: '1234567890',
      packingSlipRef: 'PS-2026-0031',
    },
  ],
  notes: [
    'Payment due within 30 days of ship date.',
    'Please reference Invoice # INV-2026-0047 on all remittances.',
  ],
  termsText:
    '1. All amounts are in USD unless otherwise noted. 2. Payment terms begin from the ship date indicated above. 3. InstaVoxel, Inc. retains title to all goods until payment is received in full. 4. Invoices outstanding beyond 30 days are subject to a late payment fee of 1.5% per month on the unpaid balance. 5. For complete terms, visit: https://www.instavoxel.com/general-sales-terms-and-conditions/ 6. By making payment or accepting delivery, you acknowledge that you have read and agreed to our General Sales Terms & Conditions. For any questions, please contact: billing@instavoxel.com',
  termsLinkUrl: 'https://www.instavoxel.com/general-sales-terms-and-conditions/',

  closingMessage: 'Thank you for your business.',
};

const samplePIA: InvoiceData = {
  invoiceId: 'INV-2026-0048',
  variant: 'pia',
  date: 'April 28, 2026',

  quoteRef: 'QU260401055',

  from: {
    name: 'InstaVoxel, Inc.',
    lines: [
      'No. 100, Sec. 2, Zhongxiao E. Rd',
      "Da'an District, Taipei 106, Taiwan",
      '+886-2-2771-0000',
      'sales@instavoxel.com',
      'Tax ID (EIN): 12-3456789',
    ],
  },
  billTo: {
    name: 'Nova Research Labs',
    lines: [
      '456 Innovation Way',
      'Austin, TX 78701, USA',
      'finance@nova-research.com',
      'Attn: Sarah Chen',
    ],
  },

  paymentTerms: 'Payment In Advance',
  currency: 'USD ($)',

  parts: [
    {
      id: 'M-440218D-mfg / D',
      dims: '1.77 × 1.77 × 0.47 in · 0.11 lb',
      material: 'Titanium Grade 5 (Ti-6Al-4V)',
      quantity: 8,
      unitPrice: 185,
      amount: 1480,
      params: [
        { label: 'Finish', value: 'Passivation' },
        { label: 'Tolerance', value: '±0.025mm (±.001")' },
        { label: 'Surface Roughness', value: 'Ra 0.8um / 32uin (N6)' },
        { label: 'Threads', value: '4× M3×0.5-6H' },
        { label: 'Inserts', value: 'None' },
        { label: 'Part Marking', value: 'Laser, Loc: 2' },
        { label: 'Inspection', value: 'CMM + First Article' },
      ],
      modelFile: 'NRL-0401_SensorMount.STEP',
      drawingFiles: ['NRL-0401_Drawing.pdf'],
    },
  ],

  nreCharges: [],

  totalsLines: [
    { label: 'Subtotal (Parts)', amount: 1480 },
    { label: 'Shipping (DHL Express)', amount: 65 },
    { label: 'Tax', amount: 0 },
    { label: 'Total', amount: 1545 },
  ],
  total: { label: 'Balance Due', amount: 1545 },

  bankDetails: [
    {
      bankName: 'First National Bank',
      accountName: 'InstaVoxel, Inc.',
      accountNumber: '1234567890',
      swiftCode: 'FNBAUS12',
      routingNumber: '021000089',
      bankAddress: '123 Main St, Quincy, MA 02169',
      currency: 'USD',
    },
  ],

  notes: [
    'Payment required before production begins.',
    'Please reference Invoice # INV-2026-0048 on all remittances.',
    'Manufacturing will commence within 5 business days of payment receipt.',
  ],

  termsText:
    '1. All amounts are in USD unless otherwise noted. 2. Payment In Advance: Full payment is required before manufacturing begins. 3. For complete terms, visit: www.instavoxel.com/terms.',
  termsLinkUrl: 'https://www.instavoxel.com/terms',

  closingMessage: 'Thank you for your business.',
};

export default function InvoiceDemoV3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="Invoice-v3" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Invoice v3
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          Monochrome · Geist Sans · High contrast
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
        <InvoiceDocumentV3 data={sampleNet30} pricingLayout="table" />
        <InvoiceDocumentV3 data={samplePIA} pricingLayout="table" />
      </div>
    </div>
  );
}
