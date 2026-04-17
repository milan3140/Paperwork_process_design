/**
 * PackingSlipDocument v1 — Shipment manifest for CNC machined parts
 *
 * FROZEN SNAPSHOT — do not modify.
 * Active development → PackingSlipDocument.tsx (v2)
 *
 * v1 design: compact flat table for items, unified documents checklist,
 * PartiesRow side-by-side address layout, single-page (no pagination).
 *
 * Designed for three sequential readers:
 *   1. Dock worker — PO/Quote Ref → Part # + Qty → visual check → sign
 *   2. IQC inspector — Material/Finish → Qty discrepancy → docs checklist
 *   3. AP clerk — PS # → three-way match with Invoice + PO
 *
 * Key design decisions (v1):
 * - **Compact table** for items (not PartBlock) — dock workers need fast counting
 * - **Unified documents checklist** — one section, not repeated per-part
 * - **Qty discrepancy highlighting** — visual indicator when Shipped ≠ Ordered
 * - **NO pricing** — absolute rule, prices only on Invoice
 * - **International fields conditional** — Country of Origin, Weight, HS Code
 * - **Received By signature** — not SignatureRow (single signer, not dual)
 *
 * Supports 3 variants (one component, conditional props):
 * - International shipment (Taiwan → US): customs fields
 * - Domestic shipment: simplified
 * - Partial shipment: "Shipment X of Y" label + qty highlighting
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css, documents.css,
 *   DocumentHeader, DocumentFooter, DocumentMeta, SectionLabel,
 *   PartiesRow, NotesList, WarningBox
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type            | Required | Default | Description                 |
 * |------|-----------------|----------|---------|-----------------------------|
 * | data | PackingSlipData | yes      | —       | Complete packing slip data  |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <PackingSlipDocumentV1 data={slipData} />
 */

import React from 'react';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { PartiesRow, type PartyInfo } from './PartiesRow';
import { NotesList } from './NotesList';
import { WarningBox } from './WarningBox';

/* ── Types ── */

export interface PackingSlipItemV1 {
  lineNum: number;
  partId: string;
  /** Drawing/model file reference — dock worker matches to physical label */
  fileName: string;
  /** Physical dimensions e.g., "255.0 × 225.0 × 34.5 mm" */
  dims: string;
  /** Unit weight e.g., "0.86 kg" — for counting by weight + customs */
  unitWeight: string;
  qtyOrdered: number;
  qtyShipped: number;
  note?: string;            // Per-part special instruction (only if needed)
}

export interface AccompanyingDocV1 {
  name: string;
  checked: boolean;
  /** Optional per-part scope (e.g., "P01 only") */
  scope?: string;
}

export interface PackingSlipDataV1 {
  slipId: string;
  date: string;

  /* ── Cross-references ── */
  quoteRef: string;         // PRIMARY reference (highlight)
  poRef?: string;
  invoiceRef?: string;      // Forward reference if invoice already issued

  /* ── Parties ── */
  shipFrom: PartyInfo;
  shipTo: PartyInfo;

  /* ── Shipment details ── */
  carrier: string;
  trackingNumber: string;
  shipMethod?: string;      // "DHL Express", "FedEx Ground", etc.
  packages: string;         // "1 of 1", "2 of 3"

  /* ── International fields (conditional) ── */
  international?: boolean;
  countryOfOrigin?: string;
  grossWeight?: string;
  netWeight?: string;
  incoterms?: string;

  /* ── Partial shipment (conditional) ── */
  isPartial?: boolean;
  shipmentLabel?: string;   // "Shipment 1 of 2"

  /* ── Line items — NO pricing ── */
  items: PackingSlipItemV1[];

  /* ── Accompanying documents checklist (unified, not per-part) ── */
  documents: AccompanyingDocV1[];

  /* ── Notes ── */
  notes?: string[];
  contactName?: string;
  contactEmail?: string;
}

interface PackingSlipDocumentV1Props {
  data: PackingSlipDataV1;
}

/* ── Table styles ── */
const TH = [
  'text-[length:var(--doc-text-param-label)] font-semibold',
  'text-[color:var(--gray-400)] tracking-[var(--doc-tracking-label)]',
  'py-[var(--sp-1)] px-[var(--sp-2)]',
  'border-b border-[var(--gray-200)]',
  'text-left uppercase',
].join(' ');

const TD = [
  'text-[length:var(--doc-text-body)]',
  'text-[color:var(--gray-900)]',
  'py-[var(--doc-sp-table-y)] px-[var(--sp-2)]',
  'border-b border-[var(--gray-150)]',
  'align-top',
].join(' ');

