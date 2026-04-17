/**
 * EvalDocument — Internal Evaluation Report page composed from shared components
 *
 * Renders a complete, print-ready internal evaluation report. Structure follows
 * McKinsey Pyramid Principle: Decision Summary + Pricing Structure (page 1),
 * then supporting details (page 2+).
 *
 * ⚠️ REQUIRES:
 *   Design_Sys_style.css (design tokens)
 *   documents.css (document tokens + print styles)
 *   DocumentHeader.tsx, DocumentFooter.tsx, DocumentMeta.tsx, SectionLabel.tsx
 *   PricingStructureTable.tsx, LeadTimeBar.tsx, FeasibilityMatrix.tsx
 *   VendorComparisonTable.tsx, DFMSummary.tsx, RevisionHistory.tsx
 *   StatusIndicator.tsx, NotesList.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name | Type     | Required | Default | Description                          |
 * |------|----------|----------|---------|--------------------------------------|
 * | data | EvalData | yes      | —       | Complete evaluation data object      |
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <EvalDocument data={evalData} />
 */

import React from 'react';
import { PaginatedDocument, type PageSection } from './PaginatedDocument';
import { DocumentMeta, type MetaItem } from './DocumentMeta';
import { SectionLabel } from './SectionLabel';
import { StatusIndicator, type StatusType } from './StatusIndicator';
import { PricingStructureTable, type PricingScenario, type CostLineItem } from './PricingStructureTable';
import { LeadTimeBar, type TimelinePhase } from './LeadTimeBar';
import { FeasibilityMatrix, type FeasibilityItem } from './FeasibilityMatrix';
import { VendorComparisonTable, type VendorRow, type VendorColumn } from './VendorComparisonTable';
import { DFMSummary, type DFMItem } from './DFMSummary';
import { NotesList } from './NotesList';
import { RevisionHistory, type RevisionEntry } from './RevisionHistory';

export interface EvalDecision {
  feasibility: StatusType;
  risk: StatusType;
  dfmNote?: string;
  conclusion: string;
  decidedBy: string;
  confirmedBy?: string;
}

export interface EvalVendorSection {
  title: string;
  subtitle?: string;
  recommendation?: string;
  vendors: VendorRow[];
  columns?: VendorColumn[];
  notes?: string[];
}

export interface EvalData {
  /** Order ID (e.g., "Q1202262U_杯墊01") */
  orderId: string;
  /** Revision number */
  revision: string;
  /** Issue/update date */
  date: string;
  /** Last updated by */
  lastUpdatedBy: string;

  /** Decision summary */
  decision: EvalDecision;

  /** Pricing structure */
  pricingSubtitle: string;
  costLines: CostLineItem[];
  pricingScenarios: PricingScenario[];
  recommendedScenarioIdx?: number;
  marginPercent?: number;
  pricingMatrixMode?: boolean;

  /** Lead time (for recommended scenario) */
  leadTimePhases: TimelinePhase[];
  leadTimeStartDate?: string;
  leadTimeEndDate?: string;
  leadTimeNote?: string;

  /** ── Supporting Details (optional sections) ── */

  /** Technical feasibility */
  feasibility?: {
    items: FeasibilityItem[];
    overall: StatusType;
    conclusion: string;
    reference?: string;
  };

  /** DFM feedback */
  dfmItems?: DFMItem[];
  dfmFactory?: string;

  /** Material sourcing sections (one per material if multi-material) */
  materialSections?: EvalVendorSection[];

  /** Factory evaluation sections */
  factorySections?: EvalVendorSection[];

  /** Gauge/tap check */
  gaugeCheck?: {
    result: string;
    detail: string;
  };

  /** General notes */
  notes?: string[];

  /** Revision history */
  revisions: RevisionEntry[];
}

interface EvalDocumentProps {
  data: EvalData;
}

