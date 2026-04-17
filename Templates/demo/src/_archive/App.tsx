import type { CSSProperties } from 'react';
import { QuoteDocument, type QuoteData } from '../../../components/QuoteDocument';
import { DownloadPdfButton } from '../DownloadPdfButton';
import { PRINT_ICONS } from '../../../components/Icons_Print';

const sampleQuote: QuoteData = {
  quoteId: 'U260319042',
  revision: 1,
  date: 'March 19, 2026',
  validUntil: 'April 18, 2026',

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
        { label: 'Surface', value: '125 uin / 3.2um Ra' },
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
        { label: 'Surface', value: '125 uin / 3.2um Ra' },
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
        { label: 'Surface', value: '125 uin / 3.2um Ra' },
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

const monoTheme: CSSProperties = {
  ['--color-primary' as any]: '#111111',
  ['--color-primary-hover' as any]: '#000000',
  ['--color-primary-light' as any]: '#6b6b6b',
  ['--color-primary-subtle' as any]: '#f2f2f2',
  ['--color-primary-wash' as any]: '#fafafa',
  ['--color-primary-selected' as any]: '#f2f2f2',
  ['--color-primary-dark' as any]: '#000000',
  ['--color-primary-muted' as any]: '#a3a3a3',

  ['--color-warning' as any]: '#6b6b6b',
  ['--color-warning-bg' as any]: '#f2f2f2',
  ['--color-warning-border' as any]: '#d4d4d4',
  ['--color-warning-text' as any]: '#262626',

  ['--color-success' as any]: '#4b4b4b',
  ['--color-success-bg' as any]: '#f2f2f2',
  ['--color-error' as any]: '#262626',
  ['--color-error-hover' as any]: '#111111',
  ['--color-error-bg' as any]: '#f2f2f2',
  ['--color-info' as any]: '#4b4b4b',
  ['--color-info-bg' as any]: '#f2f2f2',

  ['--gray-950' as any]: '#0a0a0a',
  ['--gray-900' as any]: '#171717',
  ['--gray-800' as any]: '#262626',
  ['--gray-700' as any]: '#404040',
  ['--gray-600' as any]: '#525252',
  ['--gray-500' as any]: '#737373',
  ['--gray-400' as any]: '#a3a3a3',
  ['--gray-300' as any]: '#d4d4d4',
  ['--gray-250' as any]: '#dadada',
  ['--gray-200' as any]: '#e5e5e5',
  ['--gray-175' as any]: '#ededed',
  ['--gray-160' as any]: '#f2f2f2',
  ['--gray-150' as any]: '#e5e5e5',
  ['--gray-100' as any]: '#f2f2f2',
  ['--gray-75' as any]: '#f5f5f5',
  ['--gray-60' as any]: '#fafafa',
  ['--gray-50' as any]: '#fafafa',

  ['--shadow-xs' as any]: '0 1px 2px rgba(0,0,0,0.04)',
  ['--shadow-sm' as any]: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  ['--shadow-md' as any]: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  ['--shadow-lg' as any]: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
  ['--shadow-xl' as any]: '0 16px 48px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)',
  ['--shadow-focus' as any]: '0 0 0 3px #e5e5e5',

  ['--doc-text-key-value' as any]: '12px',
  ['--doc-text-party-name' as any]: '12px',
  ['--doc-text-meta-value' as any]: '12px',
  ['--doc-text-part-id' as any]: '12px',
  ['--doc-text-body' as any]: '12px',
  ['--doc-text-secondary' as any]: '12px',
  ['--doc-text-label' as any]: '12px',
  ['--doc-text-param-label' as any]: '12px',
  ['--doc-text-fine' as any]: '12px',
  ['--doc-text-footer' as any]: '12px',
  ['--doc-text-file-tag' as any]: '12px',
  ['--doc-text-thumb-placeholder' as any]: '12px',
  ['--doc-text-logo' as any]: '12px',
  ['--doc-text-doc-type' as any]: '12px',
  ['--doc-text-grid-label' as any]: '12px',
  ['--doc-text-urgent' as any]: '12px',
  ['--text-xxs' as any]: '12px',
  ['--text-xs' as any]: '12px',
  ['--text-sm' as any]: '12px',
  ['--text-md' as any]: '12px',

  ['--font' as any]: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif',

  ['--doc-content-pad-top' as any]: '40px',
};

const MONO_CSS = `
[data-mono-quote] [data-comp="QuoteDocument"] [style*="font-size"] { font-size: 12px !important; }
[data-mono-quote] [data-comp="QuoteDocument"] * { font-weight: 400 !important; font-family: var(--font) !important; }
[data-mono-quote] [data-comp="QuoteDocument"] .text-\\[length\\:var\\(--doc-text-title\\)\\] {
  font-size: 28px !important;
  font-weight: 700 !important;
  color: #000000 !important;
}
[data-mono-quote] [data-comp="QuoteDocument"] .text-\\[length\\:var\\(--doc-text-subtitle\\)\\] {
  font-size: 22px !important;
  font-weight: 300 !important;
  color: #000000 !important;
}
[data-mono-quote] [data-comp="SectionLabel"],
[data-mono-quote] [data-el="QuoteDocument-contLabel"] {
  font-size: 10px !important;
  color: #404040 !important;
}
[data-mono-quote] [data-el="DocumentMeta-label"] {
  font-size: 10px !important;
  color: #737373 !important;
}
/* Highlighted meta value (Valid Until) — Invoice-v3 Due Date treatment */
[data-mono-quote] [data-el="DocumentMeta-value"].font-bold {
  font-size: 16px !important;
  font-weight: 700 !important;
  color: #000000 !important;
}
/* Invoice-v3-style spacing for title/meta/parties block */
[data-mono-quote] [data-comp="QuoteDocument"] [data-comp="DocumentMeta"] {
  column-gap: calc(var(--sp-2) * 2.5) !important;
}
[data-mono-quote] [data-comp="QuoteDocument"] [data-el="QuoteDocument-titleRow"] [data-comp="DocumentMeta"] {
  margin-top: calc(var(--sp-3) * 1.55) !important;
}
[data-mono-quote] [data-comp="QuoteDocument"] [data-el="QuoteDocument-from"] {
  margin-top: calc(var(--sp-4) * 0.5) !important;
}
[data-mono-quote] [data-el="PartBlock-param"] > div:first-child {
  font-size: 9px !important;
}
[data-mono-quote] [data-el="PartBlock-param"] > div:last-child {
  font-size: 10px !important;
}
[data-mono-quote] [data-comp="QuoteDocument"] [data-el="QuoteMono-pageIndicator"],
[data-mono-quote] [data-comp="QuoteDocument"] [data-el="QuoteMono-pageIndicator"] * {
  font-size: 20px !important;
  font-weight: 400 !important;
}
`;

export default function App() {
  return (
    <div
      data-mono-quote
      style={{ ...monoTheme, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}
    >
      <style>{MONO_CSS}</style>

      <DownloadPdfButton filename="Quote" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Quote
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          {sampleQuote.quoteId} · {sampleQuote.parts.length} parts
        </div>
      </div>

      <QuoteDocument
        data={sampleQuote}
        hideHeaderBand
        renderLogoAboveMeta={(totalPages) => (
          <div data-el="QuoteMono-logoBlock" className="flex flex-col items-end gap-[var(--doc-sp-half)]">
            <div data-el="QuoteMono-logo" style={{ lineHeight: 0 }}>
              {/* Height 37 (vs default 36) so the "InstaVoxel" text portion
                  (viewBox x=396.86 → 1215.08) matches the PAGE indicator width
                  below — both right-aligned elements end up flush on the left.
                  Same treatment as Invoice v3 and Packing Slip v13. */}
              {PRINT_ICONS.logoText(37, '#000000')}
            </div>
            <div
              data-el="QuoteMono-pageIndicator"
              style={{ fontSize: 20, lineHeight: 1, fontWeight: 400, color: '#000000' }}
            >
              <span style={{ textTransform: 'uppercase', marginRight: '0.35em', letterSpacing: '0.04em' }}>Page</span>
              <span style={{ letterSpacing: '-0.04em' }}>1 of {totalPages}</span>
            </div>
          </div>
        )}
      />

    </div>
  );
}