/* ── Column widths — fixed for numeric/short cols, flex for content cols ──
   Following FactoryBomDocument's <colgroup> + constant pattern.
   Usable width: Letter (215.9mm) - 2×16mm margins ≈ 695px.
   Fixed total: 28+52+160+56+48+48 = 392px → File Name gets ~303px remaining. */
const COL_NUM = 28;        // # — sequential number
const COL_PART_ID = 52;    // Part # — "P01"
const COL_DIMS = 160;      // Dimensions — "255.0 × 225.0 × 34.5 mm"
const COL_UNIT_WT = 56;    // Unit Wt — "0.86 kg"
const COL_QTY = 48;        // Ordered / Shipped — numeric, same width for alignment

export const PackingSlipDocumentV1 = React.forwardRef<HTMLDivElement, PackingSlipDocumentV1Props>(
  function PackingSlipDocumentV1({ data }, ref) {

    const metaItems: MetaItem[] = [
      { label: 'Date', value: data.date },
      { label: 'Quote Ref', value: data.quoteRef, highlight: true },
    ];
    if (data.poRef) metaItems.push({ label: 'PO Ref', value: data.poRef });
    if (data.invoiceRef) metaItems.push({ label: 'Invoice Ref', value: data.invoiceRef });

    /* Check if any line has qty discrepancy */
    const hasDiscrepancy = data.items.some(item => item.qtyShipped !== item.qtyOrdered);

    /* Collect per-part notes (only parts that have special instructions) */
    const partNotes = data.items
      .filter(item => item.note)
      .map(item => `${item.partId}: ${item.note}`);

    /* ── Build sections array ── */
    const sections: PageSection[] = [];

    /* ── Title + Meta ── */
    sections.push({
      key: 'title-meta',
      content: (
        <div data-el="PackingSlipDocument-titleRow" className="flex justify-between items-start">
          <div>
            <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
              Packing Slip
            </div>
            <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
              #{data.slipId}
            </div>
            {data.isPartial && data.shipmentLabel && (
              <div className="text-[length:var(--doc-text-body)] font-semibold text-[color:var(--color-primary)] mt-[var(--sp-1)]">
                {data.shipmentLabel}
              </div>
            )}
          </div>
          <DocumentMeta items={metaItems} />
        </div>
      ),
    });

    /* ── Parties (Ship From + Ship To — side by side) ── */
    sections.push({
      key: 'parties',
      content: (
        <PartiesRow
          from={data.shipFrom}
          billTo={data.shipTo}
          fromLabel="Ship From"
          toLabel="Ship To"
        />
      ),
    });

    /* ── Shipment Details ── */
    sections.push({
      key: 'shipment',
      content: (
        <div data-el="PackingSlipDocument-shipment">
          <SectionLabel>Shipment Details</SectionLabel>
          <div className="flex flex-col mt-[var(--doc-sp-1-5)]">
            {[
              { label: 'Carrier', value: data.carrier },
              { label: 'Tracking #', value: data.trackingNumber },
              ...(data.shipMethod ? [{ label: 'Method', value: data.shipMethod }] : []),
              { label: 'Packages', value: data.packages },
              ...(data.international && data.countryOfOrigin ? [{ label: 'Origin', value: data.countryOfOrigin }] : []),
              ...(data.international && data.grossWeight ? [{ label: 'Gross Weight', value: data.grossWeight }] : []),
              ...(data.international && data.netWeight ? [{ label: 'Net Weight', value: data.netWeight }] : []),
              ...(data.international && data.incoterms ? [{ label: 'Incoterms', value: data.incoterms }] : []),
            ].map((row) => (
              <div key={row.label} className="grid py-[var(--doc-sp-table-y)]" style={{ gridTemplateColumns: '88px 1fr' }}>
                <span className="text-[length:var(--doc-text-secondary)] font-semibold uppercase tracking-[var(--doc-tracking-label)] text-[color:var(--gray-400)]">
                  {row.label}
                </span>
                <span className="text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-900)]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    });

    /* ── Items Table (compact — no pricing) ── */
    sections.push({
      key: 'items',
      content: (
        <div data-el="PackingSlipDocument-items">
          <SectionLabel>Items ({data.items.length} types)</SectionLabel>
          <table className="w-full border-collapse mt-[var(--doc-sp-1-5)]">
            <colgroup>
              <col style={{ width: COL_NUM }} />
              <col style={{ width: COL_PART_ID }} />
              <col /> {/* File Name — remaining space */}
              <col style={{ width: COL_DIMS }} />
              <col style={{ width: COL_UNIT_WT }} />
              <col style={{ width: COL_QTY }} />
              <col style={{ width: COL_QTY }} />
            </colgroup>
            <thead>
              <tr>
                <th className={TH}>#</th>
                <th className={TH}>Part #</th>
                <th className={TH}>File Name</th>
                <th className={TH}>Dimensions</th>
                <th className={TH}>Unit Wt</th>
                <th className={`${TH} text-right`}>Ordered</th>
                <th className={`${TH} text-right`}>Shipped</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const mismatch = item.qtyShipped !== item.qtyOrdered;
                return (
                  <tr key={item.lineNum}>
                    <td className={`${TD} text-[color:var(--gray-400)]`}>{item.lineNum}</td>
                    <td className={`${TD} font-bold text-[length:var(--doc-text-part-id)]`}>{item.partId}</td>
                    <td className={`${TD} text-[length:var(--doc-text-secondary)]`}>{item.fileName}</td>
                    <td className={`${TD} text-[length:var(--doc-text-secondary)]`}>{item.dims}</td>
                    <td className={TD}>{item.unitWeight}</td>
                    <td className={`${TD} text-right font-semibold`}>{item.qtyOrdered}</td>
                    <td
                      className={`${TD} text-right font-bold`}
                      style={mismatch ? { color: 'var(--color-warning-text)', backgroundColor: 'var(--color-warning-bg)' } : undefined}
                    >
                      {item.qtyShipped}
                      {mismatch && item.qtyShipped < item.qtyOrdered && (
                        <span className="text-[length:var(--doc-text-param-label)] block">
                          ({item.qtyOrdered - item.qtyShipped} remaining)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    });

    /* ── Partial Shipment Warning (conditional) ── */
    if (data.isPartial && hasDiscrepancy) {
      sections.push({
        key: 'partial-warning',
        content: (
          <WarningBox>
            <strong>Partial Shipment:</strong> Not all items are included in this shipment.
            Remaining quantities will follow.
            {data.contactEmail && <> Contact {data.contactName ?? 'us'} at {data.contactEmail} for updated delivery schedule.</>}
          </WarningBox>
        ),
      });
    }

    /* ── Accompanying Documents Checklist ── */
    if (data.documents.length > 0) {
      sections.push({
        key: 'documents',
        content: (
          <div data-el="PackingSlipDocument-docs">
            <SectionLabel>Accompanying Documents</SectionLabel>
            <div className="flex flex-col gap-[var(--sp-1)] mt-[var(--doc-sp-1-5)]">
              {data.documents.map((doc, i) => (
                <div key={i} className="flex items-baseline gap-[var(--sp-2)] text-[length:var(--doc-text-body)]">
                  <span className="text-[length:var(--doc-text-part-id)] shrink-0">
                    {doc.checked ? '☑' : '☐'}
                  </span>
                  <span className={`${doc.checked ? 'text-[color:var(--gray-900)] font-medium' : 'text-[color:var(--gray-400)]'}`}>
                    {doc.name}
                    {doc.scope && (
                      <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] ml-[var(--sp-1)]">
                        — {doc.scope}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ),
      });
    }

    /* ── Special Instructions (per-part notes) ── */
    if (partNotes.length > 0) {
      sections.push({
        key: 'special-instructions',
        content: <NotesList label="Special Instructions" items={partNotes} />,
      });
    }

    /* ── General Notes ── */
    if (data.notes && data.notes.length > 0) {
      sections.push({
        key: 'notes',
        content: <NotesList label="Notes" items={data.notes} />,
      });
    }

    /* ── Received By (single signer — dock worker) ── */
    sections.push({
      key: 'receivedBy',
      content: (
        <div data-el="PackingSlipDocument-receivedBy" className="mt-[var(--sp-4)]">
          <SectionLabel>Received By</SectionLabel>
          <div className="grid grid-cols-3 gap-[var(--sp-6)] mt-[var(--sp-6)]">
            <div className="flex flex-col gap-[var(--sp-5)]">
              <div className="border-b border-[var(--gray-200)]" style={{ minHeight: 'var(--h-sm)' }} />
              <div className="text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)] -mt-[var(--sp-4)]">
                Name / Title
              </div>
            </div>
            <div className="flex flex-col gap-[var(--sp-5)]">
              <div className="border-b border-[var(--gray-200)]" style={{ minHeight: 'var(--h-sm)' }} />
              <div className="text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)] -mt-[var(--sp-4)]">
                Date
              </div>
            </div>
            <div className="flex flex-col gap-[var(--sp-5)]">
              <div className="border-b border-[var(--gray-200)]" style={{ minHeight: 'var(--h-sm)' }} />
              <div className="text-[length:var(--doc-text-footer)] text-[color:var(--gray-400)] -mt-[var(--sp-4)]">
                Signature
              </div>
            </div>
          </div>
        </div>
      ),
    });

    return (
      <div ref={ref} data-comp="PackingSlipDocumentV1">
        <PaginatedDocument
          docType="Packing Slip"
          docId={data.slipId}
          sections={sections}
        />
      </div>
    );
  }
);

export default PackingSlipDocumentV1;
