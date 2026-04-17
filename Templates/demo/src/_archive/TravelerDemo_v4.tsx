/**
 * TravelerDemo v4 — 工廠動線優先版預覽
 */

import { TravelerDocumentV4, type TravelerData } from '../../../components/TravelerDocument_v4';
import { DownloadPdfButton } from '../DownloadPdfButton';
import { MODEL_SHOT_1 as thumbUrl } from '../../../components/_assets';

const sampleTraveler: TravelerData = {
  travelerId: 'U26033148F',
  revision: '1',
  issueDate: '2025-12-03',
  dueDate: '2025-12-31',

  poNumber: 'PO-26033148F-01',
  contactEmail: 'pm@instavoxel.com',

  totalQty: 1,
  inspectionLevel: '正式檢測 · 附英文尺寸報告',
  certifications: '需檢附材料證明',

  material: '低碳鋼 S15C',
  finish: '原色 / 無',

  part: {
    partId: 'U26033148F_P01',
    fileName: 'U26033148F_P01.step',
    drawingFile: 'U26033148F_P01.PDF',
    thumbnail: thumbUrl,
    dims: '482 × 55 × 26 mm',
    unitWeight: '2.58 kg',
  },

  features: [
    { tag: '螺紋 / 攻牙', value: '3 處' },
    { tag: '公差',       value: '參見 PDF，含最高 ±0.0127 mm 幾何公差' },
    { tag: '表面粗糙度', value: '3.2 μm Ra (N8)，全件' },
    { tag: '工件標記',   value: 'Bag & Tag · 逐件標記「26033148F」' },
  ],

  notes:
    '需提供英文 S15C 材料證明書隨貨寄出。\n' +
    '若圖紙與 3D 模型有衝突，請於開工前聯絡 pm@instavoxel.com 確認。',
};

export default function TravelerDemoV4() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="Traveler-v4" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          工作單 v4
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          {sampleTraveler.travelerId}_REV-{sampleTraveler.revision} · 共 1 件 · 工廠動線優先版
        </div>
      </div>

      <TravelerDocumentV4 data={sampleTraveler} />
    </div>
  );
}
