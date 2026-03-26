/**
 * EvalDemoV3 — Part-first table layout demo
 *
 * Reuses same data from EvalDemoV2; only difference is tableVariant="part-first"
 * which renders QuoteEvaluationTableV2 (part → factory grouping + 成本總覽).
 */

import { EvalDocumentV2 } from '../../components/EvalDocumentV2';
import { modeA, modeABlockers, modeC } from './EvalDemoV2';

export default function EvalDemoV3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Mode A — 固定材質 × 多件數（零件優先）
      </div>
      <EvalDocumentV2 data={modeA} tableVariant="part-first" />

      <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Mode A with Blockers — MACOR（零件優先）
      </div>
      <EvalDocumentV2 data={modeABlockers} tableVariant="part-first" />

      <div style={{ textAlign: 'center', padding: '20px 0 0', color: '#8E89A3', fontSize: '13px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Mode C — 數量 × 材質交叉（零件優先）
      </div>
      <EvalDocumentV2 data={modeC} tableVariant="part-first" />
    </div>
  );
}
