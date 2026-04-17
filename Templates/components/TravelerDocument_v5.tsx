/**
 * TravelerDocument v5 — 隨工單（v3 snapshot + 2026-04 微調）
 *
 * 相對 v3 的主要微調（自 2026-04 迭代）：
 *   · 全文字色統一為 #000（VAL / FEATURE_ITEM / 備註 / 注意事項 / 簽核角色）
 *   · VAL_STRONG 修正為 700（v3/v4 曾漂移為 400）
 *   · 數量：從 Col1（工件 KV）遷至 Col2（材料群組）— 視為製造規格
 *   · 粗體欄位：數量 / 材料 / 表面處理（工件編號改為非粗體）
 *   · 副標尾端接 `partName`（如「#U26033148F_REV-1 噴火槍」）
 *   · 簽核區：['製作人員', '品檢人員', '出貨核准']（3 欄）
 *   · PartHeaderRow grid 改為 1fr 1fr 1.2fr，與 SpecRow 對齊（交期欄與數量欄左緣齊平）
 *   · 備註 / 注意事項 / 授權簽核 SECTION_LABEL 字級：9 → 11
 *
 * 仍沿用 v2 的量測分頁引擎（useLayoutEffect + computePageLayouts）。
 */

import React, { useState, useLayoutEffect, useRef } from 'react';
import { DocumentFooter } from './DocumentFooter';
import { PRINT_ICONS } from './Icons_Print';
import { computePageLayouts, type PageLayout, type SectionMeta } from './pagination';
import { ContinuedOnNextPage, ContinuedFromPreviousPage } from './ContinuationHints';
import type { TravelerData } from './TravelerDocument_v2';

export type { TravelerData, TravelerFeature, TravelerPart } from './TravelerDocument_v2';

interface TravelerDocumentProps {
  data: TravelerData;
}

/* ═══════════════════════════════════════════════════════════
   樣式（沿用 v2/v3）
   ═══════════════════════════════════════════════════════════ */

const KEY: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 400,
  color: 'var(--gray-500)',
  letterSpacing: '0.06em',
  marginBottom: 3,
};

const VAL: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: '#000',
  lineHeight: 1.45,
};

const VAL_STRONG: React.CSSProperties = {
  ...VAL,
  fontWeight: 700,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 400,
  color: 'var(--gray-500)',
  letterSpacing: '0.1em',
  paddingBottom: 3,
  borderBottom: '1px solid var(--gray-300)',
  marginBottom: 8,
};

const FEATURE_ITEM: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.55,
  color: '#000',
  marginBottom: 3,
};

const CN_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function toChineseNum(n: number): string {
  return n >= 0 && n <= 10 ? CN_DIGITS[n] : String(n);
}

/* ═══════════════════════════════════════════════════════════
   Sections
   ═══════════════════════════════════════════════════════════ */

