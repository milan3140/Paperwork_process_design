/**
 * TechFeasibility — Technical feasibility assessment (v2)
 *
 * A. Capability matrix (with gauge as a row) + B. Blockers +
 * C. Solutions + Next update time + Note
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx, tableStyles.ts
 */

import { SectionLabel } from './SectionLabel';
import { summaryGridCols } from './PricingSummaryTable';
import {
  CAP_MATRIX_COLS, TH_LEFT, TD_LABEL, ROW_BORDER,
  TEXT_CATEGORY, TEXT_SUB, TEXT_MUTED, TEXT_BLOCKED, TEXT_BOLD_VALUE,
  SECTION_HEADER_FLEX, SECTION_HEADER_INFO,
} from './tableStyles';

export interface CapabilityRow {
  criterion: string;
  requirement: string;
  capability: string;
  cannotAchieve?: boolean;
}

export interface SolutionDetail {
  name: string;
  description: string;
  pros?: string[];
  cons?: string[];
}

export interface TechFeasibilityData {
  nextUpdateDate?: string;
  matrix: CapabilityRow[];
  blockers: { items: string[]; reason: string } | null;
  solutions: { materials: string[]; details: SolutionDetail[] } | null;
  note?: string;
}

interface Props {
  data: TechFeasibilityData;
  autoUpdateDate?: string;
  /** Optional prefix before "預計更新", e.g. "技術統整" → "技術統整 · 預計更新: ..." */
  labelPrefix?: string;
  /** When set, uses gridCols(scenarioCount) instead of CAP_MATRIX_COLS to align with pricing tables */
  scenarioCount?: number;
}

export function TechFeasibility({ data, autoUpdateDate, labelPrefix, scenarioCount }: Props) {
  const updateDate = data.nextUpdateDate || autoUpdateDate;

  return (
    <div data-comp="TechFeasibility" className="flex flex-col gap-[var(--sp-4)]">
      {/* Section sub-label with optional prefix */}
      {(labelPrefix || updateDate) && (
        <div className="-mt-[var(--sp-2)]">
          {labelPrefix && (
            <span className={`text-[length:var(--doc-text-body)] ${TEXT_CATEGORY}`}>{labelPrefix}</span>
          )}
          {labelPrefix && updateDate && (
            <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]"> · </span>
          )}
          {updateDate && (
            <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--color-warning)] font-medium">
              預計更新: {updateDate}
            </span>
          )}
        </div>
      )}

      {/* ── Capability Matrix ── */}
      {(() => {
        const cols = scenarioCount ? summaryGridCols(scenarioCount) : CAP_MATRIX_COLS;
        const extraCols = scenarioCount ? Math.max(Math.max(scenarioCount, 2) - 2, 0) : 0;
        return (
          <div className="flex flex-col gap-[var(--sp-1)]">
            <div style={{ display: 'grid', gridTemplateColumns: cols }}>
              <div className={TH_LEFT}>項目</div>
              <div className={TH_LEFT}>需求</div>
              <div className={TH_LEFT}>能力</div>
              {Array.from({ length: extraCols }).map((_, i) => <div key={`eth-${i}`} />)}

              {data.matrix.map((row, i) => (
                <div key={i} className={`contents`}>
                  <div className={`${TD_LABEL} font-medium text-[color:var(--gray-900)] ${ROW_BORDER} ${i % 2 === 1 ? 'bg-[var(--gray-50)]' : ''}`}>
                    {row.criterion}
                  </div>
                  <div className={`${TD_LABEL} ${TEXT_SUB} ${ROW_BORDER} ${i % 2 === 1 ? 'bg-[var(--gray-50)]' : ''}`}>
                    {row.requirement}
                  </div>
                  <div className={`${TD_LABEL} ${row.cannotAchieve ? TEXT_BLOCKED : TEXT_SUB} ${ROW_BORDER} ${i % 2 === 1 ? 'bg-[var(--gray-50)]' : ''}`}>
                    {row.cannotAchieve ? `⊘ ${row.capability} (見 B)` : row.capability}
                  </div>
                  {Array.from({ length: extraCols }).map((_, j) => <div key={`e-${j}`} className={ROW_BORDER} />)}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── B. Blockers ── */}
      <div className="flex flex-col gap-[var(--sp-1)]">
        <div className={`text-[length:var(--doc-text-body)] ${TEXT_CATEGORY}`}>不可達到項目</div>
        {data.blockers ? (
          <>
            <div className={`text-[length:var(--doc-text-body)] font-bold text-[#B61F1F]`}>
              不可達到項目: {data.blockers.items.join('、')}
            </div>
            <div className="text-[length:var(--doc-text-body)] text-[color:var(--gray-600)] leading-[1.6] mt-[var(--sp-1)]">
              <span className="font-medium text-[color:var(--gray-900)]">原因:</span><br />
              {data.blockers.reason}
            </div>
          </>
        ) : (
          <div className="text-[length:var(--doc-text-body)] text-[color:var(--color-success)] font-medium">
            無 — 所有項目均可達到
          </div>
        )}
      </div>

      {/* ── C. Solutions ── */}
      <div className="flex flex-col gap-[var(--sp-2)]">
        <div className={`text-[length:var(--doc-text-body)] ${TEXT_CATEGORY}`}>解決方案</div>
        {data.solutions ? (
          <>
            <div className={`text-[length:var(--doc-text-body)] ${TEXT_SUB}`}>
              替代材料: {data.solutions.materials.join('、')}
            </div>
            {data.solutions.details.map((detail, i) => (
              <div key={i} className="flex flex-col gap-[var(--sp-1)] mt-[var(--sp-1)]">
                <div className={`text-[length:var(--doc-text-body)] ${TEXT_BOLD_VALUE}`}>{detail.name}:</div>
                <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.6]">
                  {detail.description}
                </div>
                {detail.pros && detail.pros.length > 0 && (
                  <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.5]">
                    <span className="text-[color:var(--color-success)] font-medium">優勢：</span>
                    {detail.pros.map((p, pi) => <span key={pi}>({pi + 1}) {p} </span>)}
                  </div>
                )}
                {detail.cons && detail.cons.length > 0 && (
                  <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.5]">
                    <span className="text-[#B61F1F] font-medium">劣勢：</span>
                    {detail.cons.map((c, ci) => <span key={ci}>({ci + 1}) {c} </span>)}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className={`text-[length:var(--doc-text-body)] ${TEXT_MUTED}`}>無</div>
        )}
      </div>

      {/* ── Note ── */}
      {data.note && (
        <div className="flex flex-col gap-[var(--sp-1)] border-t border-[var(--gray-150)] pt-[var(--sp-2)]">
          <div className={`text-[length:var(--doc-text-body)] ${TEXT_CATEGORY}`}>備註</div>
          <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.6]">
            {data.note}
          </div>
        </div>
      )}
    </div>
  );
}

export default TechFeasibility;
