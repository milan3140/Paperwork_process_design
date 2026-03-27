/**
 * DemoIndex — Navigation page for document template previews
 *
 * Lists all available document demos with hash-based links.
 * Not a doc-page — uses its own lightweight layout.
 */

const routes = [
  { hash: '#/quote-builder-v2',  label: 'Quote Proposal Builder v2', desc: '報價方案產出器 v2 — Editable PDF Sections (Email + PDF)' },
  { hash: '#/quote-builder',    label: 'Quote Builder v1', desc: '報價產出器 v1 — Build & Preview Quotes (Email + PDF)' },
  { hash: '#/quote-builder-v0', label: 'Quote Builder v0', desc: '報價產出器 v0 — Snapshot 2026-03-26' },
  { hash: '#/quote',   label: 'Quote',   desc: '報價單 — Quotation' },
  { hash: '#/bom',     label: 'BOM',     desc: 'BOM 表 — Bill of Materials' },
  { hash: '#/eval-v1', label: 'Eval v1', desc: '內部評估 v1 — McKinsey Pyramid (4 modes)' },
  { hash: '#/eval-v2', label: 'Eval v2', desc: '內部評估 v2 — 正式建單 (3 modes)' },
  { hash: '#/eval-v3', label: 'Eval v3', desc: '內部評估 v3 — 零件優先表格 (Part-first)' },
];

export default function DemoIndex() {
  return (
    <div style={{
      maxWidth: 520,
      margin: '80px auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: 'var(--gray-800)',
    }}>
      <h1 style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 600,
        color: 'var(--gray-900)',
        marginBottom: 'var(--sp-2)',
      }}>
        InstaVoxel Documents
      </h1>
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--gray-500)',
        marginBottom: 'var(--sp-8)',
        letterSpacing: '0.02em',
      }}>
        Template preview &amp; development
      </p>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {routes.map(r => (
          <a
            key={r.hash}
            href={r.hash}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--sp-3)',
              padding: 'var(--sp-3) 0',
              borderBottom: '1px solid var(--gray-150)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}
          >
            <span style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              minWidth: 64,
              flexShrink: 0,
            }}>
              {r.label}
            </span>
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--gray-500)',
            }}>
              {r.desc}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
}
