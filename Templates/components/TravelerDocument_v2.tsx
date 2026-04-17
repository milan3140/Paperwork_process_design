/**
 * TravelerDocument v2 — 隨工單（新版佈局）
 *
 * 相對 v1 的變更：
 *   · 移除「訂單」欄（PO / Due / Contact 已呈現於右上 DocumentMeta）
 *   · 「工件」資訊改為橫式，與放大後的 3D 縮圖同列（頂部工件區）
 *   · 圖紙改以 "U26033148F_P01.PDF" 命名，置於 .step 檔名下一行
 *   · 「材料」「品質」不再用表格；改以備註區段格式左右並排
 *   · 內容字級統一加大 3px
 *
 * 結構：
 *   1. DocumentHeader
 *   2. 標題列 + DocumentMeta
 *   3. 工件區（縮圖 + 橫式規格）
 *   4. 規格列（材料 / 品質 左右兩區，Notes 樣式）
 *   5. 備註（使用者自由填寫）
 *   6. 注意事項（固定條款）
 *   7. 授權簽核
 *   8. DocumentFooter
 */

import React, { useState, useLayoutEffect, useRef } from 'react';
import { DocumentFooter } from './DocumentFooter';
import { PRINT_ICONS } from './Icons_Print';
import { computePageLayouts, type PageLayout, type SectionMeta } from './pagination';
import { ContinuedOnNextPage, ContinuedFromPreviousPage } from './ContinuationHints';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface TravelerFeature {
  tag: string;
  value: string;
}

export interface TravelerPart {
  partId: string;
  /** 模型檔名（.step / .sldprt 等） */
  fileName: string;
  /** 工件中文名稱 — 顯示於標題副標尾端，例如 "噴火槍" */
  partName?: string;
  /** 圖紙 PDF 檔名 — 例如 "U26033148F_P01.PDF" */
  drawingFile?: string;
  thumbnail?: string;
  dims?: string;
  unitWeight?: string;
}

export interface TravelerData {
  travelerId: string;
  revision?: string;
  issueDate: string;
  dueDate: string;

  poNumber: string;
  contactEmail: string;

  totalQty: number;
  inspectionLevel: string;
  certifications: string;

  material: string;
  finish: string;

  part: TravelerPart;

  features: TravelerFeature[];

  notes?: string;

  authSlots?: string[];
}

interface TravelerDocumentProps {
  data: TravelerData;
}

/* ═══════════════════════════════════════════════════════════
   樣式（字級 +3px vs v1）
   ═══════════════════════════════════════════════════════════ */

const KEY: React.CSSProperties = {
  fontSize: 11,           // v1: 8
  fontWeight: 600,
  color: 'var(--gray-500)',
  letterSpacing: '0.06em',
  marginBottom: 3,
};

const VAL: React.CSSProperties = {
  fontSize: 14,           // v1: 11
  fontWeight: 500,
  color: 'var(--gray-900)',
  lineHeight: 1.45,
};

const VAL_STRONG: React.CSSProperties = {
  ...VAL,
  fontWeight: 700,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: 'var(--gray-500)',
  letterSpacing: '0.1em',
  paddingBottom: 3,
  borderBottom: '1px solid var(--gray-300)',
  marginBottom: 8,
};

const FEATURE_ITEM: React.CSSProperties = {
  fontSize: 13.5,         // v1: 10.5
  lineHeight: 1.55,
  color: 'var(--gray-800)',
  marginBottom: 3,
};

/* ═══════════════════════════════════════════════════════════
   Sections
   ═══════════════════════════════════════════════════════════ */

/**
 * 表頭紫色品牌帶 — 仿 FactoryBomDocument 的 HeaderBand。
 * 左：圓形 logo + 中文公司名；右：文件類型（中文）+ 簽發日期
 */
const CN_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function toChineseNum(n: number): string {
  return n >= 0 && n <= 10 ? CN_DIGITS[n] : String(n);
}

