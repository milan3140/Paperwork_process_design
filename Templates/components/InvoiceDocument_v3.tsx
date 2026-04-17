/**
 * InvoiceDocument_v3 — Monochrome high-contrast variant
 *
 * Same pagination engine and data model as InvoiceDocument (v2).
 * Wraps the base component in a themed scope that overrides CSS variables:
 *   - Primary color → near-black (~90% black), no hue
 *   - Grays repainted to pure neutral (Tailwind neutral palette) — 260 hue removed
 *   - Font family → Geist Sans
 *   - Sharpness: geometricPrecision text rendering, tighter tracking
 */

import React, { useEffect } from 'react';
import { InvoiceDocument, type InvoiceData } from './InvoiceDocument';
import { type PricingLayout } from './PartBlock';
import { PRINT_ICONS } from './Icons_Print';

interface InvoiceDocumentV3Props {
  data: InvoiceData;
  pricingLayout?: PricingLayout;
}

const GEIST_FONT_STACK =
  "'Geist', 'Noto Sans TC', 'PingFang TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const THEME_V3: React.CSSProperties = {
  /* Primary — pure black (all "blacks" unified to #000) */
  '--color-primary':          '#000000',
  '--color-primary-hover':    '#000000',
  '--color-primary-light':    '#000000',
  '--color-primary-subtle':   '#F2F2F2',
  '--color-primary-wash':     '#F7F7F7',
  '--color-primary-selected': '#EBEBEB',
  '--color-primary-dark':     '#000000',
  '--color-primary-muted':    '#999999',

  /* Neutral grays — hue-free. gray-900 = pure black for text/primary emphasis. */
  '--gray-950': '#000000',
  '--gray-900': '#000000',
  '--gray-800': '#262626',
  '--gray-700': '#404040',
  '--gray-600': '#525252',
  '--gray-500': '#737373',
  '--gray-400': '#525252', /* labels slightly darker for contrast */
  '--gray-300': '#A3A3A3',
  '--gray-250': '#B5B5B5',
  '--gray-200': '#A3A3A3', /* borders darker for crisper dividers */
  '--gray-175': '#D4D4D4',
  '--gray-160': '#E5E5E5',
  '--gray-150': '#BDBDBD', /* hairline dividers darker → sharper */
  '--gray-100': '#EDEDED',
  '--gray-75':  '#F2F2F2',
  '--gray-60':  '#F5F5F5',
  '--gray-50':  '#FAFAFA',

  /* Font */
  '--font': GEIST_FONT_STACK,

  /* Sharpness tuning */
  fontFamily: GEIST_FONT_STACK,
  textRendering: 'geometricPrecision' as const,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  letterSpacing: '-0.005em',
} as React.CSSProperties;

