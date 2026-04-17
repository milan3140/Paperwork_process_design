/**
 * DemoIndex — Navigation for document template previews
 *
 * Two sections:
 *   1. Current — the picked official version per document type
 *   2. Archive — historical iterations + document types with no official pick yet
 *      Each group is collapsed by default; click the group header to expand.
 *
 * Order follows Templates/Design_Src_Pics_Specs/Order_Workflow_Paths.html (path A workflow):
 *   Invoice → Traveler → Factory BOM → Summary → QC Package → Packing Slip → CoC
 * Archive keeps the same workflow-order grouping, with upstream tools
 * (Quote Proposal Builder) + internal-only items (Eval) at the ends.
 */

import { useState } from 'react';

type Route = { hash: string; label: string; desc: string; badge?: 'new' };
type Group = { title: string; routes: Route[] };

const current: Route[] = [
  { hash: '#/invoice-v3',        label: 'Invoice (v3)',        desc: '請款單 — monochrome · Geist Sans · high-contrast' },
  { hash: '#/traveler-v3',       label: 'Traveler (v3)',       desc: '隨工單 — 標題整合版，Logo/頁次併入標題右側' },
  { hash: '#/traveler-v5',       label: 'Traveler (v5)',       desc: '隨工單 v3 snapshot + 2026-04 微調（粗體值、製造欄群組、partName 副標、3 欄簽核）', badge: 'new' },
  { hash: '#/factory-bom-dated',     label: 'Factory BOM (dated)',          desc: '工廠報價用 RFQ BOM — 艾維數位工業下方顯示發行日期' },
  { hash: '#/factory-bom-date-only', label: 'Factory BOM (date-only)', desc: '工廠報價用 RFQ BOM — replyDeadline 不帶「2026 年」字樣（如「4 月 7 日（週二）下午 4 點前」）', badge: 'new' },
  { hash: '#/summary-sharp',     label: 'Summary (sharp)',     desc: '訂單摘要（含 QC 空表）— 高對比純灰階' },
  { hash: '#/qc-package-sharp',  label: 'QC Package (sharp)',  desc: 'QC 驗收包 — 高對比純灰階，Inter 銳利字體' },
  { hash: '#/packing-slip-v13',  label: 'Packing Slip (v13)',  desc: '出貨單 — compound ID / filename 改用 Geist Sans' },
  { hash: '#/coc-v4',            label: 'CoC (v4)',            desc: '符合性聲明 — Certificate of Conformance' },
];

