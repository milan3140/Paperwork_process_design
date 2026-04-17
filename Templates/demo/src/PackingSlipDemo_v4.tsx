/**
 * PackingSlipDemo v4 — Demonstrates 3 Packing Slip variants (v4 palette + tighter header):
 *
 *   1. International Full Shipment (Taiwan → US via DHL)
 *      soldTo ≠ shipTo → Ship From row + [Sold To | Ship To] 2-col grid
 *      Per-part documents text list (CoC, FAI, etc.)
 *
 *   2. Domestic Shipment (US → US, simplified)
 *      soldTo not provided → merged (Ship From + Ship To side-by-side)
 *
 *   3. International Partial Shipment (1 of 2, qty discrepancy)
 *      soldTo same as shipTo → merged
 *
 * Download PDF uses the same print-window mechanism as FactoryBomDemo.
 */

import { PackingSlipDocumentV4 as PackingSlipDocument, type PackingSlipData } from '../../components/PackingSlipDocument_v4';
import { DownloadPdfButton } from './DownloadPdfButton';

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA 1 — International Full Shipment (Taiwan → US)
 * Order lifecycle: Quote U26033148F → Invoice INV-2026-0047 → PS-2026-0031
 * soldTo = billing HQ (different from physical receiving site)
 * ════════════════════════════════════════════════════════════════ */
const sampleInternational: PackingSlipData = {
  slipId: 'PS-2026-0031',
  date: 'April 20, 2026',

  orderId: 'U26033148F',
  poRef: 'PO-2026-0042',
  invoiceRef: 'INV-2026-0047',

  shipFrom: {
    name: 'InstaVoxel, Inc.',
    lines: [
      'shipping@instavoxel.com',
    ],
  },

  /* Billing entity — different from delivery site → shows stacked address layout */
  soldTo: {
    name: 'W. L. Gore & Assoc. — Indirect',
    lines: [
      'PO Box 1370',
      'Elkton, MD 21922-1370',
      'United States',
    ],
  },

  /* Physical delivery — Phoenix plant receiving dock */
  shipTo: {
    name: 'W. L. Gore & Associates — Phoenix 3',
    lines: [
      '32320 N North Valley Pkwy, PO 60284067',
      'Phoenix, AZ 85085, United States',
      'Attn: Mike Johnson (Receiving)',
    ],
  },

  carrier: 'DHL Express',
  trackingNumber: '1234567890',
  shipMethod: 'International Priority',
  packages: '1 of 3',
  userAccount: 'DHL#123-456-789',

  international: true,
  countryOfOrigin: 'Taiwan (TW)',
  grossWeight: '6.8 kg',
  incoterms: 'DDP (Delivered Duty Paid)',

  comments: 'Deliver between 8AM–5PM weekdays only.\nContact dock manager before unloading large freight.',

  defaultDocuments: [
    'Certificate of Conformance (CoC)',
    'AS9102 First Article Inspection Report (FAI)',
    'Dimensional Inspection Report',
    'Material Certification',
    'Finishing Certification',
  ],

  items: [
    {
      lineNum: 1,
      partId: 'P01',
      fileName: '115425AT_P064454846468483.STEP',
      dims: '255.0 × 225.0 × 34.5 mm',
      unitWeight: '0.86 kg',
      qtyOrdered: 50,
      qtyShipped: 50,
      note: 'Part to be free of cutting fluid, debris and burrs',
    },
    {
      lineNum: 2,
      partId: 'P02',
      fileName: '220817MP_MountingPlate.STEP',
      dims: '180.0 × 120.0 × 12.0 mm',
      unitWeight: '2.05 kg',
      qtyOrdered: 30,
      qtyShipped: 30,
    },
    {
      lineNum: 3,
      partId: 'P03',
      fileName: 'SR-0098_SpacerRing.STEP',
      dims: '30.0 × 30.0 × 4.0 mm',
      unitWeight: '0.01 kg',
      qtyOrdered: 100,
      qtyShipped: 100,
      note: 'Handle with care — brittle material (Garolite G11)',
    },
  ],
};

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA 2 — Domestic Shipment (US → US, simplified)
 * No soldTo → merged address (Ship From + Ship To side-by-side)
 * ════════════════════════════════════════════════════════════════ */
