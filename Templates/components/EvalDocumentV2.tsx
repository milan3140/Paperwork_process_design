/**
 * EvalDocumentV2 — Internal Evaluation Report v2 (正式建單)
 *
 * Structure: QuoteInfo → QuoteEvaluation → LeadTime → TechFeasibility →
 *            FactoryDetails → RevisionLog
 *
 * ⚠️ REQUIRES: All sub-components + Design_Sys_style.css + documents.css
 */

import React from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { StatusIndicator } from './StatusIndicator';
import { QuoteInfo, type QuoteInfoData } from './QuoteInfo';
import { QuoteEvaluationTable, type QuoteEvalData } from './QuoteEvaluationTable';
import { QuoteEvaluationTableV2 } from './QuoteEvaluationTableV2';
import { LeadTimeTable, type LeadTimeData } from './LeadTimeTable';
import { TechFeasibility, type TechFeasibilityData } from './TechFeasibility';
import { PricingSummaryTable } from './PricingSummaryTable';
import { FactoryDetailBlock, type FactoryDetailData } from './FactoryDetailBlock';
import { RevisionHistory, type RevisionEntry } from './RevisionHistory';

export interface EvalV2Data {
  orderId: string;
  revision: string;
  date: string;
  /** true = 已報價, false = 未報價 */
  isQuoted: boolean;

  quoteInfo: QuoteInfoData;
  quoteEval: QuoteEvalData;
  leadTime: LeadTimeData;
  techFeasibility: TechFeasibilityData;
  factories: FactoryDetailData[];
  revisions: RevisionEntry[];
}

interface EvalDocumentV2Props {
  data: EvalV2Data;
  /** 'factory-first' (default, V2) or 'part-first' (V3 layout) */
  tableVariant?: 'factory-first' | 'part-first';
}

export const EvalDocumentV2 = React.forwardRef<HTMLDivElement, EvalDocumentV2Props>(
  function EvalDocumentV2({ data, tableVariant = 'factory-first' }, ref) {
    const metaItems: MetaItem[] = [
      { label: 'Status', value: data.isQuoted ? '● 已報價' : '○ 未報價' },
      { label: 'Date', value: data.date },
      { label: 'Rev', value: data.revision },
    ];

    // Auto-compute update date from earliest factory reply
    const autoUpdateDate = data.factories
      .filter(f => f.expectedReplyDate)
      .map(f => f.expectedReplyDate!)
      .sort()[0]; // alphabetical sort works for "3月26日" format roughly

    /** Section divider — numbered section marker with thick top line */
    function SectionBreak({ num, label }: { num: number; label: string }) {
      return (
        <div
          className="pt-[var(--sp-4)] mt-[var(--sp-2)]"
          style={{ borderTop: '2px solid var(--color-primary-subtle)' }}
        >
          <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-1)]">
            <span
              className="flex items-center justify-center text-[length:var(--doc-text-file-tag)] font-bold text-white shrink-0"
              style={{
                width: '18px', height: '18px', borderRadius: '3px',
                backgroundColor: 'var(--color-primary)',
              }}
            >
              {num}
            </span>
            <span className="text-[length:var(--doc-text-part-id)] font-semibold text-[color:var(--color-primary)] uppercase tracking-[var(--doc-tracking-label)]">
              {label}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} data-comp="EvalDocumentV2" className="doc-page">
        <DocumentHeader docType="Internal Evaluation" />

        <div className="doc-content">
          {/* ── Title + Meta ── */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]">
                Internal Evaluation Report
              </div>
              <div className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]">
                #{data.orderId}
              </div>
            </div>
            <DocumentMeta items={metaItems} />
          </div>

          {/* ── 1. Quote Info ── */}
          <SectionBreak num={1} label="Quote Info 訂單資訊" />
          <QuoteInfo data={data.quoteInfo} />

          {/* ── 2. Summary 此單統整 (報價統整 + 技術統整) ── */}
          <SectionBreak num={2} label="Summary 此單統整" />
          <div className="flex flex-col gap-[var(--sp-4)]">
            {/* 報價統整 */}
            <PricingSummaryTable data={data.quoteEval} />
            {/* 技術統整 — only show update date if explicitly set in data */}
            <TechFeasibility
              data={data.techFeasibility}
              labelPrefix="技術統整"
              scenarioCount={data.quoteEval.scenarios.length}
            />
          </div>

          {/* ── 3. Lead Time ── */}
          <SectionBreak num={3} label="Lead Time 交期" />
          <LeadTimeTable data={data.leadTime} />

          {/* ── 4. Quote Evaluation ── */}
          <SectionBreak num={4} label="Quote Evaluation 報價評估" />
          {tableVariant === 'part-first'
            ? <QuoteEvaluationTableV2 data={data.quoteEval} />
            : <QuoteEvaluationTable data={data.quoteEval} />
          }

          {/* ── 5. Factory Details ── */}
          <SectionBreak num={5} label="Factory Details 工廠評估細節" />
          <div className="flex flex-col gap-0 mt-[var(--sp-2)]">
            {data.factories.map((factory, i) => (
              <FactoryDetailBlock
                key={i}
                data={factory}
                showDivider={i < data.factories.length - 1}
              />
            ))}
          </div>

          {/* ── 6. Revision Log ── */}
          <SectionBreak num={6} label="Revision Log 修訂版本" />
          <RevisionHistory entries={data.revisions} />
        </div>

        <DocumentFooter docId={data.orderId} page={1} totalPages={1} />
      </div>
    );
  }
);

export default EvalDocumentV2;
