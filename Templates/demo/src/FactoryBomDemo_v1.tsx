/**
 * FactoryBomDemo — Factory-facing RFQ BOM for supplier quoting
 *
 * Uses FactoryBomDocument with qty tiers and fillable price/delivery fields.
 */

import { useRef } from 'react';
import { FactoryBomDocument, type FactoryBomData } from '../../components/FactoryBomDocument_v1';

const sampleBom: FactoryBomData = {
  orderId: 'Q1211263U 噴火槍',
  replyDeadline: '2026-01-15 17:00 前',
  itemCount: 5,
  totalParts: 18,
  parts: [
    {
      partId: 'P01',
      dimsMm: '127 × 89 × 45',
      dimsIn: '5.00 × 3.50 × 1.77',
      weight: '0.34 kg',
      filename: '260129_RFQ_Assembly.stp',
      drawingFilename: 'P01_Assembly_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Aluminum 6061-T6', valueZh: '鋁合金 6061-T6' },
        { label: 'Finish', value: 'Anodize Type II, Black', valueZh: '陽極氧化 Type II, 黑色' },
      ],
      qtyTiers: [1, 5, 10],
    },
    {
      partId: 'P02',
      dimsMm: '88 × 62 × 31',
      dimsIn: '3.46 × 2.44 × 1.22',
      weight: '1.34 kg',
      filename: 'Motor_Housing_v3.stp',
      drawingFilename: 'P02_Motor_Housing_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Stainless Steel 304', valueZh: '不鏽鋼 304' },
        { label: 'Finish', value: 'Standard', valueZh: '標準' },
      ],
      qtyTiers: [2, 4, 8],
    },
    {
      partId: 'P03',
      dimsMm: '65 × 52 × 28',
      dimsIn: '2.56 × 2.05 × 1.10',
      weight: '0.24 kg',
      filename: '260129_RFQ_1.stp',
      drawingFilename: 'P03_Optics_Mount_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Brittle Material', valueZh: 'CNC 硬脆材加工' },
        { label: 'Material', value: 'ZERODUR' },
        { label: 'Finish', value: 'Etching', valueZh: '蝕刻' },
      ],
      qtyTiers: [1, 3],
    },
    {
      partId: 'P04',
      dimsMm: '220 × 180 × 55',
      dimsIn: '8.66 × 7.09 × 2.17',
      weight: '2.18 kg',
      filename: 'Base_Plate_Rev4.stp',
      drawingFilename: 'P04_Base_Plate_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Aluminum 6061-T6', valueZh: '鋁合金 6061-T6' },
        { label: 'Finish', value: 'As-Machined', valueZh: '素材' },
      ],
      qtyTiers: [5, 10, 20],
    },
    {
      partId: 'P05',
      dimsMm: '35 × 12 × 8',
      dimsIn: '1.38 × 0.47 × 0.31',
      weight: '0.02 kg',
      filename: 'Pin_Connector.stp',
      drawingFilename: 'P05_Pin_Connector_Drawing.pdf',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Stainless Steel 316L', valueZh: '不鏽鋼 316L' },
        { label: 'Finish', value: 'Electropolish', valueZh: '電解拋光' },
      ],
      qtyTiers: [5, 10, 50],
    },
  ],
};

export default function FactoryBomDemo() {
  const pdfRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!pdfRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML).join('\n');
    const printCss = `
      <style>
        @media print {
          @page { size: Letter; margin: 0; }
          body { margin: 0; }
        }
        .doc-page {
          width: 215.9mm;
          height: 279.4mm;
          display: flex;
          flex-direction: column;
          page-break-after: always;
          overflow: hidden;
        }
        .doc-page:last-child { page-break-after: auto; }
        .doc-content { flex: 1; }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      </style>`;
    printWindow.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>BOM ${sampleBom.orderId}</title>${styles}${printCss}</head><body>${pdfRef.current.outerHTML}</body></html>`
    );
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
      <button
        onClick={handlePrint}
        className="group inline-flex items-center gap-3 h-[48px] px-[var(--sp-8)] rounded-[var(--radius-pill)] text-[length:var(--text-md)] font-bold cursor-pointer bg-[var(--color-primary)] text-white shadow-[0_4px_14px_rgba(46,13,119,0.25)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(46,13,119,0.35)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(46,13,119,0.20)] transition-all duration-[var(--duration-normal)]"
      >
        <svg className="w-[18px] h-[18px] transition-transform duration-[var(--duration-normal)] group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
        </svg>
        Download PDF
      </button>
      <FactoryBomDocument ref={pdfRef} data={sampleBom} />
    </div>
  );
}
