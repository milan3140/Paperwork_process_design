/**
 * TravelerDocument v3 — 工作單（標題整合版）
 *
 * 相對 v2 的結構變更：
 *   · 移除頂部彩色 HeaderBand
 *   · Logo + 艾維數位工業 右移至 "工作單" 標題同行右側
 *   · 第N頁/共M頁 置於 Logo 下方（右側 stack）
 *   · 交期 / 採購日期 / 採購單號 改為三欄橫式 grid，置於標題下方
 *
 * 設計意圖：去除頂部彩帶以讓內容區多出 ~56px 垂直空間；標題區整合
 * 所有身份資訊（文件類型、公司、頁次、關鍵日期），一眼可讀。
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
   樣式（沿用 v2）
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
  fontWeight: 400,
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

/**
 * 標題區 — 整合 v2 的 HeaderBand + TitleRow：
 *   · 左：工作單 / #ID_REV
 *   · 右上：[Logo] 艾維數位工業
 *   · 右下：第N頁 / 共M頁
 *   · 下緣 3 欄 grid：交期（紅） / 採購日期 / 採購單號
 */
function TitleSection({
  data,
  pageNum,
  totalPages,
}: {
  data: TravelerData;
  pageNum: number;
  totalPages: number;
}) {
  const subtitle = data.revision
    ? `#${data.travelerId}_REV-${data.revision}`
    : `#${data.travelerId}`;

  return (
    <div
      style={{
        paddingTop: 20,
        paddingBottom: 14,
        borderBottom: '1px solid var(--gray-300)',
      }}
    >
      {/* 上段：標題 + 右側品牌/頁次（items-end 讓 #REV 與頁碼底端對齊） */}
      <div className="flex justify-between items-end">
        {/* 左：工作單標題（黑） */}
        <div>
          <div
            className="font-bold tracking-[var(--doc-tracking-title)]"
            style={{ fontSize: 28, lineHeight: 1.05, color: '#000' }}
          >
            工作單
          </div>
          <div
            className="font-semibold mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]"
            style={{ fontSize: 22, lineHeight: 1.15, color: '#000', opacity: 0.85 }}
          >
            {subtitle}
          </div>
        </div>

        {/* 右：品牌 + 頁次 vertical stack（+4 放大；Logo 依比例 28→34） */}
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
        paddingTop: 6,
        paddingBottom: 14,
        borderBottom: '1px solid var(--gray-300)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${THUMB}px 1fr`,
          gap: 24,
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

        {/* 右側：訂單 meta（交期 / 採購日期 / 採購單號）— 直式排列 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            paddingTop: 4,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 400,
                color: 'var(--color-error)',
                letterSpacing: '0.06em',
                marginBottom: 3,
              }}
            >
              交期
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--color-error)',
                lineHeight: 1.15,
              }}
            >
              {data.dueDate}
            </div>
          </div>
          <div>
            <div style={KEY}>採購日期</div>
            <div style={VAL}>{data.issueDate}</div>
          </div>
          <div>
            <div style={KEY}>採購單號</div>
            <div style={VAL}>{data.poNumber}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecRow({ data }: { data: TravelerData }) {
  const part = data.part;
  const qty = data.totalQty;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 28 }}>
      {/* 工件 KV — 工件編號 / 數量 / 檔名 / 尺寸·重量 */}
      <section>
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={KEY}>工件編號</div>
            <div style={VAL_STRONG}>{part.partId}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={KEY}>數量</div>
            <div style={VAL_STRONG}>{qty} 件</div>
          </div>
          <div style={{ marginBottom: 12 }}>
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
      </section>

      {/* 材料 / 表面處理 */}
      <section>
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={KEY}>材料</div>
            <div style={VAL_STRONG}>{data.material}</div>
            {data.certifications && (
              <div style={{ ...VAL, color: '#000' }}>({data.certifications})</div>
            )}
          </div>
          <div>
            <div style={KEY}>表面處理</div>
            <div style={VAL}>{data.finish}</div>
          </div>
        </div>
      </section>

      {/* 加工要求 */}
      <section>
        <div>
          <div style={KEY}>加工要求</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
            {data.features.map((f, i) => (
              <li key={i} style={FEATURE_ITEM}>
                <span style={{ fontWeight: 400, color: '#000' }}>{f.tag}：</span>
                {f.value}
              </li>
            ))}
          </ul>
        </div>
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

export function TravelerDocumentV3({ data }: TravelerDocumentProps) {
  const authSlots = data.authSlots ?? ['加工操作', '品檢 QC', '出貨核准'];

  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageLayout[]>([{
    indices: [0, 1, 2, 3, 4, 5],
    spacerHeights: [SECTION_GAP, SECTION_GAP, SECTION_GAP, SECTION_GAP, SECTION_GAP],
  }]);

  /**
   * 標題區高度與 pageNum 無關（中文數字 1-10 寬度等同），可用 placeholder 量測。
   * 因此 sandbox 以 pageNum=1 + totalPages=pages.length 產生穩定高度。
   */
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

        /** Per-page section content — title 必須重算以注入當前 pageNum */
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

export default TravelerDocumentV3;
