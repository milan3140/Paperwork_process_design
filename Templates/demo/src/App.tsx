import { QuoteDocument, type QuoteData } from '../../components/QuoteDocument';

const sampleQuote: QuoteData = {
  quoteId: 'U260319042',
  revision: 1,
  date: 'March 19, 2026',
  validUntil: 'April 18, 2026',
  rfqRef: 'RFQ-20260315-A',

  from: {
    name: 'InstaVoxel Inc.',
    lines: [
      'No. 100, Sec. 2, Zhongxiao E. Rd',
      'Da\'an District, Taipei 106, Taiwan',
      '+886-2-2771-0000',
      'sales@instavoxel.com',
    ],
  },
  billTo: {
    name: 'Acme Precision Engineering',
    lines: [
      '1234 Industrial Blvd, Suite 200',
      'San Jose, CA 95112, USA',
      'purchasing@acme-precision.com',
      'Attn: John Smith',
    ],
  },
  shipTo: {
    name: 'Acme Precision Engineering',
    lines: [
      '5678 Warehouse Dr, Dock B',
      'San Jose, CA 95113, USA',
      'Attn: Receiving Dept.',
    ],
  },

  leadTimeOptions: [
    { days: '26 Work Days', surcharge: '——', label: 'Standard' },
    { days: '15 Work Days', surcharge: '+$200', label: 'Expedited' },
    { days: '8 Work Days', surcharge: '+$450', label: 'Rush' },
  ],
  leadTimeNote: 'Lead time begins upon receipt of PO and payment (or credit approval). Surcharge applies to part total.',
  paymentTerms: 'Payment In Advance (PIA)',
  currency: 'USD ($)',

  parts: [
    {
      id: 'P01',
      dims: '255.0 × 225.0 × 34.5 mm · 0.86 kg',
      material: 'Aluminum 6061-T6',
      quantity: 50,
      unitPrice: 48.00,
      amount: 2400.00,
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
      id: 'P02',
      dims: '180.0 × 120.0 × 12.0 mm · 2.05 kg',
      material: 'Stainless Steel 304',
      quantity: 30,
      unitPrice: 72.50,
      amount: 2175.00,
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
    },
    {
      id: 'P03',
      dims: '30.0 × 30.0 × 4.0 mm · 0.01 kg',
      material: 'Garolite G11',
      quantity: 100,
      unitPrice: 12.80,
      amount: 1280.00,
      params: [
        { label: 'Finish', value: 'Standard' },
        { label: 'Tolerance', value: '±0.13mm (±.005")' },
        { label: 'Surface Roughness', value: '125 uin / 3.2um Ra' },
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
  ],
  total: { label: 'Total', amount: 6390 },

  manufacturingNotes: [
    'Quoted based on submitted 3D models and selected parameters. We do not automatically extract features, tolerances, or other non-geometric information from your 3D model.',
    'General tolerance applies to unspecified dimensions only. Tight tolerances are quoted per part configuration above.',
    'Internal sharp edges may include radii up to 0.5mm due to tooling constraints.',
    'Certificate of Compliance (CoC) included with shipment at no additional charge.',
  ],

  exclusions:
    'This quote does not include special packaging, plating, heat treatment, or third-party inspection unless explicitly listed in part configurations above. Customer-supplied material not included. Pricing assumes standard production schedule; expedited delivery subject to surcharge.',

  payments: [
    { icon: 'bankTransfer', text: 'Bank Transfer (Wire)' },
    { icon: 'creditCard', text: 'Credit Card via Stripe (3% transaction fee applies)' },
    { icon: 'shield', text: 'NET 30 (approved accounts only)' },
  ],

  termsText:
    '1. This quotation is valid for 30 days from the date of issue. Pricing is subject to change after expiration. 2. All quoted prices are in U.S. Dollars (USD). Customer is responsible for all applicable import duties, taxes, and customs fees. 3. Lead time begins upon receipt of a signed Purchase Order and payment (or credit approval). Lead time is stated in business days. 4. InstaVoxel retains no design responsibility. Parts are manufactured per customer-supplied drawings and specifications. 5. Standard inspection is included. Formal dimensional inspection reports (FAI/CMM) available upon request at additional cost. 6. Cancellation after production commencement may result in charges for materials consumed and work completed. 7. For new clients without prior payment history, full upfront payment is required before production begins. 8. For complete terms, visit:',
  termsLinkUrl: 'https://www.instavoxel.com/terms',

  closingMessage: 'We look forward to working with you.',
};

export default function App() {
  return <QuoteDocument data={sampleQuote} />;
}
