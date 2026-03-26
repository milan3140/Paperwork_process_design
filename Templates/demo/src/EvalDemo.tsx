import { EvalDocument, type EvalData } from '../../components/EvalDocument';

/* ══════════════════════════════════════════════════════════════
   共用的支撐明細（所有模式共享，避免重複）
   ══════════════════════════════════════════════════════════════ */

const sharedFeasibility: EvalData['feasibility'] = {
  items: [
    { criterion: '材料可加工性', requirement: 'Aluminum 6061-T6', capability: 'CNC 可加工', risk: 'riskLow' },
    { criterion: '公差', requirement: '±0.05mm', capability: '可達到', risk: 'riskLow' },
    { criterion: '表面粗糙度', requirement: 'Ra 1.6μm', capability: '標準', risk: 'riskNone' },
    { criterion: '幾何複雜度', requirement: '中等（凹槽+孔）', capability: '標準 3 軸', risk: 'riskNone' },
    { criterion: '螺紋', requirement: 'M4×0.7 ×8處', capability: '庫存牙規', risk: 'riskNone' },
    { criterion: '特殊製程', requirement: '無', capability: 'N/A', risk: 'riskNone' },
  ],
  overall: 'riskLow',
  conclusion: '標準 CNC 加工，所有要求可達到。M4 牙規庫存充足。',
  reference: '類似零件 Q118234U（平面度實測 8μm）',
};

const sharedRevisions: EvalData['revisions'] = [
  { rev: '01', date: '2026-03-15', author: 'Sylvia', description: '初始建單' },
  { rev: '02', date: '2026-03-17', author: 'Paul', description: '材料+工廠詢價完成' },
  { rev: '03', date: '2026-03-18', author: 'Paul', description: '成本總結 + 技術分析' },
  { rev: '04', date: '2026-03-19', author: 'Yifei', description: '已報價確認' },
];

/* ══════════════════════════════════════════════════════════════
   MODE D: 單一確認場景（G11 杯墊真實案例）
   ══════════════════════════════════════════════════════════════ */

const modeD: EvalData = {
  orderId: 'Q1202262U_杯墊01',
  revision: '03',
  date: '2026-03-20',
  lastUpdatedBy: 'Yifei',

  decision: {
    feasibility: 'riskLow',
    risk: 'riskLow',
    dfmNote: '無阻斷項',
    conclusion:
      '技術可達到。G11 材料加工雖刀損大及加工速度需較慢，但形變較穩定，也比較適合高精度的工件。' +
      '先前嘉承做的 G10 樣片平面度量測為 5μm-10μm，本單要求平面度 25μm 可達到。' +
      'G10 方案不提供 — G11 風險更低且尺寸小材料與加工價差不大。',
    decidedBy: 'Paul',
    confirmedBy: 'Yifei',
  },

  pricingSubtitle: '材料: G11 (FR5) | 數量: 8 件 | 製程: CNC 金屬',
  costLines: [
    { label: '材料', detail: '高成電木, G11' },
    { label: '加工', detail: '自行推估' },
    { label: 'DHL', detail: '1箱 35×25×25cm / 3.24kg' },
    { label: '關稅' },
  ],
  pricingScenarios: [
    {
      header: '8 件',
      aiBenchmark: 174.18,
      costValues: [7.18, 32.25, 9.07, 0.38],
      leadTimeDays: 14,
      weight: '1.92kg (含包裝 3.24kg)',
    },
  ],
  recommendedScenarioIdx: 0,
  marginPercent: 18,

  leadTimePhases: [
    { label: '叫料', days: 4 },
    { label: '加工', days: 5 },
    { label: '質檢緩衝', days: 2 },
    { label: 'DHL', days: 3 },
  ],
  leadTimeStartDate: '2026-03-21 (五)',
  leadTimeEndDate: '2026-04-09 (四)',
  leadTimeNote: '已排除週末與假日',

  feasibility: {
    items: [
      { criterion: '材料可加工性', requirement: 'G11 (FR5)', capability: 'CNC 可加工', risk: 'riskLow' },
      { criterion: '公差', requirement: '±0.001" (25μm)', capability: '可達到', risk: 'riskLow' },
      { criterion: '表面粗糙度', requirement: 'As machined', capability: '標準', risk: 'riskNone' },
      { criterion: '幾何複雜度', requirement: '簡單平面件', capability: '標準 3 軸', risk: 'riskNone' },
      { criterion: '螺紋', requirement: '無', capability: 'N/A', risk: 'riskNone' },
      { criterion: '特殊製程', requirement: '無', capability: 'N/A', risk: 'riskNone' },
    ],
    overall: 'riskLow',
    conclusion: 'CNC 加工可達到要求。先前嘉承 G10 樣片平面度 5-10μm，本單要求 25μm 可達到。',
    reference: '嘉承 G10 樣片（平面度實測 5-10μm）',
  },

  materialSections: [
    {
      title: 'Material Sourcing 材料詢價',
      subtitle: 'G11 (FR5)',
      recommendation: '高成電木',
      vendors: [
        { name: '高成電木', status: 'quoted', selected: true, values: ['50×43×20mm', '有', '3-5天', 'NT$155', 'NT$1,240', '● 英文'] },
        { name: '瑋晨', status: 'quoted', values: ['50×43×20mm', '有', '3天', 'NT$150', 'NT$1,200', '—'] },
        { name: 'McMaster', status: 'quoted', values: ['152.4×152.4×19mm', '有', '~5天', 'NT$3,345', 'NT$26,760', '● 英文'] },
        { name: '鴻泰', status: 'notStarted', values: ['—', '—', '—', '—', '—', '—'] },
      ],
      notes: [
        '高成: FR5 與 G11 同等級，台製，公司自己開立英文材證',
        '瑋晨: 最低價但無材證',
      ],
    },
  ],

  gaugeCheck: { result: '此單無須 ✓', detail: '本單無螺紋特徵，不需要牙規。' },

  revisions: [
    { rev: '01', date: '2026-03-18', author: 'Sylvia', description: '初始建單' },
    { rev: '02', date: '2026-03-19', author: 'Paul', description: '材料詢價 + 成本總結 + 技術分析' },
    { rev: '03', date: '2026-03-20', author: 'Yifei', description: '已報價確認' },
  ],
};

