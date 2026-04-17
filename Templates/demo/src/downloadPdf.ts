/**
 * downloadPdf — Shared utility for Puppeteer-based PDF generation
 *
 * Two modes:
 * 1. URL mode (static pages): Puppeteer opens the URL directly
 * 2. HTML mode (interactive pages): Extracts current DOM and sends to Puppeteer
 *
 * Falls back to window.print() if the PDF server is unavailable.
 */

// PDF server URL. Override via Vite env var VITE_PDF_SERVER for production
// deployments where pdf-server is hosted elsewhere (or behind a reverse proxy).
const PDF_SERVER =
  (import.meta.env.VITE_PDF_SERVER as string | undefined) || 'http://localhost:3001';

export interface DownloadPdfOptions {
  /** Override URL to render (default: current window.location.href) */
  url?: string;
  /** PDF filename without .pdf extension */
  filename?: string;
  /**
   * Use HTML mode: extract current page DOM and send to server.
   *
   * Default: true — captures exactly what's on screen (themed wrappers,
   * already-paginated atoms, loaded fonts). URL mode re-runs React from
   * scratch in Puppeteer, which suffers from hash-route/layout/font races
   * and can silently diverge from the live preview.
   *
   * Set false only if the page is truly static server-rendered HTML with
   * no client-only theming or pagination.
   */
  useHtmlMode?: boolean;
  /**
   * Pre-built raw HTML document to send directly to the Puppeteer server,
   * bypassing DOM extraction. Used when the preview is an iframe with a
   * self-contained HTML document (e.g. QC Package) where `.doc-page`
   * selectors in the parent DOM wouldn't find anything to extract.
   */
  rawHtml?: string;
}

/**
 * Find the nearest ancestor of `el` that carries a theme — i.e. one that
 * DEFINES CSS custom properties inline (e.g. `--color-primary: #141414`)
 * or is explicitly marked with `data-theme`.
 *
 * Critical subtlety: `style.cssText.includes('--')` matches any element that
 * USES a var() expression (e.g. `gap: var(--sp-8)`), which is wrong — those
 * are consumers, not theme providers. We must iterate `style[i]` property
 * names to find ones that actually start with `--`.
 */
function findThemeAncestor(el: Element): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    if (node.hasAttribute('data-theme')) return node;
    if (node.style && node.style.length > 0) {
      for (let i = 0; i < node.style.length; i++) {
        if (node.style[i].startsWith('--')) return node;
      }
    }
    node = node.parentElement;
  }
  return null;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Rewrite root-relative asset URLs (e.g. `/src/assets/foo.jpg` or Vite's
 * `/@fs/…` dev paths) to absolute URLs against the current origin so
 * Puppeteer (which receives the HTML with no base URL via `page.setContent`)
 * can fetch them.
 *
 * Two forms handled:
 *   1. `<img src="/…">`                — tag attribute
 *   2. `url(/…)` / `url("/…")` / `url('/…')` in inline style attributes
 *      — needed for `background-image` etc. (e.g. Traveler v2 part thumbnail)
 *
 * External `http://`/`https://`/`data:` URLs are left alone. `href` is skipped
 * to preserve link behaviour.
 */
function rewriteRelativeAssetUrls(html: string, origin: string): string {
  return html
    .replace(
      /<img\b([^>]*?)\ssrc="(\/[^"]*)"/g,
      (_m, pre: string, path: string) => `<img${pre} src="${origin}${path}"`,
    )
    .replace(
      /url\(\s*(['"]?)(\/[^'")\s]+)\1\s*\)/g,
      (_m, quote: string, path: string) => `url(${quote}${origin}${path}${quote})`,
    );
}

/**
 * Build a full HTML document from the current page's .doc-page elements.
 *
 * Critical invariants for WYSIWYG output:
 * 1. Exclude sandbox/measurement .doc-page (they live inside [data-sandbox]
 *    which gets stripped when extracted — otherwise ghost pages print).
 * 2. Preserve the FULL ancestor chain from theme wrapper down to .doc-page.
 *    Scoped CSS rules in themed variants often use intermediate selectors
 *    like `[data-theme] [data-comp="X"] *`. If we flatten the DOM during
 *    extraction and drop the `[data-comp]` wrapper, those selectors silently
 *    fail in the PDF even though they work on screen.
 *
 * Strategy: for each visible .doc-page, walk up to its theme ancestor; clone
 * the entire subtree from that ancestor (stripping sandboxes); emit once per
 * theme ancestor (grouping all pages under it). Pages with no theme ancestor
 * fall back to flat extraction.
 */
function buildHtmlFromDom(): string {
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML).join('\n');

  const pages = Array.from(document.querySelectorAll('.doc-page'))
    .filter(p => !p.closest('[data-sandbox]'));

  const origin = window.location.origin;

  // Group pages by theme ancestor. null = no theme (v2 style, flat pages).
  const seenThemes = new Set<HTMLElement>();
  const chunks: string[] = [];

  for (const page of pages) {
    const theme = findThemeAncestor(page);
    if (theme) {
      if (seenThemes.has(theme)) continue; // already emitted via earlier page
      seenThemes.add(theme);
      const clone = theme.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[data-sandbox]').forEach(s => s.remove());
      chunks.push(rewriteRelativeAssetUrls(clone.outerHTML, origin));
    } else {
      chunks.push(rewriteRelativeAssetUrls(page.outerHTML, origin));
    }
  }

  const pagesHtml = chunks.join('\n');

  const printCss = `
    <style>
      @media print {
        @page { size: A4; margin: 0; }
        body { margin: 0; }
      }
      .doc-page {
        width: 210mm;
        min-height: 297mm;
        display: flex;
        flex-direction: column;
        page-break-after: always;
        overflow: hidden;
      }
      .doc-page:last-child { page-break-after: auto; }
      .doc-content { flex: 1; }
      [data-sandbox] { display: none !important; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    </style>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Document</title>${styles}${printCss}</head><body>${pagesHtml}</body></html>`;
}

/** Trigger browser file download from a blob */
function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Download a PDF of the current page via the Puppeteer PDF server.
 * Returns true if successful, false if fell back to window.print().
 */
export async function downloadPdf(options: DownloadPdfOptions = {}): Promise<boolean> {
  const url = options.url || window.location.href;
  const filename = options.filename || document.title || 'document';
  const useHtmlMode = options.useHtmlMode ?? true;
  const rawHtml = options.rawHtml;

  try {
    // Check if PDF server is available
    const healthCheck = await fetch(`${PDF_SERVER}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!healthCheck.ok) throw new Error('PDF server not healthy');

    let res: Response;

    if (rawHtml) {
      // Raw HTML mode: send caller-provided document directly
      res = await fetch(`${PDF_SERVER}/api/pdf-from-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rawHtml, filename }),
      });
    } else if (useHtmlMode) {
      // HTML mode: extract DOM and POST to server
      const html = buildHtmlFromDom();
      res = await fetch(`${PDF_SERVER}/api/pdf-from-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename }),
      });
    } else {
      // URL mode: server opens the URL directly
      const pdfUrl = `${PDF_SERVER}/api/pdf?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      res = await fetch(pdfUrl);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    triggerDownload(await res.blob(), filename);
    return true;
  } catch (err) {
    console.warn('[downloadPdf] Puppeteer PDF server unavailable, falling back to print dialog:', err);
    fallbackPrint(rawHtml);
    return false;
  }
}

/** Fallback: open print dialog (original behavior) */
function fallbackPrint(rawHtml?: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = rawHtml ?? buildHtmlFromDom();
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
}