const archiveGroups: Group[] = [
  {
    title: 'Quote Proposal Builder',
    routes: [
      { hash: '#/quote-builder-v5', label: 'v5', desc: '報價方案產出器 v5 — (dev)' },
      { hash: '#/quote-builder-v4', label: 'v4', desc: '報價方案產出器 v4' },
      { hash: '#/quote-builder-v3', label: 'v3', desc: '報價方案產出器 v3' },
      { hash: '#/quote-builder-v2', label: 'v2', desc: '報價方案產出器 v2 — Editable PDF Sections' },
      { hash: '#/quote-builder',    label: 'v1', desc: '報價產出器 v1 — Build & Preview (Email + PDF)' },
      { hash: '#/quote-builder-v0', label: 'v0', desc: '報價產出器 v0 — Snapshot 2026-03-26' },
    ],
  },
  {
    title: 'BOM',
    routes: [
      { hash: '#/bom', label: 'base', desc: 'BOM 表 — Bill of Materials' },
    ],
  },
  {
    title: 'Quotation',
    routes: [
      { hash: '#/quote', label: 'base', desc: '報價單 — Quotation' },
    ],
  },
  {
    title: 'Invoice',
    routes: [
      { hash: '#/invoice-v2', label: 'v2', desc: '請款單 — table pricing layout' },
      { hash: '#/invoice',    label: 'v1', desc: '請款單 — Net 30 + PIA variants' },
    ],
  },
  {
    title: 'Traveler',
    routes: [
      { hash: '#/traveler-v4',       label: 'v4',       desc: '隨工單 — 工廠動線優先，工件編號併入縮圖右側' },
      { hash: '#/traveler-v2-sharp', label: 'v2 sharp', desc: '隨工單 v2 高對比版 — 90% 黑表頭、Geist 銳利字體' },
      { hash: '#/traveler-v2',       label: 'v2',       desc: '隨工單 v2 — 縮圖放大、工件橫式、材料/品質並排' },
      { hash: '#/traveler',          label: 'v1',       desc: '隨工單 v1 — 4 欄表格（訂單/工件/材料/品質）' },
    ],
  },
  {
    title: 'Factory BOM',
    routes: [
      { hash: '#/factory-bom-sharp', label: 'sharp', desc: '工廠報價用 RFQ BOM — 黑色高對比 + Geist 字體' },
      { hash: '#/factory-bom-v2',    label: 'v2',    desc: '工廠報價用 RFQ BOM 表 v2 — Snapshot' },
      { hash: '#/factory-bom-v1',    label: 'v1',    desc: '工廠報價用 BOM 表 v1 — Snapshot' },
      { hash: '#/factory-bom',       label: 'base',  desc: '工廠報價用 RFQ BOM 表 (v3 — dev)' },
    ],
  },
  {
    title: 'PO',
    routes: [
      { hash: '#/po', label: 'base', desc: '採購單 — Purchase Order (代料/來料/轉包 3 variants)' },
    ],
  },
  {
    title: 'Summary',
    routes: [
      { hash: '#/summary', label: 'base', desc: '訂單摘要 — 品牌紫標題 · Geist Sans' },
    ],
  },
  {
    title: 'QC Package',
    routes: [
      { hash: '#/qc-package', label: 'base', desc: 'QC 驗收包 — QC & Packing / Supplier Acceptance / Dimensional Inspection' },
    ],
  },
  {
    title: 'Packing Slip',
    routes: [
      { hash: '#/packing-slip-v12', label: 'v12',  desc: 'v11 + line item 完全去底色、加深框線' },
      { hash: '#/packing-slip-v11', label: 'v11',  desc: 'v10 + parties 在 carrier 之前 · Page X/Y 移到 meta 區' },
      { hash: '#/packing-slip-v10', label: 'v10',  desc: 'v9 + 全黑體字、僅 4 個 label 維持灰' },
      { hash: '#/packing-slip-v9',  label: 'v9',   desc: 'no header band, page header w/ Page X of Y' },
      { hash: '#/packing-slip-v8',  label: 'v8',   desc: 'v7 + mid-gray #595959 header, softer weight' },
      { hash: '#/packing-slip-v7',  label: 'v7',   desc: 'compressed card + tight pagination, 90% black header' },
      { hash: '#/packing-slip-v6',  label: 'v6',   desc: 'dims as right-column cell, square thumbnail' },
      { hash: '#/packing-slip-v5',  label: 'v5',   desc: 'doc checklist 0–3, dims below thumbnail' },
      { hash: '#/packing-slip-v4',  label: 'v4',   desc: 'neutral palette, 90% black, tighter header' },
      { hash: '#/packing-slip-v3',  label: 'v3',   desc: 'compound ID, per-part docs' },
      { hash: '#/packing-slip-v2',  label: 'v2',   desc: 'per-part cards' },
      { hash: '#/packing-slip-v1',  label: 'v1',   desc: 'flat table' },
      { hash: '#/packing-slip',     label: 'base', desc: 'current dev (tracks v4)' },
    ],
  },
  {
    title: 'CoC',
    routes: [
      { hash: '#/coc-v3', label: 'v3', desc: '符合性聲明 v3 — Snapshot' },
      { hash: '#/coc-v2', label: 'v2', desc: '符合性聲明 v2 — Snapshot' },
      { hash: '#/coc',    label: 'v1', desc: '符合性聲明 v1 — Snapshot' },
    ],
  },
  {
    title: 'Receipt',
    routes: [
      { hash: '#/receipt', label: 'base', desc: '收據 — Payment Receipt (Full + Partial variants)' },
    ],
  },
  {
    title: 'Eval (internal)',
    routes: [
      { hash: '#/eval-v3', label: 'v3', desc: '內部評估 v3 — 零件優先表格' },
      { hash: '#/eval-v2', label: 'v2', desc: '內部評估 v2 — 正式建單 (3 modes)' },
      { hash: '#/eval-v1', label: 'v1', desc: '內部評估 v1 — McKinsey Pyramid' },
    ],
  },
];