/* ══════════════════════════════════════════════════════════════
   MODE A: 多件數級距（最常見 ~50%）
   固定材質 Aluminum 6061-T6，比較 100/200/500 件
   ══════════════════════════════════════════════════════════════ */

const modeA: EvalData = {
  orderId: 'Q1215264U_支架01',
  revision: '02',
  date: '2026-03-19',
  lastUpdatedBy: 'Paul',

  decision: {
    feasibility: 'riskLow',
    risk: 'riskLow',
    conclusion: '三個數量級距皆可行。200 件為客戶常規批量，建議以此為主報價，附帶 100/500 價格表供客戶參考。',
    decidedBy: 'Paul',
    confirmedBy: 'Yifei',
  },

  pricingSubtitle: '材料: Aluminum 6061-T6 | 製程: CNC 金屬',
  costLines: [
    { label: '材料', detail: '鑫源金屬, 6061-T6' },
    { label: '加工', detail: '嘉承精密' },
    { label: 'DHL' },
    { label: '關稅' },
  ],
  pricingScenarios: [
    {
      header: '100 pcs',
      aiBenchmark: 114.00,
      costValues: [5.00, 38.00, 12.00, 0.55],
      leadTimeDays: 18,
      weight: '86kg (含包裝 95kg)',
    },
    {
      header: '200 pcs',
      aiBenchmark: 102.00,
      costValues: [4.50, 32.00, 9.00, 0.45],
      leadTimeDays: 22,
      weight: '172kg (含包裝 188kg)',
    },
    {
      header: '500 pcs',
      aiBenchmark: 88.00,
      costValues: [4.00, 26.00, 6.50, 0.35],
      leadTimeDays: 28,
      weight: '430kg (含包裝 465kg)',
    },
  ],
  recommendedScenarioIdx: 1,
  marginPercent: 18,

  leadTimePhases: [
    { label: '叫料', days: 5 },
    { label: '加工', days: 12 },
    { label: '質檢緩衝', days: 2 },
    { label: 'DHL', days: 3 },
  ],
  leadTimeStartDate: '2026-03-21 (五)',
  leadTimeEndDate: '2026-04-21 (二)',
  leadTimeNote: '200 件交期，已排除週末',

  feasibility: sharedFeasibility,

  factorySections: [
    {
      title: 'Factory Evaluation 工廠評估',
      subtitle: '台灣',
      recommendation: '嘉承精密',
      columns: [
        { header: '100件單價', align: 'right', width: '15%' },
        { header: '200件單價', align: 'right', width: '15%' },
        { header: '500件單價', align: 'right', width: '15%' },
        { header: '交期', align: 'left', width: '15%' },
        { header: '備註', align: 'left' },
      ],
      vendors: [
        { name: '嘉承精密', status: 'quoted', selected: true, values: ['$38.00', '$32.00', '$26.00', '15-25天', '合作穩定'] },
        { name: '禾登精密', status: 'quoted', values: ['$42.00', '$35.00', '$28.50', '18-28天', '新報價'] },
        { name: '廣昇五金', status: 'declined', values: ['—', '—', '—', '—', '產能滿'] },
      ],
      notes: ['嘉承: 合作多次，品質穩定，交期準確'],
    },
  ],

  revisions: sharedRevisions,
};

