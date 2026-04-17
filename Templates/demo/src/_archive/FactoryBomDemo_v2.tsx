/**
 * FactoryBomDemo v2 — Factory-facing RFQ BOM for supplier quoting
 *
 * Uses FactoryBomDocument v2 with 5-column layout, 14px key fields,
 * notes section, and print handler.
 */

import { FactoryBomDocument, type FactoryBomData } from '../../../components/FactoryBomDocument_v2';
import { DownloadPdfButton } from '../DownloadPdfButton';

const sampleBom: FactoryBomData = {
  orderCode: 'U26033148F',
  orderName: '簡易BOM測試',
  issueDate: '4 月 1 日 （三）',
  replyDeadline: '4 月 7 日 （二） 下午 4 點前',
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
      <DownloadPdfButton filename="Factory-BOM-v2" />
      <FactoryBomDocument data={sampleBom} />
    </div>
  );
}
