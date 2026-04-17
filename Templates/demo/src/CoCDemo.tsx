/**
 * CoCDemo — Certificate of Conformance demo
 *
 * Demonstrates 2 variants following the Acme order lifecycle:
 *   1. International full shipment (3 parts, all compliant)
 *   2. Domestic simple shipment (1 part, no FAI required)
 */

import { DownloadPdfButton } from './DownloadPdfButton';
import { CoCDocument, type CoCData } from '../../components/CoCDocument';

/* ════════════════════════════════════════════════════════════════
 * DEMO 1 — International, 3-part shipment
 * Continues: Quote U26033148F → Invoice INV-2026-0047 → PS-2026-0031
 * ════════════════════════════════════════════════════════════════ */
const sampleInternational: CoCData = {
  cocId: 'COC-2026-0031',
  date: 'April 20, 2026',

  orderId: 'U26033148F',
  packingSlipRef: 'PS-2026-0031',
  poRef: 'PO-2026-0042',
  invoiceRef: 'INV-2026-0047',

  customerName: 'W. L. Gore & Associates, Inc.',
  customerPoLine: 'N/A',
  customerRevision: 'Rev C',
  customerSerial: 'N/A',

  parts: [
    {
      partId: 'P01',
      quotedPartId: 'U26033148F_P01',
      partName: 'Bracket Plate',
      drawingRef: '115425AT_BracketPlate_Rev.C.pdf',
      drawingRev: 'Rev C',
      material: 'Aluminum 6061-T6',
      materialLot: 'LOT-2026-0412',
      finish: 'Anodize Type II',
      quantity: 50,
    },
    {
      partId: 'P02',
      quotedPartId: 'U26033148F_P02',
      partName: 'Mounting Plate',
      drawingRef: '220817MP_MountingPlate_Rev.C.pdf',
      drawingRev: 'Rev C',
      material: 'Stainless Steel 304',
      materialLot: 'LOT-2026-0413',
      finish: 'Electropolish',
      quantity: 30,
    },
    {
      partId: 'P03',
      quotedPartId: 'U26033148F_P03',
      partName: 'Spacer Ring',
      drawingRef: 'SR-0098_SpacerRing_Rev.B.pdf',
      drawingRev: 'Rev B',
      material: 'Garolite G11',
      materialLot: 'LOT-2026-0415',
      finish: 'As-machined',
      quantity: 100,
    },
  ],

  countryOfOrigin: 'Taiwan (TW)',

  compliance: [
    { label: 'RoHS Directive 2011/65/EU',                  compliant: true,  status: 'Compliant' },
    { label: 'REACH Regulation (EC) No 1907/2006',         compliant: true,  status: 'Compliant' },
    { label: 'Conflict Minerals (Dodd-Frank §1502)',        compliant: false, status: 'N/A' },
    { label: 'ITAR (22 CFR Parts 120–130)',                 compliant: false, status: 'N/A' },
  ],

  notes: 'All dimensions verified against Rev C drawing. Surface finish confirmed by visual inspection. Parts cleaned and individually bagged prior to shipment.',

  signerTitle: 'Quality Manager',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO 2 — Domestic, 1-part shipment
 * ════════════════════════════════════════════════════════════════ */
const sampleDomestic: CoCData = {
  cocId: 'COC-2026-0035',
  date: 'May 5, 2026',

  orderId: 'U26041277B',
  packingSlipRef: 'PS-2026-0035',
  poRef: 'PO-2026-0055',

  customerName: 'BioMed Devices Corp.',
  customerPoLine: 'N/A',
  customerRevision: 'Rev A',
  customerSerial: 'N/A',

  parts: [
    {
      partId: 'P01',
      quotedPartId: 'U26041277B_P01',
      partName: 'Sensor Bracket',
      drawingRef: 'BMD-2201_SensorBracket_Rev.A.pdf',
      drawingRev: 'Rev A',
      material: 'Aluminum 6061-T6',
      materialLot: 'LOT-2026-0501',
      finish: 'Clear Anodize',
      quantity: 20,
    },
    {
      partId: 'P02',
      quotedPartId: 'U26041277B_P02',
      partName: 'Retainer Clip',
      drawingRef: 'BMD-2202_RetainerClip_Rev.A.pdf',
      drawingRev: 'Rev A',
      material: 'Aluminum 6061-T6',
      materialLot: 'LOT-2026-0501',
      finish: 'As-machined',
      quantity: 40,
    },
  ],

  countryOfOrigin: 'Taiwan (TW)',

  compliance: [
    { label: 'RoHS Directive 2011/65/EU',          compliant: true,  status: 'Compliant' },
    { label: 'REACH Regulation (EC) No 1907/2006', compliant: true,  status: 'Compliant' },
    { label: 'Conflict Minerals (Dodd-Frank §1502)', compliant: false, status: 'N/A' },
    { label: 'ITAR (22 CFR Parts 120–130)',          compliant: false, status: 'N/A' },
  ],

  signerTitle: 'Quality Manager',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO PAGE
 * ════════════════════════════════════════════════════════════════ */
export default function CoCDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>

      <DownloadPdfButton filename="CoC" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Certificate of Conformance
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          2 variants: International (3 parts) · Domestic (2 parts)
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
        <CoCDocument data={sampleInternational} />
        <CoCDocument data={sampleDomestic} />
      </div>

    </div>
  );
}
