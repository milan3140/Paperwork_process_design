/**
 * BomDemo — Three BOM versions side-by-side for comparison
 *
 * Shows English, Chinese, and Bilingual versions simultaneously
 * using realistic CNC manufacturing data.
 */

import { BomDocument, type BomData, type BomLang } from '../../components/BomDocument';

const sampleBom: BomData = {
  orderId: 'Q1211263U 噴火槍',
  date: '2026-01-15',
  itemCount: 5,
  totalParts: 18,
  parts: [
    {
      partId: '噴火槍_P01',
      dimsMm: '127 × 89 × 45',
      dimsIn: '5.00 × 3.50 × 1.77',
      weight: '342 g',
      qty: 5,
      filename: '260129_RFQ_Assembly.stp',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Aluminum 6061-T6', valueZh: '鋁合金 6061-T6' },
        { label: 'Finish', value: 'Anodize Type II, Black', valueZh: '陽極氧化 Type II, 黑色' },
        { label: 'Tolerance', value: '±0.013mm geometric (7 locations)', valueZh: '±0.013mm 幾何公差 (7處)' },
        { label: 'Surface', value: 'Ra 0.8μm / 32μin (N6), Entire Part', valueZh: 'Ra 0.8μm / 32μin (N6), 全面' },
        { label: 'Threads', value: '34 total (4× M6×1.0, 30× M3×0.5)', valueZh: '共 34 處 (4× M6×1.0, 30× M3×0.5)' },
        { label: 'Inserts', value: '4× locating pins', valueZh: '4× 定位針' },
        { label: 'Helicoil', value: 'M3×0.5, 2D, SS 18-8' },
      ],
      notes: [
        '參見 PDF #1: 三個角度要求',
        '參見 PDF #3: 三個面的精度 — 只光面要嚴',
      ],
    },
    {
      partId: '噴火槍_P02',
      dimsMm: '88 × 62 × 31',
      dimsIn: '3.46 × 2.44 × 1.22',
      weight: '1,339 g',
      qty: 3,
      filename: 'Motor_Housing_v3.stp',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Stainless Steel 304', valueZh: '不鏽鋼 304' },
        { label: 'Finish', value: 'Standard', valueZh: '標準' },
        { label: 'Tolerance', value: '±0.05mm' },
        { label: 'Surface', value: 'Ra 1.6μm / 63μin, Entire Part', valueZh: 'Ra 1.6μm / 63μin, 全面' },
      ],
    },
    {
      partId: '噴火槍_P03',
      dimsMm: '65 × 52 × 28',
      dimsIn: '2.56 × 2.05 × 1.10',
      weight: '236 g',
      qty: '待定',
      filename: '260129_RFQ_1.stp',
      specs: [
        { label: 'Process', value: 'CNC Brittle Material', valueZh: 'CNC 硬脆材加工' },
        { label: 'Material', value: 'ZERODUR' },
        { label: 'Finish', value: 'Etching', valueZh: '蝕刻' },
        { label: 'Tolerance', value: '±0.0127mm geometric', valueZh: '±0.0127mm 幾何公差' },
        { label: 'Surface', value: 'Ra 0.4μm (N5)' },
      ],
      notes: [
        '公差含幾何公差',
        '參見 PDF #1: 三個角度要求',
        '參見 PDF #3: 三個面精度 — 只光面要嚴',
      ],
    },
    {
      partId: '噴火槍_P04',
      dimsMm: '220 × 180 × 55',
      dimsIn: '8.66 × 7.09 × 2.17',
      weight: '2,180 g',
      qty: 5,
      filename: 'Base_Plate_Rev4.stp',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Aluminum 6061-T6', valueZh: '鋁合金 6061-T6' },
        { label: 'Finish', value: 'As-Machined', valueZh: '素材' },
        { label: 'Tolerance', value: '±0.1mm' },
        { label: 'Threads', value: '12× M4×0.7', valueZh: '12× M4×0.7' },
      ],
    },
    {
      partId: '噴火槍_P05',
      dimsMm: '35 × 12 × 8',
      dimsIn: '1.38 × 0.47 × 0.31',
      weight: '18 g',
      qty: 5,
      filename: 'Pin_Connector.stp',
      specs: [
        { label: 'Process', value: 'CNC Machining', valueZh: 'CNC 加工' },
        { label: 'Material', value: 'Stainless Steel 316L', valueZh: '不鏽鋼 316L' },
        { label: 'Finish', value: 'Electropolish', valueZh: '電解拋光' },
        { label: 'Tolerance', value: '±0.025mm' },
        { label: 'Surface', value: 'Ra 0.4μm (N5)' },
      ],
    },
  ],
};

const versions: { lang: BomLang; label: string }[] = [
  { lang: 'en',    label: 'English' },
  { lang: 'zh',    label: '中文' },
  { lang: 'zh-en', label: '中英雙語 Bilingual' },
];

export default function BomDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60, padding: '40px 0' }}>
      {versions.map(({ lang, label }) => (
        <div key={lang}>
          <div
            className="bom-demo-label"
            style={{
              textAlign: 'center',
              marginBottom: 12,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--gray-500)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
            }}
          >
            {label}
          </div>
          <BomDocument data={sampleBom} lang={lang} />
        </div>
      ))}
    </div>
  );
}
