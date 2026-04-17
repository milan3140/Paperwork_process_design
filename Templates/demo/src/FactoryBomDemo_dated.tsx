/**
 * FactoryBomDemo Dated — adds an issue-date line under "艾維數位工業".
 *
 * Identical to FactoryBomDemo except it passes `showIssueDateBelowBrand`.
 * The date itself comes from `data.issueDate` (10px thin black) so editing
 * the date is a data change, not a code change.
 */

import { FactoryBomDocument, type FactoryBomData } from '../../components/FactoryBomDocument';
import { DownloadPdfButton } from './DownloadPdfButton';
import { MODEL_SHOT_1 as shot1, MODEL_SHOT_2 as shot2 } from '../../components/_assets';

const thumbs = [shot1, shot2];

const sampleBom: FactoryBomData = {
  orderCode: 'U26033148F',
  orderName: '雷電',
  issueDate: '2026 年 4 月 6 日（一）',
  replyDeadline: '2026 年 4 月 7 日（二）下午 4 點前',
  orderNote: '所有零件需真空包裝出貨，交期以收到材料後起算',
  parts: [
    { partId: 'P01', thumbnail: thumbs[0], dimsMm: { l: 127, w: 89, h: 45 }, weight: 0.34, material: '鋁合金 6061-T6', finish: '黑色陽極氧化', qtyTiers: [1, 5, 10], note: '角度公差要求見圖紙 #3，R角不可大於 0.1mm' },
    { partId: 'P02', variantLabel: 'A', thumbnail: thumbs[1], dimsMm: { l: 88, w: 62, h: 31 }, weight: 1.34, material: '不鏽鋼 304', finish: '標準', qtyTiers: [2, 4, 8] },
    { partId: 'P02', variantLabel: 'B', thumbnail: thumbs[0], dimsMm: { l: 88, w: 62, h: 31 }, weight: 0.48, material: '鋁合金 7075-T6', finish: '透明陽極氧化', qtyTiers: [2, 4, 8] },
    { partId: 'P03', thumbnail: thumbs[1], dimsMm: { l: 65, w: 52, h: 28 }, weight: 0.24, material: 'ZERODUR', finish: '標準', qtyTiers: [1, 3] },
    { partId: 'P04', thumbnail: thumbs[0], dimsMm: { l: 220, w: 180, h: 55 }, weight: 2.18, material: '鋁合金 6061-T6', finish: '標準', qtyTiers: [5, 10, 20] },
    { partId: 'P05', thumbnail: thumbs[1], dimsMm: { l: 35, w: 12, h: 8 }, weight: 0.02, material: '不鏽鋼 316L', finish: '電解拋光', qtyTiers: [5, 10, 50] },
    { partId: 'P05', thumbnail: thumbs[0], dimsMm: { l: 35, w: 12, h: 8 }, weight: 0.02, material: '不鏽鋼 316L', finish: '電解拋光', qtyTiers: [5, 10, 50] },
    { partId: 'P05', thumbnail: thumbs[1], dimsMm: { l: 35, w: 12, h: 8 }, weight: 0.02, material: '不鏽鋼 316L', finish: '電解拋光', qtyTiers: [5, 10, 50] },
    { partId: 'P05', thumbnail: thumbs[0], dimsMm: { l: 35, w: 12, h: 8 }, weight: 0.02, material: '不鏽鋼 316L', finish: '電解拋光', qtyTiers: [5, 10, 50] },
  ],
};

export default function FactoryBomDemoDated() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="Factory-BOM-Dated" />
      <FactoryBomDocument data={sampleBom} showIssueDateBelowBrand />
    </div>
  );
}
