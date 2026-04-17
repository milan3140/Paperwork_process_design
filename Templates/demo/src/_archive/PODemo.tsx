/**
 * PODemo — Demonstrates 3 PO to Factory variants:
 * 1. 代料加工 (Standard) — factory sources materials
 * 2. 來料加工 (Material Supplied) — InstaVoxel provides materials
 * 3. 轉包 (Multi-Factory) — parts route through multiple factories
 *
 * ⚠️ CRITICAL: No customer information in any PO demo data.
 *    All drawings use _processed suffix. Prices are factory cost only.
 *    Delivery address is InstaVoxel warehouse only.
 */

import { PODocument, type POData } from '../../../components/PODocument';
import { DownloadPdfButton } from '../DownloadPdfButton';

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA — 代料加工 (Standard: Factory Sources Materials)
 * Continues the Acme order lifecycle — but factory sees NONE of
 * Acme's info. Only InstaVoxel internal references.
 *
 * BOM Ref: U26033148F (same orderCode from Factory BOM)
 * ════════════════════════════════════════════════════════════════ */
const sampleStandard: POData = {
  poId: 'PO260530A2F',
  date: '2026 年 5 月 30 日',
  deliveryDate: '2026 年 6 月 20 日',

  bomRef: 'U26033148F',
  orderName: '鋁殼+固定板+墊片',

  buyer: {
    name: 'InstaVoxel, Inc.',
    lines: [
      '台北市大安區忠孝東路二段 100 號',
      '+886-2-2771-0000',
      'engineering@instavoxel.com',
      'LINE: instavoxel_eng',
    ],
  },
  supplier: {
    name: '精密工藝有限公司',
    lines: [
      '新北市三重區中正北路 200 號 3 樓',
      '+886-2-2988-1234',
      'LINE: jingmi_factory',
      '聯繫人：陳廠長',
    ],
  },

  supplyMode: 'standard',
  supplyModeLabel: '代料加工',

  parts: [
    {
      partId: 'P01',
      zhCode: '鋁殼',
      material: '鋁合金 6061-T6',
      finish: '標準',
      quantity: 55,  // 50 + 10% processing allowance
      unitPrice: 12,
      amount: 660,
      drawingRef: 'P01_processed.pdf',
      drawingVersion: 'Rev.C',
    },
    {
      partId: 'P02',
      zhCode: '固定板',
      material: '不鏽鋼 304',
      finish: '電解拋光',
      quantity: 33,  // 30 + 10%
      unitPrice: 35,
      amount: 1155,
      drawingRef: 'P02_processed.pdf',
      drawingVersion: 'Rev.A',
    },
    {
      partId: 'P03',
      zhCode: '墊片',
      material: 'Garolite G11',
      finish: '標準',
      quantity: 110, // 100 + 10%
      unitPrice: 3.5,
      amount: 385,
      drawingRef: 'P03_processed.pdf',
    },
  ],

  subtotal: 2200,
  total: 2200,
  currency: 'NTD',

  qualityNotes: [
    '所有工件加工完成後需立即清潔，成品不可有任何氧化變黑痕跡',
    'P02 電解拋光面需均勻，不可有色差或斑點',
    '螺紋孔需以牙規檢驗（P02 含 4 處螺紋、2 處嵌件）',
  ],
  inspectionLevel: '標準檢驗',
  requiredDocs: [
    '出貨單（含各工件實際數量）',
    '外觀及尺寸檢驗報告',
  ],

  deliveryAddress: 'InstaVoxel 倉庫 — 台北市大安區忠孝東路二段 100 號 B1',
  deliveryContact: '王工程師',
  deliveryPhone: '+886-912-345-678',
  packagingNotes: '各工件獨立包裝，防撞防潮。P02 拋光面需額外保護膜。',

  notes: [
    '嚴禁將本採購單及附件圖面轉交任何第三方',
    '如有加工疑問請聯繫 InstaVoxel 工程師，切勿自行變更規格',
    '數量含 10% 加工餘量，最終出貨數量以本單所列為準',
    '交貨延遲請提前 3 個工作天通知',
  ],

  termsText:
    '1. 本採購單經供應商簽章確認後生效，構成雙方之買賣合約。' +
    '2. 供應商應按附件圖面及本單規格進行製造，不得擅自替代材料或變更製程。' +
    '3. 交貨時間以本單所列日期為準，延遲交貨可能影響後續排程。' +
    '4. 驗收標準依附件圖面公差要求，不合格品由供應商負責重工或補件。' +
    '5. 本採購單及附件圖面屬商業機密，供應商不得用於其他訂單或透露予第三方。' +
    '6. 付款條件：交貨驗收合格後 30 天內付款。',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA — 來料加工 (Material Supplied by InstaVoxel)
 * InstaVoxel sources titanium and ships to factory for processing.
 * ════════════════════════════════════════════════════════════════ */
const sampleMaterialSupplied: POData = {
  poId: 'PO260601B8C',
  date: '2026 年 6 月 1 日',
  deliveryDate: '2026 年 6 月 25 日',

  bomRef: 'T26040155A',
  orderName: '鈦合金感測器座',

  buyer: {
    name: 'InstaVoxel, Inc.',
    lines: [
      '台北市大安區忠孝東路二段 100 號',
      '+886-2-2771-0000',
      'engineering@instavoxel.com',
    ],
  },
  supplier: {
    name: '宏達精機股份有限公司',
    lines: [
      '台中市西屯區工業區一路 88 號',
      '+886-4-2359-7890',
      'LINE: hongda_cnc',
      '聯繫人：林主任',
    ],
  },

  supplyMode: 'material-supplied',
  supplyModeLabel: '來料加工',

  parts: [
    {
      partId: 'P01',
      zhCode: '感測座',
      material: '鈦合金 Grade 5 (Ti-6Al-4V)',
      finish: '鈍化處理',
      quantity: 10,  // 8 + 25% (titanium is expensive, smaller allowance)
      unitPrice: 85,
      amount: 850,
      drawingRef: 'P01_processed.pdf',
      drawingVersion: 'Rev.B',
      note: '精度要求 ±0.025mm，需 CMM 檢驗',
    },
  ],

  subtotal: 850,
  total: 850,
  currency: 'NTD',

  materialSupply: {
    materialName: '鈦合金 Grade 5 圓棒 Φ55×20mm',
    supplier: 'InstaVoxel 自行採購（材料已備妥）',
    batchNumber: 'TI-2026-0531-A',
    expectedArrival: '2026 年 6 月 3 日（由我方快遞送達）',
    storageNotes: '鈦合金存放需避免與鐵質接觸，防止汙染',
  },

  qualityNotes: [
    '精度要求 ±0.025mm，關鍵尺寸需 CMM 量測報告',
    '鈍化處理需均勻，表面不可有刮痕或變色',
    '4 處 M3×0.5-6H 螺紋需以牙規逐一檢驗',
    '加工過程中嚴禁使用含氯切削液（鈦合金禁忌）',
  ],
  inspectionLevel: 'CMM + FAI（首件檢驗）',
  requiredDocs: [
    '出貨單',
    'CMM 量測報告（含關鍵尺寸）',
    '首件檢驗報告（FAI）',
  ],

  deliveryAddress: 'InstaVoxel 倉庫 — 台北市大安區忠孝東路二段 100 號 B1',
  deliveryContact: '王工程師',
  deliveryPhone: '+886-912-345-678',
  packagingNotes: '每件獨立真空包裝，附防潮劑。嚴禁堆疊。',

  notes: [
    '嚴禁將本採購單及附件圖面轉交任何第三方',
    '來料由我方提供，收料時請確認材料規格及數量無誤後再開工',
    '加工廢料請保留並隨成品一併退還（鈦合金回收）',
    '如有加工疑問請聯繫 InstaVoxel 工程師',
  ],

  termsText:
    '1. 本採購單經供應商簽章確認後生效。' +
    '2. 來料由買方提供，供應商負責加工品質，材料瑕疵由買方負責。' +
    '3. 供應商應妥善保管來料，如因加工不當導致材料報廢，由供應商負擔材料成本。' +
    '4. 驗收標準依附件圖面及 CMM 量測報告。' +
    '5. 本採購單及附件圖面屬商業機密。' +
    '6. 付款條件：交貨驗收合格後 15 天內付款。',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO DATA — 轉包 (Multi-Factory Subcontracting)
 * Part routes: CNC加工 → 刻字 → 陽極氧化 → InstaVoxel
 * ════════════════════════════════════════════════════════════════ */
const sampleMultiFactory: POData = {
  poId: 'PO260605C3D',
  date: '2026 年 6 月 5 日',
  deliveryDate: '2026 年 7 月 5 日',

  bomRef: 'U26050288E',
  orderName: '刻字陽極外殼',

  buyer: {
    name: 'InstaVoxel, Inc.',
    lines: [
      '台北市大安區忠孝東路二段 100 號',
      '+886-2-2771-0000',
      'engineering@instavoxel.com',
    ],
  },
  supplier: {
    name: '精密工藝有限公司',
    lines: [
      '新北市三重區中正北路 200 號 3 樓',
      '+886-2-2988-1234',
      '聯繫人：陳廠長',
    ],
  },

  supplyMode: 'multi-factory',
  supplyModeLabel: '轉包（多廠協作）',

  parts: [
    {
      partId: 'P01',
      zhCode: '外殼',
      material: '鋁合金 6061-T6',
      finish: '黑色陽極氧化 + 雷射刻字',
      quantity: 55,
      unitPrice: 28,
      amount: 1540,
      drawingRef: 'P01_processed.pdf',
      drawingVersion: 'Rev.D',
    },
  ],

  subtotal: 1540,
  total: 1540,
  currency: 'NTD',

  processingRoute: [
    {
      step: 1,
      process: 'CNC 加工',
      factoryName: '精密工藝有限公司',
      factoryContact: '陳廠長 +886-2-2988-1234',
      deliverTo: '文字工坊（刻字工廠）',
    },
    {
      step: 2,
      process: '雷射刻字',
      factoryName: '文字工坊',
      factoryContact: '張師傅 +886-2-2255-6789',
      deliverTo: '彩虹陽極有限公司（陽極工廠）',
    },
    {
      step: 3,
      process: '黑色陽極氧化',
      factoryName: '彩虹陽極有限公司',
      factoryContact: '李經理 +886-3-4567-8901',
      deliverTo: 'InstaVoxel 倉庫',
    },
  ],

  qualityNotes: [
    '第一道（CNC）：尺寸依圖面公差，表面無刀痕',
    '第二道（刻字）：刻字位置及內容依圖面標示，深度 0.1±0.02mm',
    '第三道（陽極）：黑色陽極氧化膜厚 15-25μm，色澤均勻無色差',
    '各廠加工完成後需自主檢驗，附檢驗記錄隨件轉送',
  ],
  inspectionLevel: '各站自主檢驗 + 最終外觀全檢',
  requiredDocs: [
    '各站加工檢驗記錄',
    '最終外觀檢驗報告',
    '陽極氧化膜厚測試報告',
  ],

  deliveryAddress: 'InstaVoxel 倉庫 — 台北市大安區忠孝東路二段 100 號 B1',
  deliveryContact: '王工程師',
  deliveryPhone: '+886-912-345-678',
  packagingNotes: '陽極氧化後需立即包裝保護，避免碰撞刮傷。每件獨立 PE 袋。',

  notes: [
    '嚴禁將本採購單及附件圖面轉交製程路線以外之第三方',
    '各廠轉送時需確認文件齊全（圖面 + 本 PO + 前站檢驗記錄）',
    '如任何一站發現品質問題，請立即聯繫 InstaVoxel 工程師，暫停後續製程',
    '最終交貨以陽極工廠出貨日為準',
  ],

  termsText:
    '1. 本採購單經首站供應商簽章確認後生效，適用於全部製程站別。' +
    '2. 各站供應商應按本單及附件圖面進行加工，不得擅自變更製程或材料。' +
    '3. 各站間之運輸由首站供應商統籌安排，運輸風險由運輸方承擔。' +
    '4. 最終驗收以 InstaVoxel 收貨檢驗為準。' +
    '5. 本採購單及附件圖面屬商業機密。' +
    '6. 付款條件：最終驗收合格後 30 天內付款予首站供應商（由首站統一結算）。',
};

/* ════════════════════════════════════════════════════════════════
 * DEMO PAGE
 * ════════════════════════════════════════════════════════════════ */
export default function PODemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="PO" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Purchase Order
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          3 variants: Standard · Material Supplied · Multi-Factory
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
        <PODocument data={sampleStandard} />
        <PODocument data={sampleMaterialSupplied} />
        <PODocument data={sampleMultiFactory} />
      </div>
    </div>
  );
}
