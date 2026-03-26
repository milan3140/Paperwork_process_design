/**
 * QuoteInfo — Order information section for evaluation documents
 *
 * Renders structured order details: deadline, milestone dates,
 * part specs, parts list, and standard requirements.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 */

import { SectionLabel } from './SectionLabel';

export interface Milestone {
  label: string;
  date: string;
  note: string;
}

export interface PartEntry {
  id: string;
  quantity: number;
  requirements: string[];
}

export interface QuoteInfoData {
  deadline: string;
  orderDate: string;
  milestones: Milestone[];
  partTypes: number;
  totalParts: number;
  specs: { label: string; value: string }[];
  parts: PartEntry[];
  otherRequirements: string[];
}

interface QuoteInfoProps {
  data: QuoteInfoData;
}

export function QuoteInfo({ data }: QuoteInfoProps) {
  return (
    <div data-comp="QuoteInfo" className="flex flex-col gap-[var(--sp-4)]">
      {/* SectionLabel provided by parent SectionBreak */}

      {/* ── Deadline ── */}
      <div
        data-el="QuoteInfo-deadline"
        className="py-[var(--sp-2)] px-[var(--sp-3)] bg-[var(--color-warning-bg)] rounded-r-[var(--radius-sm)] text-[length:var(--doc-text-body)] font-semibold text-[color:var(--color-warning-text)] leading-[1.5]"
        style={{ borderLeft: 'var(--doc-border-accent) solid var(--color-warning)' }}
      >
        此評估最晚截止時間：{data.deadline}
      </div>

      {/* ── Order date + Milestones ── */}
      <div data-el="QuoteInfo-milestones" className="flex flex-col gap-[var(--sp-2)]">
        <div className="text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-600)]">
          若 {data.orderDate} 下單:
        </div>
        <div className="grid gap-[var(--sp-4)]" style={{ gridTemplateColumns: `repeat(${data.milestones.length}, 1fr)` }}>
          {data.milestones.map((m, i) => (
            <div key={i} className="flex flex-col gap-[var(--doc-sp-half)]">
              <div className="text-[length:var(--doc-text-param-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)]">
                {m.label}
              </div>
              <div className="text-[length:var(--doc-text-part-id)] font-bold text-[color:var(--gray-900)]">
                {m.date}
              </div>
              <div className="text-[length:var(--doc-text-fine)] text-[color:var(--gray-400)]">
                {m.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Part count summary ── */}
      <div data-el="QuoteInfo-summary" className="flex gap-[var(--sp-6)] text-[length:var(--doc-text-body)]">
        <span>
          <span className="font-medium text-[color:var(--gray-400)]">零件種類: </span>
          <span className="font-bold text-[color:var(--gray-900)]">{data.partTypes} 種</span>
        </span>
        <span>
          <span className="font-medium text-[color:var(--gray-400)]">總件數: </span>
          <span className="font-bold text-[color:var(--gray-900)]">{data.totalParts} 件</span>
        </span>
      </div>

      {/* ── Specs key-value pairs ── */}
      <div data-el="QuoteInfo-specs" className="grid gap-y-[var(--sp-1)] gap-x-[var(--sp-4)]" style={{ gridTemplateColumns: 'auto 1fr' }}>
        {data.specs.map((spec, i) => (
          <div key={i} className="contents">
            <span className="text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-400)]">
              {spec.label}
            </span>
            <span className="text-[length:var(--doc-text-body)] font-medium text-[color:var(--gray-900)]">
              {spec.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Parts List ── */}
      <div data-el="QuoteInfo-parts" className="flex flex-col gap-[var(--sp-3)]">
        <div className="text-[length:var(--doc-text-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] pb-[var(--sp-1)] border-b border-[var(--gray-150)]">
          Parts List 零件列表
        </div>
        {data.parts.map((part, i) => (
          <div key={i} className="flex flex-col gap-[var(--doc-sp-half)]">
            <div className="flex justify-between items-baseline">
              <span className="text-[length:var(--doc-text-body)] font-bold text-[color:var(--gray-900)]">
                ({i + 1}) {part.id}
              </span>
              <span className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-400)]">
                ×{part.quantity} 件
              </span>
            </div>
            {part.requirements.map((req, ri) => (
              <div key={ri} className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] pl-[var(--sp-3)] leading-[1.5]">
                ▸ {req}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Other Requirements ── */}
      {data.otherRequirements.length > 0 && (
        <div data-el="QuoteInfo-other" className="flex flex-col gap-[var(--sp-1)]">
          <div className="text-[length:var(--doc-text-label)] font-semibold text-[color:var(--gray-400)] uppercase tracking-[var(--doc-tracking-label)] pb-[var(--sp-1)] border-b border-[var(--gray-150)]">
            Other Requirements 其它要求
          </div>
          {data.otherRequirements.map((req, i) => (
            <div key={i} className="text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)] leading-[1.5]">
              {i + 1}. {req}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuoteInfo;
