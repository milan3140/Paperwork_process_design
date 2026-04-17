/**
 * PackingSlipDemo v1 — FROZEN SNAPSHOT
 * Active development → PackingSlipDemo.tsx (v2)
 *
 * Demonstrates 3 Packing Slip v1 variants:
 * 1. International Full Shipment (Taiwan → US via DHL)
 * 2. Domestic Shipment (US → US, simplified)
 * 3. International Partial Shipment (with qty discrepancy highlighting)
 */

import { PackingSlipDocumentV1, type PackingSlipDataV1 } from '../../components/PackingSlipDocument_v1';
import { DownloadPdfButton } from './DownloadPdfButton';

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA — International Full Shipment (Taiwan → US)
 * Continues the Acme order lifecycle:
 * Quote (U26033148F) → Invoice (INV-2026-0047) → Packing Slip (PS-2026-0031)
 * All 3 parts shipped together via DHL Express.
 * ════════════════════════════════════════════════════════════════ */
const sampleInternational: PackingSlipDataV1 = {
  slipId: 'PS-2026-0031',
  date: 'April 20, 2026',

  quoteRef: 'U26033148F',
  poRef: 'PO-2026-0042',

  shipFrom: {
    name: 'InstaVoxel, Inc.',
    lines: [
      'No. 100, Sec. 2, Zhongxiao E. Rd',
      "Da'an District, Taipei 106, Taiwan",
      '+886-2-2771-0000',
      'shipping@instavoxel.com',
    ],
  },
  shipTo: {
    name: 'Acme Precision Engineering',
    lines: [
      '5678 Manufacturing Dr, Bldg C',
      'San Jose, CA 95134, USA',
      'Attn: Mike Johnson (Receiving)',
      '+1-408-555-0199',
    ],
  },

  carrier: 'DHL Express',
  trackingNumber: '1234567890',
  shipMethod: 'International Priority',
  packages: '1 of 1',

  international: true,
  countryOfOrigin: 'Taiwan (TW)',
  grossWeight: '6.8 kg',
  netWeight: '5.2 kg',
  incoterms: 'DDP (Delivered Duty Paid)',

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
      note: 'Handle with care — brittle material',
    },
  ],

  documents: [
    { name: 'Certificate of Conformance (CoC)', checked: true },
    { name: 'First Article Inspection Report (FAI)', checked: true, scope: 'P01 only' },
    { name: 'Dimensional Inspection Report', checked: true },
    { name: 'Material Certification', checked: false },
    { name: 'Finishing Certification', checked: true, scope: 'P02 Electropolish' },
  ],

  notes: [
    'All parts inspected and verified before shipment.',
    'For quantity discrepancies or missing documentation, contact InstaVoxel shipping.',
  ],
  contactName: 'InstaVoxel Shipping',
  contactEmail: 'shipping@instavoxel.com',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA — Domestic Shipment (US → US, simplified)
 * ════════════════════════════════════════════════════════════════ */
const sampleDomestic: PackingSlipDataV1 = {
  slipId: 'PS-2026-0035',
  date: 'May 5, 2026',

  quoteRef: 'U26041277B',

  shipFrom: {
    name: 'InstaVoxel, Inc.',
    lines: [
      '123 Innovation Pkwy, Suite 100',
      'San Jose, CA 95112, USA',
      '+1-408-555-0100',
    ],
  },
  shipTo: {
    name: 'BioMed Devices Corp.',
    lines: [
      '800 Tech Center Dr',
      'Austin, TX 78701, USA',
      'Attn: Lisa Park (Receiving)',
    ],
  },

  carrier: 'FedEx',
  trackingNumber: '7891 2345 6789',
  shipMethod: 'Ground',
  packages: '1 of 1',

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
  ],

  documents: [
    { name: 'Certificate of Conformance (CoC)', checked: true },
    { name: 'Dimensional Inspection Report', checked: true },
  ],
};

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA — Partial Shipment (International, 2 of 3 parts shipped)
 * ════════════════════════════════════════════════════════════════ */
const samplePartial: PackingSlipDataV1 = {
  slipId: 'PS-2026-0038',
  date: 'May 15, 2026',

  quoteRef: 'U26042099C',
  poRef: 'PO-2026-0055',

  shipFrom: {
    name: 'InstaVoxel, Inc.',
    lines: [
      'No. 100, Sec. 2, Zhongxiao E. Rd',
      "Da'an District, Taipei 106, Taiwan",
    ],
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
  packages: '1 of 1',

  international: true,
  countryOfOrigin: 'Taiwan (TW)',
  grossWeight: '2.1 kg',
  netWeight: '1.4 kg',
  incoterms: 'DAP (Delivered at Place)',

  isPartial: true,
  shipmentLabel: 'Shipment 1 of 2',

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

  documents: [
    { name: 'Certificate of Conformance (CoC)', checked: true, scope: 'P01, P02 only' },
    { name: 'Dimensional Inspection Report', checked: true, scope: 'P01, P02 only' },
    { name: 'Material Certification', checked: false },
  ],

  notes: [
    'Partial shipment — P03 (PEEK Seal Housing) backordered due to material delay.',
    'Remaining items will ship as Shipment 2 of 2, ETA late May 2026.',
  ],
  contactName: 'InstaVoxel Shipping',
  contactEmail: 'shipping@instavoxel.com',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO PAGE
 * ════════════════════════════════════════════════════════════════ */
export default function PackingSlipDemoV1() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="Packing-Slip-v1" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Packing Slip v1
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          Snapshot
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
        <PackingSlipDocumentV1 data={sampleInternational} />
        <PackingSlipDocumentV1 data={sampleDomestic} />
        <PackingSlipDocumentV1 data={samplePartial} />
      </div>
    </div>
  );
}