function TitleSection({
  data,
  pageNum,
  totalPages,
}: {
  data: TravelerData;
  pageNum: number;
  totalPages: number;
}) {
  const base = data.revision
    ? `${data.travelerId}_REV-${data.revision}`
    : data.travelerId;
  const subtitle = data.part.partName ? `${base} ${data.part.partName}` : base;

  return (
    <div
      style={{
        paddingTop: 20,
        paddingBottom: 0,
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <div
            className="font-bold tracking-[var(--doc-tracking-title)]"
            style={{ fontSize: 28, lineHeight: 1.05, color: '#000' }}
          >
            隨工單
          </div>
          <div
            className="font-semibold mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]"
            style={{ fontSize: 22, lineHeight: 1.15, color: '#000', opacity: 0.85 }}
          >
            {subtitle}
          </div>
          <div style={{ marginTop: 14 }}>
            <span
              className="font-bold text-[color:var(--color-error)]"
              style={{ fontSize: 18, lineHeight: 1 }}
            >
              交期：{data.dueDate}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          <div
            className="flex items-center gap-[var(--sp-2)]"
            style={{ color: '#000' }}
          >
            {PRINT_ICONS.logo(34, 'currentColor')}
            <span className="font-bold" style={{ fontSize: 22, lineHeight: '34px' }}>
              艾維數位工業
            </span>
          </div>
          <div className="flex items-center gap-[var(--sp-2)]" style={{ color: '#000' }}>
            <span
              className="tracking-[var(--doc-tracking-doc-type)]"
              style={{ fontSize: 18, opacity: 0.9, fontWeight: 300 }}
            >
              第{toChineseNum(pageNum)}頁
            </span>
            <span style={{ fontSize: 18, opacity: 0.4, fontWeight: 300 }}>/</span>
            <span style={{ fontSize: 18, opacity: 0.7, fontWeight: 300 }}>
              共{toChineseNum(totalPages)}頁
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
              fontSize: 13,
              fontWeight: 400,
              color: '#8C8C8C',
              lineHeight: 1,
            }}
          >
            <div>{data.issueDate}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, letterSpacing: '0.06em' }}>採購單號</span>
              <span>{data.poNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartHeaderRow({ data }: { data: TravelerData }) {
  const THUMB = 180;
  const part = data.part;
  return (
    <section
      style={{
        paddingTop: 0,
        paddingBottom: 14,
        borderBottom: '1px solid var(--gray-300)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.2fr',
          gap: 28,
          alignItems: 'start',
        }}
      >
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
            fontWeight: 400,
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

        {/* 身份 meta（工件編號 / 檔名 / 尺寸·重量）— 直式排列；左緣對齊下方數量欄 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            paddingTop: 4,
          }}
        >
          <div>
            <div style={KEY}>工件編號</div>
            <div style={VAL}>{part.partId}</div>
          </div>
          <div>
            <div style={KEY}>檔名</div>
            <div style={VAL}>{part.fileName}</div>
            {part.drawingFile && (
              <div style={{ ...VAL, color: '#000' }}>{part.drawingFile}</div>
            )}
          </div>
          {(part.dims || part.unitWeight) && (
            <div>
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

function SpecRow({ data }: { data: TravelerData }) {
  const qty = data.totalQty;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingLeft: 20 }}>
      {/* 上排：數量 / 材料 / 表面處理 — 3 欄橫式平均，佔全寬 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>
        <section>
          <div style={KEY}>數量</div>
          <div style={VAL_STRONG}>{qty} 件</div>
        </section>
        <section style={{ paddingLeft: 5 }}>
          <div style={KEY}>材料</div>
          <div style={VAL_STRONG}>{data.material}</div>
          {data.certifications && (
            <div style={{ ...VAL, color: '#000' }}>({data.certifications})</div>
          )}
        </section>
        <section style={{ paddingLeft: 50 }}>
          <div style={KEY}>表面處理</div>
          <div style={VAL_STRONG}>{data.finish}</div>
        </section>
      </div>

      {/* 下排：加工要求 — 全寬 */}
      <section>
        <div style={KEY}>加工要求</div>
        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
          {data.features.map((f, i) => (
            <li key={i} style={FEATURE_ITEM}>
              <span style={{ fontWeight: 400, color: '#000' }}>{f.tag}：</span>
              {f.value}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function NotesSection({ notes }: { notes?: string }) {
  const hasContent = notes && notes.trim().length > 0;
  return (
    <section style={{ paddingTop: 20 }}>
      <div style={SECTION_LABEL}>備註</div>
      {hasContent ? (
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: '#000',
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
      <div style={{ fontSize: 10, lineHeight: 1.55, color: '#000' }}>
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
      <div style={{ ...SECTION_LABEL, borderBottom: 'none' }}>授權簽核</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${slots.length}, 1fr)`,
          gap: 18,
        }}
      >
        {slots.map((role, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ borderBottom: '1px solid #000', height: 80 }} />
            <div
              style={{
                fontSize: 11,
                color: '#000',
                letterSpacing: '0.06em',
                fontWeight: 400,
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
const SECTION_GAP = 12;

const SANDBOX_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: 'var(--doc-page-w, 210mm)',
  padding: '0 var(--doc-margin-x, 16mm)',
  visibility: 'hidden',
  fontFamily: `var(--font, ${DOC_FONT})`,
};

export function TravelerDocumentV5({ data }: TravelerDocumentProps) {
  const authSlots = data.authSlots ?? ['製作人員', '品檢人員', '出貨核准'];

  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageLayout[]>([{
    indices: [0, 1, 2, 3, 4, 5],
    spacerHeights: [SECTION_GAP, SECTION_GAP, SECTION_GAP, SECTION_GAP, SECTION_GAP],
  }]);

  const sections: { key: string; content: React.ReactNode }[] = [
    { key: 'title', content: <TitleSection data={data} pageNum={1} totalPages={pages.length} /> },
    { key: 'part', content: <PartHeaderRow data={data} /> },
    { key: 'spec', content: <SpecRow data={data} /> },
    { key: 'notes', content: <NotesSection notes={data.notes} /> },
    { key: 'disclaimers', content: <StandardDisclaimers /> },
    { key: 'auth', content: <AuthorizationStrip slots={authSlots} /> },
  ];

  const maxGap = SECTION_GAP * 2;

  useLayoutEffect(() => {
    if (!measureRef.current || sections.length === 0) return;
    const children = measureRef.current.children;
    const metas: SectionMeta[] = [];
    for (let i = 0; i < children.length; i++) {
      metas.push({ height: (children[i] as HTMLElement).offsetHeight });
    }
    const result = computePageLayouts(metas, maxGap);
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
      <div ref={measureRef} aria-hidden="true" data-sandbox style={SANDBOX_STYLE}>
        {sections.map(s => <div key={s.key}>{s.content}</div>)}
      </div>

      {pages.map((page, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === pages.length - 1;
        const pageNum = pageIdx + 1;

        const pageSections = sections.map((s, i) =>
          s.key === 'title'
            ? { key: s.key, content: <TitleSection data={data} pageNum={pageNum} totalPages={pages.length} /> }
            : sections[i]
        );

        return (
          <div
            key={pageIdx}
            className="doc-page"
            style={{
              fontFamily: `var(--font, ${DOC_FONT})`,
              marginBottom: !isLast ? '32px' : 0,
            }}
          >
            <div className="doc-content" style={{ gap: 0 }}>
              {isMultiPage && !isFirst && (
                <ContinuedFromPreviousPage page={pageNum} totalPages={pages.length} />
              )}

              {page.indices.map((sectionIdx, si) => {
                const section = pageSections[sectionIdx];
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

export default TravelerDocumentV5;
