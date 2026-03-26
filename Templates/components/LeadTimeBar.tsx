/**
 * LeadTimeBar — Static horizontal segmented timeline for printed documents
 *
 * Renders a horizontal bar showing sequential production phases with
 * day counts, proportional widths, and calendar dates.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, SectionLabel.tsx
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name       | Type            | Required | Default | Description                   |
 * |------------|-----------------|----------|---------|-------------------------------|
 * | phases     | TimelinePhase[] | yes      | —       | Ordered production phases     |
 * | startDate  | string          | no       | —       | Start date display string     |
 * | endDate    | string          | no       | —       | End/delivery date string      |
 * | note       | string          | no       | —       | Footnote (e.g. "已排除週末")  |
 */

import { SectionLabel } from './SectionLabel';

export interface TimelinePhase {
  label: string;
  days: number;
  /** Color token for the segment fill */
  color?: string;
}

const PHASE_COLORS = [
  'var(--color-info)',      // blue — material sourcing
  'var(--color-success)',   // green — machining
  'var(--color-warning)',   // amber — QC buffer
  'var(--color-primary-light)', // purple — shipping
  'var(--gray-400)',        // gray — fallback
];

interface LeadTimeBarProps {
  phases: TimelinePhase[];
  startDate?: string;
  endDate?: string;
  note?: string;
}

export function LeadTimeBar({ phases, startDate, endDate, note }: LeadTimeBarProps) {
  const totalDays = phases.reduce((sum, p) => sum + p.days, 0);

  // Cumulative day markers
  let cumDays = 0;
  const markers = [{ day: 1, label: 'Day 1' }];
  phases.forEach((p, i) => {
    cumDays += p.days;
    if (i < phases.length - 1) {
      markers.push({ day: cumDays + 1, label: `Day ${cumDays + 1}` });
    }
  });
  markers.push({ day: totalDays, label: `Day ${totalDays}` });

  return (
    <div data-comp="LeadTimeBar" className="flex flex-col gap-[var(--doc-sp-1-5)]">
      <div className="flex items-baseline justify-between">
        <SectionLabel className="flex-1">Lead Time 交期</SectionLabel>
        <span className="text-[length:var(--doc-text-body)] font-semibold text-[color:var(--gray-900)] ml-[var(--sp-4)] shrink-0 pb-[var(--sp-1)]">
          合計: {totalDays} 個工作天
        </span>
      </div>

      {/* Phase labels */}
      <div className="flex" style={{ gap: '2px' }}>
        {phases.map((phase, i) => (
          <div
            key={i}
            className="text-center text-[length:var(--doc-text-secondary)] text-[color:var(--gray-600)]"
            style={{ flex: phase.days }}
          >
            <div className="font-medium">{phase.label}</div>
            <div className="text-[color:var(--gray-400)]">{phase.days} 天</div>
          </div>
        ))}
      </div>

      {/* Bar segments */}
      <div className="flex rounded-[2px] overflow-hidden" style={{ height: '8px', gap: '1px' }}>
        {phases.map((phase, i) => (
          <div
            key={i}
            style={{
              flex: phase.days,
              backgroundColor: phase.color || PHASE_COLORS[i] || PHASE_COLORS[4],
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Day markers */}
      <div className="flex justify-between text-[length:var(--doc-text-fine)] text-[color:var(--gray-400)]">
        <span>Day 1</span>
        <span>Day {totalDays}</span>
      </div>

      {/* Calendar dates */}
      {(startDate || endDate) && (
        <div className="flex justify-between text-[length:var(--doc-text-secondary)] mt-[var(--sp-1)]">
          {startDate && (
            <span className="text-[color:var(--gray-600)]">
              開始: {startDate}
            </span>
          )}
          {endDate && (
            <span className="text-[color:var(--gray-900)] font-semibold">
              預計到貨: {endDate}
              {note && <span className="text-[color:var(--gray-400)] font-normal ml-[var(--sp-2)]">↑ {note}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default LeadTimeBar;
