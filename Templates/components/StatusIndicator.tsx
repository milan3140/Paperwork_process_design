/**
 * StatusIndicator — Dual-encoded status symbol for printed documents
 *
 * Renders a colored dot/symbol + text label, ensuring readability in both
 * color and B&W printing. Uses shape + color + text triple encoding.
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 *
 * | Name      | Type         | Required | Default | Description                          |
 * |-----------|--------------|----------|---------|--------------------------------------|
 * | status    | StatusType   | yes      | —       | Status key determining visual style  |
 * | showLabel | boolean      | no       | false   | Show text label beside symbol        |
 * | size      | number       | no       | 6       | Symbol diameter in px                |
 *
 * StatusType values:
 *   'quoted' | 'pending' | 'declined' | 'notStarted' | 'selected' |
 *   'riskLow' | 'riskMedium' | 'riskHigh' | 'complete' | 'incomplete'
 *
 * ─── Usage examples ────────────────────────────────────────────────────────
 *
 *   <StatusIndicator status="quoted" />
 *   <StatusIndicator status="declined" showLabel />
 *   <StatusIndicator status="riskLow" showLabel />
 */

const STATUS_CONFIG = {
  quoted:      { symbol: '●', label: '已報價',   color: 'var(--color-success)' },
  pending:     { symbol: '◐', label: '評估中',   color: 'var(--color-warning)' },
  declined:    { symbol: '⊘', label: '拒絕',     color: '#B61F1F' },
  notStarted:  { symbol: '○', label: '未開始',   color: 'var(--gray-400)' },
  selected:    { symbol: '✓', label: '選定',     color: 'var(--color-primary)' },
  riskLow:     { symbol: '●', label: '低',       color: 'var(--color-success)' },
  riskMedium:  { symbol: '◐', label: '中',       color: 'var(--color-warning)' },
  riskHigh:    { symbol: '▲', label: '高',       color: '#B61F1F' },
  riskNone:    { symbol: '●', label: '無',       color: 'var(--color-success)' },
  complete:    { symbol: '■', label: '完成',     color: 'var(--color-primary)' },
  incomplete:  { symbol: '□', label: '未完成',   color: 'var(--gray-300)' },
  accepted:    { symbol: '●', label: '已接受',   color: 'var(--color-success)' },
  waitingCustomer: { symbol: '◐', label: '等待客戶', color: 'var(--color-warning)' },
  info:        { symbol: '—', label: '告知',     color: 'var(--gray-400)' },
} as const;

export type StatusType = keyof typeof STATUS_CONFIG;

interface StatusIndicatorProps {
  status: StatusType;
  showLabel?: boolean;
  size?: number;
}

export function StatusIndicator({ status, showLabel = false, size = 6 }: StatusIndicatorProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      data-comp="StatusIndicator"
      className="inline-flex items-center gap-[var(--sp-1)] whitespace-nowrap"
    >
      <span
        style={{ color: cfg.color, fontSize: `${size + 2}px`, lineHeight: 1 }}
        aria-hidden="true"
      >
        {cfg.symbol}
      </span>
      {showLabel && (
        <span className="text-[length:var(--doc-text-secondary)] font-medium" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      )}
    </span>
  );
}

export default StatusIndicator;
