/**
 * CoCDemo_v4 — Certificate of Conformance v2 demo
 *
 * Demonstrates 2 variants:
 *   1. International full shipment (3 parts, W. L. Gore)
 *   2. Domestic simple shipment (2 parts, BioMed Devices)
 */

import { DownloadPdfButton } from './DownloadPdfButton';
import { CoCDocumentV4, type CoCDataV4 } from '../../components/CoCDocument_v4';

/* ════════════════════════════════════════════════════════════════
 * DEMO 1 — International, 3-part shipment
 * Continues: Quote U26033148F → Invoice INV-2026-0047 → PS-2026-0031
 * ════════════════════════════════════════════════════════════════ */
const sampleInternational: CoCDataV4 = {
  cocId: 'COC-2026-0031',
  date: 'April 20, 2026',

  orderId: 'U26033148F',
  packingSlipRef: 'PS-2026-48F-1',
  poRef: 'PO-2026-48F-1',
  invoiceRef: 'INV-2026-0047',

  customerName: 'W. L. Gore & Associates, Inc.',
  customerContact: 'Amy Ishler',
  customerAddress: [
    '555 Paper Mill Road',
    'Elkton, MD 21921, USA',
  ],
  customerRevision: 'Rev C',

  parts: [
    {
      partId: 'P01',
      quotedPartId: '24-18473-2-09-AL',
      partName: 'Bracket Plate',
      drawingRef: '115425AT_BracketPlate_Rev.C.pdf',
      drawingRev: 'Rev C',
      material: 'Aluminum 6061-T6',
      finish: 'Anodize Type II',
      materialLot: 'LOT-2026-0412',
      quantityOrdered: 50,
      quantityShipped: 50,
    },
    {
      partId: 'P02',
      quotedPartId: '24-18474-5-07-SS',
      partName: 'Mounting Plate',
      drawingRef: '220817MP_MountingPlate_Rev.C.pdf',
      drawingRev: 'Rev C',
      material: 'Stainless Steel 304',
      finish: 'Electropolish',
      materialLot: 'LOT-2026-0413',
      quantityOrdered: 30,
      quantityShipped: 30,
    },
    {
      partId: 'P03',
      quotedPartId: '24-18475-1-03-G11',
      partName: 'Spacer Ring',
      drawingRef: 'SR-0098_SpacerRing_Rev.B.pdf',
      drawingRev: 'Rev B',
      material: 'Garolite G11',
      finish: 'As-machined',
      materialLot: 'LOT-2026-0415',
      quantityOrdered: 100,
      quantityShipped: 100,
    },
  ],

  countryOfOrigin: 'Taiwan (TW)',

  compliance: [
    { label: 'RoHS Directive 2011/65/EU',           compliant: true,  status: 'Compliant' },
    { label: 'REACH Regulation (EC) No 1907/2006',  compliant: true,  status: 'Compliant' },
    { label: 'Conflict Minerals (Dodd-Frank §1502)', compliant: false, status: 'N/A' },
    { label: 'ITAR (22 CFR Parts 120–130)',          compliant: false, status: 'N/A' },
  ],

  notes: 'All dimensions verified against Rev C drawing. Surface finish confirmed by visual inspection. Parts cleaned and individually bagged prior to shipment.',

  signerTitle: 'Quality Manager',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO 2 — Domestic, 2-part shipment (partial: 1 item short)
 * ════════════════════════════════════════════════════════════════ */
const sampleDomestic: CoCDataV4 = {
  cocId: 'COC-2026-0035',
  date: 'May 5, 2026',

  orderId: 'U26041277B',
  packingSlipRef: 'PS-2026-0035',
  poRef: 'PO-2026-0055',

  customerName: 'BioMed Devices Corp.',
  customerContact: 'James Wu',
  customerAddress: [
    '1200 Harbor Blvd, Suite 301',
    'Weehawken, NJ 07086, USA',
  ],
  customerRevision: 'Rev A',

  parts: [
    {
      partId: 'P01',
      quotedPartId: '24-19280-3-12-AL',
      partName: 'Sensor Bracket',
      drawingRef: 'BMD-2201_SensorBracket_Rev.A.pdf',
      drawingRev: 'Rev A',
      material: 'Aluminum 6061-T6',
      finish: 'Clear Anodize',
      materialLot: 'LOT-2026-0501',
      quantityOrdered: 20,
      quantityShipped: 20,
    },
    {
      partId: 'P02',
      quotedPartId: '24-19281-6-08-AL',
      partName: 'Retainer Clip',
      drawingRef: 'BMD-2202_RetainerClip_Rev.A.pdf',
      drawingRev: 'Rev A',
      material: 'Aluminum 6061-T6',
      finish: 'As-machined',
      materialLot: 'LOT-2026-0501',
      quantityOrdered: 40,
      quantityShipped: 30,
    },
  ],

  countryOfOrigin: 'Taiwan (TW)',

  compliance: [
    { label: 'RoHS Directive 2011/65/EU',            compliant: true,  status: 'Compliant' },
    { label: 'REACH Regulation (EC) No 1907/2006',   compliant: true,  status: 'Compliant' },
    { label: 'Conflict Minerals (Dodd-Frank §1502)',  compliant: false, status: 'N/A' },
    { label: 'ITAR (22 CFR Parts 120–130)',           compliant: false, status: 'N/A' },
  ],

  notes: 'P02 Retainer Clip: 10 pcs to follow upon completion. All shipped items inspected and conform to Rev A drawings.',

  signerTitle: 'Quality Manager',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO PAGE
 * ════════════════════════════════════════════════════════════════ */
export default function CoCDemoV4() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>

      <DownloadPdfButton filename="CoC-v4" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Certificate of Conformance v2
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          2 variants: International full (3 parts) · Domestic partial (P02 short)
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
        <CoCDocumentV4 data={sampleInternational} />
        <CoCDocumentV4 data={sampleDomestic} />
      </div>

    </div>
  );
}