/* ── shared row (Current + Archive sub-item) ───────────────────────────── */

function RouteLink({ r, dim = false }: { r: Route; dim?: boolean }) {
  return (
    <a
      href={r.hash}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--sp-3)',
        padding: `var(--sp-2) var(--sp-3)`,
        paddingLeft: dim ? 'var(--sp-6)' : 'var(--sp-3)',
        margin: '0 calc(var(--sp-3) * -1)',
        borderRadius: '4px',
        borderBottom: dim ? 'none' : '1px solid var(--gray-150)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background-color 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-primary-wash)';
        e.currentTarget.style.color = 'var(--color-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'inherit';
      }}
    >
      <span style={{
        fontSize: 'var(--text-sm)',
        fontWeight: dim ? 400 : 600,
        minWidth: dim ? 84 : 140,
        flexShrink: 0,
        color: dim ? 'var(--gray-600)' : 'inherit',
      }}>
        {r.label}
        {r.badge === 'new' && (
          <span style={{
            display: 'inline-block',
            marginLeft: 6,
            padding: '1px 6px',
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            fontSize: '10px',
            fontWeight: 600,
            borderRadius: 3,
            letterSpacing: '0.04em',
            verticalAlign: '1px',
          }}>new</span>
        )}
      </span>
      <span style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--gray-500)',
      }}>
        {r.desc}
      </span>
    </a>
  );
}

/* ── Collapsible archive group ─────────────────────────────────────────── */

function ArchiveGroup({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-2)',
          width: '100%',
          padding: `var(--sp-2) var(--sp-3)`,
          margin: '0 calc(var(--sp-3) * -1)',
          border: 'none',
          background: 'transparent',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--gray-700)',
          fontFamily: 'inherit',
          textAlign: 'left',
          transition: 'background-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-wash)';
          e.currentTarget.style.color = 'var(--color-primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--gray-700)';
        }}
        aria-expanded={open}
      >
        <span style={{
          fontSize: '10px',
          color: 'var(--gray-400)',
          transition: 'transform 0.15s',
          display: 'inline-block',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          width: 8,
        }}>▶</span>
        <span>{group.title}</span>
        <span style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 400,
          color: 'var(--gray-400)',
          marginLeft: 'auto',
        }}>
          {group.routes.length} 版
        </span>
      </button>
      {open && (
        <nav style={{ display: 'flex', flexDirection: 'column', paddingBottom: 'var(--sp-2)' }}>
          {group.routes.map(r => <RouteLink key={r.hash} r={r} dim />)}
        </nav>
      )}
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

const sectionHeadingStyle = {
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--gray-500)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginTop: 'var(--sp-8)',
  marginBottom: 'var(--sp-3)',
  borderBottom: '1px solid var(--gray-200)',
  paddingBottom: 'var(--sp-2)',
};

export default function DemoIndex() {
  return (
    <div style={{
      maxWidth: 720,
      margin: '80px auto',
      padding: '0 var(--sp-6)',
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
        marginBottom: 'var(--sp-4)',
        letterSpacing: '0.02em',
      }}>
        Template preview &amp; development · 工作流順序依 Order_Workflow_Paths.html
      </p>

      <h2 style={sectionHeadingStyle}>Current 正式版</h2>
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {current.map(r => <RouteLink key={r.hash} r={r} />)}
      </nav>

      <h2 style={sectionHeadingStyle}>Archive 歷史版本與未採用</h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {archiveGroups.map(g => <ArchiveGroup key={g.title} group={g} />)}
      </div>
    </div>
  );
}