/* ══════════════════════════════════════════════════════════════
   MODE B: 多材質比較
   固定數量 100 件，比較 PEEK / Delrin / 6061 / 6061+陽極
   ══════════════════════════════════════════════════════════════ */

const modeB: EvalData = {
  orderId: 'Q1218265U_軸承座01',
  revision: '02',
  date: '2026-03-19',
  lastUpdatedBy: 'Paul',

  decision: {
    feasibility: 'riskLow',
    risk: 'riskLow',
    conclusion:
      '建議 Delrin (POM) — 滿足功能需求（工作溫度 <80°C），成本比 PEEK 低 62%。' +
      'Nylon 雖更便宜但強度不足於此應用。6061+陽極可作備案。',
    decidedBy: 'Paul',
    confirmedBy: 'Yifei',
  },

  pricingSubtitle: '數量: 100 pcs | 製程: CNC',
  costLines: [
    { label: '材料' },
    { label: '加工' },
    { label: '表面處理' },
    { label: 'DHL' },
    { label: '關稅' },
  ],
  pricingScenarios: [
    {
      header: 'PEEK',
      aiBenchmark: 280.00,
      costValues: [45.00, 65.00, 0, 8.00, 0.80],
      leadTimeDays: 25,
      weight: '32kg (含包裝 38kg)',
    },
    {
      header: 'Delrin (POM)',
      aiBenchmark: 114.00,
      costValues: [5.00, 38.00, 0, 12.00, 0.55],
      leadTimeDays: 18,
      weight: '45kg (含包裝 52kg)',
    },
    {
      header: '6061-T6',
      aiBenchmark: 85.00,
      costValues: [3.50, 18.00, 0, 14.00, 0.35],
      leadTimeDays: 15,
      weight: '86kg (含包裝 95kg)',
    },
    {
      header: '6061+陽極',
      aiBenchmark: 98.00,
      costValues: [3.50, 18.00, 6.50, 14.00, 0.42],
      leadTimeDays: 19,
      weight: '86kg (含包裝 95kg)',
    },
  ],
  recommendedScenarioIdx: 1,
  marginPercent: 18,

  leadTimePhases: [
    { label: '叫料', days: 4 },
    { label: '加工', days: 8 },
    { label: '質檢緩衝', days: 3 },
    { label: 'DHL', days: 3 },
  ],
  leadTimeStartDate: '2026-03-21 (五)',
  leadTimeEndDate: '2026-04-15 (二)',
  leadTimeNote: 'Delrin 交期，已排除週末',

  feasibility: {
    items: [
      { criterion: '材料可加工性', requirement: 'PEEK / Delrin / 6061', capability: '全部 CNC 可加工', risk: 'riskLow' },
      { criterion: '公差', requirement: '±0.05mm', capability: '可達到', risk: 'riskLow' },
      { criterion: '耐溫', requirement: '工作溫度 <80°C', capability: 'PEEK 250°C / Delrin 100°C / 6061 150°C', risk: 'riskNone' },
      { criterion: 'PEEK 刀具磨損', requirement: '—', capability: '較高，加工速度須降低', risk: 'riskMedium' },
      { criterion: '6061 陽極層', requirement: '—', capability: '±5μm 影響配合尺寸，須預留', risk: 'riskLow' },
    ],
    overall: 'riskLow',
    conclusion: '全部材質可行。Delrin 最易加工，形變風險最低。PEEK 刀具磨損較高但精度可達。',
  },

  materialSections: [
    {
      title: 'Material Sourcing 材料詢價',
      subtitle: 'PEEK',
      recommendation: 'McMaster',
      vendors: [
        { name: 'McMaster', status: 'quoted', selected: true, values: ['⌀50×100mm', '有', '5天', 'NT$4,500', 'NT$450,000', '● 英文'] },
        { name: '鑫源塑膠', status: 'quoted', values: ['⌀50×100mm', '無', '15天', 'NT$3,800', 'NT$380,000', '—'] },
      ],
      notes: [],
    },
    {
      title: 'Material Sourcing 材料詢價',
      subtitle: 'Delrin (POM)',
      recommendation: '高成',
      vendors: [
        { name: '高成', status: 'quoted', selected: true, values: ['50×43×20mm', '有', '3-5天', 'NT$155', 'NT$15,500', '● 英文'] },
        { name: '瑋晨', status: 'quoted', values: ['50×43×20mm', '有', '3天', 'NT$150', 'NT$15,000', '—'] },
      ],
      notes: [],
    },
  ],

  revisions: sharedRevisions,
};