/** Inject Geist font from Google Fonts once per session */
function useGeistFont() {
  useEffect(() => {
    const id = 'geist-font-link';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

/**
 * v3-only overrides — scoped to [data-theme="invoice-v3"] so v2 is untouched.
 * Applied via a <style> element inside the wrapper so the same rules travel
 * with the DOM when extracted by downloadPdf.buildHtmlFromDom().
 *
 * Bumps (all +2px) and proportional thumbnail, plus removes bold on the
 * TotalsTable subtotal lines. `!important` is needed because several target
 * elements carry inline `fontSize` / `font-*` classes from the shared
 * InvoiceDocument/PartBlock components.
 */
const V3_SCOPED_CSS = `
  /* Token overrides scoped to v3 only */
  [data-theme="invoice-v3"] {
    --thumb-size: 72px;                 /* +20%, proportional to text bump */
    --doc-sp-part-y: 8px;               /* PartBlock py: 15 → 8 */
    --doc-sp-totals-y: 2px;             /* TotalsTable row py: 5 → 2 */
    --doc-sp-table-y: 4px;              /* NRE row py: 7 → 4 */
    --doc-w-totals: 320px;              /* Totals table width: 240 → 320 */
    --doc-content-pad-top: 40px;        /* 20 → 40: extra breathing room above "Invoice" title (no header band) */
  }

  /* Description column — only layout/color tweaks remain.
     Sizes handled by universal 12px reset below. */
  [data-theme="invoice-v3"] [data-el="PartBlock-dims"] {
    color: #000000 !important;
    margin-top: var(--doc-sp-half) !important;
  }

  /* "Invoiced Items (3 items)" header — undo InvoiceDocument's marginTop:-12
     so the flex gap above is the full 24px (doubled from 12). */
  [data-theme="invoice-v3"] [data-el="InvoiceDocument-itemsHeader"] {
    margin-top: 0 !important;
  }

  /* FROM party block — extra half-gap on top so space above is 1.5× the
     default flex gap (sp-4 = 16px → 16 + 8 = 24px). */
  [data-theme="invoice-v3"] [data-el="InvoiceDocument-from"] {
    margin-top: calc(var(--sp-4) * 0.5) !important;
  }

  /* DocumentMeta (DATE / QUOTE REF / …) — total space above DATE row.
     Base flex-gap is sp-3 (12px); adding 1.55×sp-3 (18.6px) → total 30.6px
     (= 0.85× of the prior 36px). */
  [data-theme="invoice-v3"] [data-el="InvoiceDocument-titleRow"] [data-comp="DocumentMeta"] {
    margin-top: calc(var(--sp-3) * 1.55) !important;
  }

  /* ═══ Universal size + weight resets with carved exceptions ═══
     Selectors deliberately avoid the [data-comp="InvoiceDocument"] intermediate
     because the PDF server flattens DOM during extraction and that wrapper
     is dropped. We only rely on [data-theme] (copied onto each page server
     side) and specific [data-el] markers that live inside pages.
     Base specificity (0,1,1); exceptions at (0,2,0) win. */

  /* 1. Base — everything 12px light */
  [data-theme="invoice-v3"] * {
    font-size: 12px !important;
    font-weight: 300 !important;
  }

  /* 2. Exception — "Invoice" title: 28px bold */
  [data-theme="invoice-v3"] [data-el="InvoiceDocument-title"] {
    font-size: 28px !important;
    font-weight: 700 !important;
  }

  /* 3. Exception — Invoice subtitle #INV-…: 22px regular, pure black */
  [data-theme="invoice-v3"] [data-el="InvoiceDocument-subtitle"] {
    font-size: 22px !important;
    font-weight: 400 !important;
    color: #000000 !important;
  }

  /* 4. Exception — Page indicator: 20px regular (includes descendant spans) */
  [data-theme="invoice-v3"] [data-el="InvoiceDocumentV3-pageIndicator"],
  [data-theme="invoice-v3"] [data-el="InvoiceDocumentV3-pageIndicator"] * {
    font-size: 20px !important;
    font-weight: 400 !important;
  }

  /* 5. Exception — Due Date value + Balance Due value: 16px bold */
  [data-theme="invoice-v3"] [data-el="DocumentMeta-value"].font-bold {
    font-size: 16px !important;
    font-weight: 700 !important;
  }

  /* 6. Exception — TotalsTable "Balance Due" row (label + amount): 12px bold */
  [data-theme="invoice-v3"] [data-el="TotalsTable-total"] td {
    font-size: 12px !important;
    font-weight: 700 !important;
  }

  /* 7. Labels / section headers / column headers → 10px uppercase.
     Covers: FROM / BILL TO / SHIP TO / INVOICED ITEMS / NRE / TERMS & CONDITIONS
     (via SectionLabel); DATE / QUOTE REF / … (DocumentMeta labels);
     QTY / UNIT PRICE / SUBTOTAL (items header row); NRE "SUBTOTAL" mini-label;
     and PartBlock inline "Note:" tag. */
  [data-theme="invoice-v3"] [data-comp="SectionLabel"],
  [data-theme="invoice-v3"] [data-el="DocumentMeta-label"],
  [data-theme="invoice-v3"] [data-el="InvoiceDocument-itemsHeader"] .grid > span,
  [data-theme="invoice-v3"] [data-comp="NRETable"] > div:first-child > span,
  [data-theme="invoice-v3"] [data-el="PartBlock-note"] > span:first-child {
    font-size: 10px !important;
  }

  /* DocumentMeta label → value gap 2.5× (8px → 20px) for ALL rows so
     every row stays aligned to the same label/value boundaries. */
  [data-theme="invoice-v3"] [data-comp="DocumentMeta"] {
    column-gap: calc(var(--sp-2) * 2.5) !important;
  }

  /* 8. PartBlock-id (e.g. "31_bkt_base_6061_cnc.stp") → 13px */
  [data-theme="invoice-v3"] [data-el="PartBlock-id"] {
    font-size: 13px !important;
  }

  /* 9. PartBlock pricing values (Qty / Unit Price / Subtotal numerics) → 12px */
  [data-theme="invoice-v3"] [data-el="PartBlock-pricing"] > div > span {
    font-size: 12px !important;
  }

  /* TotalsTable amount column — flush right + nowrap */
  [data-theme="invoice-v3"] [data-el="TotalsTable-line"] td:first-child,
  [data-theme="invoice-v3"] [data-el="TotalsTable-total"] td:first-child {
    white-space: nowrap;
  }
  /* Amount column flush right — drop the 8px right padding so the column
     aligns with NRE's "$350.00" (which sits at the content right edge). */
  [data-theme="invoice-v3"] [data-el="TotalsTable-line"] td:last-child,
  [data-theme="invoice-v3"] [data-el="TotalsTable-total"] td:last-child {
    padding-right: 0 !important;
  }
  /* TotalsTable — halve the atom gap above "Subtotal (Parts)" row (24 → 12) */
  [data-theme="invoice-v3"] [data-comp="TotalsTable"] {
    margin-top: calc(var(--doc-content-gap) * -0.5) !important;
  }
`;

export function InvoiceDocumentV3({ data, pricingLayout = 'table' }: InvoiceDocumentV3Props) {
  useGeistFont();
  return (
    <div data-theme="invoice-v3" style={THEME_V3}>
      <style>{V3_SCOPED_CSS}</style>
      <InvoiceDocument
        data={data}
        pricingLayout={pricingLayout}
        hideHeaderBand
        renderLogoAboveMeta={(totalPages) => (
          <div data-el="InvoiceDocumentV3-logoBlock" className="flex flex-col items-end gap-[var(--doc-sp-half)]">
            <div data-el="InvoiceDocumentV3-logo" style={{ lineHeight: 0 }}>
              {PRINT_ICONS.logoText(36, '#000000')}
            </div>
            <div
              data-el="InvoiceDocumentV3-pageIndicator"
              style={{ fontSize: 20, lineHeight: 1, fontWeight: 400 }}
              className="text-[color:var(--gray-900)]"
            >
              <span style={{ textTransform: 'uppercase', marginRight: '0.35em', letterSpacing: '0.04em' }}>Page</span>
              <span style={{ letterSpacing: '-0.04em' }}>1 of {totalPages}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}

export default InvoiceDocumentV3;
