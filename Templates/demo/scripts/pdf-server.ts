/**
 * PDF Server — Express microservice for Puppeteer-based PDF generation
 *
 * Accepts a URL (typically localhost:5173/#/...) and generates a PDF
 * using Puppeteer with the system Chrome browser.
 *
 * Usage:
 *   npx tsx scripts/pdf-server.ts
 *   GET http://localhost:3001/api/pdf?url=http://localhost:5173/%23/invoice&filename=Invoice
 *
 * The server:
 * 1. Opens the URL in headless Chrome
 * 2. Waits for fonts to load
 * 3. Waits for [data-sandbox] elements to be hidden (pagination measurement complete)
 * 4. Generates A4 PDF with CSS page breaks
 * 5. Returns the PDF as a downloadable file
 */

import express from 'express';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const app = express();
const PORT = 3001;

// ── Chrome executable detection ──
const CHROME_PATHS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.CHROME_PATH,
].filter(Boolean) as string[];

function findChrome(): string {
  for (const p of CHROME_PATHS) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'Chrome not found. Set CHROME_PATH env variable or install Chrome.\n' +
    `Searched: ${CHROME_PATHS.join(', ')}`
  );
}

// ── Middleware ──
app.use(express.json({ limit: '10mb' }));
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', chrome: findChrome() });
});

