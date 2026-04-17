import { DownloadPdfButton } from '../DownloadPdfButton';
import { EvalDocumentV2, type EvalV2Data } from '../../../components/EvalDocumentV2';

/** Mode A demo: Fixed material (6061-T6), 3 quantity tiers, 5 factories */
export const modeA: EvalV2Data = {
  orderId: 'Q1215264U_支架01',
  revision: '02',
  date: '2026-03-19',
  isQuoted: false,

  quoteInfo: {
    deadline: '3月25日（週二）晚上4PM前',
    orderDate: '3月26日',
    milestones: [
      { label: '工廠交期', date: '4月15日 （二）', note: '留12天質檢緩衝' },
      { label: '台灣寄出', date: '4月28日 （一）', note: '留3天DHL運輸' },
      { label: '美國到貨', date: '5月1日 （四）', note: '' },
    ],
    partTypes: 2,
    totalParts: 200,
    specs: [
      { label: '材料要求', value: 'Aluminum 6061-T6 (請提供英文材料證書)' },
      { label: '表面處理', value: '無' },
      { label: '公差要求', value: '參見PDF。未指定處默認 ±.005" (±0.127mm)' },
      { label: '表粗要求', value: '標準表粗 125uin / 3.2um Ra (N8)' },
      { label: '檢測要求', value: '標準檢測' },
    ],
    parts: [
      {
        id: '1215264U_P01',
        quantity: 200,
        requirements: [
          '含8處螺紋 (8處M4×0.7 -6H)',
          '所有邊緣均需倒角去毛邊 0.2mm',
          '零件應無毛邊和銳邊且無油汙、顆粒及碎片',
        ],
      },
      {
        id: '1215264U_P02',
        quantity: 200,
        requirements: [
          '含4處螺紋 (4處M3×0.5 -6H)',
          '內凹階差處會有 R0.3-0.5mm 圓角',
          '所有邊緣均需倒角去毛邊 0.2mm',
        ],
      },
    ],
    otherRequirements: [
      '小於305mm尺寸，若圖紙無明確公差，適用默認標準公差 ±12.7條',
      '螺紋默認標準 2A/2B（美規）或 6g/6H（公規）',
      '去毛邊 0.25-0.75mm（R角或C角皆可），成品不可割手',
      '加工完成後立即清潔，不可有氧化變黑痕跡',
    ],
  },

  quoteEval: {
    scenarios: [
      { header: '100 pcs' },
      { header: '200 pcs', recommended: true },
      { header: '500 pcs' },
    ],
    aiBenchmarks: [
      { label: 'P01', cells: [62.00, 55.00, 47.00] },
      { label: 'P02', cells: [52.00, 47.00, 41.00] },
    ],
    factories: [
      {
        name: '鑫源',
        parts: [
          { label: 'P01', cells: [{ price: 42.00, days: 12 }, { price: 35.00, days: 18 }, { price: 28.50, days: 25 }] },
          { label: 'P02', cells: [{ price: 38.00, days: 12 }, { price: 31.00, days: 18 }, { price: 25.00, days: 25 }] },
        ],
      },
      {
        name: '嘉承',
        parts: [
          { label: 'P01', cells: [{ price: 45.00, days: 14 }, { price: 38.00, days: 22 }, { price: 31.00, days: 30 }] },
          { label: 'P02', cells: [{ price: 40.00, days: 14 }, { price: 33.50, days: 22 }, { price: 27.00, days: 30 }] },
        ],
      },
      {
        name: '禾登',
        parts: [
          { label: 'P01', cells: [{ price: 48.00, days: 16 }, { price: 40.00, days: 24 }, { price: 33.00, days: 35 }] },
          { label: 'P02', cells: [{ price: 43.00, days: 16 }, { price: 36.00, days: 24 }, { price: 29.50, days: 35 }] },
        ],
      },
      {
        name: '廣昇',
        parts: [
          { label: 'P01', cells: [{ price: null, days: null, text: '拒絕報價' }, { price: null, days: null, text: '拒絕報價' }, { price: null, days: null, text: '拒絕報價' }] },
          { label: 'P02', cells: [{ price: null, days: null, text: '拒絕報價' }, { price: null, days: null, text: '拒絕報價' }, { price: null, days: null, text: '拒絕報價' }] },
        ],
      },
      {
        name: '理泰',
        parts: [
          { label: 'P01', cells: [{ price: 44.00, days: 13 }, { price: 37.00, days: 20 }, { price: 30.00, days: 28 }] },
          { label: 'P02', cells: [{ price: 39.00, days: 13 }, { price: 32.50, days: 20 }, { price: 26.50, days: 28 }] },
        ],
      },
    ],
    dhl: { values: [12.00, 9.00, 6.50] },
    customs: { values: [0.55, 0.45, 0.35] },
    marginPercent: 18,
    weights: { values: ['255×225×35 / 86kg', '255×225×35 / 172kg', '255×225×35 / 430kg'] },
  },

  leadTime: {
    rows: [
      { phase: '代料加工', days: 17, note: '鑫源' },
      { phase: '質檢緩衝', days: 2 },
      { phase: 'DHL', days: 3, note: 'Express' },
    ],
    totalDays: 22,
    estimatedDelivery: '2026-04-21 （二）',
    deliveryNote: '已排除週末與假日',
  },

  techFeasibility: {
    matrix: [
      { criterion: '材料可加工性', requirement: 'Aluminum 6061-T6', capability: 'CNC 可加工' },
      { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
      { criterion: '表面粗糙度', requirement: 'Ra 3.2μm (N8)', capability: '標準' },
      { criterion: '幾何複雜度', requirement: '中等（凹槽+孔）', capability: '標準 3 軸' },
      { criterion: '螺紋', requirement: 'M4×0.7 ×8處 + M3×0.5 ×4處', capability: '庫存牙規 ✓ (TD-2006 已確認)' },
      { criterion: '特殊製程', requirement: '無', capability: 'N/A' },
    ],
    blockers: null,
    solutions: null,
    note: '標準 CNC 加工，所有要求可達到。M4 和 M3 牙規庫存充足。',
  },

  factories: [
    {
      name: '鑫源金屬',
      status: 'quoted',
      expectedReplyDate: '—',
      pricing: {
        scenarios: ['100 pcs', '200 pcs', '500 pcs'],
        rows: [
          { material: 'P01', values: ['$42.00/12d', '$35.00/18d', '$28.50/25d'] },
          { material: 'P02', values: ['$38.00/12d', '$31.00/18d', '$25.00/25d'] },
        ],
      },
      capability: [
        { criterion: '材料可加工性', requirement: '6061-T6', capability: '可加工' },
        { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
        { criterion: '表面粗糙度', requirement: 'Ra 3.2μm', capability: '標準' },
        { criterion: '螺紋', requirement: 'M4×0.7 / M3×0.5', capability: '庫存牙規' },
      ],
      note: '合作多次，品質穩定，交期準確。200件以上有額外折扣空間。',
    },
    {
      name: '嘉承精密',
      status: 'quoted',
      expectedReplyDate: '—',
      pricing: {
        scenarios: ['100 pcs', '200 pcs', '500 pcs'],
        rows: [
          { material: 'P01', values: ['$45.00/14d', '$38.00/22d', '$31.00/30d'] },
          { material: 'P02', values: ['$40.00/14d', '$33.50/22d', '$27.00/30d'] },
        ],
      },
      capability: [
        { criterion: '材料可加工性', requirement: '6061-T6', capability: '可加工' },
        { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
        { criterion: '螺紋', requirement: 'M4×0.7 / M3×0.5', capability: '庫存牙規' },
      ],
      note: '報價略高於鑫源，交期較長。品質穩定但排程較滿。',
    },
    {
      name: '禾登精密',
      status: 'quoted',
      expectedReplyDate: '—',
      pricing: {
        scenarios: ['100 pcs', '200 pcs', '500 pcs'],
        rows: [
          { material: 'P01', values: ['$48.00/16d', '$40.00/24d', '$33.00/35d'] },
          { material: 'P02', values: ['$43.00/16d', '$36.00/24d', '$29.50/35d'] },
        ],
      },
      capability: [
        { criterion: '材料可加工性', requirement: '6061-T6', capability: '可加工' },
        { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
      ],
      note: '報價最高，交期最長。適合作為備案。',
    },
    {
      name: '廣昇五金',
      status: 'declined',
      statusDetail: '產能',
      note: '目前產能滿載，無法承接新訂單。',
    },
    {
      name: '理泰精密',
      status: 'quoted',
      expectedReplyDate: '3月22日 （六）',
      pricing: {
        scenarios: ['100 pcs', '200 pcs', '500 pcs'],
        rows: [
          { material: 'P01', values: ['$44.00/13d', '$37.00/20d', '$30.00/28d'] },
          { material: 'P02', values: ['$39.00/13d', '$32.50/20d', '$26.50/28d'] },
        ],
      },
      capability: [
        { criterion: '材料可加工性', requirement: '6061-T6', capability: '可加工' },
        { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
        { criterion: '螺紋', requirement: 'M4×0.7 / M3×0.5', capability: '庫存牙規' },
      ],
      note: '首次合作，報價有競爭力。P02 內凹處表示 R0.3-0.5mm 圓角無法避免。待確認 CMM 量測能力。',
    },
  ],

  revisions: [
    { rev: '01', date: '2026-03-15', author: 'Sylvia', description: '初始建單' },
    { rev: '02', date: '2026-03-19', author: 'Paul', description: '工廠詢價完成 + 技術分析' },
  ],
};

/* ══════════════════════════════════════════════════════════════
   Mode A with BLOCKERS — MACOR ceramic case (Zerodur-like)
   ══════════════════════════════════════════════════════════════ */

export const modeABlockers: EvalV2Data = {
  orderId: 'Q1189261U_陶瓷環01',
  revision: '01',
  date: '2026-03-20',
  isQuoted: false,

  quoteInfo: {
    deadline: '3月25日（週二）晚上4PM前',
    orderDate: '3月26日',
    milestones: [
      { label: '工廠交期', date: '5月5日 （一）', note: '留12天質檢緩衝' },
      { label: '台灣寄出', date: '5月19日 （一）', note: '留3天DHL運輸' },
      { label: '美國到貨', date: '5月22日 （四）', note: '' },
    ],
    partTypes: 1,
    totalParts: 4,
    specs: [
      { label: '材料要求', value: 'MACOR (請提供材料證書)' },
      { label: '表面處理', value: '無' },
      { label: '公差要求', value: '參見PDF。未指定處默認 ±.005" (±0.127mm)' },
      { label: '表粗要求', value: '標準表粗 125uin / 3.2um Ra (N8)' },
      { label: '檢測要求', value: '標準檢測' },
    ],
    parts: [
      {
        id: '1189261U_P01',
        quantity: 4,
        requirements: [
          '含深孔 ⌀6×85mm',
          '所有邊緣均需倒角',
          '零件應無毛邊和銳邊且無油汙、顆粒及碎片',
        ],
      },
    ],
    otherRequirements: [
      '小於305mm尺寸，若圖紙無明確公差，適用默認標準公差 ±12.7條',
      '螺紋默認標準 2A/2B（美規）或 6g/6H（公規）',
      '去毛邊 0.25-0.75mm，成品不可割手',
      '加工完成後立即清潔，不可有氧化變黑痕跡',
    ],
  },

  quoteEval: {
    scenarios: [{ header: '4 pcs' }],
    aiBenchmarks: [
      { label: 'P01', cells: [null] }, // MACOR not available on AI platforms
    ],
    nextUpdateDate: '3月26日 （二） 中午前',
    factories: [
      {
        name: '鑫源',
        parts: [
          { label: 'P01', cells: [{ price: null, days: null, text: '評估中' }] },
        ],
      },
      {
        name: '裕群光電',
        parts: [
          { label: 'P01', cells: [{ price: null, days: null, text: '拒絕報價' }] },
        ],
      },
      {
        name: '廣昇',
        parts: [
          { label: 'P01(氧化鋁99%)', cells: [{ price: 1225.81, days: 30 }] },
        ],
      },
    ],
    dhl: { values: [72.54] },
    customs: { values: [3.60] },
    marginPercent: 18,
    weights: { values: ['85×60×60 / 0.85kg'] },
  },

  leadTime: {
    rows: [
      { phase: '代料加工', days: 40, note: '廣昇（氧化鋁方案）' },
      { phase: '質檢緩衝', days: 5 },
      { phase: 'DHL', days: 3, note: 'Express' },
    ],
    totalDays: 48,
    estimatedDelivery: '2026-05-22 （四）',
    deliveryNote: '已排除週末與假日',
  },

  techFeasibility: {
    nextUpdateDate: '3月26日 （二） 中午前',
    matrix: [
      { criterion: '材料可加工性', requirement: 'MACOR', capability: '不可加工 — 深孔易震裂', cannotAchieve: true },
      { criterion: '公差', requirement: '±0.05mm', capability: '可達到（氧化鋁方案）' },
      { criterion: '表面粗糙度', requirement: 'Ra 3.2μm', capability: '標準' },
      { criterion: '幾何複雜度', requirement: '深孔 ⌀6×85mm', capability: '不可達到 — 棒材鑽削', cannotAchieve: true },
      { criterion: '螺紋', requirement: '無', capability: 'N/A' },
      { criterion: '特殊製程', requirement: '無', capability: 'N/A' },
    ],
    blockers: {
      items: ['材料 MACOR', '深孔加工'],
      reason: '主要難度在於深孔加工。此材料 (MACOR 可加工陶瓷) 無法開模燒結成型，市售棒材加工深孔易震裂與碎裂，詢問的工廠都沒把握達成。後續請工廠評估報價替代材料。',
    },
    solutions: {
      materials: ['氧化鋁 99% (Al₂O₃)', '氮化硼 (BN)'],
      details: [
        {
          name: '氧化鋁 99%',
          description: '客戶原始需求為 MACOR，但因深孔加工風險過高，建議改用氧化鋁 99%。此材料可透過中空模具壓製燒結成型後精修，避免實心棒材深孔鑽削。鑫源目前正在評估此方案的可行性。',
          pros: ['耐溫 1700°C vs MACOR 1000°C', '介電強度更高', '成型後精修比實心加工風險低得多'],
          cons: ['無法用標準刀具加工', '需要金剛石磨削', '模具需重開若設計變更'],
        },
        {
          name: '氮化硼 (BN)',
          description: '作為備案方案。BN 可加工性優於氧化鋁，接近 MACOR，但耐溫和介電性能介於兩者之間。尚未詢價。',
        },
      ],
    },
    note: '目前等待鑫源回覆氧化鋁 99% 方案的可行性及報價。若鑫源方案不可行，將轉向評估氮化硼方案。',
  },

  factories: [
    {
      name: '鑫源金屬',
      status: 'pending',
      expectedReplyDate: '3月26日 （二） 中午前',
      capability: [
        { criterion: '材料可加工性', requirement: 'MACOR', capability: '⊘ 不可加工' },
        { criterion: '材料可加工性', requirement: '氧化鋁 99%', capability: '評估中' },
        { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
      ],
      blockers: { items: ['MACOR'], reason: 'MACOR 加工容易崩角或斷裂。' },
      solutions: { description: '正在評估利用中空模具將內外圓直接壓製燒結成型後精修。預計明日中午前給氧化鋁 99% 方案的可行性及報價。' },
      note: '建議評估氧化鋁 99%，可行性較高。',
    },
    {
      name: '裕群光電',
      status: 'declined',
      statusDetail: '技術',
      note: '評估後無法達到圖面精度要求。即使放寬公差製作上難度也很高，不願意花時間跟心力在這上面。',
    },
    {
      name: '廣昇陶瓷',
      status: 'quoted',
      expectedReplyDate: '—',
      pricing: {
        scenarios: ['4 pcs'],
        rows: [
          { material: 'P01(氧化鋁99%)', values: ['$1,225.81/30d'] },
        ],
      },
      capability: [
        { criterion: '材料可加工性', requirement: '氧化鋁 99%', capability: '可加工' },
        { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
        { criterion: '幾何複雜度', requirement: '深孔 ⌀6×85mm', capability: '中空模具成型後精修' },
      ],
      note: '氧化鋁方案，使用中空模具壓製燒結+精修。交期 30 工作天。含工帶料。',
    },
  ],

  revisions: [
    { rev: '01', date: '2026-03-20', author: 'Paul', description: '初始建單 + 工廠詢價 + 技術分析（MACOR 不可行，轉氧化鋁方案）' },
  ],
};

/* ══════════════════════════════════════════════════════════════
   Mode C — Qty × Material cross (2 materials × 3 quantities)
   ══════════════════════════════════════════════════════════════ */

export const modeC: EvalV2Data = {
  orderId: 'Q1220266U_連接器殼01',
  revision: '02',
  date: '2026-03-19',
  isQuoted: true,

  quoteInfo: {
    deadline: '3月22日（週六）晚上4PM前',
    orderDate: '3月24日',
    milestones: [
      { label: '工廠交期', date: '4月20日 （日）', note: '留10天質檢緩衝' },
      { label: '台灣寄出', date: '5月2日 （五）', note: '留3天DHL運輸' },
      { label: '美國到貨', date: '5月7日 （三）', note: '' },
    ],
    partTypes: 2,
    totalParts: 200,
    specs: [
      { label: '材料要求', value: '客戶詢問 6061-T6 與 PEEK 兩種方案' },
      { label: '表面處理', value: '6061: 無色陽極 | PEEK: 無' },
      { label: '公差要求', value: '參見PDF。未指定處默認 ±.005"' },
      { label: '表粗要求', value: '標準表粗' },
      { label: '檢測要求', value: '標準檢測' },
    ],
    parts: [
      { id: '1220266U_P01', quantity: 200, requirements: ['含4處螺紋 (M3×0.5 -6H)', '所有邊緣去毛邊'] },
      { id: '1220266U_P02', quantity: 200, requirements: ['含2處螺紋 (M4×0.7 -6H)', '內凹處 R0.3mm 圓角'] },
    ],
    otherRequirements: [
      '小於305mm尺寸，若無明確公差，適用默認 ±12.7條',
      '去毛邊 0.25-0.75mm，成品不可割手',
    ],
  },

  quoteEval: {
    scenarios: [
      { header: '100 pcs' },
      { header: '200 pcs' },
      { header: '500 pcs' },
    ],
    aiBenchmarks: [
      { label: 'P01(6061)', cells: [62.00, 55.00, 47.00] },
      { label: 'P01(PEEK)', cells: [120.00, 105.00, 90.00] },
      { label: 'P02(6061)', cells: [52.00, 47.00, 41.00] },
      { label: 'P02(PEEK)', cells: [110.00, 96.00, 82.00] },
    ],
    factories: [
      {
        name: '鑫源',
        parts: [
          { label: 'P01(6061)', cells: [{ price: 42.00, days: 12 }, { price: 35.00, days: 18 }, { price: 28.50, days: 25 }] },
          { label: 'P01(PEEK)', cells: [{ price: 85.00, days: 18 }, { price: 72.00, days: 25 }, { price: 60.00, days: 35 }] },
          { label: 'P02(6061)', cells: [{ price: 38.00, days: 12 }, { price: 31.00, days: 18 }, { price: 25.00, days: 25 }] },
          { label: 'P02(PEEK)', cells: [{ price: 78.00, days: 18 }, { price: 65.00, days: 25 }, { price: 54.00, days: 35 }] },
        ],
      },
      {
        name: '嘉承',
        parts: [
          { label: 'P01(6061)', cells: [{ price: 45.00, days: 14 }, { price: 38.00, days: 22 }, { price: 31.00, days: 30 }] },
          { label: 'P01(PEEK)', cells: [{ price: null, days: null, text: '無法報價' }, { price: null, days: null, text: '無法報價' }, { price: null, days: null, text: '無法報價' }] },
          { label: 'P02(6061)', cells: [{ price: 40.00, days: 14 }, { price: 33.50, days: 22 }, { price: 27.00, days: 30 }] },
          { label: 'P02(PEEK)', cells: [{ price: null, days: null, text: '拒絕報價' }, { price: null, days: null, text: '拒絕報價' }, { price: null, days: null, text: '拒絕報價' }] },
        ],
      },
      {
        name: '理泰',
        parts: [
          { label: 'P01(6061)', cells: [{ price: 44.00, days: 13 }, { price: 37.00, days: 20 }, { price: 30.00, days: 28 }] },
          { label: 'P01(PEEK)', cells: [{ price: 88.00, days: 19 }, { price: 74.00, days: 26 }, { price: 62.00, days: 36 }] },
          { label: 'P02(6061)', cells: [{ price: 39.00, days: 13 }, { price: 32.50, days: 20 }, { price: 26.50, days: 28 }] },
          { label: 'P02(PEEK)', cells: [{ price: 80.00, days: 19 }, { price: 67.00, days: 26 }, { price: 56.00, days: 36 }] },
        ],
      },
    ],
    dhl: {
      materialValues: [
        { material: '6061-T6', values: [12.00, 9.00, 6.50] },
        { material: 'PEEK', values: [10.00, 7.50, 5.50] },
      ],
    },
    customs: {
      materialValues: [
        { material: '6061 (Metal)', values: [0.55, 0.45, 0.35] },
        { material: 'PEEK (Plastic)', values: [0.40, 0.32, 0.25] },
      ],
    },
    marginPercent: 18,
    weights: {
      materialValues: [
        { material: '6061-T6', values: ['255×225×35 / 86kg', '255×225×35 / 172kg', '255×225×35 / 430kg'] },
        { material: 'PEEK', values: ['180×120×12 / 36kg', '180×120×12 / 72kg', '180×120×12 / 180kg'] },
      ],
    },
  },

  leadTime: {
    rows: [
      { phase: '代料加工', days: 23, note: '鑫源（PEEK 方案交期較長）' },
      { phase: '質檢緩衝', days: 3 },
      { phase: 'DHL', days: 3, note: 'Express' },
    ],
    totalDays: 29,
    estimatedDelivery: '2026-04-28 （一）',
    deliveryNote: '200 pcs PEEK 方案交期',
  },

  techFeasibility: {
    matrix: [
      { criterion: '材料可加工性', requirement: '6061-T6 / PEEK', capability: '全部可加工' },
      { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
      { criterion: '表面粗糙度', requirement: 'Ra 3.2μm', capability: '標準' },
      { criterion: '幾何複雜度', requirement: '中等（凹槽+孔）', capability: '標準 3 軸' },
      { criterion: '螺紋', requirement: 'M3×0.5 ×4處 + M4×0.7 ×2處', capability: '庫存牙規 ✓' },
      { criterion: '6061 陽極層', requirement: '無色陽極', capability: '外發（±5μm 須預留）' },
    ],
    blockers: null,
    solutions: null,
    note: '6061 與 PEEK 皆可行。6061 加陽極需外發，交期多 4 天。PEEK 刀具磨損較高但精度可達。',
  },

  factories: [
    {
      name: '鑫源金屬',
      status: 'quoted',
      expectedReplyDate: '—',
      pricing: {
        scenarios: ['100 pcs', '200 pcs', '500 pcs'],
        rows: [
          { material: 'P01(6061)', values: ['$42.00/12d', '$35.00/18d', '$28.50/25d'] },
          { material: 'P01(PEEK)', values: ['$85.00/18d', '$72.00/25d', '$60.00/35d'] },
          { material: 'P02(6061)', values: ['$38.00/12d', '$31.00/18d', '$25.00/25d'] },
          { material: 'P02(PEEK)', values: ['$78.00/18d', '$65.00/25d', '$54.00/35d'] },
        ],
      },
      capability: [
        { criterion: '材料', requirement: '6061 / PEEK', capability: '全部可加工' },
        { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
      ],
      note: '6061 和 PEEK 均可。PEEK 交期較長因刀具磨損需更換頻率高。',
    },
    {
      name: '嘉承精密',
      status: 'quoted',
      expectedReplyDate: '—',
      pricing: {
        scenarios: ['100 pcs', '200 pcs', '500 pcs'],
        rows: [
          { material: 'P01(6061)', values: ['$45.00/14d', '$38.00/22d', '$31.00/30d'] },
          { material: 'P01(PEEK)', values: ['無法報價', '無法報價', '無法報價'] },
          { material: 'P02(6061)', values: ['$40.00/14d', '$33.50/22d', '$27.00/30d'] },
          { material: 'P02(PEEK)', values: ['拒絕報價', '拒絕報價', '拒絕報價'] },
        ],
      },
      capability: [
        { criterion: '材料', requirement: '6061', capability: '可加工' },
        { criterion: '材料', requirement: 'PEEK', capability: '⊘ 不可加工' },
      ],
      blockers: { items: ['PEEK'], reason: '無 PEEK 加工經驗與設備。' },
      note: '只能做 6061。PEEK 方面無經驗。',
    },
    {
      name: '理泰精密',
      status: 'quoted',
      expectedReplyDate: '—',
      pricing: {
        scenarios: ['100 pcs', '200 pcs', '500 pcs'],
        rows: [
          { material: 'P01(6061)', values: ['$44.00/13d', '$37.00/20d', '$30.00/28d'] },
          { material: 'P01(PEEK)', values: ['$88.00/19d', '$74.00/26d', '$62.00/36d'] },
          { material: 'P02(6061)', values: ['$39.00/13d', '$32.50/20d', '$26.50/28d'] },
          { material: 'P02(PEEK)', values: ['$80.00/19d', '$67.00/26d', '$56.00/36d'] },
        ],
      },
      capability: [
        { criterion: '材料', requirement: '6061 / PEEK', capability: '全部可加工' },
        { criterion: '公差', requirement: '±0.05mm', capability: '可達到' },
      ],
      note: '首次合作，6061 和 PEEK 均可。報價介於鑫源和嘉承之間。',
    },
  ],

  revisions: [
    { rev: '01', date: '2026-03-17', author: 'Sylvia', description: '初始建單' },
    { rev: '02', date: '2026-03-19', author: 'Paul', description: '工廠詢價完成 + 雙材質比價分析' },
  ],
};

/* ══════════════════════════════════════════════════════════════
   DEMO — 展示 3 種場景
   ══════════════════════════════════════════════════════════════ */

export default function EvalDemoV2() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="Evaluation-v2" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Evaluation Report v2
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          3 variants
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
        <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
          Mode A — 固定材質 × 多件數（最常見 ~50%）
        </div>
        <EvalDocumentV2 data={modeA} />

        <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
          Mode A with Blockers — MACOR 不可達到 + 氧化鋁替代方案
        </div>
        <EvalDocumentV2 data={modeABlockers} />

        <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
          Mode C — 數量 × 材質交叉 (6061 + PEEK)
        </div>
        <EvalDocumentV2 data={modeC} />
      </div>
    </div>
  );
}