const sampleDomestic: PackingSlipData = {
  slipId: 'PS-2026-0035',
  date: 'May 5, 2026',

  orderId: 'U26041277B',
  poRef: 'PO-2026-0055',

  shipFrom: {
    name: 'InstaVoxel, Inc.',
    lines: [
      '+1-408-555-0100',
    ],
  },

  /* No soldTo → merged display */
  shipTo: {
    name: 'BioMed Devices Corp.',
    lines: [
      '800 Tech Center Dr',
      'Austin, TX 78701, USA',
      'Attn: Lisa Park (Receiving)',
      '+1-512-555-0200',
    ],
  },

  carrier: 'FedEx',
  trackingNumber: '7891-2345-6789',
  shipMethod: 'Ground',
  packages: '1 of 1',
  userAccount: 'FedEx#456-789-012',
  grossWeight: '1.2 kg',

  defaultDocuments: [
    'Certificate of Conformance (CoC)',
    'AS9102 First Article Inspection Report (FAI)',
    'Dimensional Inspection Report',
    'Material Certification',
    'Finishing Certification',
  ],

  items: [
    {
      lineNum: 1,
      partId: 'P01',
      fileName: 'BMD-2201_SensorBracket.STEP',
      dims: '95.0 × 60.0 × 18.0 mm',
      unitWeight: '0.22 kg',
      qtyOrdered: 20,
      qtyShipped: 20,
    },
    {
      lineNum: 2,
      partId: 'P02',
      fileName: 'BMD-2202_RetainerClip.STEP',
      dims: '48.0 × 12.0 × 4.0 mm',
      unitWeight: '0.04 kg',
      qtyOrdered: 40,
      qtyShipped: 40,
    },
  ],
};

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA 3 — Partial Shipment (International, 1 of 2)
 * P01 + P02 ship now. P03 backordered.
 * soldTo not provided (same billing/delivery entity) → merged display.
 * ════════════════════════════════════════════════════════════════ */
const samplePartial: PackingSlipData = {
  slipId: 'PS-2026-0038',
  date: 'May 15, 2026',

  orderId: 'U26042099C',
  poRef: 'PO-2026-0063',

  isPartial: true,
  shipmentLabel: 'Shipment 1 of 2',

  shipFrom: {
    name: 'InstaVoxel, Inc.',
    lines: ['shipping@instavoxel.com'],
  },

  shipTo: {
    name: 'NovaTech Systems',
    lines: [
      '2200 Lake Shore Dr',
      'Chicago, IL 60614, USA',
      'Attn: David Chen (Receiving)',
    ],
  },

  carrier: 'DHL Express',
  trackingNumber: '9876543210',
  shipMethod: 'International Priority',
  packages: '1 of 1',
  userAccount: 'DHL#123-456-789',

  international: true,
  countryOfOrigin: 'Taiwan (TW)',
  grossWeight: '2.1 kg',
  incoterms: 'DAP (Delivered at Place)',

  comments: 'Priority shipment — P01 and P02 shipped ahead to meet urgent assembly schedule. P03 (PEEK Seal Housing) will follow as Shipment 2 of 2, ETA late May 2026.',

  defaultDocuments: [
    'Certificate of Conformance (CoC)',
    'AS9102 First Article Inspection Report (FAI)',
    'Dimensional Inspection Report',
    'Material Certification',
    'Finishing Certification',
  ],

  items: [
    {
      lineNum: 1,
      partId: 'P01',
      fileName: 'NT-3301_DriveShaft.STEP',
      dims: '120.0 × 25.0 × 25.0 mm',
      unitWeight: '0.46 kg',
      qtyOrdered: 15,
      qtyShipped: 15,
    },
    {
      lineNum: 2,
      partId: 'P02',
      fileName: 'NT-3302_EndCap.STEP',
      dims: '40.0 × 40.0 × 15.0 mm',
      unitWeight: '0.08 kg',
      qtyOrdered: 30,
      qtyShipped: 25,
      note: '5 units pending re-machining — surface defect on first run',
    },
    {
      lineNum: 3,
      partId: 'P03',
      fileName: 'NT-3303_SealHousing.STEP',
      dims: '55.0 × 55.0 × 20.0 mm',
      unitWeight: '0.12 kg',
      qtyOrdered: 10,
      qtyShipped: 0,
      note: 'Material on backorder from supplier. ETA: May 28, 2026.',
    },
  ],

  contactName: 'InstaVoxel Shipping',
  contactEmail: 'shipping@instavoxel.com',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO PAGE — with Download PDF button
 * ════════════════════════════════════════════════════════════════ */
export default function PackingSlipDemoV4() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>

      <DownloadPdfButton filename="Packing-Slip" />

      {/* Label + caption */}
      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Packing Slip v4
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          v4: neutral palette · primary = 90% black · tighter header · unbolded carrier values
        </div>
      </div>

      {/* All three variants in one ref — prints together */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
        <PackingSlipDocument data={sampleInternational} />
        <PackingSlipDocument data={sampleDomestic} />
        <PackingSlipDocument data={samplePartial} />
      </div>

    </div>
  );
}
