/**
 * FactoryBomDemo v2 — Factory-facing RFQ BOM for supplier quoting
 *
 * Uses FactoryBomDocument v2 with 5-column layout, 14px key fields,
 * notes section, and print handler.
 */

import { useRef } from 'react';
import { FactoryBomDocument, type FactoryBomData } from '../../components/FactoryBomDocument';

const sampleBom: FactoryBomData = {
  orderCode: 'U26033148F',
  orderName: '簡易BOM測試',
  issueDate: '4 月 1 日 (三)',
  replyDeadline: '4 月 7 日 (二) 下午 4 點前',
  parts: [
    {
      partId: 'P01',
      dimsMm: { l: 127, w: 89, h: 45 },
      weight: 0.34,
      material: '鋁合金 6061-T6',
      finish: '黑色陽極氧化',
      qtyTiers: [1, 5, 10],
    },
    {
      partId: 'P02',
      variantLabel: 'A',
      dimsMm: { l: 88, w: 62, h: 31 },
      weight: 1.34,
      material: '不鏽鋼 304',
      finish: '標準',
      qtyTiers: [2, 4, 8],
    },
    {
      partId: 'P02',
      variantLabel: 'B',
      dimsMm: { l: 88, w: 62, h: 31 },
      weight: 0.48,
      material: '鋁合金 7075-T6',
      finish: '透明陽極氧化',
      qtyTiers: [2, 4, 8],
    },
    {
      partId: 'P03',
      dimsMm: { l: 65, w: 52, h: 28 },
      weight: 0.24,
      material: 'ZERODUR',
      finish: '標準',
      qtyTiers: [1, 3],
    },
    {
      partId: 'P04',
      dimsMm: { l: 220, w: 180, h: 55 },
      weight: 2.18,
      material: '鋁合金 6061-T6',
      finish: '標準',
      qtyTiers: [5, 10, 20],
    },
    {
      partId: 'P05',
      dimsMm: { l: 35, w: 12, h: 8 },
      weight: 0.02,
      material: '不鏽鋼 316L',
      finish: '電解拋光',
      qtyTiers: [5, 10, 50],
    },
    {
      partId: 'P05',
      dimsMm: { l: 35, w: 12, h: 8 },
      weight: 0.02,
      material: '不鏽鋼 316L',
      finish: '電解拋光',
      qtyTiers: [5, 10, 50],
    },
    {
      partId: 'P05',
      dimsMm: { l: 35, w: 12, h: 8 },
      weight: 0.02,
      material: '不鏽鋼 316L',
      finish: '電解拋光',
      qtyTiers: [5, 10, 50],
    },
    {
      partId: 'P05',
      dimsMm: { l: 35, w: 12, h: 8 },
      weight: 0.02,
      material: '不鏽鋼 316L',
      finish: '電解拋光',
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
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>RFQ BOM ${sampleBom.orderCode} ${sampleBom.orderName}</title>${styles}${printCss}</head><body>${pdfRef.current.outerHTML}</body></html>`
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
