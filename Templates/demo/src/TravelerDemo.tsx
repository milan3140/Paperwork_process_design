/**
 * TravelerDemo — 工作單預覽（中文版，使用專案通用表頭）
 */

import { TravelerDocument, type TravelerData } from '../../components/TravelerDocument';
import { DownloadPdfButton } from './DownloadPdfButton';

const sampleTraveler: TravelerData = {
  travelerId: 'U26033148F',
  revision: 'A',
  issueDate: '2025-12-03',
  dueDate: '2025-12-31',

  poNumber: 'PO-26033148F-01',
  contactEmail: 'pm@instavoxel.com',

  totalQty: 1,
  inspectionLevel: '正式檢測 · 附英文尺寸報告',
  certifications: '英文材料證明 · CoC',

  material: '低碳鋼 S15C',
  finish: '原色 / 無',

  part: {
    partId: 'U26033148F_P01',
    fileName: '05-B-006.step',
    drawingRev: 'A',
    dims: '482 × 55 × 26 mm',
    unitWeight: '2.58 kg',
  },

  features: [
    { tag: '螺紋 / 攻牙', value: '3 處' },
    { tag: '公差',       value: '±0.0127 mm（3 處關鍵點位，依 GD&T 標註）' },
    { tag: '表面粗糙度', value: '3.2 μm Ra (N8)，全件' },
    { tag: '工件標記',   value: 'Bag & Tag · 逐件貼 Customer PN「26033148F」' },
  ],

  // 備註 — 使用者自由填寫（此處放 demo placeholder）
  notes:
    '需提供英文 S15C 材料證明書隨貨寄出。\n' +
    '若圖紙與 3D 模型有衝突，請於開工前聯絡 pm@instavoxel.com 確認。\n' +
    '逐件以夾鏈袋獨立包裝並貼標籤；內箱 ≤ 20 kg，外箱 ≤ 25 kg。',
};

export default function TravelerDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="Traveler" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          工作單
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          {sampleTraveler.travelerId}_REV-{sampleTraveler.revision} · 共 1 件
        </div>
      </div>

      <TravelerDocument data={sampleTraveler} />
    </div>
  );
}
