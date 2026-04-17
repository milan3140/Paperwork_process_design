/**
 * TravelerDocument — 工作單 (Shop Traveler)
 *
 * 採用專案通用的表頭表尾（DocumentHeader / DocumentFooter）與
 * 右上 DocumentMeta 佈局，與 Quotation / Invoice 等其他文件一致。
 * 內容區維持灰階（去除品牌色），層次靠分欄、留白、粗細呈現。
 *
 * 結構：
 *   1. DocumentHeader（紫色品牌帶）
 *   2. 標題列：工作單 + #編號_REV-x   +   DocumentMeta（右側）
 *   3. 3D 縮圖
 *   4. 4 欄識別表：訂單 · 工件 · 材料 · 品質（表面 / 檢測 / 特徵）
 *   5. 備註（使用者自由填寫）
 *   6. 注意事項（艾維通用條款 · 固定）
 *   7. 授權簽核（4 格簽名）
 *   8. DocumentFooter
 *
 * ⚠️ REQUIRES: Design_Sys_style.css, documents.css, DocumentHeader,
 *   DocumentFooter, DocumentMeta
 */

import React from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DocumentFooter } from './DocumentFooter';
import { DocumentMeta, type MetaItem } from './DocumentMeta';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface TravelerFeature {
  /** 特徵標籤 — 例如「公差」「螺紋」 */
  tag: string;
  /** 描述文字 */
  value: string;
}

export interface TravelerPart {
  /** 複合工件編號 — 例如 "U26033148F_P01" */
  partId: string;
  /** 模型檔名 */
  fileName: string;
  /** 圖紙版次 */
  drawingRev?: string;
  /** 3D 預覽縮圖 URL */
  thumbnail?: string;
  /** 尺寸字串 — 例如「482 × 55 × 26 mm」 */
  dims?: string;
  /** 單件重量 — 例如「2.58 kg」 */
  unitWeight?: string;
}

export interface TravelerData {
  /** 工作單編號（主識別） */
  travelerId: string;
  /** 版次標記 — 例如 "A" 會顯示為 _REV-A */
  revision?: string;
  /** 簽發日期字串 */
  issueDate: string;
  /** 交期字串 */
  dueDate: string;

  /** 採購單號 */
  poNumber: string;
  /** 對內聯絡窗口（Email） */
  contactEmail: string;

  /** 總數量 */
  totalQty: number;
  /** 檢測要求敘述 */
  inspectionLevel: string;
  /** 認證需求敘述 */
  certifications: string;

  material: string;
  finish: string;

  part: TravelerPart;

  features: TravelerFeature[];

  /** 備註（使用者自由填寫 · 多行）。留空則顯示手寫橫線。 */
  notes?: string;

  /** 授權簽核欄位名稱；預設 4 欄 */
  authSlots?: string[];
}

interface TravelerDocumentProps {
  data: TravelerData;
}

/* ═══════════════════════════════════════════════════════════
   樣式常數
   ═══════════════════════════════════════════════════════════ */

const COL_HEADER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.12em',
  color: 'var(--gray-900)',
  padding: '7px 12px',
  background: 'var(--gray-100)',
  textAlign: 'center',
  borderRight: '1px solid var(--gray-300)',
  borderBottom: '2px solid var(--gray-400)',
};

const KEY: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 600,
  color: 'var(--gray-500)',
  letterSpacing: '0.06em',
  marginBottom: 2,
};

const VAL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--gray-900)',
  lineHeight: 1.4,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: 'var(--gray-500)',
  letterSpacing: '0.1em',
  paddingBottom: 4,
  borderBottom: '1px solid var(--gray-300)',
  marginBottom: 10,
};

/* ═══════════════════════════════════════════════════════════
   Sections
   ═══════════════════════════════════════════════════════════ */

function TitleRow({ data }: { data: TravelerData }) {
  const meta: MetaItem[] = [
    { label: '簽發日期', value: data.issueDate },
    { label: '交期',     value: data.dueDate },
    { label: '採購單號', value: data.poNumber },
  ];
  const subtitle =
    data.revision ? `#${data.travelerId}_REV-${data.revision}` : `#${data.travelerId}`;

  return (
    <div className="flex justify-between items-start">
      <div>
        <div
          className="text-[length:var(--doc-text-title)] font-bold text-[color:var(--color-primary)] tracking-[var(--doc-tracking-title)]"
        >
          工作單
        </div>
        <div
          className="text-[length:var(--doc-text-subtitle)] font-semibold text-[color:var(--gray-400)] mt-[var(--doc-sp-half)] tracking-[var(--doc-tracking-title)]"
        >
          {subtitle}
        </div>
      </div>
      <DocumentMeta items={meta} />
    </div>
  );
}

