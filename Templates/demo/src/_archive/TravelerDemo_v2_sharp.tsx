/**
 * TravelerDemo v2 Sharp — 高對比銳利版
 *
 * 相對 v2 的差異（純外觀變體，不 fork Document）：
 *   · --color-primary → 90% 黑 (#1A1A1A)：HeaderBand、標題「工作單」、副標皆轉為深黑
 *   · --gray-*        → 去除 hue 260 紫色調，改為中性純灰
 *   · --font          → Geist 幾何無襯線堆疊，字形更銳利
 *   · --color-error   保持紅色 — 交期/警示語意照舊
 *
 * 機制：以 data-theme="sharp" wrapper div 注入 CSS 自定屬性，
 * TravelerDocumentV2 內部所有 var(--color-primary) / var(--gray-*) /
 * var(--font) 參照都會被這層覆寫。PDF 擷取經由 findThemeAncestor()
 * 保留 --* 客製屬性，無需動到 pdf-server。
 */

import type { CSSProperties } from 'react';
import { TravelerDocumentV2, type TravelerData } from '../../../components/TravelerDocument_v2';
import { DownloadPdfButton } from '../DownloadPdfButton';
import { MODEL_SHOT_1 as thumbUrl } from '../../../components/_assets';

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
    drawingFile: 'U26033148F_P01.PDF',
    thumbnail: thumbUrl,
    dims: '482 × 55 × 26 mm',
    unitWeight: '2.58 kg',
  },

  features: [
    { tag: '螺紋 / 攻牙', value: '3 處' },
    { tag: '公差',       value: '±0.0127 mm（3 處關鍵點位，依 GD&T 標註）' },
    { tag: '表面粗糙度', value: '3.2 μm Ra (N8)，全件' },
    { tag: '工件標記',   value: 'Bag & Tag · 逐件貼 Customer PN「26033148F」' },
  ],

  notes:
    '需提供英文 S15C 材料證明書隨貨寄出。\n' +
    '若圖紙與 3D 模型有衝突，請於開工前聯絡 pm@instavoxel.com 確認。\n' +
    '逐件以夾鏈袋獨立包裝並貼標籤；內箱 ≤ 20 kg，外箱 ≤ 25 kg。',
};

const sharpTheme: CSSProperties = {
  // Primary — 90% 黑
  ['--color-primary' as any]: '#1A1A1A',
  ['--color-primary-hover' as any]: '#000000',
  ['--color-primary-light' as any]: '#333333',
  ['--color-primary-dark' as any]: '#000000',

  // Header — 只保留下底線的反白版
  ['--doc-header-bg' as any]: 'transparent',
  ['--doc-header-fg' as any]: '#1A1A1A',
  ['--doc-header-border' as any]: '1px solid #1A1A1A',

  // Gray scale — 去除 hue 260 紫調，改為中性灰
  ['--gray-950' as any]: '#0A0A0A',
  ['--gray-900' as any]: '#1A1A1A',
  ['--gray-800' as any]: '#2B2B2B',
  ['--gray-700' as any]: '#3D3D3D',
  ['--gray-600' as any]: '#565656',
  ['--gray-500' as any]: '#6B6B6B',
  ['--gray-400' as any]: '#8E8E8E',
  ['--gray-300' as any]: '#B5B5B5',
  ['--gray-250' as any]: '#C8C8C8',
  ['--gray-200' as any]: '#D8D8D8',
  ['--gray-175' as any]: '#E8E8E8',
  ['--gray-160' as any]: '#F5F5F5',
  ['--gray-150' as any]: '#E4E4E4',
  ['--gray-100' as any]: '#EDEDED',
  ['--gray-75' as any]: '#F2F2F2',
  ['--gray-60' as any]: '#F5F5F5',
  ['--gray-50' as any]: '#F7F7F7',

  // 銳利字體堆疊
  ['--font' as any]: '"Geist", "Inter", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamily: '"Geist", "Inter", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif',
};

export default function TravelerDemoV2Sharp() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <div data-theme="sharp" style={sharpTheme}>
        <DownloadPdfButton filename="Traveler-v2-Sharp" />
      </div>

      <div data-theme="sharp" style={sharpTheme}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-4)' }}>
          <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest" style={{ color: '#8E8E8E' }}>
            工作單 v2 · SHARP
          </div>
          <div className="text-[length:var(--text-xs)] mt-1" style={{ color: '#8E8E8E' }}>
            {sampleTraveler.travelerId}_REV-{sampleTraveler.revision} · 共 1 件
          </div>
        </div>

        <TravelerDocumentV2 data={sampleTraveler} />
      </div>
    </div>
  );
}
