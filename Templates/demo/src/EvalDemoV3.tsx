/**
 * EvalDemoV3 — Part-first table layout demo
 *
 * Reuses same data from EvalDemoV2; only difference is tableVariant="part-first"
 * which renders QuoteEvaluationTableV2 (part → factory grouping + 成本總覽).
 */

import { EvalDocumentV2 } from '../../components/EvalDocumentV2';
import { modeA, modeABlockers, modeC } from './EvalDemoV2';
import { DownloadPdfButton } from './DownloadPdfButton';

export default function EvalDemoV3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--sp-10) 0', gap: 'var(--sp-4)' }}>
      <DownloadPdfButton filename="Evaluation-v3" />

      <div style={{ textAlign: 'center' }}>
        <div className="text-[length:var(--text-xs)] font-semibold uppercase tracking-widest text-[color:var(--gray-400)]">
          Evaluation Report v3
        </div>
        <div className="text-[length:var(--text-xs)] text-[color:var(--gray-400)] mt-1">
          Part-first table variant
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
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
    </div>
  );
}