// ── PDF generation endpoint ──
app.get('/api/pdf', async (req, res) => {
  const { url, filename = 'document' } = req.query as { url?: string; filename?: string };

  if (!url) {
    res.status(400).json({ error: 'Missing ?url= parameter' });
    return;
  }

  let browser;
  try {
    const chromePath = findChrome();
    console.log(`[pdf] Generating PDF for: ${url}`);
    const startTime = Date.now();

    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Disable HTTP cache so the puppeteer Chrome always gets the latest CSS/JS
    // from the dev server. Without this, edits to documents.css / components
    // are silently ignored on subsequent PDF generations.
    await page.setCacheEnabled(false);

    // A4 at 96dpi: 210mm × 297mm ≈ 794 × 1123 px
    // Must match documents.css (--doc-page-w: 210mm, --doc-page-h: 297mm)
    // and pagination.ts (PAGE_HEIGHT_PX = 1123). Mismatch → footer overflow.
    await page.setViewport({ width: 794, height: 1123 });

    // Navigate and wait for network idle (fonts, stylesheets loaded)
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for fonts to be ready
    await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });

    // Wait for pagination measurement to complete
    // PaginatedDocument and useDocumentPagination both use data-sandbox divs
    // that are hidden after measurement. Wait a tick for React state to settle.
    await page.waitForFunction(
      () => {
        // Check that at least one .doc-page exists
        const pages = document.querySelectorAll('.doc-page');
        return pages.length > 0;
      },
      { timeout: 10000 }
    );

    // Extra settle time for React re-renders after pagination measurement
    await new Promise(r => setTimeout(r, 500));

    // Strip demo wrapper — keep only .doc-page elements for PDF
    await page.evaluate(() => {
      // Remove sandbox/measurement divs FIRST (they contain empty .doc-page elements)
      document.querySelectorAll('[data-sandbox]').forEach(el => el.remove());
      // Now collect only the real .doc-page elements
      const pages = Array.from(document.querySelectorAll('.doc-page')) as HTMLElement[];

      // Preserve CSS custom properties (`--*`) declared on ancestor wrappers.
      // Some components still use the legacy pattern:
      //   <div style={PALETTE_WITH_CUSTOM_PROPS}>
      //     <PaginatedDocument ... />   ← produces .doc-page inside
      //   </div>
      // When we flatten .doc-page to body, the wrapper is discarded, so any
      // palette inherited via CSS custom properties would fall back to :root.
      // Walk the ancestor chain of each .doc-page and copy custom properties
      // (and custom properties ONLY) onto the page itself. Whitelist `--*` so
      // we never copy layout/font/size properties that could distort layout
      // (past bug: copying `alignItems: center` collapsed the header band).
      pages.forEach(p => {
        let el: HTMLElement | null = p.parentElement;
        while (el && el !== document.body) {
          const style = el.style;
          for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            if (!prop.startsWith('--')) continue;
            // Closest ancestor wins: skip if the page (or a closer ancestor
            // already walked) has set this property.
            if (!p.style.getPropertyValue(prop)) {
              p.style.setProperty(
                prop,
                style.getPropertyValue(prop),
                style.getPropertyPriority(prop)
              );
            }
          }
          el = el.parentElement;
        }
      });

      // Inject print-specific overrides BEFORE restructuring DOM.
      //
      // Paper size: A4 (210 × 297 mm) — must match the React component's
      //   --doc-page-w / --doc-page-h tokens (documents.css) and pagination.ts
      //   PAGE_HEIGHT_PX = 1123. Mismatch → footer overflow / missing content.
      //
      // text-autospace: Chrome 121+ auto-inserts 1/4em ideographic space at every
      //   CJK↔Latin boundary. This produces visible gaps around half-width parens
      //   in Chinese text like "日 (三)". Forcing "no-autospace" disables it.
      const style = document.createElement('style');
      style.textContent = `
        @page { size: 210mm 297mm; margin: 0 !important; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        /* Fixed-height page box. Critical for PDF output: using min-height
         * allowed .doc-page to grow past 297mm on marginal overflows, causing
         * Chrome to page-break the single .doc-page into two physical pages
         * (e.g. Summary bar clipped at the boundary, footer orphaned on page 2).
         * A fixed height + overflow:hidden on .doc-content forces any excess
         * to be clipped inside the content area, keeping header/footer pinned. */
        body > .doc-page {
          width: 210mm;
          height: 297mm;
          margin: 0;
          overflow: hidden;
          page-break-after: always;
        }
        body > .doc-page:last-child {
          page-break-after: auto;
        }
        /* Cap doc-content to its flex share (header + footer are shrink-0).
         * min-height: 0 allows it to shrink below its intrinsic content height;
         * overflow: hidden clips any remaining excess so footer stays visible. */
        body > .doc-page > .doc-content {
          min-height: 0;
          overflow: hidden;
        }
        * {
          text-autospace: no-autospace;
          -webkit-text-autospace: no-autospace;
          text-spacing-trim: space-all;
        }
      `;
      document.head.appendChild(style);

      // Replace entire body with only doc pages
      document.body.innerHTML = '';
      document.body.className = '';
      pages.forEach(p => document.body.appendChild(p));
    });

    // Generate PDF — explicit A4 dimensions matching documents.css / pagination.ts
    const pdf = await page.pdf({
      width: '210mm',
      height: '297mm',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const elapsed = Date.now() - startTime;
    console.log(`[pdf] Done in ${elapsed}ms, ${(pdf.length / 1024).toFixed(0)}KB`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('[pdf] Error:', err);
    res.status(500).json({ error: String(err) });
  } finally {
    if (browser) await browser.close();
  }
});

