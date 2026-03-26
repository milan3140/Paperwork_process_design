/**
 * FactoryDetailBlock — Single factory evaluation detail block (v2)
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, StatusIndicator.tsx, tableStyles.ts
 */

import { StatusIndicator, type StatusType } from './StatusIndicator';
import {
  CAP_MATRIX_COLS, gridCols,
  TH_LEFT, TH_RIGHT, TD_LABEL, TD_VALUE, ROW_BORDER,
  TEXT_VENDOR, TEXT_SUB, TEXT_MUTED, TEXT_BLOCKED, TEXT_DECLINED,
  indentStyle,
} from './tableStyles';

/** Section title style — gray uppercase matching table TH */
const FACTORY_SECTION_TITLE = [
  'text-[length:var(--doc-text-param-label)] font-semibold',
  'text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)]',
].join(' ');

export interface FactoryPricingRow {
  material: string;
  values: (string | null)[];
}

export interface FactoryCapRow {
  criterion: string;
  requirement: string;
  capability: string;
}

export interface FactoryDetailData {
  name: string;
  status: StatusType;
  statusDetail?: string;
  expectedReplyDate?: string;
  pricing?: { scenarios: string[]; rows: FactoryPricingRow[] };
  capability?: FactoryCapRow[];
  blockers?: { items: string[]; reason: string };
  solutions?: { description: string };
  note: string;
}

interface Props { data: FactoryDetailData; showDivider?: boolean }

export function FactoryDetailBlock({ data, showDivider = true }: Props) {
  const isDeclined = data.status === 'declined';

  return (
    <div
      data-comp="FactoryDetailBlock"
      className={showDivider ? 'pb-[var(--sp-8)] mb-[var(--sp-8)]' : ''}
      style={showDivider ? { borderBottom: 'var(--doc-border-emphasis) solid var(--gray-200)' } : undefined}
    >
      {/* ── Factory Header ── */}
      <div className="flex items-baseline gap-[var(--sp-3)] mb-[var(--sp-3)]">
        <span className="text-[length:var(--doc-text-party-name)] font-bold text-[color:var(--gray-900)]">
          {data.name}
        </span>
        <StatusIndicator status={data.status} showLabel />
        {data.statusDetail && (
          <span className={`text-[length:var(--doc-text-secondary)] ${TEXT_MUTED}`}>({data.statusDetail})</span>
        )}
        <span className={`text-[length:var(--doc-text-secondary)] ${TEXT_MUTED}`}>
          · 預計回覆: {data.expectedReplyDate || '—'}
        </span>
      </div>

      {/* ── Declined: only note ── */}
      {isDeclined && (
        <div className={`text-[length:var(--doc-text-body)] ${TEXT_SUB} leading-[1.5]`}>
          <span className={TEXT_VENDOR}>備註: </span>{data.note}
        </div>
      )}

      {/* ── Full detail ── */}
      {!isDeclined && (
        <div className="flex flex-col gap-[var(--sp-5)]">
          {/* Pricing */}
          {data.pricing && (
            <div>
              <div className={`${FACTORY_SECTION_TITLE} mb-[var(--sp-1)]`}>報價</div>
              <div style={{ display: 'grid', gridTemplateColumns: gridCols(data.pricing.scenarios.length) }}>
                <div className={TH_LEFT} />
                {data.pricing.scenarios.map((s, i) => <div key={i} className={TH_RIGHT}>{s}</div>)}

                {data.pricing.rows.map((row, ri) => (
                  <div key={ri} className="contents">
                    <div className={`${TD_LABEL} ${TEXT_SUB} ${ROW_BORDER}`} style={indentStyle(1)}>
                      {row.material}
                    </div>
                    {row.values.map((v, vi) => (
                      <div key={vi} className={`${TD_VALUE} ${ROW_BORDER}`}>
                        {v == null ? (
                          <span className={TEXT_MUTED}>—</span>
                        ) : v === '無法報價' || v === '拒絕報價' ? (
                          <span className={TEXT_DECLINED}>{v}</span>
                        ) : (
                          <span className={TEXT_SUB}>{v}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical capability — uses same grid width as pricing for column alignment */}
          {data.capability && (
            <div>
              <div className={`${FACTORY_SECTION_TITLE} mb-[var(--sp-1)]`}>技術</div>
              <div style={{ display: 'grid', gridTemplateColumns: CAP_MATRIX_COLS }}>
                <div className={TH_LEFT} style={indentStyle(1)}>項目</div>
                <div className={TH_LEFT}>需求</div>
                <div className={TH_LEFT}>技術</div>

                {data.capability.map((row, i) => (
                  <div key={i} className="contents">
                    <div className={`${TD_LABEL} ${TEXT_VENDOR} ${ROW_BORDER}`} style={indentStyle(1)}>{row.criterion}</div>
                    <div className={`${TD_LABEL} ${TEXT_SUB} ${ROW_BORDER}`}>{row.requirement}</div>
                    <div className={`${TD_LABEL} ${row.capability.startsWith('⊘') ? TEXT_BLOCKED : TEXT_SUB} ${ROW_BORDER}`}>
                      {row.capability}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockers */}
          {data.blockers && (
            <div>
              <div className="text-[length:var(--doc-text-body)] font-bold text-[#B61F1F]">
                不可達到項目: {data.blockers.items.join('、')}
              </div>
              <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.5] mt-[var(--sp-1)]">
                原因: {data.blockers.reason}
              </div>
            </div>
          )}

          {/* Solutions */}
          {data.solutions && (
            <div>
              <div className={`${FACTORY_SECTION_TITLE}`}>解決方案</div>
              <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.5] mt-[var(--sp-1)]">
                {data.solutions.description}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <div className={`${FACTORY_SECTION_TITLE}`}>備註</div>
            <div className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.6] mt-[var(--sp-1)]">
              {data.note}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FactoryDetailBlock;
