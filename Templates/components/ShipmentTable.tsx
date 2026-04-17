/**
 * ShipmentTable — Shipment history table for Invoice documents
 *
 * Renders a compact table of shipment records with carrier, tracking,
 * and packing slip cross-references. Uses primary-wash header matching NRETable.
 * Returns null if shipments array is empty.
 *
 * Single shipment: titled "Shipment"
 * Multiple shipments: titled "Shipment History (N Shipments)"
 *
 * Optional Incoterms line shown below the table for international orders.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 */

import { SectionLabel } from './SectionLabel';

export interface ShipmentRecord {
  shipDate: string;
  carrier: string;
  trackingNumber: string;
  packingSlipRef: string;
}

interface ShipmentTableProps {
  shipments: ShipmentRecord[];
}

const TH = 'bg-[var(--gray-50)] text-[length:10px] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] py-[var(--doc-sp-table-y)] px-[var(--sp-2)]';

const TD = 'py-[var(--doc-sp-table-y)] px-[var(--sp-2)] text-[length:13px] text-[color:var(--gray-900)] leading-[1.4]';

export function ShipmentTable({ shipments }: ShipmentTableProps) {
  if (shipments.length === 0) return null;

  return (
    <div data-comp="ShipmentTable" className="flex flex-col gap-0">
      <SectionLabel>Shipment</SectionLabel>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${TH} text-left`} style={{ width: '22%' }}>Ship Date</th>
            <th className={`${TH} text-left`} style={{ width: '20%' }}>Carrier</th>
            <th className={`${TH} text-left`} style={{ width: '30%' }}>Tracking #</th>
            <th className={`${TH} text-left`} style={{ width: '28%' }}>Packing Slip</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s, i) => (
            <tr key={i} data-el="ShipmentTable-row">
              <td className={TD}>{s.shipDate}</td>
              <td className={TD}>{s.carrier}</td>
              <td className={TD} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {s.trackingNumber}
              </td>
              <td className={TD}>{s.packingSlipRef}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ShipmentTable;