function HeaderBand({ pageNum, totalPages }: { pageNum: number; totalPages: number }) {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: 'var(--doc-header-h)',
        padding: '0 var(--doc-margin-x)',
        background: 'var(--doc-header-bg, var(--color-primary))',
        color: 'var(--doc-header-fg, white)',
        borderBottom: 'var(--doc-header-border, 0 solid transparent)',
      }}
    >
      <div className="flex items-center gap-[var(--sp-2)]">
        {PRINT_ICONS.logo(28, 'currentColor')}
        <span className="font-bold" style={{ fontSize: 18, lineHeight: '28px' }}>
          艾維數位工業
        </span>
      </div>
      <div className="flex items-center gap-[var(--sp-2)]">
        <span
          className="font-semibold tracking-[var(--doc-tracking-doc-type)]"
          style={{ fontSize: 14, opacity: 0.85 }}
        >
          第{toChineseNum(pageNum)}頁
        </span>
        <span style={{ fontSize: 14, opacity: 0.5 }}>/</span>
        <span
          className="font-normal"
          style={{ fontSize: 14, opacity: 0.6 }}
        >
          共{toChineseNum(totalPages)}頁
        </span>
      </div>
    </div>
  );
}

function TitleRow({ data }: { data: TravelerData }) {
  const subtitle =
    data.revision ? `#${data.travelerId}_REV-${data.revision}` : `#${data.travelerId}`;

  // Custom meta grid — 交期置頂、放大紅字；其他照常
  const LABEL_STYLE: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--gray-400)',
    letterSpacing: '0.06em',
    textAlign: 'right',
    alignSelf: 'center',
  };
  const VALUE_STYLE: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--gray-900)',
    textAlign: 'right',
  };

  return (
    <div className="flex justify-between items-start">
      <div>
        <div
          className="font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]"
          style={{ fontSize: 28, lineHeight: 1.05 }}
        >
          隨工單
        </div>
        <div
          className="font-semibold text-[color:var(--color-primary)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]"
          style={{ fontSize: 22, lineHeight: 1.15, opacity: 0.85 }}
        >
          {subtitle}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: 'var(--sp-6)',
          rowGap: 'var(--sp-1)',
          alignItems: 'center',
        }}
      >
        {/* 交期 — 標籤與值皆紅色 18px，置頂 */}
        <span
          style={{
            ...LABEL_STYLE,
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-error)',
            letterSpacing: '0.04em',
          }}
        >
          交期
        </span>
        <span
          style={{
            ...VALUE_STYLE,
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-error)',
            lineHeight: 1.15,
          }}
        >
          {data.dueDate}
        </span>

        <span style={LABEL_STYLE}>簽發日期</span>
        <span style={VALUE_STYLE}>{data.issueDate}</span>

        <span style={LABEL_STYLE}>採購單號</span>
        <span style={VALUE_STYLE}>{data.poNumber}</span>
      </div>
    </div>
  );
}

/**
 * 工件區 — 縮圖 + 橫式規格並排。
 * 縮圖放大；右側 KV stack 展示工件編號 / 檔名(含圖紙 PDF) / 數量 / 尺寸重量。
 */