function ThumbnailRow({ part }: { part: TravelerPart }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-block',
          width: 140,
          height: 92,
          background: part.thumbnail
            ? `url(${part.thumbnail}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--gray-75) 0%, var(--gray-150) 100%)',
          border: '1px solid var(--gray-200)',
          color: 'var(--gray-400)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          lineHeight: '92px',
        }}
      >
        {!part.thumbnail && '3D'}
      </div>
    </div>
  );
}

function KV({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={KEY}>{k}</div>
      <div style={VAL}>{children}</div>
    </div>
  );
}

/** 4 欄識別表：訂單 / 工件 / 材料 / 品質（表面 · 檢測 · 特徵） */
function IdentificationTable({ data }: { data: TravelerData }) {
  const cell: React.CSSProperties = {
    padding: '12px 14px',
    borderRight: '1px solid var(--gray-300)',
    verticalAlign: 'top',
  };
  const lastCell: React.CSSProperties = { ...cell, borderRight: 'none' };
  const lastHeader: React.CSSProperties = { ...COL_HEADER, borderRight: 'none' };

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid var(--gray-400)',
        tableLayout: 'fixed',
      }}
    >
      <colgroup>
        <col style={{ width: '22%' }} />
        <col style={{ width: '24%' }} />
        <col style={{ width: '22%' }} />
        <col style={{ width: '32%' }} />
      </colgroup>
      <thead>
        <tr>
          <th style={COL_HEADER}>訂單</th>
          <th style={COL_HEADER}>工件</th>
          <th style={COL_HEADER}>材料</th>
          <th style={lastHeader}>品質</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          {/* 訂單 */}
          <td style={cell}>
            <KV k="採購單號">{data.poNumber}</KV>
            <KV k="交期">{data.dueDate}</KV>
            <KV k="聯絡窗口">{data.contactEmail}</KV>
          </td>

          {/* 工件 */}
          <td style={cell}>
            <KV k="工件編號">{data.part.partId}</KV>
            <KV k="檔名">
              {data.part.fileName}
              {data.part.drawingRev && (
                <span style={{ color: 'var(--gray-500)', fontSize: 10 }}>
                  {' '}· 圖紙 Rev {data.part.drawingRev}
                </span>
              )}
            </KV>
            <KV k="數量">{data.totalQty} 件</KV>
            {(data.part.dims || data.part.unitWeight) && (
              <KV k="尺寸 · 重量">
                {[data.part.dims, data.part.unitWeight].filter(Boolean).join(' · ')}
              </KV>
            )}
          </td>

          {/* 材料 */}
          <td style={cell}>
            <KV k="材料">{data.material}</KV>
            <KV k="認證需求">{data.certifications}</KV>
          </td>

          {/* 品質：表面 + 檢測 + 特徵 */}
          <td style={lastCell}>
            <KV k="表面處理">{data.finish}</KV>
            <KV k="檢測要求">{data.inspectionLevel}</KV>
            <div>
              <div style={KEY}>特徵</div>
              <ul style={{ listStyle: 'disc', paddingLeft: 16, margin: 0 }}>
                {data.features.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 10.5,
                      lineHeight: 1.5,
                      color: 'var(--gray-800)',
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{f.tag}：</span>
                    {f.value}
                  </li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** 備註 — 自由填寫多行。空值顯示 3 條手寫橫線。 */
function NotesSection({ notes }: { notes?: string }) {
  const hasContent = notes && notes.trim().length > 0;
  return (
    <section>
      <div style={SECTION_LABEL}>備註</div>
      {hasContent ? (
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.65,
            color: 'var(--gray-800)',
            whiteSpace: 'pre-line',
            minHeight: 50,
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

/** 注意事項 — 艾維通用條款（固定文字，不逐單重打） */
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
          lineHeight: 1.75,
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
            <div style={{ borderBottom: '1px solid var(--gray-900)', height: 110 }} />
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

export function TravelerDocument({ data }: TravelerDocumentProps) {
  const authSlots = data.authSlots ?? ['建單 PM', '工程審核', '品檢覆核', '品檢主管核准'];

  return (
    <div className="doc-page" style={{ fontFamily: "'Inter', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif" }}>
      <DocumentHeader docType="Shop Traveler" />

      <div className="doc-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
        <TitleRow data={data} />
        <ThumbnailRow part={data.part} />
        <IdentificationTable data={data} />
        <NotesSection notes={data.notes} />
        <StandardDisclaimers />
        <AuthorizationStrip slots={authSlots} />
      </div>

      <DocumentFooter docId={data.travelerId} page={1} totalPages={1} />
    </div>
  );
}

export default TravelerDocument;
