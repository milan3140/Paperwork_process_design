/**
 * DemoIndex — Navigation page for document template previews
 *
 * Lists all available document demos with hash-based links.
 * Not a doc-page — uses its own lightweight layout.
 */

const routes = [
  { hash: '#/quote-builder-v5',  label: 'Quote Proposal Builder v5', desc: '報價方案產出器 v5 — (dev)' },
  { hash: '#/quote-builder-v4',  label: 'Quote Proposal Builder v4', desc: '報價方案產出器 v4' },
  { hash: '#/quote-builder-v2',  label: 'Quote Proposal Builder v2', desc: '報價方案產出器 v2 — Editable PDF Sections (Email + PDF)' },
  { hash: '#/quote-builder',    label: 'Quote Builder v1', desc: '報價產出器 v1 — Build & Preview Quotes (Email + PDF)' },
  { hash: '#/quote-builder-v0', label: 'Quote Builder v0', desc: '報價產出器 v0 — Snapshot 2026-03-26' },
  { hash: '#/quote',   label: 'Quote',   desc: '報價單 — Quotation' },
  { hash: '#/invoice', label: 'Invoice', desc: '請款單 — Invoice v1 (Net 30 + PIA variants)' },
  { hash: '#/invoice-v3', label: 'Invoice v3', desc: '請款單 — Invoice v3 (monochrome · Geist Sans · high-contrast, dev)' },
  { hash: '#/invoice-v2', label: 'Invoice v2', desc: '請款單 — Invoice v2 (table pricing layout)' },
  { hash: '#/receipt', label: 'Receipt', desc: '收據 — Payment Receipt (Full + Partial variants)' },
  { hash: '#/po', label: 'PO to Factory', desc: '採購單 — Purchase Order (代料/來料/轉包 3 variants)' },
  { hash: '#/summary', label: 'Summary', desc: '訂單摘要 — Summary (單頁內部用，品牌紫標題 · Geist Sans)' },
  { hash: '#/summary-sharp', label: 'Summary Sharp', desc: '訂單摘要 Sharp — 高對比純灰階 (90% 黑標題、無 260° 主題色 hue)' },
  { hash: '#/qc-package', label: 'QC Package', desc: 'QC 驗收包 — QC & Packing / Supplier Acceptance / Dimensional Inspection (3 pages)' },
  { hash: '#/qc-package-sharp', label: 'QC Package Sharp', desc: 'QC 驗收包 Sharp — 高對比純灰階 (90% 黑表頭、無 260° 主題色 hue、Inter 銳利字體)' },
  { hash: '#/traveler-v2', label: 'Traveler v2', desc: '工作單 v2 — 縮圖放大、工件橫式、材料/品質並排、字級 +3 (dev)' },
  { hash: '#/traveler-v2-sharp', label: 'Traveler v2 Sharp', desc: '工作單 v2 高對比版 — 90% 黑表頭、中性灰階、Geist 銳利字體 (dev)' },
  { hash: '#/traveler-v3', label: 'Traveler v3', desc: '工作單 v3 標題整合版 — 移除彩色表頭，Logo/頁次併入標題右側、meta 橫列 (dev)' },
  { hash: '#/traveler-v4', label: 'Traveler v4', desc: '工作單 v4 工廠動線優先 — 工件編號/檔名移至縮圖右側，與交期/PO 並列 (dev)' },
  { hash: '#/traveler', label: 'Traveler v1', desc: '工作單 v1 — 4 欄表格（訂單/工件/材料/品質）Snapshot' },
  { hash: '#/coc-v4',          label: 'CoC v4',          desc: '符合性聲明 — Certificate of Conformance v4 (dev)' },
  { hash: '#/coc-v3',          label: 'CoC v3',          desc: '符合性聲明 — Certificate of Conformance v3 — Snapshot' },
  { hash: '#/coc-v2',          label: 'CoC v2',          desc: '符合性聲明 — Certificate of Conformance v2 — Snapshot' },
  { hash: '#/coc',             label: 'CoC v1',          desc: '符合性聲明 — Certificate of Conformance v1 — Snapshot' },
  { hash: '#/packing-slip',    label: 'Packing Slip',    desc: '出貨單 — Packing Slip (current dev, tracks v4)' },
  { hash: '#/packing-slip-v13', label: 'Packing Slip v13', desc: '出貨單 — Packing Slip v13 (v12 + compound ID / filename 改用 Geist Sans，原為 monospace)' },
  { hash: '#/packing-slip-v12', label: 'Packing Slip v12', desc: '出貨單 — Packing Slip v12 (v11 + line item 完全去底色、加深框線)' },
  { hash: '#/packing-slip-v11', label: 'Packing Slip v11', desc: '出貨單 — Packing Slip v11 (v10 + Q3/Q4: parties 在 carrier 之前 · Page X/Y 移到 meta 區)' },
  { hash: '#/packing-slip-v10', label: 'Packing Slip v10', desc: '出貨單 — Packing Slip v10 (v9 + 全黑體字、僅 4 個 label 維持灰)' },
  { hash: '#/packing-slip-v9', label: 'Packing Slip v9', desc: '出貨單 — Packing Slip v9 (no header band, page header w/ Page X of Y, 11px meta/carrier)' },
  { hash: '#/packing-slip-v8', label: 'Packing Slip v8', desc: '出貨單 — Packing Slip v8 (v7 + mid-gray #595959 header, softer weight)' },
  { hash: '#/packing-slip-v7', label: 'Packing Slip v7', desc: '出貨單 — Packing Slip v7 (compressed card + tight pagination, 90% black header)' },
  { hash: '#/packing-slip-v6', label: 'Packing Slip v6', desc: '出貨單 — Packing Slip v6 (dims as right-column cell, square thumbnail)' },
  { hash: '#/packing-slip-v5', label: 'Packing Slip v5', desc: '出貨單 — Packing Slip v5 (doc checklist 0–3, dims below thumbnail)' },
  { hash: '#/packing-slip-v4', label: 'Packing Slip v4', desc: '出貨單 — Packing Slip v4 (neutral palette, 90% black, tighter header)' },
  { hash: '#/packing-slip-v3', label: 'Packing Slip v3', desc: '出貨單 — Packing Slip v3 — Snapshot (compound ID, per-part docs)' },
  { hash: '#/packing-slip-v2', label: 'Packing Slip v2', desc: '出貨單 — Packing Slip v2 — Snapshot (per-part cards)' },
  { hash: '#/packing-slip-v1', label: 'Packing Slip v1', desc: '出貨單 — Packing Slip v1 — Snapshot (flat table)' },
  { hash: '#/bom',     label: 'BOM',     desc: 'BOM 表 — Bill of Materials' },
  { hash: '#/factory-bom', label: 'Factory BOM', desc: '工廠報價用 RFQ BOM 表 (v3 — dev)' },
  { hash: '#/factory-bom-sharp', label: 'Factory BOM Sharp', desc: '工廠報價用 RFQ BOM 表 — 黑色高對比 + Geist 字體' },
  { hash: '#/factory-bom-dated', label: 'Factory BOM Dated', desc: '工廠報價用 RFQ BOM 表 — 艾維數位工業下方顯示發行日期' },
  { hash: '#/factory-bom-v2', label: 'Factory BOM v2', desc: '工廠報價用 RFQ BOM 表 v2 — Snapshot' },
  { hash: '#/factory-bom-v1', label: 'Factory BOM v1', desc: '工廠報價用 BOM 表 v1 — Snapshot' },
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