function PartHeaderRow({ part, qty }: { part: TravelerPart; qty: number }) {
  const THUMB = 180; // 放大後的縮圖尺寸

  return (
    <section>
      <div style={{ borderTop: '1px solid var(--gray-300)', marginBottom: 12 }} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${THUMB}px 1fr`,
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* 縮圖（正方形，配合右側橫式資訊高度） */}
        <div
          style={{
            width: THUMB,
            height: THUMB,
            background: part.thumbnail
              ? undefined
              : 'linear-gradient(135deg, var(--gray-75) 0%, var(--gray-150) 100%)',
            border: '1px solid var(--gray-200)',
            color: 'var(--gray-400)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {part.thumbnail ? (
            <img
              src={part.thumbnail}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            '3D'
          )}
        </div>

        {/* 右側橫式 KV */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            rowGap: 10,
            columnGap: 28,
            paddingTop: 4,
          }}
        >
          <div>
            <div style={KEY}>工件編號</div>
            <div style={VAL_STRONG}>{part.partId}</div>
          </div>
          <div>
            <div style={KEY}>數量</div>
            <div style={VAL_STRONG}>{qty} 件</div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <div style={KEY}>檔名</div>
            <div style={VAL}>{part.fileName}</div>
            {part.drawingFile && (
              <div style={{ ...VAL, color: 'var(--gray-700)' }}>{part.drawingFile}</div>
            )}
          </div>

          {(part.dims || part.unitWeight) && (
            <div style={{ gridColumn: 'span 2' }}>
              <div style={KEY}>尺寸 · 重量</div>
              <div style={VAL}>
                {[part.dims, part.unitWeight].filter(Boolean).join('  ·  ')}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * 規格列 — 材料 + 品質，使用備註區段格式（section label + underline + 內容）
 * 左右並排於同一行。
 */
function SpecRow({ data }: { data: TravelerData }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      {/* 材料 */}
      <section>
        <div style={SECTION_LABEL}>材料</div>
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={KEY}>材料</div>
            <div style={VAL_STRONG}>{data.material}</div>
          </div>
          <div>
            <div style={KEY}>認證需求</div>
            <div style={VAL}>{data.certifications}</div>
          </div>
        </div>
      </section>

      {/* 品質 */}
      <section>
        <div style={SECTION_LABEL}>品質</div>
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={KEY}>表面處理</div>
            <div style={VAL}>{data.finish}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={KEY}>檢測要求</div>
            <div style={VAL}>{data.inspectionLevel}</div>
          </div>
          <div>
            <div style={KEY}>特徵</div>
            <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: 0 }}>
              {data.features.map((f, i) => (
                <li key={i} style={FEATURE_ITEM}>
                  <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{f.tag}：</span>
                  {f.value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function NotesSection({ notes }: { notes?: string }) {
  const hasContent = notes && notes.trim().length > 0;
  return (
    <section>
      <div style={SECTION_LABEL}>備註</div>
      {hasContent ? (
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--gray-800)',
            whiteSpace: 'pre-line',
            minHeight: 40,
          }}
        >
          {notes}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ borderBottom: '1px solid var(--gray-200)', height: 14 }} />
          ))}
        </div>
      )}
    </section>
  );
}

function StandardDisclaimers() {
  const items = [
    '對於所有小於 305 mm 的尺寸，若圖紙上沒有明確指定的公差（或未提供 PDF 圖紙），則適用預設標準公差 ±0.127 mm。',
    '若圖紙或訂單 PO 沒有特別指定，所有螺紋的預設標準為 2A / 2B（美規）或 6g / 6H（公規）。',
    '除非有專門說明，所有鋒利邊緣均要去毛邊（尺寸 0.25–0.75 mm，R 角或 C 角皆可）。成品不可割手。',
    '所有工件加工完成後要立即清潔，成品不可有任何氧化變黑痕跡。關於清潔方式如有疑問請與艾維聯繫。',
    '本單所列交期天數均以工作天計算。若需改以日曆天報價，請於備註欄明確標示，或逕洽艾維確認。',
  ];
  return (
    <section>
      <div style={SECTION_LABEL}>注意事項</div>
      <div
        style={{
          fontSize: 10,
          lineHeight: 1.55,
          color: 'var(--gray-700)',
        }}
      >
        {items.map((t, i) => (
          <div key={i} style={{ marginBottom: 2 }}>{t}</div>
        ))}
      </div>
    </section>
  );
}

function AuthorizationStrip({ slots }: { slots: string[] }) {
  return (
    <section>
      <div style={SECTION_LABEL}>授權簽核</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${slots.length}, 1fr)`,
          gap: 18,
        }}
      >
        {slots.map((role, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ borderBottom: '1px solid var(--gray-900)', height: 80 }} />
            <div
              style={{
                fontSize: 9,
                color: 'var(--gray-600)',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {role}
            </div>
            <div style={{ fontSize: 8, color: 'var(--gray-400)' }}>姓名 · 日期</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════ */

const DOC_FONT = "'Inter', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif";
const SECTION_GAP = 12; // halved from 24 for tighter vertical rhythm

const SANDBOX_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: 'var(--doc-page-w, 210mm)',
  padding: '0 var(--doc-margin-x, 16mm)',
  visibility: 'hidden',
  fontFamily: `var(--font, ${DOC_FONT})`,
};

export function TravelerDocumentV2({ data }: TravelerDocumentProps) {
  const authSlots = data.authSlots ?? ['建單 PM', '工程審核', '品檢覆核', '品檢主管核准'];

  /* ── Section descriptors ─────────────────────────────────────────
   * Each section is measured independently in the sandbox, then the
   * pagination engine greedily packs them into A4 pages. */
  const sections: { key: string; content: React.ReactNode }[] = [
    { key: 'title', content: <TitleRow data={data} /> },
    { key: 'part', content: <PartHeaderRow part={data.part} qty={data.totalQty} /> },
    { key: 'spec', content: <SpecRow data={data} /> },
    { key: 'notes', content: <NotesSection notes={data.notes} /> },
    { key: 'disclaimers', content: <StandardDisclaimers /> },
    { key: 'auth', content: <AuthorizationStrip slots={authSlots} /> },
  ];

  const measureRef = useRef<HTMLDivElement>(null);
  const maxGap = SECTION_GAP * 2;

  const notesIdx = sections.findIndex(s => s.key === 'notes');

  /** Halve the spacer immediately above the 備註 section on whichever page contains it. */
  const tightenNotesGap = (layout: PageLayout[]): PageLayout[] =>
    layout.map(page => {
      const pos = page.indices.indexOf(notesIdx);
      if (pos <= 0) return page;
      const next = [...page.spacerHeights];
      next[pos - 1] = Math.round(next[pos - 1] / 2);
      return { ...page, spacerHeights: next };
    });

  const defaultLayout: PageLayout[] = tightenNotesGap([{
    indices: sections.map((_, i) => i),
    spacerHeights: sections.slice(1).map(() => SECTION_GAP),
  }]);

  const [pages, setPages] = useState<PageLayout[]>(defaultLayout);

  useLayoutEffect(() => {
    if (!measureRef.current || sections.length === 0) return;
    const children = measureRef.current.children;
    const metas: SectionMeta[] = [];
    for (let i = 0; i < children.length; i++) {
      metas.push({ height: (children[i] as HTMLElement).offsetHeight });
    }
    const result = tightenNotesGap(computePageLayouts(metas, maxGap));
    setPages(prev => {
      if (prev.length !== result.length) return result;
      const same = prev.every((p, i) =>
        p.indices.length === result[i].indices.length &&
        p.indices.every((v, j) => v === result[i].indices[j]) &&
        p.spacerHeights.length === result[i].spacerHeights.length &&
        p.spacerHeights.every((v, j) => v === result[i].spacerHeights[j])
      );
      return same ? prev : result;
    });
  });

  const isMultiPage = pages.length > 1;

  return (
    <>
      {/* Hidden measurement sandbox — mirrors content layout so heights match real render */}
      <div ref={measureRef} aria-hidden="true" data-sandbox style={SANDBOX_STYLE}>
        {sections.map(s => <div key={s.key}>{s.content}</div>)}
      </div>

      {/* Paginated output */}
      {pages.map((page, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === pages.length - 1;
        const pageNum = pageIdx + 1;

        return (
          <div
            key={pageIdx}
            className="doc-page"
            style={{
              fontFamily: `var(--font, ${DOC_FONT})`,
              marginBottom: !isLast ? '32px' : 0,
            }}
          >
            <HeaderBand pageNum={pageNum} totalPages={pages.length} />

            <div className="doc-content" style={{ gap: 0 }}>
              {isMultiPage && !isFirst && (
                <ContinuedFromPreviousPage page={pageNum} totalPages={pages.length} />
              )}

              {page.indices.map((sectionIdx, si) => {
                const section = sections[sectionIdx];
                if (!section) return null;
                return (
                  <div key={section.key}>
                    {si > 0 && (
                      <div style={{ height: `${page.spacerHeights[si - 1] ?? SECTION_GAP}px` }} />
                    )}
                    {section.content}
                  </div>
                );
              })}

              {isMultiPage && !isLast && (
                <ContinuedOnNextPage page={pageNum} totalPages={pages.length} />
              )}
            </div>

            <DocumentFooter
              docId={data.travelerId}
              page={pageNum}
              totalPages={pages.length}
            />
          </div>
        );
      })}
    </>
  );
}

export default TravelerDocumentV2;