// ── PDF from HTML content (for dynamic/interactive pages) ──
app.post('/api/pdf-from-html', async (req, res) => {
  const { html, filename = 'document' } = req.body as { html?: string; filename?: string };

  if (!html) {
    res.status(400).json({ error: 'Missing html in request body' });
    return;
  }

  let browser;
  try {
    const chromePath = findChrome();
    console.log(`[pdf] Generating PDF from HTML content (${(html.length / 1024).toFixed(0)}KB)`);
    const startTime = Date.now();

    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });

    // Set content with base URL for relative asset loading
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
    await new Promise(r => setTimeout(r, 300));

    // Restructure the body so the page container elements become the direct
    // children of body, and inject a print-safety CSS block.
    // Mirrors what `/api/pdf` does after page.goto, but discovers both
    // `.doc-page` (React convention) and `.page` (standalone HTML docs like
    // QCPackage.html). Without this step Puppeteer's print paginator can
    // silently emit a blank first page when the body has non-page siblings
    // or ancestor styles that affect print flow (body { background }, etc).
    const pageStats = await page.evaluate(() => {
      const docPages = Array.from(document.querySelectorAll('.doc-page')) as HTMLElement[];
      const rawPages = Array.from(document.querySelectorAll('.page')) as HTMLElement[];
      const pages = docPages.length > 0 ? docPages : rawPages;

      // Preserve CSS custom properties (`--*`) from ancestor chain onto each
      // page BEFORE we flatten the DOM. Without this, scoped themes like v3
      // monochrome (wrapped in [data-theme="invoice-v3"] with --color-primary
      // override) lose their tokens when the wrapper is discarded.
      // Mirror of /api/pdf's logic (URL mode already did this).
      pages.forEach(p => {
        let el: HTMLElement | null = p.parentElement;
        while (el && el !== document.body) {
          const st = el.style;
          for (let i = 0; i < st.length; i++) {
            const prop = st[i];
            if (!prop.startsWith('--')) continue;
            if (!p.style.getPropertyValue(prop)) {
              p.style.setProperty(prop, st.getPropertyValue(prop), st.getPropertyPriority(prop));
            }
          }
          el = el.parentElement;
        }
      });

      // Preserve all <style> elements currently in the body (e.g. scoped
      // CSS injected by theme wrappers via <style>{V3_SCOPED_CSS}</style>).
      // They would otherwise be lost when we clear body.innerHTML.
      const bodyStyles = Array.from(document.body.querySelectorAll('style')) as HTMLStyleElement[];

      // Also copy data-theme attribute from the outermost themed ancestor
      // onto each page, so scoped selectors like
      //   [data-theme="invoice-v3"] [data-comp="InvoiceDocument"] *
      // still match after flattening. (The [data-comp] wrapper lives inside
      // the theme wrapper and survives appendChild of its child pages.)
      pages.forEach(p => {
        let el: HTMLElement | null = p.parentElement;
        while (el && el !== document.body) {
          if (el.hasAttribute('data-theme') && !p.hasAttribute('data-theme')) {
            p.setAttribute('data-theme', el.getAttribute('data-theme')!);
            break;
          }
          el = el.parentElement;
        }
      });

      const style = document.createElement('style');
      style.textContent = `
        @page { size: 210mm 297mm; margin: 0 !important; }
        html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
        body > .doc-page, body > .page {
          width: 210mm !important;
          height: 297mm !important;
          margin: 0 !important;
          overflow: hidden;
          page-break-after: always;
          box-shadow: none !important;
        }
        body > .doc-page:last-child, body > .page:last-child { page-break-after: auto; }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `;
      document.head.appendChild(style);

      if (pages.length > 0) {
        document.body.innerHTML = '';
        document.body.className = '';
        // Re-attach preserved <style> blocks first, then the pages.
        bodyStyles.forEach(s => document.body.appendChild(s));
        pages.forEach(p => document.body.appendChild(p));
      }

      return { docPage: docPages.length, raw: rawPages.length, used: pages.length };
    });

    console.log(`[pdf]   pages found: .doc-page=${pageStats.docPage}, .page=${pageStats.raw}, restructured=${pageStats.used}`);

    const pdf = await page.pdf({
      width: '210mm',
      height: '297mm',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const elapsed = Date.now() - startTime;
    console.log(`[pdf] Done in ${elapsed}ms, ${(pdf.length / 1024).toFixed(0)}KB`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('[pdf] Error:', err);
    res.status(500).json({ error: String(err) });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`[pdf] PDF server listening on http://localhost:${PORT}`);
  console.log(`[pdf] Chrome: ${findChrome()}`);
  console.log(`[pdf] Endpoint: GET /api/pdf?url=...&filename=...`);
});