/* ══════════════════════════════════════════════════════════════
   MODE C: 雙維度交叉矩陣
   材質(3種) × 數量(3種) = 9 種組合（condensed mode）
   ══════════════════════════════════════════════════════════════ */

const modeC: EvalData = {
  orderId: 'Q1220266U_連接器殼01',
  revision: '02',
  date: '2026-03-19',
  lastUpdatedBy: 'Paul',

  decision: {
    feasibility: 'riskLow',
    risk: 'riskLow',
    conclusion:
      '建議 Delrin × 200 pcs — $54.22/件，總價 $10,844，22 工作天。' +
      'Delrin 滿足強度需求，200 pcs 為客戶常規批量。完整成本拆解見支撐明細。',
    decidedBy: 'Paul',
    confirmedBy: 'Yifei',
  },

  pricingSubtitle: '報價單價 (USD) — 材質 × 數量交叉比較',
  costLines: [
    { label: '材料' },
    { label: '加工' },
    { label: '表面處理' },
    { label: 'DHL' },
    { label: '關稅' },
  ],
  pricingScenarios: [
    // Row 1: PEEK × 3 quantities as separate scenarios
    { header: 'PEEK\n100 pcs', aiBenchmark: 280.00, costValues: [45.00, 65.00, 0, 8.00, 0.80], leadTimeDays: 25, weight: '32kg' },
    { header: 'PEEK\n200 pcs', aiBenchmark: 236.00, costValues: [38.00, 55.00, 0, 6.00, 0.65], leadTimeDays: 28, weight: '64kg' },
    { header: 'PEEK\n500 pcs', aiBenchmark: 198.00, costValues: [32.00, 46.00, 0, 4.50, 0.50], leadTimeDays: 35, weight: '160kg' },
    // Row 2: Delrin × 3 quantities
    { header: 'Delrin\n100 pcs', aiBenchmark: 114.00, costValues: [5.00, 38.00, 0, 12.00, 0.55], leadTimeDays: 18, weight: '45kg' },
    { header: 'Delrin\n200 pcs', aiBenchmark: 102.00, costValues: [4.50, 32.00, 0, 9.00, 0.45], leadTimeDays: 22, weight: '90kg' },
    { header: 'Delrin\n500 pcs', aiBenchmark: 88.00, costValues: [4.00, 26.00, 0, 6.50, 0.35], leadTimeDays: 28, weight: '225kg' },
    // Row 3: 6061 × 3 quantities
    { header: '6061\n100 pcs', aiBenchmark: 85.00, costValues: [3.50, 18.00, 0, 14.00, 0.35], leadTimeDays: 15, weight: '86kg' },
    { header: '6061\n200 pcs', aiBenchmark: 72.00, costValues: [3.00, 15.00, 0, 10.50, 0.28], leadTimeDays: 20, weight: '172kg' },
    { header: '6061\n500 pcs', aiBenchmark: 62.00, costValues: [2.50, 12.50, 0, 7.00, 0.22], leadTimeDays: 25, weight: '430kg' },
  ],
  recommendedScenarioIdx: 4, // Delrin × 200 pcs
  marginPercent: 18,
  pricingMatrixMode: true, // condensed — only show quote price per cell

  leadTimePhases: [
    { label: '叫料', days: 4 },
    { label: '加工', days: 12 },
    { label: '質檢緩衝', days: 3 },
    { label: 'DHL', days: 3 },
  ],
  leadTimeStartDate: '2026-03-21 (五)',
  leadTimeEndDate: '2026-04-21 (二)',
  leadTimeNote: '推薦方案 Delrin×200 交期',

  feasibility: sharedFeasibility,
  revisions: sharedRevisions,
};

/* ══════════════════════════════════════════════════════════════
   DEMO — 展示全部 4 種模式
   ══════════════════════════════════════════════════════════════ */

export default function EvalDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', alignItems: 'center' }}>
      {/* Mode label between documents */}
      <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Mode D — 單一確認場景（G11 杯墊真實案例）
      </div>
      <EvalDocument data={modeD} />

      <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Mode A — 多件數級距（最常見 ~50%）
      </div>
      <EvalDocument data={modeA} />

      <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Mode B — 多材質比較
      </div>
      <EvalDocument data={modeB} />

      <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Mode C — 雙維度交叉矩陣（材質 × 數量）
      </div>
      <EvalDocument data={modeC} />
    </div>
  );
}
