/**
 * SummaryDemo_sharp — Grayscale / high-contrast variant of Summary.
 *
 * Same data + structure as SummaryDemo; only the visual variant flag differs.
 * The variant token overrides (`--s-primary`, `--s-ink`, etc.) and the
 * `headerBg` prop flip the document into pure neutral grayscale:
 *   - Title + header band: 90% black / pure black (no 260° purple hue).
 *   - Font stack tightened for sharper CJK rendering (no JhengHei fallback).
 * PDF pipeline is unchanged — goes through the shared DownloadPdfButton.
 */

import { SummaryDocument, type SummaryData } from '../../components/SummaryDocument';
import { DownloadPdfButton } from './DownloadPdfButton';

const sampleSummary: SummaryData = {
  quoteId: 'U26033148F_REV-1',
  orderName: '噴火槍',
  issued: '2026-04-14',
  pm: 'Malin Ning',

  signatureSlots: ['預習', '預習複查', '質檢', '質檢複查'],

  schedule: [
    { stage: '台灣工廠交貨', date: <span className="s-hi">5 月 6 日 (週三)</span>, note: '下午 4PM 前艾維收到', buffer: '留 2 天質檢緩衝' },
    { stage: '台灣最晚 DHL 出貨', date: '5 月 8 日 (週五)', note: '留 3 天 DHL 運輸' },
    { stage: '美國最終交期', date: '5 月 15 日 (週五)', note: '' },
  ],

  orderSummary: [
    { k: '零件種類及件數', v: <span className="s-hi">3 種零件，共 7 件</span> },
    { k: '材料要求', v: <>{`P01: `}<span className="s-hi">鋁 6061-T6</span>{`,${'\u00A0'.repeat(6)}P02: `}<span className="s-hi">不鏽鋼 304</span>{`,${'\u00A0'.repeat(6)}P03: `}<span className="s-hi">鋁 6061-T6</span></> },
    { k: '公差要求', v: <>參見 PDF；未指定處默認為標準公差 ±.005" / ±.127mm, 12.7 條&nbsp;<span className="s-hi">（含最高 ±0.0127mm 幾何公差）</span></> },
    { k: '表粗要求', v: <>參見 PDF；<span className="s-hi">含最高 Ra 0.4μm (N5) 表粗</span></> },
    { k: '檢測要求', v: '標準檢測' },
    { k: '備註', v: 'P01 須提供英文材料證書' },
  ],

  parts: [
    {
      partId: '噴火槍_P01',
      filename: '260129_RFQ_Assembly.stp',
      dimsMm: '127 × 89 × 45',
      dimsIn: '5.00 × 3.50 × 1.77',
      weight: '342 g',
      qty: 3,
      thumbnail: 1,
      specs: [
        { k: '材質', v: '鋁合金 6061-T6' },
        { k: '表處', v: '陽極氧化 Type II, 黑色' },
        { k: '公差', v: '±0.013mm 幾何公差 (7 處)' },
        { k: '表粗', v: 'Ra 0.8μm (N6), 全面' },
        { k: '螺紋', v: '共 34 處 (4× M6×1.0, 30× M3×0.5)' },
        { k: '護套', v: 'M3×0.5, 2D, SS 18-8' },
        { k: '插件', v: '4× 定位針' },
      ],
      notes: [
        '英文材料證書必附',
        '關鍵幾何公差 ±0.0127mm（見 PDF 標注）',
        '無毛邊 / 油汙 / 顆粒 / 碎片',
      ],
    },
    {
      partId: '噴火槍_P02',
      filename: 'Motor_Housing_v3.stp',
      dimsMm: '88 × 62 × 31',
      dimsIn: '3.46 × 2.44 × 1.22',
      weight: '1,339 g',
      qty: 3,
      thumbnail: 2,
      specs: [
        { k: '材質', v: '不鏽鋼 304' },
        { k: '表處', v: '標準' },
        { k: '公差', v: '±0.05mm' },
        { k: '表粗', v: 'Ra 1.6μm (N7), 全面' },
        { k: '螺紋', v: 'M6 ×4 處' },
      ],
      notes: [
        'M6 螺紋做 gauge 檢驗並拍照備存',
        '陽極處理後不得有色差',
      ],
    },
    {
      partId: '噴火槍_P03',
      filename: '260129_RFQ_1.stp',
      dimsMm: '65 × 52 × 28',
      dimsIn: '2.56 × 2.05 × 1.10',
      weight: '236 g',
      qty: 1,
      thumbnail: 1,
      specs: [
        { k: '材質', v: 'ZERODUR' },
        { k: '表處', v: '蝕刻' },
        { k: '公差', v: '±0.0127mm 幾何公差' },
        { k: '表粗', v: 'Ra 0.4μm (N5)' },
      ],
      notes: [
        '公差含幾何公差',
        '參見 PDF #1: 三個角度要求',
        '參見 PDF #3: 三個面精度 — 只光面要嚴',
      ],
    },
  ],
};

export default function SummaryDemoSharp() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="Summary_Sharp" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Summary · Sharp
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          {sampleSummary.quoteId} · 高對比灰階 · Geist Sans
        </div>
      </div>

      <SummaryDocument data={sampleSummary} variant="sharp" />
    </div>
  );
}