export const EvalDocument = React.forwardRef<HTMLDivElement, EvalDocumentProps>(
  function EvalDocument({ data }, ref) {
    const metaItems: MetaItem[] = [
      { label: 'Date', value: data.date },
      { label: 'Rev', value: data.revision },
    ];

    const hasSupporting = data.feasibility || data.dfmItems?.length ||
      data.materialSections?.length || data.factorySections?.length ||
      data.gaugeCheck || data.notes?.length;

    /* ── Build sections array ── */
    const sections: PageSection[] = [
      /* ══════════════════════════════════════════════════════
         DECISION LAYER (Page 1)
         ══════════════════════════════════════════════════════ */
      {
        key: 'title-meta',
        content: (
          <>
            {/* ── Title + Meta ── */}
            <div data-el="EvalDocument-titleRow" className="flex justify-between items-start">
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

            {/* ── Last updated ── */}
            <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)] -mt-[var(--sp-4)]">
              最後更新: {data.lastUpdatedBy} — {data.date}
            </div>
          </>
        ),
      },
      {
        key: 'decision',
        content: (
          <div data-el="EvalDocument-decision" className="flex flex-col gap-[var(--sp-2)]">
            <SectionLabel>Decision Summary 決策摘要</SectionLabel>
            <div className="flex items-center gap-[var(--sp-6)] text-[length:var(--doc-text-body)]">
              <span className="flex items-center gap-[var(--sp-1)]">
                技術評估: <StatusIndicator status={data.decision.feasibility} showLabel />
              </span>
              <span className="flex items-center gap-[var(--sp-1)]">
                風險: <StatusIndicator status={data.decision.risk} showLabel />
              </span>
              {data.decision.dfmNote && (
                <span className="text-[color:var(--gray-400)]">
                  DFM: {data.decision.dfmNote}
                </span>
              )}
            </div>
            <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] leading-[1.6]">
              <strong className="text-[color:var(--gray-900)]">結論:</strong> {data.decision.conclusion}
            </div>
            <div className="flex gap-[var(--sp-6)] text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
              <span>決策者: {data.decision.decidedBy}</span>
              {data.decision.confirmedBy && <span>確認: {data.decision.confirmedBy}</span>}
            </div>
          </div>
        ),
      },
      {
        key: 'pricing',
        content: (
          <PricingStructureTable
            subtitle={data.pricingSubtitle}
            costLines={data.costLines}
            scenarios={data.pricingScenarios}
            recommendedIdx={data.recommendedScenarioIdx}
            marginPercent={data.marginPercent}
            matrixMode={data.pricingMatrixMode}
          />
        ),
      },
      {
        key: 'leadtime',
        content: (
          <LeadTimeBar
            phases={data.leadTimePhases}
            startDate={data.leadTimeStartDate}
            endDate={data.leadTimeEndDate}
            note={data.leadTimeNote}
          />
        ),
      },
    ];

    /* ══════════════════════════════════════════════════════
       SUPPORTING DETAILS (Page 2+)
       ══════════════════════════════════════════════════════ */

    if (hasSupporting) {
      sections.push({
        key: 'supporting-header',
        content: (
          <div className="border-t-[var(--doc-border-emphasis)] border-[var(--gray-200)] pt-[var(--sp-4)] mt-[var(--sp-2)]">
            <div className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-300)] uppercase tracking-[var(--doc-tracking-label)]">
              Supporting Details 支撐明細
            </div>
          </div>
        ),
      });
    }

    if (data.feasibility) {
      sections.push({
        key: 'feasibility',
        content: (
          <FeasibilityMatrix
            items={data.feasibility.items}
            overall={data.feasibility.overall}
            conclusion={data.feasibility.conclusion}
            reference={data.feasibility.reference}
          />
        ),
        group: 'supporting',
      });
    }

    if (data.dfmItems && data.dfmItems.length > 0) {
      sections.push({
        key: 'dfm',
        content: <DFMSummary items={data.dfmItems} factory={data.dfmFactory} />,
        group: 'supporting',
      });
    }

    if (data.materialSections) {
      data.materialSections.forEach((section, i) => {
        sections.push({
          key: `mat-${i}`,
          content: <VendorComparisonTable {...section} />,
          group: 'supporting',
        });
      });
    }

    if (data.factorySections) {
      data.factorySections.forEach((section, i) => {
        sections.push({
          key: `fac-${i}`,
          content: <VendorComparisonTable {...section} />,
          group: 'supporting',
        });
      });
    }

    if (data.gaugeCheck) {
      sections.push({
        key: 'gauge',
        content: (
          <div data-el="EvalDocument-gauge" className="flex flex-col gap-[var(--doc-sp-1-5)]">
            <SectionLabel>Gauge / Tap Check 牙規詢價</SectionLabel>
            <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)]">
              <strong className="text-[color:var(--gray-900)]">結果: {data.gaugeCheck.result}</strong>
              <br />
              {data.gaugeCheck.detail}
            </div>
          </div>
        ),
        group: 'supporting',
      });
    }

    if (data.notes && data.notes.length > 0) {
      sections.push({
        key: 'notes',
        content: <NotesList label="Notes 備註" items={data.notes} />,
        group: 'supporting',
      });
    }

    sections.push({
      key: 'revisions',
      content: <RevisionHistory entries={data.revisions} />,
    });

    return (
      <div ref={ref} data-comp="EvalDocument">
        <PaginatedDocument
          docType="Internal Evaluation"
          docId={data.orderId}
          sections={sections}
        />
      </div>
    );
  }
);

export default EvalDocument;
